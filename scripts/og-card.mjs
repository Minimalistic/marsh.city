// Renders the sitewide social share card (public/og-default.jpg, 1200×630).
//
// Usage: node scripts/og-card.mjs
//
// The card is plain HTML screenshotted by headless Chrome — same approach as
// resume-pdf.mjs, so real web fonts and CSS with no image-compositing deps.
// Re-run whenever the foliage layers or tagline change; the JPEG is committed.

import { readFileSync, writeFileSync, rmSync, existsSync, mkdtempSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir, homedir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outJpg = join(root, 'public/og-default.jpg');

const WIDTH = 1200;
const HEIGHT = 630;

// The footer scenery as it looks at the bottom of a page: each layer is a
// cropped strip of a 3:2 canvas drawn at the card width, pinned where the site
// pins it at the end of the scroll (row --end-canvas lands at --end-band of the
// band). Painted-row bounds come from the compositor block in global.css, so
// re-running this after re-composing the layers keeps the card in sync.
const css = readFileSync(join(root, 'src/styles/global.css'), 'utf8');
const boxesBlock = css.match(/foliage-boxes:start[\s\S]*?@media/)[0];
const box = (name) => {
  const m = boxesBlock.match(new RegExp(`\\.foliage-frame--${name} \\.foliage-layer \\{ --content-top: ([\\d.]+); --content-bottom: ([\\d.]+);`));
  return { top: Number(m[1]), bottom: Number(m[2]) };
};
const CANVAS_H = WIDTH * (2 / 3);
const BAND = HEIGHT * 0.7;  // the 70vh foliage band; the forest gets the full height
const LAYERS = [
  // name, band height, --end-band, pin by painted top (forest) or bottom
  ['forest', HEIGHT, 0.12, 'top'],
  ['back', BAND, 0.72, 'bottom'],
  ['mid', BAND, 1.086, 'bottom'],
  ['front', BAND, 1, 'bottom'],
  ['ground', BAND, 1.05, 'bottom'],  // tucks the soil fringe off the bottom, as on the site
];
const layerTags = LAYERS.map(([name, band, endBand, pin]) => {
  const b = box(name);
  const endCanvas = pin === 'top' ? b.top : b.bottom;
  const canvasTop = (HEIGHT - band) + band * endBand - CANVAS_H * endCanvas;
  const file = pathToFileURL(join(root, `public/foliage/${name}${name === 'forest' || name === 'back' ? '' : '@2x'}.avif`)).href;
  return `<img src="${file}" alt="" style="position:absolute;left:0;width:${WIDTH}px;top:${(canvasTop + b.top * CANVAS_H).toFixed(1)}px;height:${((b.bottom - b.top) * CANVAS_H).toFixed(1)}px">`;
}).join('\n  ');

// Colors mirror the light-theme tokens and day sky in src/styles/global.css.
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lora:wght@500;600&family=Inter:wght@400;500&family=JetBrains+Mono:wght@500&display=swap">
<style>
  html, body { margin: 0; width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; }
  body {
    background: linear-gradient(to bottom, #4e8cc2 0%, #97bedb 22%, #cfe2ec 50%, #dde9ee 100%);
    font-family: Inter, sans-serif;
    color: #243626;
    position: relative;
  }
  .panel {
    position: absolute;
    top: 64px;
    left: 50%;
    transform: translateX(-50%);
    padding: 30px 56px 34px;
    text-align: center;
    border-radius: 22px;
    border: 1px solid rgba(74, 122, 50, 0.35);
    background: rgba(240, 236, 218, 0.82);
    box-shadow: 0 10px 40px rgba(20, 40, 30, 0.18);
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
    font-size: 92px;
    line-height: 1;
    margin: 16px 0 20px;
    letter-spacing: -0.01em;
    white-space: nowrap;
  }
  .tagline {
    font-size: 26px;
    color: #33453a;
    line-height: 1.4;
    white-space: nowrap;
  }
</style>
</head>
<body>
  ${layerTags}
  <div class="panel">
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
