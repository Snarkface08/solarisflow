const CACHE_NAME = 'solarisflow-v1';
const urlsToCache = [
  '/',
  '/index.html',
  'app.js', // <-- Aggiunto il nuovo file JavaScript
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
  // <-- Rimosso 'html2canvas.min.js' perché non è più usato
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});