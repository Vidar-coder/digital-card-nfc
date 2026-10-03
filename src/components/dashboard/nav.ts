import {
  BarChart3,
  Briefcase,
  Contact,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  Layers,
  LayoutDashboard,
  Link2,
  Palette,
  QrCode,
  Settings,
  Sparkles,
  UserRound,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Only shown to admins (and the route itself checks the role). */
  adminOnly?: boolean;
}

export const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "",
    items: [{ href: "/dashboard", label: "Overview", icon: LayoutDashboard }],
  },
  {
    label: "Content",
    items: [
      { href: "/dashboard/profile", label: "Profile", icon: UserRound },
      { href: "/dashboard/contact", label: "Contact info", icon: Contact },
      { href: "/dashboard/about", label: "About", icon: FileText },
      { href: "/dashboard/experience", label: "Experience", icon: Briefcase },
      { href: "/dashboard/education", label: "Education", icon: GraduationCap },
      { href: "/dashboard/skills", label: "Skills", icon: Wrench },
      { href: "/dashboard/services", label: "Services", icon: Sparkles },
      { href: "/dashboard/projects", label: "Portfolio", icon: Layers },
      { href: "/dashboard/social", label: "Social links", icon: Link2 },
    ],
  },
  {
    label: "Card",
    items: [
      { href: "/dashboard/appearance", label: "Appearance", icon: Palette },
      { href: "/dashboard/share", label: "QR & sharing", icon: QrCode },
      { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Admin",
    items: [
      { href: "/dashboard/users", label: "Users", icon: Users, adminOnly: true },
      { href: "/dashboard/database", label: "Google Sheet", icon: FileSpreadsheet, adminOnly: true },
    ],
  },
  {
    label: "",
    items: [{ href: "/dashboard/account", label: "Account", icon: Settings }],
  },
];
