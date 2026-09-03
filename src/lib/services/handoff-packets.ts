import type { Prisma, PrismaClient } from "@prisma/client";
import { db } from "@/lib/db";
import { evaluateHandoffReadiness } from "./handoff-readiness-state.mjs";
import { workflowStageAfterHandoffBegins } from "./launch-handoff-readiness-state.mjs";
import { canSupersede, createPublicToken, hashSnapshot, nextPacketVersion, reusableDraft, sha256 } from "./handoff-packet-state.mjs";
import { assertDraftEditable, guidedHandoffCompletion, mergeHandoffDraft, normalizeHandoffDraft, resolveChecklistDefaults, validateChecklistSubmission, validateHandoffDraft, validateHandoffWizardStep } from "./handoff-draft";
import { advanceClientWorkflow } from "./client-workflow";
import { renderHandoffArchive } from "@/lib/handoff-archive";
import { renderHandoffDocumentPdf } from "@/lib/handoff-pdf";
import { sendHandoffEmail } from "@/lib/mail";
import { getAbsoluteUrl } from "@/lib/site-url";
import { validatePublicHandoff, type HandoffSnapshot } from "./public-handoff";
import { completionProblems } from "./handoff-packet-state.mjs";
import { assertRevision3IssuanceInvariant, carryForwardSelectedPolicyKeys, defaultHandoffPolicyKeys, normalizeSelectedPolicyKeysForSchema, selectedHandoffPolicyModules } from "./handoff-policy-modules.mjs";
import { buildHandoffProjectFacts, recommendedHandoffPolicyKeys } from "./handoff-project-facts.mjs";
import { personalizeHandoffModules } from "./handoff-document-content.mjs";
import { handoffDocumentUnits, isRevision3Agreement } from "./handoff-documents.mjs";
import { transientHandoffSendResult } from "./handoff-dry-run.mjs";
import { canonicalSnapshotSchemaVersion, snapshotSchemaVersionProblem, validateSnapshotShape } from "./handoff-snapshot-schema.mjs";
import { HANDOFF_REVISION_3_ACCEPTANCE_TEXT, HANDOFF_TEMPLATE_REVISION_3_MODULES } from "./handoff-template-content.mjs";

export type ReadinessCheck = { key: string; label: string; status: "PASS" | "WARNING" | "BLOCKED"; message: string; hint?: string };
export type HandoffReadiness = { checks: ReadinessCheck[]; blocked: boolean; warningCount: number };
type Db = PrismaClient | Prisma.TransactionClient;

export const DEFAULT_CHECKLIST = [
  ["final_live_url", "Final live URL confirmed", "Launch", true], ["domain_access", "Domain access confirmed", "Domain", true],
  ["domain_ownership", "Domain ownership confirmed", "Domain", true], ["github_access", "GitHub access confirmed", "Access", true],
  ["netlify_access", "Netlify access confirmed", "Access", true], ["analytics_access", "Analytics access addressed", "Access", false],
  ["forms_email_access", "Forms/email access addressed", "Access", false], ["third_party_services", "Third-party services documented", "Operations", true],
  ["backup_responsibility", "Backup responsibility confirmed", "Operations", true], ["security_responsibility", "Security responsibility confirmed", "Operations", true],
  ["client_care_selection", "Client care selection recorded", "Support", true],
] as const;

function date(value: Date | null | undefined) { return value?.toISOString().slice(0, 10) ?? null; }
function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function clean(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(clean);
  if (!isRecord(value)) return value;
  const result: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    if (/(password|passwd|secret|token|api.?key|transfer.?code|credential)/i.test(key)) throw new Error(`Secret-looking field is not allowed: ${key}`);
    result[key] = clean(child);
  }
  return result;
}
export async function getHandoffProject(portalId: string, clientId: string, database: Db = db) {
  const portal = await database.portal.findFirst({ where: { id: portalId, clientId }, include: {
    client: true, buildSetup: { include: { websiteProvisioning: { include: { netlifyProvisioning: true } } } },
    requirements: true, delivery: true, invoices: { include: { lineItems: true } }, clientCareEnrollment: true,
    handoffPackets: { include: { checklistItems: { orderBy: { displayOrder: "asc" } }, templateRevision: { include: { template: true } }, acceptance: true }, orderBy: { version: "desc" } },
  }});
  if (!portal) throw new Error("Client project not found.");
  return portal;
}

