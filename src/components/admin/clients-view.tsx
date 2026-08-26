"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { ClientsTable, type ClientWithPortal } from "@/components/admin/clients-table";
import { ClientsBoard } from "@/components/admin/clients-board";
import { QuickAddLeadSheet } from "@/components/admin/quick-add-lead-sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Category, Template } from "@prisma/client";

export function ClientsView({
  clients,
  templates,
}: {
  clients: ClientWithPortal[];
  templates: (Template & { category: Category | null })[];
}) {
  const [view, setView] = useState<"table" | "board">("table");

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle="A lightweight CRM for your prospective website clients."
        actions={
          <>
            {clients.length > 0 ? (
              <div className="flex items-center gap-1 rounded-full bg-secondary p-1">
                <button
                  type="button"
                  onClick={() => setView("table")}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-bold transition-colors",
                    view === "table"
                      ? "bg-foreground text-background"
                      : "text-muted-foreground"
                  )}
                >
                  Table
                </button>
                <button
                  type="button"
                  onClick={() => setView("board")}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-bold transition-colors",
                    view === "board"
                      ? "bg-foreground text-background"
                      : "text-muted-foreground"
                  )}
                >
                  Board
                </button>
              </div>
            ) : null}
            <Button size="sm" nativeButton={false} render={<Link href="/clients/new" />}>
              <Plus className="h-4 w-4" />
              Add New Client
            </Button>
          </>
        }
      />

      {clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Add your first potential client"
          description="Create a client and send them a personalized template selection portal."
          action={
            <Button size="sm" nativeButton={false} render={<Link href="/clients/new" />}>
              <Plus className="h-4 w-4" />
              Add Client
            </Button>
          }
        />
      ) : view === "table" ? (
        <ClientsTable clients={clients} templates={templates} />
      ) : (
        <ClientsBoard clients={clients} />
      )}

      <QuickAddLeadSheet />
    </div>
  );
}
