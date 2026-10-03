import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { ProfileView } from "@/components/profile/profile-view";
import { ProfileViewTracker } from "@/components/profile/profile-view-tracker";
import { ServiceWorkerRegistrar } from "@/components/profile/sw-registrar";
import { profileUrl, SITE_NAME } from "@/lib/config";
import { getPublicProfile } from "@/lib/data";
import { sanitizeRichText, stripHtml } from "@/lib/sanitize";
import { DEFAULT_THEME } from "@/lib/theme";

// Incremental Static Regeneration: profiles are rendered on first request,
// cached, and refreshed on save (revalidatePath) or at most every 5 minutes.
export const revalidate = 300;

export function generateStaticParams() {
  return [];
}

function describe(p: NonNullable<Awaited<ReturnType<typeof getPublicProfile>>>): string {
  const base = p.tagline || stripHtml(p.about_html);
  const fallback = [p.title, p.company].filter(Boolean).join(" at ");
  return (base || fallback || `${p.full_name}'s digital business card`).slice(0, 160);
}

export async function generateMetadata(props: PageProps<"/p/[username]">): Promise<Metadata> {
  const { username } = await props.params;
  const profile = await getPublicProfile(username).catch(() => null);
  if (!profile) return { title: "Profile not found", robots: { index: false } };

  const title = profile.title ? `${profile.full_name} | ${profile.title}` : profile.full_name;
  const description = describe(profile);
  const url = profileUrl(profile.username);

  return {
    title,
    description,
    alternates: { canonical: url },
    manifest: `/p/${profile.username}/manifest.webmanifest`,
    openGraph: {
      type: "profile",
      title,
      description,
      url,
      siteName: SITE_NAME,
      firstName: profile.full_name.split(" ")[0],
      lastName: profile.full_name.split(" ").slice(1).join(" ") || undefined,
      username: profile.username,
    },
    twitter: { card: "summary_large_image", title, description },
    appleWebApp: { capable: true, title: profile.full_name, statusBarStyle: "black-translucent" },
    other: { "profile:username": profile.username },
  };
}

export async function generateViewport(props: PageProps<"/p/[username]">): Promise<Viewport> {
  const { username } = await props.params;
  const profile = await getPublicProfile(username).catch(() => null);
  return { themeColor: (profile?.theme ?? DEFAULT_THEME).background, colorScheme: profile?.theme.mode ?? "light" };
}

export default async function PublicProfilePage(props: PageProps<"/p/[username]">) {
  const { username } = await props.params;
  const profile = await getPublicProfile(username);
  if (!profile) notFound();

  const safe = { ...profile, about_html: sanitizeRichText(profile.about_html) };

  // schema.org Person — helps search engines show a rich result for the name.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.full_name,
    jobTitle: profile.title || undefined,
    worksFor: profile.company ? { "@type": "Organization", name: profile.company } : undefined,
    url: profileUrl(profile.username),
    email: profile.email ? `mailto:${profile.email}` : undefined,
    telephone: profile.phone || undefined,
    address: profile.location || undefined,
    image: profile.avatar_url?.startsWith("http") ? profile.avatar_url : undefined,
    sameAs: profile.social_links.map((l) => l.url),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <ProfileView profile={safe} className="min-h-dvh" />
      <ProfileViewTracker username={profile.username} />
      <ServiceWorkerRegistrar />
    </>
  );
}
