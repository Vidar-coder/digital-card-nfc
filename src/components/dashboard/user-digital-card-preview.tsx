"use client";

import { useMemo } from "react";
import { HeroDigitalCard, type DigitalCardProfile } from "@/components/landing/hero-digital-card";
import { useDashboard } from "./dashboard-context";

type Props = {
  compact?: boolean;
  showCaption?: boolean;
  /** Live draft (preview while editing). Default: last saved profile. */
  useDraft?: boolean;
};

/** Animated luxury card filled from the signed-in user&apos;s profile. */
export function UserDigitalCardPreview({ compact, showCaption, useDraft = false }: Props) {
  const { saved, draft } = useDashboard();
  const p = useDraft ? draft : saved;

  const profile = useMemo<DigitalCardProfile>(
    () => ({
      username: p.username,
      fullName: p.full_name,
      title: p.title,
      company: p.company,
      location: p.location,
      qrColor: p.theme.primary,
    }),
    [p.username, p.full_name, p.title, p.company, p.location, p.theme.primary],
  );

  return <HeroDigitalCard profile={profile} compact={compact} showCaption={showCaption} />;
}
