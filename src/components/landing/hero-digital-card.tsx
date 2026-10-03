"use client";

import { useEffect, useMemo, useState } from "react";
import { Nfc } from "lucide-react";
import FlipCard from "@/components/flip-card/flip-card";
import { QRCode } from "@/components/dashboard/qr-code";
import { BrandMark } from "@/components/brand-mark";
import { profileUrl, SITE_NAME } from "@/lib/config";

/** ISO/IEC 7810 ID-1 aspect ratio (landscape business / wallet card). */
const CARD_WIDTH = 400;
const CARD_RADIUS = 16;

const BRAND_INDIGO = "#4f46e5";

/** Example profile encoded in the preview QR (same link pattern as live cards). */
const PREVIEW_USERNAME = "yourname";

export type DigitalCardProfile = {
  username: string;
  fullName?: string;
  title?: string;
  company?: string;
  location?: string;
  /** QR module color (defaults to brand indigo). */
  qrColor?: string;
};

const PLACEHOLDER = {
  name: "Your Name",
  title: "Your Title",
  meta: "Company · City",
};

function resolveCardCopy(profile?: DigitalCardProfile) {
  const name = profile?.fullName?.trim() || PLACEHOLDER.name;
  const title = profile?.title?.trim() || PLACEHOLDER.title;
  const metaParts = [profile?.company?.trim(), profile?.location?.trim()].filter(Boolean);
  const meta = metaParts.length ? metaParts.join(" · ") : PLACEHOLDER.meta;
  return { name, title, meta };
}

function CardLuxurySurface({ mirrored = false }: { mirrored?: boolean }) {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,#0a0a0f_0%,#151528_35%,#1e1b4b_70%,#0f0f18_100%)]"
        aria-hidden
      />
      <div
        className={`pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_85%_15%,rgba(79,70,229,0.38),transparent_55%)] ${mirrored ? "opacity-90" : ""}`}
        aria-hidden
      />
      <div
        className={`pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_10%_90%,rgba(124,58,237,0.24),transparent_50%)] ${mirrored ? "opacity-90" : ""}`}
        aria-hidden
      />
      {mirrored ? (
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_15%_20%,rgba(99,102,241,0.2),transparent_55%)]"
          aria-hidden
        />
      ) : null}
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,0.1)_0%,transparent_45%,rgba(0,0,0,0.12)_100%)]"
        aria-hidden
      />
    </>
  );
}

function CardFront({ copy }: { copy: ReturnType<typeof resolveCardCopy> }) {
  return (
    <div className="relative h-full w-full overflow-hidden text-white">
      <CardLuxurySurface />

      <div className="relative flex h-full flex-col justify-between px-6 py-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <BrandMark size={24} padded />
            <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#e8dcc0]/90">{SITE_NAME}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/[0.08] px-2.5 py-1 backdrop-blur-sm">
            <Nfc className="size-3.5 text-[#e8dcc0]" strokeWidth={2} aria-hidden />
            <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/90">NFC</span>
          </div>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p
              className="truncate text-[22px] font-normal leading-none tracking-tight text-white sm:text-2xl"
              style={{ fontFamily: "var(--font-playfair)" }}
              title={copy.name}
            >
              {copy.name}
            </p>
            <p className="mt-2.5 truncate text-[13px] font-medium tracking-wide text-white/90" title={copy.title}>
              {copy.title}
            </p>
            <p
              className="mt-1 truncate text-[11px] uppercase tracking-[0.16em] text-[#e8dcc0]/80"
              title={copy.meta}
            >
              {copy.meta}
            </p>
          </div>
          <div className="hidden shrink-0 text-right sm:block">
            <p className="text-[8px] font-semibold uppercase tracking-[0.24em] text-[#e8dcc0]/55">Tap phone</p>
            <p className="mt-1 text-[10px] leading-snug text-white/75">
              Open your
              <br />
              profile
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 text-[9px] font-semibold uppercase tracking-[0.2em]">
          <span className="text-[#e8dcc0]/85">Digital business card</span>
          <span className="text-white/65">Tap · Share · Save</span>
        </div>
      </div>
    </div>
  );
}

