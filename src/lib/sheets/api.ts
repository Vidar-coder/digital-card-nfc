import "server-only";
import { apiRequest, call } from "./client";
import type {
  AnalyticsEventInput,
  AnalyticsResult,
  CompleteProfileData,
  ProfileInput,
  ProjectInput,
  SheetCertification,
  SheetEducation,
  SheetExperience,
  SheetProfile,
  SheetProject,
  SheetQrNfc,
  SheetService,
  SheetSkill,
  SheetSocialLink,
  SessionResult,
  SheetAdminUser,
  SheetAuthUser,
  SheetTheme,
  SheetUser,
  SyncItem,
  SystemInfo,
  ThemeInput,
  UserRole,
} from "./types";

/**
 * Typed wrappers around every Apps Script action. All functions throw
 * AppsScriptError on failure (use apiRequest() directly for the raw envelope).
 * Server-only — import from Server Components, Server Actions or Route Handlers.
 */

/* ------------------------------ auth / users ---------------------------- */
// Passwords are hashed in Next.js (src/lib/auth/password.ts); only hashes are sent.

/**
 * Creates an account + profile. The first account ever becomes "admin".
 * Admin-created accounts may pass role, and invite=true without a password_hash
 * (then send requestPasswordReset with invite=true).
 */
export function registerUser(input: {
  email: string;
  username: string;
  password_hash?: string;
  full_name?: string;
  site_url?: string;
  role?: UserRole;
  invite?: boolean;
}) {
  return call<{ user: SheetUser; profile: SheetProfile }>("registerUser", input);
}

/** Sign-in lookup — the only call that returns the password hash. */
export function getAuthUser(email: string) {
  return call<{ user: SheetAuthUser }>("getAuthUser", { email });
}

export function recordLogin(userId: string) {
  return apiRequest("recordLogin", { user_id: userId }, { retries: 0 });
}

/** Validates session claims (status + session_version) and returns the dashboard data. */
export function getSession(userId: string, sessionVersion: number) {
  return call<SessionResult>("getSession", { user_id: userId, session_version: sessionVersion });
}

export function changePassword(userId: string, passwordHash: string) {
  return call<{ session_version: number }>("changePassword", { user_id: userId, password_hash: passwordHash });
}

export function requestPasswordReset(input: { email: string; token_hash: string; expires_at: string; reset_url: string; invite?: boolean }) {
  return call<{ sent: boolean }>("requestPasswordReset", input, { retries: 0 });
}

export function resetPassword(tokenHash: string, passwordHash: string) {
  return call<{ user_id: string; session_version: number }>("resetPassword", { token_hash: tokenHash, password_hash: passwordHash });
}

export function updateUserEmail(userId: string, email: string) {
  return call<{ user: SheetUser }>("updateUser", { user_id: userId, email });
}

/* -------------------------------- admin --------------------------------- */
// The calling Server Action must verify the signed-in user is an admin first.

export function listUsers() {
  return call<{ users: SheetAdminUser[]; count: number }>("listUsers", {});
}

/** status "suspended" also signs the user out everywhere. Refuses to remove the last active admin. */
export function updateUserAccess(userId: string, patch: { status?: "active" | "suspended"; role?: UserRole }) {
  return call<{ user: SheetUser }>("updateUser", { user_id: userId, ...patch });
}

export function getSystemInfo() {
  return call<SystemInfo>("getSystemInfo", {}, { timeoutMs: 25_000, retries: 1 });
}

export function checkUsername(username: string, userId?: string) {
  return call<{ username: string; available: boolean; reason: string | null }>("checkUsername", {
    username,
    user_id: userId,
  });
}

/* ------------------------------- profiles ------------------------------- */

/** Creates the user (by email) if needed, plus profile, default theme, QR/NFC row. */
export function createProfile(input: ProfileInput & { email: string; username: string; user_id?: string; site_url?: string }) {
  return call<{ profile_id: string; user_id: string; profile: SheetProfile }>("createProfile", input);
}

export function getProfile(by: { user_id?: string; username?: string; profile_id?: string; public?: boolean }) {
  return call<{ profile: SheetProfile }>("getProfile", by);
}

/** Partial update: send only changed fields. */
export function updateProfile(userId: string, fields: ProfileInput & { site_url?: string }) {
  return call<{ profile: SheetProfile }>("updateProfile", { ...fields, user_id: userId });
}

