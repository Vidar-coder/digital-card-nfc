"use client";

import { Eye, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { BrandMark } from "@/components/brand-mark";
import { ConfirmProvider } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { DashboardSidebar } from "./dashboard-sidebar";
import { LivePreview } from "./live-preview";

const NO_PREVIEW = ["/dashboard/analytics", "/dashboard/account", "/dashboard/share", "/dashboard/database"];

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const showPreview = !NO_PREVIEW.some((p) => pathname.startsWith(p));

  useEffect(() => {
    document.body.style.overflow = navOpen || previewOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [navOpen, previewOpen]);

  return (
    <ConfirmProvider>
      <div className="min-h-dvh bg-zinc-50">
        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-zinc-200 bg-zinc-50/80 backdrop-blur lg:block">
          <DashboardSidebar />
        </aside>

        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-zinc-200 bg-white/90 px-4 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            className="-ml-2 rounded-lg p-2 text-zinc-700 hover:bg-zinc-100"
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </button>
          <BrandMark size={26} />
          {showPreview ? (
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="-mr-2 rounded-lg p-2 text-zinc-700 hover:bg-zinc-100"
              aria-label="Open live preview"
            >
              <Eye className="size-5" />
            </button>
          ) : (
            <span className="w-9" />
          )}
        </header>

        {/* Mobile nav drawer */}
        <div className={cn("fixed inset-0 z-50 lg:hidden", navOpen ? "visible" : "invisible")} aria-hidden={!navOpen}>
          <div
            className={cn("absolute inset-0 bg-zinc-950/40 transition-opacity", navOpen ? "opacity-100" : "opacity-0")}
            onClick={() => setNavOpen(false)}
          />
          <div
            className={cn(
              "absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-zinc-50 shadow-xl transition-transform",
              navOpen ? "translate-x-0" : "-translate-x-full",
            )}
          >
            <button
              type="button"
              onClick={() => setNavOpen(false)}
              className="absolute right-3 top-4 rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-200"
              aria-label="Close navigation"
            >
              <X className="size-5" />
            </button>
            <DashboardSidebar onNavigate={() => setNavOpen(false)} />
          </div>
        </div>

        <div className={cn("lg:pl-64", showPreview && "2xl:pr-[440px]")}>
          <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:py-10">{children}</main>
        </div>

        {/* Desktop live preview */}
        {showPreview && (
          <aside className="fixed inset-y-0 right-0 z-20 hidden w-[440px] border-l border-zinc-200 bg-zinc-100/70 2xl:block">
            <LivePreview />
          </aside>
        )}

        {/* Floating preview button for < 2xl */}
        {showPreview && (
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="fixed bottom-5 right-5 z-30 hidden items-center gap-2 rounded-full bg-zinc-900 px-4 py-3 text-sm font-medium text-white shadow-lg hover:bg-zinc-800 lg:flex 2xl:hidden"
          >
            <Eye className="size-4" /> Preview
          </button>
        )}

        {/* Preview sheet */}
        {previewOpen && (
          <div className="fixed inset-0 z-50 2xl:hidden" role="dialog" aria-modal="true" aria-label="Live preview">
            <div className="absolute inset-0 bg-zinc-950/50" onClick={() => setPreviewOpen(false)} />
            <div className="absolute inset-x-0 bottom-0 top-6 rounded-t-3xl bg-zinc-100 shadow-2xl sm:inset-y-4 sm:left-auto sm:right-4 sm:w-[440px] sm:rounded-3xl">
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-white p-1.5 text-zinc-700 shadow-md sm:left-auto sm:right-3 sm:top-3 sm:translate-x-0"
                aria-label="Close preview"
              >
                <X className="size-4" />
              </button>
              <LivePreview />
            </div>
          </div>
        )}
      </div>
    </ConfirmProvider>
  );
}
