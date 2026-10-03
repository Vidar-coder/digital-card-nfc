import { DEFAULT_THEME } from "../theme";
import type {
  AnalyticsEvent,
  AnalyticsEventType,
  Certification,
  Education,
  Experience,
  FullProfile,
  ListSection,
  ProfileBasics,
  Project,
  Service,
  Skill,
  SocialLink,
  Theme,
} from "../types";
import type {
  CompleteProfileData,
  ProfileInput,
  SheetAnalyticsEvent,
  SheetCertification,
  SheetEducation,
  SheetEventType,
  SheetExperience,
  SheetProject,
  SheetService,
  SheetSkill,
  SheetSocialLink,
  SheetTheme,
  ThemeInput,
} from "./types";

/**
 * Dashboard field ⇄ Google Sheets column mapping.
 * Every editable dashboard field has exactly one column — see the table in
 * apps-script/README.md. Keep these maps and apps-script/Config.gs in sync.
 */

/** Profile fields: dashboard key → 02_Profiles column. Typed exhaustively. */
export const PROFILE_FIELD_MAP = {
  username: "username",
  full_name: "full_name",
  title: "professional_title",
  company: "company",
  tagline: "bio",
  about_html: "about",
  avatar_url: "profile_photo",
  cover_url: "cover_photo",
  location: "location",
  email: "email",
  phone: "phone",
  website: "website",
  address: "address",
  published: "status",
} as const satisfies Record<Exclude<keyof ProfileBasics, "id" | "user_id" | "updated_at">, keyof ProfileInput>;

export const THEME_FIELD_MAP = {
  preset: "theme_name",
  mode: "mode",
  primary: "primary_color",
  secondary: "secondary_color",
  accent: "accent_color",
  background: "background_color",
  text: "text_color",
  button: "button_color",
  card_style: "card_style",
  radius: "border_radius",
  font: "font_family",
  avatar_shape: "profile_image_style",
} as const satisfies Record<keyof Theme, keyof ThemeInput>;

/** Per list section: sync action key, ID column, and item field → column map. */
export const LIST_MAPS = {
  experiences: {
    idField: "experience_id",
    fields: { company: "company", position: "position", location: "location", start_date: "start_date", end_date: "end_date", description: "description" },
  },
  education: {
    idField: "education_id",
    fields: { school: "school", degree: "degree", field: "field_of_study", start_year: "start_year", end_year: "end_year" },
  },
  certifications: {
    idField: "certification_id",
    fields: { name: "certification_name", issuer: "issuer", year: "year", url: "credential_url" },
  },
  skills: { idField: "skill_id", fields: { name: "skill_name" } },
  services: { idField: "service_id", fields: { name: "service_name", description: "description", icon: "icon" } },
  projects: {
    idField: "project_id",
    fields: {
      title: "project_title",
      description: "description",
      image_url: "image_url",
      technologies: "technologies",
      project_url: "project_url",
      github_url: "github_url",
    },
  },
  social_links: { idField: "social_id", fields: { platform: "platform", url: "url", label: "display_name" } },
} as const satisfies {
  experiences: { idField: string; fields: Record<Exclude<keyof Experience, "id">, keyof SheetExperience> };
  education: { idField: string; fields: Record<Exclude<keyof Education, "id">, keyof SheetEducation> };
  certifications: { idField: string; fields: Record<Exclude<keyof Certification, "id">, keyof SheetCertification> };
  skills: { idField: string; fields: Record<Exclude<keyof Skill, "id">, keyof SheetSkill> };
  services: { idField: string; fields: Record<Exclude<keyof Service, "id">, keyof SheetService> };
  projects: { idField: string; fields: Record<Exclude<keyof Project, "id">, keyof SheetProject> };
  social_links: { idField: string; fields: Record<Exclude<keyof SocialLink, "id">, keyof SheetSocialLink> };
};

/** Server-generated IDs look like "EXP-000012". Client-side drafts use UUIDs → treated as new. */
const SHEET_ID = /^[A-Z]{2,4}-\d{6,}$/;

