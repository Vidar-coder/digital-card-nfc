import { Inter, Lora, Manrope, Playfair_Display, Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";

// Inter is the UI font and always preloaded; the others are profile theme
// options and only download when a profile actually uses them.
export const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
export const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap", preload: false });
export const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk", display: "swap", preload: false });
export const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap", preload: false });
export const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap", preload: false });
export const lora = Lora({ subsets: ["latin"], variable: "--font-lora", display: "swap", preload: false });

export const fontVariables = [inter, jakarta, grotesk, manrope, playfair, lora].map((f) => f.variable).join(" ");
