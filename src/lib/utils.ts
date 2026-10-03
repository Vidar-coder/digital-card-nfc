import clsx, { type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2024-06" → "Jun 2024" */
export function formatMonth(value: string | null | undefined): string {
  if (!value) return "Present";
  const [y, m] = value.split("-");
  const idx = Number(m) - 1;
  return idx >= 0 && idx < 12 ? `${MONTHS[idx]} ${y}` : y;
}

export function formatRange(start: string, end: string | null): string {
  return `${formatMonth(start)} — ${formatMonth(end)}`;
}

/** Digits and leading + only, for tel:/sms: URIs. */
export function phoneHref(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

export function ensureProtocol(url: string): string {
  if (!url) return url;
  return /^(https?:|mailto:|tel:)/i.test(url) ? url : `https://${url}`;
}

export function prettyUrl(url: string): string {
  return url.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/$/, "");
}

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export const USERNAME_REGEX = /^[a-z0-9](?:[a-z0-9-_]{1,28})[a-z0-9]$/;

export const RESERVED_USERNAMES = new Set([
  "admin", "api", "app", "auth", "dashboard", "login", "logout", "register", "signup",
  "settings", "p", "profile", "profiles", "www", "help", "support", "about", "terms",
  "privacy", "static", "assets", "public", "null", "undefined", "root",
]);

export function normalizeUsername(v: string): string {
  return v.trim().toLowerCase().replace(/\s+/g, "-");
}
