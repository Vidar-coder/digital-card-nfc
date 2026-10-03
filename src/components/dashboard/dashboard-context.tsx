"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { ActionResult, FullProfile } from "@/lib/types";

interface DashboardState {
  draft: FullProfile;
  saved: FullProfile;
  siteUrl: string;
  /** 13_Settings for this user (e.g. google_sheet_url) */
  settings: Record<string, string>;
  role: "admin" | "user";
  userId: string;
  email: string;
  setField: <K extends keyof FullProfile>(key: K, value: FullProfile[K]) => void;
  patch: (partial: Partial<FullProfile>) => void;
  markSaved: (keys: (keyof FullProfile)[]) => void;
  /** Sets draft AND saved (e.g. adopting server-assigned IDs after a save). */
  commit: (partial: Partial<FullProfile>) => void;
  discard: (keys: (keyof FullProfile)[]) => void;
  isDirty: (keys: (keyof FullProfile)[]) => boolean;
}

const Ctx = createContext<DashboardState | null>(null);

export function useDashboard() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDashboard must be used inside <DashboardProvider>");
  return ctx;
}

/**
 * Holds the editable draft of the owner's profile. Every editor writes to the
 * draft (which drives the live preview instantly); each section then persists
 * its own keys through a server action.
 */
export function DashboardProvider({
  initial,
  siteUrl,
  settings,
  role,
  userId,
  email,
  children,
}: {
  initial: FullProfile;
  siteUrl: string;
  /** 13_Settings for this user (e.g. google_sheet_url) */
  settings: Record<string, string>;
  role: "admin" | "user";
  userId: string;
  email: string;
  children: ReactNode;
}) {
  const [draft, setDraft] = useState(initial);
  const [saved, setSaved] = useState(initial);

  const setField = useCallback(<K extends keyof FullProfile>(key: K, value: FullProfile[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
  }, []);

  const patch = useCallback((partial: Partial<FullProfile>) => setDraft((d) => ({ ...d, ...partial })), []);

  const markSaved = useCallback(
    (keys: (keyof FullProfile)[]) => {
      setSaved((s) => {
        const next = { ...s };
        for (const k of keys) (next as Record<string, unknown>)[k] = draft[k];
        return next;
      });
    },
    [draft],
  );

  const commit = useCallback((partial: Partial<FullProfile>) => {
    setDraft((d) => ({ ...d, ...partial }));
    setSaved((s) => ({ ...s, ...partial }));
  }, []);

  const discard = useCallback(
    (keys: (keyof FullProfile)[]) => {
      setDraft((d) => {
        const next = { ...d };
        for (const k of keys) (next as Record<string, unknown>)[k] = saved[k];
        return next;
      });
    },
    [saved],
  );

  const isDirty = useCallback(
    (keys: (keyof FullProfile)[]) => keys.some((k) => JSON.stringify(draft[k]) !== JSON.stringify(saved[k])),
    [draft, saved],
  );

  const value = useMemo(
    () => ({ draft, saved, siteUrl, settings, role, userId, email, setField, patch, markSaved, commit, discard, isDirty }),
    [draft, saved, siteUrl, settings, role, userId, email, setField, patch, markSaved, commit, discard, isDirty],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/**
 * Save helper for a group of profile keys: tracks pending state, field errors,
 * dirty state, and shows toasts.
 */
export function useSectionSave<K extends keyof FullProfile>(
  keys: K[],
  action: (values: Pick<FullProfile, K>) => Promise<ActionResult<unknown>>,
) {
  const { draft, markSaved, commit, discard, isDirty } = useDashboard();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});

  const save = useCallback(async () => {
    setSaving(true);
    setErrors({});
    const values = Object.fromEntries(keys.map((k) => [k, draft[k]])) as Pick<FullProfile, K>;
    try {
      const res = await action(values);
      if (res.ok) {
        const committed = (res.data as { commit?: Partial<FullProfile> } | undefined)?.commit;
        if (committed) commit(committed); // adopt server-assigned IDs
        else markSaved(keys);
        toast.success(res.message ?? "Saved", { description: "Your public card is updated." });
        return { ok: true as const, fieldErrors: {} };
      }
      setErrors(res.fieldErrors ?? {});
      toast.error(res.error);
      return { ok: false as const, fieldErrors: res.fieldErrors ?? {} };
    } catch {
      toast.error("Network error — your changes were not saved.");
      return { ok: false as const, fieldErrors: {} as Record<string, string[] | undefined> };
    } finally {
      setSaving(false);
    }
    // keys is a static literal at each call site
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, action, markSaved, commit]);

  return {
    save,
    saving,
    errors,
    setErrors,
    dirty: isDirty(keys),
    discard: () => {
      discard(keys);
      setErrors({});
    },
    error: (field: string) => errors[field]?.[0],
  };
}
