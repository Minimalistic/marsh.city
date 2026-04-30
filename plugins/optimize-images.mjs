// one-shot script: resizes oversized images to max 1600px wide,
// converts PNG/JPG to WebP, updates markdown references
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const publicDir = path.join(root, 'public');
const imagesDir = path.join(publicDir, 'images');
const contentDir = path.join(root, 'src', 'content');

const MAX_WIDTH = 1600;
const WEBP_QUALITY = 82; // good balance of quality vs size
const EXTENSIONS = new Set(['.png', '.jpg', '.jpeg']);

async function findImages(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true, recursive: true });
  return entries
    .filter(e => e.isFile() && EXTENSIONS.has(path.extname(e.name).toLowerCase()))
    .map(e => path.join(e.parentPath || e.path, e.name));
}

async function findMarkdown(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true, recursive: true });
  return entries
    .filter(e => e.isFile() && (e.name.endsWith('.md') || e.name.endsWith('.mdx')))
    .map(e => path.join(e.parentPath || e.path, e.name));
}

async function run() {
  const images = await findImages(imagesDir);
  const renames = []; // { oldSrc, newSrc } for markdown updates
  let savedBytes = 0;

  for (const filePath of images) {
    const meta = await sharp(filePath).metadata();
    const oldSize = (await fs.stat(filePath)).size;
    const oldSrc = '/' + path.relative(publicDir, filePath);

    // resize if wider than MAX_WIDTH, then convert to webp
    let pipeline = sharp(filePath);
    if (meta.width > MAX_WIDTH) {
      pipeline = pipeline.resize(MAX_WIDTH, null, { fit: 'inside', withoutEnlargement: true });
    }

    const webpPath = filePath.replace(/\.(png|jpe?g)$/i, '.webp');
    const newSrc = '/' + path.relative(publicDir, webpPath);

    await pipeline.webp({ quality: WEBP_QUALITY }).toFile(webpPath);
    const newSize = (await fs.stat(webpPath)).size;

    // only keep webp if it's actually smaller
    if (newSize < oldSize) {
      await fs.unlink(filePath);
      renames.push({ oldSrc, newSrc });
      savedBytes += oldSize - newSize;
      console.info(`${oldSrc} → .webp  ${(oldSize/1024).toFixed(0)}K → ${(newSize/1024).toFixed(0)}K`);
    } else {
      // webp wasn't smaller — keep original, remove webp
      await fs.unlink(webpPath);
      console.info(`${oldSrc} — kept original (webp wasn't smaller)`);
    }
  }

  // update markdown references
  if (renames.length) {
    const mdFiles = await findMarkdown(contentDir);
    for (const mdPath of mdFiles) {
      let content = await fs.readFile(mdPath, 'utf8');
      let changed = false;
      for (const { oldSrc, newSrc } of renames) {
        if (content.includes(oldSrc)) {
          content = content.replaceAll(oldSrc, newSrc);
          changed = true;
        }
      }
      if (changed) {
        await fs.writeFile(mdPath, content);
        console.info(`updated references in ${path.relative(root, mdPath)}`);
      }
    }
  }

  console.info(`\nDone. Saved ${(savedBytes / 1024).toFixed(0)}K total across ${renames.length} images.`);
}

run();
