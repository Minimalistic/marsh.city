/* RadioGridXL service worker — app-shell cache only.
   CACHE_VERSION is tied to the app version so it changes on every release:
   the fetch handler is cache-first with no revalidation, so a stale version
   here means installed PWAs never see shell updates (this bit us pre-7.5.5 —
   it sat at v1 from 7.5.0). Keep it in lockstep with the version-bump routine.
   The server sends sw.js no-cache, so each load refetches this file and the
   install→activate purge cycle kicks in. */
const CACHE_VERSION = 'rgxl-shell-7.5.5';

/* Shell assets, relative to the SW scope (the directory it's served from).
   start_url is "." so the HTML is reachable both as "./" and by filename. */
const SHELL_ASSETS = [
  './',
  './RadioGridXL.html',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      /* addAll is atomic-ish but a single 404 would reject it; add individually
         and swallow per-asset failures so a missing optional icon can't brick
         install. The HTML itself is the only truly required entry. */
      Promise.all(SHELL_ASSETS.map((url) =>
        cache.add(url).catch(() => null)
      ))
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only GET is cacheable; everything else (and non-GET) passes straight through.
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Never touch cross-origin requests — radio stream URLs live elsewhere and
  // must always hit the network, never be cached or served stale.
  if (url.origin !== self.location.origin) return;

  // Cache-first for same-origin shell/static assets, falling back to network.
  // Successful same-origin GETs are cached so the app keeps booting offline.
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        // Only cache complete, same-origin, OK responses.
        if (res && res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
        }
        return res;
      }).catch(() =>
        // Offline and not cached: last-ditch fall back to the cached shell HTML
        // for navigations so the app still opens.
        req.mode === 'navigate' ? caches.match('./RadioGridXL.html') : undefined
      );
    })
  );
});
