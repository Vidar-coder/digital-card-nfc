import {
  ArrowUpRight,
  Award,
  Briefcase,
  GraduationCap,
  Layers,
  Mail,
  MapPin,
  Phone,
  Globe,
  Sparkles,
  UserRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import type {
  Certification,
  Education,
  Experience,
  FullProfile,
  Project,
  Service,
  Skill,
} from "@/lib/types";
import { cn, ensureProtocol, formatRange, phoneHref, prettyUrl } from "@/lib/utils";
import { SocialIcon } from "./social-icon";
import { serviceIcon } from "./service-icons";
import { TrackedLink } from "./tracked-link";

/* ------------------------------------------------------------------------- */

export function Section({
  id,
  title,
  icon: Icon,
  children,
  className,
}: {
  id: string;
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={cn("p-card animate-rise p-5 @md:p-6", className)}>
      <h2 id={`${id}-title`} className="font-heading mb-4 flex items-center gap-2.5 text-[17px] font-semibold tracking-tight">
        <span className="flex size-8 items-center justify-center rounded-lg bg-p-primary/10 text-p-primary">
          <Icon className="size-4" aria-hidden />
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------------- */

export function AboutSection({ html }: { html: string }) {
  if (!html.replace(/<[^>]*>/g, "").trim()) return null;
  return (
    <Section id="about" title="About" icon={UserRound}>
      {/* html is sanitized server-side (or produced by the editor in preview) */}
      <div className="p-prose text-[15px] leading-relaxed text-p-muted" dangerouslySetInnerHTML={{ __html: html }} />
    </Section>
  );
}

/* ------------------------------------------------------------------------- */

export function ServicesSection({ services }: { services: Service[] }) {
  if (!services.length) return null;
  return (
    <Section id="services" title="Services" icon={Sparkles}>
      <div className="grid gap-3 @xl:grid-cols-2">
        {services.map((s) => {
          const Icon = serviceIcon(s.icon);
          return (
            <div key={s.id} className="flex gap-3.5 rounded-[calc(var(--p-radius)*0.7)] bg-p-surface p-4">
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-xl text-[var(--p-primary-text)]"
                style={{ background: "linear-gradient(135deg, var(--p-primary), var(--p-secondary))" }}
              >
                <Icon className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h3 className="font-semibold">{s.name}</h3>
                {s.description && <p className="mt-1 text-sm leading-relaxed text-p-muted">{s.description}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------------- */

export function ExperienceSection({ items }: { items: Experience[] }) {
  if (!items.length) return null;
  return (
    <Section id="experience" title="Experience" icon={Briefcase}>
      <ol className="relative space-y-6 border-l border-p-border pl-6">
        {items.map((e) => (
          <li key={e.id} className="relative">
            <span
              className={cn(
                "absolute -left-[30.5px] top-1.5 size-3 rounded-full border-2 border-p-primary",
                e.end_date ? "bg-p-bg" : "bg-p-primary",
              )}
              aria-hidden
            />
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
              <h3 className="font-semibold">{e.position}</h3>
              <span className="text-xs font-medium tabular-nums text-p-muted">{formatRange(e.start_date, e.end_date)}</span>
            </div>
            <p className="text-sm font-medium text-p-primary">
              {e.company}
              {e.location && <span className="font-normal text-p-muted"> · {e.location}</span>}
            </p>
            {e.description && <p className="mt-2 text-sm leading-relaxed text-p-muted">{e.description}</p>}
          </li>
        ))}
      </ol>
    </Section>
  );
}

/* ------------------------------------------------------------------------- */

export function SkillsSection({ skills }: { skills: Skill[] }) {
  if (!skills.length) return null;
  return (
    <Section id="skills" title="Skills" icon={Wrench}>
      <ul className="flex flex-wrap gap-2">
        {skills.map((s) => (
          <li
            key={s.id}
            className="rounded-full border border-p-border bg-p-surface px-3.5 py-1.5 text-sm font-medium text-p-text/90"
          >
            {s.name}
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* ------------------------------------------------------------------------- */

export function EducationSection({
  education,
  certifications,
}: {
  education: Education[];
  certifications: Certification[];
}) {
  if (!education.length && !certifications.length) return null;
  return (
    <Section id="education" title="Education & Certifications" icon={GraduationCap}>
      <div className="space-y-4">
        {education.map((ed) => (
          <div key={ed.id} className="flex gap-3.5">
            <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-p-surface text-p-primary">
              <GraduationCap className="size-5" aria-hidden />
            </span>
            <div>
              <h3 className="font-semibold">{ed.school}</h3>
              <p className="text-sm text-p-muted">
                {[ed.degree, ed.field].filter(Boolean).join(" in ")}
                {(ed.start_year || ed.end_year) && (
                  <span className="tabular-nums">
                    {" · "}
                    {ed.start_year ?? ""}
                    {ed.start_year && ed.end_year ? "–" : ""}
                    {ed.end_year ?? (ed.start_year ? "Present" : "")}
                  </span>
                )}
              </p>
            </div>
          </div>
        ))}
        {certifications.length > 0 && (
          <ul className={cn("grid gap-2 @xl:grid-cols-2", education.length && "border-t border-p-border pt-4")}>
            {certifications.map((c) => {
              const body = (
                <>
                  <Award className="mt-0.5 size-4 shrink-0 text-p-accent" aria-hidden />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{c.name}</span>
                    <span className="block text-xs text-p-muted">
                      {[c.issuer, c.year].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                </>
              );
              return (
                <li key={c.id}>
                  {c.url ? (
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex gap-2.5 rounded-lg p-2 transition hover:bg-p-surface"
                    >
                      {body}
                    </a>
                  ) : (
                    <div className="flex gap-2.5 p-2">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------------- */

function ProjectCover({ project }: { project: Project }) {
  if (project.image_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={project.image_url} alt="" loading="lazy" className="aspect-[16/9] w-full object-cover" />;
  }
  return (
    <div
      className="relative flex aspect-[16/9] w-full items-end overflow-hidden p-4"
      style={{
        background:
          "radial-gradient(90% 120% at 100% 0%, color-mix(in srgb, var(--p-secondary) 55%, transparent), transparent 70%), linear-gradient(135deg, color-mix(in srgb, var(--p-primary) 85%, black), var(--p-primary))",
      }}
      aria-hidden
    >
      <Layers className="absolute right-4 top-4 size-6 text-white/40" />
      <span className="font-heading text-lg font-semibold leading-tight text-white/95">{project.title}</span>
    </div>
  );
}

export function PortfolioSection({
  projects,
  username,
  preview,
}: {
  projects: Project[];
  username: string;
  preview?: boolean;
}) {
  if (!projects.length) return null;
  return (
    <Section id="portfolio" title="Portfolio" icon={Layers}>
      <div className="grid gap-4 @xl:grid-cols-2">
        {projects.map((p) => (
          <article
            key={p.id}
            className="group flex flex-col overflow-hidden rounded-[calc(var(--p-radius)*0.8)] border border-p-border bg-p-surface"
          >
            <ProjectCover project={p} />
            <div className="flex flex-1 flex-col p-4">
              <h3 className="font-semibold">{p.title}</h3>
              {p.description && <p className="mt-1.5 text-sm leading-relaxed text-p-muted">{p.description}</p>}
              {p.technologies.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Technologies">
                  {p.technologies.map((t) => (
                    <li key={t} className="rounded-md bg-p-primary/10 px-2 py-0.5 text-xs font-medium text-p-primary">
                      {t}
                    </li>
                  ))}
                </ul>
              )}
              {(p.project_url || p.github_url) && (
                <div className="mt-auto flex gap-2 pt-4">
                  {p.project_url && (
                    <TrackedLink
                      href={p.project_url}
                      username={username}
                      event="project_click"
                      meta={{ project: p.title.slice(0, 60) }}
                      preview={preview}
                      className="p-btn inline-flex min-h-10 items-center gap-1.5 bg-p-button px-3.5 text-sm font-medium text-p-button-text transition hover:brightness-110"
                    >
                      View project <ArrowUpRight className="size-4" aria-hidden />
                    </TrackedLink>
                  )}
                  {p.github_url && (
                    <TrackedLink
                      href={p.github_url}
                      username={username}
                      event="project_click"
                      meta={{ project: p.title.slice(0, 60), kind: "github" }}
                      preview={preview}
                      className="p-btn inline-flex min-h-10 items-center gap-1.5 border border-p-border px-3.5 text-sm font-medium transition hover:border-p-primary/50"
                    >
                      <SocialIcon platform="github" className="size-4" /> Code
                    </TrackedLink>
                  )}
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------------- */

export function ContactSection({ profile, preview }: { profile: FullProfile; preview?: boolean }) {
  const tel = phoneHref(profile.phone);
  const rows = [
    profile.phone && { icon: Phone, label: "Phone", value: profile.phone, href: `tel:${tel}`, event: "phone_click" as const },
    profile.email && { icon: Mail, label: "Email", value: profile.email, href: `mailto:${profile.email}`, event: "email_click" as const },
    profile.website && {
      icon: Globe,
      label: "Website",
      value: prettyUrl(profile.website),
      href: ensureProtocol(profile.website),
      event: "website_click" as const,
    },
    (profile.address || profile.location) && {
      icon: MapPin,
      label: "Location",
      value: profile.address || profile.location,
      href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(profile.address || profile.location)}`,
      event: null,
    },
  ].filter(Boolean) as {
    icon: LucideIcon;
    label: string;
    value: string;
    href: string;
    event: "phone_click" | "email_click" | "website_click" | null;
  }[];
  if (!rows.length) return null;

  return (
    <Section id="contact" title="Contact" icon={Mail}>
      <ul className="divide-y divide-p-border">
        {rows.map((r) => {
          const inner = (
            <>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-p-surface text-p-primary">
                <r.icon className="size-[18px]" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs text-p-muted">{r.label}</span>
                <span className="block truncate font-medium">{r.value}</span>
              </span>
              <ArrowUpRight className="size-4 text-p-muted transition group-hover:text-p-primary" aria-hidden />
            </>
          );
          const cls = "group flex min-h-14 items-center gap-3 py-2.5";
          return (
            <li key={r.label}>
              {r.event ? (
                <TrackedLink href={r.href} username={profile.username} event={r.event} preview={preview} className={cls}>
                  {inner}
                </TrackedLink>
              ) : (
                <a href={r.href} target="_blank" rel="noopener noreferrer" className={cls}>
                  {inner}
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
