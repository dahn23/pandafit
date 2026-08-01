/* Service worker PandaFit — minimal, "network-first".
   But : rendre l'app installable en PWA (mode plein écran, sans barre d'adresse),
   SANS jamais servir du code périmé. On va toujours chercher la version réseau ;
   le cache ne sert que de repli hors-ligne. Cohérent avec le rechargement nocturne. */
const CACHE = 'pandafit-shell-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith((async () => {
    try {
      const fresh = await fetch(req);
      if (req.mode === 'navigate') {
        const cache = await caches.open(CACHE);
        cache.put(req, fresh.clone());
      }
      return fresh;
    } catch (err) {
      const cached = await caches.match(req);
      if (cached) return cached;
      if (req.mode === 'navigate') {
        const fallback = await caches.match('./');
        if (fallback) return fallback;
      }
      throw err;
    }
  })());
});
