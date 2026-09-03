import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const form = source("src/components/handoff/acceptance-form.tsx");
const page = source("src/app/h/[token]/page.tsx");
const action = source("src/lib/actions/public-handoff.ts");
const service = source("src/lib/services/public-handoff.ts");
const pdf = source("src/lib/handoff-pdf.tsx");
const packets = source("src/lib/services/handoff-packets.ts");
const mail = source("src/lib/mail.ts");
const admin = source("src/components/admin/launch-handoff-section.tsx");
const adminPage = source("src/app/(admin)/clients/[id]/page.tsx");
const adminDownload = source("src/app/api/handoff/[id]/documents/[documentKey]/route.ts");
const publicDownload = source("src/app/api/h/[token]/documents/[documentKey]/route.ts");

test("Revision 3 public page is centered on the single Client Agreement", () => {
  assert.match(page, /if\(revision3\)/);
  assert.match(page, /Ready for Review/);
  assert.match(page, /View Agreement/);
  assert.match(page, /Download Agreement/);
  assert.match(page, /Agreement Signed ✓/);
  assert.match(page, /Download Signed Agreement/);
});

test("Revision 3 admin primary controls use agreement language while legacy ZIP controls remain", () => {
  const revision3Panel = admin.slice(admin.indexOf("packet&&issued&&revision3"), admin.indexOf("packet&&issued&&!revision3"));
  assert.match(revision3Panel, /Client Agreement/);
  assert.match(revision3Panel, /Send Agreement to Client/);
  assert.match(revision3Panel, /Resend Agreement/);
  assert.match(revision3Panel, /Download Signed Agreement PDF/);
  assert.doesNotMatch(revision3Panel, /Packet|Handoff ZIP|View documents/);
  const legacyPanel = admin.slice(admin.indexOf("packet&&issued&&!revision3"));
  assert.match(legacyPanel, /Download Handoff ZIP/);
  assert.match(legacyPanel, /View documents/);
});

test("Revision 3 download routes hard-guard the Client Agreement document", () => {
  assert.match(adminPage, /schemaVersion: handoffPacket\.templateRevision\.schemaVersion/);
  assert.match(adminDownload, /isRevision3Agreement\(found\.snapshot\)&&documentKey!=="client_agreement"/);
  assert.match(publicDownload, /isRevision3Agreement\(found\.snapshot\)&&documentKey!=="client_agreement"/);
  assert.match(adminDownload, /handoffAgreementFilename\(found\.snapshot,Boolean\(found\.packet\.acceptance\)\)/);
  assert.match(publicDownload, /handoffAgreementFilename\(found\.snapshot,Boolean\(found\.packet\.acceptance\)\)/);
});

test("signing form captures name and title and previews the typed legal name", () => {
  assert.match(form, /Full Legal Name/);
  assert.match(form, /Title \/ Role/);
  assert.match(form, /data-testid="signature-preview"/);
  assert.match(form, /value=\{typedName\}/);
  assert.match(form, /font-family:.*cursive/);
  assert.match(form, /presentation only/);
});

test("both exact confirmations are required in UI and enforced by the server", () => {
  assert.match(form, /required type="checkbox" name="authorityConfirmed"/);
  assert.match(form, /authorized to accept this Agreement on behalf of \{clientBusinessName\}/);
  assert.match(form, /required type="checkbox" name="acknowledgmentConfirmed"/);
  assert.match(form, /I have reviewed and agree to the Client Agreement/);
  assert.match(service, /!input\.authorityConfirmed \|\| !input\.acknowledgmentConfirmed/);
});

test("acceptance trusts server time and immutable snapshot data, not client date or reference", () => {
  assert.doesNotMatch(action, /form\.get\("(?:acceptedAt|acceptanceDate|snapshotHash|packetId)"\)/);
  assert.match(service, /const tokenHash = sha256\(rawToken\), now = new Date\(\)/);
  assert.match(service, /acknowledgmentText: snapshot\.acceptanceText/);
  assert.match(service, /packetSnapshotHash: packet\.snapshotHash/);
  assert.match(service, /acceptedAt: now/);
  assert.match(service, /typedName, signerTitle/);
  assert.match(service, /packet\.acceptance\?\.submissionKey === input\.submissionKey/);
});

test("accepted Agreement PDF has signature treatment, signer, title, date, and immutable reference without blank lines", () => {
  assert.match(pdf, /signatureName/);
  assert.match(pdf, /Times-Italic/);
  assert.match(pdf, /Authorized Signer/);
  assert.match(pdf, /Date Accepted/);
  assert.match(pdf, /Agreement Reference/);
  assert.match(pdf, /Immutable snapshot/);
  const accepted = pdf.slice(pdf.indexOf("acceptance?<View style={contract.certificate}"), pdf.indexOf(":<><Text style={contract.clientLabel}"));
  assert.doesNotMatch(accepted, /fieldLine|signatureLine/);
});

test("Revision 3 send selects PDF while legacy send retains ZIP and dry-run remains supported", () => {
  assert.match(packets, /units\.length===1&&units\[0\]\.key==="client_agreement"/);
  assert.match(packets, /renderHandoffDocumentPdf/);
  assert.match(packets, /renderHandoffArchive/);
  assert.match(mail, /isEmailDryRunEnabled\(\)/);
  assert.match(mail, /pdfBuffer\?:Buffer/);
  assert.match(mail, /zipBuffer\?:Buffer/);
});
