"use client";

import { Check, Copy, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/** Copies `text`, or the response body of `fetchUrl` (used for the full Code.gs). */
export function CopyButton({
  text,
  fetchUrl,
  label = "Copy",
  className,
}: {
  text?: string;
  fetchUrl?: string;
  label?: string;
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");

  async function copy() {
    setState("busy");
    try {
      const value = fetchUrl ? await (await fetch(fetchUrl)).text() : (text ?? "");
      await navigator.clipboard.writeText(value);
      setState("done");
      toast.success(fetchUrl ? "Apps Script code copied — paste it into Code.gs" : "Copied");
      setTimeout(() => setState("idle"), 1800);
    } catch {
      setState("idle");
      toast.error("Couldn't copy. Use the download button instead.");
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      disabled={state === "busy"}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-800 shadow-xs transition hover:bg-zinc-50 disabled:opacity-60",
        className,
      )}
    >
      {state === "busy" ? <Loader2 className="size-4 animate-spin" /> : state === "done" ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
      {state === "done" ? "Copied" : label}
    </button>
  );
}
