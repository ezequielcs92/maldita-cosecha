const CACHE_NAME = "maldita-cosecha-v2";
const SCOPE_URL = new URL(self.registration.scope);
const scopedPath = (path) => new URL(path.replace(/^\//, ""), SCOPE_URL).pathname;
const APP_ASSETS = [
  scopedPath("icons/icon-192.png"),
  scopedPath("icons/icon-512.png"),
  scopedPath("marcador-plagas.png"),
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => (await caches.match(request)) || (await caches.match(scopedPath("")))),
    );
    return;
  }

  if (
    url.pathname.startsWith(scopedPath("_next/static/")) ||
    url.pathname.startsWith(scopedPath("cards/")) ||
    url.pathname.startsWith(scopedPath("icons/")) ||
    /\.(?:png|jpg|jpeg|webp|gif|woff2?)$/i.test(url.pathname)
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
  }
});
