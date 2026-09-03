import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const renderer = fs.readFileSync(new URL("../src/lib/handoff-pdf.tsx", import.meta.url), "utf8");
const template = fs.readFileSync(new URL("../src/lib/services/handoff-template-content.mjs", import.meta.url), "utf8");
const seed = fs.readFileSync(new URL("../prisma/seed.mjs", import.meta.url), "utf8");
const preview = fs.readFileSync(new URL("../src/lib/services/handoff-preview.ts", import.meta.url), "utf8");
const previewRoute = fs.readFileSync(new URL("../src/app/api/handoff-preview/[clientId]/documents/[documentKey]/route.ts", import.meta.url), "utf8");

test("PDF renderer has branded hierarchy, compact metadata, wrapping, and fixed page footer", () => {
  assert.match(renderer, /wordmark\.png/);
  assert.match(renderer, /module\.key==="client_agreement"/);
  assert.match(renderer, /flexWrap:"wrap"/);
  assert.match(renderer, /Page \$\{pageNumber\} of \$\{totalPages\}/);
  assert.match(renderer, /wrap=\{false\}/);
});

test("compact metadata and project-specific records are atomic pagination blocks", () => {
  assert.match(renderer, /style=\{s\.metadata\} wrap=\{false\}/);
  assert.match(renderer, /style=\{s\.card\} wrap=\{false\}><Text style=\{s\.cardTitle\}>Project-specific record/);
  assert.doesNotMatch(renderer, /style=\{s\.card\}><Text style=\{s\.cardTitle\}>Project-specific record/);
});

test("project-specific rows cannot become an orphaned continuation fragment", () => {
  assert.match(renderer, /recordedRows\.map\(r=><View key=\{r\.label\} style=\{s\.detailRow\}>/);
  assert.match(renderer, /const recordedRows=rows\.filter/);
});

test("signature and accepted-certificate blocks do not split", () => {
  assert.match(renderer, /style=\{s\.certificate\} wrap=\{false\}/);
  assert.match(renderer, /style=\{s\.signature\} wrap=\{false\}/);
  assert.match(renderer, /style=\{contract\.acceptance\} wrap=\{false\}/);
});

test("missing optional project facts are omitted while populated facts remain renderable", () => {
  assert.match(renderer, /rows\.filter\(row=>row\.value!=="Not recorded"\)/);
  assert.match(renderer, /recordedRows\.length\?<View/);
  assert.match(renderer, /recordedRows\.map\(r=>/);
});

test("third-party empty disclosure stays explicit and atomic", () => {
  assert.match(renderer, /if\(!rows\.length\)return <View style=\{s\.section\} wrap=\{false\}>/);
  assert.match(renderer, /No additional third-party services were recorded in this packet\./);
  assert.match(renderer, /style=\{s\.service\} wrap=\{false\}/);
});

test("pagination uses flow hints without forced pages that could create blank pages", () => {
  assert.match(renderer, /minPresenceAhead=\{36\}/);
  assert.doesNotMatch(renderer, /\sbreak(?:=|\s|>)/);
});

test("document metadata is selected by document key", () => {
  assert.match(renderer, /website_ownership_agreement:\["Client","Project"\]/);
  assert.match(renderer, /domain_ownership_renewal_agreement:\["Client","Domain"\]/);
  assert.doesNotMatch(renderer, /label:"Packet"/);
  assert.doesNotMatch(renderer, /Project details/);
});

test("packet issue metadata is subtle footer content", () => {
  assert.match(renderer, /WebDashy Handoff · Packet v/);
  assert.match(renderer, /Issued \{fmtDate\(snapshot\.issuedAt\)\}/);
  assert.match(renderer, /Ref \{hash\.slice\(0,12\)\}/);
});

test("renderer never accesses internal handoff or provider administration fields", () => {
  for (const secret of ["adminNote", "checklist", "audit", "netlifyAdminUrl", "providerId", "apiKey", "internalId"]) assert.equal(renderer.includes(secret), false, secret);
});

test("issued agreement has an uncompleted acceptance block while accepted agreement renders a certificate", () => {
  assert.match(renderer, /Acceptance Certificate/);
  assert.match(renderer, /Typed full name/);
  assert.match(renderer, /Accepted timestamp:/);
  assert.match(renderer, /Immutable agreement \/ snapshot reference:/);
  assert.match(renderer, /To be completed electronically/);
  assert.match(renderer, /ACCEPTED ELECTRONICALLY/);
  assert.match(renderer, /Agreement Reference/);
});

test("Revision 3 Preview Agreement PDF title is Client Agreement and cannot resolve Final Acceptance", () => {
  assert.match(renderer, /<Document title="Client Agreement"/);
  assert.match(renderer, /<Text style=\{contract\.title\}>CLIENT AGREEMENT<\/Text>/);
  assert.match(preview, /input\.schemaVersion >= 3 \? HANDOFF_TEMPLATE_REVISION_3_MODULES/);
  assert.match(previewRoute, /preview\?\.revision === 3 && documentKey !== "client_agreement"/);
  assert.doesNotMatch(template.match(/HANDOFF_TEMPLATE_REVISION_3_MODULES = \[[\s\S]*?\n\];/)?.[0] ?? "", /Final Acceptance & Sign-Off/);
});

test("Client Agreement uses contract layout without report overview styling", () => {
  assert.match(renderer, /fontFamily:"Times-Roman"/);
  assert.match(renderer, /AgreementInformation/);
  assert.match(renderer, /minPresenceAhead=\{44\}/);
  assert.match(renderer, /orphans=\{2\} widows=\{2\}/);
  const agreementPath = renderer.slice(renderer.indexOf("function ClientAgreementDocument"), renderer.indexOf("function Footer"));
  assert.doesNotMatch(agreementPath, /Purpose \/ overview/i);
  assert.doesNotMatch(agreementPath, /s\.metadata|s\.card|s\.category/);
  assert.doesNotMatch(agreementPath, /Packet|Template Revision/);
});

test("agreement opening is a compact left-aligned contract header and omits unavailable rows", () => {
  assert.match(renderer, /header:\{alignItems:"flex-start"\}/);
  assert.match(renderer, /title:\{fontFamily:"Helvetica-Bold",fontSize:20,lineHeight:1\.1[\s\S]*?marginTop:12\}/);
  assert.match(renderer, /subtitle:\{fontFamily:"Helvetica",fontSize:9\.4,lineHeight:1\.34[\s\S]*?marginTop:10,width:190\}/);
  assert.match(renderer, /divider:\{[\s\S]*?marginTop:18,marginBottom:10\}/);
  assert.match(renderer, /info:\{flexDirection:"row",flexWrap:"wrap"/);
  assert.match(renderer, /infoCell:\{width:"50%"/);
  assert.match(renderer, /first\.facts\.map/);
  assert.doesNotMatch(renderer, /AgreementInformation[\s\S]*?Not recorded/);
});

test("revision 2 is added without updating legacy revision 1", () => {
  assert.match(seed, /revision: 1[\s\S]*?update: \{\}/);
  assert.match(seed, /revision: 2[\s\S]*?status: "DRAFT"/);
  assert.match(seed, /sections: HANDOFF_TEMPLATE_MODULES/);
  assert.match(template, /Draft template — pending legal review\./);
});
