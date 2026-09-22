const CACHE = 'grids-shell-v2';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// App shell (this same origin): cache-first, so the app opens instantly and works offline.
// Anything else (Google Fonts, etc.): network-first, falling back to cache, so it still works
// once a font has been fetched at least once, and never blocks the app if the network is down.
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isShell = url.origin === self.location.origin;

  if (isShell) {
    event.respondWith(
      caches.match(req, { ignoreSearch: true }).then(cached => {
        if (cached) return cached;
        return fetch(req).then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put(req, copy));
          return res;
        }).catch(() => caches.match('./index.html'));
      })
    );
    return;
  }

  event.respondWith(
    fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(cache => cache.put(req, copy));
      return res;
    }).catch(() => caches.match(req))
  );
});
