const cachePrefix = "robey-productions-app-";
const cacheName = cachePrefix + "4";
const pages = new Map([
  ["/", "/"],
  ["/index.html", "/"],
  ["/install.html", "/install.html"]
]);
const appFiles = [
  "/app.webmanifest",
  "/install-app.js",
  "/assets/app-icon-192.png",
  "/assets/app-icon-512.png",
  "/assets/app-icon-maskable-512.png"
];
const artwork = [
  "/favicon.ico?v=gold-1",
  "/favicon-96.png?v=gold-1",
  "/apple-touch-icon.png?v=gold-1",
  "/assets/arriving-at-ellis-island.jpg",
  "/assets/blanket.jpg",
  "/assets/douglass.jpg",
  "/assets/history.jpg",
  "/assets/humboldt-railhead.jpg",
  "/assets/indigenous-art.jpg",
  "/assets/indigenous-card-background.webp",
  "/assets/indigenous-portrait.jpg",
  "/assets/lincoln.jpg",
  "/assets/mapuche-family-1890.jpg",
  "/assets/military-card-background.webp",
  "/assets/military.jpg",
  "/assets/pfingsten-library.jpg",
  "/assets/politics-card-background.webp",
  "/assets/washington.jpg",
  "/assets/worlds-parliament-of-religions.jpg"
];
const staticFiles = new Set([...appFiles, ...artwork]);

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    const shell = [...new Set(pages.values()), ...appFiles];
    await cache.addAll(shell.map(path => new Request(path, {cache: "reload"})));
    await Promise.allSettled(artwork.map(path => cache.add(path)));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter(name => name.startsWith(cachePrefix) && name !== cacheName)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

async function networkFirst(event, cacheKey) {
  let response;
  try {
    response = await fetch(event.request);
  } catch {
    return (await caches.match(cacheKey, {cacheName})) ?? Response.error();
  }

  if (response.ok && !response.redirected) {
    const copy = response.clone();
    event.waitUntil(caches.open(cacheName)
      .then(cache => cache.put(cacheKey, copy))
      .catch(() => {}));
  }
  return response;
}

self.addEventListener("fetch", event => {
  const {request} = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    const page = pages.get(url.pathname);
    if (page) event.respondWith(networkFirst(event, page));
    return;
  }

  const path = url.pathname + url.search;
  const isArtwork = request.destination === "image" && url.pathname.startsWith("/assets/") && !url.search;
  if (staticFiles.has(path) || isArtwork) event.respondWith(networkFirst(event, path));
});
