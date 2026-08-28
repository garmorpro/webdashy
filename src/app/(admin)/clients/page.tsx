import { db } from "@/lib/db";
import { ClientsView } from "@/components/admin/clients-view";
import { boardColumnKey } from "@/lib/client-status";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  // Same start-of-month cutoff and active/won-this-month logic as the
  // Dashboard's own stat cards (src/app/(admin)/page.tsx) — kept
  // identical on purpose so the numbers agree between the two pages.
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

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

  const activeClients = clients.filter((c) => !["WON", "LOST"].includes(boardColumnKey(c.status)));
  const stats = {
    totalClients: clients.length,
    activePipelineCount: activeClients.length,
    pipelineValue: activeClients.reduce((sum, c) => sum + Number(c.estimatedValue ?? 0), 0),
    wonThisMonthCount: clients.filter((c) => c.status === "WON" && c.updatedAt >= startOfMonth)
      .length,
  };

  return <ClientsView clients={clients} templates={templates} stats={stats} />;
}
