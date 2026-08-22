import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CLIENT_STATUS_LABELS, CLIENT_STATUS_STYLES } from "@/lib/client-status";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await db.client.findMany({
    orderBy: { createdAt: "desc" },
  });

  const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

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
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Est. Value</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id} className="cursor-pointer">
                  <TableCell>
                    <Link href={`/clients/${client.id}`} className="block">
                      <span className="font-medium text-foreground">{client.businessName}</span>
                      <span className="block text-xs text-muted-foreground">
                        {client.contactName}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`${CLIENT_STATUS_STYLES[client.status]} capitalize`}
                    >
                      {CLIENT_STATUS_LABELS[client.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {client.industry ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {client.estimatedValue
                      ? `$${Number(client.estimatedValue).toLocaleString()}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {dateFormatter.format(client.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
