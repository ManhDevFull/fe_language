const SHELL_CACHE = "langues-shell-v2";
const RUNTIME_CACHE = "langues-runtime-v2";

const APP_SHELL = ["/", "/manifest.webmanifest", "/icons/icon-192.svg", "/icons/icon-512.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  const allowedCaches = new Set([SHELL_CACHE, RUNTIME_CACHE]);

  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((cacheName) => !allowedCaches.has(cacheName))
            .map((cacheName) => caches.delete(cacheName)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (requestUrl.pathname.startsWith("/api/")) {
    return;
  }

  const runtimeFetch = fetch(event.request)
    .then((networkResponse) => {
      if (!networkResponse || networkResponse.status !== 200) {
        return networkResponse;
      }

      const clonedResponse = networkResponse.clone();
      void caches.open(RUNTIME_CACHE).then((cache) => {
        void cache.put(event.request, clonedResponse);
      });

      return networkResponse;
    })
    .catch(() => caches.match(event.request));

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        event.waitUntil(runtimeFetch.then(() => undefined));
        return cachedResponse;
      }

      return runtimeFetch;
    }),
  );
});
