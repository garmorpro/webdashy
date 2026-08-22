"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NavLinks } from "@/components/admin/nav-links";
import { navItems, systemNavItems } from "@/lib/nav-items";

export function Topbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 md:px-8">
      <div className="flex items-center gap-2 md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={<Button variant="ghost" size="icon" aria-label="Open navigation" />}
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 bg-sidebar p-0">
            <SheetHeader className="h-16 justify-center border-b border-sidebar-border px-6">
              <SheetTitle
                render={
                  <Link
                    href="/"
                    className="flex items-center gap-2 font-semibold text-sidebar-foreground"
                  />
                }
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <LayoutTemplate className="h-4 w-4" />
                </span>
                WebDashy
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col justify-between p-4">
              <NavLinks items={navItems} onNavigate={() => setOpen(false)} />
              <div className="mt-6 border-t border-sidebar-border pt-4">
                <NavLinks items={systemNavItems} onNavigate={() => setOpen(false)} />
              </div>
            </div>
          </SheetContent>
        </Sheet>
        <span className="font-semibold">WebDashy</span>
      </div>

      <div className="hidden md:block" />

      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-accent text-accent-foreground text-xs font-medium">
            GM
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
