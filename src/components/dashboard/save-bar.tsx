"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
  label?: string;
}

/**
 * Sticky action bar shown at the bottom of an editor. Also warns before
 * leaving the page with unsaved changes and supports ⌘/Ctrl+S.
 */
export function SaveBar({ dirty, saving, onSave, onDiscard, label = "Save changes" }: Props) {
  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (!saving) onSave();
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      window.removeEventListener("keydown", onKey);
    };
  }, [dirty, saving, onSave]);

  return (
    // Only sticks while there is something to save, so pages with two
    // independent editors never stack two floating bars on top of each other.
    <div className={cn("bottom-4 z-10 mt-6", dirty && "sticky")}>
      <div
        className={cn(
          "flex items-center justify-between gap-3 rounded-2xl border bg-white/95 px-4 py-3 shadow-lg backdrop-blur transition",
          dirty ? "border-zinc-200" : "border-zinc-100 shadow-sm",
        )}
      >
        <p className="text-sm text-zinc-600" aria-live="polite">
          {dirty ? (
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-amber-500" aria-hidden /> Unsaved changes
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500" aria-hidden /> All changes saved
            </span>
          )}
        </p>
        <div className="flex gap-2">
          {dirty && (
            <Button variant="ghost" size="md" onClick={onDiscard} disabled={saving}>
              Discard
            </Button>
          )}
          <Button onClick={onSave} loading={saving} disabled={!dirty}>
            {label}
          </Button>
        </div>
      </div>
    </div>
  );
}
