"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { track } from "@/lib/track";
import { cn } from "@/lib/utils";

interface Props {
  username: string;
  name: string;
  title?: string;
  preview?: boolean;
  className?: string;
  label?: string;
}

export function ShareProfileButton({ username, name, title, preview, className, label }: Props) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = `${window.location.origin}/p/${username}`;
    if (preview) {
      toast.info("Sharing is disabled in preview");
      return;
    }
    const data = { title: name, text: title ? `${name} — ${title}` : name, url };
    if (navigator.share && (!navigator.canShare || navigator.canShare(data))) {
      try {
        await navigator.share(data);
        track(username, "share", { method: "native" });
      } catch {
        /* user dismissed the share sheet */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Profile link copied");
      track(username, "share", { method: "copy" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy the link", { description: url });
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      aria-label={label ?? "Share profile"}
      className={cn("inline-flex items-center justify-center gap-2 transition active:scale-95", className)}
    >
      {copied ? <Check className="size-[18px]" /> : <Share2 className="size-[18px]" />}
      {label && <span>{copied ? "Copied" : label}</span>}
    </button>
  );
}
