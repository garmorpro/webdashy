import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { boardColumnKey } from "@/lib/client-status";
import { DashboardView, type DashboardActivityEntry } from "@/components/admin/dashboard-view";

// Phase 7 (Dashboard) — real data, replacing the placeholder metrics/
// activity that shipped with earlier phases. See ROADMAP.md.
export const dynamic = "force-dynamic";

async function getDashboardData() {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [templateCount, clients, selections, invoices, deliveries] = await Promise.all([
    db.template.count(),
    db.client.findMany({
      select: { id: true, businessName: true, status: true, estimatedValue: true, updatedAt: true },
    }),
    db.templateSelection.findMany({
      orderBy: { selectedAt: "desc" },
      take: 5,
      include: { template: true, plan: true, portal: { include: { client: true } } },
    }),
    db.invoice.findMany({
      where: { sentAt: { not: null } },
      orderBy: { sentAt: "desc" },
      take: 5,
      include: { client: true, lineItems: true },
    }),
    db.delivery.findMany({
      where: { OR: [{ deliveredAt: { not: null } }, { reviewedAt: { not: null } }] },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { portal: { include: { client: true } } },
    }),
  ]);

  const activeClients = clients.filter((c) => !["WON", "LOST"].includes(boardColumnKey(c.status)));
  const pipelineValue = activeClients.reduce((sum, c) => sum + Number(c.estimatedValue ?? 0), 0);
  const wonThisMonth = clients
    .filter((c) => c.status === "WON" && c.updatedAt >= startOfMonth)
    .reduce((sum, c) => sum + Number(c.estimatedValue ?? 0), 0);

  const pipelineStages = [
    { key: "LEAD", label: "Lead", count: clients.filter((c) => boardColumnKey(c.status) === "LEAD").length },
    { key: "PORTAL_SENT", label: "Portal Sent", count: clients.filter((c) => boardColumnKey(c.status) === "PORTAL_SENT").length },
    { key: "INVOICE_SENT", label: "Invoice", count: clients.filter((c) => boardColumnKey(c.status) === "INVOICE_SENT").length },
    { key: "WON", label: "Won", count: clients.filter((c) => boardColumnKey(c.status) === "WON").length },
  ];

  const activity: DashboardActivityEntry[] = [];
  for (const s of selections) {
    activity.push({
      clientName: s.portal.client.businessName,
      text: `Selected ${s.template.name}${s.plan ? ` · ${s.plan.name} plan` : ""}`,
      at: s.selectedAt,
    });
  }
  for (const inv of invoices) {
    const total = inv.lineItems.reduce((sum, li) => sum + Number(li.amount), 0) + Number(inv.taxAmount);
    activity.push({
      clientName: inv.client.businessName,
      text: `Invoice sent · $${total.toLocaleString()}`,
      at: inv.sentAt!,
    });
  }
  for (const d of deliveries) {
    if (d.reviewedAt) {
      activity.push({
        clientName: d.portal.client.businessName,
        text: d.reviewStatus === "APPROVED" ? "Approved their delivered site" : "Requested changes on their site",
        at: d.reviewedAt,
      });
    } else if (d.deliveredAt) {
      activity.push({
        clientName: d.portal.client.businessName,
        text: "Site marked delivered",
        at: d.deliveredAt,
      });
    }
  }
  activity.sort((a, b) => b.at.getTime() - a.at.getTime());

  return {
    templateCount,
    activeClientCount: activeClients.length,
    pipelineValue,
    wonThisMonth,
    pipelineStages,
    activity: activity.slice(0, 6),
  };
}

export default async function DashboardPage() {
  const session = await auth();
  const user = session?.user?.id
    ? await db.user.findUnique({ where: { id: session.user.id }, select: { name: true } })
    : null;
  const firstName = user?.name?.trim().split(/\s+/)[0] || "there";

  const data = await getDashboardData();

  return <DashboardView firstName={firstName} {...data} />;
}
