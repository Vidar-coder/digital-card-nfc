import type { FullProfile } from "./types";

export interface CompletionItem {
  key: string;
  label: string;
  href: string;
  done: boolean;
  weight: number;
}

/** Weighted checklist powering the dashboard's profile-completion indicator. */
export function profileCompletion(p: FullProfile): { percent: number; items: CompletionItem[] } {
  const items: CompletionItem[] = [
    { key: "name", label: "Add your name", href: "/dashboard/profile", done: !!p.full_name, weight: 10 },
    { key: "photo", label: "Upload a profile photo", href: "/dashboard/profile", done: !!p.avatar_url, weight: 12 },
    { key: "title", label: "Add your job title", href: "/dashboard/profile", done: !!p.title, weight: 8 },
    { key: "tagline", label: "Write a short introduction", href: "/dashboard/profile", done: !!p.tagline, weight: 8 },
    { key: "phone", label: "Add a phone number", href: "/dashboard/contact", done: !!p.phone, weight: 10 },
    { key: "email", label: "Add an email address", href: "/dashboard/contact", done: !!p.email, weight: 10 },
    { key: "about", label: "Tell your story in About", href: "/dashboard/about", done: p.about_html.replace(/<[^>]*>/g, "").trim().length > 40, weight: 8 },
    { key: "experience", label: "Add work experience", href: "/dashboard/experience", done: p.experiences.length > 0, weight: 8 },
    { key: "skills", label: "List at least 3 skills", href: "/dashboard/skills", done: p.skills.length >= 3, weight: 6 },
    { key: "projects", label: "Showcase a project", href: "/dashboard/projects", done: p.projects.length > 0, weight: 8 },
    { key: "social", label: "Link a social profile", href: "/dashboard/social", done: p.social_links.length > 0, weight: 6 },
    { key: "education", label: "Add education", href: "/dashboard/education", done: p.education.length > 0, weight: 6 },
  ];
  const total = items.reduce((s, i) => s + i.weight, 0);
  const done = items.reduce((s, i) => s + (i.done ? i.weight : 0), 0);
  return { percent: Math.round((done / total) * 100), items };
}
