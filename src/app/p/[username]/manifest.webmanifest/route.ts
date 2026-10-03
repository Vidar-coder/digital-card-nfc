import type { MetadataRoute } from "next";
import { NextResponse } from "next/server";
import { getPublicProfile } from "@/lib/data";
import { DEFAULT_THEME } from "@/lib/theme";

/**
 * Per-profile web app manifest so "Add to Home Screen" from a card installs
 * *that person's* card (start_url = their profile), not the platform.
 */
export async function GET(_req: Request, ctx: RouteContext<"/p/[username]/manifest.webmanifest">) {
  const { username } = await ctx.params;
  const profile = await getPublicProfile(username).catch(() => null);
  const theme = profile?.theme ?? DEFAULT_THEME;
  const name = profile?.full_name || username;

  const manifest: MetadataRoute.Manifest = {
    id: `/p/${username}`,
    name,
    short_name: name.split(" ")[0].slice(0, 12),
    description: profile?.title ? `${name} — ${profile.title}` : `${name}'s digital business card`,
    start_url: `/p/${username}`,
    scope: `/p/${username}`,
    display: "standalone",
    background_color: theme.background,
    theme_color: theme.background,
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };

  return NextResponse.json(manifest, {
    headers: { "Content-Type": "application/manifest+json", "Cache-Control": "public, max-age=300" },
  });
}
