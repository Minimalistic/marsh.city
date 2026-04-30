// prebuild script: scans public/images/ for all images, generates
// tiny base64 LQIP thumbnails, writes to public/_lqip/map.json
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');
const imagesDir = path.join(publicDir, 'images');
const outPath = path.join(publicDir, '_lqip', 'map.json');

const LQIP_WIDTH = 20;
const EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);

async function findImages(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true, recursive: true });
  return entries
    .filter(e => e.isFile() && EXTENSIONS.has(path.extname(e.name).toLowerCase()))
    .map(e => path.join(e.parentPath || e.path, e.name));
}

async function run() {
  const files = await findImages(imagesDir);
  const map = {};

  await Promise.all(files.map(async function (filePath) {
    try {
      const image = sharp(filePath);
      const buf = await image
        .resize(LQIP_WIDTH, null, { fit: 'inside' })
        .jpeg({ quality: 40 })
        .toBuffer();
      const src = '/' + path.relative(publicDir, filePath);
      map[src] = `data:image/jpeg;base64,${buf.toString('base64')}`;
    } catch (err) {
      console.warn(`LQIP: skipping ${filePath}: ${err.message}`);
    }
  }));

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(map));
  console.info(`LQIP: generated ${Object.keys(map).length} placeholders`);
}

run();
