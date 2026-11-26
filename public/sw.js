const STATIC_CACHE = "tinat-static-v4";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("tinat-") && key !== STATIC_CACHE)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET") return;

  // Documents & HTML navigations: ALWAYS Network-First so updates show immediately, fallback to cache when offline
  if (
    url.origin === self.location.origin &&
    (request.destination === "document" || request.mode === "navigate")
  ) {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);
          if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            await cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          const cached = await caches.match(request);
          if (cached) return cached;
          return new Response("Offline resource unavailable", { status: 503 });
        }
      })()
    );
    return;
  }

  // Static assets (images, fonts, styles): Cache-First with network fallback
  if (
    url.origin === self.location.origin &&
    (request.destination === "image" ||
      request.destination === "script" ||
      request.destination === "style")
  ) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response.ok) {
            const cache = await caches.open(STATIC_CACHE);
            await cache.put(request, response.clone());
          }
          return response;
        } catch {
          return new Response("Offline resource unavailable", { status: 503 });
        }
      })()
    );
  }
});