export async function getHandoffReadiness(portalId: string, clientId: string, database: Db = db): Promise<HandoffReadiness> {
  const [portal, published] = await Promise.all([
    getHandoffProject(portalId, clientId, database),
    database.handoffTemplateRevision.findFirst({ where: { status: "PUBLISHED", template: { isDefault: true } } }),
  ]);
  const active = portal.handoffPackets.find((packet) => packet.status !== "SUPERSEDED" && packet.status !== "REVOKED");
  const domain = isRecord(active?.draftData) && isRecord(active.draftData.domain) ? active.draftData.domain : {};
  const launch = isRecord(active?.draftData) && isRecord(active.draftData.websiteLaunch) ? active.draftData.websiteLaunch : {};
  const maintenance = isRecord(active?.draftData) && isRecord(active.draftData.maintenanceSupport) ? active.draftData.maintenanceSupport : {};
  return evaluateHandoffReadiness({
    buildSetupConfirmed: portal.buildSetup?.status === "CONFIRMED", websiteProvisioningSucceeded: portal.buildSetup?.websiteProvisioning?.status === "SUCCEEDED",
    netlifyProvisioningSucceeded: portal.buildSetup?.websiteProvisioning?.netlifyProvisioning?.status === "SUCCEEDED", deliveryExists: Boolean(portal.delivery),
    deliveryReviewApproved: portal.delivery?.reviewStatus === "APPROVED", invoiceCount: portal.invoices.length,
    unpaidInvoiceCount: portal.invoices.filter((invoice) => invoice.status !== "PAID").length, recipientEmail: portal.client.email,
    publishedTemplateExists: Boolean(published), liveUrl: portal.delivery?.liveUrl ?? (typeof launch.liveUrl === "string" ? launch.liveUrl : null),
    domainDetailsComplete: Boolean(domain.registrar && domain.owner && domain.dnsManager), clientCareSelected: Boolean(portal.clientCareEnrollment || maintenance.clientCareDisposition),
    requiredChecklistPending: active?.checklistItems.filter((item) => item.required && item.status === "PENDING").length ?? 0,
  }) as HandoffReadiness;
}

export function buildCurrentHandoffDraft(portal: Awaited<ReturnType<typeof getHandoffProject>>): Prisma.InputJsonObject {
  const setup = portal.buildSetup, website = setup?.websiteProvisioning, netlify = website?.netlifyProvisioning, delivery = portal.delivery, care = portal.clientCareEnrollment;
  const paidAt = portal.invoices.filter((i) => i.status === "PAID").map((i) => i.paidAt).filter(Boolean).sort((a, b) => b!.getTime() - a!.getTime())[0];
  const invoiceAmount = portal.invoices.reduce((total, invoice) => total + invoice.lineItems.reduce((sum, item) => sum + Number(item.amount), 0) + Number(invoice.taxAmount), 0);
  const services = [
    website?.repositoryUrl ? { service: "GitHub", purpose: "Source repository", accountOwner: website.targetOwner, billingOwner: "", dataHandled: "Project source code" } : null,
    netlify?.siteName ? { service: "Netlify", purpose: "Production website deployment and hosting", accountOwner: netlify.accountSlug, billingOwner: "", dataHandled: "Website deployment files and operational logs" } : null,
  ].filter(Boolean);
  const base = {
    selectedPolicyKeys: defaultHandoffPolicyKeys(), adminNote: "",
    projectSummary: { clientBusinessName: portal.client.businessName, clientName: portal.client.contactName, clientEmail: portal.client.email, projectName: setup?.projectName ?? portal.client.businessName, projectType: portal.client.industry ? `${portal.client.industry} website` : "Website", templateName: setup?.templateNameSnapshot ?? "", planName: setup?.planNameSnapshot ?? "", scope: setup?.notes ?? "", approvedDate: date(delivery?.reviewedAt), paymentCompletionDate: date(paidAt), completionDate: date(delivery?.deliveredAt), invoiceAmount: invoiceAmount ? invoiceAmount.toFixed(2) : "" },
    websiteLaunch: { stagingUrl: delivery?.stagingUrl ?? null, liveUrl: delivery?.liveUrl ?? null, launchDate: null, status: delivery?.liveUrl ? "LIVE_URL_RECORDED" : "PENDING_LAUNCH" },
    domain: { primaryDomain: setup?.primaryDomain ?? null, registrar: "", owner: "", renewalResponsibility: "", dnsManager: "", transferAccessStatus: "" },
    hosting: { provider: netlify ? "Netlify" : "", siteName: netlify?.siteName ?? null, publicUrl: netlify?.sslUrl ?? netlify?.siteUrl ?? null, owner: netlify?.accountSlug ?? "", billingResponsibility: "" },
    sourceCode: { repositoryUrl: website?.repositoryUrl ?? null, repositoryName: website?.targetRepositoryName ?? setup?.repositoryName ?? "", owner: website?.targetOwner ?? setup?.repositoryOwner ?? "", visibility: website?.actualVisibility ?? setup?.repositoryVisibility ?? null, defaultBranch: website?.defaultBranch ?? null, clientAccessStatus: "" },
    projectRequirements: { pages: portal.requirements?.pages ?? setup?.pages ?? [], features: portal.requirements?.features ?? setup?.features ?? [], contentStatus: portal.requirements?.contentStatus ?? setup?.contentStatus ?? "" },
    completedDeliverables: [...(Array.isArray(setup?.planFeaturesSnapshot) ? setup.planFeaturesSnapshot : [])],
    ownershipResponsibilities: { clientOwns: "", webDashyRetainsManages: "", notes: "" }, thirdPartyServices: services,
    maintenanceSupport: { clientCareDisposition: care?.disposition ?? "", planName: care?.planNameSnapshot ?? "", supportEmail: care?.supportEmail ?? "", responseExpectation: care?.responseExpectation ?? "", notes: "" },
    warranty: { startDate: date(care?.warrantyStartsAt), endDate: date(care?.warrantyEndsAt), notes: care?.notes ?? "" },
    operationalResponsibilities: { backups: "", security: "", updatesMonitoring: "", offboardingNotes: "" },
    privacyDataCompliance: { formsDataCollected: "", analyticsCookies: "", privacyPolicyResponsibility: "", accessibilityResponsibility: "", complianceNotes: "", operationalFacts: "", acknowledgmentNotes: "" },
  };
  const facts = buildHandoffProjectFacts(base);
  base.selectedPolicyKeys = recommendedHandoffPolicyKeys(facts);
  return clean(base) as Prisma.InputJsonObject;
}

