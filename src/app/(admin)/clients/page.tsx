import { db } from "@/lib/db";
import { ClientsView } from "@/components/admin/clients-view";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const [clientRows, templates] = await Promise.all([
    db.client.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        // Only the most recent portal — a client only ever has one live
        // portal at a time (createPortal redirects instead of creating a
        // second one), so this is really just "the" portal when present.
        portals: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            status: true,
            viewCount: true,
            selection: { select: { template: { select: { name: true } } } },
          },
        },
      },
    }),
    db.template.findMany({
      where: { status: "ACTIVE" },
      include: { category: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // Flatten the take-1 portals array into a single nullable `portal` field —
  // simpler for ClientsTable to render than threading portals[0] everywhere.
  const clients = clientRows.map(({ portals, ...client }) => ({
    ...client,
    portal: portals[0]
      ? {
          status: portals[0].status,
          viewCount: portals[0].viewCount,
          selectedTemplateName: portals[0].selection?.template.name ?? null,
        }
      : null,
  }));

  return <ClientsView clients={clients} templates={templates} />;
}
