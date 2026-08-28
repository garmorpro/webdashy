import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getAppSettings } from "@/lib/settings";
import { PortalShell } from "@/components/portal/portal-shell";
import { PortalGrid } from "@/components/portal/portal-grid";
import { PortalSuccess } from "@/components/portal/portal-success";
import { PortalUnavailable } from "@/components/portal/portal-unavailable";
import { pipelineStepIndex } from "@/lib/client-status";

// Always resolved per-request against live data — a client's selection
// must never be served from a stale cache. Also can't be statically
// prerendered at build time (no DB reachable during `docker build`).
export const dynamic = "force-dynamic";

async function getPortal(token: string) {
  return db.portal.findUnique({
    where: { token },
    include: {
      client: true,
      templates: {
        include: { template: { include: { category: true } } },
        orderBy: { displayOrder: "asc" },
      },
      selection: { include: { template: true, plan: true } },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const portal = await getPortal(token);

  return {
    title: portal
      ? `${portal.client.businessName} — Website Template Selection`
      : "Template Selection",
    // Public, unguessable-token portals must never be indexed — see
    // ARCHITECTURE.md §6 / product-build.md §35.
    robots: { index: false, follow: false },
  };
}

export default async function PublicPortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const [portal, settings] = await Promise.all([getPortal(token), getAppSettings()]);

  if (!portal) notFound();
  if (portal.status === "DISABLED") return <PortalUnavailable />;

  // Record this as a real view — every load of this page happens via the
  // client's own unique, unguessable link (see ARCHITECTURE.md §6), so
  // there's no separate "admin preview" case to exclude. Forward-only
  // status bump (ACTIVE -> VIEWED) — never downgrades a portal that's
  // already SELECTED. Best-effort: a failure here must never stop the
  // client from actually seeing their templates.
  try {
    await db.portal.update({
      where: { id: portal.id },
      data: {
        viewCount: { increment: 1 },
        firstViewedAt: portal.firstViewedAt ?? new Date(),
        lastViewedAt: new Date(),
        status: portal.status === "ACTIVE" ? "VIEWED" : portal.status,
      },
    });
    if (pipelineStepIndex("VIEWED") > pipelineStepIndex(portal.client.status)) {
      await db.client.update({ where: { id: portal.clientId }, data: { status: "VIEWED" } });
    }
  } catch (err) {
    console.error("Failed to record portal view:", err);
  }

  const plans = portal.selection
    ? []
    : await db.plan.findMany({ where: { isActive: true }, orderBy: { displayOrder: "asc" } });

  return (
    <PortalShell clientName={portal.client.businessName} message={portal.message}>
      {portal.selection ? (
        <PortalSuccess
          templateName={portal.selection.template.name}
          planName={portal.selection.plan?.name ?? null}
          selectedAt={portal.selection.selectedAt}
        />
      ) : (
        <PortalGrid
          token={token}
          templates={portal.templates.map((t) => t.template)}
          plans={plans}
          showPricing={settings.showPricingInPortal}
          oneTimeFooterNote={settings.oneTimeFooterNote}
        />
      )}
    </PortalShell>
  );
}
