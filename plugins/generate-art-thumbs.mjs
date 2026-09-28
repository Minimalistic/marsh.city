// prebuild/predev script: small AVIF thumbnails for images shown as tiles —
// every art image, plus each image in the home page's Selected Works
// (src/data/showcase.json), which would otherwise load 1-2.5k px originals
// at ~200px. Writes public/_thumbs/<path>-<width>.avif (gitignored, rebuilt
// in CI); skips thumbs newer than their source so predev stays near-instant.
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');
const artDir = path.join(publicDir, 'art');
const thumbsDir = path.join(publicDir, '_thumbs');
const showcaseFile = path.join(__dirname, '..', 'src', 'data', 'showcase.json');

// 1x and 2x of the tile width; keep in sync with thumbSrcset() in src/pages/index.astro.
// Showcase images also get 960w, since whichever one is listed first shows at double size.
const THUMB_WIDTHS = [240, 480];
const SHOWCASE_WIDTHS = [240, 480, 960];
const EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);

async function mtime(file) {
  try {
    return (await fs.stat(file)).mtimeMs;
  } catch {
    return 0;
  }
}

async function run() {
  const entries = await fs.readdir(artDir, { withFileTypes: true, recursive: true });
  const artFiles = entries
    .filter((e) => e.isFile() && EXTENSIONS.has(path.extname(e.name).toLowerCase()))
    .map((e) => path.join(e.parentPath, e.name));
  const showcase = JSON.parse(await fs.readFile(showcaseFile, 'utf8'));
  const showcaseFiles = showcase.map((item) => path.join(publicDir, item.image));
  const jobs = new Map(artFiles.map((f) => [f, THUMB_WIDTHS]));
  for (const f of showcaseFiles) jobs.set(f, SHOWCASE_WIDTHS);

  let written = 0;
  let total = 0;
  await Promise.all([...jobs].map(async ([src, widths]) => {
    const rel = path.relative(publicDir, src).replace(/\.\w+$/, '');
    const srcTime = await mtime(src);
    total += widths.length;
    for (const width of widths) {
      const out = path.join(thumbsDir, `${rel}-${width}.avif`);
      if ((await mtime(out)) > srcTime) continue;
      await fs.mkdir(path.dirname(out), { recursive: true });
      await sharp(src).resize(width).avif({ quality: 55, effort: 4 }).toFile(out);
      written++;
    }
  }));
  console.info(`thumbs: ${written} written, ${total - written} up to date`);
}

run();
