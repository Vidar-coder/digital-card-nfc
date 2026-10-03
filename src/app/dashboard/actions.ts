"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { endSession, startSession } from "@/lib/auth/session";
import {
  getOwner,
  isUsernameAvailable,
  profileTag,
  replaceOwnerList,
  updateOwnerProfile,
  updateOwnerSetting,
  updateOwnerTheme,
  uploadOwnerImage,
} from "@/lib/data";
import { DataValidationError } from "@/lib/data/errors";
import { sanitizeRichText } from "@/lib/sanitize";
import * as sheets from "@/lib/sheets/api";
import { AppsScriptError } from "@/lib/sheets/client";
import type { ActionResult, FullProfile, ListSection } from "@/lib/types";
import {
  aboutSchema,
  basicsSchema,
  contactSchema,
  fieldErrors,
  listSchemas,
  passwordSchema,
  themeSchema,
  usernameSchema,
} from "@/lib/validation";

async function requireOwner() {
  const owner = await getOwner();
  if (!owner) throw new Error("UNAUTHENTICATED");
  return owner;
}

function revalidateProfile(...usernames: string[]) {
  for (const u of new Set(usernames)) {
    updateTag(profileTag(u)); // expire now: the owner sees their change on the next load
    revalidatePath(`/p/${u}`);
  }
  revalidatePath("/dashboard", "layout");
}

function fail(e: unknown): ActionResult<never> {
  const message = e instanceof Error ? e.message : "Something went wrong";
  if (message === "UNAUTHENTICATED") return { ok: false, error: "Your session expired. Please sign in again." };
  if (e instanceof DataValidationError) return { ok: false, error: message, fieldErrors: e.fieldErrors };
  console.error("[dashboard action]", e);
  return { ok: false, error: message };
}

/* ------------------------------------------------------------------------- */

export async function checkUsernameAction(raw: string): Promise<{ available: boolean; message: string }> {
  const parsed = usernameSchema.safeParse(raw);
  if (!parsed.success) return { available: false, message: parsed.error.issues[0].message };
  try {
    const owner = await getOwner();
    if (owner?.profile.username === parsed.data) return { available: true, message: "This is your current username" };
    const available = await isUsernameAvailable(parsed.data, owner?.profile);
    return { available, message: available ? "Username is available" : "Username is already taken" };
  } catch {
    return { available: false, message: "Couldn't check availability" };
  }
}

export async function saveBasicsAction(input: unknown): Promise<ActionResult<{ username: string }>> {
  const parsed = basicsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields", fieldErrors: fieldErrors(parsed.error) };
  try {
    const { profile } = await requireOwner();
    const data = parsed.data;
    if (data.username !== profile.username && !(await isUsernameAvailable(data.username, profile))) {
      return { ok: false, error: "That username is taken", fieldErrors: { username: ["Username is already taken"] } };
    }
    await updateOwnerProfile(profile, data);
    revalidateProfile(profile.username, data.username);
    return { ok: true, data: { username: data.username }, message: "Profile saved" };
  } catch (e) {
    return fail(e);
  }
}

export async function saveContactAction(input: unknown): Promise<ActionResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields", fieldErrors: fieldErrors(parsed.error) };
  try {
    const { profile } = await requireOwner();
    await updateOwnerProfile(profile, parsed.data);
    revalidateProfile(profile.username);
    return { ok: true, message: "Contact details saved" };
  } catch (e) {
    return fail(e);
  }
}

export async function saveAboutAction(input: unknown): Promise<ActionResult> {
  const parsed = aboutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "About text is too long" };
  try {
    const { profile } = await requireOwner();
    await updateOwnerProfile(profile, { about_html: sanitizeRichText(parsed.data.about_html) });
    revalidateProfile(profile.username);
    return { ok: true, message: "About saved" };
  } catch (e) {
    return fail(e);
  }
}

const sectionNames = z.enum(Object.keys(listSchemas) as [ListSection, ...ListSection[]]);

export async function saveListAction(
  section: ListSection,
  items: unknown,
): Promise<ActionResult<{ commit?: Partial<FullProfile> }>> {
  const s = sectionNames.safeParse(section);
  if (!s.success) return { ok: false, error: "Unknown section" };
  const parsed = listSchemas[s.data].safeParse(items);
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields", fieldErrors: fieldErrors(parsed.error) };
  try {
    const { profile } = await requireOwner();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const canonical = await replaceOwnerList(profile, s.data, parsed.data as any);
    revalidateProfile(profile.username);
    // Backends that assign IDs (Google Sheets) return the saved list so the
    // dashboard adopts the server IDs and later saves update instead of re-creating.
    return { ok: true, message: "Changes saved", data: canonical ? { commit: { [s.data]: canonical } } : {} };
  } catch (e) {
    return fail(e);
  }
}

