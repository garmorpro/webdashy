import "server-only";

import { db } from "@/lib/db";
import { canAccept, hashHandoffToken, hashSnapshot, sha256, unavailableReason } from "./handoff-packet-state.mjs";
import { isSafeHandoffPreviewEnabled } from "./handoff-dry-run.mjs";
import { validateSnapshotShape, snapshotSchemaVersionProblem } from "./handoff-snapshot-schema.mjs";

export type HandoffSnapshot = {
  snapshotSchemaVersion: number; issuedAt: string;
  packet: { id: string; version: number };
  recipient: { name: string; email: string };
  sections: unknown; policyModules?: HandoffPolicyModule[]; acceptanceText: string; draftData: Record<string, unknown>; handoffFacts?: Record<string, unknown>;
  checklist?: { key: string; label: string; category: string; required: boolean; status: string; note?: string | null }[];
  preview?: { templateRevision: number };
  template?: { id: string; slug: string; revisionId: string; revision: number; schemaVersion: number };
};
export type HandoffPolicyModule = { key: string; title: string; description: string; category: string; content?: string; introduction?: string; subtitle?: string; purpose?: string; sections?: { heading: string; paragraphs?: string[]; bullets?: string[]; facts?: {label:string;value:string;link?:boolean}[] }[]; legalReviewRequired?: boolean; reviewNote?: string; required?: boolean; defaultIncluded?: boolean };

function snapshotOf(value: unknown): HandoffSnapshot | null {
  return validateSnapshotShape(value).valid ? value as HandoffSnapshot : null;
}

export async function findPublicHandoff(rawToken: string, trackView = false) {
  const validation = await validatePublicHandoff(rawToken, trackView);
  return validation.result;
}

export async function validatePublicHandoff(rawToken: string, trackView = false) {
  if (!rawToken) return failed("TOKEN_MISSING");
  if (!/^[A-Za-z0-9_-]{43}$/.test(rawToken)) return failed("TOKEN_FORMAT_INVALID");
  const tokenHash = hashHandoffToken(rawToken);
  const packet = await db.handoffPacket.findUnique({ where: { publicTokenHash: tokenHash }, include: { client: true, acceptance: true } });
  if (!packet) return failed("TOKEN_HASH_NOT_FOUND", tokenHash);
  if (packet.status === "REVOKED" || packet.tokenRevokedAt) return failed("PACKET_REVOKED", tokenHash, packet.status);
  if (packet.status === "SUPERSEDED" || packet.supersededById) return failed("PACKET_SUPERSEDED", tokenHash, packet.status);
  if (!packet.tokenExpiresAt || packet.tokenExpiresAt <= new Date()) return failed("TOKEN_EXPIRED", tokenHash, packet.status);
  if (!["ISSUED","SENT","VIEWED","ACCEPTED","COMPLETED"].includes(packet.status)) return failed("PACKET_STATUS_INVALID", tokenHash, packet.status);
  if (unavailableReason(packet) || !packet.snapshot || !packet.snapshotHash) return failed("SNAPSHOT_MISSING", tokenHash, packet.status);
  const schemaVersionProblem = snapshotSchemaVersionProblem(packet.snapshotSchemaVersion, packet.snapshot);
  if (schemaVersionProblem) return failed(schemaVersionProblem, tokenHash, packet.status);
  const snapshotValidation = validateSnapshotShape(packet.snapshot);
  if (!snapshotValidation.valid) return failed("SNAPSHOT_SCHEMA_INVALID", tokenHash, packet.status, snapshotValidation);
  const snapshot = packet.snapshot as unknown as HandoffSnapshot;
  if (hashSnapshot(packet.snapshot) !== packet.snapshotHash) return failed("SNAPSHOT_HASH_MISMATCH", tokenHash, packet.status);
  if (trackView) {
    const now = new Date();
    await db.$transaction(async (tx) => {
      const current = await tx.handoffPacket.findFirst({ where: { id: packet.id, publicTokenHash: tokenHash } });
      if (unavailableReason(current)) return;
      const first = await tx.handoffPacket.updateMany({ where: { id: packet.id, publicTokenHash: tokenHash, firstViewedAt: null }, data: { firstViewedAt: now } });
      await tx.handoffPacket.updateMany({ where: { id: packet.id, publicTokenHash: tokenHash }, data: { lastViewedAt: now, viewCount: { increment: 1 } } });
      await tx.handoffPacket.updateMany({ where: { id: packet.id, publicTokenHash: tokenHash, status: "SENT" }, data: { status: "VIEWED" } });
      if (first.count === 1) await tx.projectAuditEvent.create({ data: { clientId: packet.clientId, portalId: packet.portalId, packetId: packet.id, actorType: "CLIENT_TOKEN", eventType: "HANDOFF_PACKET_VIEWED", metadata: { firstViewedAt: now.toISOString() } } });
    });
  }
  return { result:{ packet, snapshot }, reason:null };
}

