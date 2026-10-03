"use client";

import type { AnalyticsEventType } from "./types";

/**
 * Fire-and-forget analytics ping. Uses sendBeacon so it survives navigation
 * (e.g. tapping a tel: link or an external social link).
 */
export function track(username: string, type: AnalyticsEventType, meta?: Record<string, string>) {
  if (!username) return;
  const body = JSON.stringify({ username, type, meta: meta ?? null });
  try {
    if (navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }))) return;
  } catch {
    /* fall through */
  }
  fetch("/api/track", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(
    () => {},
  );
}
