const CACHE = "profitcalc-v1";

// файлы, которые будут доступны оффлайн
const OFFLINE_URLS = [
  "/profit-calc/",
  "/profit-calc/index.html",
  "/profit-calc/css/main.css",
  "/profit-calc/css/spot.css",
  "/profit-calc/js/spot.js",
  "/profit-calc/js/perp.js",
  "/profit-calc/js/strategy.js",
  "/profit-calc/js/binance.js",
  "/profit-calc/js/symbols.js",
  "/profit-calc/js/offline.js",
  "/profit-calc/img/blank.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(OFFLINE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // обновляем кеш
        const clone = response.clone();
        caches.open(CACHE).then((cache) => {
          cache.put(event.request, clone);
        });
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
