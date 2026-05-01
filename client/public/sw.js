const CACHE_NAME = 'samikaran-v9';
const STATIC_CACHE = 'samikaran-static-v9';
const OFFLINE_URL = '/offline.html';

// Static assets to pre-cache on install
const PRECACHE_ASSETS = [
  OFFLINE_URL,
  '/manifest.json',
  '/favicon.svg',
];

// Fallback response when both network and cache fail
function offlineFallback() {
  return new Response(
    '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Offline - Samikaran Olympiad</title><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0f0a1e;font-family:system-ui;color:#fff;text-align:center}h1{color:#a78bfa;margin-bottom:12px}p{color:#9ca3af;font-size:15px}a{color:#7c3aed;text-decoration:none}</style></head><body><div><h1>You are offline</h1><p>Please check your connection and try again.</p></div></body></html>',
    { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter(n => n !== CACHE_NAME && n !== STATIC_CACHE)
          .map(n => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = event.request.url;

  // Never intercept API calls, auth, or chrome extensions
  if (
    url.includes('/api/') ||
    url.includes('chrome-extension') ||
    url.includes('/exam/') ||
    url.includes('/secure-exam/')
  ) return;

  // Navigation requests: network-first, fallback to cached offline page or inline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cached = await caches.match(OFFLINE_URL);
        return cached || offlineFallback();
      })
    );
    return;
  }

  // Hashed static assets (/assets/xxx.hash.js|css): cache-first (immutable)
  if (url.includes('/assets/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        try {
          const response = await fetch(event.request);
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        } catch {
          return new Response('', { status: 503 });
        }
      })
    );
    return;
  }

  // Fonts: cache-first with background refresh
  if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        try {
          const response = await fetch(event.request);
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        } catch {
          return new Response('', { status: 503 });
        }
      })
    );
    return;
  }

  // Static files (icons, images, manifest): cache-first
  if (
    url.endsWith('.svg') || url.endsWith('.png') || url.endsWith('.ico') ||
    url.endsWith('.webp') || url.endsWith('.json') ||
    url.includes('/icons/')
  ) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        try {
          const response = await fetch(event.request);
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        } catch {
          return new Response('', { status: 503 });
        }
      })
    );
    return;
  }

  // Everything else: network-first, fallback to cache, then empty 503
  event.respondWith(
    fetch(event.request).catch(async () => {
      const cached = await caches.match(event.request);
      return cached || new Response('', { status: 503 });
    })
  );
});
