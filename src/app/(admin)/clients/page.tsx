import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { ClientsTable } from "@/components/admin/clients-table";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const [clients, templates] = await Promise.all([
    db.client.findMany({ orderBy: { createdAt: "desc" } }),
    db.template.findMany({
      where: { status: "ACTIVE" },
      include: { category: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle="A lightweight CRM for your prospective website clients."
        actions={
          <Button size="sm" render={<Link href="/clients/new" />}>
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
            <Button size="sm" render={<Link href="/clients/new" />}>
              <Plus className="h-4 w-4" />
              Add Client
            </Button>
          }
        />
      ) : (
        <ClientsTable clients={clients} templates={templates} />
      )}
    </div>
  );
}
