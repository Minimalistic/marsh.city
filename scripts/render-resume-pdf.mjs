#!/usr/bin/env node
// Renders the built /resume page to a PDF via headless Chromium, with
// browser headers/footers (URL, date, page numbers) disabled and
// backgrounds on — the same output as the on-page "Save as PDF" button,
// minus anything the browser print dialog would stamp on it.
//
// Usage:
//   npm run resume:pdf                 -> resume.pdf (default summary)
//   npm run resume:pdf -- --variant eng -> resume-eng.pdf (engineering summary)
//   Options: --out <file>  --skip-build (reuse existing dist/)
//
// Chromium is located via CHROME_PATH, the Playwright browsers dir, or
// common install paths — no browser download is triggered.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execSync, spawnSync } from 'node:child_process';
import { extname, join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
};
const variant = flag('--variant');
const out = flag('--out') ?? join(root, variant ? `resume-${variant}.pdf` : 'resume.pdf');
const skipBuild = args.includes('--skip-build');

function findChromium() {
  const candidates = [
    process.env.CHROME_PATH,
    process.env.PLAYWRIGHT_BROWSERS_PATH && join(process.env.PLAYWRIGHT_BROWSERS_PATH, 'chromium'),
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  ].filter(Boolean);
  for (const c of candidates) if (existsSync(c)) return c;
  for (const name of ['chromium', 'chromium-browser', 'google-chrome', 'google-chrome-stable']) {
    const which = spawnSync('which', [name], { encoding: 'utf8' });
    if (which.status === 0) return which.stdout.trim();
  }
  try {
    return chromium.executablePath();
  } catch {
    throw new Error(
      'No Chromium found. Install Chrome/Chromium or set CHROME_PATH to its executable.'
    );
  }
}

const types = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain',
  '.xml': 'application/xml',
};

// minimal static server over dist/ so absolute asset paths resolve
function serveDist() {
  return new Promise((resolveServer) => {
    const server = createServer(async (req, res) => {
      const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      const tries = [path, join(path, 'index.html'), `${path}.html`];
      for (const t of tries) {
        const file = join(dist, t);
        if (!file.startsWith(dist)) break;
        try {
          const body = await readFile(file);
          res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
          res.end(body);
          return;
        } catch {
          /* try next candidate */
        }
      }
      res.writeHead(404).end('not found');
    });
    server.listen(0, '127.0.0.1', () => resolveServer(server));
  });
}

if (!skipBuild || !existsSync(dist)) {
  console.log('Building site...');
  execSync('npm run build', { cwd: root, stdio: 'inherit' });
}

const server = await serveDist();
const port = server.address().port;
const url = `http://127.0.0.1:${port}/resume/${variant ? `?variant=${variant}` : ''}`;

const browser = await chromium.launch({ executablePath: findChromium() });
try {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({
    path: out,
    printBackground: true,
    displayHeaderFooter: false,
    preferCSSPageSize: true, // honor @page size/margins from the print CSS
  });
  console.log(`Wrote ${out}`);
} finally {
  await browser.close();
  server.close();
}
