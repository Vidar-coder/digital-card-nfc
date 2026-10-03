import { BadgeCheck, Building2, MapPin } from "lucide-react";
import type { FullProfile } from "@/lib/types";
import { ProfileAvatar } from "./profile-avatar";
import { ShareProfileButton } from "./share-profile-button";

interface Props {
  profile: FullProfile;
  preview?: boolean;
}

export function ProfileHeader({ profile, preview }: Props) {
  const { theme } = profile;
  return (
    <header>
      <div className="profile-header-cover relative h-28 @md:h-32 @4xl:h-28">
        {profile.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.cover_url} alt="" className="size-full object-cover" />
        ) : (
          <div
            className="size-full"
            style={{
              background:
                "radial-gradient(120% 140% at 0% 0%, var(--p-primary) 0%, transparent 60%), radial-gradient(120% 140% at 100% 0%, var(--p-secondary) 0%, transparent 65%), linear-gradient(135deg, var(--p-primary), var(--p-secondary))",
            }}
          />
        )}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/10 to-transparent" />
        <ShareProfileButton
          username={profile.username}
          name={profile.full_name}
          title={profile.title}
          preview={preview}
          className="absolute right-3 top-3 size-10 rounded-full bg-black/25 text-white backdrop-blur-md hover:bg-black/35"
        />
      </div>

      <div className="-mt-14 flex flex-col items-center px-6 text-center">
        <ProfileAvatar name={profile.full_name} src={profile.avatar_url} theme={theme} size={112} />
        <h1 className="font-heading mt-4 flex items-center gap-1.5 text-2xl font-semibold tracking-tight text-balance">
          {profile.full_name || profile.username}
          <BadgeCheck className="size-5 shrink-0 text-p-primary" aria-label="Verified card" />
        </h1>
        {profile.title && <p className="mt-1 text-[15px] font-medium text-p-text/85 text-balance">{profile.title}</p>}
        {(profile.company || profile.location) && (
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-p-muted">
            {profile.company && (
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="size-4" aria-hidden /> {profile.company}
              </span>
            )}
            {profile.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4" aria-hidden /> {profile.location}
              </span>
            )}
          </div>
        )}
        {profile.tagline && (
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-p-muted text-pretty">{profile.tagline}</p>
        )}
      </div>
    </header>
  );
}
