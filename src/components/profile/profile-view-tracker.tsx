"use client";

import { useEffect } from "react";
import { track } from "@/lib/track";

/**
 * Records a profile view once per page load. Runs client-side so link
 * previews, crawlers and prefetches don't inflate counts. `?src=qr` / `?src=nfc`
 * (encoded in the QR code and the NFC chip URL) attributes the visit.
 */
export function ProfileViewTracker({ username }: { username: string }) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const src = params.get("src");
    const source = src === "qr" || src === "nfc" ? src : document.referrer ? "referral" : "direct";

    const key = `viewed:${username}`;
    try {
      if (sessionStorage.getItem(key)) return; // one view per tab session
      sessionStorage.setItem(key, "1");
    } catch {
      /* storage blocked — still count */
    }

    track(username, "view", { source });
    if (source === "qr") track(username, "qr_scan");
    if (source === "nfc") track(username, "nfc_tap");

    // Clean the attribution param so shared links don't carry it along.
    if (src) {
      params.delete("src");
      const qs = params.toString();
      window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash);
    }
  }, [username]);

  return null;
}
