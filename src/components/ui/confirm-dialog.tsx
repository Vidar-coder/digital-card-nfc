"use client";

import { AlertTriangle } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "./button";

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  destructive?: boolean;
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/** `const confirm = useConfirm(); if (await confirm({...})) …` */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return ctx;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<(v: boolean) => void>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const confirm = useCallback<ConfirmFn>((o) => {
    setOpts(o);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (opts && !d.open) d.showModal();
    if (!opts && d.open) d.close();
  }, [opts]);

  const close = (value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setOpts(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <dialog
        ref={dialogRef}
        onCancel={(e) => {
          e.preventDefault();
          close(false);
        }}
        onClick={(e) => e.target === dialogRef.current && close(false)}
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl bg-white p-0 shadow-2xl backdrop:bg-zinc-950/40 backdrop:backdrop-blur-[2px]"
        aria-labelledby="confirm-title"
      >
        {opts && (
          <div className="p-6">
            <div className="flex gap-4">
              {opts.destructive && (
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                  <AlertTriangle className="size-5" aria-hidden />
                </span>
              )}
              <div>
                <h2 id="confirm-title" className="font-semibold text-zinc-900">
                  {opts.title}
                </h2>
                {opts.description && <p className="mt-1 text-sm text-zinc-600">{opts.description}</p>}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => close(false)}>
                Cancel
              </Button>
              <Button variant={opts.destructive ? "danger" : "primary"} onClick={() => close(true)} autoFocus>
                {opts.confirmLabel ?? "Confirm"}
              </Button>
            </div>
          </div>
        )}
      </dialog>
    </ConfirmContext.Provider>
  );
}
