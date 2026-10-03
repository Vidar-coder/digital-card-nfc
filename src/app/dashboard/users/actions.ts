"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { hashPassword } from "@/lib/auth/password";
import { getSiteUrl } from "@/lib/config";
import { getOwner, profileTag } from "@/lib/data";
import * as sheets from "@/lib/sheets/api";
import { AppsScriptError } from "@/lib/sheets/client";
import type { SheetAdminUser } from "@/lib/sheets/types";
import type { ActionResult } from "@/lib/types";
import { fieldErrors, passwordSchema, usernameSchema } from "@/lib/validation";

/**
 * Admin-only user management. Every action re-checks the caller's role
 * (from 01_Users via getOwner) — never trust the client.
 */
async function requireAdmin() {
  const owner = await getOwner();
  if (!owner) throw new Error("UNAUTHENTICATED");
  if (owner.role !== "admin") throw new Error("FORBIDDEN");
  return owner;
}

function fail(e: unknown): ActionResult<never> {
  if (e instanceof Error && e.message === "UNAUTHENTICATED") return { ok: false, error: "Your session expired. Please sign in again." };
  if (e instanceof Error && e.message === "FORBIDDEN") return { ok: false, error: "Only admins can manage users." };
  if (e instanceof AppsScriptError) return { ok: false, error: e.message, fieldErrors: e.fieldErrors };
  console.error("[users]", e);
  return { ok: false, error: e instanceof Error ? e.message : "Something went wrong" };
}

const INVITE_DAYS = 3;

/** Emails a one-time link (reset or invite). Only the token's SHA-256 is stored. */
async function sendLink(email: string, invite: boolean) {
  const token = randomBytes(32).toString("base64url");
  await sheets.requestPasswordReset({
    email,
    token_hash: createHash("sha256").update(token).digest("hex"),
    expires_at: new Date(Date.now() + (invite ? INVITE_DAYS * 24 : 1) * 3_600_000).toISOString(),
    reset_url: `${getSiteUrl()}/reset-password?token=${token}`,
    invite,
  });
}

export async function listUsersAction(): Promise<ActionResult<{ users: SheetAdminUser[] }>> {
  try {
    await requireAdmin();
    const { users } = await sheets.listUsers();
    return { ok: true, data: { users } };
  } catch (e) {
    return fail(e);
  }
}

const createSchema = z
  .object({
    full_name: z.string().trim().min(1, "Name is required").max(80),
    username: usernameSchema,
    email: z.email("Enter a valid email"),
    role: z.enum(["user", "admin"]),
    mode: z.enum(["invite", "password"]),
    password: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.mode === "password") {
      const r = passwordSchema.safeParse(v.password ?? "");
      if (!r.success) ctx.addIssue({ code: "custom", path: ["password"], message: r.error.issues[0].message });
    }
  });

/**
 * Creates a user with their own profile, theme and dashboard.
 *  - mode "invite": the user receives an email to set their own password (valid 3 days)
 *  - mode "password": you set a temporary password and share it with them
 */
export async function createUserAction(input: unknown): Promise<ActionResult<{ user_id: string; username: string }>> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields", fieldErrors: fieldErrors(parsed.error) };
  const d = parsed.data;
  try {
    await requireAdmin();
    const { user } = await sheets.registerUser({
      email: d.email,
      username: d.username,
      full_name: d.full_name,
      role: d.role,
      site_url: getSiteUrl(),
      ...(d.mode === "password" ? { password_hash: await hashPassword(d.password!) } : { invite: true }),
    });
    if (d.mode === "invite") await sendLink(d.email, true);
    revalidatePath("/dashboard/users");
    return {
      ok: true,
      message: d.mode === "invite" ? `Invite sent to ${d.email}` : `Account created for ${d.full_name}`,
      data: { user_id: user.user_id, username: user.username },
    };
  } catch (e) {
    return fail(e);
  }
}

/** Sends a password-reset email (or a fresh invite if they never set a password). */
export async function sendPasswordLinkAction(userId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const { users } = await sheets.listUsers();
    const u = users.find((x) => x.user_id === userId);
    if (!u) return { ok: false, error: "User not found" };
    if (u.status !== "active") return { ok: false, error: "Reactivate the account first" };
    await sendLink(u.email, !u.has_password);
    return { ok: true, message: `${u.has_password ? "Reset link" : "Invite"} sent to ${u.email}` };
  } catch (e) {
    return fail(e);
  }
}

export async function setUserStatusAction(userId: string, status: "active" | "suspended"): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    if (userId === admin.userId) return { ok: false, error: "You can't suspend your own account" };
    if (status !== "active" && status !== "suspended") return { ok: false, error: "Invalid status" };
    await sheets.updateUserAccess(userId, { status });
    revalidatePath("/dashboard/users");
    return { ok: true, message: status === "suspended" ? "User suspended and signed out" : "User reactivated" };
  } catch (e) {
    return fail(e);
  }
}

export async function setUserRoleAction(userId: string, role: "user" | "admin"): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    if (userId === admin.userId) return { ok: false, error: "You can't change your own role" };
    if (role !== "user" && role !== "admin") return { ok: false, error: "Invalid role" };
    await sheets.updateUserAccess(userId, { role });
    revalidatePath("/dashboard/users");
    return { ok: true, message: role === "admin" ? "User is now an admin" : "Admin rights removed" };
  } catch (e) {
    return fail(e);
  }
}

/** Permanently deletes the account and all of its card data (analytics kept unless asked). */
export async function deleteUserAction(userId: string, deleteAnalytics: boolean): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    if (userId === admin.userId) return { ok: false, error: "You can't delete your own account here" };
    const { users } = await sheets.listUsers();
    const u = users.find((x) => x.user_id === userId);
    await sheets.deleteProfile(userId, { delete_user: true, delete_analytics: deleteAnalytics });
    if (u?.username) updateTag(profileTag(u.username)); // public card disappears immediately
    revalidatePath("/dashboard/users");
    return { ok: true, message: "User deleted" };
  } catch (e) {
    return fail(e);
  }
}
