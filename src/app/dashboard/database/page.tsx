import { CheckCircle2, XCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { SheetLinkCard } from "@/components/dashboard/sheet-link-card";
import { AppsScriptGuide } from "@/components/setup/apps-script-guide";
import { Card, CardHeader } from "@/components/ui/card";
import { getSiteUrl } from "@/lib/config";
import { getOwner } from "@/lib/data";
import { getBackendStatus } from "@/lib/sheets/status";

export default async function DatabasePage() {
  const owner = await getOwner();
  if (!owner) redirect("/login");
  if (owner.role !== "admin") redirect("/dashboard"); // database settings are admin-only
  const status = await getBackendStatus();
  const info = status.info;

  return (
    <>
      <PageHeader
        title="Google Sheet"
        description="Where your card details are saved, and how to run the Google Apps Script that connects it."
      />
      <div className="space-y-5">
        <SheetLinkCard detectedUrl={info?.spreadsheet_url ?? null} />

        <Card>
          <CardHeader title="Connection" />
          <div className="p-5 text-sm">
            <div className="flex items-center gap-2">
              {status.connected ? (
                <CheckCircle2 className="size-5 text-emerald-500" />
              ) : (
                <XCircle className="size-5 text-red-500" />
              )}
              <span className="font-medium text-zinc-900">
                {status.connected ? "Apps Script connected" : "Apps Script not reachable"}
              </span>
            </div>
            {!status.connected && status.error && <p className="mt-1 text-zinc-500">{status.error}</p>}
            {status.outdated && (
              <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2.5 text-amber-900">
                <strong>Your Apps Script code is out of date</strong> (v{status.info?.version}). Copy the latest code below (step 3), run{" "}
                <code>setupDatabase()</code>, then <em>Deploy → Manage deployments → Edit → New version</em>.
              </p>
            )}
            {info && (
              <dl className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-zinc-500">Spreadsheet</dt>
                  <dd className="font-medium text-zinc-900">{info.spreadsheet_name}</dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500">Timezone</dt>
                  <dd className="font-medium text-zinc-900">{info.timezone}</dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500">API version</dt>
                  <dd className="font-medium text-zinc-900">{info.version}</dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500">Tabs</dt>
                  <dd className="font-medium text-zinc-900">{info.sheets.length} sheets</dd>
                </div>
              </dl>
            )}
            {info && (
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {info.sheets.map((s) => (
                  <li key={s} className="rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-xs text-zinc-700">
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="How to run the Apps Script"
            description="Follow these steps once to create the database, or again when moving to a new spreadsheet."
          />
          <div className="p-5 sm:p-6">
            <AppsScriptGuide siteUrl={getSiteUrl()} connected={status.connected} />
          </div>
        </Card>
      </div>
    </>
  );
}
