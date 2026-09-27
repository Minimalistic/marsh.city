// Renders the sitewide social share card (public/og-default.jpg, 1200×630).
//
// Usage: node scripts/og-card.mjs
//
// The card is plain HTML screenshotted by headless Chrome — same approach as
// resume-pdf.mjs, so real web fonts and CSS with no image-compositing deps.
// Re-run whenever the foliage art or tagline changes; the JPEG is committed.

import { writeFileSync, rmSync, existsSync, mkdtempSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir, homedir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outJpg = join(root, 'public/og-default.jpg');
const foliage = pathToFileURL(join(root, 'public/footer-foliage@2x.webp')).href;

const WIDTH = 1200;
const HEIGHT = 630;

// Colors mirror the light-theme tokens in src/styles/global.css.
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lora:wght@500;600&family=Inter:wght@400;500&family=JetBrains+Mono:wght@500&display=swap">
<style>
  html, body { margin: 0; width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; }
  body {
    background: radial-gradient(ellipse at 50% 30%, #f0ecda 0%, #e8e6d2 55%, #ddd9c2 100%);
    font-family: Inter, sans-serif;
    color: #243626;
    position: relative;
  }
  .foliage {
    position: absolute;
    inset: 0;
    background: url(${foliage}) center bottom / 1260px auto no-repeat;
  }
  .text {
    position: absolute;
    top: 92px;
    left: 0;
    right: 0;
    text-align: center;
  }
  .domain {
    font-family: 'JetBrains Mono', monospace;
    font-weight: 500;
    font-size: 26px;
    letter-spacing: 0.04em;
    color: #2d5016;
  }
  h1 {
    font-family: Lora, serif;
    font-weight: 600;
    font-size: 96px;
    line-height: 1;
    margin: 18px 0 22px;
    letter-spacing: -0.01em;
  }
  .tagline {
    font-size: 27px;
    color: #44574a;
    line-height: 1.4;
  }
</style>
</head>
<body>
  <div class="foliage"></div>
  <div class="text">
    <div class="domain">marsh.city</div>
    <h1>Jason Marsh</h1>
    <div class="tagline">Director of Technology · Assistive technology<br>Projects, writing &amp; experiments</div>
  </div>
</body>
</html>`;

// Prefer Playwright's chrome-headless-shell (fast, no keychain stalls);
// fall back to system Chrome. Same lookup as resume-pdf.mjs.
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

const workDir = mkdtempSync(join(tmpdir(), 'og-card-'));
const tmpHtml = join(workDir, 'card.html');
const tmpPng = join(workDir, 'card.png');
writeFileSync(tmpHtml, html);
try {
  execFileSync(chrome, [
    '--headless',
    '--disable-gpu',
    `--user-data-dir=${join(workDir, 'profile')}`,
    '--use-mock-keychain',
    '--hide-scrollbars',
    `--window-size=${WIDTH},${HEIGHT}`,
    // let web fonts load before the snapshot, capped so a stuck fetch can't hang
    '--virtual-time-budget=15000',
    '--timeout=30000',
    `--screenshot=${tmpPng}`,
    pathToFileURL(tmpHtml).href,
  ], { stdio: 'pipe', timeout: 60_000 });
  // JPEG keeps the card well under the ~300KB some messengers (WhatsApp)
  // silently cap previews at; the raw painted-foliage PNG is ~1.1MB.
  await sharp(tmpPng).jpeg({ quality: 82, mozjpeg: true }).toFile(outJpg);
} finally {
  rmSync(workDir, { recursive: true, force: true });
}
console.log(`wrote ${outJpg}`);
