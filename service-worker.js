const CACHE = "profitcalc-v3";

// список для OFFLINE
const FILES = [
  "./",
  "./index.html",
  "./spot.html",
  "./perp.html",
  "./strategy.html",

  "./css/main.css",
  "./css/spot.css",
  "./css/perp.css",
  "./css/strategy.css",

  "./js/spot.js",
  "./js/perp.js",
  "./js/binance.js",
  "./js/symbols.js",

  "./img/blank.png"
];

// установка SW
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(FILES))
  );
  self.skipWaiting();
});

// активация SW
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// обработка запросов
self.addEventListener("fetch", event => {
  event.respondWith(
    fetch(event.request)
      .then(resp => {
        const clone = resp.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, clone));
        return resp;
      })
      .catch(() => caches.match(event.request))
  );
});
