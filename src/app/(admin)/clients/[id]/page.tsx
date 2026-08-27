import Link from "next/link";
import { notFound } from "next/navigation";
import { Link2, Plus, PartyPopper } from "lucide-react";
import { db } from "@/lib/db";
import { EmptyState } from "@/components/admin/empty-state";
import { ClientContactSection } from "@/components/admin/client-contact-section";
import { DesignQuestionnaireSection } from "@/components/admin/design-questionnaire-section";
import { DeleteClientButton } from "@/components/admin/delete-client-button";
import { PortalSummary } from "@/components/admin/portal-summary";
import { ClientStepper } from "@/components/admin/client-stepper";
import { RequirementsSection } from "@/components/admin/requirements-section";
import { InvoiceSection } from "@/components/admin/invoice-section";
import { DeliverySection } from "@/components/admin/delivery-section";
import { SectionLocked } from "@/components/admin/section-locked";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { updateClient } from "@/lib/actions/clients";
import { CLIENT_STATUS_LABELS, CLIENT_STATUS_STYLES, pipelineStepIndex } from "@/lib/client-status";
import { avatarColorsFor, initialsFor } from "@/lib/avatar-colors";
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
      questionnaire: true,
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
  const questionnaireFormUrl = client.questionnaire
    ? await getAbsoluteUrl(`/q/${client.questionnaire.token}`)
    : null;
  const reviewUrl =
    portal?.delivery?.reviewToken ? await getAbsoluteUrl(`/r/${portal.delivery.reviewToken}`) : null;
  const latestInvoice = portal?.invoices[0] ?? null;

  const requirementsLocked = !portal?.selection;
  const invoiceLocked = !portal?.requirements;
  const deliveryLocked = latestInvoice?.status !== "PAID";
  // A portal can't be created until the client's finished the Design
  // Questionnaire — an already-created portal (or a client who reached
  // this stage before the questionnaire feature existed) stays fully
  // visible regardless, this only gates *creating* a new one.
  const portalLocked = pipelineStepIndex(client.status) < pipelineStepIndex("QUESTIONNAIRE_DONE");

  const boundUpdate = updateClient.bind(null, client.id);

  const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });
  const avatarColors = avatarColorsFor(client.businessName);

  return (
    <div>
      <div className="mb-3.5 text-xs font-semibold text-muted-foreground">
        <Link href="/clients" className="hover:text-foreground hover:underline">
          Clients
        </Link>{" "}
        / {client.businessName}
      </div>

      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-extrabold"
            style={{ backgroundColor: avatarColors.bg, color: avatarColors.text }}
          >
            {initialsFor(client.businessName)}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              {client.businessName}
            </h1>
            <p className="mt-0.5 text-sm font-medium text-muted-foreground">
              {client.contactName} · Added {dateFormatter.format(client.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <Badge variant="secondary" className={CLIENT_STATUS_STYLES[client.status]}>
            {CLIENT_STATUS_LABELS[client.status]}
          </Badge>
          <DeleteClientButton clientId={client.id} clientName={client.businessName} iconOnly />
        </div>
      </div>

      <div className="mb-6">
        <ClientStepper clientId={client.id} status={client.status} />
      </div>

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

        <ClientContactSection
          action={boundUpdate}
          cancelHref={`/clients/${client.id}`}
          values={{
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

        <DesignQuestionnaireSection
          clientId={client.id}
          questionnaire={client.questionnaire}
          formUrl={questionnaireFormUrl}
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
              selectedPlanName={portal.selection?.plan?.name ?? null}
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
        ) : portalLocked ? (
          <SectionLocked
            title="Template Portal"
            icon={Link2}
            reason="Available once the Design Questionnaire is submitted."
          />
        ) : (
          <div className="max-w-2xl">
            <EmptyState
              icon={Link2}
              title="No template portal yet"
              description="Choose a few templates and create a personalized selection portal for this client."
              action={
                <Button size="sm" nativeButton={false} render={<Link href={`/clients/${client.id}/portal/new`} />}>
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
