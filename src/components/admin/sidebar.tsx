"use client";

import Link from "next/link";
import { LayoutTemplate } from "lucide-react";
import { NavLinks } from "@/components/admin/nav-links";
import { navItems, systemNavItems } from "@/lib/nav-items";

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar md:flex md:flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-sidebar-foreground">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <LayoutTemplate className="h-4 w-4" />
          </span>
          WebDashy
        </Link>
      </div>

      <div className="flex flex-1 flex-col justify-between overflow-y-auto p-4">
        <NavLinks items={navItems} />

        <div className="mt-6 border-t border-sidebar-border pt-4">
          <NavLinks items={systemNavItems} />
        </div>
      </div>
    </aside>
  );
}
