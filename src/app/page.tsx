import {
  ArrowUpRight,
  BarChart3,
  Check,
  Contact,
  MessageCircle,
  Minus,
  Nfc,
  Palette,
  QrCode,
  RefreshCw,
  Smartphone,
  Sparkles,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { HeroDigitalCard } from "@/components/landing/hero-digital-card";
import { buttonClasses } from "@/components/ui/button";
import { DIGITAL_CARD_PROMO_PRICE, MESSENGER_ORDER_URL, SITE_NAME } from "@/lib/config";

const PORTFOLIO_URL = "https://lance28-beep.github.io/portfolio-website/";

const STEPS = [
  {
    step: "1",
    title: "Message us",
    text: "Tell us you want a digital card. We confirm your details, username, and what goes on your profile.",
  },
  {
    step: "2",
    title: "Create your account",
    text: "Register with the email we set up for you. Your dashboard is where you edit your card anytime.",
  },
  {
    step: "3",
    title: "Build your profile",
    text: "Add photo, bio, links, and brand colors. We help until it looks sharp and professional.",
  },
  {
    step: "4",
    title: "Tap and share",
    text: "Program NFC once. Every tap opens your live page. One tap saves your contact. QR included.",
  },
];

const WHY_DIGITAL = [
  {
    icon: RefreshCw,
    title: "Always up to date",
    text: "Change your number, role, or links in the dashboard—every tap and scan shows the latest you. No reprints.",
  },
  {
    icon: Contact,
    title: "Saved in one tap",
    text: "They don’t type your details manually. One button adds your full contact to their phone.",
  },
  {
    icon: Smartphone,
    title: "More than a card",
    text: "Your portfolio, services, and socials live on one mobile-first page—not a tiny paper rectangle.",
  },
  {
    icon: BarChart3,
    title: "See what works",
    text: "Track views, taps, scans, and link clicks. Paper cards can’t tell you who actually followed up.",
  },
];

const VS_PAPER = {
  digital: [
    "Updates anytime—no reprint costs",
    "NFC tap + QR for events and desks",
    "Instant “Save contact” on any smartphone",
    "Portfolio, links, and analytics included",
    "Eco-friendly—one card, endless shares",
  ],
  paper: [
    "Outdated the moment something changes",
    "Easy to lose, damage, or run out of",
    "Manual typing—errors and missed follow-ups",
    "Limited space for your story and links",
    "Reprint stacks every time you rebrand",
  ],
};

const FEATURES = [
  {
    icon: Nfc,
    title: "Tap to open",
    text: "Program any NFC card or sticker once. Every tap opens your live profile—no app required.",
  },
  {
    icon: Contact,
    title: "Save contact instantly",
    text: "One button adds your name, number, email, company, and links straight to their phone.",
  },
  {
    icon: Palette,
    title: "Your brand, your design",
    text: "Professional themes plus control over colors, fonts, and layout—always on-brand.",
  },
  {
    icon: QrCode,
    title: "QR code included",
    text: "Print-ready QR matches your NFC link—perfect for events, lanyards, and packaging.",
  },
  {
    icon: BarChart3,
    title: "Know what works",
    text: "Views, taps, scans, saved contacts, and link clicks—clear insight into engagement.",
  },
  {
    icon: Smartphone,
    title: "Built for phones",
    text: "Fast on mobile; a full portfolio experience when opened on desktop.",
  },
];

function SectionIntro({ label, title, description }: { label: string; title: string; description: string }) {
  return (
    <div className="mx-auto mb-10 max-w-2xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">{label}</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950 text-balance sm:text-3xl">{title}</h2>
      <p className="mt-3 text-base leading-relaxed text-zinc-600 text-pretty">{description}</p>
    </div>
  );
}

function MessengerCta({ size = "lg", className }: { size?: "md" | "lg"; className?: string }) {
  return (
    <a
      href={MESSENGER_ORDER_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonClasses("primary", size, className)}
    >
      <MessageCircle className="size-4" aria-hidden />
      Message us now
    </a>
  );
}

export default function Home() {
  return (
    <div className="min-h-dvh bg-white">
      <header className="sticky top-0 z-10 border-b border-zinc-100/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandMark size={30} />
            <span className="font-semibold tracking-tight text-zinc-950">{SITE_NAME}</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/login" className={buttonClasses("ghost", "md")}>
              Sign in
            </Link>
            <Link href="/register" className={buttonClasses("primary", "md")}>
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-x-0 -top-40 mx-auto h-[520px] max-w-4xl rounded-full bg-gradient-to-br from-indigo-200/60 via-violet-200/40 to-sky-200/40 blur-3xl"
            aria-hidden
          />
          <div className="relative mx-auto grid max-w-6xl gap-12 px-5 pb-16 pt-14 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-14 lg:pb-20 lg:pt-16">
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-indigo-50/80 px-3 py-1 text-xs font-medium text-indigo-900 backdrop-blur">
                <Sparkles className="size-3.5 text-brand" aria-hidden />
                NFC digital business cards
              </span>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-zinc-950 text-balance sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
                Share who you are in one tap—not one paper card.
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-zinc-600 text-pretty lg:mx-0">
                A premium digital card with NFC and QR: your contact, portfolio, and links on every phone. Look
                professional, stay current, and make follow-ups effortless.
              </p>

              <div className="mx-auto mt-8 inline-flex flex-col items-stretch gap-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/50 p-5 text-left shadow-sm sm:flex-row sm:items-center lg:mx-0">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-brand">
                    <Tag className="size-3" aria-hidden />
                    Promo
                  </span>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">{DIGITAL_CARD_PROMO_PRICE}</p>
                  <p className="mt-1 text-sm text-zinc-600">Digital card setup · NFC-ready profile · QR included</p>
                </div>
                <MessengerCta className="shrink-0 px-6 sm:ml-auto" />
              </div>

              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                <Link href="/register" className={buttonClasses("outline", "lg", "px-6")}>
                  Create your account
                </Link>
              </div>
              <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-zinc-600 lg:mx-0">
                New customer? Message us first—we&apos;ll walk you from order to your first tap.
              </p>
            </div>
            <HeroDigitalCard />
          </div>
        </section>

        <section className="border-y border-zinc-100 bg-zinc-50/80">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
            <SectionIntro
              label="Why go digital"
              title="A business card that works as hard as you do"
              description="Your first impression should be instant, accurate, and memorable. A digital card turns every handshake into a saved contact and a link they’ll actually open."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              {WHY_DIGITAL.map((item) => (
                <article
                  key={item.title}
                  className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-brand">
                    <item.icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 font-semibold text-zinc-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
          <SectionIntro
            label="Digital vs paper"
            title="Why it beats an ordinary business card"
            description="Paper still has charm—but for daily networking, digital wins on speed, accuracy, and staying power."
          />
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border-2 border-brand/20 bg-gradient-to-b from-indigo-50/80 to-white p-6 sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-wide text-brand">Digital card ({SITE_NAME})</p>
              <ul className="mt-5 space-y-3">
                {VS_PAPER.digital.map((line) => (
                  <li key={line} className="flex gap-3 text-sm leading-relaxed text-zinc-700">
                    <Check className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-zinc-200 bg-zinc-50/50 p-6 sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Ordinary paper card</p>
              <ul className="mt-5 space-y-3">
                {VS_PAPER.paper.map((line) => (
                  <li key={line} className="flex gap-3 text-sm leading-relaxed text-zinc-600">
                    <Minus className="mt-0.5 size-4 shrink-0 text-zinc-400" aria-hidden />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-16">
          <SectionIntro
            label="Simple process"
            title="How you get started"
            description="From first message to a card you’re proud to tap—four clear steps."
          />
          <ol className="grid gap-px overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-200 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((item) => (
              <li key={item.step} className="bg-white p-6 text-left">
                <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-50 text-sm font-semibold text-brand">
                  {item.step}
                </span>
                <h3 className="mt-4 font-semibold text-zinc-900">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{item.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-t border-zinc-100 bg-zinc-50/80">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
            <SectionIntro
              label="Everything included"
              title="Built for real-world networking"
              description="NFC, QR, design tools, and analytics—so one card covers every situation."
            />
            <div className="grid gap-px overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-200 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <div key={f.title} className="bg-white p-7">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-brand">
                    <f.icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 font-semibold text-zinc-900">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-5 py-16 text-center sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Limited promo</p>
          <p className="mt-3 text-4xl font-semibold tracking-tight text-zinc-950">{DIGITAL_CARD_PROMO_PRICE}</p>
          <p className="mx-auto mt-3 max-w-lg text-base leading-relaxed text-zinc-600">
            Get your digital business card set up with NFC profile, QR, and a dashboard you can update anytime.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <MessengerCta className="px-8" />
            <Link href="/login" className={buttonClasses("outline", "lg", "px-8")}>
              Sign in to dashboard
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-100 py-10 text-center text-sm leading-relaxed text-zinc-600">
        <p className="text-zinc-500">
          © {new Date().getFullYear()} {SITE_NAME}
        </p>
        <p className="mt-4">
          Created by{" "}
          <a
            href={PORTFOLIO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 font-medium text-zinc-800 underline-offset-4 hover:underline"
          >
            Rolando S. Valle
            <ArrowUpRight className="size-3.5" aria-hidden />
          </a>
        </p>
        <p className="mx-auto mt-3 max-w-md px-5">
          Order your digital card — promo {DIGITAL_CARD_PROMO_PRICE}.{" "}
          <a
            href={MESSENGER_ORDER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-zinc-800 underline-offset-4 hover:underline"
          >
            Message us on Messenger
          </a>
          <span className="mt-1 block text-xs text-zinc-500">{MESSENGER_ORDER_URL}</span>
        </p>
      </footer>
    </div>
  );
}
