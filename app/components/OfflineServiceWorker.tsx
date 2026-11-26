"use client";

import { useEffect } from "react";

export function OfflineServiceWorker() {
  useEffect(() => {
    // Purge any stale legacy service worker caches immediately
    if (typeof window !== "undefined" && "caches" in window) {
      caches.keys().then((keys) => {
        keys.forEach((key) => {
          if (key.startsWith("tinat-") && key !== "tinat-static-v4") {
            caches.delete(key);
          }
        });
      });
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          reg.update();
        })
        .catch(() => {
          // Registration failure must not block the application.
        });
    }
  }, []);
  return null;
}

