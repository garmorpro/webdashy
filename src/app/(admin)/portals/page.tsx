import Link from "next/link";
import { Link2 } from "lucide-react";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PORTAL_STATUS_LABELS, PORTAL_STATUS_STYLES } from "@/lib/portal-status";

export const dynamic = "force-dynamic";

export default async function PortalsPage() {
  const portals = await db.portal.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      client: true,
      templates: true,
      selection: { include: { template: true } },
    },
  });

  const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

  return (
    <div>
      <PageHeader
        title="Portals"
        subtitle="Track every client portal you've generated — status, views, and selections."
      />

      {portals.length === 0 ? (
        <EmptyState
          icon={Link2}
          title="No template portal yet"
          description="Choose a few templates and create a personalized selection portal for a client to get started."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Templates</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Selected Template</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {portals.map((portal) => (
                <TableRow key={portal.id}>
                  <TableCell>
                    <Link href={`/clients/${portal.clientId}`} className="font-medium text-foreground hover:underline">
                      {portal.client.businessName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={PORTAL_STATUS_STYLES[portal.status]}>
                      {PORTAL_STATUS_LABELS[portal.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{portal.templates.length}</TableCell>
                  <TableCell className="text-muted-foreground">{portal.viewCount}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {portal.selection?.template.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {dateFormatter.format(portal.createdAt)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {dateFormatter.format(portal.updatedAt)}
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
