"use server";

import { createHash, randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { clearRateLimit, rateLimit } from "@/lib/auth/rate-limit";
import { startSession } from "@/lib/auth/session";
import { getSiteUrl, isBackendConfigured, isRegistrationOpen } from "@/lib/config";
import { DataValidationError } from "@/lib/data/errors";
import * as sheets from "@/lib/sheets/api";
import { AppsScriptError } from "@/lib/sheets/client";
import { fieldErrors, loginSchema, passwordSchema, registerSchema } from "@/lib/validation";

export interface AuthState {
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string[]>;
  values?: Record<string, string>;
}

const NOT_CONFIGURED: AuthState = {
  error: "The Google Apps Script backend isn't connected yet. Follow the setup guide at /setup.",
};

/** Only allow same-origin relative redirects (prevents open redirects). */
function safeNext(raw: FormDataEntryValue | null): string {
  const v = typeof raw === "string" ? raw : "";
  return v.startsWith("/") && !v.startsWith("//") && !v.startsWith("/\\") ? v : "/dashboard";
}

async function clientIp() {
  return (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

function serviceError(e: unknown): AuthState {
  if (e instanceof AppsScriptError && (e.code === "VALIDATION_ERROR" || e.code === "DUPLICATE")) {
    return { error: e.message, fieldErrors: e.fieldErrors };
  }
  if (e instanceof DataValidationError) return { error: e.message, fieldErrors: e.fieldErrors };
  console.error("[auth]", e);
  return { error: "We couldn't reach the database. Please try again in a moment." };
}

/** True while the database has no accounts yet. */
async function isFirstAccount(): Promise<boolean> {
  try {
    return (await sheets.listUsers()).count === 0;
  } catch {
    return false;
  }
}

export async function loginAction(_prev: AuthState, form: FormData): Promise<AuthState> {
  if (!isBackendConfigured) return NOT_CONFIGURED;
  const values = { email: String(form.get("email") ?? "") };
  const parsed = loginSchema.safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };

  const limitKey = `login:${await clientIp()}:${parsed.data.email.toLowerCase()}`;
  const limit = rateLimit(limitKey, 8, 15 * 60_000);
  if (!limit.ok) return { error: `Too many attempts. Try again in ${Math.ceil(limit.retryInSec / 60)} minutes.`, values };

  let user: Awaited<ReturnType<typeof sheets.getAuthUser>>["user"] | null = null;
  try {
    user = (await sheets.getAuthUser(parsed.data.email)).user;
  } catch (e) {
    if (!(e instanceof AppsScriptError && e.code === "NOT_FOUND")) return { ...serviceError(e), values };
  }
  // verifyPassword runs even when the user doesn't exist (constant-ish timing).
  const valid = await verifyPassword(parsed.data.password, user?.password_hash);
  if (!user || !valid) return { error: "Incorrect email or password.", values };
  if (user.status !== "active") return { error: "This account is suspended.", values };

  clearRateLimit(limitKey);
  await startSession(user.user_id, user.session_version);
  void sheets.recordLogin(user.user_id);
  redirect(safeNext(form.get("next")));
}

export async function registerAction(_prev: AuthState, form: FormData): Promise<AuthState> {
  if (!isBackendConfigured) return NOT_CONFIGURED;
  const raw = {
    full_name: form.get("full_name"),
    username: String(form.get("username") ?? "").toLowerCase(),
    email: form.get("email"),
    password: form.get("password"),
  };
  const values = { full_name: String(raw.full_name ?? ""), username: raw.username, email: String(raw.email ?? "") };
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };

  // Closed sign-up still lets the very first account in (it becomes the admin).
  if (!isRegistrationOpen && !(await isFirstAccount())) {
    return { error: "Sign-up is closed. Ask an admin to create an account for you.", values };
  }

  if (!rateLimit(`register:${await clientIp()}`, 5, 60 * 60_000).ok) {
    return { error: "Too many sign-ups from this network. Try again later.", values };
  }

  let userId: string;
  try {
    const res = await sheets.registerUser({
      email: parsed.data.email,
      username: parsed.data.username,
      full_name: parsed.data.full_name,
      password_hash: await hashPassword(parsed.data.password),
      site_url: getSiteUrl(),
    });
    userId = res.user.user_id;
  } catch (e) {
    return { ...serviceError(e), values };
  }
  await startSession(userId, 1);
  redirect("/dashboard/profile");
}

export async function forgotPasswordAction(_prev: AuthState, form: FormData): Promise<AuthState> {
  if (!isBackendConfigured) return NOT_CONFIGURED;
  const email = z.email().safeParse(form.get("email"));
  if (!email.success) return { fieldErrors: { email: ["Enter a valid email"] } };
  if (!rateLimit(`forgot:${await clientIp()}`, 5, 60 * 60_000).ok) return { error: "Too many requests. Try again later." };

  // Raw token goes only into the emailed link; the sheet stores its SHA-256.
  const token = randomBytes(32).toString("base64url");
  try {
    await sheets.requestPasswordReset({
      email: email.data,
      token_hash: createHash("sha256").update(token).digest("hex"),
      expires_at: new Date(Date.now() + 60 * 60_000).toISOString(),
      reset_url: `${getSiteUrl()}/reset-password?token=${token}`,
    });
  } catch (e) {
    return serviceError(e);
  }
  return { message: "If an account exists for that email, a reset link is on its way. It expires in 1 hour." };
}

export async function resetPasswordAction(_prev: AuthState, form: FormData): Promise<AuthState> {
  if (!isBackendConfigured) return NOT_CONFIGURED;
  const token = String(form.get("token") ?? "");
  const password = String(form.get("password") ?? "");
  const confirm = String(form.get("confirm") ?? "");
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) return { error: "This reset link is invalid. Request a new one." };
  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) return { fieldErrors: { password: [parsed.error.issues[0].message] } };
  if (password !== confirm) return { fieldErrors: { confirm: ["Passwords don't match"] } };

  let session: { user_id: string; session_version: number };
  try {
    session = await sheets.resetPassword(createHash("sha256").update(token).digest("hex"), await hashPassword(parsed.data));
  } catch (e) {
    if (e instanceof AppsScriptError && e.code === "VALIDATION_ERROR") {
      return { error: "This reset link is invalid or has expired. Request a new one." };
    }
    return serviceError(e);
  }
  await startSession(session.user_id, session.session_version);
  redirect("/dashboard?password=updated");
}
