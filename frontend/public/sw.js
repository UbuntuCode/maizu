/* ============================================================
   MAIZU SERVICE WORKER
   Handles offline caching so the app works without internet
   ============================================================ */

const CACHE_NAME    = "maizu-v1";
const OFFLINE_URL   = "/offline";

/* Assets to cache immediately on install */
const PRECACHE_URLS = [
  "/",
  "/stores",
  "/offline",
  "/manifest.json",
];

/* ── INSTALL ─────────────────────────────────────────────────
   Runs once when the service worker is first installed.
   Pre-caches the most important pages.
─────────────────────────────────────────────────────────────*/
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch(() => {
        /* Silently ignore if offline pages can't be cached */
      });
    })
  );
  /* Take control immediately — don't wait for old SW to expire */
  self.skipWaiting();
});

/* ── ACTIVATE ────────────────────────────────────────────────
   Runs when a new service worker takes over.
   Cleans up old caches from previous versions.
─────────────────────────────────────────────────────────────*/
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

/* ── FETCH ───────────────────────────────────────────────────
   Intercepts every network request.
   Strategy:
   - API calls → Network first, fall back to cache
   - Pages     → Network first, fall back to offline page
   - Assets    → Cache first, fall back to network
─────────────────────────────────────────────────────────────*/
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  /* Skip non-GET requests and browser extensions */
  if (request.method !== "GET") return;
  if (!url.protocol.startsWith("http")) return;

  /* API calls — always try network, don't cache responses */
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({ success: false, message: "You are offline. Please check your internet connection." }),
          { headers: { "Content-Type": "application/json" } }
        );
      })
    );
    return;
  }

  /* Static assets (JS, CSS, images) — cache first */
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".ico")
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  /* HTML pages — network first, fall back to offline page */
  event.respondWith(
    fetch(request)
      .then((response) => {
        /* Cache successful page responses */
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        /* Try cache first, then offline page */
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          return caches.match(OFFLINE_URL);
        });
      })
  );
});

/* ── PUSH NOTIFICATIONS (ready for future use) ───────────────*/
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();

  event.waitUntil(
    self.registration.showNotification(data.title || "Maizu", {
      body:    data.body    || "You have a new notification",
      icon:    data.icon    || "/icons/icon-192x192.png",
      badge:   data.badge   || "/icons/icon-72x72.png",
      data:    data.url     || "/",
      actions: data.actions || [],
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data || "/")
  );
});
