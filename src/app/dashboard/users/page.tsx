import { redirect } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { UsersManager } from "@/components/dashboard/users-manager";
import { getOwner } from "@/lib/data";
import * as sheets from "@/lib/sheets/api";

export const metadata = { title: "Users" };

export default async function UsersPage() {
  const owner = await getOwner();
  if (!owner) redirect("/login");
  if (owner.role !== "admin") redirect("/dashboard"); // regular users only manage their own card

  const { users } = await sheets.listUsers();

  return (
    <>
      <PageHeader
        title="Users"
        description="Everyone here has their own digital card and dashboard. They can only see and edit their own data."
      />
      <UsersManager users={users} currentUserId={owner.userId} />
    </>
  );
}