async function audit(database: Db, actorUserId: string, eventType: string, values: { clientId: string; portalId?: string; packetId?: string; metadata?: Prisma.InputJsonValue }) {
  await database.projectAuditEvent.create({ data: { ...values, actorType: "ADMIN", actorUserId, eventType } });
}

async function applySmartChecklistDefaults(database: Db, packetId: string, draftData: unknown, liveUrl: string | null | undefined, actorUserId: string, trusted: { websiteProvisioningSucceeded?: boolean; netlifyProvisioningSucceeded?: boolean } = {}) {
  const draft = normalizeHandoffDraft(draftData);
  const items = await database.handoffChecklistItem.findMany({ where: { packetId } });
  const resolved = resolveChecklistDefaults(items, {
    liveUrl,
    thirdPartyServices: draft.thirdPartyServices,
    analyticsCookies: draft.privacyDataCompliance.analyticsCookies,
    clientCareDisposition: draft.maintenanceSupport.clientCareDisposition,
    ...trusted,
  });
  for (const item of resolved) {
    const original = items.find((candidate) => candidate.id === item.id);
    if (!original || original.status === item.status) continue;
    await database.handoffChecklistItem.updateMany({ where: { id: item.id, packetId, status: "PENDING" }, data: { status: item.status, completedAt: item.status === "COMPLETED" ? new Date() : null, completedByUserId: item.status === "COMPLETED" ? actorUserId : null } });
  }
}

function assertHandoffCanBegin(portal: Awaited<ReturnType<typeof getHandoffProject>>) {
  if (portal.delivery?.reviewStatus !== "APPROVED" || portal.invoices.length === 0 || portal.invoices.some((invoice) => invoice.status !== "PAID")) throw new Error("Client approval and payment are required before beginning Launch & Handoff.");
}

async function advanceHandoffWorkflow(database: Db, portal: Awaited<ReturnType<typeof getHandoffProject>>) {
  const facts = { reviewApproved: portal.delivery?.reviewStatus === "APPROVED", invoiceCount: portal.invoices.length, unpaidInvoiceCount: portal.invoices.filter((invoice) => invoice.status !== "PAID").length };
  const nextStage = workflowStageAfterHandoffBegins(portal.client.workflowStage, facts);
  if (nextStage === "LAUNCH_AND_HANDOFF" && portal.client.workflowStage === "PAYMENT_RECEIVED") await advanceClientWorkflow(portal.clientId, "LAUNCH_AND_HANDOFF", database);
}

export async function beginLaunchHandoff(portalId: string, clientId: string, actorUserId: string) {
  return db.$transaction(async (tx) => {
    const portal = await getHandoffProject(portalId, clientId, tx); assertHandoffCanBegin(portal);
    const packet = portal.handoffPackets.find((candidate) => candidate.status === "DRAFT" && !candidate.supersededById);
    if (!packet) throw new Error("Generate a handoff packet draft before beginning handoff.");
    await applySmartChecklistDefaults(tx, packet.id, packet.draftData, portal.delivery?.liveUrl, actorUserId, {
      websiteProvisioningSucceeded: portal.buildSetup?.websiteProvisioning?.status === "SUCCEEDED",
      netlifyProvisioningSucceeded: portal.buildSetup?.websiteProvisioning?.netlifyProvisioning?.status === "SUCCEEDED",
    });
    await advanceHandoffWorkflow(tx, portal);
    return packet;
  });
}

export async function publishHandoffRevision(revisionId: string, actorUserId: string) {
  return db.$transaction(async (tx) => {
    const revision = await tx.handoffTemplateRevision.findUnique({ where: { id: revisionId } });
    if (!revision) throw new Error("Template revision not found.");
    if (revision.status === "PUBLISHED") return revision;
    if (revision.status !== "DRAFT") throw new Error("Only a draft revision can be published.");
    await tx.handoffTemplateRevision.updateMany({ where: { templateId: revision.templateId, status: "PUBLISHED" }, data: { status: "RETIRED" } });
    const published = await tx.handoffTemplateRevision.update({ where: { id: revision.id }, data: { status: "PUBLISHED", publishedAt: new Date(), publishedByUserId: actorUserId, contentHash: sha256(JSON.stringify({ sections: revision.sections, acceptanceText: revision.acceptanceText })) } });
    const template = await tx.handoffTemplate.findUniqueOrThrow({ where: { id: revision.templateId } });
    const auditClient = await tx.client.findFirst({ select: { id: true } });
    if (auditClient) await audit(tx, actorUserId, "HANDOFF_TEMPLATE_PUBLISHED", { clientId: auditClient.id, metadata: { templateId: template.id, revision: revision.revision } });
    return published;
  });
}

