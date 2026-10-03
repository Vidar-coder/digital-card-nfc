import { BarChart3, Contact, Nfc, Palette, QrCode, Smartphone } from "lucide-react";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { buttonClasses } from "@/components/ui/button";
import { SITE_NAME } from "@/lib/config";

const FEATURES = [
  { icon: Nfc, title: "Tap to open", text: "Program any NFC card or sticker once. Every tap opens your live profile — no app needed." },
  { icon: Contact, title: "Save contact instantly", text: "One button adds your name, number, email, company and links straight to their phone." },
  { icon: Palette, title: "Your brand, your design", text: "Seven professional themes plus full control over colors, fonts and shapes." },
  { icon: QrCode, title: "QR code included", text: "A print-ready QR code that points to the same profile as your NFC card." },
  { icon: BarChart3, title: "Know what works", text: "Track views, taps, scans, saved contacts and clicks on every link." },
  { icon: Smartphone, title: "Built for phones", text: "Fast, thumb-friendly and installable — and a full portfolio on desktop." },
];

export default function Home() {
  return (
    <div className="min-h-dvh bg-white">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <BrandMark size={30} />
          <span className="font-semibold tracking-tight">{SITE_NAME}</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/login" className={buttonClasses("ghost", "md")}>
              Sign in
            </Link>
          <Link href="/register" className={buttonClasses("primary", "md")}>
            Get started
          </Link>
        </nav>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 -top-40 mx-auto h-[520px] max-w-4xl rounded-full bg-gradient-to-br from-indigo-200/60 via-violet-200/40 to-sky-200/40 blur-3xl" aria-hidden />
          <div className="relative mx-auto max-w-3xl px-5 pb-20 pt-16 text-center sm:pt-24">
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/70 px-3 py-1 text-xs font-medium text-zinc-600 backdrop-blur">
              <Nfc className="size-3.5 text-brand" /> NFC digital business cards
            </span>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-zinc-950 text-balance sm:text-6xl">
              The last business card you&apos;ll ever need.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-zinc-600 text-pretty">
              Tap your card on any phone to share your contact details, portfolio and socials — and let them save you in
              one tap.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/register" className={buttonClasses("primary", "lg", "px-6")}>
                Create your card
              </Link>
              <Link href="/setup" className={buttonClasses("outline", "lg", "px-6")}>
                Google Sheets setup guide
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-24">
          <div className="grid gap-px overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-200 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white p-7">
                <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-brand">
                  <f.icon className="size-5" />
                </span>
                <h2 className="mt-4 font-semibold text-zinc-900">{f.title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{f.text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-100 py-8 text-center text-sm text-zinc-500">
        © {new Date().getFullYear()} {SITE_NAME}
      </footer>
    </div>
  );
}
