import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildHandoffProjectFacts, handoffDocumentRecommendations, recommendedHandoffPolicyKeys } from "../src/lib/services/handoff-project-facts.mjs";
import { personalizeHandoffModule } from "../src/lib/services/handoff-document-content.mjs";
import { HANDOFF_TEMPLATE_REVISION_3_MODULES } from "../src/lib/services/handoff-template-content.mjs";

const draft = (overrides = {}) => ({
  projectSummary: { clientBusinessName: "Uribe Construction", clientName: "Test Client", projectName: "Uribe Construction Website", approvedDate: "2026-09-01", paymentCompletionDate: "2026-09-01" },
  websiteLaunch: { liveUrl: "https://uribeconstruction.com", launchDate: "2026-09-01", status: "LAUNCHED" },
  domain: { primaryDomain: "uribeconstruction.com", owner: "Uribe Construction", registrar: "Cloudflare", dnsManager: "Cloudflare", renewalResponsibility: "Uribe Construction" },
  hosting: { provider: "Netlify", siteName: "uribe-construction", owner: "WebDashy" },
  sourceCode: { repositoryUrl: "https://github.com/WebDashy/client-uribe-construction", owner: "WebDashy", visibility: "PRIVATE", clientAccessStatus: "Available by invitation" },
  projectRequirements: { pages: ["Home", "Services", "Contact"], features: ["Responsive website", "Contact form"] },
  thirdPartyServices: [{ service: "Netlify", purpose: "Deployment", accountOwner: "WebDashy", billingOwner: "WebDashy", dataHandled: "Operational logs" }],
  privacyDataCompliance: { formsDataCollected: "Contact form submissions are sent to the client.", analyticsCookies: "" },
  maintenanceSupport: { clientCareDisposition: "DECLINED", supportEmail: "support@webdashy.com" },
  warranty: { startDate: "2026-09-01", endDate: "2026-09-30" },
  ...overrides,
});
const moduleFor = (key) => HANDOFF_TEMPLATE_REVISION_3_MODULES.find((item) => item.key === key);
const rendered = (key, facts) => JSON.stringify(personalizeHandoffModule(moduleFor(key), facts, { reference: "packet-3" }));

test("project facts normalize trusted client, project, delivery, service, and history data", () => {
  const facts = buildHandoffProjectFacts(draft(), { issuedAt: "2026-09-02T12:00:00Z" });
  assert.equal(facts.client.businessName, "Uribe Construction");
  assert.equal(facts.project.name, "Uribe Construction Website");
  assert.equal(facts.website.liveUrl, "https://uribeconstruction.com");
  assert.equal(facts.technical.services[0].service, "Netlify");
  assert.equal(facts.warranty.endDate, "2026-09-30");
});

test("Client Agreement uses project-specific facts and does not invent services", () => {
  const facts = buildHandoffProjectFacts(draft());
  const body = rendered("client_agreement", facts);
  assert.match(body, /Uribe Construction/);
  assert.match(body, /uribeconstruction\.com/);
  assert.match(rendered("client_agreement", facts), /Netlify/);
  assert.doesNotMatch(rendered("client_agreement", facts), /Google Analytics/);
});

test("Client Agreement absorbs applicable ownership, domain, repository, hosting, and service facts", () => {
  const withFeatures = buildHandoffProjectFacts(draft());
  const agreement = rendered("client_agreement", withFeatures);
  for (const phrase of ["Ownership of deliverables", "uribeconstruction.com", "client-uribe-construction", "Netlify", "hosting and deployment"]) assert.match(agreement, new RegExp(phrase, "i"));
  assert.match(agreement, /final approval was recorded on September 1, 2026/i);
  assert.match(agreement, /final payment for the Project was received on September 1, 2026/i);
  assert.match(agreement, /16\. Electronic Acceptance/);
});

test("Client Agreement opening contains compact available project information", () => {
  const agreement = personalizeHandoffModule(moduleFor("client_agreement"), buildHandoffProjectFacts(draft()), { reference: "packet-3" });
  assert.match(agreement.introduction, /entered into as of the Effective Date by and between WebDashy/);
  assert.deepEqual(agreement.sections[0].facts.map(({ label, value }) => [label, value]), [
    ["Client", "Uribe Construction"], ["Client Contact", "Test Client"], ["Project", "Uribe Construction Website"],
    ["Website", "https://uribeconstruction.com"], ["Domain", "uribeconstruction.com"],
  ]);

  const issued = personalizeHandoffModule(moduleFor("client_agreement"), buildHandoffProjectFacts(draft(), { issuedAt: "2026-09-02T12:00:00Z" }));
  assert.deepEqual(issued.sections[0].facts.at(-1), { label: "Effective Date", value: "September 2, 2026" });
  const sparse = personalizeHandoffModule(moduleFor("client_agreement"), buildHandoffProjectFacts(draft({ websiteLaunch: {}, domain: {} })));
  assert.deepEqual(sparse.sections[0].facts.map(({ label }) => label), ["Client", "Client Contact", "Project"]);
});

