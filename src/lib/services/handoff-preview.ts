import "server-only";

import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { HandoffPolicyModule, HandoffSnapshot } from "./public-handoff";
import { buildCurrentHandoffDraft, getHandoffProject } from "./handoff-packets";
import { buildHandoffProjectFacts, handoffDocumentRecommendations, recommendedHandoffPolicyKeys } from "./handoff-project-facts.mjs";
import { personalizeHandoffModules } from "./handoff-document-content.mjs";
import { resolveHandoffPolicyModules } from "./handoff-policy-modules.mjs";
import { HANDOFF_REVISION_3_ACCEPTANCE_TEXT, HANDOFF_TEMPLATE_REVISION_3_MODULES } from "./handoff-template-content.mjs";

export function buildDraftTemplatePreview(input: {
  clientId: string; portalId: string; recipientName: string; recipientEmail: string;
  templateName: string; revisionId: string; revision: number; schemaVersion: number;
  sections: Prisma.JsonValue; acceptanceText: string; draftData: Prisma.JsonValue | Prisma.InputJsonValue; selectedKeys?: string[];
}) {
  const facts = buildHandoffProjectFacts(input.draftData);
  const recommendations = handoffDocumentRecommendations(facts);
  const selectedKeys = new Set(input.selectedKeys ?? recommendedHandoffPolicyKeys(facts));
  // Revision 3 is a new single-document architecture. Use its canonical draft
  // definition even when a local draft row predates the Revision 3 seed refresh;
  // otherwise the legacy required final-acceptance module can leak into preview.
  const revisionSections = input.schemaVersion >= 3 ? HANDOFF_TEMPLATE_REVISION_3_MODULES : input.sections;
  const resolved = resolveHandoffPolicyModules(revisionSections);
  const revisionKeys = new Set(Array.isArray(revisionSections) ? revisionSections.map((item) => typeof item === "object" && item && "key" in item ? String(item.key) : "") : []);
  const available = input.schemaVersion >= 3 ? resolved.filter((item:{key:string}) => revisionKeys.has(item.key)) : resolved;
  for (const item of available) if (item.required) selectedKeys.add(item.key);
  const selected = available.filter((item:{key:string})=>selectedKeys.has(item.key));
  const modules = input.schemaVersion >= 3 ? personalizeHandoffModules(selected, facts, { reference: `Template Revision ${input.revision} Preview` }) : selected;
  const snapshot: HandoffSnapshot = {
    snapshotSchemaVersion: input.schemaVersion, issuedAt: new Date().toISOString(), packet: { id: "preview", version: 0 },
    recipient: { name: input.recipientName, email: input.recipientEmail }, sections: modules, policyModules: modules as HandoffPolicyModule[],
    acceptanceText: input.schemaVersion >= 3 ? HANDOFF_REVISION_3_ACCEPTANCE_TEXT.replace("[Client Business Name]", facts.client?.businessName || input.recipientName) : input.acceptanceText, handoffFacts: facts, draftData: input.draftData as Record<string, unknown>, preview: { templateRevision: input.revision },
  };
  return { clientId: input.clientId, portalId: input.portalId, revisionId: input.revisionId, revision: input.revision, templateName: input.templateName, snapshot, recommendations, availableModules: available as HandoffPolicyModule[] };
}

// Compatibility for the editable packet wizard. The standalone draft-template
// preview below never calls this and never reads a packet snapshot or writes a packet.
export function buildDraftHandoffPreview(packet:{id:string;version:number;recipientName:string;recipientEmail:string;draftData:Prisma.JsonValue}, revision:{id:string;revision:number;schemaVersion:number;sections:Prisma.JsonValue;acceptanceText:string;template:{name:string}}):HandoffSnapshot {
  return buildDraftTemplatePreview({ clientId:"", portalId:"", recipientName:packet.recipientName, recipientEmail:packet.recipientEmail, templateName:revision.template.name, revisionId:revision.id, revision:revision.revision, schemaVersion:revision.schemaVersion, sections:revision.sections, acceptanceText:revision.acceptanceText, draftData:packet.draftData }).snapshot;
}

export async function findDraftHandoffPreview(clientId: string, revisionId: string, selectedKeys?: string[]) {
  const revision = await db.handoffTemplateRevision.findFirst({ where: { id: revisionId, status: "DRAFT", template: { isDefault: true } }, include: { template: true } });
  if (!revision) return null;
  const portal = await db.portal.findFirst({ where: { clientId }, orderBy: { createdAt: "desc" }, select: { id: true } });
  if (!portal) return null;
  const project = await getHandoffProject(portal.id, clientId);
  return buildDraftTemplatePreview({ clientId, portalId: portal.id, recipientName: project.client.contactName, recipientEmail: project.client.email, templateName: revision.template.name, revisionId, revision: revision.revision, schemaVersion: revision.schemaVersion, sections: revision.sections, acceptanceText: revision.acceptanceText, draftData: buildCurrentHandoffDraft(project), selectedKeys });
}
