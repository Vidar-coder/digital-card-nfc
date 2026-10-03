import { Globe, Link2 } from "lucide-react";
import {
  siBehance,
  siDribbble,
  siFacebook,
  siGithub,
  siInstagram,
  siTelegram,
  siTiktok,
  siWhatsapp,
  siX,
  siYoutube,
} from "simple-icons";
import type { SocialPlatform } from "@/lib/types";

// LinkedIn isn't shipped by simple-icons, so its glyph is inlined.
const LINKEDIN_PATH =
  "M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z";

const PATHS: Partial<Record<SocialPlatform, string>> = {
  facebook: siFacebook.path,
  instagram: siInstagram.path,
  linkedin: LINKEDIN_PATH,
  x: siX.path,
  tiktok: siTiktok.path,
  youtube: siYoutube.path,
  github: siGithub.path,
  whatsapp: siWhatsapp.path,
  telegram: siTelegram.path,
  dribbble: siDribbble.path,
  behance: siBehance.path,
};

export const PLATFORM_META: Record<SocialPlatform, { label: string; placeholder: string }> = {
  linkedin: { label: "LinkedIn", placeholder: "https://linkedin.com/in/username" },
  facebook: { label: "Facebook", placeholder: "https://facebook.com/username" },
  instagram: { label: "Instagram", placeholder: "https://instagram.com/username" },
  x: { label: "X / Twitter", placeholder: "https://x.com/username" },
  tiktok: { label: "TikTok", placeholder: "https://tiktok.com/@username" },
  youtube: { label: "YouTube", placeholder: "https://youtube.com/@channel" },
  github: { label: "GitHub", placeholder: "https://github.com/username" },
  whatsapp: { label: "WhatsApp", placeholder: "https://wa.me/639171234567" },
  telegram: { label: "Telegram", placeholder: "https://t.me/username" },
  dribbble: { label: "Dribbble", placeholder: "https://dribbble.com/username" },
  behance: { label: "Behance", placeholder: "https://behance.net/username" },
  website: { label: "Website", placeholder: "https://yourwebsite.com" },
  custom: { label: "Custom link", placeholder: "https://…" },
};

export function SocialIcon({ platform, className = "size-5" }: { platform: SocialPlatform; className?: string }) {
  const path = PATHS[platform];
  if (path) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
        <path d={path} />
      </svg>
    );
  }
  const Icon = platform === "website" ? Globe : Link2;
  return <Icon className={className} aria-hidden="true" />;
}
