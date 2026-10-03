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
    description: "Frosted cards on deep color",
    theme: {
      preset: "glass",
      mode: "dark",
      primary: "#a78bfa",
      secondary: "#22d3ee",
      accent: "#f472b6",
      background: "#14112b",
      text: "#f3f1ff",
      button: "#8b5cf6",
      card_style: "glass",
      radius: 22,
      font: "jakarta",
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
};

export const DEFAULT_THEME: Theme = THEME_PRESETS.modern.theme;

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
