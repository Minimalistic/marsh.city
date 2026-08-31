#!/usr/bin/env node
// Generate a resume PDF from the canonical data (src/data/resume.json),
// optionally shaped by a per-job variant config. Variants are presentation
// only — summary override, section/bullet reorder, bullet include/exclude —
// the facts always come from the canonical file.
//
//   node scripts/resume-pdf.mjs                          # canonical resume
//   node scripts/resume-pdf.mjs --config path/to/job.json [--out dir]
//
// Variant config (all keys optional):
//   {
//     "name": "ima-enablement",            // -> marsh-resume-ima-enablement.pdf
//     "summary": "override text",
//     "sectionOrder": ["projects", "experience", "skills", "education"],
//     "projects":   { "order": [ids...], "exclude": [ids...] },
//     "experience": { "order": [role ids...], "exclude": [role ids...],
//                     "roles": { "<roleId>": { "order": [...], "exclude": [...] } } },
//     "skills":     { "relabel": { "<canonical label>": "<variant label>" } }
//   }
// Ids live in src/data/resume.json. Keep job configs out of this public repo
// (they live in the private JobSearch repo).
//
// Rendering: same renderer + CSS as the public /resume page, printed with
// headless Chrome so the PDF matches the site's print output exactly.

import { readFileSync, writeFileSync, rmSync, existsSync, mkdtempSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir, homedir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { renderResume, applyVariant } from '../src/lib/resume-html.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const args = process.argv.slice(2);
function argValue(flag) {
  const i = args.indexOf(flag);
  return i === -1 ? undefined : args[i + 1];
}
const configPath = argValue('--config');
const outDir = argValue('--out') ?? (configPath ? dirname(resolve(configPath)) : process.cwd());

const data = JSON.parse(readFileSync(join(root, 'src/data/resume.json'), 'utf8'));
const config = configPath ? JSON.parse(readFileSync(configPath, 'utf8')) : {};
const variant = applyVariant(data, config);

const globalCss = readFileSync(join(root, 'src/styles/global.css'), 'utf8');
const resumeCss = readFileSync(join(root, 'src/styles/resume.css'), 'utf8');

// Same skeleton Base.astro renders (body > .layout > main); print CSS hides
// the site chrome, so only the shared fonts link and stylesheets are needed.
let html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Resume — ${variant.name}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap">
<style>${globalCss}</style>
<style>${resumeCss}</style>
</head>
<body>
<div class="layout">
<main id="main">
${renderResume(variant)}
</main>
</div>
</body>
</html>`;

// Root-relative asset URLs (/qr.svg) don't resolve over file:// — point them
// at the repo's public/ dir.
html = html.replaceAll('src="/', `src="${pathToFileURL(join(root, 'public')).href}/`);

const suffix = config.name ? `-${config.name}` : '';
const outPdf = join(resolve(outDir), `marsh-resume${suffix}.pdf`);
const tmpHtml = join(tmpdir(), `marsh-resume${suffix}.html`);
writeFileSync(tmpHtml, html);

// Prefer Playwright's chrome-headless-shell when installed: purpose-built
// for this, prints in ~2s where full Chrome headless can stall for minutes
// on keychain/display access. Fall back to system Chrome.
function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const pw = join(homedir(), 'Library/Caches/ms-playwright');
  if (existsSync(pw)) {
    const shells = readdirSync(pw)
      .filter((d) => d.startsWith('chromium_headless_shell-'))
      .sort()
      .reverse()
      .map((d) => join(pw, d, 'chrome-headless-shell-mac-arm64/chrome-headless-shell'))
      .filter(existsSync);
    if (shells.length) return shells[0];
  }
  return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
}
const chrome = findChrome();
if (!existsSync(chrome)) {
  console.error(`Chrome not found at ${chrome} — set CHROME_PATH`);
  process.exit(1);
}

// fresh throwaway profile per run — a reused dir can hold a stale
// SingletonLock from an interrupted run and hang Chrome at startup
const profileDir = mkdtempSync(join(tmpdir(), 'resume-pdf-'));
try {
  execFileSync(chrome, [
    '--headless',
    '--disable-gpu',
    `--user-data-dir=${profileDir}`,
    // a fresh profile has no Safe Storage entry; without this Chrome can
    // block for minutes on macOS keychain access
    '--use-mock-keychain',
    '--no-pdf-header-footer',
    // let web fonts finish loading before Chrome snapshots the page,
    // with a hard cap so a stuck network fetch can't hang the run
    '--virtual-time-budget=15000',
    '--timeout=30000',
    `--print-to-pdf=${outPdf}`,
    pathToFileURL(tmpHtml).href,
  ], { stdio: 'pipe', timeout: 60_000 });
} finally {
  rmSync(tmpHtml);
  rmSync(profileDir, { recursive: true, force: true });
}

// crude page count: Chrome writes page objects uncompressed
const pages = (readFileSync(outPdf, 'latin1').match(/\/Type \/Page\b(?!s)/g) || []).length;
console.log(`${outPdf}${pages ? ` (${pages} page${pages === 1 ? '' : 's'})` : ''}`);
