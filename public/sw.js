// CareerPilot service worker. Deliberately small: private pages (the board, the CV) are never cached — every page
// load goes to the network, and only when there is no connection is a friendly offline page shown instead.
const CACHE = "careerpilot-offline-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add(OFFLINE_URL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || request.mode !== "navigate") return;
  event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
});
