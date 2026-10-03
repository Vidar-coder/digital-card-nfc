import type { CSSProperties } from "react";
import type { FontId, Theme, ThemePresetId } from "./types";

export const THEME_PRESETS: Record<ThemePresetId, { label: string; description: string; theme: Theme }> = {
  minimal: {
    label: "Minimal",
    description: "Quiet neutrals, sharp type",
    theme: {
      preset: "minimal",
      mode: "light",
      primary: "#111827",
      secondary: "#6b7280",
      accent: "#2563eb",
      background: "#fafafa",
      text: "#111827",
      button: "#111827",
      card_style: "outlined",
      radius: 14,
      font: "inter",
      avatar_shape: "circle",
    },
  },
  corporate: {
    label: "Corporate",
    description: "Trustworthy navy & blue",
    theme: {
      preset: "corporate",
      mode: "light",
      primary: "#0b3a6e",
      secondary: "#1d6fd8",
      accent: "#0ea5a4",
      background: "#f4f7fb",
      text: "#0f1d2e",
      button: "#0b3a6e",
      card_style: "elevated",
      radius: 10,
      font: "jakarta",
      avatar_shape: "rounded",
    },
  },
  elegant: {
    label: "Elegant",
    description: "Serif headings, warm ivory",
    theme: {
      preset: "elegant",
      mode: "light",
      primary: "#3b2f2a",
      secondary: "#a1784f",
      accent: "#b08d57",
      background: "#f8f5f0",
      text: "#2a221e",
      button: "#3b2f2a",
      card_style: "flat",
      radius: 6,
      font: "playfair",
      avatar_shape: "circle",
    },
  },
  modern: {
    label: "Modern",
    description: "Indigo gradient, soft cards",
    theme: {
      preset: "modern",
      mode: "light",
      primary: "#4f46e5",
      secondary: "#7c3aed",
      accent: "#06b6d4",
      background: "#f6f7fb",
      text: "#111127",
      button: "#4f46e5",
      card_style: "elevated",
      radius: 18,
      font: "grotesk",
      avatar_shape: "rounded",
    },
  },
  dark: {
    label: "Dark",
    description: "Low-light, high contrast",
    theme: {
      preset: "dark",
      mode: "dark",
      primary: "#e5e7eb",
      secondary: "#38bdf8",
      accent: "#a3e635",
      background: "#0b0d12",
      text: "#e8eaef",
      button: "#38bdf8",
      card_style: "outlined",
      radius: 16,
      font: "manrope",
      avatar_shape: "circle",
    },
  },
  glass: {
    label: "Glassmorphism",
    description: "Dark luxury glass—matches your NFC card vibe",
    theme: {
      preset: "glass",
      mode: "dark",
      primary: "#e8dcc0",
      secondary: "#7c3aed",
      accent: "#4f46e5",
      background: "#0a0a0f",
      text: "#f5f5f5",
      button: "#4f46e5",
      card_style: "glass",
      radius: 16,
      font: "playfair",
      avatar_shape: "circle",
    },
  },
  creative: {
    label: "Creative",
    description: "Bold coral with personality",
    theme: {
      preset: "creative",
      mode: "light",
      primary: "#e4572e",
      secondary: "#f3a712",
      accent: "#29335c",
      background: "#fff8f1",
      text: "#1e1b18",
      button: "#e4572e",
      card_style: "elevated",
      radius: 24,
      font: "manrope",
      avatar_shape: "rounded",
    },
  },
  executive: {
    label: "Executive",
    description: "Charcoal, gold accents—boardroom ready",
    theme: {
      preset: "executive",
      mode: "dark",
      primary: "#e8dcc0",
      secondary: "#c9a227",
      accent: "#8b7355",
      background: "#141414",
      text: "#f3f0ea",
      button: "#c9a227",
      card_style: "glass",
      radius: 12,
      font: "playfair",
      avatar_shape: "circle",
    },
  },
  midnight: {
    label: "Midnight",
    description: "Deep navy, crisp cyan highlights",
    theme: {
      preset: "midnight",
      mode: "dark",
      primary: "#e2e8f0",
      secondary: "#38bdf8",
      accent: "#6366f1",
      background: "#0f172a",
      text: "#e2e8f0",
      button: "#0284c7",
      card_style: "outlined",
      radius: 14,
      font: "jakarta",
      avatar_shape: "rounded",
    },
  },
  slate: {
    label: "Slate",
    description: "Cool gray—consulting & tech",
    theme: {
      preset: "slate",
      mode: "light",
      primary: "#334155",
      secondary: "#64748b",
      accent: "#0d9488",
      background: "#f1f5f9",
      text: "#0f172a",
      button: "#334155",
      card_style: "elevated",
      radius: 10,
      font: "inter",
      avatar_shape: "rounded",
    },
  },
  luxury: {
    label: "Luxury",
    description: "Onyx & champagne—premium personal brand",
    theme: {
      preset: "luxury",
      mode: "dark",
      primary: "#f5e6c8",
      secondary: "#d4af37",
      accent: "#a78bfa",
      background: "#0c0a09",
      text: "#fafaf9",
      button: "#b8860b",
      card_style: "glass",
      radius: 18,
      font: "lora",
      avatar_shape: "circle",
    },
  },
  navy: {
    label: "Navy Pro",
    description: "Classic navy & white—finance & law",
    theme: {
      preset: "navy",
      mode: "light",
      primary: "#1e3a5f",
      secondary: "#2563eb",
      accent: "#dc2626",
      background: "#ffffff",
      text: "#1e293b",
      button: "#1e3a5f",
      card_style: "outlined",
      radius: 8,
      font: "jakarta",
      avatar_shape: "square",
    },
  },
};