export function deleteProfile(userId: string, opts: { delete_user?: boolean; delete_analytics?: boolean } = {}) {
  return call<{ user_id: string; deleted: Record<string, number> }>("deleteProfile", { user_id: userId, ...opts });
}

/** Everything for one user. `public: true` → published only, hidden items/settings excluded. */
export function getCompleteProfile(by: { user_id: string } | { username: string }, opts: { public?: boolean } = {}) {
  return call<CompleteProfileData>("getCompleteProfile", { ...by, public: opts.public ?? false });
}

/* ------------------------------- sections ------------------------------- */

export function createProject(userId: string, project: ProjectInput) {
  return call<{ project_id: string; record: SheetProject }>("createProject", { ...project, user_id: userId });
}

export function updateProject(userId: string, projectId: string, fields: ProjectInput) {
  return call<{ record: SheetProject }>("updateProject", { ...fields, project_id: projectId, user_id: userId });
}

export function deleteProject(userId: string, projectId: string) {
  return call<{ deleted: string }>("deleteProject", { project_id: projectId, user_id: userId });
}

export function getProjects(userId: string) {
  return call<{ items: SheetProject[]; count: number }>("getProjects", { user_id: userId });
}

/** Replace-the-list saves used by the dashboard (one call per section). */
export const sync = {
  socialLinks: (userId: string, items: SyncItem<SheetSocialLink>[]) =>
    call<{ items: SheetSocialLink[] }>("syncSocialLinks", { user_id: userId, items }),
  experience: (userId: string, items: SyncItem<SheetExperience>[]) =>
    call<{ items: SheetExperience[] }>("syncExperience", { user_id: userId, items }),
  education: (userId: string, items: SyncItem<SheetEducation>[]) =>
    call<{ items: SheetEducation[] }>("syncEducation", { user_id: userId, items }),
  certifications: (userId: string, items: SyncItem<SheetCertification>[]) =>
    call<{ items: SheetCertification[] }>("syncCertifications", { user_id: userId, items }),
  skills: (userId: string, items: SyncItem<SheetSkill>[]) =>
    call<{ items: SheetSkill[] }>("syncSkills", { user_id: userId, items }),
  services: (userId: string, items: SyncItem<SheetService>[]) =>
    call<{ items: SheetService[] }>("syncServices", { user_id: userId, items }),
  projects: (userId: string, items: SyncItem<SheetProject>[]) =>
    call<{ items: SheetProject[] }>("syncProjects", { user_id: userId, items }),
};

/* ------------------------------ theme / qr ------------------------------ */

export function getTheme(userId: string) {
  return call<{ theme: SheetTheme }>("getTheme", { user_id: userId });
}

export function updateTheme(userId: string, theme: ThemeInput) {
  return call<{ theme: SheetTheme }>("updateTheme", { ...theme, user_id: userId });
}

export function updateQrNfc(userId: string, siteUrl: string) {
  return call<{ qrNfc: SheetQrNfc }>("updateQrNfc", { user_id: userId, site_url: siteUrl });
}

/* ------------------------------- settings ------------------------------- */

export function getSettings(userId: string) {
  return call<{ settings: Record<string, string> }>("getSettings", { user_id: userId });
}

export function updateSetting(userId: string, name: string, value: string) {
  return call<{ settings: Record<string, string> }>("updateSetting", {
    user_id: userId,
    setting_name: name,
    setting_value: value,
  });
}

/* ------------------------------- analytics ------------------------------ */

/**
 * Fire-and-forget friendly: resolves to false instead of throwing, and never
 * retries (so a slow Sheet can't double-count).
 */
export async function recordAnalyticsEvent(event: AnalyticsEventInput): Promise<boolean> {
  const res = await apiRequest("recordAnalyticsEvent", event, { timeoutMs: 8_000, retries: 0 });
  return res.success;
}

export function getAnalytics(userId: string, opts: { days?: number; since?: string; event_type?: string } = {}) {
  return call<AnalyticsResult>("getAnalytics", { user_id: userId, ...opts }, { timeoutMs: 30_000 });
}

/* --------------------------------- media -------------------------------- */

export function uploadImage(userId: string, dataUrl: string, folder: "avatars" | "covers" | "projects") {
  return call<{ file_id: string; url: string; size: number }>(
    "uploadImage",
    { user_id: userId, data_url: dataUrl, folder },
    { timeoutMs: 45_000, retries: 0 },
  );
}
