import type { Metadata } from "next";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { AppsScriptGuide } from "@/components/setup/apps-script-guide";
import { StatusList } from "@/components/setup/status-list";
import { buttonClasses } from "@/components/ui/button";
import { getSiteUrl, SITE_NAME } from "@/lib/config";
import { getBackendStatus } from "@/lib/sheets/status";

export const metadata: Metadata = {
  title: `Setup — connect Google Sheets | ${SITE_NAME}`,
  robots: { index: false },
};
export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const status = await getBackendStatus();
  const ready = status.connected && status.sessionSecretSet && !status.outdated;

  return (
    <div className="min-h-dvh bg-zinc-50">
      <header className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <BrandMark size={28} />
          <span className="font-semibold tracking-tight">{SITE_NAME}</span>
        </Link>
        {ready && (
          <Link href="/login" className={buttonClasses("primary", "md")}>
            Sign in
          </Link>
        )}
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-20 pt-6">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Connect your Google Sheet</h1>
        <p className="mt-2 text-zinc-600">
          All data — profiles, portfolio, theme, analytics and accounts — is stored in a Google Sheet that you own, through a small Google Apps
          Script. Setup takes about 5 minutes.
        </p>

        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">Status</h2>
          <StatusList status={status} />
          {ready && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <strong>You&apos;re connected.</strong>{" "}
              <Link href="/register" className="font-semibold underline">
                Create your account
              </Link>{" "}
              or{" "}
              <Link href="/login" className="font-semibold underline">
                sign in
              </Link>
              , then paste your Google Sheet link under Dashboard → Google Sheet.
            </div>
          )}
        </section>

        <section className="mt-10 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs sm:p-8">
          <h2 className="mb-6 text-lg font-semibold text-zinc-900">Step-by-step: run the Apps Script</h2>
          <AppsScriptGuide siteUrl={getSiteUrl()} connected={status.connected} />
        </section>
      </main>
    </div>
  );
}
