"use client";

import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { checkUsernameAction } from "@/app/dashboard/actions";
import { Field } from "@/components/ui/field";
import { cn, normalizeUsername } from "@/lib/utils";

/** Username input with debounced live availability check. */
export function UsernameField({
  value,
  onChange,
  siteUrl,
  serverError,
  onAvailabilityChange,
}: {
  value: string;
  onChange: (v: string) => void;
  siteUrl: string;
  serverError?: string;
  onAvailabilityChange?: (ok: boolean) => void;
}) {
  // Result is keyed by the value it was computed for; anything else is "checking".
  const [result, setResult] = useState<{ for: string; available: boolean; message: string } | null>(null);

  useEffect(() => {
    if (!value) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      const res = await checkUsernameAction(value);
      if (cancelled) return;
      setResult({ for: value, ...res });
      onAvailabilityChange?.(res.available);
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const status: { state: "idle" | "checking" | "ok" | "bad"; message?: string } = !value
    ? { state: "idle" }
    : result?.for !== value
      ? { state: "checking" }
      : { state: result.available ? "ok" : "bad", message: result.message };

  const host = siteUrl.replace(/^https?:\/\//, "");
  const error = serverError ?? (status.state === "bad" ? status.message : undefined);

  return (
    <Field
      label="Username"
      error={error}
      hint={
        status.state === "ok" ? (
          <span className="inline-flex items-center gap-1 text-emerald-600">
            <CheckCircle2 className="size-3.5" /> {status.message}
          </span>
        ) : (
          "This is the URL you program into your NFC card."
        )
      }
    >
      {(p) => (
        <div
          className={cn(
            "flex h-10 items-center overflow-hidden rounded-lg border bg-white shadow-xs focus-within:ring-3",
            error ? "border-red-400 focus-within:ring-red-500/15" : "border-zinc-200 focus-within:border-brand focus-within:ring-brand/15",
          )}
        >
          <span className="hidden h-full items-center border-r border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-500 sm:flex">
            {host}/p/
          </span>
          <input
            {...p}
            value={value}
            onChange={(e) => onChange(normalizeUsername(e.target.value))}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            maxLength={30}
            className="h-full min-w-0 flex-1 px-3 text-sm outline-none"
            placeholder="yourname"
          />
          <span className="pr-3" aria-hidden>
            {status.state === "checking" && <Loader2 className="size-4 animate-spin text-zinc-400" />}
            {status.state === "ok" && <CheckCircle2 className="size-4 text-emerald-500" />}
            {status.state === "bad" && <XCircle className="size-4 text-red-500" />}
          </span>
        </div>
      )}
    </Field>
  );
}