function failed(reason:string,tokenHash?:string,packetStatus?:string,diagnostic?:{schemaPath:string|null;schemaIssue:string|null}) {
  const diagnosticsEnabled=process.env.NODE_ENV!=="production"||isSafeHandoffPreviewEnabled();
  const safeDiagnostic=diagnosticsEnabled&&diagnostic?{schemaPath:diagnostic.schemaPath,schemaIssue:diagnostic.schemaIssue}:{};
  if(diagnosticsEnabled)console.warn("handoff validation failed",{reason,fingerprint:tokenHash?.slice(0,8),packetStatus,...safeDiagnostic});
  return {result:null,reason,...safeDiagnostic};
}

export async function acceptPublicHandoff(rawToken: string, input: { typedName: string; signerTitle?: string; authorityConfirmed: boolean; acknowledgmentConfirmed: boolean; submissionKey: string }) {
  const typedName = input.typedName.trim(), signerTitle = input.signerTitle?.trim() || null;
  if (typedName.length < 2 || typedName.length > 200 || (signerTitle?.length ?? 0) > 200) throw new Error("Enter a valid legal name and title.");
  if (!input.authorityConfirmed || !input.acknowledgmentConfirmed) throw new Error("Both confirmations are required.");
  if (!/^[A-Za-z0-9_-]{16,100}$/.test(input.submissionKey)) throw new Error("Invalid submission. Refresh and try again.");
  const tokenHash = sha256(rawToken), now = new Date();
  return db.$transaction(async (tx) => {
    const packet = await tx.handoffPacket.findUnique({ where: { publicTokenHash: tokenHash }, include: { acceptance: true } });
    if (unavailableReason(packet, now) || !packet?.snapshot || !packet.snapshotHash) throw new Error("This handoff is unavailable.");
    if (snapshotSchemaVersionProblem(packet.snapshotSchemaVersion, packet.snapshot)) throw new Error("This handoff is unavailable.");
    const snapshot = snapshotOf(packet.snapshot);
    if (!snapshot || hashSnapshot(packet.snapshot) !== packet.snapshotHash) throw new Error("This handoff is unavailable.");
    if (packet.acceptance?.submissionKey === input.submissionKey) return packet.acceptance;
    if (snapshot.snapshotSchemaVersion >= 3 && !signerTitle) throw new Error("Enter your title or role.");
    if (!canAccept(packet.status) || packet.acceptance) throw new Error("This handoff has already been accepted or is unavailable.");
    const claimed = await tx.handoffPacket.updateMany({ where: { id: packet.id, status: { in: ["ISSUED", "SENT", "VIEWED"] }, acceptance: null }, data: { status: "ACCEPTED" } });
    if (claimed.count !== 1) throw new Error("This handoff has already been accepted or is unavailable.");
    const acceptance = await tx.handoffAcceptance.create({ data: { packetId: packet.id, typedName, signerTitle, authorityConfirmed: true, acknowledgmentConfirmed: true, acknowledgmentText: snapshot.acceptanceText, packetSnapshotHash: packet.snapshotHash, acceptedAt: now, submissionKey: input.submissionKey } });
    await tx.projectAuditEvent.create({ data: { clientId: packet.clientId, portalId: packet.portalId, packetId: packet.id, actorType: "CLIENT_TOKEN", eventType: "HANDOFF_PACKET_ACCEPTED", metadata: { acceptedAt: now.toISOString() } } });
    return acceptance;
  });
}
