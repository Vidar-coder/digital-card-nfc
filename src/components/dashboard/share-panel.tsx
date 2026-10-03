"use client";

import { Check, Copy, Download, ExternalLink, Nfc, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useDashboard } from "./dashboard-context";
import { downloadQr, QRCode } from "./qr-code";

function CopyRow({ label, value, hint }: { label: string; value: string; hint: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-zinc-800">{label}</p>
      <div className="flex gap-2">
        <code className="flex h-10 min-w-0 flex-1 items-center truncate rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-700">
          {value}
        </code>
        <Button
          variant="outline"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value);
              setCopied(true);
              toast.success("Copied to clipboard");
              setTimeout(() => setCopied(false), 1800);
            } catch {
              toast.error("Copy failed — select the text and copy manually");
            }
          }}
          aria-label={`Copy ${label}`}
        >
          {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
          <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
        </Button>
      </div>
      <p className="mt-1.5 text-xs text-zinc-500">{hint}</p>
    </div>
  );
}

export function SharePanel() {
  const { saved, siteUrl } = useDashboard();
  const [branded, setBranded] = useState(true);
  const base = `${siteUrl}/p/${saved.username}`;
  // Attribution params let analytics separate QR scans from NFC taps.
  const qrUrl = `${base}?src=qr`;
  const nfcUrl = `${base}?src=nfc`;
  const color = branded ? saved.theme.primary : "#0f1115";

  async function share() {
    const data = { title: saved.full_name, text: `${saved.full_name} — ${saved.title}`, url: base };
    if (navigator.share) {
      try {
        await navigator.share(data);
      } catch {
        /* dismissed */
      }
    } else {
      await navigator.clipboard.writeText(base);
      toast.success("Profile link copied");
    }
  }

  return (
    <div className="space-y-5">
      {!saved.published && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Your card is currently <strong>private</strong>. Turn on &ldquo;Card is public&rdquo; in Profile so the QR code and
          NFC tag work.
        </div>
      )}

      <Card>
        <CardHeader title="Your QR code" description="Points to the same profile as your NFC card." />
        <div className="flex flex-col items-center gap-6 p-5 sm:flex-row sm:items-start">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs">
            <QRCode value={qrUrl} color={color} size={208} />
          </div>
          <div className="w-full flex-1 space-y-4">
            <div className="flex rounded-xl bg-zinc-100 p-1">
              {[
                { v: true, l: "Brand color" },
                { v: false, l: "Classic black" },
              ].map((o) => (
                <button
                  key={o.l}
                  type="button"
                  onClick={() => setBranded(o.v)}
                  aria-pressed={branded === o.v}
                  className={cn(
                    "h-9 flex-1 rounded-lg text-sm font-medium text-zinc-600",
                    branded === o.v && "bg-white text-zinc-900 shadow-xs",
                  )}
                >
                  {o.l}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => downloadQr(qrUrl, `${saved.username}-qr`, "png", color, "#ffffff")}>
                <Download className="size-4" /> PNG
              </Button>
              <Button variant="outline" onClick={() => downloadQr(qrUrl, `${saved.username}-qr`, "svg", color, "#ffffff")}>
                <Download className="size-4" /> SVG (print)
              </Button>
              <Button variant="outline" onClick={share}>
                <Share2 className="size-4" /> Share profile
              </Button>
              <a
                href={base}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white text-sm font-medium shadow-xs hover:bg-zinc-50"
              >
                <ExternalLink className="size-4" /> Open card
              </a>
            </div>
            <p className="text-xs text-zinc-500">
              Tip: test-scan printed codes at the final size. Keep at least 2 cm (0.8&Prime;) wide with a white border.
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Links" />
        <div className="space-y-5 p-5">
          <CopyRow label="Profile URL" value={base} hint="Share anywhere — email signature, LinkedIn, bio links." />
          <CopyRow
            label="NFC card URL"
            value={nfcUrl}
            hint="Write this URL to your NFC card (NDEF URI record). The ?src=nfc tag lets analytics count taps."
          />
        </div>
      </Card>

      <Card>
        <CardHeader title="Program your NFC card" />
        <ol className="space-y-3 p-5 text-sm text-zinc-700">
          {[
            "Install a free NFC writer app (e.g. NFC Tools on iOS/Android).",
            "Choose Write → Add a record → URL / URI.",
            "Paste your NFC card URL from above.",
            "Hold the card to the top/back of your phone until it confirms.",
            "Optional: lock the tag (permanent) to prevent others from overwriting it.",
          ].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-brand">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
          <li className="flex items-center gap-2 pt-2 text-xs text-zinc-500">
            <Nfc className="size-4" /> Your profile URL never changes unless you change your username.
          </li>
        </ol>
      </Card>
    </div>
  );
}
