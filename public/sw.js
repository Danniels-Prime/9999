const CACHE = 'lucidland-v3';
const SHELL  = '/9999/';

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll([SHELL])));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // Network-first for API calls, cache-first for app shell
  if (e.request.url.includes('api.anthropic') ||
      e.request.url.includes('openrouter') ||
      e.request.url.includes('openai.com') ||
      e.request.url.includes('deepseek')) {
    return; // let API calls go straight to network
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
