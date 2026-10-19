// DailyDungeon service worker: keeps the whole app shell in a cache so the
// installed app launches and plays with no network.
//
// - install:  precache every file listed in sw-assets.js (generated, see tools/sw-manifest.js)
// - activate: delete caches from older versions
// - fetch:    /api/* goes to the network untouched; everything else is cache-first,
//             and a navigation to the app's root falls back to the cached
//             index.html offline.
//
// Service workers can't be ES modules everywhere yet, so this is a classic
// script and the asset list arrives through importScripts().

// The line below is rewritten by `npm run sw-manifest` so this file's own bytes
// change whenever the app does (see tools/sw-manifest.js for why).
// shell version: 09da9031b188

importScripts("sw-assets.js");

const CACHE_PREFIX = "dailydungeon-shell-";
// PRECACHE_VERSION is a hash of the cached files' contents, so any change to
// the app produces a new cache name and a byte-different worker.
const CACHE_NAME = CACHE_PREFIX + self.PRECACHE_VERSION;
const APP_PAGE = "index.html";

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // cache: "reload" skips the browser's HTTP cache, so a fresh install never
    // stores a stale copy of a file that just changed on the server.
    await cache.addAll(self.PRECACHE_FILES.map((file) => new Request(file, { cache: "reload" })));
    // Take over without waiting for every open tab to close: the new cache
    // already holds a complete, matching set of files.
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
      .map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

// The game is one page at the root of the worker's scope ("/" today). Only a
// navigation there may get the cached index.html: the page loads its files
// with relative URLs, so served at /some/path/ it would ask for
// /some/path/main.js and break. Any other path goes to the network as usual.
function isAppPageNavigation(request) {
  if (request.mode !== "navigate") {
    return false;
  }
  const root = new URL(self.registration.scope).pathname;
  const pathname = new URL(request.url).pathname;
  return pathname === root || pathname === root + APP_PAGE;
}

function isApiRequest(url) {
  return url.pathname === "/api" || url.pathname.startsWith("/api/");
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Not calling respondWith() hands the request back to the browser, which
  // sends it to the network as if there were no service worker. API calls,
  // other origins and anything that isn't a GET are never cached.
  if (request.method !== "GET" || url.origin !== self.location.origin || isApiRequest(url)) {
    return;
  }

  event.respondWith(respondFromCache(request));
});

async function respondFromCache(request) {
  const cache = await caches.open(CACHE_NAME);
  // ignoreSearch: "/?source=homescreen" is still the same file.
  const cached = await cache.match(request, { ignoreSearch: true });
  if (cached) {
    return cached;
  }
  if (isAppPageNavigation(request)) {
    const page = await cache.match(APP_PAGE);
    if (page) {
      return page;
    }
  }
  // Not cached (e.g. the first visit, before install finished): use the network.
  // If that fails too, the browser shows its normal offline error.
  return fetch(request);
}
