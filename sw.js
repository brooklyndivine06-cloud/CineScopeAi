/**
 * CineScope AI service worker.
 *
 * Strategy: precache the app shell so the bundled catalogue is fully usable
 * offline, stale-while-revalidate for same-origin assets, network-only for
 * third-party APIs (their data must never go stale or leak into another user).
 */
const VERSION = 'cinescope-v2';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/tokens.css',
  './css/base.css',
  './css/components.css',
  './css/views.css',
  './js/app.js',
  './js/core/emitter.js',
  './js/core/router.js',
  './js/core/store.js',
  './js/data/catalog.js',
  './js/data/taxonomy.js',
  './js/analysis/index.js',
  './js/analysis/score.js',
  './js/analysis/advisory.js',
  './js/analysis/insights.js',
  './js/analysis/similar.js',
  './js/services/catalog-service.js',
  './js/services/links.js',
  './js/services/provider.js',
  './js/services/tmdb.js',
  './js/ui/dom.js',
  './js/ui/charts.js',
  './js/ui/components.js',
  './js/ui/modal.js',
  './js/ui/palette.js',
  './js/ui/poster.js',
  './js/ui/settings.js',
  './js/ui/shortcuts.js',
  './js/ui/sound.js',
  './js/ui/theme.js',
  './js/ui/toast.js',
  './js/ui/views/landing.js',
  './js/ui/views/report.js',
  './js/ui/views/compare.js',
  './js/ui/views/watchlist.js',
  './js/utils/color.js',
  './js/utils/fuzzy.js',
  './js/utils/number.js',
  './js/utils/storage.js',
  './js/utils/text.js',
];

const OFFLINE_PAGE = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>CineScope AI — offline</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#08090d;color:#eef0f6;font-family:system-ui,sans-serif;text-align:center;padding:24px}
h1{font-size:1.6rem;margin:0 0 8px}p{color:#a8aec0;max-width:40ch}</style></head>
<body><div><h1>📡 CineScope is offline</h1><p>The app shell did not finish caching before you lost connection. Reconnect and reload — the bundled catalogue then works with no network at all.</p></div></body></html>`;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION)
      .then((cache) => Promise.allSettled(SHELL.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'skip-waiting') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isApi = !url.origin.endsWith(self.location.host)
    || ['api.themoviedb.org', 'image.tmdb.org'].includes(url.hostname);

  // Third-party APIs: never cached, never spoofed offline.
  if (url.hostname === 'api.themoviedb.org') return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(VERSION).then((cache) => cache.put('./index.html', copy));
          return response;
        })
        .catch(() => caches.match('./index.html')
          .then((cached) => cached || new Response(OFFLINE_PAGE, { headers: { 'Content-Type': 'text/html' } }))),
    );
    return;
  }

  if (isApi) {
    // Remote artwork: cache-first so posters survive a dropped connection.
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => {
        if (response.ok && response.type === 'basic') {
          const copy = response.clone();
          caches.open(VERSION).then((cache) => cache.put(request, copy));
        }
        return response;
      }).catch(() => new Response('', { status: 504 }))),
    );
    return;
  }

  // Same-origin assets: stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(VERSION).then((cache) => cache.put(request, copy));
        }
        return response;
      }).catch(() => cached);
      return cached || network;
    }),
  );
});
