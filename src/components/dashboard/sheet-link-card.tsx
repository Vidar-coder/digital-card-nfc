"use client";

import { ExternalLink, FileSpreadsheet, Wand2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { saveSheetLinkAction } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { useDashboard } from "./dashboard-context";

/** Lets the owner paste (and open) the Google Sheet that stores their data. Saved to 13_Settings.google_sheet_url. */
export function SheetLinkCard({ detectedUrl }: { detectedUrl: string | null }) {
  const { settings } = useDashboard();
  const savedUrl = settings.google_sheet_url ?? "";
  const [url, setUrl] = useState(savedUrl);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const sameSheet = (a: string, b: string) => {
    const id = (u: string) => /\/spreadsheets\/d\/([A-Za-z0-9_-]+)/.exec(u)?.[1];
    return !!id(a) && id(a) === id(b);
  };
  const mismatch = !!detectedUrl && !!savedUrl && !sameSheet(savedUrl, detectedUrl);

  async function save(value = url) {
    setSaving(true);
    setError(undefined);
    const res = await saveSheetLinkAction(value);
    setSaving(false);
    if (res.ok) {
      toast.success(res.message);
      setUrl(value);
    } else {
      setError(res.fieldErrors?.url?.[0] ?? res.error);
      toast.error(res.error);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Your Google Sheet link"
        description="Paste the link of the Google Sheet where your card details are saved, so you can open it from here anytime."
      />
      <div className="space-y-4 p-5">
        <form
          className="flex flex-col gap-2 sm:flex-row sm:items-start"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <Field
            label="Google Sheet URL"
            error={error}
            hint="Open your spreadsheet and copy the address bar — it starts with https://docs.google.com/spreadsheets/d/"
            className="flex-1"
          >
            {(p) => (
              <Input
                {...p}
                type="url"
                inputMode="url"
                placeholder="https://docs.google.com/spreadsheets/d/…/edit"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            )}
          </Field>
          <Button type="submit" loading={saving} disabled={url.trim() === savedUrl} className="sm:mt-7">
            Save link
          </Button>
        </form>

        {detectedUrl && !sameSheet(url, detectedUrl) && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-indigo-50 px-3 py-2.5 text-sm text-indigo-900">
            <span>We detected the spreadsheet your Apps Script is connected to.</span>
            <Button size="sm" variant="outline" onClick={() => void save(detectedUrl)} loading={saving}>
              <Wand2 className="size-3.5" /> Use detected link
            </Button>
          </div>
        )}

        {mismatch && (
          <p className="rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
            The saved link points to a different spreadsheet than the one your Apps Script writes to. Use the detected link to fix it.
          </p>
        )}

        {savedUrl && (
          <a
            href={savedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-zinc-200 p-3 transition hover:border-emerald-300 hover:bg-emerald-50/40"
          >
            <span className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <FileSpreadsheet className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-zinc-900">Open Google Sheet</span>
              <span className="block truncate text-xs text-zinc-500">{savedUrl}</span>
            </span>
            <ExternalLink className="size-4 text-zinc-400" />
          </a>
        )}
      </div>
    </Card>
  );
}
