import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import {
  CANONICAL_SITE_URL,
  getLinkPreviewImageUrl,
  linkPreviewImageAlt,
  LINK_PREVIEW_IMAGE_SIZE,
  SITE_NAME,
} from "@/lib/config";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(CANONICAL_SITE_URL),
  title: { default: `${SITE_NAME} — NFC Digital Business Cards`, template: `%s` },
  description:
    "A premium NFC digital business card and portfolio. Tap, view, save the contact, and connect — no app required.",
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — NFC Digital Business Cards`,
    description:
      "A premium NFC digital business card and portfolio. Tap, view, save the contact, and connect — no app required.",
    images: [
      {
        url: getLinkPreviewImageUrl(),
        width: LINK_PREVIEW_IMAGE_SIZE.width,
        height: LINK_PREVIEW_IMAGE_SIZE.height,
        alt: linkPreviewImageAlt(),
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — NFC Digital Business Cards`,
    description:
      "A premium NFC digital business card and portfolio. Tap, view, save the contact, and connect — no app required.",
    images: [getLinkPreviewImageUrl()],
  },
  applicationName: SITE_NAME,
  appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#4f46e5",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="min-h-dvh">
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
