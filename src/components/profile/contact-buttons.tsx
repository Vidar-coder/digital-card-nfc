import { Globe, Mail, MessageSquare, Phone } from "lucide-react";
import type { FullProfile } from "@/lib/types";
import { ensureProtocol, phoneHref } from "@/lib/utils";
import { SaveContactButton } from "./save-contact-button";
import { TrackedLink } from "./tracked-link";

interface Props {
  profile: FullProfile;
  preview?: boolean;
}

/** Primary CTA (Save Contact) plus quick actions sized for thumbs (≥48px). */
export function ContactButtons({ profile, preview }: Props) {
  const tel = phoneHref(profile.phone);
  const actions = [
    tel && { key: "call", label: "Call Me", href: `tel:${tel}`, icon: Phone, event: "phone_click" as const },
    tel && {
      key: "sms",
      label: "Message",
      // sms: is the most broadly supported scheme (iOS + Android); smsto: is Android-only.
      href: `sms:${tel}`,
      icon: MessageSquare,
      event: "sms_click" as const,
    },
    profile.email && {
      key: "email",
      label: "Email",
      href: `mailto:${profile.email}`,
      icon: Mail,
      event: "email_click" as const,
    },
    profile.website && {
      key: "web",
      label: "Website",
      href: ensureProtocol(profile.website),
      icon: Globe,
      event: "website_click" as const,
    },
  ].filter(Boolean) as {
    key: string;
    label: string;
    href: string;
    icon: typeof Phone;
    event: "phone_click" | "sms_click" | "email_click" | "website_click";
  }[];

  return (
    <div className="space-y-3">
      <SaveContactButton username={profile.username} preview={preview} className="w-full text-base" />
      {actions.length > 0 && (
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(actions.length, 4)}, minmax(0, 1fr))` }}>
          {actions.map((a) => (
            <TrackedLink
              key={a.key}
              href={a.href}
              username={profile.username}
              event={a.event}
              preview={preview}
              className="p-btn group flex min-h-[64px] flex-col items-center justify-center gap-1.5 border border-p-border bg-p-surface px-2 py-2.5 text-xs font-medium text-p-text transition hover:border-p-primary/40 hover:text-p-primary active:scale-[0.97]"
            >
              <a.icon className="size-5 text-p-primary" aria-hidden />
              {a.label}
            </TrackedLink>
          ))}
        </div>
      )}
    </div>
  );
}