const UPLOAD_FOLDERS = z.enum(["avatars", "covers", "projects"]);
const DATA_URL = /^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/;

/** Google Sheets backend: images go to Google Drive via Apps Script. */
export async function uploadImageAction(dataUrl: string, folder: string): Promise<ActionResult<{ url: string }>> {
  const f = UPLOAD_FOLDERS.safeParse(folder);
  if (!f.success || typeof dataUrl !== "string" || !DATA_URL.test(dataUrl)) return { ok: false, error: "Invalid image" };
  if (dataUrl.length > 7_000_000) return { ok: false, error: "Image is too large" };
  try {
    const { profile } = await requireOwner();
    const url = await uploadOwnerImage(profile, dataUrl, f.data);
    return { ok: true, data: { url } };
  } catch (e) {
    return fail(e);
  }
}

export async function saveThemeAction(input: unknown): Promise<ActionResult> {
  const parsed = themeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid theme", fieldErrors: fieldErrors(parsed.error) };
  try {
    const { profile } = await requireOwner();
    await updateOwnerTheme(profile, parsed.data);
    revalidateProfile(profile.username);
    return { ok: true, message: "Design published" };
  } catch (e) {
    return fail(e);
  }
}

/* ------------------------------- account -------------------------------- */

const SHEET_URL = /^https:\/\/docs\.google\.com\/spreadsheets\/d\/[A-Za-z0-9_-]{20,}(\/[^\s]*)?$/;

/** Saves the Google Sheet link shown on the dashboard's "Google Sheet" page (13_Settings.google_sheet_url). */
export async function saveSheetLinkAction(url: string): Promise<ActionResult> {
  const value = String(url ?? "").trim();
  if (value && !SHEET_URL.test(value)) {
    return {
      ok: false,
      error: "Paste the full Google Sheets link",
      fieldErrors: { url: ["It should look like https://docs.google.com/spreadsheets/d/…"] },
    };
  }
  try {
    const { profile, role } = await requireOwner();
    if (role !== "admin") return { ok: false, error: "Only admins can change the database link." };
    await updateOwnerSetting(profile, "google_sheet_url", value);
    revalidatePath("/dashboard", "layout");
    return { ok: true, message: value ? "Google Sheet link saved" : "Google Sheet link removed" };
  } catch (e) {
    return fail(e);
  }
}

/** Requires the current password; signs out other devices (session_version bump). */
export async function updatePasswordAction(input: { current: string; password: string; confirm: string }): Promise<ActionResult> {
  const parsed = passwordSchema.safeParse(input.password);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message, fieldErrors: { password: [parsed.error.issues[0].message] } };
  if (input.password !== input.confirm) return { ok: false, error: "Passwords don't match", fieldErrors: { confirm: ["Passwords don't match"] } };
  try {
    const owner = await requireOwner();
    const { user } = await sheets.getAuthUser(owner.email);
    if (!(await verifyPassword(input.current ?? "", user.password_hash))) {
      return { ok: false, error: "Current password is incorrect", fieldErrors: { current: ["Current password is incorrect"] } };
    }
    const { session_version } = await sheets.changePassword(owner.userId, await hashPassword(parsed.data));
    await startSession(owner.userId, session_version); // keep THIS device signed in
    return { ok: true, message: "Password updated. Other devices were signed out." };
  } catch (e) {
    return fail(e);
  }
}

/** Changes the sign-in email (requires the current password). */
export async function updateEmailAction(input: { email: string; current: string }): Promise<ActionResult> {
  const parsed = z.email().safeParse(String(input.email ?? "").trim().toLowerCase());
  if (!parsed.success) return { ok: false, error: "Enter a valid email", fieldErrors: { email: ["Enter a valid email"] } };
  try {
    const owner = await requireOwner();
    const { user } = await sheets.getAuthUser(owner.email);
    if (!(await verifyPassword(input.current ?? "", user.password_hash))) {
      return { ok: false, error: "Current password is incorrect", fieldErrors: { current: ["Current password is incorrect"] } };
    }
    await sheets.updateUserEmail(owner.userId, parsed.data);
    revalidatePath("/dashboard", "layout");
    return { ok: true, message: "Sign-in email updated" };
  } catch (e) {
    if (e instanceof AppsScriptError && e.code === "DUPLICATE") {
      return { ok: false, error: "That email is already used by another account", fieldErrors: { email: ["Already in use"] } };
    }
    return fail(e);
  }
}

export async function signOutAction() {
  await endSession();
  redirect("/login");
}
