import { Mail, Phone } from "lucide-react";
import Link from "next/link";
import { SITE_NAME } from "@/lib/config";
import { themeToStyle } from "@/lib/theme";
import type { FullProfile } from "@/lib/types";
import { cn, phoneHref } from "@/lib/utils";
import { ContactButtons } from "./contact-buttons";
import { ProfileHeader } from "./profile-header";
import { SaveContactButton } from "./save-contact-button";
import {
  AboutSection,
  ContactSection,
  EducationSection,
  ExperienceSection,
  PortfolioSection,
  ServicesSection,
  SkillsSection,
} from "./sections";
import { SocialLinks } from "./social-links";
import { TrackedLink } from "./tracked-link";

interface Props {
  profile: FullProfile;
  /** Rendered inside the dashboard live preview: inert links, no analytics. */
  preview?: boolean;
  className?: string;
}

/**
 * The complete public card. Layout uses container queries (@-prefixed
 * variants) rather than viewport breakpoints so the exact same component
 * renders correctly full-screen and inside the dashboard's phone preview.
 */
export function ProfileView({ profile, preview, className }: Props) {
  const { theme } = profile;
  const tel = phoneHref(profile.phone);

  return (
    <div
      className={cn("profile-root @container relative isolate min-h-full overflow-x-clip", className)}
      data-mode={theme.mode}
      data-card={theme.card_style}
      style={themeToStyle(theme)}
    >
      {theme.card_style === "glass" && (
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-24 -top-24 size-96 rounded-full bg-p-primary/40 blur-3xl" />
          <div className="absolute -right-24 top-1/3 size-96 rounded-full bg-p-secondary/30 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 size-80 rounded-full bg-p-accent/20 blur-3xl" />
        </div>
      )}

      <div className="mx-auto w-full max-w-6xl px-3 pt-3 pb-6 @md:px-5 @md:pt-6 @4xl:px-8 @4xl:pt-12 @4xl:pb-16">
        <div className="@4xl:grid @4xl:grid-cols-[380px_minmax(0,1fr)] @4xl:items-start @4xl:gap-8">
          {/* Identity card — the "business card" */}
          <aside className="@4xl:sticky @4xl:top-8">
            <div className="p-card animate-rise overflow-hidden">
              <ProfileHeader profile={profile} preview={preview} />
              <div className="space-y-5 p-5 pt-6 @md:p-6">
                <ContactButtons profile={profile} preview={preview} />
                <SocialLinks links={profile.social_links} username={profile.username} preview={preview} />
              </div>
            </div>
          </aside>

          <main className="mt-3 space-y-3 @md:mt-4 @md:space-y-4 @4xl:mt-0">
            <AboutSection html={profile.about_html} />
            <ServicesSection services={profile.services} />
            <ExperienceSection items={profile.experiences} />
            <PortfolioSection projects={profile.projects} username={profile.username} preview={preview} />
            <SkillsSection skills={profile.skills} />
            <EducationSection education={profile.education} certifications={profile.certifications} />
            <ContactSection profile={profile} preview={preview} />

            <footer className="space-y-2 py-8 text-center text-xs leading-relaxed text-p-muted">
              {preview ? (
                <p>Want a digital card and page like this? Visit {SITE_NAME}.</p>
              ) : (
                <p>
                  Want a digital card and page like this?{" "}
                  <Link href="/" className="font-medium text-p-primary underline-offset-2 hover:underline">
                    Get started on {SITE_NAME}
                  </Link>
                </p>
              )}
              <p>
                {preview ? (
                  <span>Powered by {SITE_NAME}</span>
                ) : (
                  <Link href="/" className="hover:text-p-primary">
                    Digital card by {SITE_NAME}
                  </Link>
                )}
              </p>
            </footer>
          </main>
        </div>
      </div>

      {/* Thumb-reach action bar for phones (hidden on wide containers) */}
      <div className="sticky bottom-0 z-20 @4xl:hidden">
        <div
          className="mx-auto flex max-w-xl gap-2 border-t border-p-border px-3 pt-3 backdrop-blur-xl"
          style={{
            background: "color-mix(in srgb, var(--p-bg) 82%, transparent)",
            paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
          }}
        >
          <SaveContactButton username={profile.username} preview={preview} className="flex-1" />
          {tel && (
            <TrackedLink
              href={`tel:${tel}`}
              username={profile.username}
              event="phone_click"
              preview={preview}
              aria-label="Call"
              className="p-btn flex size-12 items-center justify-center border border-p-border bg-p-surface text-p-primary"
            >
              <Phone className="size-5" />
            </TrackedLink>
          )}
          {profile.email && (
            <TrackedLink
              href={`mailto:${profile.email}`}
              username={profile.username}
              event="email_click"
              preview={preview}
              aria-label="Email"
              className="p-btn flex size-12 items-center justify-center border border-p-border bg-p-surface text-p-primary"
            >
              <Mail className="size-5" />
            </TrackedLink>
          )}
        </div>
      </div>
    </div>
  );
}
