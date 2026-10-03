import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-2xl border border-zinc-200/80 bg-white shadow-xs", className)}>{children}</div>;
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4 border-b border-zinc-100 px-5 py-4", className)}>
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold text-zinc-900">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-zinc-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60 px-6 py-10 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-white text-zinc-500 shadow-xs ring-1 ring-zinc-200">
        <Icon className="size-5" aria-hidden />
      </span>
      <h3 className="mt-3 text-sm font-semibold text-zinc-900">{title}</h3>
      <p className="mt-1 max-w-xs text-sm text-zinc-500">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "brand" }) {
  const tones = {
    neutral: "bg-zinc-100 text-zinc-700",
    success: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    warning: "bg-amber-50 text-amber-700 ring-amber-600/20",
    brand: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-transparent ring-inset", tones[tone])}>
      {children}
    </span>
  );
}