test("default repository language preserves WebDashy control without automatic GitHub access", () => {
  const agreement = rendered("client_agreement", buildHandoffProjectFacts(draft()));
  assert.match(agreement, /currently maintained by WebDashy in the project repository client-uribe-construction/);
  assert.match(agreement, /does not automatically receive ownership of or access to WebDashy’s GitHub organization/);
  assert.match(agreement, /may agree in writing to transfer ownership or provide an alternative source-code handoff arrangement/);
  assert.match(agreement, /pre-existing templates, frameworks, libraries, reusable components, internal systems, credentials/);
  assert.doesNotMatch(agreement, /repository visibility|Available by invitation/);
});

test("an explicit future client repository transfer overrides default custody wording", () => {
  const facts = buildHandoffProjectFacts(draft({ sourceCode: {
    repositoryUrl: "https://github.com/Uribe-Construction/website",
    owner: "Uribe Construction",
    clientAccessStatus: "Ownership transferred to Client",
  } }));
  const agreement = rendered("client_agreement", facts);
  assert.match(agreement, /owned by Uribe Construction/);
  assert.match(agreement, /recorded transfer changes repository custody only/);
  assert.doesNotMatch(agreement, /currently maintained by WebDashy/);
  assert.match(agreement, /does not transfer WebDashy’s pre-existing templates/);
});

test("repository, hosting, and domain clauses appear only when supported", () => {
  const sparse = rendered("client_agreement", buildHandoffProjectFacts(draft({ sourceCode: {}, hosting: {}, domain: {}, websiteLaunch: {} })));
  assert.doesNotMatch(sparse, /4\. Source Code and Repository/);
  assert.doesNotMatch(sparse, /5\. Hosting and Deployment/);
  assert.doesNotMatch(sparse, /6\. Domain Name and DNS/);
});

test("Client Care wording changes for every disposition", () => {
  const phrases = { ENROLLED: /is enrolled/, INCLUDED: /is included/, DECLINED: /declined/ };
  for (const [disposition, phrase] of Object.entries(phrases)) {
    const facts = buildHandoffProjectFacts(draft({ maintenanceSupport: { clientCareDisposition: disposition } }));
    assert.match(rendered("client_agreement", facts), phrase);
  }
  const notApplicable = rendered("client_agreement", buildHandoffProjectFacts(draft({ maintenanceSupport: { clientCareDisposition: "NOT_APPLICABLE" } })));
  assert.doesNotMatch(notApplicable, /Maintenance and Client Care/);
});

test("Revision 3 recommends only the required Client Agreement", () => {
  const facts = buildHandoffProjectFacts(draft({ privacyDataCompliance: { formsDataCollected: "Contact form", analyticsCookies: "Google Analytics" }, maintenanceSupport: { clientCareDisposition: "ENROLLED" } }));
  const groups = handoffDocumentRecommendations(facts);
  assert.deepEqual(groups.recommended, ["client_agreement"]);
  assert.deepEqual(recommendedHandoffPolicyKeys(facts), groups.recommended);
  assert.equal(HANDOFF_TEMPLATE_REVISION_3_MODULES.find((item) => item.key === "client_agreement").required, true);
});

test("warranty, forms, and analytics clauses appear only from actual facts", () => {
  const full = buildHandoffProjectFacts(draft({ privacyDataCompliance: { formsDataCollected: "Contact form submissions", analyticsCookies: "Plausible Analytics" } }));
  assert.match(rendered("client_agreement", full), /Warranty and Post-Launch Corrections/);
  assert.match(rendered("client_agreement", full), /forms or customer information/i);
  assert.match(rendered("client_agreement", full), /analytics or cookie functionality/i);
  const sparse = buildHandoffProjectFacts(draft({ warranty: {}, privacyDataCompliance: {}, projectRequirements: { pages: ["Home"], features: [] }, thirdPartyServices: [] }));
  assert.doesNotMatch(rendered("client_agreement", sparse), /Warranty and post-launch support/);
  assert.doesNotMatch(rendered("client_agreement", sparse), /forms or customer information/i);
  assert.doesNotMatch(rendered("client_agreement", sparse), /analytics or cookie functionality/i);
});

test("Revision 3 seed is additive and immutable snapshots remain the issuance source", async () => {
  const [seed, packetService, previewRoute] = await Promise.all([
    readFile(new URL("../prisma/seed.mjs", import.meta.url), "utf8"),
    readFile(new URL("../src/lib/services/handoff-packets.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/app/api/handoff/[id]/documents/[documentKey]/route.ts", import.meta.url), "utf8"),
  ]);
  assert.match(seed, /revision: 1[\s\S]*?update: \{\}/);
  assert.match(seed, /revision: 2[\s\S]*?update: \{\}/);
  assert.match(seed, /revision: 3[\s\S]*?status: "DRAFT"[\s\S]*?schemaVersion: 3/);
  assert.match(seed, /revision3\.status === "DRAFT"/);
  assert.match(packetService, /handoffFacts[\s\S]*?hashSnapshot\(snapshot\)/);
  assert.match(previewRoute, /templateRevision[\s\S]*?buildDraftHandoffPreview/);
});