export async function generateHandoffPacket(portalId: string, clientId: string, actorUserId: string) {
  const readiness = await getHandoffReadiness(portalId, clientId); if (readiness.blocked) throw new Error("Resolve all blocked readiness checks before generating a packet.");
  return db.$transaction(async (tx) => {
    const portal = await getHandoffProject(portalId, clientId, tx); const reuse = reusableDraft(portal.handoffPackets);
    if (reuse) {
      await tx.handoffChecklistItem.createMany({ data: DEFAULT_CHECKLIST.map(([key, label, category, required], displayOrder) => ({ packetId: reuse.id, key, label, category, required, displayOrder })), skipDuplicates: true });
      await applySmartChecklistDefaults(tx, reuse.id, reuse.draftData, portal.delivery?.liveUrl, actorUserId, {
        websiteProvisioningSucceeded: portal.buildSetup?.websiteProvisioning?.status === "SUCCEEDED",
        netlifyProvisioningSucceeded: portal.buildSetup?.websiteProvisioning?.netlifyProvisioning?.status === "SUCCEEDED",
      });
      await advanceHandoffWorkflow(tx, portal);
      return reuse;
    }
    if (portal.handoffPackets.some((packet) => packet.status !== "SUPERSEDED" && packet.status !== "REVOKED")) {
      throw new Error("This portal already has an active issued packet. Create a corrected version instead.");
    }
    const revision = await tx.handoffTemplateRevision.findFirst({ where: { status: "PUBLISHED", template: { isDefault: true } }, orderBy: { revision: "desc" } });
    if (!revision) throw new Error("No published default handoff template exists.");
    const currentDraft = buildCurrentHandoffDraft(portal);
    const initialDraft = { ...currentDraft, selectedPolicyKeys: normalizeSelectedPolicyKeysForSchema(revision.schemaVersion, currentDraft.selectedPolicyKeys) };
    const packet = await tx.handoffPacket.create({ data: { portalId, clientId, templateRevisionId: revision.id, version: nextPacketVersion(portal.handoffPackets), recipientName: portal.client.contactName, recipientEmail: portal.client.email, draftData: initialDraft } });
    await tx.handoffChecklistItem.createMany({ data: DEFAULT_CHECKLIST.map(([key, label, category, required], displayOrder) => ({ packetId: packet.id, key, label, category, required, displayOrder })), skipDuplicates: true });
    await applySmartChecklistDefaults(tx, packet.id, packet.draftData, portal.delivery?.liveUrl, actorUserId, {
      websiteProvisioningSucceeded: portal.buildSetup?.websiteProvisioning?.status === "SUCCEEDED",
      netlifyProvisioningSucceeded: portal.buildSetup?.websiteProvisioning?.netlifyProvisioning?.status === "SUCCEEDED",
    });
    await advanceHandoffWorkflow(tx, portal);
    await audit(tx, actorUserId, "HANDOFF_PACKET_GENERATED", { clientId, portalId, packetId: packet.id, metadata: { version: packet.version, templateRevisionId: revision.id } });
    return packet;
  });
}

export async function saveHandoffDraft(packetId: string, portalId: string, clientId: string, actorUserId: string, input: { step: number; edits: unknown; checklist?: unknown }) {
  return db.$transaction(async (tx) => {
    const packet = await tx.handoffPacket.findFirst({ where: { id: packetId, portalId, clientId }, include: { checklistItems: true, templateRevision: { select: { schemaVersion: true } }, portal: { include: { buildSetup: { include: { websiteProvisioning: { include: { netlifyProvisioning: true } } } } } } } });
    if (!packet) throw new Error("Packet not found for this project."); assertDraftEditable(packet.status);
    const merged = normalizeHandoffDraft(mergeHandoffDraft(packet.draftData, input.edits));
    merged.selectedPolicyKeys = normalizeSelectedPolicyKeysForSchema(packet.templateRevision.schemaVersion, merged.selectedPolicyKeys);
    validateHandoffWizardStep(merged, input.step);
    const safe = clean(merged) as Prisma.InputJsonObject;
    await tx.handoffPacket.update({ where: { id: packet.id }, data: { draftData: safe } });
    if (input.step === 2) {
      const owned = new Set(packet.checklistItems.map((item) => item.id));
      const checklist = validateChecklistSubmission(input.checklist, owned) as { id: string; status: string; note: string }[];
      for (const item of checklist) { await tx.handoffChecklistItem.update({ where: { id: item.id }, data: { status: item.status as "PENDING", note: item.note.trim() || null, completedAt: item.status === "COMPLETED" ? new Date() : null, completedByUserId: item.status === "COMPLETED" ? actorUserId : null } }); }
    }
    await applySmartChecklistDefaults(tx, packet.id, merged, merged.websiteLaunch.liveUrl, actorUserId, {
      websiteProvisioningSucceeded: packet.portal.buildSetup?.websiteProvisioning?.status === "SUCCEEDED",
      netlifyProvisioningSucceeded: packet.portal.buildSetup?.websiteProvisioning?.netlifyProvisioning?.status === "SUCCEEDED",
    });
    await audit(tx, actorUserId, "HANDOFF_PACKET_DRAFT_SAVED", { clientId, portalId, packetId: packet.id, metadata: { version: packet.version } });
    const persistedChecklist = await tx.handoffChecklistItem.findMany({ where: { packetId: packet.id } });
    return guidedHandoffCompletion(merged, persistedChecklist) as boolean[];
  });
}

