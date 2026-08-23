import Link from "next/link";
import { notFound } from "next/navigation";
import { Link2, Plus, PartyPopper } from "lucide-react";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { ClientForm } from "@/components/admin/client-form";
import { DeleteClientButton } from "@/components/admin/delete-client-button";
import { PortalSummary } from "@/components/admin/portal-summary";
import { ClientStepper } from "@/components/admin/client-stepper";
import { RequirementsSection } from "@/components/admin/requirements-section";
import { InvoiceSection } from "@/components/admin/invoice-section";
import { DeliverySection } from "@/components/admin/delivery-section";
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
          selection: { include: { template: true, plan: true } },
          requirements: true,
          delivery: true,
          invoices: { orderBy: { createdAt: "desc" }, take: 1, include: { lineItems: true } },
        },
      },
    },
  });
  if (!client) notFound();

  const portal = client.portals[0] ?? null;
  const portalUrl = portal ? await getAbsoluteUrl(`/p/${portal.token}`) : null;
  const reviewUrl =
    portal?.delivery?.reviewToken ? await getAbsoluteUrl(`/r/${portal.delivery.reviewToken}`) : null;
  const latestInvoice = portal?.invoices[0] ?? null;

  const requirementsLocked = !portal?.selection;
  const invoiceLocked = !portal?.requirements;
  const deliveryLocked = latestInvoice?.status !== "PAID";

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

      <ClientStepper status={client.status} />

      <div className="space-y-6">
        {client.status === "WON" ? (
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-50 px-6 py-6 text-center">
            <PartyPopper className="mx-auto h-7 w-7 text-emerald-600" />
            <h2 className="mt-2 text-lg font-semibold text-emerald-700">Project Complete</h2>
            <p className="mt-1 text-sm text-emerald-700/80">
              {client.businessName} approved their site and final payment has been collected.
            </p>
          </div>
        ) : null}

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
          <>
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

            <RequirementsSection
              portalId={portal.id}
              clientId={client.id}
              requirements={portal.requirements}
              locked={requirementsLocked}
            />

            <InvoiceSection
              clientId={client.id}
              portalId={portal.id}
              invoice={latestInvoice}
              locked={invoiceLocked}
            />

            <DeliverySection
              portalId={portal.id}
              clientId={client.id}
              delivery={portal.delivery}
              reviewUrl={reviewUrl}
              locked={deliveryLocked}
            />
          </>
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
