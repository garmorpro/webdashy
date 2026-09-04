import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  LayoutTemplate,
  Users,
  HeartHandshake,
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
//
// The standalone Portals list page was removed (see git history) — a
// client's portal status now lives inline on the Clients page instead of
// its own top-level section, so there's no "Portals" nav item any more.
export const navItems: NavItem[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Templates", href: "/templates", icon: LayoutTemplate },
  { title: "Clients", href: "/clients", icon: Users },
  { title: "Client Care", href: "/client-care", icon: HeartHandshake },
];

export const systemNavItems: NavItem[] = [
  { title: "Settings", href: "/settings", icon: Settings },
];
