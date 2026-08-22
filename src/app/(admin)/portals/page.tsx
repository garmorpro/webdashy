import { Link2 } from "lucide-react";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { PortalsTable, type PortalRow } from "@/components/admin/portals-table";
import { getAbsoluteUrl } from "@/lib/site-url";

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

  const rows: PortalRow[] = await Promise.all(
    portals.map(async (portal) => ({
      id: portal.id,
      clientId: portal.clientId,
      clientName: portal.client.businessName,
      status: portal.status,
      templateCount: portal.templates.length,
      viewCount: portal.viewCount,
      selectedTemplateName: portal.selection?.template.name ?? null,
      createdAt: portal.createdAt,
      updatedAt: portal.updatedAt,
      portalUrl: await getAbsoluteUrl(`/p/${portal.token}`),
    }))
  );

  return (
    <div>
      <PageHeader
        title="Portals"
        subtitle="Track every client portal you've generated — status, views, and selections."
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={Link2}
          title="No template portal yet"
          description="Choose a few templates and create a personalized selection portal for a client to get started."
        />
      ) : (
        <PortalsTable portals={rows} />
      )}
    </div>
  );
}
