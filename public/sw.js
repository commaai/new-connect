const CACHE_NAME = 'connect-cache'
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
]

const CACHE_PATTERNS = [
  /^images\/.*\.(png|jpg|svg)$/,
  /^https:\/\/fonts\.googleapis\.com\//,
  /^https:\/\/fonts\.gstatic\.com\//
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache)
      }),
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(
          (fetchResponse) => {
            if (shouldCache(event.request.url)) {
              const responseToCache = fetchResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }
            return fetchResponse;
          }
        );
      })
  );
});

function shouldCache(url) {
  const path = new URL(url).pathname;
  return CACHE_PATTERNS.some(pattern => pattern.test(path));
}
