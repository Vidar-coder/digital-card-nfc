"use client";

import { Loader2, UserRoundPlus } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  username: string;
  preview?: boolean;
  className?: string;
  compact?: boolean;
}

/**
 * Opens the vCard endpoint. Navigating (instead of a hidden <a download>) is
 * what makes iOS Safari show the native "Add to Contacts" sheet directly;
 * Android browsers download the .vcf and offer to open it in Contacts.
 */
export function SaveContactButton({ username, preview, className, compact }: Props) {
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        setBusy(true);
        const url = `/api/vcard/${encodeURIComponent(username)}${preview ? "?preview=1" : ""}`;
        // Full navigation to an API route (not a page) — needed for the native contact sheet.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = url;
        setTimeout(() => setBusy(false), 1800);
      }}
      className={cn(
        "p-btn inline-flex min-h-12 items-center justify-center gap-2 bg-p-button px-5 font-semibold text-p-button-text shadow-sm transition hover:brightness-110 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-p-button",
        className,
      )}
    >
      {busy ? <Loader2 className="size-5 animate-spin" /> : <UserRoundPlus className="size-5" />}
      {compact ? "Save" : "Save Contact"}
    </button>
  );
}
