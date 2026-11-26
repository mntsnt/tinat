"use client";

import { useEffect } from "react";

export function OfflineServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registration failure must not block the application.
      });
    }
  }, []);
  return null;
}
