/**
 * Service Worker JejakNusantara PWA (Caching Offline Penuh)
 * Menyimpan kerangka aplikasi, pustaka UI, audio synthesizer, dan font agar berjalan 100% tanpa internet.
 */
const CACHE_NAME = 'jejak-nusantara-pwa-v1.2';

// Daftar aset inti lokal & pustaka eksternal yang di-cache saat instalasi
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap'
];

// Tahap Install: Unduh & simpan seluruh aset inti ke Cache Storage
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const url of PRECACHE_ASSETS) {
        try {
          const request = url.startsWith('http') ? new Request(url, { mode: 'no-cors' }) : url;
          const response = await fetch(request);
          if (response) {
            await cache.put(url, response);
          }
        } catch (err) {
          // Lanjutkan caching aset berikutnya jika salah satu sumber jaringan lambat
        }
      }
    }).then(() => self.skipWaiting())
  );
});

// Tahap Activate: Hapus cache versi lama agar penyimpanan perangkat tetap hemat
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((oldName) => caches.delete(oldName))
      );
    }).then(() => self.clients.claim())
  );
});

// Tahap Fetch: Strategi Cache-First dengan pembaruan jaringan latar belakang
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