function CardBack({
  qrUrl,
  displayUrl,
  qrColor,
  copy,
}: {
  qrUrl: string;
  displayUrl: string;
  qrColor: string;
  copy: ReturnType<typeof resolveCardCopy>;
}) {
  return (
    <div className="relative h-full w-full overflow-hidden text-white">
      <CardLuxurySurface mirrored />

      <div className="relative flex h-full items-stretch gap-3 px-5 py-4 sm:gap-4 sm:px-6 sm:py-5">
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <p className="text-[8px] font-semibold uppercase tracking-[0.28em] text-[#e8dcc0]/70">Profile</p>
          <p
            className="mt-1.5 truncate text-base font-normal leading-tight text-white"
            style={{ fontFamily: "var(--font-playfair)" }}
            title={copy.name}
          >
            {copy.name}
          </p>
          <p className="mt-2 text-[10px] leading-relaxed text-white/75">
            Scan to connect—same link as NFC. Portfolio, contact, and socials in one place.
          </p>
          <p className="mt-3 truncate font-mono text-[9px] text-[#e8dcc0]/55" title={qrUrl}>
            {displayUrl}
          </p>
          <div className="mt-auto flex items-center gap-2 pt-3">
            <BrandMark size={20} padded />
            <span className="text-[9px] font-medium uppercase tracking-[0.12em] text-white/50">
              Issued by {SITE_NAME}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-center justify-center">
          <div className="rounded-lg bg-white/95 p-2 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.55)] backdrop-blur-sm">
            <QRCode value={qrUrl} size={76} color={qrColor} background="#ffffff" className="size-[76px]" />
          </div>
          <p className="mt-2 text-center text-[8px] font-semibold uppercase tracking-[0.22em] text-[#e8dcc0]/65">
            Scan
          </p>
        </div>
      </div>
    </div>
  );
}

function useCardSize(maxWidth = CARD_WIDTH, minWidth = 280) {
  const [width, setWidth] = useState(maxWidth);

  useEffect(() => {
    const update = () => {
      const pad = 40;
      setWidth(Math.min(maxWidth, Math.max(minWidth, window.innerWidth - pad)));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [maxWidth, minWidth]);

  return { width, height: Math.round(width / 1.586) };
}

type HeroDigitalCardProps = {
  /** @deprecated Prefer `profile.username`. */
  username?: string;
  profile?: DigitalCardProfile;
  compact?: boolean;
  showCaption?: boolean;
};

export function HeroDigitalCard({
  username,
  profile,
  compact = false,
  showCaption = true,
}: HeroDigitalCardProps) {
  const maxW = compact ? 340 : CARD_WIDTH;
  const { width, height } = useCardSize(maxW, compact ? 260 : 280);

  const resolvedUsername = profile?.username ?? username ?? PREVIEW_USERNAME;
  const copy = useMemo(() => resolveCardCopy(profile), [profile]);
  const qrColor = profile?.qrColor ?? BRAND_INDIGO;

  const qrUrl = useMemo(() => profileUrl(resolvedUsername, "qr"), [resolvedUsername]);
  const displayUrl = useMemo(() => {
    try {
      const u = new URL(qrUrl);
      return `${u.host}${u.pathname}${u.search}`;
    } catch {
      return qrUrl;
    }
  }, [qrUrl]);

  return (
    <div className={`flex w-full flex-col items-center ${compact ? "min-w-0" : "lg:min-w-[400px]"}`}>
      <div className="shadow-[0_32px_64px_-28px_rgba(15,15,30,0.5)]" style={{ width }}>
        <FlipCard
          ariaLabel="Interactive digital business card preview — click or drag to flip"
          axis="x"
          width={width}
          height={height}
          radius={CARD_RADIUS}
          background="#12121a"
          color="#ffffff"
          glareOpacity={0.28}
          shadowColor="#0f0f18"
          shadowOpacity={0.45}
          tiltMax={7}
          hoverScale={1.015}
          perspective={1600}
          stiffness={180}
          damping={22}
          className="mx-auto"
          front={<CardFront copy={copy} />}
          back={<CardBack qrUrl={qrUrl} displayUrl={displayUrl} qrColor={qrColor} copy={copy} />}
        />
      </div>
      {showCaption ? (
        <p className="mt-5 max-w-sm text-center text-sm leading-relaxed text-zinc-600">
          Flip to preview—the QR on the back matches your live profile link.
        </p>
      ) : null}
    </div>
  );
}
