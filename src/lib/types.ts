/**
 * Domain types shared by the public profile, the dashboard and the data layer.
 * App-side shapes; src/lib/sheets/mappers.ts maps them to Google Sheets columns.
 */

export type ThemePresetId =
  | "minimal"
  | "corporate"
  | "elegant"
  | "modern"
  | "dark"
  | "glass"
  | "creative"
  | "executive"
  | "midnight"
  | "slate"
  | "luxury"
  | "navy";

export type CardStyle = "elevated" | "outlined" | "flat" | "glass";
export type AvatarShape = "circle" | "rounded" | "square";
export type ColorMode = "light" | "dark";
export type FontId = "inter" | "jakarta" | "grotesk" | "playfair" | "lora" | "manrope";

export interface Theme {
  preset: ThemePresetId | "custom";
  mode: ColorMode;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  button: string;
  card_style: CardStyle;
  radius: number; // px, 0–28
  font: FontId;
  avatar_shape: AvatarShape;
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  location?: string | null;
  start_date: string; // YYYY-MM
  end_date: string | null; // YYYY-MM, null = present
  description: string;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  field: string;
  start_year: number | null;
  end_year: number | null;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  year: number | null;
  url: string | null;
}

export interface Skill {
  id: string;
  name: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  icon: string | null; // lucide icon key from SERVICE_ICONS
}

export interface Project {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  technologies: string[];
  project_url: string | null;
  github_url: string | null;
}

export type SocialPlatform =
  | "facebook"
  | "instagram"
  | "linkedin"
  | "x"
  | "tiktok"
  | "youtube"
  | "github"
  | "website"
  | "whatsapp"
  | "telegram"
  | "dribbble"
  | "behance"
  | "custom";

export interface SocialLink {
  id: string;
  platform: SocialPlatform;
  url: string;
  label: string | null; // used by "custom"
}

export interface ProfileBasics {
  id: string;
  user_id: string | null;
  username: string;
  full_name: string;
  title: string;
  company: string;
  tagline: string; // short professional introduction
  about_html: string;
  avatar_url: string | null;
  cover_url: string | null;
  location: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  published: boolean;
  updated_at?: string;
}

/** The aggregate rendered on /p/[username] and edited in the dashboard. */
export interface FullProfile extends ProfileBasics {
  theme: Theme;
  experiences: Experience[];
  education: Education[];
  certifications: Certification[];
  skills: Skill[];
  services: Service[];
  projects: Project[];
  social_links: SocialLink[];
}

export type ListSection =
  | "experiences"
  | "education"
  | "certifications"
  | "skills"
  | "services"
  | "projects"
  | "social_links";

export const ANALYTICS_EVENTS = [
  "view",
  "qr_scan",
  "nfc_tap",
  "share",
  "vcard_download",
  "phone_click",
  "sms_click",
  "email_click",
  "social_click",
  "website_click",
  "project_click",
] as const;

export type AnalyticsEventType = (typeof ANALYTICS_EVENTS)[number];

export interface AnalyticsEvent {
  id: string;
  profile_id: string;
  event_type: AnalyticsEventType;
  meta: Record<string, string> | null;
  created_at: string;
}

export interface AnalyticsSummary {
  totals: Record<AnalyticsEventType, number>;
  daily: { date: string; views: number; actions: number }[];
  socialBreakdown: { platform: string; clicks: number }[];
  sources: { source: string; count: number }[];
  rangeDays: number;
}

export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };
