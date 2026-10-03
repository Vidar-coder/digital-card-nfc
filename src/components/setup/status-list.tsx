import { CheckCircle2, CircleDashed, XCircle } from "lucide-react";
import type { BackendStatus } from "@/lib/sheets/status";

export function StatusList({ status }: { status: BackendStatus }) {
  const rows = [
    {
      ok: status.urlAndKeySet,
      label: "GOOGLE_APPS_SCRIPT_URL and GOOGLE_APPS_SCRIPT_API_KEY are set",
      hint: "Steps 5–7",
    },
    {
      ok: status.connected,
      pending: !status.urlAndKeySet,
      label: "Apps Script reachable and API key accepted",
      hint: status.error ?? "Steps 4–6",
    },
    { ok: status.sessionSecretSet, label: "SESSION_SECRET is set (32+ characters, used for sign-in)", hint: "Step 7" },
    {
      ok: status.connected && !status.outdated,
      pending: !status.connected,
      label: "Apps Script code is up to date",
      hint: status.info
        ? `Deployed version ${status.info.version}. Paste the latest Code.gs (step 3), run setupDatabase(), then Deploy → Manage deployments → Edit → New version.`
        : "Checked once connected",
    },
  ];
  return (
    <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
      {rows.map((r) => (
        <li key={r.label} className="flex items-start gap-3 px-4 py-3 text-sm">
          {r.ok ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" aria-label="Done" />
          ) : r.pending ? (
            <CircleDashed className="mt-0.5 size-4 shrink-0 text-zinc-400" aria-label="Waiting" />
          ) : (
            <XCircle className="mt-0.5 size-4 shrink-0 text-red-500" aria-label="Not done" />
          )}
          <div className="min-w-0">
            <p className={r.ok ? "text-zinc-800" : "font-medium text-zinc-900"}>{r.label}</p>
            {!r.ok && <p className="break-words text-xs text-zinc-500">{r.hint}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}
