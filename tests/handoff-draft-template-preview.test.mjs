import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("newer draft revision produces a separate client preview entry point", async () => {
  const [page, section] = await Promise.all([source("src/app/(admin)/clients/[id]/page.tsx"), source("src/components/admin/launch-handoff-section.tsx")]);
  assert.match(page, /status: "DRAFT"[\s\S]*revision: \{ gt: handoffPacket\.templateRevision\.revision \}/);
  assert.match(section, /Preview Draft Template Revision/);
  assert.match(section, /handoff-preview\?revisionId=/);
  assert.match(section, /Nothing will be saved, issued, or sent/);
});

test("preview loads the draft revision and rebuilds current trusted project data", async () => {
  const [preview, packets] = await Promise.all([source("src/lib/services/handoff-preview.ts"), source("src/lib/services/handoff-packets.ts")]);
  assert.match(preview, /status: "DRAFT", template: \{ isDefault: true \}/);
  assert.match(preview, /getHandoffProject/);
  assert.match(preview, /buildCurrentHandoffDraft\(project\)/);
  assert.match(preview, /buildHandoffProjectFacts\(input\.draftData\)/);
  assert.match(preview, /personalizeHandoffModules/);
  assert.doesNotMatch(preview, /\.snapshot\b.*handoffPacket|handoffPacket.*\.snapshot/);
  assert.match(packets, /requirements: true/);
  assert.match(packets, /portal\.requirements\?\.pages/);
});

test("ordinary preview code has no packet, workflow, audit, or email mutations", async () => {
  const preview = await source("src/lib/services/handoff-preview.ts");
  for (const mutation of ["handoffPacket.create", "handoffPacket.update", "advanceClientWorkflow", "projectAuditEvent.create", "sendHandoffEmail"]) assert.equal(preview.includes(mutation), false, mutation);
  assert.match(preview, /packet: \{ id: "preview", version: 0 \}/);
});

test("preview routes enforce admin auth and PDFs carry a not-issued revision footer", async () => {
  const [pdfRoute, zipRoute, renderer] = await Promise.all([source("src/app/api/handoff-preview/[clientId]/documents/[documentKey]/route.ts"), source("src/app/api/handoff-preview/[clientId]/zip/route.ts"), source("src/lib/handoff-pdf.tsx")]);
  assert.match(pdfRoute, /await auth\(\)/);
  assert.match(zipRoute, /await auth\(\)/);
  assert.match(pdfRoute, /status: 401/);
  assert.match(renderer, /Template Revision \$\{snapshot\.preview\.templateRevision\} Preview · NOT ISSUED/);
  assert.match(renderer, /snapshot\.preview\?"Documents included in this preview"/);
});

test("issued downloads remain snapshot-only and separate from draft preview", async () => {
  const [issued, previewRoute] = await Promise.all([source("src/lib/services/handoff-download.ts"), source("src/app/api/handoff-preview/[clientId]/documents/[documentKey]/route.ts")]);
  assert.match(issued, /snapshot:packet\.snapshot/);
  assert.doesNotMatch(issued, /findDraftHandoffPreview/);
  assert.doesNotMatch(previewRoute, /findAdminHandoff|HandoffPacket/);
});

test("Revision 3 preview presents only the required Client Agreement", async () => {
  const [component, page, preview, pdfRoute] = await Promise.all([source("src/components/admin/handoff-draft-preview.tsx"), source("src/app/(admin)/clients/[id]/handoff-preview/page.tsx"), source("src/lib/services/handoff-preview.ts"), source("src/app/api/handoff-preview/[clientId]/documents/[documentKey]/route.ts")]);
  assert.match(component, /Recommended Handoff/);
  assert.match(component, /modules\.filter\(\(module\) => module\.required\)/);
  assert.doesNotMatch(component, /type="checkbox"/);
  assert.match(component, /Preview Agreement PDF/);
  assert.match(component, /Download Preview PDF/);
  assert.match(component, /Revision 3 contains a required Client Agreement, but no preview document was generated/);
  assert.match(component, /recommendations\.recommended\.includes\(module\.key\) \|\| initialSelected\.includes\(module\.key\)/);
  assert.match(page, /previewDocumentKeys=\{initiallySelected\}/);
  assert.match(pdfRoute, /findDraftHandoffPreview\(clientId, revisionId, \[documentKey\]\)/);
  assert.match(pdfRoute, /download.*attachment/);
  assert.doesNotMatch(component, /Additional \/ specialty documents/);
  assert.match(preview, /input\.schemaVersion >= 3[\s\S]*revisionKeys\.has[\s\S]*if \(item\.required\) selectedKeys\.add/);
  assert.match(preview, /HANDOFF_REVISION_3_ACCEPTANCE_TEXT\.replace/);
  assert.match(preview, /buildCurrentHandoffDraft\(project\)/);
});
