/* Legatum · service worker mínimo: deja la app abrirse sin red. */
const CACHE = "legatum-narrador-v3";
const BASE = ["/narrador/", "/narrador/manifest.webmanifest"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(BASE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  // El manifest personal y el enlace de acceso llevan la llave del narrador: nunca a caché.
  if (url.pathname.startsWith("/narrador/manifiesto/")) return;
  const conLlave = url.searchParams.has("acceso");
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.status === 200 && !conLlave && (url.pathname.startsWith("/narrador") || url.pathname.startsWith("/_next/") || url.pathname.startsWith("/assets-next/"))) {
          const copia = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copia));
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || (req.mode === "navigate" ? caches.match("/narrador/") : undefined)))
  );
});