export async function issueHandoffPacket(packetId: string, portalId: string, clientId: string, actorUserId: string) {
  const readiness = await getHandoffReadiness(portalId, clientId); if (readiness.blocked) throw new Error("Resolve all blocked readiness checks before issuing.");
  return db.$transaction(async (tx) => {
    const packet = await tx.handoffPacket.findFirst({ where: { id: packetId, portalId, clientId }, include: { checklistItems: { orderBy: { displayOrder: "asc" } }, templateRevision: { include: { template: true } } } });
    if (!packet) throw new Error("Packet not found for this project."); if (packet.status !== "DRAFT") throw new Error("Only a draft packet can be issued."); if (packet.templateRevision.status !== "PUBLISHED") throw new Error("The packet's exact template revision is no longer published.");
    const draft = validateHandoffDraft(normalizeHandoffDraft(packet.draftData));
    draft.selectedPolicyKeys = normalizeSelectedPolicyKeysForSchema(packet.templateRevision.schemaVersion, draft.selectedPolicyKeys);
    const safeDraft = clean(draft) as Prisma.InputJsonObject;
    const authoritativeSections = packet.templateRevision.schemaVersion >= 3 ? HANDOFF_TEMPLATE_REVISION_3_MODULES : packet.templateRevision.sections;
    const selectedModules = selectedHandoffPolicyModules(authoritativeSections, draft.selectedPolicyKeys);
    const issuedAt = new Date();
    const handoffFacts = buildHandoffProjectFacts(safeDraft, { issuedAt: issuedAt.toISOString() });
    const policyModules = packet.templateRevision.schemaVersion >= 3 ? personalizeHandoffModules(selectedModules, handoffFacts, { reference: packet.id, version: packet.version }) : selectedModules;
    if (!policyModules.length) throw new Error("Select at least one packet document.");
    const clientBusinessName = draft.projectSummary.clientBusinessName || packet.recipientName;
    const acceptanceText = packet.templateRevision.schemaVersion >= 3 ? HANDOFF_REVISION_3_ACCEPTANCE_TEXT.replace("[Client Business Name]", clientBusinessName) : packet.templateRevision.acceptanceText;
    // Template schemaVersion selects the snapshot format; template revision is independent metadata.
    const snapshotSchemaVersion = canonicalSnapshotSchemaVersion(packet.templateRevision.schemaVersion);
    const snapshot = { snapshotSchemaVersion, issuedAt: issuedAt.toISOString(), packet: { id: packet.id, version: packet.version }, recipient: { name: packet.recipientName, email: packet.recipientEmail }, template: { id: packet.templateRevision.template.id, slug: packet.templateRevision.template.slug, revisionId: packet.templateRevision.id, revision: packet.templateRevision.revision, schemaVersion: packet.templateRevision.schemaVersion }, sections: policyModules, policyModules, acceptanceText, handoffFacts, draftData: safeDraft };

    // Normalize through JSON serialization before validation, hashing, and
    // persistence so the exact bytes represented by the stored JSON are the
    // same logical value whose integrity hash we record.
    const persistedSnapshot = JSON.parse(JSON.stringify(snapshot)) as typeof snapshot;

    assertRevision3IssuanceInvariant(packet.templateRevision.schemaVersion, draft.selectedPolicyKeys, persistedSnapshot.sections, persistedSnapshot.policyModules);
    if (snapshotSchemaVersionProblem(snapshotSchemaVersion, persistedSnapshot)) throw new Error("Snapshot schema version invariant failed.");
    const snapshotValidation = validateSnapshotShape(persistedSnapshot);
    if (!snapshotValidation.valid) throw new Error(`Snapshot schema invariant failed at ${snapshotValidation.schemaPath}: ${snapshotValidation.schemaIssue}.`);

    const snapshotHash = hashSnapshot(persistedSnapshot), tokenExpiresAt = new Date(issuedAt.getTime() + 60 * 86400000);
    const issuedPacket = await tx.handoffPacket.update({ where: { id: packet.id }, data: { status: "ISSUED", snapshot: persistedSnapshot, snapshotSchemaVersion, snapshotHash, publicTokenHash: null, tokenPreview: null, tokenExpiresAt, issuedAt } });

    if (snapshotSchemaVersionProblem(issuedPacket.snapshotSchemaVersion, issuedPacket.snapshot)) throw new Error("Persisted snapshot schema version invariant failed.");
    const persistedValidation = validateSnapshotShape(issuedPacket.snapshot);
    if (!persistedValidation.valid) throw new Error(`Persisted snapshot schema invariant failed at ${persistedValidation.schemaPath}: ${persistedValidation.schemaIssue}.`);
    if (hashSnapshot(issuedPacket.snapshot) !== snapshotHash) throw new Error("Persisted snapshot hash invariant failed.");
    await audit(tx, actorUserId, "HANDOFF_PACKET_ISSUED", { clientId, portalId, packetId: packet.id, metadata: { version: packet.version, snapshotHash, tokenExpiresAt: tokenExpiresAt.toISOString() } });
    return issuedPacket;
  });
}

