"use client";

import { ExternalLink, Monitor, Smartphone } from "lucide-react";
import { useState } from "react";
import { ProfileView } from "@/components/profile/profile-view";
import { cn } from "@/lib/utils";
import { useDashboard } from "./dashboard-context";

/** Renders the unsaved draft with the real public component. */
export function LivePreview({ className }: { className?: string }) {
  const { draft, saved, isDirty } = useDashboard();
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
  const unsaved = isDirty(Object.keys(draft) as (keyof typeof draft)[]);

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:hidden" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-sm font-medium text-zinc-900">Live preview</span>
          {unsaved && <span className="text-xs text-amber-600">· unsaved changes</span>}
        </div>
        <div className="flex items-center gap-1">
          <div className="flex rounded-lg bg-zinc-200/70 p-0.5" role="group" aria-label="Preview device">
            {(["mobile", "desktop"] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDevice(d)}
                aria-pressed={device === d}
                aria-label={d === "mobile" ? "Phone preview" : "Wide preview"}
                className={cn(
                  "rounded-md p-1.5 text-zinc-500 transition",
                  device === d && "bg-white text-zinc-900 shadow-xs",
                )}
              >
                {d === "mobile" ? <Smartphone className="size-4" /> : <Monitor className="size-4" />}
              </button>
            ))}
          </div>
          <a
            href={`/p/${saved.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-200/70 hover:text-zinc-900"
            aria-label="Open public card"
            title="Open public card"
          >
            <ExternalLink className="size-4" />
          </a>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 justify-center overflow-hidden px-4 pb-4">
        <div
          className={cn(
            "relative h-full overflow-hidden bg-zinc-900 shadow-2xl ring-1 ring-zinc-900/10 transition-all",
            device === "mobile" ? "w-full max-w-[380px] rounded-[2.5rem] p-2.5" : "w-full rounded-xl p-1.5",
          )}
        >
          {device === "mobile" && (
            <div className="absolute left-1/2 top-4 z-30 h-5 w-24 -translate-x-1/2 rounded-full bg-zinc-900" aria-hidden />
          )}
          <div
            className={cn(
              "scrollbar-thin h-full overflow-y-auto overflow-x-hidden bg-white",
              device === "mobile" ? "rounded-[2rem]" : "rounded-lg",
            )}
          >
            <ProfileView profile={draft} preview />
          </div>
        </div>
      </div>
    </div>
  );
}
