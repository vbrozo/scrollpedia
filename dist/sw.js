const CACHE = 'scrollpedia-v4';

// Only cache static assets that have content hashes in their names.
// HTML files are intentionally NOT cached — always fetched fresh so
// a new deploy never results in a mismatched JS bundle → blank screen.
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll([
        '/scrollpedia/icons/icon-192.png',
        '/scrollpedia/icons/icon-512.png',
        '/scrollpedia/manifest.json',
      ]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Network-only for Wikipedia API (always fresh articles)
  if (url.hostname.includes('wikipedia.org')) {
    e.respondWith(fetch(e.request).catch(() => new Response('', { status: 503 })));
    return;
  }

  // Network-first for HTML navigation — ensures fresh shell after deploy
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() =>
        // Offline fallback: serve cached index.html if available
        caches.match('/scrollpedia/index.html').then((r) => r || new Response('Offline', { status: 503 }))
      )
    );
    return;
  }

  // Cache-first for hashed static assets (_expo/static/..., assets/...)
  // These are safe to cache forever because filename changes on every deploy
  if (
    url.pathname.includes('/_expo/static/') ||
    url.pathname.includes('/assets/') ||
    url.pathname.includes('/icons/')
  ) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        if (cached) return cached;
        return fetch(e.request).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, clone));
          }
          return res;
        });
      })
    );
    return;
  }

  // Everything else: network-first
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request).then((r) => r || new Response('', { status: 503 })))
  );
});
