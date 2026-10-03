"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-zinc-200 bg-white px-6 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-red-50 text-red-600">
        <AlertTriangle className="size-6" />
      </span>
      <h2 className="mt-4 font-semibold text-zinc-900">Something went wrong</h2>
      <p className="mt-1 max-w-sm text-sm text-zinc-500">
        We couldn&apos;t load this page. Your saved data is safe.
        {error.digest && <span className="mt-1 block font-mono text-xs text-zinc-400">Ref: {error.digest}</span>}
      </p>
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
