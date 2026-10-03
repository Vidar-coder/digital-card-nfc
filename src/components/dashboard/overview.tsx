"use client";

import { ArrowRight, CheckCircle2, Circle, Contact, Eye, MessageCircle, Palette, QrCode, Share2, Tag } from "lucide-react";
import Link from "next/link";
import { HeroDigitalCard } from "@/components/landing/hero-digital-card";
import { Card, CardHeader } from "@/components/ui/card";
import { buttonClasses } from "@/components/ui/button";
import { profileCompletion } from "@/lib/completion";
import { DIGITAL_CARD_PROMO_PRICE, MESSENGER_ORDER_URL } from "@/lib/config";
import type { AnalyticsSummary } from "@/lib/types";
import { CompletionRing } from "./completion-ring";
import { useDashboard } from "./dashboard-context";
import { QRCode } from "./qr-code";

export function Overview({ summary }: { summary: AnalyticsSummary }) {
  const { saved, siteUrl } = useDashboard();
  const { percent, items } = profileCompletion(saved);
  const todo = items.filter((i) => !i.done);
  const first = (saved.full_name || saved.username).split(" ")[0];
  const url = `${siteUrl}/p/${saved.username}`;

  const stats = [
    { label: "Views", value: summary.totals.view, icon: Eye },
    { label: "Contacts saved", value: summary.totals.vcard_download, icon: Contact },
    { label: "QR scans", value: summary.totals.qr_scan, icon: QrCode },
    { label: "Shares", value: summary.totals.share, icon: Share2 },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Welcome back, {first} 👋</h1>
        <p className="mt-1 text-sm text-zinc-500">Here&apos;s how your digital card is doing this week.</p>
      </div>

      <Card className="overflow-hidden border-indigo-100 bg-gradient-to-br from-white via-white to-indigo-50/40 p-0">
        <div className="grid gap-6 p-5 lg:grid-cols-[1fr_auto] lg:items-center lg:p-6">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-brand">
              <Tag className="size-3" aria-hidden />
              Promo {DIGITAL_CARD_PROMO_PRICE}
            </span>
            <h2 className="mt-3 text-lg font-semibold text-zinc-900">Order a digital card</h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-600">
              Get an NFC-ready physical card linked to your profile—the same tap, QR, and save-contact flow you
              manage here.
            </p>
            <a
              href={MESSENGER_ORDER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses("primary", "md", "mt-4 inline-flex")}
            >
              <MessageCircle className="size-4" aria-hidden />
              Message me
            </a>
          </div>
          <div className="flex justify-center lg:justify-end">
            <HeroDigitalCard username={saved.username} compact showCaption={false} />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-xs font-medium">{s.label}</span>
              <s.icon className="size-4" aria-hidden />
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-zinc-900">{s.value}</p>
            <p className="text-xs text-zinc-400">Last 7 days</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-[1fr_260px]">
        <Card>
          <CardHeader
            title="Profile completion"
            description={todo.length ? `${todo.length} quick wins left` : "Your card is complete — nice work!"}
            action={<CompletionRing percent={percent} size={48} />}
          />
          <ul className="divide-y divide-zinc-100">
            {(todo.length ? todo.slice(0, 5) : items.slice(0, 3)).map((i) => (
              <li key={i.key}>
                <Link href={i.href} className="group flex items-center gap-3 px-5 py-3 text-sm hover:bg-zinc-50">
                  {i.done ? <CheckCircle2 className="size-4 text-emerald-500" /> : <Circle className="size-4 text-zinc-300" />}
                  <span className={i.done ? "text-zinc-500 line-through" : "text-zinc-800"}>{i.label}</span>
                  <ArrowRight className="ml-auto size-4 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-zinc-600" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="flex flex-col items-center p-5 text-center">
          <QRCode value={`${url}?src=qr`} size={150} color={saved.theme.primary} />
          <p className="mt-3 truncate text-sm font-medium text-zinc-900">/p/{saved.username}</p>
          <Link href="/dashboard/share" className="mt-1 text-xs font-medium text-brand hover:underline">
            Download QR & NFC setup →
          </Link>
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { href: "/dashboard/profile", title: "Edit profile", desc: "Photo, headline, URL", icon: Contact },
          { href: "/dashboard/appearance", title: "Customize design", desc: "Themes, colors, fonts", icon: Palette },
          { href: "/dashboard/analytics", title: "See analytics", desc: "Views, taps & clicks", icon: Eye },
        ].map((a) => (
          <Link key={a.href} href={a.href} className="group">
            <Card className="flex items-center gap-3 p-4 transition group-hover:border-zinc-300 group-hover:shadow-sm">
              <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-brand">
                <a.icon className="size-5" />
              </span>
              <div>
                <p className="text-sm font-medium text-zinc-900">{a.title}</p>
                <p className="text-xs text-zinc-500">{a.desc}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
