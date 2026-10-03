import type { FullProfile, SocialPlatform } from "./types";
import { phoneHref } from "./utils";

/** RFC 6350 text escaping. */
function esc(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

/** Fold lines longer than 75 octets (required for embedded photos). */
function fold(line: string): string {
  if (line.length <= 75) return line;
  const parts = [line.slice(0, 75)];
  for (let i = 75; i < line.length; i += 74) parts.push(" " + line.slice(i, i + 74));
  return parts.join("\r\n");
}

const SOCIAL_TYPES: Partial<Record<SocialPlatform, string>> = {
  facebook: "facebook",
  instagram: "instagram",
  linkedin: "linkedin",
  x: "twitter",
  tiktok: "tiktok",
  youtube: "youtube",
  github: "github",
};

export interface VCardPhoto {
  base64: string;
  type: "JPEG" | "PNG" | "GIF" | "WEBP";
}

/**
 * vCard 3.0 — the most widely supported version (iOS Contacts, Android,
 * Outlook, Google Contacts).
 */
export function buildVCard(profile: FullProfile, profileUrl: string, photo?: VCardPhoto | null): string {
  const nameParts = profile.full_name.trim().split(/\s+/);
  const last = nameParts.length > 1 ? nameParts.pop()! : "";
  const first = nameParts.join(" ");

  const lines: string[] = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${esc(last)};${esc(first)};;;`,
    `FN:${esc(profile.full_name || profile.username)}`,
  ];
  if (profile.company) lines.push(`ORG:${esc(profile.company)}`);
  if (profile.title) lines.push(`TITLE:${esc(profile.title)}`);
  if (profile.phone) lines.push(`TEL;TYPE=CELL,VOICE:${phoneHref(profile.phone)}`);
  if (profile.email) lines.push(`EMAIL;TYPE=INTERNET,WORK:${esc(profile.email)}`);
  if (profile.website) lines.push(`URL;TYPE=WORK:${esc(profile.website)}`);
  // Apple-style labelled item so the digital card link is clearly named.
  lines.push(`item1.URL:${esc(profileUrl)}`, "item1.X-ABLabel:Digital Card");
  if (profile.address || profile.location) {
    lines.push(`ADR;TYPE=WORK:;;${esc(profile.address || profile.location)};;;;`);
  }
  profile.social_links.forEach((link, i) => {
    const type = SOCIAL_TYPES[link.platform];
    if (type) lines.push(`X-SOCIALPROFILE;TYPE=${type}:${esc(link.url)}`);
    else {
      const label = link.label || (link.platform === "website" ? "Website" : link.platform);
      lines.push(`item${i + 2}.URL:${esc(link.url)}`, `item${i + 2}.X-ABLabel:${esc(label)}`);
    }
  });
  if (profile.tagline) lines.push(`NOTE:${esc(profile.tagline)}`);
  if (photo) lines.push(`PHOTO;ENCODING=b;TYPE=${photo.type}:${photo.base64}`);
  lines.push(`REV:${new Date().toISOString()}`, "END:VCARD");

  return lines.map(fold).join("\r\n") + "\r\n";
}

export function vcardFilename(profile: FullProfile): string {
  const base = (profile.full_name || profile.username).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${base || "contact"}.vcf`;
}
