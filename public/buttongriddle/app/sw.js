// Cache-first app shell. Bump CACHE on every deployed change — activate
// deletes old caches, so the version string is the whole update mechanism.
//
// Deliberate updates: no skipWaiting() at install — a new version downloads,
// then WAITS. It takes over only when Settings posts SKIP_WAITING (the
// backup-first update flow in edit.js), or on the next cold launch after all
// pages close (browser lifecycle — a waiting worker can't be held past that).
// Either way it never swaps out from under a running session.
const CACHE = 'buttongriddle-v17';

const SHELL = [
  '.',
  'index.html',
  'help.html',
  'styles.css',
  'app.js',
  'js/schema.js',
  'js/db.js',
  'js/speech.js',
  'js/board.js',
  'js/home.js',
  'js/check.js',
  'js/strip.js',
  'js/edit.js',
  'js/backup.js',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  // no-cache: install must fetch fresh from the network — plain addAll goes
  // through the HTTP cache and can seal stale assets into a new version.
  event.waitUntil(caches.open(CACHE).then((cache) =>
    cache.addAll(SHELL.map((url) => new Request(url, { cache: 'no-cache' })))));
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return;
  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((cached) => cached ?? fetch(request)),
  );
});
