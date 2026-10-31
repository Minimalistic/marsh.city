// Every app under public/ shares the marsh.city origin, so a script loaded from a
// CDN can read all of their storage. Each CDN URL must name an exact version, and
// the file loading it must carry an SRI hash, so a changed file fails to load
// instead of running.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEXT = /\.(js|mjs|astro|md|mdx|html)$/;
const CDN = /https:\/\/(?:cdn\.jsdelivr\.net\/npm|unpkg\.com|cdnjs\.cloudflare\.com\/ajax\/libs)\/[^'"`\s)]+/g;

async function sources(dir) {
  const entries = await readdir(path.join(root, dir), { recursive: true, withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && TEXT.test(entry.name))
    .map((entry) => path.join(entry.parentPath, entry.name));
}

const files = [...await sources('src'), ...await sources('public')];
const uses = [];
for (const file of files) {
  const text = await readFile(file, 'utf8');
  for (const [url] of text.matchAll(CDN)) uses.push({ file: path.relative(root, file), url, text });
}

test('the CDN scan finds the mermaid loader', () => {
  assert.ok(uses.some((use) => use.file === path.join('src', 'scripts', 'mermaid.js')));
});

for (const { file, url, text } of uses) {
  test(`${file} pins ${url}`, () => {
    assert.match(url, /@\d+\.\d+\.\d+\//, 'needs an exact version (x.y.z)');
    assert.match(text, /sha384-[A-Za-z0-9+/=]{64}/, 'needs an SRI hash');
  });
}
