// Tavela's test build moved to https://tavela-test.marsh.city/ (its own origin, so its
// storage is no longer shared with the rest of marsh.city). Devices that installed it here
// still run the cached app, which keeps checking for a new sw.js. This is that last one: it
// takes over at once, deletes only Tavela's caches, sends open windows to the "moved" page
// (now served from the network) and unregisters itself. Stored entries are left alone.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('tendwell-')) await caches.delete(key);
    }
    await self.clients.claim();
    await self.registration.unregister();
    // Fixed address in this folder, never built from a URL or message.
    const moved = new URL('./', self.location).href;
    for (const client of await self.clients.matchAll({ type: 'window' })) client.navigate(moved);
  })());
});
