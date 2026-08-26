"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NavLinks } from "@/components/admin/nav-links";
import { navItems, systemNavItems } from "@/lib/nav-items";
import { logoutAction } from "@/lib/actions/auth";

function initialsFor(name?: string | null, email?: string | null): string {
  const source = name?.trim() || email?.trim() || "";
  if (!source) return "?";
  const parts = source.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export function Topbar({
  user,
}: {
  user?: { name?: string | null; email?: string | null } | null;
}) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  return (
    <header className="flex h-20 items-center justify-between px-4 md:px-8">
      <div className="flex items-center gap-2 md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={<Button variant="ghost" size="icon" aria-label="Open navigation" />}
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 bg-sidebar p-0">
            <SheetHeader className="h-16 justify-center border-b border-sidebar-border px-6">
              <SheetTitle render={<Link href="/" className="flex items-center" />}>
                <Image
                  src="/brand/wordmark.png"
                  alt="WebDashy"
                  width={616}
                  height={114}
                  className="h-6 w-auto"
                />
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
        <Image
          src="/brand/wordmark.png"
          alt="WebDashy"
          width={616}
          height={114}
          className="h-5 w-auto"
        />
      </div>

      <div className="hidden md:block" />

      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button type="button" aria-label="Account menu" className="rounded-2xl">
                <Avatar className="h-11 w-11 rounded-2xl">
                  <AvatarFallback className="rounded-2xl bg-foreground text-sm font-bold text-background">
                    {initialsFor(user?.name, user?.email)}
                  </AvatarFallback>
                </Avatar>
              </button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="max-w-[220px] truncate font-normal text-muted-foreground">
              {user?.name || user?.email || "Signed in"}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                startTransition(() => {
                  logoutAction();
                });
              }}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
