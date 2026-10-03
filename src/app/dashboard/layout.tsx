import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardProvider } from "@/components/dashboard/dashboard-context";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getSiteUrl, isBackendConfigured } from "@/lib/config";
import { getOwner } from "@/lib/data";

// Always per-request: the dashboard shows the signed-in owner's live data.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  if (!isBackendConfigured) redirect("/setup");

  // Authoritative auth check: signature + account status + session_version in 01_Users.
  const owner = await getOwner();
  if (!owner) redirect("/login?next=/dashboard");

  return (
    <DashboardProvider
      initial={owner.profile}
      siteUrl={getSiteUrl()}
      settings={owner.settings}
      role={owner.role}
      userId={owner.userId}
      email={owner.email}
    >
      <DashboardShell>{children}</DashboardShell>
    </DashboardProvider>
  );
}
