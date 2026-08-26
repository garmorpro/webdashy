"use client";

import Link from "next/link";
import Image from "next/image";
import { NavLinks } from "@/components/admin/nav-links";
import { navItems, systemNavItems } from "@/lib/nav-items";

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 p-5 md:flex md:flex-col">
      <div className="sticky top-5 flex h-[calc(100vh-2.5rem)] flex-col gap-9 rounded-[1.75rem] bg-sidebar p-6 shadow-[0_10px_30px_-12px_rgba(38,49,94,0.12)]">
        <Link href="/" className="flex items-center px-1">
          <Image
            src="/brand/wordmark.png"
            alt="WebDashy"
            width={616}
            height={114}
            priority
            className="h-6 w-auto"
          />
        </Link>

        <div className="flex flex-1 flex-col justify-between overflow-y-auto">
          <NavLinks items={navItems} />

          <div className="mt-4 border-t border-sidebar-border pt-4">
            <NavLinks items={systemNavItems} />
          </div>
        </div>
      </div>
    </aside>
  );
}
