import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — NFC Digital Business Cards`,
    short_name: SITE_NAME,
    description: "NFC digital business card and portfolio platform.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f7f7f8",
    theme_color: "#4f46e5",
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
