"use client";

import { ExternalLink, Monitor, Signal, Smartphone, Wifi } from "lucide-react";
import { useState } from "react";
import { ProfileView } from "@/components/profile/profile-view";
import { cn } from "@/lib/utils";
import { useDashboard } from "./dashboard-context";

function PhoneStatusBar({ dark }: { dark?: boolean }) {
  return (
    <div
      className={cn(
        "relative z-10 flex h-12 shrink-0 items-end justify-between px-7 pb-1 text-[11px] font-semibold",
        dark ? "text-white" : "text-zinc-900",
      )}
      aria-hidden
    >
      <span>9:41</span>
      <div className="flex items-center gap-1.5 opacity-90">
        <Signal className="size-3.5" strokeWidth={2.5} />
        <Wifi className="size-3.5" strokeWidth={2.5} />
        <span
          className={cn(
            "ml-0.5 inline-block h-2.5 w-5 rounded-[3px] border p-px",
            dark ? "border-white/90" : "border-zinc-900/80",
          )}
        >
          <span className={cn("block h-full w-[70%] rounded-[1px]", dark ? "bg-white" : "bg-zinc-900")} />
        </span>
      </div>
    </div>
  );
}

function PhoneChrome({ children, darkScreen }: { children: React.ReactNode; darkScreen?: boolean }) {
  return (
    <div className="mx-auto flex h-full w-full max-w-[320px] flex-col justify-center py-2">
      {/* Metallic outer shell */}
      <div className="relative flex min-h-0 flex-1 flex-col rounded-[3rem] bg-gradient-to-b from-zinc-300 via-zinc-200 to-zinc-400 p-[2px] shadow-[0_28px_56px_-16px_rgba(0,0,0,0.35)]">
        {/* Side buttons */}
        <div
          className="pointer-events-none absolute -left-[3px] top-[22%] z-10 h-7 w-[3px] rounded-l-sm bg-zinc-400"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-[3px] top-[30%] z-10 h-12 w-[3px] rounded-l-sm bg-zinc-400"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-[3px] top-[40%] z-10 h-12 w-[3px] rounded-l-sm bg-zinc-400"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-[3px] top-[32%] z-10 h-16 w-[3px] rounded-r-sm bg-zinc-400"
          aria-hidden
        />

        {/* Black bezel */}
        <div className="flex min-h-0 flex-1 flex-col rounded-[2.9rem] bg-black p-3">
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[2.15rem] bg-black">
            <div
              className="pointer-events-none absolute left-1/2 top-3 z-30 h-[30px] w-[112px] -translate-x-1/2 rounded-full bg-black ring-1 ring-white/10"
              aria-hidden
            />
            <PhoneStatusBar dark={darkScreen} />
            <div className="relative min-h-0 flex-1 overflow-hidden">{children}</div>
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
  const darkScreen = draft.theme.mode === "dark";

  return (
    <div className={cn("flex h-full flex-col bg-zinc-200/50", className)}>
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

      <div className="flex min-h-0 flex-1 items-stretch justify-center overflow-hidden p-3 sm:p-4">
        {device === "mobile" ? (
          <PhoneChrome darkScreen={darkScreen}>
            <ProfileView profile={draft} preview phonePreview className="h-full min-h-0" />
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
