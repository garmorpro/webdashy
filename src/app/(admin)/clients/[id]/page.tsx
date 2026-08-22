import Link from "next/link";
import { notFound } from "next/navigation";
import { Link2, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { ClientForm } from "@/components/admin/client-form";
import { DeleteClientButton } from "@/components/admin/delete-client-button";
import { PortalSummary } from "@/components/admin/portal-summary";
import { Button } from "@/components/ui/button";
import { updateClient } from "@/lib/actions/clients";
import { CLIENT_STATUS_LABELS } from "@/lib/client-status";
import { getAbsoluteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const client = await db.client.findUnique({
    where: { id },
    include: {
      portals: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          templates: { include: { template: true }, orderBy: { displayOrder: "asc" } },
          selection: { include: { template: true } },
        },
      },
    },
  });
  if (!client) notFound();

  const portal = client.portals[0] ?? null;
  const portalUrl = portal ? await getAbsoluteUrl(`/p/${portal.token}`) : null;

  const boundUpdate = updateClient.bind(null, client.id);

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div>
      <PageHeader
        title={client.businessName}
        subtitle={`${CLIENT_STATUS_LABELS[client.status]} · Added ${dateFormatter.format(client.createdAt)} · Last updated ${dateFormatter.format(client.updatedAt)}`}
        actions={<DeleteClientButton clientId={client.id} clientName={client.businessName} />}
      />

      <div className="space-y-6">
        <ClientForm
          action={boundUpdate}
          submitLabel="Save Changes"
          cancelHref="/clients"
          defaultValues={{
            businessName: client.businessName,
            contactName: client.contactName,
            email: client.email,
            phone: client.phone ?? "",
            website: client.website ?? "",
            industry: client.industry ?? "",
            status: client.status,
            leadSource: client.leadSource ?? "",
            estimatedValue: client.estimatedValue?.toString() ?? "",
            notes: client.notes ?? "",
          }}
        />

        {portal && portalUrl ? (
          <PortalSummary
            portalId={portal.id}
            clientId={client.id}
            status={portal.status}
            portalUrl={portalUrl}
            message={portal.message}
            templateNames={portal.templates.map((t) => t.template.name)}
            viewCount={portal.viewCount}
            createdAt={portal.createdAt}
            selectedTemplateName={portal.selection?.template.name ?? null}
            selectedAt={portal.selection?.selectedAt ?? null}
          />
        ) : (
          <div className="max-w-2xl">
            <EmptyState
              icon={Link2}
              title="No template portal yet"
              description="Choose a few templates and create a personalized selection portal for this client."
              action={
                <Button size="sm" render={<Link href={`/clients/${client.id}/portal/new`} />}>
                  <Plus className="h-4 w-4" />
                  Create Portal
                </Button>
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
