import {
  BarChart3,
  BookOpen,
  Briefcase,
  Calculator,
  Camera,
  Code2,
  Globe,
  HeartHandshake,
  Lightbulb,
  Megaphone,
  Palette,
  PenTool,
  Rocket,
  Shield,
  Smartphone,
  Sparkles,
  Users,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

/** Icons a service can pick in the dashboard. Keys are stored in the DB. */
export const SERVICE_ICONS: Record<string, { icon: LucideIcon; label: string }> = {
  sparkles: { icon: Sparkles, label: "Sparkles" },
  briefcase: { icon: Briefcase, label: "Briefcase" },
  code: { icon: Code2, label: "Code" },
  shield: { icon: Shield, label: "Shield" },
  zap: { icon: Zap, label: "Lightning" },
  chart: { icon: BarChart3, label: "Chart" },
  calculator: { icon: Calculator, label: "Calculator" },
  palette: { icon: Palette, label: "Palette" },
  pen: { icon: PenTool, label: "Design" },
  camera: { icon: Camera, label: "Camera" },
  megaphone: { icon: Megaphone, label: "Marketing" },
  users: { icon: Users, label: "People" },
  globe: { icon: Globe, label: "Globe" },
  smartphone: { icon: Smartphone, label: "Mobile" },
  lightbulb: { icon: Lightbulb, label: "Idea" },
  wrench: { icon: Wrench, label: "Tools" },
  rocket: { icon: Rocket, label: "Rocket" },
  heart: { icon: HeartHandshake, label: "Care" },
  book: { icon: BookOpen, label: "Learning" },
};

export function serviceIcon(key: string | null): LucideIcon {
  return (key && SERVICE_ICONS[key]?.icon) || Sparkles;
}
