"use client";

import { ExternalLink, Monitor, Smartphone } from "lucide-react";
import { useState } from "react";
import { ProfileView } from "@/components/profile/profile-view";
import { cn } from "@/lib/utils";
import { useDashboard } from "./dashboard-context";
import { PhoneDeviceFrame, PhonePreviewStage } from "./phone-device-frame";

/** Renders the unsaved draft with the real public component. */
export function LivePreview({ className }: { className?: string }) {
  const { draft, saved, isDirty } = useDashboard();
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
  const unsaved = isDirty(Object.keys(draft) as (keyof typeof draft)[]);
  const darkScreen = draft.theme.mode === "dark";

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-zinc-200/80 bg-white/90 px-4 py-2.5 backdrop-blur-sm">
        <div className="flex min-w-0 items-center gap-2">
          <span className="relative flex size-2 shrink-0">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:hidden" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          <span className="truncate text-sm font-medium text-zinc-900">Live preview</span>
          {unsaved && <span className="hidden text-xs text-amber-600 sm:inline">· unsaved</span>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
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

      {device === "mobile" ? (
        <PhonePreviewStage>
          <PhoneDeviceFrame darkScreen={darkScreen}>
            <ProfileView profile={draft} preview phonePreview className="h-full min-h-0" />
          </PhoneDeviceFrame>
        </PhonePreviewStage>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 sm:p-4">
          <div className="mx-auto flex h-full w-full min-h-0 max-w-3xl flex-col overflow-hidden rounded-xl bg-zinc-900 p-1.5 shadow-xl ring-1 ring-zinc-900/10">
            <div className="flex h-9 shrink-0 items-center gap-2 rounded-t-lg bg-zinc-800 px-3">
              <span className="size-2.5 rounded-full bg-red-400" aria-hidden />
              <span className="size-2.5 rounded-full bg-amber-400" aria-hidden />
              <span className="size-2.5 rounded-full bg-emerald-400" aria-hidden />
              <span className="ml-2 truncate text-xs text-zinc-400">/p/{saved.username}</span>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden rounded-b-lg [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <ProfileView profile={draft} preview className="min-h-full" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
