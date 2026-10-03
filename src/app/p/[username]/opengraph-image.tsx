import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/config";
import { getPublicProfile } from "@/lib/data";
import { DEFAULT_THEME, readableOn } from "@/lib/theme";
import { initials } from "@/lib/utils";

export const alt = "Digital business card";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 300;

export default async function OgImage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const profile = await getPublicProfile(username).catch(() => null);
  const theme = profile?.theme ?? DEFAULT_THEME;
  const fg = readableOn(theme.primary);
  const name = profile?.full_name || username;
  const avatar = profile?.avatar_url && /^(https:|data:image\/(png|jpe?g))/i.test(profile.avatar_url) ? profile.avatar_url : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          color: fg,
          background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              width={180}
              height={180}
              style={{ borderRadius: 999, border: `6px solid ${fg}33`, objectFit: "cover" }}
              alt=""
            />
          ) : (
            <div
              style={{
                width: 180,
                height: 180,
                borderRadius: 999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 72,
                fontWeight: 700,
                background: `${fg}22`,
                border: `6px solid ${fg}33`,
              }}
            >
              {initials(name)}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 760 }}>
            <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.05, letterSpacing: -1.5 }}>{name}</div>
            {profile?.title && <div style={{ fontSize: 34, marginTop: 16, opacity: 0.9 }}>{profile.title}</div>}
            {profile?.company && <div style={{ fontSize: 28, marginTop: 8, opacity: 0.75 }}>{profile.company}</div>}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 26, opacity: 0.85 }}>
          <div style={{ display: "flex" }}>Tap · View · Save contact</div>
          <div style={{ display: "flex", fontWeight: 600 }}>{SITE_NAME}</div>
        </div>
      </div>
    ),
    size,
  );
}
