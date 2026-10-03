import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { getSiteUrl, SITE_NAME } from "@/lib/config";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: `${SITE_NAME} — NFC Digital Business Cards`, template: `%s` },
  description:
    "A premium NFC digital business card and portfolio. Tap, view, save the contact, and connect — no app required.",
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
