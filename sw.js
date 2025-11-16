const CACHE_NAME = 'solarisflow-v5'; // <-- Versione 5!
const urlsToCache = [
  '/',
  '/index.html',
  'app.js',
  'lib/jspdf.umd.min.js',
  'lib/jspdf.plugin.autotable.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Service Worker: Caching file locali e librerie...');
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // Restituisci dalla cache o vai alla rete
      return response || fetch(event.request);
    })
  );
});

// Pulisce le vecchie cache
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName.startsWith('solarisflow-') && cacheName !== CACHE_NAME;
        }).map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    })
  );
  return self.clients.claim();
});