/**
 * Types for the Google Apps Script API (apps-script/). Field names match the
 * Google Sheets column headers exactly (see apps-script/Config.gs).
 */

/* ------------------------------ envelope -------------------------------- */

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "DUPLICATE"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "UNAUTHORIZED"
  | "RATE_LIMITED"
  | "BUSY"
  | "BAD_REQUEST"
  | "UNKNOWN_ACTION"
  | "METHOD_NOT_ALLOWED"
  | "PAYLOAD_TOO_LARGE"
  | "SETUP_REQUIRED"
  | "SESSION_INVALID"
  | "INTERNAL_ERROR"
  | "NETWORK_ERROR"; // client-side: request never got a valid response

export interface ApiErrorBody {
  code: ApiErrorCode;
  /** For VALIDATION_ERROR / DUPLICATE: { fields: { column: ["message"] } } */
  details: { fields?: Record<string, string[]> } | Record<string, unknown> | string | null;
}

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
  error: null;
}

export interface ApiFailure {
  success: false;
  message: string;
  data: null;
  error: ApiErrorBody;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

/* -------------------------------- rows ---------------------------------- */

interface Timestamps {
  created_at: string; // ISO 8601 in the spreadsheet's timezone
  updated_at: string;
}

/** Public user record (secret columns are never returned). */
export interface SheetUser extends Timestamps {
  user_id: string;
  email: string;
  username: string;
  status: "active" | "suspended";
  role: UserRole;
  session_version: number;
  last_login_at: string;
}

export type UserRole = "user" | "admin";

/** Row of the admin "Users" list (listUsers). */
export interface SheetAdminUser extends SheetUser {
  has_password: boolean;
  full_name: string;
  professional_title: string;
  profile_status: "published" | "draft" | "";
  profile_url: string;
}

/** Returned only by getAuthUser (server-side sign-in). */
export interface SheetAuthUser {
  user_id: string;
  email: string;
  username: string;
  status: "active" | "suspended";
  password_hash: string;
  session_version: number;
}

export interface SheetProfile extends Timestamps {
  profile_id: string;
  user_id: string;
  username: string;
  full_name: string;
  professional_title: string;
  company: string;
  profile_photo: string;
  cover_photo: string;
  bio: string;
  about: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  location: string;
  profile_url: string;
  status: "published" | "draft";
}

export type SheetSocialPlatform =
  | "facebook" | "instagram" | "linkedin" | "x" | "tiktok" | "youtube" | "github"
  | "website" | "whatsapp" | "telegram" | "dribbble" | "behance" | "custom";

export interface SheetSocialLink extends Timestamps {
  social_id: string;
  user_id: string;
  platform: SheetSocialPlatform;
  display_name: string;
  url: string;
  icon: string;
  display_order: number;
  is_visible: boolean;
}

export interface SheetExperience extends Timestamps {
  experience_id: string;
  user_id: string;
  company: string;
  position: string;
  location: string;
  start_date: string; // YYYY-MM
  end_date: string; // YYYY-MM or ""
  is_current: boolean;
  description: string;
  display_order: number;
}

export interface SheetEducation extends Timestamps {
  education_id: string;
  user_id: string;
  school: string;
  degree: string;
  field_of_study: string;
  start_year: number | null;
  end_year: number | null;
  description: string;
  display_order: number;
}

export interface SheetCertification extends Timestamps {
  certification_id: string;
  user_id: string;
  certification_name: string;
  issuer: string;
  year: number | null;
  credential_url: string;
  display_order: number;
}

export interface SheetSkill extends Timestamps {
  skill_id: string;
  user_id: string;
  skill_name: string;
  proficiency: "" | "beginner" | "intermediate" | "advanced" | "expert";
  display_order: number;
}

export interface SheetService extends Timestamps {
  service_id: string;
  user_id: string;
  service_name: string;
  description: string;
  icon: string;
  display_order: number;
  is_visible: boolean;
}

export interface SheetProject extends Timestamps {
  project_id: string;
  user_id: string;
  project_title: string;
  description: string;
  image_url: string;
  project_url: string;
  github_url: string;
  technologies: string[];
  display_order: number;
  is_featured: boolean;
  is_visible: boolean;
}

export interface SheetContactAction extends Timestamps {
  contact_id: string;
  user_id: string;
  action_type: "phone" | "sms" | "email" | "website" | "location" | "whatsapp" | "custom";
  action_value: string;
  label: string;
  display_order: number;
  is_visible: boolean;
}

export interface SheetTheme extends Timestamps {
  theme_id: string | null;
  user_id: string;
  theme_name: "minimal" | "corporate" | "elegant" | "modern" | "dark" | "glass" | "creative" | "custom";
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  button_color: string;
  font_family: "inter" | "jakarta" | "grotesk" | "manrope" | "playfair" | "lora";
  card_style: "elevated" | "outlined" | "flat" | "glass";
  border_radius: number;
  profile_image_style: "circle" | "rounded" | "square";
  mode: "light" | "dark";
}

export interface SheetQrNfc extends Timestamps {
  qr_nfc_id: string;
  user_id: string;
  profile_url: string;
  qr_code_url: string;
  nfc_url: string;
}

export type SheetEventType =
  | "profile_view" | "qr_scan" | "nfc_tap" | "phone_click" | "sms_click" | "email_click"
  | "website_click" | "social_click" | "portfolio_click" | "contact_download" | "profile_share";

export interface SheetAnalyticsEvent {
  analytics_id: string;
  event_type: SheetEventType;
  event_value: string;
  referrer: string;
  device: string;
  browser: string;
  country: string;
  timestamp: string;
}

export interface SheetSetting extends Timestamps {
  setting_id: string;
  user_id: string;
  setting_name: string;
  setting_value: string;
}

/* ---------------------------- action payloads --------------------------- */

/** Fields a client may write (server sets IDs, user_id and timestamps). */
type Writable<T, Id extends keyof T> = Partial<Omit<T, Id | "user_id" | "created_at" | "updated_at">>;

export type ProfileInput = Writable<SheetProfile, "profile_id">;
export type ThemeInput = Writable<SheetTheme, "theme_id">;
export type ProjectInput = Writable<SheetProject, "project_id">;

/** Item sent to a sync<Section> action. Include the id to update; omit to create. */
export type SyncItem<T> = Partial<T>;

export interface CompleteProfileData {
  profile: SheetProfile;
  socialLinks: SheetSocialLink[];
  experience: SheetExperience[];
  education: SheetEducation[];
  certifications: SheetCertification[];
  skills: SheetSkill[];
  services: SheetService[];
  projects: SheetProject[];
  contactActions: SheetContactAction[];
  theme: SheetTheme;
  qrNfc: SheetQrNfc | null;
  /** Only in private (owner) responses */
  user?: SheetUser;
  settings?: Record<string, string>;
}

export interface SessionResult {
  user: SheetUser;
  complete: CompleteProfileData;
}

export interface SystemInfo {
  name: string;
  version: string;
  spreadsheet_name: string;
  spreadsheet_url: string;
  timezone: string;
  sheets: string[];
}

export interface AnalyticsResult {
  range: { since: string; until: string; days: number };
  totals: Record<SheetEventType, number>;
  daily: { date: string; total: number; profile_view: number }[];
  events: SheetAnalyticsEvent[];
  count: number;
}

export interface AnalyticsEventInput {
  username?: string;
  user_id?: string;
  event_type: SheetEventType;
  event_value?: string;
  referrer?: string;
  device?: string;
  browser?: string;
  country?: string;
}

/** Every action the Apps Script router accepts. */
export type ApiAction =
  | "health"
  | "registerUser" | "getAuthUser" | "recordLogin" | "getSession" | "changePassword"
  | "requestPasswordReset" | "resetPassword" | "getSystemInfo" | "listUsers"
  | "getUser" | "updateUser" | "checkUsername"
  | "createProfile" | "getProfile" | "getProfileByUsername" | "updateProfile" | "deleteProfile" | "getCompleteProfile"
  | "createSocialLink" | "getSocialLinks" | "updateSocialLink" | "deleteSocialLink" | "syncSocialLinks"
  | "createExperience" | "getExperience" | "updateExperience" | "deleteExperience" | "syncExperience"
  | "createEducation" | "getEducation" | "updateEducation" | "deleteEducation" | "syncEducation"
  | "createCertification" | "getCertifications" | "updateCertification" | "deleteCertification" | "syncCertifications"
  | "createSkill" | "getSkills" | "updateSkill" | "deleteSkill" | "syncSkills"
  | "createService" | "getServices" | "updateService" | "deleteService" | "syncServices"
  | "createProject" | "getProjects" | "updateProject" | "deleteProject" | "syncProjects"
  | "createContactAction" | "getContactActions" | "updateContactAction" | "deleteContactAction" | "syncContactActions"
  | "getTheme" | "updateTheme"
  | "getQrNfc" | "updateQrNfc"
  | "getSettings" | "updateSetting"
  | "recordAnalyticsEvent" | "getAnalytics"
  | "uploadImage" | "deleteImage";
