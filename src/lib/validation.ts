import { z } from "zod";
import { ensureProtocol, RESERVED_USERNAMES, USERNAME_REGEX } from "./utils";

const trimmed = (max: number) => z.string().trim().max(max, `Must be ${max} characters or fewer`);

/** Empty string allowed; otherwise must be http(s). Bare domains get https:// added. */
const optionalUrl = z.preprocess(
  (v) => (typeof v === "string" && v.trim() ? ensureProtocol(v.trim()) : ""),
  z.union([z.literal(""), z.url({ protocol: /^https?$/, message: "Enter a valid URL" })]),
);

const nullableUrl = z.preprocess(
  (v) => (typeof v === "string" && v.trim() ? ensureProtocol(v.trim()) : null),
  z.url({ protocol: /^https?$/, message: "Enter a valid URL" }).nullable(),
);

const hexColor = z.string().regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i, "Use a hex color like #4f46e5");

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "At least 3 characters")
  .max(30, "30 characters max")
  .regex(USERNAME_REGEX, "Use lowercase letters, numbers, - or _ (must start and end with a letter/number)")
  .refine((v) => !RESERVED_USERNAMES.has(v), "This username is reserved");

export const basicsSchema = z.object({
  username: usernameSchema,
  full_name: trimmed(80).min(1, "Name is required"),
  title: trimmed(120),
  company: trimmed(120),
  tagline: trimmed(280),
  avatar_url: z.string().max(2_000_000).nullable(),
  cover_url: z.string().max(2_000_000).nullable(),
  published: z.boolean(),
});

export const contactSchema = z.object({
  email: z.union([z.literal(""), z.email("Enter a valid email")]),
  phone: z
    .string()
    .trim()
    .max(30)
    .refine((v) => v === "" || /^\+?[\d\s().-]{6,}$/.test(v), "Enter a valid phone number"),
  website: optionalUrl,
  location: trimmed(120),
  address: trimmed(240),
});

export const aboutSchema = z.object({ about_html: z.string().max(20_000) });

const id = z.string().min(1).max(64);

export const experienceSchema = z.object({
  id,
  company: trimmed(120).min(1, "Company is required"),
  position: trimmed(120).min(1, "Position is required"),
  location: trimmed(120).nullable().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}$/, "Start date is required"),
  end_date: z.string().regex(/^\d{4}-\d{2}$/).nullable(),
  description: trimmed(2000),
});

const year = z.coerce.number().int().min(1950).max(2100).nullable();

export const educationSchema = z.object({
  id,
  school: trimmed(160).min(1, "School is required"),
  degree: trimmed(120),
  field: trimmed(120),
  start_year: year,
  end_year: year,
});

export const certificationSchema = z.object({
  id,
  name: trimmed(160).min(1, "Name is required"),
  issuer: trimmed(120),
  year,
  url: nullableUrl,
});

export const skillSchema = z.object({ id, name: trimmed(40).min(1) });

export const serviceSchema = z.object({
  id,
  name: trimmed(80).min(1, "Service name is required"),
  description: trimmed(500),
  icon: z.string().max(40).nullable(),
});

export const projectSchema = z.object({
  id,
  title: trimmed(120).min(1, "Title is required"),
  description: trimmed(1000),
  image_url: z.string().max(2_000_000).nullable(),
  technologies: z.array(trimmed(40)).max(20),
  project_url: nullableUrl,
  github_url: nullableUrl,
});

export const socialLinkSchema = z.object({
  id,
  platform: z.enum([
    "facebook", "instagram", "linkedin", "x", "tiktok", "youtube", "github",
    "website", "whatsapp", "telegram", "dribbble", "behance", "custom",
  ]),
  url: z.preprocess(
    (v) => (typeof v === "string" ? ensureProtocol(v.trim()) : v),
    z.url({ protocol: /^https?$/, message: "Enter a valid URL" }),
  ),
  label: trimmed(40).nullable(),
});

export const listSchemas = {
  experiences: z.array(experienceSchema).max(30),
  education: z.array(educationSchema).max(20),
  certifications: z.array(certificationSchema).max(30),
  skills: z.array(skillSchema).max(60),
  services: z.array(serviceSchema).max(20),
  projects: z.array(projectSchema).max(30),
  social_links: z.array(socialLinkSchema).max(20),
} as const;

export const themeSchema = z.object({
  preset: z.enum(["minimal", "corporate", "elegant", "modern", "dark", "glass", "creative", "custom"]),
  mode: z.enum(["light", "dark"]),
  primary: hexColor,
  secondary: hexColor,
  accent: hexColor,
  background: hexColor,
  text: hexColor,
  button: hexColor,
  card_style: z.enum(["elevated", "outlined", "flat", "glass"]),
  radius: z.coerce.number().int().min(0).max(28),
  font: z.enum(["inter", "jakarta", "grotesk", "playfair", "lora", "manrope"]),
  avatar_shape: z.enum(["circle", "rounded", "square"]),
});

export const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .max(72, "72 characters max")
  .regex(/[A-Za-z]/, "Include at least one letter")
  .regex(/\d/, "Include at least one number");

export const loginSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  full_name: trimmed(80).min(1, "Name is required"),
  username: usernameSchema,
  email: z.email("Enter a valid email"),
  password: passwordSchema,
});

export function fieldErrors(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    (out[key] ??= []).push(issue.message);
  }
  return out;
}
