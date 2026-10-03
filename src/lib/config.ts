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

/** Public site origin for profile links, QR, vCard, and social previews (not from env). */
export const CANONICAL_SITE_URL = "https://digital-card-nfc.vercel.app";

export function getSiteUrl(): string {
  return CANONICAL_SITE_URL;
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

/** Default link preview (public/LinkPreviewImage.png). */
export const LINK_PREVIEW_IMAGE_PATH = "/LinkPreviewImage.png";
export const LINK_PREVIEW_IMAGE_SIZE = { width: 1734, height: 907 } as const;

export function linkPreviewImageAlt(siteName = SITE_NAME): string {
  return `${siteName} — NFC digital business cards`;
}

/** Absolute URL for Open Graph / Twitter / Messenger crawlers. */
export function getLinkPreviewImageUrl(): string {
  return `${CANONICAL_SITE_URL}${LINK_PREVIEW_IMAGE_PATH}`;
}