/** Preset picker groupings in the dashboard Appearance tab. */
export const THEME_PRESET_GROUPS: { label: string; ids: ThemePresetId[] }[] = [
  { label: "Professional", ids: ["corporate", "executive", "navy", "slate", "minimal"] },
  { label: "Dark & luxury", ids: ["glass", "luxury", "midnight", "dark"] },
  { label: "Modern & creative", ids: ["modern", "elegant", "creative"] },
];

export const DEFAULT_THEME: Theme = THEME_PRESETS.glass.theme;

export const FONT_OPTIONS: { id: FontId; label: string; cssVar: string }[] = [
  { id: "inter", label: "Inter", cssVar: "var(--font-inter)" },
  { id: "jakarta", label: "Plus Jakarta Sans", cssVar: "var(--font-jakarta)" },
  { id: "grotesk", label: "Space Grotesk", cssVar: "var(--font-grotesk)" },
  { id: "manrope", label: "Manrope", cssVar: "var(--font-manrope)" },
  { id: "playfair", label: "Playfair Display", cssVar: "var(--font-playfair)" },
  { id: "lora", label: "Lora", cssVar: "var(--font-lora)" },
];

const SERIF_FONTS: FontId[] = ["playfair", "lora"];

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h.slice(0, 6), 16);
  if (Number.isNaN(n)) return [0, 0, 0];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Black or white, whichever reads better on the given color. */
export function readableOn(hex: string): string {
  return luminance(hex) > 0.45 ? "#0b0b0f" : "#ffffff";
}

export function isHexColor(v: string): boolean {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v);
}

/** Always returns lowercase 6-digit `#rrggbb` when input is valid hex. */
export function normalizeHexColor(hex: string): string {
  if (!isHexColor(hex)) return hex;
  let h = hex.trim().toLowerCase();
  if (h.length === 4) {
    h = `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`;
  }
  return h;
}

/**
 * Turns a Theme into CSS custom properties consumed by the profile components
 * (see `.profile-root` rules in globals.css). Keeping everything in variables
 * lets the dashboard live preview re-theme instantly without re-rendering logic.
 */
export function themeToStyle(theme: Theme): CSSProperties {
  const font = FONT_OPTIONS.find((f) => f.id === theme.font) ?? FONT_OPTIONS[0];
  const headingFont = font.cssVar;
  const bodyFont = SERIF_FONTS.includes(theme.font) ? "var(--font-inter)" : font.cssVar;
  return {
    "--p-primary": theme.primary,
    "--p-secondary": theme.secondary,
    "--p-accent": theme.accent,
    "--p-bg": theme.background,
    "--p-text": theme.text,
    "--p-button": theme.button,
    "--p-button-text": readableOn(theme.button),
    "--p-primary-text": readableOn(theme.primary),
    "--p-radius": `${theme.radius}px`,
    "--p-font-heading": headingFont,
    "--p-font-body": bodyFont,
    colorScheme: theme.mode,
  } as CSSProperties;
}

export function avatarRadius(shape: Theme["avatar_shape"], radius: number): string {
  if (shape === "circle") return "9999px";
  if (shape === "square") return `${Math.min(radius, 8)}px`;
  return `${Math.max(radius, 16)}px`;
}
