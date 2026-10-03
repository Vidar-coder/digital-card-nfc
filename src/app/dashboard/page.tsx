import { redirect } from "next/navigation";
import { Overview } from "@/components/dashboard/overview";
import { getAnalytics, getOwner } from "@/lib/data";

export default async function DashboardPage() {
  const owner = await getOwner();
  if (!owner) redirect("/login");
  const summary = await getAnalytics(owner.profile, 7);
  return <Overview summary={summary} />;
}
