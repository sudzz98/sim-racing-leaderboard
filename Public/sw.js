// public/sw.js
const CACHE_NAME = "victory-sim-cache-v3"; // bump this when you change files
const OFFLINE_URL = "/offline.html";

// Install: cache offline page (and optionally the start page)
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll([OFFLINE_URL, "/"]);
      self.skipWaiting();
    })()
  );
});

// Activate: clear old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => (k === CACHE_NAME ? null : caches.delete(k))));
      self.clients.claim();
    })()
  );
});

// Fetch strategy:
// - Navigations: try network, fall back to cached "/" (the real app), then offline.html
// - Other GET same-origin: cache as you go, and serve from cache if offline
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only handle GET
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Handle page navigations (typing URL, opening PWA, refreshing)
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(CACHE_NAME);
          cache.put("/", fresh.clone()); // keep latest app shell
          return fresh;
        } catch (e) {
          // Offline: serve the cached app shell first (so inputs still work)
          const cachedApp = await caches.match("/");
          if (cachedApp) return cachedApp;

          // If nothing cached, show offline page
          return caches.match(OFFLINE_URL);
        }
      })()
    );
    return;
  }

  // Same-origin assets (js/css/images): cache-first with runtime caching
  if (url.origin === self.location.origin) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(req);
        if (cached) return cached;

        try {
          const res = await fetch(req);
          const cache = await caches.open(CACHE_NAME);
          cache.put(req, res.clone());
          return res;
        } catch (e) {
          // If it’s an image and missing, just fail normally
          return cached || Response.error();
        }
      })()
    );
  }
});