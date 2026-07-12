// CineSense AI - Service Worker (Offline Fallback)
const CACHE_NAME = 'cinesense-v1';
const OFFLINE_URL = '/offline.html';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/css/variables.css',
  '/css/base.css',
  '/css/animations.css',
  '/css/components.css',
  '/css/landing.css',
  '/css/analysis.css',
  '/css/results.css',
  '/css/responsive.css',
  '/js/utils.js',
  '/js/api.js',
  '/js/parser.js',
  '/js/analyzer.js',
  '/js/charts.js',
  '/js/ui.js',
  '/js/animations.js',
  '/js/easter-eggs.js',
  '/js/app.js'
];

// Install: cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('Precache failed for some assets:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch: Network-first for API calls, Cache-first for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // API calls: network only (don't cache API responses in SW)
  if (url.hostname.includes('api.themoviedb.org') ||
      url.hostname.includes('omdbapi.com') ||
      url.hostname.includes('image.tmdb.org')) {
    return;
  }

  // Static assets: stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request).then((response) => {
        // Only cache successful responses
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      }).catch(() => {
        // If offline and no cache, return a basic fallback
        if (event.request.destination === 'document') {
          return new Response(
            '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><title>CineSense AI - Offline</title><style>body{background:#0a0a0f;color:#f0f0f5;font-family:Inter,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center}h1{font-size:2rem;margin-bottom:1rem}p{color:rgba(240,240,245,0.6)}</style></head><body><div><h1>📡 You\'re Offline</h1><p>CineSense AI needs an internet connection to analyze movies.</p><p>Please reconnect and try again.</p></div></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        }
      });

      return cached || fetchPromise;
    })
  );
});
