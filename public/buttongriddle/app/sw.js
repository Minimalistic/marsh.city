// Kill switch for the retired ButtonGriddle web app at /buttongriddle/app/.
// Installed copies check this file for updates; this version activates at
// once, deletes only ButtonGriddle's own caches (CacheStorage is shared by
// the whole marsh.city origin), unregisters, and sends open tabs to the
// landing page. Board data in IndexedDB is left alone on purpose: deleting
// someone's boards without asking isn't this file's call.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('buttongriddle-')) await caches.delete(key);
    }
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    await Promise.all(clients.map((client) => client.navigate('/buttongriddle/')));
  })());
});
