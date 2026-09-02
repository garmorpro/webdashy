import type { Prisma, PrismaClient } from "@prisma/client";
import { db } from "@/lib/db";
import { evaluateHandoffReadiness } from "./handoff-readiness-state.mjs";
import { workflowStageAfterHandoffBegins } from "./launch-handoff-readiness-state.mjs";
import { canSupersede, createPublicToken, hashSnapshot, nextPacketVersion, reusableDraft, sha256 } from "./handoff-packet-state.mjs";
import { assertDraftEditable, mergeHandoffDraft, normalizeHandoffDraft, resolveChecklistDefaults, validateChecklistSubmission, validateHandoffDraft } from "./handoff-draft";
import { advanceClientWorkflow } from "./client-workflow";

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
async function project(portalId: string, clientId: string, database: Db = db) {
  const portal = await database.portal.findFirst({ where: { id: portalId, clientId }, include: {
    client: true, buildSetup: { include: { websiteProvisioning: { include: { netlifyProvisioning: true } } } },
    delivery: true, invoices: true, clientCareEnrollment: true,
    handoffPackets: { include: { checklistItems: { orderBy: { displayOrder: "asc" } }, templateRevision: { include: { template: true } }, acceptance: true }, orderBy: { version: "desc" } },
  }});
  if (!portal) throw new Error("Client project not found.");
  return portal;
}

