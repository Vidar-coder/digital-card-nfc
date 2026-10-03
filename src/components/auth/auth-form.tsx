"use client";

import { Eye, EyeOff } from "lucide-react";
import { useActionState, useState } from "react";
import type { AuthState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

export interface AuthField {
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  hint?: string;
  placeholder?: string;
}

/** Shared progressive-enhancement form for all auth screens (works without JS). */
export function AuthForm({
  action,
  fields,
  submitLabel,
  hidden,
  footer,
}: {
  action: (prev: AuthState, form: FormData) => Promise<AuthState>;
  fields: AuthField[];
  submitLabel: string;
  hidden?: Record<string, string>;
  footer?: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [showPw, setShowPw] = useState(false);

  if (state.message) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900" role="status">
        {state.message}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {hidden && Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">
          {state.error}
        </div>
      )}
      {fields.map((f) => {
        const isPw = f.type === "password";
        return (
          <Field key={f.name} label={f.label} hint={f.hint} error={state.fieldErrors?.[f.name]?.[0]}>
            {(p) => (
              <div className="relative">
                <Input
                  {...p}
                  name={f.name}
                  type={isPw && showPw ? "text" : (f.type ?? "text")}
                  autoComplete={f.autoComplete}
                  placeholder={f.placeholder}
                  defaultValue={state.values?.[f.name]}
                  className={isPw ? "pr-10" : undefined}
                  required
                />
                {isPw && (
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-zinc-400 hover:text-zinc-700"
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                )}
              </div>
            )}
          </Field>
        );
      })}
      <Button type="submit" size="lg" className="w-full" loading={pending}>
        {submitLabel}
      </Button>
      {footer}
    </form>
  );
}
