"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/lib/nav-items";

export function NavLinks({
  items,
  onNavigate,
}: {
  items: NavItem[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm transition-colors",
              isActive
                ? "bg-sidebar-accent font-bold text-sidebar-accent-foreground"
                : "font-semibold text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            {isActive ? (
              <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
            ) : (
              <Icon className="h-4 w-4 shrink-0" />
            )}
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
