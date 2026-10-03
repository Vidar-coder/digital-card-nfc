"use client";

import { MessageCircle, Nfc } from "lucide-react";
import { HeroDigitalCard } from "@/components/landing/hero-digital-card";
import { buttonClasses } from "@/components/ui/button";
import { DIGITAL_CARD_PROMO_PRICE, MESSENGER_ORDER_URL } from "@/lib/config";

export function AuthPromoPanel({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex flex-col ${compact ? "items-center py-8" : "h-full justify-center p-8 xl:p-12"}`}>
      {!compact && (
        <div className="mb-8 max-w-md">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-indigo-50/90 px-3 py-1 text-xs font-medium text-indigo-900">
            <Nfc className="size-3.5 text-brand" aria-hidden />
            NFC digital business card
          </span>
          <h2 className="mt-5 text-2xl font-semibold leading-tight tracking-tight text-zinc-950 text-balance xl:text-3xl">
            One tap shares your whole professional story.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600">
            Tap, QR, save contact, and a live profile you update anytime—no reprints, no outdated numbers.
          </p>
          <p className="mt-4 text-sm font-medium text-zinc-800">
            Promo {DIGITAL_CARD_PROMO_PRICE}{" "}
            <span className="font-normal text-zinc-500">· NFC setup & QR included</span>
          </p>
          <a
            href={MESSENGER_ORDER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses("outline", "md", "mt-4 inline-flex border-indigo-200")}
          >
            <MessageCircle className="size-4" aria-hidden />
            Order a card — message us
          </a>
        </div>
      )}
      <HeroDigitalCard compact={compact} showCaption={!compact} />
    </div>
  );
}
