// rehype plugin: reads image dimensions from public/ at build time
// and injects width/height attributes to prevent layout reflow
import { visit } from 'unist-util-visit';
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');

const cache = new Map();

async function getImageDimensions(src) {
  if (cache.has(src)) return cache.get(src);
  if (!src.startsWith('/') || src.startsWith('//')) return null;

  const filePath = path.join(publicDir, src);
  try {
    const metadata = await sharp(filePath).metadata();
    const dims = { width: metadata.width, height: metadata.height };
    cache.set(src, dims);
    return dims;
  } catch {
    cache.set(src, null);
    return null;
  }
}

export default function rehypeImageSize() {
  return async function transformer(tree) {
    const images = [];
    visit(tree, 'element', function (node) {
      if (node.tagName === 'img' && node.properties?.src) {
        images.push(node);
      }
    });

    await Promise.all(images.map(async function (node) {
      const dims = await getImageDimensions(node.properties.src);
      if (dims) {
        node.properties.width = dims.width;
        node.properties.height = dims.height;
        node.properties.loading = node.properties.loading || 'lazy';
      }
    }));
  };
}