export async function getHandoffReadiness(portalId: string, clientId: string, database: Db = db): Promise<HandoffReadiness> {
  const [portal, published] = await Promise.all([
    project(portalId, clientId, database),
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

function buildDraft(portal: Awaited<ReturnType<typeof project>>): Prisma.InputJsonObject {
  const setup = portal.buildSetup, website = setup?.websiteProvisioning, netlify = website?.netlifyProvisioning, delivery = portal.delivery, care = portal.clientCareEnrollment;
  const paidAt = portal.invoices.filter((i) => i.status === "PAID").map((i) => i.paidAt).filter(Boolean).sort((a, b) => b!.getTime() - a!.getTime())[0];
  return {
    projectSummary: { clientBusinessName: portal.client.businessName, clientName: portal.client.contactName, projectName: setup?.projectName ?? portal.client.businessName, approvedDate: date(delivery?.reviewedAt), paymentCompletionDate: date(paidAt) },
    websiteLaunch: { stagingUrl: delivery?.stagingUrl ?? null, liveUrl: delivery?.liveUrl ?? null, launchDate: null, status: delivery?.liveUrl ? "LIVE_URL_RECORDED" : "PENDING_LAUNCH" },
    domain: { primaryDomain: setup?.primaryDomain ?? null, registrar: "", owner: "", renewalResponsibility: "", dnsManager: "", transferAccessStatus: "" },
    hosting: { siteName: netlify?.siteName ?? null, publicUrl: netlify?.sslUrl ?? netlify?.siteUrl ?? null, owner: "", billingResponsibility: "" },
    sourceCode: { repositoryUrl: website?.repositoryUrl ?? null, owner: website?.targetOwner ?? setup?.repositoryOwner ?? "", visibility: website?.actualVisibility ?? setup?.repositoryVisibility ?? null, defaultBranch: website?.defaultBranch ?? null, clientAccessStatus: "" },
    ownershipResponsibilities: { clientOwns: "", webDashyRetainsManages: "", notes: "" }, thirdPartyServices: [],
    maintenanceSupport: { clientCareDisposition: care?.disposition ?? "", planName: care?.planNameSnapshot ?? "", supportEmail: care?.supportEmail ?? "", responseExpectation: care?.responseExpectation ?? "", notes: "" },
    warranty: { startDate: date(care?.warrantyStartsAt), endDate: date(care?.warrantyEndsAt), notes: care?.notes ?? "" },
    operationalResponsibilities: { backups: "", security: "", updatesMonitoring: "", offboardingNotes: "" },
    privacyDataCompliance: { formsDataCollected: "", analyticsCookies: "", privacyPolicyResponsibility: "", accessibilityResponsibility: "", complianceNotes: "", operationalFacts: "", acknowledgmentNotes: "" },
  };
}

async function audit(database: Db, actorUserId: string, eventType: string, values: { clientId: string; portalId?: string; packetId?: string; metadata?: Prisma.InputJsonValue }) {
  await database.projectAuditEvent.create({ data: { ...values, actorType: "ADMIN", actorUserId, eventType } });
}

async function applySmartChecklistDefaults(database: Db, packetId: string, draftData: unknown, liveUrl: string | null | undefined, actorUserId: string) {
  const draft = normalizeHandoffDraft(draftData);
  const items = await database.handoffChecklistItem.findMany({ where: { packetId } });
  const resolved = resolveChecklistDefaults(items, { liveUrl, thirdPartyServices: draft.thirdPartyServices, analyticsCookies: draft.privacyDataCompliance.analyticsCookies });
  for (const item of resolved) {
    const original = items.find((candidate) => candidate.id === item.id);
    if (!original || original.status === item.status) continue;
    await database.handoffChecklistItem.updateMany({ where: { id: item.id, packetId, status: "PENDING" }, data: { status: item.status, completedAt: item.status === "COMPLETED" ? new Date() : null, completedByUserId: item.status === "COMPLETED" ? actorUserId : null } });
  }
}

function assertHandoffCanBegin(portal: Awaited<ReturnType<typeof project>>) {
  if (portal.delivery?.reviewStatus !== "APPROVED" || portal.invoices.length === 0 || portal.invoices.some((invoice) => invoice.status !== "PAID")) throw new Error("Client approval and payment are required before beginning Launch & Handoff.");
}

async function advanceHandoffWorkflow(database: Db, portal: Awaited<ReturnType<typeof project>>) {
  const facts = { reviewApproved: portal.delivery?.reviewStatus === "APPROVED", invoiceCount: portal.invoices.length, unpaidInvoiceCount: portal.invoices.filter((invoice) => invoice.status !== "PAID").length };
  const nextStage = workflowStageAfterHandoffBegins(portal.client.workflowStage, facts);
  if (nextStage === "LAUNCH_AND_HANDOFF" && portal.client.workflowStage === "PAYMENT_RECEIVED") await advanceClientWorkflow(portal.clientId, "LAUNCH_AND_HANDOFF", database);
}

export async function beginLaunchHandoff(portalId: string, clientId: string, actorUserId: string) {
  return db.$transaction(async (tx) => {
    const portal = await project(portalId, clientId, tx); assertHandoffCanBegin(portal);
    const packet = portal.handoffPackets.find((candidate) => candidate.status === "DRAFT" && !candidate.supersededById);
    if (!packet) throw new Error("Generate a handoff packet draft before beginning handoff.");
    await applySmartChecklistDefaults(tx, packet.id, packet.draftData, portal.delivery?.liveUrl, actorUserId);
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
    const portal = await project(portalId, clientId, tx); const reuse = reusableDraft(portal.handoffPackets);
    if (reuse) {
      await tx.handoffChecklistItem.createMany({ data: DEFAULT_CHECKLIST.map(([key, label, category, required], displayOrder) => ({ packetId: reuse.id, key, label, category, required, displayOrder })), skipDuplicates: true });
      await applySmartChecklistDefaults(tx, reuse.id, reuse.draftData, portal.delivery?.liveUrl, actorUserId);
      await advanceHandoffWorkflow(tx, portal);
      return reuse;
    }
    if (portal.handoffPackets.some((packet) => packet.status !== "SUPERSEDED" && packet.status !== "REVOKED")) {
      throw new Error("This portal already has an active issued packet. Create a corrected version instead.");
    }
    const revision = await tx.handoffTemplateRevision.findFirst({ where: { status: "PUBLISHED", template: { isDefault: true } }, orderBy: { revision: "desc" } });
    if (!revision) throw new Error("No published default handoff template exists.");
    const packet = await tx.handoffPacket.create({ data: { portalId, clientId, templateRevisionId: revision.id, version: nextPacketVersion(portal.handoffPackets), recipientName: portal.client.contactName, recipientEmail: portal.client.email, draftData: buildDraft(portal) } });
    await tx.handoffChecklistItem.createMany({ data: DEFAULT_CHECKLIST.map(([key, label, category, required], displayOrder) => ({ packetId: packet.id, key, label, category, required, displayOrder })), skipDuplicates: true });
    await applySmartChecklistDefaults(tx, packet.id, packet.draftData, portal.delivery?.liveUrl, actorUserId);
    await advanceHandoffWorkflow(tx, portal);
    await audit(tx, actorUserId, "HANDOFF_PACKET_GENERATED", { clientId, portalId, packetId: packet.id, metadata: { version: packet.version, templateRevisionId: revision.id } });
    return packet;
  });
}

export async function saveHandoffDraft(packetId: string, portalId: string, clientId: string, actorUserId: string, input: { recipientName: string; recipientEmail: string; edits: unknown; checklist: unknown }) {
  const recipientName = input.recipientName.trim(), recipientEmail = input.recipientEmail.trim();
  if (!recipientName || recipientName.length > 200 || recipientEmail.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) throw new Error("Enter a valid recipient name and email.");
  await db.$transaction(async (tx) => {
    const packet = await tx.handoffPacket.findFirst({ where: { id: packetId, portalId, clientId }, include: { checklistItems: true } });
    if (!packet) throw new Error("Packet not found for this project."); assertDraftEditable(packet.status);
    const owned = new Set(packet.checklistItems.map((item) => item.id));
    const checklist = validateChecklistSubmission(input.checklist, owned) as { id: string; status: string; note: string }[];
    const merged = validateHandoffDraft(mergeHandoffDraft(packet.draftData, input.edits));
    const safe = clean(merged) as Prisma.InputJsonObject;
    await tx.handoffPacket.update({ where: { id: packet.id }, data: { recipientName, recipientEmail, draftData: safe } });
    for (const item of checklist) { await tx.handoffChecklistItem.update({ where: { id: item.id }, data: { status: item.status as "PENDING", note: item.note.trim() || null, completedAt: item.status === "COMPLETED" ? new Date() : null, completedByUserId: item.status === "COMPLETED" ? actorUserId : null } }); }
    await audit(tx, actorUserId, "HANDOFF_PACKET_DRAFT_SAVED", { clientId, portalId, packetId: packet.id, metadata: { version: packet.version } });
  });
}

export async function issueHandoffPacket(packetId: string, portalId: string, clientId: string, actorUserId: string) {
  const readiness = await getHandoffReadiness(portalId, clientId); if (readiness.blocked) throw new Error("Resolve all blocked readiness checks before issuing.");
  return db.$transaction(async (tx) => {
    const packet = await tx.handoffPacket.findFirst({ where: { id: packetId, portalId, clientId }, include: { checklistItems: { orderBy: { displayOrder: "asc" } }, templateRevision: { include: { template: true } } } });
    if (!packet) throw new Error("Packet not found for this project."); if (packet.status !== "DRAFT") throw new Error("Only a draft packet can be issued."); if (packet.templateRevision.status !== "PUBLISHED") throw new Error("The packet's exact template revision is no longer published.");
    const issuedAt = new Date(); const snapshot = { snapshotSchemaVersion: packet.snapshotSchemaVersion, issuedAt: issuedAt.toISOString(), packet: { id: packet.id, version: packet.version }, recipient: { name: packet.recipientName, email: packet.recipientEmail }, template: { id: packet.templateRevision.template.id, slug: packet.templateRevision.template.slug, revisionId: packet.templateRevision.id, revision: packet.templateRevision.revision, schemaVersion: packet.templateRevision.schemaVersion }, sections: packet.templateRevision.sections, acceptanceText: packet.templateRevision.acceptanceText, draftData: packet.draftData, checklist: packet.checklistItems.map(({ key,label,category,required,status,note }) => ({ key,label,category,required,status,note })) };
    const snapshotHash = hashSnapshot(snapshot), token = createPublicToken(), tokenExpiresAt = new Date(issuedAt.getTime() + 60 * 86400000);
    await tx.handoffPacket.update({ where: { id: packet.id }, data: { status: "ISSUED", snapshot, snapshotHash, publicTokenHash: token.tokenHash, tokenPreview: token.tokenPreview, tokenExpiresAt, issuedAt } });
    await audit(tx, actorUserId, "HANDOFF_PACKET_ISSUED", { clientId, portalId, packetId: packet.id, metadata: { version: packet.version, snapshotHash, tokenExpiresAt: tokenExpiresAt.toISOString() } });
    return { rawToken: token.rawToken };
  });
}

export async function supersedeHandoffPacket(packetId: string, portalId: string, clientId: string, actorUserId: string) {
  return db.$transaction(async (tx) => {
    const portal = await project(portalId, clientId, tx); const old = portal.handoffPackets.find((packet) => packet.id === packetId);
    if (!old) throw new Error("Packet not found for this project."); if (old.status === "ACCEPTED" || old.acceptance) throw new Error("An accepted packet cannot be silently corrected."); if (!canSupersede(old.status)) throw new Error("This packet cannot be corrected.");
    const next = await tx.handoffPacket.create({ data: { portalId, clientId, templateRevisionId: old.templateRevisionId, version: nextPacketVersion(portal.handoffPackets), recipientName: old.recipientName, recipientEmail: old.recipientEmail, draftData: old.draftData as Prisma.InputJsonValue } });
    await tx.handoffChecklistItem.createMany({ data: old.checklistItems.map(({ key,label,category,required,status,note,displayOrder }) => ({ packetId: next.id,key,label,category,required,status,note,displayOrder })), skipDuplicates: true });
    await tx.handoffPacket.update({ where: { id: old.id }, data: { status: "SUPERSEDED", supersededById: next.id, tokenRevokedAt: new Date(), publicTokenHash: null } });
    await audit(tx, actorUserId, "HANDOFF_PACKET_SUPERSEDED", { clientId, portalId, packetId: old.id, metadata: { supersededByPacketId: next.id, oldVersion: old.version, newVersion: next.version } }); return next;
  });
}
