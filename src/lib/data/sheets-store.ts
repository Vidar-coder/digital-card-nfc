import "server-only";
import { getSiteUrl } from "../config";
import * as sheets from "../sheets/api";
import { AppsScriptError } from "../sheets/client";
import {
  eventFromSheet,
  eventToSheet,
  fieldErrorsFromSheet,
  fullProfileFromSheet,
  listFromSheet,
  listToSheet,
  profilePatchToSheet,
  themeToSheet,
} from "../sheets/mappers";
import type { AnalyticsEvent, AnalyticsEventType, FullProfile, ListSection, ProfileBasics, Theme } from "../types";
import { DataValidationError } from "./errors";

/**
 * Google Sheets data store (via the Apps Script Web App).
 * The app's only data store. IDs are the sheet IDs
 * (profile.id = PROF-…, profile.user_id = USR-…).
 */

export interface RequestContext {
  referrer?: string;
  userAgent?: string;
  country?: string;
}

/** Converts Apps Script validation/duplicate errors into dashboard-friendly errors. */
function rethrow(e: unknown, section: ListSection | "profile" | "theme"): never {
  if (e instanceof AppsScriptError && (e.code === "VALIDATION_ERROR" || e.code === "DUPLICATE")) {
    throw new DataValidationError(e.message, fieldErrorsFromSheet(e.fieldErrors, section));
  }
  throw e;
}

const SYNC = {
  experiences: sheets.sync.experience,
  education: sheets.sync.education,
  certifications: sheets.sync.certifications,
  skills: sheets.sync.skills,
  services: sheets.sync.services,
  projects: sheets.sync.projects,
  social_links: sheets.sync.socialLinks,
} as const;

function device(ua: string): string {
  if (/ipad|tablet/i.test(ua)) return "tablet";
  if (/mobi|iphone|android/i.test(ua)) return "mobile";
  return ua ? "desktop" : "";
}

function browser(ua: string): string {
  if (/edg\//i.test(ua)) return "Edge";
  if (/samsungbrowser/i.test(ua)) return "Samsung Internet";
  if (/crios|chrome/i.test(ua)) return "Chrome";
  if (/fxios|firefox/i.test(ua)) return "Firefox";
  if (/safari/i.test(ua)) return "Safari";
  return ua ? "Other" : "";
}

export const sheetsStore = {
  async getPublishedProfile(username: string): Promise<FullProfile | null> {
    try {
      return fullProfileFromSheet(await sheets.getCompleteProfile({ username }, { public: true }));
    } catch (e) {
      if (e instanceof AppsScriptError && e.code === "NOT_FOUND") return null;
      throw e;
    }
  },

  /** Validates session claims against 01_Users and returns the owner's dashboard data, or null. */
  async getSessionOwner(userId: string, sessionVersion: number) {
    try {
      const res = await sheets.getSession(userId, sessionVersion);
      return {
        userId: res.user.user_id,
        email: res.user.email,
        sessionVersion: res.user.session_version,
        role: res.user.role === "admin" ? ("admin" as const) : ("user" as const),
        profile: fullProfileFromSheet(res.complete),
        settings: res.complete.settings ?? {},
      };
    } catch (e) {
      if (e instanceof AppsScriptError && (e.code === "SESSION_INVALID" || e.code === "NOT_FOUND")) return null;
      throw e;
    }
  },

  async isUsernameAvailable(username: string, userId?: string | null): Promise<boolean> {
    return (await sheets.checkUsername(username, userId ?? undefined)).available;
  },

  async updateProfile(userId: string, patch: Partial<ProfileBasics>) {
    try {
      await sheets.updateProfile(userId, { ...profilePatchToSheet(patch), site_url: getSiteUrl() });
    } catch (e) {
      rethrow(e, "profile");
    }
  },

  async updateTheme(userId: string, theme: Theme) {
    const payload = themeToSheet(theme);
    try {
      await sheets.updateTheme(userId, payload);
    } catch (e) {
      if (
        e instanceof AppsScriptError &&
        e.code === "VALIDATION_ERROR" &&
        e.fieldErrors?.theme_name &&
        payload.theme_name !== "custom"
      ) {
        await sheets.updateTheme(userId, { ...payload, theme_name: "custom" });
        return;
      }
      rethrow(e, "theme");
    }
  },

  /** Saves a whole section; returns the canonical list (new rows get server IDs). */
  async replaceList<S extends ListSection>(userId: string, section: S, items: FullProfile[S]): Promise<FullProfile[S]> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await (SYNC[section] as any)(userId, listToSheet(section, items));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (listFromSheet[section] as any)(res.items) as FullProfile[S];
    } catch (e) {
      rethrow(e, section);
    }
  },

  async trackEvent(username: string, type: AnalyticsEventType, meta: Record<string, string> | null, ctx: RequestContext = {}) {
    const ua = ctx.userAgent ?? "";
    await sheets.recordAnalyticsEvent({
      username,
      ...eventToSheet(type, meta),
      referrer: (ctx.referrer ?? "").slice(0, 300),
      device: device(ua),
      browser: browser(ua),
      country: (ctx.country ?? "").slice(0, 8),
    });
  },

  async getEvents(userId: string, profileId: string, days: number): Promise<AnalyticsEvent[]> {
    const res = await sheets.getAnalytics(userId, { days });
    return res.events.map((e) => eventFromSheet(e, profileId)).filter((e): e is AnalyticsEvent => e !== null);
  },

  async uploadImage(userId: string, dataUrl: string, folder: "avatars" | "covers" | "projects"): Promise<string> {
    return (await sheets.uploadImage(userId, dataUrl, folder)).url;
  },
};
