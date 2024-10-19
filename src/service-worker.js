// const SERVICE_WORKER_VERSION = 1;
// const CACHE_NAME = `comma-connect-cache-v${SERVICE_WORKER_VERSION}`;

// const STATIC_ASSETS = [
//   '/index.html',
//   '/manifest.json',
//   '/no-connection.html',
//   '/images/icon-256.png',
// ];

// const CACHEABLE_URL_PATTERNS = [
//   /\/images\/.*\.(png|jpg|svg)$/,
//   /\/fonts\.googleapis\.com\//,
//   /\/fonts\.gstatic\.com\//,
// ];

// self.addEventListener('install', (installEvent) => {
//   installEvent.waitUntil(
//     caches.open(CACHE_NAME).then((cache) => {
//       return cache.addAll(STATIC_ASSETS);
//     })
//   );
// });

// self.addEventListener('fetch', (fetchEvent) => {
//   if (fetchEvent.request.method !== 'GET') {
//     return;
//   }

//   if (shouldCacheUrl(fetchEvent.request.url)) {
//     fetchEvent.respondWith(
//       caches.match(fetchEvent.request).then((cachedResponse) => {
//         if (cachedResponse) {
//           return cachedResponse;
//         }
//         return fetch(fetchEvent.request).then((networkResponse) => {
//           if (networkResponse.status === 200) {
//             const clonedResponse = networkResponse.clone();
//             caches.open(CACHE_NAME).then((cache) => {
//               cache.put(fetchEvent.request, clonedResponse);
//             });
//           }
//           return networkResponse;
//         });
//       }).catch(handleFetchError)
//     );
//   } else {
//     fetchEvent.respondWith(
//       fetch(fetchEvent.request).catch(handleFetchError)
//     );
//   }
// });

// function handleFetchError(error) {
//   if (!navigator.onLine) {
//     return caches.match('/no-connection.html');
//   }
//   throw error;
// }

// function shouldCacheUrl(url) {
//   const urlPath = new URL(url).pathname;
//   return CACHEABLE_URL_PATTERNS.some((pattern) => pattern.test(urlPath));
// }
