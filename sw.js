// Queva Service Worker — enables offline support and installability
const CACHE = 'queva-v1';
const OFFLINE_URL = '/QUEVA/';

// Files to cache on install
const PRECACHE = [
  '/QUEVA/',
  '/QUEVA/index.html'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Only handle GET requests
  if(e.request.method !== 'GET') return;
  
  // Network first, fallback to cache
  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Cache successful responses
        if(res.ok){
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then(cached => cached || caches.match(OFFLINE_URL)))
  );
});
