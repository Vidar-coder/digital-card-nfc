import "server-only";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { readSession } from "../auth/session";
import { isBackendConfigured } from "../config";
import * as sheets from "../sheets/api";
import type { AnalyticsEventType, AnalyticsSummary, FullProfile, ListSection, ProfileBasics, Theme } from "../types";
import { summarizeEvents } from "./analytics";
import { sheetsStore, type RequestContext } from "./sheets-store";

/**
 * Single entry point for data access. Everything is stored in Google Sheets
 * through the Apps Script Web App (see apps-script/README.md).
 */

export type { RequestContext };

/** Identifies the owner's profile (sheet IDs: user_id = USR-…, id = PROF-…). */
export type OwnerRef = Pick<FullProfile, "id" | "user_id" | "username">;

/** Cache tag for one public profile; dashboard saves expire it with updateTag(). */
export const profileTag = (username: string) => `profile:${username.toLowerCase()}`;

export const getPublicProfile = cache(async (username: string): Promise<FullProfile | null> => {
  if (!isBackendConfigured) return null;
  const name = username.toLowerCase();
  return unstable_cache(() => sheetsStore.getPublishedProfile(name), ["public-profile", name], {
    tags: [profileTag(name)],
    revalidate: 300,
  })();
});

export interface Owner {
  userId: string; // 01_Users.user_id
  email: string;
  sessionVersion: number;
  /** "admin" can manage all users and the database page; "user" edits only their own card. */
  role: "admin" | "user";
  profile: FullProfile;
  /** 13_Settings for this user, e.g. google_sheet_url */
  settings: Record<string, string>;
}

/**
 * The signed-in user (validated against 01_Users on every request: account
 * status + session_version, so password changes/resets revoke old sessions).
 */
export const getOwner = cache(async (): Promise<Owner | null> => {
  if (!isBackendConfigured) return null;
  const claims = await readSession();
  if (!claims) return null;
  return sheetsStore.getSessionOwner(claims.uid, claims.v);
});

/* ---------------------------- owner writes ------------------------------ */
// Callers must have resolved the owner via getOwner(); Apps Script also
// verifies that every row written belongs to that user_id.

export async function updateOwnerProfile(owner: OwnerRef, patch: Partial<ProfileBasics>) {
  return sheetsStore.updateProfile(owner.user_id!, patch);
}

export async function updateOwnerTheme(owner: OwnerRef, theme: Theme) {
  return sheetsStore.updateTheme(owner.user_id!, theme);
}

/** Replaces a list section; returns the saved items with their server-assigned IDs. */
export async function replaceOwnerList<S extends ListSection>(owner: OwnerRef, section: S, items: FullProfile[S]) {
  return sheetsStore.replaceList(owner.user_id!, section, items);
}

export async function uploadOwnerImage(owner: OwnerRef, dataUrl: string, folder: "avatars" | "covers" | "projects") {
  return sheetsStore.uploadImage(owner.user_id!, dataUrl, folder);
}

export async function updateOwnerSetting(owner: OwnerRef, name: string, value: string) {
  await sheets.updateSetting(owner.user_id!, name, value);
}

export async function isUsernameAvailable(username: string, owner?: OwnerRef | null): Promise<boolean> {
  return sheetsStore.isUsernameAvailable(username, owner?.user_id);
}

export async function trackEvent(
  username: string,
  type: AnalyticsEventType,
  meta: Record<string, string> | null,
  ctx?: RequestContext,
) {
  if (!isBackendConfigured) return;
  return sheetsStore.trackEvent(username, type, meta, ctx);
}

export async function getAnalytics(owner: OwnerRef, days: number): Promise<AnalyticsSummary> {
  return summarizeEvents(await sheetsStore.getEvents(owner.user_id!, owner.id, days), days);
}
