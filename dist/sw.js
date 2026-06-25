const CACHE = 'scrollpedia-v3';
const PRECACHE = [
  '/scrollpedia/',
  '/scrollpedia/index.html',
  '/scrollpedia/search.html',
  '/scrollpedia/saved.html',
  '/scrollpedia/settings.html',
  '/scrollpedia/404.html',
  '/scrollpedia/manifest.json',
  '/scrollpedia/icons/icon-192.png',
  '/scrollpedia/icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Network-first for Wikipedia API (always fresh articles)
  if (url.hostname.includes('wikipedia.org')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // For navigation requests (HTML page loads), try network then cache,
  // falling back to index.html so SPA routing always works
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() =>
          caches.match(e.request).then((cached) =>
            cached || caches.match('/scrollpedia/index.html')
          )
        )
    );
    return;
  }

  // Cache-first for app shell assets
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        if (res.ok && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
        }
        return res;
      });
    })
  );
});