const nullIfEmpty = (v: string | null | undefined) => (v ? v : null);

/* ---------------------------- sheets → app ------------------------------ */

export function themeFromSheet(t: SheetTheme | null | undefined): Theme {
  if (!t) return { ...DEFAULT_THEME };
  return {
    preset: t.theme_name || DEFAULT_THEME.preset,
    mode: t.mode || DEFAULT_THEME.mode,
    primary: t.primary_color || DEFAULT_THEME.primary,
    secondary: t.secondary_color || DEFAULT_THEME.secondary,
    accent: t.accent_color || DEFAULT_THEME.accent,
    background: t.background_color || DEFAULT_THEME.background,
    text: t.text_color || DEFAULT_THEME.text,
    button: t.button_color || DEFAULT_THEME.button,
    card_style: t.card_style || DEFAULT_THEME.card_style,
    radius: t.border_radius ?? DEFAULT_THEME.radius,
    font: t.font_family || DEFAULT_THEME.font,
    avatar_shape: t.profile_image_style || DEFAULT_THEME.avatar_shape,
  };
}

export const listFromSheet = {
  experiences: (rows: SheetExperience[]): Experience[] =>
    rows.map((r) => ({
      id: r.experience_id,
      company: r.company,
      position: r.position,
      location: r.location || null,
      start_date: r.start_date,
      end_date: r.is_current ? null : nullIfEmpty(r.end_date),
      description: r.description,
    })),
  education: (rows: SheetEducation[]): Education[] =>
    rows.map((r) => ({
      id: r.education_id,
      school: r.school,
      degree: r.degree,
      field: r.field_of_study,
      start_year: r.start_year,
      end_year: r.end_year,
    })),
  certifications: (rows: SheetCertification[]): Certification[] =>
    rows.map((r) => ({ id: r.certification_id, name: r.certification_name, issuer: r.issuer, year: r.year, url: nullIfEmpty(r.credential_url) })),
  skills: (rows: SheetSkill[]): Skill[] => rows.map((r) => ({ id: r.skill_id, name: r.skill_name })),
  services: (rows: SheetService[]): Service[] =>
    rows.map((r) => ({ id: r.service_id, name: r.service_name, description: r.description, icon: nullIfEmpty(r.icon) })),
  projects: (rows: SheetProject[]): Project[] =>
    rows.map((r) => ({
      id: r.project_id,
      title: r.project_title,
      description: r.description,
      image_url: nullIfEmpty(r.image_url),
      technologies: r.technologies ?? [],
      project_url: nullIfEmpty(r.project_url),
      github_url: nullIfEmpty(r.github_url),
    })),
  social_links: (rows: SheetSocialLink[]): SocialLink[] =>
    rows.map((r) => ({ id: r.social_id, platform: r.platform, url: r.url, label: nullIfEmpty(r.display_name) })),
};

export function fullProfileFromSheet(c: CompleteProfileData): FullProfile {
  const p = c.profile;
  return {
    id: p.profile_id,
    user_id: p.user_id,
    username: p.username,
    full_name: p.full_name,
    title: p.professional_title,
    company: p.company,
    tagline: p.bio,
    about_html: p.about,
    avatar_url: nullIfEmpty(p.profile_photo),
    cover_url: nullIfEmpty(p.cover_photo),
    location: p.location,
    email: p.email,
    phone: p.phone,
    website: p.website,
    address: p.address,
    published: p.status !== "draft",
    updated_at: p.updated_at,
    theme: themeFromSheet(c.theme),
    experiences: listFromSheet.experiences(c.experience ?? []),
    education: listFromSheet.education(c.education ?? []),
    certifications: listFromSheet.certifications(c.certifications ?? []),
    skills: listFromSheet.skills(c.skills ?? []),
    services: listFromSheet.services(c.services ?? []),
    projects: listFromSheet.projects(c.projects ?? []),
    social_links: listFromSheet.social_links(c.socialLinks ?? []),
  };
}

/* ---------------------------- app → sheets ------------------------------ */

