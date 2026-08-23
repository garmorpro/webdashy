import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getAppSettings } from "@/lib/settings";
import { PortalShell } from "@/components/portal/portal-shell";
import { PortalGrid } from "@/components/portal/portal-grid";
import { PortalSuccess } from "@/components/portal/portal-success";
import { PortalUnavailable } from "@/components/portal/portal-unavailable";

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
        />
      )}
    </PortalShell>
  );
}
