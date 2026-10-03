import { Signal, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";

/** Logical viewport of a modern iPhone (390×844 pt class devices). */
export const PHONE_VIEWPORT_WIDTH = 390;
export const PHONE_VIEWPORT_HEIGHT = 844;

function PhoneStatusBar({ dark }: { dark?: boolean }) {
  return (
    <div
      className={cn(
        "relative z-10 flex h-11 shrink-0 items-end justify-between px-6 pb-0.5 text-[11px] font-semibold tracking-tight",
        dark ? "text-white" : "text-zinc-900",
      )}
      aria-hidden
    >
      <span className="tabular-nums">9:41</span>
      <div className="flex items-center gap-1.5 opacity-95">
        <Signal className="size-3.5" strokeWidth={2.5} />
        <Wifi className="size-3.5" strokeWidth={2.5} />
        <span
          className={cn(
            "ml-0.5 inline-flex h-[11px] w-[22px] items-center rounded-[3px] border p-px",
            dark ? "border-white/90" : "border-zinc-900/85",
          )}
        >
          <span className={cn("ml-auto mr-px block h-full w-[72%] rounded-[1px]", dark ? "bg-white" : "bg-zinc-900")} />
        </span>
      </div>
    </div>
  );
}

type PhoneDeviceFrameProps = {
  children: React.ReactNode;
  darkScreen?: boolean;
  className?: string;
};

/**
 * Scaled iPhone-style frame: fixed 390×844 logical screen, shrunk to fit the
 * preview panel via container query scale (see `.phone-preview-stage`).
 */
export function PhoneDeviceFrame({ children, darkScreen, className }: PhoneDeviceFrameProps) {
  return (
    <div
      className={cn("phone-device-frame relative shrink-0", className)}
      style={{ width: PHONE_VIEWPORT_WIDTH, height: PHONE_VIEWPORT_HEIGHT }}
    >
      {/* Titanium-style outer shell */}
      <div className="absolute inset-0 rounded-[3.25rem] bg-gradient-to-b from-zinc-400 via-zinc-300 to-zinc-500 p-[3px] shadow-[0_32px_64px_-20px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.35)_inset]">
        {/* Side buttons */}
        <div className="pointer-events-none absolute -left-[2px] top-[19%] z-10 h-8 w-[2px] rounded-l-sm bg-zinc-500/90" aria-hidden />
        <div className="pointer-events-none absolute -left-[2px] top-[27%] z-10 h-14 w-[2px] rounded-l-sm bg-zinc-500/90" aria-hidden />
        <div className="pointer-events-none absolute -left-[2px] top-[37%] z-10 h-14 w-[2px] rounded-l-sm bg-zinc-500/90" aria-hidden />
        <div className="pointer-events-none absolute -right-[2px] top-[30%] z-10 h-[4.5rem] w-[2px] rounded-r-sm bg-zinc-500/90" aria-hidden />

        <div className="flex h-full flex-col rounded-[3.1rem] bg-zinc-950 p-[10px]">
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[2.65rem] bg-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
            {/* Dynamic Island */}
            <div
              className="pointer-events-none absolute left-1/2 top-[10px] z-30 h-[28px] w-[118px] -translate-x-1/2 rounded-full bg-black shadow-[0_0_0_1px_rgba(255,255,255,0.08),inset_0_-1px_2px_rgba(255,255,255,0.06)]"
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

/** Centers the phone and scales it down to fit available height/width. */
export function PhonePreviewStage({ children }: { children: React.ReactNode }) {
  return (
    <div className="phone-preview-stage flex min-h-0 flex-1 items-center justify-center overflow-hidden px-3 py-4">
      <div className="phone-preview-scale">{children}</div>
    </div>
  );
}
