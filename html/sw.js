/* Offline course service worker — cache-first for packaged assets. */
const CACHE_FALLBACK = "cs-swe-course-v14";
let ACTIVE_CACHE = CACHE_FALLBACK;

async function resolveCacheName() {
  try {
    const res = await fetch("./offline-manifest.json", { cache: "no-cache" });
    const manifest = await res.json();
    return manifest.cacheName || CACHE_FALLBACK;
  } catch {
    return CACHE_FALLBACK;
  }
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    (async () => {
      ACTIVE_CACHE = await resolveCacheName();
      const res = await fetch("./offline-manifest.json", { cache: "no-cache" });
      const manifest = await res.json();
      const urls = [
        "./",
        ...manifest.pages,
        ...manifest.assets,
        ...manifest.pyodide,
      ].map((u) => new URL(u, self.registration.scope).href);
      const cache = await caches.open(ACTIVE_CACHE);
      for (const url of urls) {
        try {
          await cache.add(url);
        } catch (err) {
          console.warn("[sw] skip", url, err);
        }
      }
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      ACTIVE_CACHE = await resolveCacheName();
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== ACTIVE_CACHE).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  event.respondWith(
    (async () => {
      const cached = await caches.match(req, { ignoreSearch: true });
      if (cached) return cached;
      try {
        const fresh = await fetch(req);
        if (fresh && fresh.ok && new URL(req.url).origin === self.location.origin) {
          const cache = await caches.open(ACTIVE_CACHE);
          cache.put(req, fresh.clone());
        }
        return fresh;
      } catch {
        const fallback = await caches.match("./index.html");
        return fallback || new Response("Offline — asset not cached.", { status: 503 });
      }
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  if (event.data && event.data.type === "CLEAR_CACHE") {
    event.waitUntil(
      (async () => {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      })()
    );
  }
});
