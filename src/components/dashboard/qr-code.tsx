"use client";

import QR from "qrcode";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  color?: string;
  background?: string;
  size?: number;
  className?: string;
}

/** Renders a crisp SVG QR code (error correction "M" survives small logos/print wear). */
export function QRCode({ value, color = "#0f1115", background = "#ffffff", size = 240, className }: Props) {
  const [svg, setSvg] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    QR.toString(value, { type: "svg", errorCorrectionLevel: "M", margin: 1, color: { dark: color, light: background } })
      .then((s) => !cancelled && setSvg(s))
      .catch(() => !cancelled && setSvg(""));
    return () => {
      cancelled = true;
    };
  }, [value, color, background]);

  return (
    <div
      className={cn("[&>svg]:size-full", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`QR code for ${value}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

export async function downloadQr(value: string, filename: string, format: "png" | "svg", color: string, background: string) {
  const opts = { errorCorrectionLevel: "M" as const, margin: 2, color: { dark: color, light: background } };
  let href: string;
  if (format === "svg") {
    const svg = await QR.toString(value, { ...opts, type: "svg" });
    href = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  } else {
    href = await QR.toDataURL(value, { ...opts, width: 1024 }); // print-ready resolution
  }
  const a = document.createElement("a");
  a.href = href;
  a.download = `${filename}.${format}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  if (format === "svg") setTimeout(() => URL.revokeObjectURL(href), 1000);
}
