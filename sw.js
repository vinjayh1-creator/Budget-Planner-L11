const CACHE_PREFIX = "budget-planner-static-";
const CACHE_NAME = `${CACHE_PREFIX}v11`;
const APP_FILES = [
  "./", "index.html", "manifest.json", "lucide.min.js",
  "icons/apple-touch-icon-180.png", "icons/favicon-16.png",
  "icons/favicon-32.png", "icons/icon-192.png", "icons/icon-512.png",
];
const appUrls = new Set(APP_FILES.map(path => new URL(path, self.registration.scope).href));
const homeUrl = new URL("./", self.registration.scope).href;

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll([...appUrls])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || !appUrls.has(url.href) || request.headers.has("Authorization")) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const response = await fetch(request);
      if (response.ok && response.type === "basic" && !response.headers.has("Set-Cookie")) {
        await cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      const cached = await cache.match(request) || (request.mode === "navigate" ? await cache.match(homeUrl) : undefined);
      if (cached) return cached;
      throw error;
    }
  })());
});