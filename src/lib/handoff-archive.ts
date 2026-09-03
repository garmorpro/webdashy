import "server-only";

import { handoffArchiveFilename, handoffDocumentUnits } from "./services/handoff-documents.mjs";
import { buildZipBuffer } from "./services/zip-buffer.mjs";
import { renderHandoffDocumentPdf, renderHandoffPdf } from "./handoff-pdf";
import type { HandoffSnapshot } from "./services/public-handoff";
import type { HandoffPolicyModule } from "./services/public-handoff";

export type HandoffAcceptance = { typedName:string; signerTitle:string|null; acceptedAt:Date; acknowledgmentText:string };
type DocumentUnit = {key:string;filename:string;legacy:boolean;module?:HandoffPolicyModule};

export async function renderHandoffArchive(snapshot:HandoffSnapshot, snapshotHash:string, acceptance?:HandoffAcceptance|null) {
  const units = handoffDocumentUnits(snapshot) as DocumentUnit[];
  const files = await Promise.all(units.map(async (unit) => ({
    filename: unit.filename,
    buffer: unit.legacy
      ? await renderHandoffPdf(snapshot, snapshotHash, acceptance)
      : await renderHandoffDocumentPdf(snapshot, unit.module!, snapshotHash, ["client_agreement", "final_acceptance_sign_off"].includes(unit.key) ? acceptance : null),
  })));
  return { buffer: await buildZipBuffer(files,snapshot.issuedAt) as Buffer, filename: handoffArchiveFilename(snapshot), files: files.map(({ filename }) => filename) };
}
