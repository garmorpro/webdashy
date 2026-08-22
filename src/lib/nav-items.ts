import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  LayoutTemplate,
  Users,
  Link2,
  Settings,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

// Mirrors product-build.md §21 "Internal Navigation" (Main section).
// Categories, Custom Requests, Analytics, and Brand Kit are listed there as
// later additions — not built yet, so intentionally left out of the nav.
export const navItems: NavItem[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Templates", href: "/templates", icon: LayoutTemplate },
  { title: "Clients", href: "/clients", icon: Users },
  { title: "Portals", href: "/portals", icon: Link2 },
];

export const systemNavItems: NavItem[] = [
  { title: "Settings", href: "/settings", icon: Settings },
];