export async function sendHandoffPacket(packetId:string, portalId:string, clientId:string, actorUserId:string, idempotencyKey:string) {
  if(!/^[A-Za-z0-9_-]{16,100}$/.test(idempotencyKey)) throw new Error("Invalid send request. Refresh and try again.");
  const packet=await db.handoffPacket.findFirst({where:{id:packetId,portalId,clientId},include:{acceptance:true,client:true}});
  if(!packet?.snapshot||!packet.snapshotHash||!["ISSUED","SENT","VIEWED"].includes(packet.status)||packet.acceptance) throw new Error("This packet cannot be sent.");
  const prior=await db.handoffEmailAttempt.findUnique({where:{idempotencyKey}}); if(prior) return {attempt:prior};
  const token=createPublicToken(), attemptedAt=new Date(), kind=packet.firstSentAt?"RESEND":"INITIAL";
  const attempt=await db.$transaction(async tx=>{
    const created=await tx.handoffEmailAttempt.create({data:{packetId:packet.id,recipientEmail:packet.recipientEmail,status:"SENDING",kind,idempotencyKey,attemptedAt,snapshotHash:packet.snapshotHash}});
    const rotated=await tx.handoffPacket.updateMany({where:{id:packet.id,publicTokenHash:packet.publicTokenHash,status:{in:["ISSUED","SENT","VIEWED"]},acceptance:null},data:{publicTokenHash:token.tokenHash,tokenPreview:token.tokenPreview,tokenRevokedAt:null,tokenExpiresAt:new Date(attemptedAt.getTime()+60*86400000)}});
    if(rotated.count!==1)throw new Error("The secure link changed during this send. Retry to generate the current link.");
    return created;
  });
  // Rotation and attempt creation commit together. Only the hash and short preview are durable;
  // the one raw token created above remains in memory for this delivery response only.
  const url=await getAbsoluteUrl(`/h/${token.rawToken}`), snapshot=packet.snapshot as unknown as HandoffSnapshot;
  const revision3Agreement=isRevision3Agreement(snapshot);
  const units=handoffDocumentUnits(snapshot) as {key:string;filename:string;legacy:boolean;module?:import("./public-handoff").HandoffPolicyModule}[];
  const agreement=units.length===1&&units[0].key==="client_agreement"&&units[0].module?units[0]:null;
  const project=snapshot.draftData.projectSummary as Record<string,unknown>|undefined;
  const attachment=agreement
    ? {pdfBuffer:await renderHandoffDocumentPdf(snapshot,agreement.module!,packet.snapshotHash),pdfFilename:agreement.filename,projectName:String(project?.projectName||packet.client.businessName)}
    : await renderHandoffArchive(snapshot,packet.snapshotHash).then(archive=>({zipBuffer:archive.buffer,zipFilename:archive.filename}));
  let delivery:{messageId:string|null};
  try { delivery=await sendHandoffEmail({to:packet.recipientEmail,contactName:packet.recipientName,handoffUrl:url,...attachment}); }
  catch { await db.handoffEmailAttempt.update({where:{id:attempt.id},data:{status:"FAILED",errorCode:"SMTP_SEND_FAILED",errorMessage:"The email provider did not confirm delivery."}}); throw new Error("The email could not be sent. You can retry safely."); }
  try {
    const savedAttempt=await db.$transaction(async tx=>{
      const now=new Date();
      const current=await tx.handoffPacket.findUniqueOrThrow({where:{id:packet.id}});
      if(current.publicTokenHash!==sha256(token.rawToken))throw new Error("The active secure link changed during delivery.");
      const saved=await tx.handoffEmailAttempt.update({where:{id:attempt.id},data:{status:"SENT",providerMessageId:delivery.messageId,sentAt:now}});
      const finalized=await tx.handoffPacket.updateMany({where:{id:packet.id,publicTokenHash:token.tokenHash},data:{status:current.status==="ISSUED"?"SENT":current.status,firstSentAt:current.firstSentAt??now,lastSentAt:now}});
      if(finalized.count!==1)throw new Error("The active secure link changed during delivery.");
      const client=await tx.client.findUniqueOrThrow({where:{id:clientId},select:{workflowStage:true}});
      if(client.workflowStage==="PAYMENT_RECEIVED")await advanceClientWorkflow(clientId,"LAUNCH_AND_HANDOFF",tx);
      await audit(tx,actorUserId,"HANDOFF_PACKET_SENT",{clientId,portalId,packetId:packet.id,metadata:{kind,attemptId:attempt.id}});
      return saved;
    });
    if(revision3Agreement&&delivery.messageId==="dry-run"){
      const publicValidation=await validatePublicHandoff(token.rawToken);
      if(!publicValidation.result)throw new Error(`The secure client link failed validation (${publicValidation.reason}).`);
      return transientHandoffSendResult(savedAttempt,url);
    }
    return {attempt:savedAttempt};
  }
  catch { await db.handoffEmailAttempt.updateMany({where:{id:attempt.id,status:"SENDING"},data:{status:"DELIVERY_UNKNOWN",errorCode:"STATE_SAVE_FAILED",errorMessage:"Delivery may have succeeded; verify before retrying."}}); throw new Error("Delivery may have succeeded, but its final state could not be saved. Verify before retrying."); }
}

