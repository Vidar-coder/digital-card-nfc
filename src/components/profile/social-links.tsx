import type { SocialLink } from "@/lib/types";
import { PLATFORM_META, SocialIcon } from "./social-icon";
import { TrackedLink } from "./tracked-link";

interface Props {
  links: SocialLink[];
  username: string;
  preview?: boolean;
}

/** Only configured platforms render — empty links never reach this component. */
export function SocialLinks({ links, username, preview }: Props) {
  const visible = links.filter((l) => l.url);
  if (!visible.length) return null;
  return (
    <nav aria-label="Social media" className="flex flex-wrap justify-center gap-2">
      {visible.map((link) => {
        const label = link.platform === "custom" ? link.label || "Link" : PLATFORM_META[link.platform].label;
        return (
          <TrackedLink
            key={link.id}
            href={link.url}
            username={username}
            event="social_click"
            meta={{ platform: link.platform }}
            preview={preview}
            aria-label={label}
            title={label}
            className="flex size-11 items-center justify-center rounded-full border border-p-border bg-p-surface text-p-text/80 transition hover:-translate-y-0.5 hover:border-p-primary/50 hover:text-p-primary"
          >
            <SocialIcon platform={link.platform} className="size-[18px]" />
          </TrackedLink>
        );
      })}
    </nav>
  );
}
