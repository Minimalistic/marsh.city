// Kill switch for the retired service worker scoped to /buttongriddle/ —
// the app moved to /buttongriddle/app/ and this path is now the landing
// page. Early testers' browsers still hold the old worker, which serves
// the old app from cache-first and would shadow the landing page forever.
// The update check fetches this file, which activates, evicts only the
// old-path cache entries (caches are origin-shared — the relocated app's
// entries under /app/ must survive), unregisters, and reloads open tabs.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      const cache = await caches.open(key);
      for (const request of await cache.keys()) {
        const { pathname } = new URL(request.url);
        if (pathname.startsWith('/buttongriddle/') && !pathname.startsWith('/buttongriddle/app/')) {
          await cache.delete(request);
        }
      }
    }
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((client) => client.navigate(client.url));
  })());
});