export async function saveFinalLiveUrl(packetId:string,portalId:string,clientId:string,actorUserId:string,rawUrl:string) {
  const normalizeLiveUrl = (value: string) => {
    const url = new URL(value.trim());
    if (url.protocol !== "https:") throw new Error();
    url.hash = "";
    return url.toString();
  };

  let liveUrl:string;
  try { liveUrl = normalizeLiveUrl(rawUrl); }
  catch { throw new Error("Enter an absolute HTTPS URL."); }

  await db.$transaction(async tx=>{
    const packet=await tx.handoffPacket.findFirst({where:{id:packetId,portalId,clientId},include:{checklistItems:true}});
    if(!packet) throw new Error("Packet not found for this project.");

    const current=await tx.delivery.findUnique({where:{portalId}});

    if(packet.status!=="DRAFT") {
      const snapshot = packet.snapshot as unknown as HandoffSnapshot | null;
      const frozenLaunch = snapshot?.draftData?.websiteLaunch as Record<string, unknown> | undefined;
      const frozenLiveUrl = frozenLaunch?.liveUrl;

      let normalizedFrozenLiveUrl = "";
      try {
        normalizedFrozenLiveUrl = typeof frozenLiveUrl === "string" && frozenLiveUrl
          ? normalizeLiveUrl(frozenLiveUrl)
          : "";
      } catch {
        throw new Error("The issued agreement does not contain a valid final live URL.");
      }

      if(!normalizedFrozenLiveUrl || normalizedFrozenLiveUrl !== liveUrl)
        throw new Error("The live URL changed after issue. Create a corrected packet version.");

      if(current?.liveUrl) {
        let normalizedCurrentLiveUrl = "";
        try { normalizedCurrentLiveUrl = normalizeLiveUrl(current.liveUrl); }
        catch { throw new Error("The recorded delivery URL is invalid."); }

        if(normalizedCurrentLiveUrl !== liveUrl)
          throw new Error("The live URL changed after issue. Create a corrected packet version.");
      }
    }

    await tx.delivery.update({where:{portalId},data:{liveUrl}});

    if(packet.status==="DRAFT") {
      const draft=normalizeHandoffDraft(packet.draftData);
      draft.websiteLaunch.liveUrl=liveUrl;
      draft.websiteLaunch.status="LIVE_URL_RECORDED";
      await tx.handoffPacket.update({where:{id:packet.id},data:{draftData:draft as unknown as Prisma.InputJsonObject}});
      await applySmartChecklistDefaults(tx,packet.id,draft,liveUrl,actorUserId);
    }
  });
}

export async function completeHandoff(packetId:string,portalId:string,clientId:string,actorUserId:string) {
  return db.$transaction(async tx=>{ const packet=await tx.handoffPacket.findFirst({where:{id:packetId,portalId,clientId},include:{acceptance:true,checklistItems:true,portal:{include:{delivery:true}},client:true}}); if(!packet||packet.supersededById||packet.tokenRevokedAt) throw new Error("The active packet is unavailable."); const snapshot=packet.snapshot as unknown as HandoffSnapshot|null; const care=(snapshot?.draftData.maintenanceSupport??{}) as Record<string,unknown>; const disposition=typeof care.clientCareDisposition==="string"?care.clientCareDisposition:""; const problems=completionProblems({status:packet.status,hasAcceptance:Boolean(packet.acceptance),hasLiveUrl:Boolean(packet.portal.delivery?.liveUrl),checklist:packet.checklistItems,careDisposition:disposition}); if(problems.length) throw new Error(problems.join(" "));
    const allowed=["ENROLLED","DECLINED","INCLUDED","NOT_APPLICABLE"] as const; if(!allowed.includes(disposition as typeof allowed[number])) throw new Error("Select a valid Client Care disposition."); const warranty=(snapshot!.draftData.warranty??{}) as Record<string,unknown>; const parse=(v:unknown)=>typeof v==="string"&&v?new Date(`${v}T00:00:00.000Z`):null; const now=new Date(); await tx.clientCareEnrollment.upsert({where:{portalId},create:{portalId,clientId,disposition:disposition as typeof allowed[number],planNameSnapshot:String(care.planName||"")||null,supportEmail:String(care.supportEmail||"")||null,responseExpectation:String(care.responseExpectation||"")||null,warrantyStartsAt:parse(warranty.startDate),warrantyEndsAt:parse(warranty.endDate),confirmedAt:now,confirmedByUserId:actorUserId},update:{disposition:disposition as typeof allowed[number],confirmedAt:now,confirmedByUserId:actorUserId}}); await tx.handoffPacket.update({where:{id:packet.id},data:{status:"COMPLETED",completedAt:now,completedByUserId:actorUserId}}); await tx.client.update({where:{id:clientId},data:{status:"WON"}}); await advanceClientWorkflow(clientId,"CLIENT_CARE",tx); await audit(tx,actorUserId,"HANDOFF_COMPLETED",{clientId,portalId,packetId:packet.id,metadata:{completedAt:now.toISOString(),disposition}}); return packet; });
}

