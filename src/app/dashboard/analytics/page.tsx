import { redirect } from "next/navigation";
import { AnalyticsDashboard } from "@/components/dashboard/analytics-dashboard";
import { PageHeader } from "@/components/dashboard/page-header";
import { getAnalytics, getOwner } from "@/lib/data";

const RANGES = [7, 30, 90];

export default async function AnalyticsPage(props: PageProps<"/dashboard/analytics">) {
  const owner = await getOwner();
  if (!owner) redirect("/login");
  const { range } = await props.searchParams;
  const days = RANGES.includes(Number(range)) ? Number(range) : 30;
  const summary = await getAnalytics(owner.profile, days);

  return (
    <>
      <PageHeader title="Analytics" description="How people interact with your card. Bots and link previews are excluded." />
      <AnalyticsDashboard summary={summary} />
    </>
  );
}
