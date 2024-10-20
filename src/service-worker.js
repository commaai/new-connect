function isCloudflareEnvironment() {
  return typeof caches !== 'undefined' && 'default' in caches;
}

console.log('Is Cloudflare environment:', isCloudflareEnvironment());
console.log('Standard caches.open exists:', typeof caches !== 'undefined' && 'open' in caches);
console.log('Cloudflare caches.default exists:', typeof caches !== 'undefined' && 'default' in caches);

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request, event))
})

async function handleRequest(request, event) {
  const shouldCache = shouldCacheUrl(request.url)
  
  if (shouldCache) {
    return isCloudflareEnvironment() 
      ? handleCloudflareRequest(request, event)
      : handleStandardRequest(request);
  } else {
    console.log('Not caching, fetching from origin');
    return fetch(request);
  }
}

async function handleCloudflareRequest(request, event) {
  console.log('Using Cloudflare cache');
  const cache = caches.default;
  let response = await cache.match(request);

  if (response) {
    console.log('Cache hit');
    return response;
  }

  console.log('Cache miss, fetching from origin');
  response = await fetch(request);

  if (response.status === 200) {
    console.log('Caching response in Cloudflare cache');
    const cacheKey = new Request(request.url, request);
    const cacheOptions = {
      expirationTtl: 3600,
      cacheTags: ['my-tag']
    };
    event.waitUntil(cache.put(cacheKey, response.clone(), cacheOptions));
  }

  return response;
}

function isCloudflareEnvironment() {
  return typeof caches !== 'undefined' && 'default' in caches;
}

console.log('Is Cloudflare environment:', isCloudflareEnvironment());
console.log('Standard caches.open exists:', typeof caches !== 'undefined' && 'open' in caches);
console.log('Cloudflare caches.default exists:', typeof caches !== 'undefined' && 'default' in caches);

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request, event))
})

async function handleRequest(request, event) {
  const shouldCache = shouldCacheUrl(request.url)
  
  if (shouldCache) {
    return isCloudflareEnvironment() 
      ? handleCloudflareRequest(request, event)
      : handleStandardRequest(request);
  } else {
    console.log('Not caching, fetching from origin');
    return fetch(request);
  }
}

async function handleCloudflareRequest(request, event) {
  console.log('Using Cloudflare cache');
  const cache = caches.default;
  let response = await cache.match(request);

  if (response) {
    console.log('Cache hit');
    return response;
  }

  console.log('Cache miss, fetching from origin');
  response = await fetch(request);

  if (response.status === 200) {
    console.log('Caching response in Cloudflare cache');
    const cacheKey = new Request(request.url, request);
    const cacheOptions = {
      expirationTtl: 3600,
      cacheTags: ['my-tag']
    };
    event.waitUntil(cache.put(cacheKey, response.clone(), cacheOptions));
  }

  return response;
}

async function handleStandardRequest(request) {
  console.log('Using standard Cache API');
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    console.log('Cache hit');
    return cachedResponse;
  }

  console.log('Cache miss, fetching from network');
  const networkResponse = await fetch(request);

  if (networkResponse.status === 200) {
    console.log('Caching response in standard cache');
    const cache = await caches.open('my-cache');
    cache.put(request, networkResponse.clone());
  }

  return networkResponse;
}

function shouldCacheUrl(url) {
  return url.endsWith('.jpg') || url.endsWith('.png') || url.endsWith('.css') || url.endsWith('.js');
}

// Log additional API existence checks
console.log('event.waitUntil exists:', typeof addEventListener !== 'undefined' && 'waitUntil' in (addEventListener('fetch', e => e) || {}));
console.log('fetch exists:', typeof fetch !== 'undefined');
console.log('Request constructor exists:', typeof Request !== 'undefined');