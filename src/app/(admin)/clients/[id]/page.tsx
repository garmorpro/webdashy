import Link from "next/link";
import { notFound } from "next/navigation";
import { Link2, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { EmptyState } from "@/components/admin/empty-state";
import { ClientContactSection } from "@/components/admin/client-contact-section";
import { DesignQuestionnaireSection } from "@/components/admin/design-questionnaire-section";
import { DeleteClientButton } from "@/components/admin/delete-client-button";
import { PortalSummary } from "@/components/admin/portal-summary";
import { ClientStepper } from "@/components/admin/client-stepper";
import { RequirementsSection } from "@/components/admin/requirements-section";
import { BuildSetupSection } from "@/components/admin/build-setup-section";
import { WebsiteProvisioningSection } from "@/components/admin/website-provisioning-section";
import { NetlifyProvisioningSection } from "@/components/admin/netlify-provisioning-section";
import { InvoiceSection } from "@/components/admin/invoice-section";
import { DeliverySection } from "@/components/admin/delivery-section";
import { SectionLocked } from "@/components/admin/section-locked";
import { Button } from "@/components/ui/button";
import { updateClient } from "@/lib/actions/clients";
import { pipelineStepIndex } from "@/lib/client-status";
import { avatarColorsFor, initialsFor } from "@/lib/avatar-colors";
import { getAbsoluteUrl } from "@/lib/site-url";
import { isWorkflowStageAtLeast } from "@/lib/workflow";
import { LaunchHandoffSection } from "@/components/admin/launch-handoff-section";
import { getHandoffReadiness } from "@/lib/services/handoff-packets";
import { CompletedMilestone } from "@/components/admin/completed-milestone";
import { countAnsweredFields, TOTAL_QUESTIONNAIRE_FIELDS, type QuestionnaireAnswers } from "@/lib/questionnaire-schema";
import { handoffDocumentUnits } from "@/lib/services/handoff-documents.mjs";

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
          buildSetup: { include: { websiteProvisioning: { include: { netlifyProvisioning: true } } } },
          delivery: { include: { reviews: { orderBy: { cycle: "desc" } } } },
          invoices: { orderBy: { createdAt: "desc" }, take: 1, include: { lineItems: true } },
          handoffPackets: { where: { status: { notIn: ["SUPERSEDED", "REVOKED"] } }, orderBy: { version: "desc" }, take: 1, include: { checklistItems: { orderBy: { displayOrder: "asc" } }, templateRevision: true, acceptance: true, emailAttempts: { orderBy: { attemptedAt: "desc" } } } },
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
  const handoffReadiness = portal ? await getHandoffReadiness(portal.id, client.id) : null;
  const handoffPacket = portal?.handoffPackets[0] ?? null;
  const [latestPublishedHandoffRevision, latestDraftHandoffRevision] = handoffPacket ? await Promise.all([
    db.handoffTemplateRevision.findFirst({ where: { status: "PUBLISHED", template: { isDefault: true } }, orderBy: { revision: "desc" }, select: { revision: true } }),
    db.handoffTemplateRevision.findFirst({ where: { status: "DRAFT", template: { isDefault: true }, revision: { gt: handoffPacket.templateRevision.revision } }, orderBy: { revision: "desc" }, select: { id: true, revision: true } }),
  ]) : [null, null];

  const requirementsLocked = !portal?.selection;
  const buildSetupLocked = !portal?.selection || !portal?.requirements;
  const invoiceLocked = !isWorkflowStageAtLeast(client.workflowStage, "REVISIONS_APPROVED");
  const deliveryLocked =
    !isWorkflowStageAtLeast(client.workflowStage, "BUILD_SETUP") ||
    portal?.buildSetup?.status !== "CONFIRMED" ||
    portal?.buildSetup?.websiteProvisioning?.status !== "SUCCEEDED" ||
    portal?.buildSetup?.websiteProvisioning?.netlifyProvisioning?.status !== "SUCCEEDED";
  const deliveryLockReason = portal?.buildSetup?.websiteProvisioning?.status !== "SUCCEEDED"
    ? "Available once GitHub Website Provisioning succeeds."
    : portal?.buildSetup?.websiteProvisioning?.netlifyProvisioning?.status !== "SUCCEEDED"
      ? "Available once Netlify provisioning and its initial production deploy succeed."
      : "Available once Build Setup is confirmed.";
  // A portal can't be created until the client's finished the Design
  // Questionnaire — an already-created portal (or a client who reached
  // this stage before the questionnaire feature existed) stays fully
  // visible regardless, this only gates *creating* a new one.
  const portalLocked = pipelineStepIndex(client.status) < pipelineStepIndex("QUESTIONNAIRE_DONE");

  const boundUpdate = updateClient.bind(null, client.id);

  const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });
  const avatarColors = avatarColorsFor(client.businessName);
  const questionnaireAnswers =
    client.questionnaire?.answers &&
    typeof client.questionnaire.answers === "object" &&
    !Array.isArray(client.questionnaire.answers)
      ? (client.questionnaire.answers as QuestionnaireAnswers)
      : null;

  const questionnaireAnswered = questionnaireAnswers
    ? countAnsweredFields(questionnaireAnswers)
    : 0;

  const questionnaireDefaults = questionnaireAnswers
    ? {
        pages: questionnaireAnswers.desiredPages ?? "",
        launchTimeline: questionnaireAnswers.launchTimeline ?? "",
        customerActions: questionnaireAnswers.customerActions ?? "",
        pagesNeedingUpdates: questionnaireAnswers.pagesNeedingUpdates ?? "",
        googleAnalytics: questionnaireAnswers.googleAnalytics ?? "",
      }
    : null;

  const invoiceTotal = latestInvoice ? latestInvoice.lineItems.reduce((sum, item) => sum + Number(item.amount), Number(latestInvoice.taxAmount)) : 0;

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
        <DeleteClientButton
          clientId={client.id}
          clientName={client.businessName}
          iconOnly
        />
      </div>

      <div className="mb-6">
        <ClientStepper workflowStage={client.workflowStage} />
      </div>

      <div className="space-y-6">
        <div id="section-contact">
          <ClientContactSection
            action={boundUpdate}
            clientId={client.id}
            workflowStage={client.workflowStage}
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
        </div>

        <div id="section-questionnaire">{client.questionnaire?.status === "SUBMITTED" ? <CompletedMilestone title="Design Questionnaire" summary={`Submitted ${client.questionnaire.submittedAt ? dateFormatter.format(client.questionnaire.submittedAt) : ""} · ${questionnaireAnswered}/${TOTAL_QUESTIONNAIRE_FIELDS} answered`}>
          <DesignQuestionnaireSection
            clientId={client.id}
            businessName={client.businessName}
            questionnaire={client.questionnaire}
            formUrl={questionnaireFormUrl}
          /></CompletedMilestone> : <DesignQuestionnaireSection clientId={client.id} businessName={client.businessName} questionnaire={client.questionnaire} formUrl={questionnaireFormUrl}/>}
        </div>

        {portal && portalUrl ? (
          <>
            <div id="section-portal" className="space-y-6">
              {portal.selection ? <CompletedMilestone title="Template & Plan" summary={`${portal.selection.template.name}${portal.selection.plan ? ` · ${portal.selection.plan.name}` : ""}`}><PortalSummary
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
              /></CompletedMilestone> : <PortalSummary portalId={portal.id} clientId={client.id} status={portal.status} portalUrl={portalUrl} message={portal.message} templateNames={portal.templates.map((t) => t.template.name)} viewCount={portal.viewCount} createdAt={portal.createdAt} selectedTemplateName={null} selectedPlanName={null} selectedAt={null}/>}

              {portal.requirements ? <CompletedMilestone title="Project Requirements" summary={`${portal.requirements.pages.length} pages · ${portal.requirements.features.length} features`}><RequirementsSection
                portalId={portal.id}
                clientId={client.id}
                requirements={portal.requirements}
                locked={requirementsLocked}
                questionnaireDefaults={questionnaireDefaults}
              /></CompletedMilestone> : <RequirementsSection portalId={portal.id} clientId={client.id} requirements={portal.requirements} locked={requirementsLocked} questionnaireDefaults={questionnaireDefaults}/>}

              {portal.buildSetup?.status === "CONFIRMED" ? <CompletedMilestone title="Build Setup" summary={`Confirmed ${portal.buildSetup.confirmedAt ? dateFormatter.format(portal.buildSetup.confirmedAt) : ""}`}><BuildSetupSection
                portalId={portal.id}
                clientId={client.id}
                setup={portal.buildSetup}
                locked={buildSetupLocked}
              /></CompletedMilestone> : <BuildSetupSection portalId={portal.id} clientId={client.id} setup={portal.buildSetup} locked={buildSetupLocked}/>}

              {portal.buildSetup?.websiteProvisioning?.status === "SUCCEEDED" ? <CompletedMilestone title="GitHub Repository" summary={`${portal.buildSetup.websiteProvisioning.targetOwner}/${portal.buildSetup.websiteProvisioning.targetRepositoryName}`}><WebsiteProvisioningSection
                portalId={portal.id}
                clientId={client.id}
                setup={portal.buildSetup}
                provisioning={portal.buildSetup?.websiteProvisioning ?? null}
              /></CompletedMilestone> : <WebsiteProvisioningSection portalId={portal.id} clientId={client.id} setup={portal.buildSetup} provisioning={portal.buildSetup?.websiteProvisioning ?? null}/>}

              {portal.buildSetup?.websiteProvisioning?.netlifyProvisioning?.status === "SUCCEEDED" ? <CompletedMilestone title="Netlify Deployment" summary={portal.buildSetup.websiteProvisioning.netlifyProvisioning.sslUrl ?? portal.buildSetup.websiteProvisioning.netlifyProvisioning.siteUrl ?? portal.buildSetup.websiteProvisioning.netlifyProvisioning.siteName}><NetlifyProvisioningSection
                portalId={portal.id}
                clientId={client.id}
                setup={portal.buildSetup}
                website={portal.buildSetup?.websiteProvisioning ?? null}
                provisioning={portal.buildSetup?.websiteProvisioning?.netlifyProvisioning ?? null}
              /></CompletedMilestone> : <NetlifyProvisioningSection portalId={portal.id} clientId={client.id} setup={portal.buildSetup} website={portal.buildSetup?.websiteProvisioning ?? null} provisioning={portal.buildSetup?.websiteProvisioning?.netlifyProvisioning ?? null}/>}
            </div>

            <div id="section-delivery">
              <DeliverySection
                portalId={portal.id}
                clientId={client.id}
                delivery={portal.delivery}
                reviewUrl={reviewUrl}
                workflowStage={client.workflowStage}
                locked={deliveryLocked}
                lockReason={deliveryLockReason}
              />
            </div>

            <div id="section-invoice">
              {latestInvoice?.status === "PAID" ? <CompletedMilestone title="Invoice" summary={`$${invoiceTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} · Paid${latestInvoice.paidAt ? ` ${dateFormatter.format(latestInvoice.paidAt)}` : ""}`}><InvoiceSection
                clientId={client.id}
                portalId={portal.id}
                invoice={latestInvoice}
                locked={invoiceLocked}
              /></CompletedMilestone> : <InvoiceSection clientId={client.id} portalId={portal.id} invoice={latestInvoice} locked={invoiceLocked}/>}
            </div>
            {handoffReadiness ? <LaunchHandoffSection key={handoffPacket?.id ?? "no-handoff-packet"} portalId={portal.id} clientId={client.id} workflowStage={client.workflowStage} readiness={handoffReadiness} latestPublishedTemplateRevision={latestPublishedHandoffRevision?.revision ?? null} draftTemplateRevision={latestDraftHandoffRevision} packet={handoffPacket ? { id: handoffPacket.id, version: handoffPacket.version, status: handoffPacket.status, recipientName: handoffPacket.recipientName, recipientEmail: handoffPacket.recipientEmail, draftData: handoffPacket.draftData, issuedAt: handoffPacket.issuedAt?.toISOString() ?? null, snapshotHash: handoffPacket.snapshotHash, tokenExpiresAt: handoffPacket.tokenExpiresAt?.toISOString() ?? null, firstSentAt:handoffPacket.firstSentAt?.toISOString()??null,lastSentAt:handoffPacket.lastSentAt?.toISOString()??null,firstViewedAt:handoffPacket.firstViewedAt?.toISOString()??null,lastViewedAt:handoffPacket.lastViewedAt?.toISOString()??null,viewCount:handoffPacket.viewCount,completedAt:handoffPacket.completedAt?.toISOString()??null, acceptance:handoffPacket.acceptance?{typedName:handoffPacket.acceptance.typedName,signerTitle:handoffPacket.acceptance.signerTitle,acceptedAt:handoffPacket.acceptance.acceptedAt.toISOString()}:null,emailAttempts:handoffPacket.emailAttempts.map(a=>({id:a.id,kind:a.kind,status:a.status,recipientEmail:a.recipientEmail,attemptedAt:a.attemptedAt.toISOString(),sentAt:a.sentAt?.toISOString()??null,errorMessage:a.errorMessage,providerMessageId:a.providerMessageId})), templateRevision: { revision: handoffPacket.templateRevision.revision, schemaVersion: handoffPacket.templateRevision.schemaVersion }, checklistItems: handoffPacket.checklistItems.map((item) => ({ id: item.id, key: item.key, label: item.label, category: item.category, required: item.required, status: item.status, note: item.note })), documents: handoffPacket.snapshot ? (handoffDocumentUnits(handoffPacket.snapshot) as {key:string;title:string;filename:string}[]).map(({key,title,filename})=>({key,title,filename})) : [] } : null} /> : null}
          </>
        ) : portalLocked ? (
          <div id="section-portal">
            <SectionLocked
              title="Template Portal"
              icon={Link2}
              reason="Available once the Design Questionnaire is submitted."
            />
          </div>
        ) : (
          <div id="section-portal">
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
