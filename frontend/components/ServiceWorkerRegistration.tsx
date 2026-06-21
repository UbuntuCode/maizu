"use client";
import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });

        /* Check for updates every time the app loads */
        registration.update();

        /* When a new SW is found and installed, activate it immediately
           so users always get the latest version without manual refresh */
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              newWorker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });

        console.log("Maizu service worker registered:", registration.scope);
      } catch (err) {
        console.error("Service worker registration failed:", err);
      }
    };

    /* Register after the page has fully loaded so it doesn't compete
       with critical rendering resources */
    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register);
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
