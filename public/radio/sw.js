/* RadioGridXL service worker — app-shell cache only.
   CACHE_VERSION is tied to the app version so it changes on every release:
   the fetch handler is cache-first with no revalidation, so a stale version
   here means installed PWAs never see shell updates (this bit us pre-7.5.5 —
   it sat at v1 from 7.5.0). Keep it in lockstep with the version-bump routine.
   The server sends sw.js no-cache, so each load refetches this file and the
   install→activate purge cycle kicks in. */
const CACHE_VERSION = 'rgxl-shell-7.7.0-9a94dc7c';

/* Shell assets, relative to the SW scope (the directory it's served from).
   start_url is "." so the HTML is reachable both as "./" and by filename.
   The filename differs by host: Docker serves RadioGridXL.html (and "/"),
   marsh.city/radio ships it as index.html. Precache both; whichever 404s is
   dropped by the per-asset catch below. */
const SHELL_ASSETS = [
  './',
  './index.html',
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
         install. cache: 'reload' skips the browser's HTTP cache: GitHub Pages
         sends max-age=600, so a plain fetch soon after a deploy could store
         the previous HTML under this new cache name. */
      Promise.all(SHELL_ASSETS.map((url) =>
        cache.add(new Request(url, { cache: 'reload' })).catch(() => null)
      ))
        /* The HTML is the one required entry. Without it (a weak connection
           timing out on the big file), fail the install: the previous version
           stays in charge rather than a worker that can't open offline. */
        .then(() => matchShell(cache))
        .then((shell) => {
          if (!shell) throw new Error('shell HTML not cached; keeping the previous version');
        })
    )
  );
});

self.addEventListener('activate', (event) => {
  /* CacheStorage is shared by the whole origin, not just this worker's scope,
     so on marsh.city the other apps' caches sit beside ours. Delete only our
     own old versions. */
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k.startsWith('rgxl-shell-') && k !== CACHE_VERSION)
          .map((k) => caches.delete(k))
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
        // for navigations so the app still opens. Try each name the shell may
        // be cached under (see SHELL_ASSETS).
        req.mode === 'navigate' ? matchShell(caches) : undefined
      );
    })
  );
});

/** The shell HTML under any name it may be cached as, from `store`: one
    cache, or all of CacheStorage. */
function matchShell(store) {
  return store.match('./')
    .then((res) => res || store.match('./index.html'))
    .then((res) => res || store.match('./RadioGridXL.html'));
}
