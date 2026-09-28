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

// 1x and 2x of the tile width; keep in sync with thumbSrcset() in src/pages/index.astro
const THUMB_WIDTHS = [240, 480];
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
  const files = [...new Set([...artFiles, ...showcaseFiles])];

  let written = 0;
  await Promise.all(files.map(async (src) => {
    const rel = path.relative(publicDir, src).replace(/\.\w+$/, '');
    const srcTime = await mtime(src);
    for (const width of THUMB_WIDTHS) {
      const out = path.join(thumbsDir, `${rel}-${width}.avif`);
      if ((await mtime(out)) > srcTime) continue;
      await fs.mkdir(path.dirname(out), { recursive: true });
      await sharp(src).resize(width).avif({ quality: 55, effort: 4 }).toFile(out);
      written++;
    }
  }));
  console.info(`thumbs: ${written} written, ${files.length * THUMB_WIDTHS.length - written} up to date`);
}

run();
