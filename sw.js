const CACHE_NAME = 'solarisflow-v6'; // <-- Versione 6!
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

// *** QUESTA SEZIONE È STATA MODIFICATA ***
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // Se la richiesta è per un dominio diverso (CDN, Google Fonts, ecc.)
  if (requestUrl.origin !== self.location.origin) {
    // Lascia che sia il browser a gestirla, senza passare dalla cache.
    // Non usiamo event.respondWith()
    return;
  }

  // Se la richiesta è per il nostro dominio (file locali)
  event.respondWith(
    caches.match(event.request).then(response => {
      // Restituisci dalla cache o vai alla rete
      return response || fetch(event.request);
    })
  );
});

// Pulisce le vecchie cache (v1, v2, v3, v4, v5)
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