export async function supersedeHandoffPacket(packetId: string, portalId: string, clientId: string, actorUserId: string) {
  return db.$transaction(async (tx) => {
    const portal = await getHandoffProject(portalId, clientId, tx); const old = portal.handoffPackets.find((packet) => packet.id === packetId);
    if (!old) throw new Error("Packet not found for this project."); if (old.status === "ACCEPTED" || old.acceptance) throw new Error("An accepted packet cannot be silently corrected."); if (!canSupersede(old.status)) throw new Error("This packet cannot be corrected.");
    const correctedDraft = normalizeHandoffDraft(old.draftData);
    correctedDraft.selectedPolicyKeys = normalizeSelectedPolicyKeysForSchema(old.templateRevision.schemaVersion, correctedDraft.selectedPolicyKeys);
    const next = await tx.handoffPacket.create({ data: { portalId, clientId, templateRevisionId: old.templateRevisionId, version: nextPacketVersion(portal.handoffPackets), recipientName: old.recipientName, recipientEmail: old.recipientEmail, draftData: clean(correctedDraft) as Prisma.InputJsonObject } });
    await tx.handoffChecklistItem.createMany({ data: old.checklistItems.map(({ key,label,category,required,status,note,displayOrder }) => ({ packetId: next.id,key,label,category,required,status,note,displayOrder })), skipDuplicates: true });
    await tx.handoffPacket.update({ where: { id: old.id }, data: { status: "SUPERSEDED", supersededById: next.id, tokenRevokedAt: new Date(), publicTokenHash: null } });
    await audit(tx, actorUserId, "HANDOFF_PACKET_SUPERSEDED", { clientId, portalId, packetId: old.id, metadata: { supersededByPacketId: next.id, oldVersion: old.version, newVersion: next.version } }); return next;
  });
}

export async function supersedeHandoffPacketFromLatestTemplate(packetId: string, portalId: string, clientId: string, actorUserId: string) {
  return db.$transaction(async (tx) => {
    const portal = await getHandoffProject(portalId, clientId, tx);
    const old = portal.handoffPackets.find((packet) => packet.id === packetId);
    if (!old) throw new Error("Packet not found for this project.");
    if (old.status === "ACCEPTED" || old.acceptance) throw new Error("An accepted packet cannot be silently replaced.");
    if (!canSupersede(old.status)) throw new Error("This packet cannot be versioned.");
    const revision = await tx.handoffTemplateRevision.findFirst({ where: { status: "PUBLISHED", template: { isDefault: true } }, orderBy: { revision: "desc" } });
    if (!revision) throw new Error("No published default handoff template exists.");
    if (revision.id === old.templateRevisionId) throw new Error("This packet already uses the latest published template revision.");

    const oldDraft = normalizeHandoffDraft(old.draftData);
    const current = normalizeHandoffDraft(buildCurrentHandoffDraft(portal));
    const authoritativeSections = revision.schemaVersion >= 3 ? HANDOFF_TEMPLATE_REVISION_3_MODULES : revision.sections;
    const selectedPolicyKeys = revision.schemaVersion >= 3 ? normalizeSelectedPolicyKeysForSchema(revision.schemaVersion, oldDraft.selectedPolicyKeys) : carryForwardSelectedPolicyKeys(authoritativeSections, oldDraft.selectedPolicyKeys);
    const requiredKeys = (Array.isArray(authoritativeSections) ? authoritativeSections : []).filter((item):item is Prisma.JsonObject => Boolean(item && typeof item === "object" && !Array.isArray(item) && item.required === true)).map((item)=>String(item.key ?? ""));
    if (requiredKeys.some((key)=>!selectedPolicyKeys.includes(key))) throw new Error("The latest published template is missing a required agreement document.");
    const draft = {
      ...oldDraft,
      selectedPolicyKeys,
      projectSummary: { ...oldDraft.projectSummary, ...current.projectSummary },
      websiteLaunch: { ...oldDraft.websiteLaunch, stagingUrl: current.websiteLaunch.stagingUrl, liveUrl: current.websiteLaunch.liveUrl, status: current.websiteLaunch.status },
      domain: { ...oldDraft.domain, primaryDomain: current.domain.primaryDomain },
      hosting: { ...oldDraft.hosting, siteName: current.hosting.siteName, publicUrl: current.hosting.publicUrl },
      sourceCode: { ...oldDraft.sourceCode, repositoryUrl: current.sourceCode.repositoryUrl, owner: current.sourceCode.owner, visibility: current.sourceCode.visibility, defaultBranch: current.sourceCode.defaultBranch },
    };
    const next = await tx.handoffPacket.create({ data: { portalId, clientId, templateRevisionId: revision.id, version: nextPacketVersion(portal.handoffPackets), recipientName: portal.client.contactName, recipientEmail: portal.client.email, draftData: clean(draft) as Prisma.InputJsonObject } });
    await tx.handoffChecklistItem.createMany({ data: old.checklistItems.map(({ key,label,category,required,status,note,displayOrder }) => ({ packetId: next.id,key,label,category,required,status,note,displayOrder })), skipDuplicates: true });
    await applySmartChecklistDefaults(tx, next.id, draft, portal.delivery?.liveUrl, actorUserId, {
      websiteProvisioningSucceeded: portal.buildSetup?.websiteProvisioning?.status === "SUCCEEDED",
      netlifyProvisioningSucceeded: portal.buildSetup?.websiteProvisioning?.netlifyProvisioning?.status === "SUCCEEDED",
    });
    await tx.handoffPacket.update({ where: { id: old.id }, data: { status: "SUPERSEDED", supersededById: next.id, tokenRevokedAt: new Date(), publicTokenHash: null } });
    await audit(tx, actorUserId, "HANDOFF_PACKET_SUPERSEDED", { clientId, portalId, packetId: old.id, metadata: { supersededByPacketId: next.id, oldVersion: old.version, newVersion: next.version, oldTemplateRevisionId: old.templateRevisionId, newTemplateRevisionId: revision.id, adoptedLatestTemplate: true } });
    return next;
  });
}
