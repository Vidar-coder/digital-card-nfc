/**
 * Runtime configuration.
 *
 * The only backend is Google Sheets via the Google Apps Script Web App
 * (apps-script/). Sign-in is handled by this app: passwords are hashed here
 * (scrypt) and only hashes are stored in the sheet; sessions are signed cookies.
 *
 * Server-only env (never NEXT_PUBLIC_):
 *   GOOGLE_APPS_SCRIPT_URL, GOOGLE_APPS_SCRIPT_API_KEY, SESSION_SECRET
 */

/** Server-side only: evaluates to false in the browser bundle (env not exposed). */
export const isAppsScriptConfigured = Boolean(process.env.GOOGLE_APPS_SCRIPT_URL && process.env.GOOGLE_APPS_SCRIPT_API_KEY);
export const isSessionSecretConfigured = (process.env.SESSION_SECRET ?? "").length >= 32;
export const isBackendConfigured = isAppsScriptConfigured && isSessionSecretConfigured;

/** Public sign-up at /register (default on). When off, admins add users from Dashboard → Users. */
export const isRegistrationOpen = process.env.ALLOW_REGISTRATION !== "false";

export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "TapCard";

export function getSiteUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return url.replace(/\/$/, "");
}

export function profileUrl(username: string, source?: "qr" | "nfc"): string {
  const base = `${getSiteUrl()}/p/${encodeURIComponent(username)}`;
  return source ? `${base}?src=${source}` : base;
}

/** Public setup guide links. */
export const APPS_SCRIPT_GUIDE_PATH = "/setup";

/** Order / support (landing + dashboard CTA). */
export const MESSENGER_ORDER_URL = "https://m.me/mr.c0oletz";
export const DIGITAL_CARD_PROMO_PRICE = "₱1,499";