/** Maps a partial dashboard patch to profile columns (only keys present are sent). */
export function profilePatchToSheet(patch: Partial<ProfileBasics>): ProfileInput {
  const out: Record<string, unknown> = {};
  for (const [key, col] of Object.entries(PROFILE_FIELD_MAP)) {
    if (!(key in patch)) continue;
    const v = patch[key as keyof ProfileBasics];
    if (key === "published") out[col] = v ? "published" : "draft";
    else out[col] = v ?? "";
  }
  return out as ProfileInput;
}

export function themeToSheet(theme: Theme): ThemeInput {
  const out: Record<string, unknown> = {};
  for (const [key, col] of Object.entries(THEME_FIELD_MAP)) out[col] = theme[key as keyof Theme];
  return out as ThemeInput;
}

/** Converts dashboard list items to sync items. Existing sheet IDs are kept; draft IDs are dropped. */
export function listToSheet(section: ListSection, items: { id: string }[]): Record<string, unknown>[] {
  const map = LIST_MAPS[section];
  return items.map((item) => {
    const row: Record<string, unknown> = {};
    if (SHEET_ID.test(item.id)) row[map.idField] = item.id;
    for (const [key, col] of Object.entries(map.fields)) {
      const v = (item as Record<string, unknown>)[key];
      row[col] = v ?? "";
    }
    if (section === "experiences") row.is_current = (item as Experience).end_date === null;
    return row;
  });
}

/** Translates Apps Script field errors (sheet columns) back to dashboard field names. */
export function fieldErrorsFromSheet(
  fields: Record<string, string[]> | undefined,
  section: ListSection | "profile" | "theme",
): Record<string, string[]> | undefined {
  if (!fields) return undefined;
  const reverse: Record<string, string> = {};
  const source =
    section === "profile" ? PROFILE_FIELD_MAP : section === "theme" ? THEME_FIELD_MAP : LIST_MAPS[section].fields;
  for (const [app, col] of Object.entries(source)) reverse[col] = app;
  const out: Record<string, string[]> = {};
  for (const [key, msgs] of Object.entries(fields)) {
    const m = /^(\d+)\.(.+)$/.exec(key);
    if (m) out[`${m[1]}.${reverse[m[2]] ?? m[2]}`] = msgs;
    else out[reverse[key] ?? key] = msgs;
  }
  return out;
}

/* ------------------------------ analytics ------------------------------- */

const EVENT_TO_SHEET: Record<AnalyticsEventType, SheetEventType> = {
  view: "profile_view",
  qr_scan: "qr_scan",
  nfc_tap: "nfc_tap",
  share: "profile_share",
  vcard_download: "contact_download",
  phone_click: "phone_click",
  sms_click: "sms_click",
  email_click: "email_click",
  social_click: "social_click",
  website_click: "website_click",
  project_click: "portfolio_click",
};

const EVENT_FROM_SHEET = Object.fromEntries(Object.entries(EVENT_TO_SHEET).map(([a, s]) => [s, a])) as Record<
  SheetEventType,
  AnalyticsEventType
>;

/** Which meta key is stored in event_value for each event. */
const VALUE_KEY: Partial<Record<AnalyticsEventType, string>> = {
  view: "source",
  social_click: "platform",
  project_click: "project",
  share: "method",
};

export function eventToSheet(type: AnalyticsEventType, meta: Record<string, string> | null) {
  const key = VALUE_KEY[type];
  return { event_type: EVENT_TO_SHEET[type], event_value: key ? (meta?.[key] ?? "") : "" };
}

export function eventFromSheet(e: SheetAnalyticsEvent, profileId: string): AnalyticsEvent | null {
  const type = EVENT_FROM_SHEET[e.event_type];
  const at = new Date(e.timestamp);
  if (!type || Number.isNaN(at.getTime())) return null;
  const key = VALUE_KEY[type];
  return {
    id: e.analytics_id,
    profile_id: profileId,
    event_type: type,
    meta: key && e.event_value ? { [key]: e.event_value } : null,
    created_at: at.toISOString(),
  };
}
