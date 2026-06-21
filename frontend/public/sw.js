/* ════════════════════════════════════════════════════════════
   MAIZU SERVICE WORKER
   Provides: offline support, smart caching, install reliability,
   and push notification handling (OneSignal-compatible)
════════════════════════════════════════════════════════════ */

const CACHE_VERSION = "maizu-v1";
const STATIC_CACHE   = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE  = `${CACHE_VERSION}-runtime`;
const IMAGE_CACHE     = `${CACHE_VERSION}-images`;

/* Core files needed for the app shell to work offline */
const PRECACHE_URLS = [
  "/",
  "/offline",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

/* ── INSTALL: cache the app shell ──────────────────────────── */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn("Precache failed for some assets:", err);
      });
    })
  );
  self.skipWaiting();
});

/* ── ACTIVATE: clean up old cache versions ─────────────────── */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("maizu-") && !key.startsWith(CACHE_VERSION))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

/* ── FETCH: smart caching strategy per request type ────────── */
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  /* Skip non-GET requests, API calls, and cross-origin payment/analytics calls */
  if (request.method !== "GET") return;
  if (url.pathname.startsWith("/api/")) return;
  if (url.origin.includes("railway.app")) return;
  if (url.origin.includes("flutterwave.com")) return;
  if (url.origin.includes("payfast.co.za")) return;
  if (url.origin.includes("supabase.co")) return;

  /* Images — cache-first (they rarely change once uploaded) */
  if (request.destination === "image") {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request)
            .then((response) => {
              if (response.ok) cache.put(request, response.clone());
              return response;
            })
            .catch(() => cached); /* fail silently if offline and not cached */
        })
      )
    );
    return;
  }

  /* Navigation requests (page loads) — network-first, falls back to cache, then offline page */
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match("/offline"))
        )
    );
    return;
  }

  /* Everything else (JS, CSS, fonts) — stale-while-revalidate */
  event.respondWith(
    caches.open(RUNTIME_CACHE).then((cache) =>
      cache.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    )
  );
});

/* ── PUSH NOTIFICATIONS ─────────────────────────────────────
   OneSignal injects its own service worker logic when configured,
   but this handles basic push events too so notifications work
   even before OneSignal is fully wired up.
──────────────────────────────────────────────────────────────── */
self.addEventListener("push", (event) => {
  let data = { title: "Maizu", body: "You have a new update.", url: "/" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    if (event.data) data.body = event.data.text();
  }

  const options = {
    body:  data.body,
    icon:  "/icons/icon-192x192.png",
    badge: "/icons/icon-96x96.png",
    data:  { url: data.url || "/" },
    vibrate: [100, 50, 100],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

/* ── NOTIFICATION CLICK: open the relevant page ─────────────── */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsArr) => {
      const existing = clientsArr.find((c) => c.url.includes(targetUrl));
      if (existing) return existing.focus();
      return self.clients.openWindow(targetUrl);
    })
  );
});

/* ── BACKGROUND SYNC (placeholder for future order queue) ───── */
self.addEventListener("sync", (event) => {
  if (event.tag === "maizu-sync-orders") {
    /* Future: retry failed order submissions made while offline */
    console.log("Background sync triggered: maizu-sync-orders");
  }
});
