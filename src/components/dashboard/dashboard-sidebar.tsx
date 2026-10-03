"use client";

import { ExternalLink, FileSpreadsheet, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/dashboard/actions";
import { BrandMark } from "@/components/brand-mark";
import { SITE_NAME } from "@/lib/config";
import { profileCompletion } from "@/lib/completion";
import { cn, initials } from "@/lib/utils";
import { CompletionRing } from "./completion-ring";
import { useDashboard } from "./dashboard-context";
import { NAV_GROUPS } from "./nav";

export function DashboardSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { draft, saved, email, settings, role } = useDashboard();
  const groups = NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => !i.adminOnly || role === "admin") })).filter(
    (g) => g.items.length > 0,
  );
  const sheetUrl = role === "admin" ? settings.google_sheet_url : undefined;
  const { percent } = profileCompletion(draft);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <BrandMark size={28} />
        <span className="font-semibold tracking-tight text-zinc-900">{SITE_NAME}</span>
      </div>

      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="mx-3 mb-3 flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 shadow-xs transition hover:border-zinc-300"
      >
        <CompletionRing percent={percent} size={40} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-zinc-900">Profile strength</p>
          <p className="text-xs text-zinc-500">{percent >= 100 ? "Looking great!" : "Complete your card"}</p>
        </div>
      </Link>

      <nav className="scrollbar-thin flex-1 space-y-5 overflow-y-auto px-3 pb-4" aria-label="Dashboard">
        {groups.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">{group.label}</p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium transition",
                        active ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
                      )}
                    >
                      <item.icon className="size-4 shrink-0" aria-hidden />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-zinc-200 p-3">
        {sheetUrl && (
          <a
            href={sheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-2 flex h-9 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-700 shadow-xs transition hover:bg-zinc-50"
          >
            <FileSpreadsheet className="size-4 text-emerald-600" aria-hidden /> Open Google Sheet
          </a>
        )}
        <a
          href={`/p/${saved.username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-2 flex h-9 items-center justify-center gap-2 rounded-lg bg-brand text-sm font-medium text-white shadow-sm transition hover:brightness-110"
        >
          View public card <ExternalLink className="size-3.5" aria-hidden />
        </a>
        <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700">
            {initials(draft.full_name || draft.username)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-900">{draft.full_name || draft.username}</p>
            <p className="truncate text-xs text-zinc-500">{email}</p>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
