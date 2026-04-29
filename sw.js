const CACHE_NAME = 'service-mafia-v4';
const APP_SHELL = [
  '/',
  'index.html',
  'style.css',
  'app.js',
  'manifest.json',
  'icon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;
  const isNavigation = event.request.mode === 'navigate';
  const isApiRequest = isSameOrigin && requestUrl.pathname.startsWith('/api/');
  const isShellAsset = isSameOrigin && APP_SHELL.some(path => {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return requestUrl.pathname === normalized || requestUrl.pathname.endsWith(normalized);
  });

  // Let the browser handle cross-origin assets and API traffic normally.
  if (!isSameOrigin || isApiRequest) return;

  if (isNavigation) {
    event.respondWith(
      fetch(event.request)
        .then(async response => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
            return response;
          }

          // If the server returns 404/500 for a navigation, recover with cached app shell.
          const cachedPage = await caches.match(event.request);
          return cachedPage || caches.match('/') || caches.match('index.html') || response;
        })
        .catch(async () => {
          const cachedPage = await caches.match(event.request);
          return cachedPage || caches.match('/') || caches.match('index.html');
        })
    );
    return;
  }

  if (isShellAsset) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        const networkFetch = fetch(event.request)
          .then(response => {
            if (response && response.ok) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
            }
            return response;
          })
          .catch(() => cached);
        return cached || networkFetch;
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      }
      return response;
    }))
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      const existing = clients.find(client => 'focus' in client);
      if (existing) return existing.focus();
      if (self.clients.openWindow) return self.clients.openWindow('/');
      return undefined;
    })
  );
});