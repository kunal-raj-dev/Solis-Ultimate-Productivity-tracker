/*
 * Solis — Plan §8.4: Offline-First PWA Service Worker
 *
 * Keeps the app shell available for uninterrupted offline library study while
 * src/services/offline/pwaSync.ts holds the IndexedDB write-ahead mutation
 * queue. Deliberately conservative:
 *   - Registered only in production builds (see pwaSync.registerSolisServiceWorker).
 *   - NEVER intercepts non-GET requests or cross-origin traffic (Supabase REST,
 *     auth, storage, realtime and Gemini all stay direct network calls).
 *   - Navigations are network-first with a cached shell fallback; static
 *     assets use stale-while-revalidate.
 *   - Excludes /api/* (Vercel serverless keepalive) from all caching.
 */

const CACHE_VERSION = 'solis-offline-v1';
const APP_SHELL_URL = '/';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll([APP_SHELL_URL]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // Supabase / Gemini / CDNs stay direct
  if (url.pathname.startsWith('/api/')) return; // serverless keepalive: always live

  // SPA navigations: network first, cached shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches
          .match(APP_SHELL_URL)
          .then((cached) => cached || Response.error())
      )
    );
    return;
  }

  // Static assets & same-origin GETs: stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
