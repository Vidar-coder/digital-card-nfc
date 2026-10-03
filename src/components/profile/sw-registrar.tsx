"use client";

import { useEffect } from "react";

/** Registers the tiny offline-capable service worker (public/sw.js) in production. */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/p/" }).catch(() => {});
  }, []);
  return null;
}
