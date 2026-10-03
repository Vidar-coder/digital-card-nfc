"use client";

import { ExternalLink, Monitor, Signal, Smartphone, Wifi } from "lucide-react";
import { useState } from "react";
import { ProfileView } from "@/components/profile/profile-view";
import { cn } from "@/lib/utils";
import { useDashboard } from "./dashboard-context";

function PhoneStatusBar() {
  return (
    <div
      className="relative z-10 flex h-11 shrink-0 items-end justify-between px-6 pb-1.5 text-[11px] font-semibold text-white"
      aria-hidden
    >
      <span>9:41</span>
      <div className="flex items-center gap-1.5 opacity-90">
        <Signal className="size-3.5" strokeWidth={2.5} />
        <Wifi className="size-3.5" strokeWidth={2.5} />
        <span className="ml-0.5 inline-block h-2.5 w-5 rounded-[3px] border border-white/90 p-px">
          <span className="block h-full w-[70%] rounded-[1px] bg-white" />
        </span>
      </div>
    </div>
  );
}

function PhoneChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex h-full max-h-[min(720px,calc(100vh-12rem))] w-full max-w-[300px] flex-col justify-center py-1">
      <div className="relative flex min-h-0 flex-1 flex-col rounded-[2.75rem] bg-gradient-to-b from-zinc-700 to-zinc-900 p-[3px] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.45)] ring-1 ring-zinc-950/20">
        <div className="pointer-events-none absolute -left-[2px] top-[28%] h-14 w-[3px] rounded-l bg-zinc-800" aria-hidden />
        <div className="pointer-events-none absolute -left-[2px] top-[42%] h-10 w-[3px] rounded-l bg-zinc-800" aria-hidden />
        <div className="pointer-events-none absolute -right-[2px] top-[34%] h-16 w-[3px] rounded-r bg-zinc-800" aria-hidden />

        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[2.5rem] bg-black">
          <div
            className="pointer-events-none absolute left-1/2 top-2.5 z-20 h-[26px] w-[108px] -translate-x-1/2 rounded-full bg-black ring-1 ring-white/10"
            aria-hidden
          />
          <PhoneStatusBar />
          <div className="min-h-0 flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto overflow-x-hidden overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {children}
            </div>
          </div>
          <div className="flex shrink-0 justify-center pb-2 pt-1" aria-hidden>
            <div className="h-1 w-[34%] min-w-[96px] max-w-[120px] rounded-full bg-white/35" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Renders the unsaved draft with the real public component. */
export function LivePreview({ className }: { className?: string }) {
  const { draft, saved, isDirty } = useDashboard();
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
  const unsaved = isDirty(Object.keys(draft) as (keyof typeof draft)[]);

  return (
    <div className={cn("flex h-full flex-col bg-zinc-200/40", className)}>
      <div className="flex items-center justify-between gap-2 border-b border-zinc-200/80 bg-white/80 px-4 py-3 backdrop-blur-sm">
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

      <div className="flex min-h-0 flex-1 items-stretch justify-center overflow-hidden p-4">
        {device === "mobile" ? (
          <PhoneChrome>
            <ProfileView profile={draft} preview className="min-h-full @container" />
          </PhoneChrome>
        ) : (
          <div className="flex h-full w-full min-h-0 flex-col overflow-hidden rounded-xl bg-zinc-900 p-1.5 shadow-lg ring-1 ring-zinc-900/10">
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
        )}
      </div>
    </div>
  );
}
