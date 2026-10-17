// App shell only (bump CACHE to clear). env.js, /api/ and Jellyfin requests are never handled here, so they always hit the network.
const CACHE = "wrapped-shell-v1";
self.addEventListener("fetch", (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  if (url.pathname.startsWith("/assets/")) { // hashed and immutable: cache first
    e.respondWith(caches.open(CACHE).then(async (c) => (await c.match(req)) ?? fetch(req).then((r) => { if (r.ok) c.put(req, r.clone()); return r; })));
  } else if (req.mode === "navigate") { // network first; last good page when offline
    e.respondWith(fetch(req).then((r) => { if (r.ok) caches.open(CACHE).then((c) => c.put("/index.html", r.clone())); return r; }).catch(() => caches.match("/index.html")));
  }
});
