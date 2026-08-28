import Link from "next/link";
import { Plus, Users, TrendingUp, DollarSign, Check } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { ClientsTable, type ClientWithPortal } from "@/components/admin/clients-table";
import { QuickAddLeadSheet } from "@/components/admin/quick-add-lead-sheet";
import { Button } from "@/components/ui/button";
import type { Category, Template } from "@prisma/client";

export type ClientsStats = {
  totalClients: number;
  activePipelineCount: number;
  pipelineValue: number;
  wonThisMonthCount: number;
};

export function ClientsView({
  clients,
  templates,
  stats,
}: {
  clients: ClientWithPortal[];
  templates: (Template & { category: Category | null })[];
  stats: ClientsStats;
}) {
  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle="A lightweight CRM for your prospective website clients."
        actions={
          <Button size="sm" nativeButton={false} render={<Link href="/clients/new" />}>
            <Plus className="h-4 w-4" />
            Add New Client
          </Button>
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
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-card p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-foreground">
                <Users className="h-4 w-4" />
              </span>
              <div className="mt-3 text-2xl font-extrabold text-foreground">
                {stats.totalClients}
              </div>
              <div className="text-xs font-semibold text-muted-foreground">total clients</div>
            </div>
            <div className="rounded-2xl bg-card p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-foreground">
                <TrendingUp className="h-4 w-4" />
              </span>
              <div className="mt-3 text-2xl font-extrabold text-foreground">
                {stats.activePipelineCount}
              </div>
              <div className="text-xs font-semibold text-muted-foreground">active pipeline</div>
            </div>
            <div className="rounded-2xl bg-card p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-foreground">
                <DollarSign className="h-4 w-4" />
              </span>
              <div className="mt-3 text-2xl font-extrabold text-foreground">
                ${stats.pipelineValue.toLocaleString()}
              </div>
              <div className="text-xs font-semibold text-muted-foreground">pipeline value</div>
            </div>
            <div className="rounded-2xl bg-accent p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-card text-emerald-700">
                <Check className="h-4 w-4" />
              </span>
              <div className="mt-3 text-2xl font-extrabold text-accent-foreground">
                {stats.wonThisMonthCount}
              </div>
              <div className="text-xs font-semibold text-accent-foreground/80">
                won this month
              </div>
            </div>
          </div>

          <ClientsTable clients={clients} templates={templates} />
        </>
      )}

      <QuickAddLeadSheet />
    </div>
  );
}
