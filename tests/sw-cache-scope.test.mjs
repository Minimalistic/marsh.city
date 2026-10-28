// Every app under public/ shares one origin, so they share one CacheStorage.
// A service worker whose activate step deletes "every cache but mine" wipes
// the other apps' offline copies on each of its own version bumps. This runs
// each sw.js's activate handler against fake caches that include a foreign
// app's cache, and fails if that cache gets deleted.
//
// Covers whole-cache deletes (caches.delete), the shape every worker here
// uses for version cleanup. Per-entry deletes inside a cache aren't checked.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const publicDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public');
const FOREIGN_CACHE = 'some-other-app-v1';

// Loads a worker in a sandbox (vm keeps its globals off ours), fires its
// activate handler, and returns the names of caches it deleted.
async function cachesDeletedOnActivate(source, workerUrl) {
  const deleted = [];
  const listeners = {};
  const fakeCache = { keys: async () => [], delete: async () => true };
  const sandbox = {
    addEventListener: (type, handler) => { listeners[type] = handler; },
    skipWaiting: async () => {},
    clients: { claim: async () => {}, matchAll: async () => [] },
    registration: { unregister: async () => true },
    // DailyDungeon pulls its version + file list from sw-assets.js.
    importScripts: () => { sandbox.PRECACHE_VERSION = 'test'; sandbox.PRECACHE_FILES = []; },
    caches: {
      keys: async () => [FOREIGN_CACHE, 'stale-own-cache-v0'],
      delete: async (name) => { deleted.push(name); return true; },
      open: async () => fakeCache,
      match: async () => undefined,
    },
    location: new URL(workerUrl),
    Request, Response, URL, fetch: async () => new Response(''), console,
  };
  sandbox.self = sandbox;
  vm.runInNewContext(source, sandbox, { filename: workerUrl });
  assert.ok(listeners.activate, 'worker registers an activate handler');
  const pending = [];
  listeners.activate({ waitUntil: (promise) => pending.push(promise) });
  await Promise.all(pending);
  return deleted;
}

const entries = await readdir(publicDir, { recursive: true, withFileTypes: true });
const workers = entries
  .filter((entry) => entry.isFile() && entry.name === 'sw.js')
  .map((entry) => path.relative(publicDir, path.join(entry.parentPath, entry.name)));

test('public/ has service workers to check', () => {
  assert.ok(workers.length > 0);
});

for (const worker of workers) {
  test(`${worker} leaves other apps' caches alone on activate`, async () => {
    const source = await readFile(path.join(publicDir, worker), 'utf8');
    const deleted = await cachesDeletedOnActivate(source, `https://marsh.city/${worker}`);
    assert.ok(!deleted.includes(FOREIGN_CACHE),
      `${worker} deletes caches it doesn't own; filter caches.keys() on this app's prefix`);
  });
}

test('the check catches an "everything but mine" worker', async () => {
  const greedy = `
    const CACHE = 'mine-v2';
    self.addEventListener('activate', (event) => {
      event.waitUntil(caches.keys().then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))));
    });`;
  const deleted = await cachesDeletedOnActivate(greedy, 'https://marsh.city/greedy/sw.js');
  assert.ok(deleted.includes(FOREIGN_CACHE));
});
