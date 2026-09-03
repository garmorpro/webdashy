import test from "node:test";
import assert from "node:assert/strict";
import {
  assertDraftEditable, canNavigateToHandoffStep, guidedHandoffCompletion, handoffWizardStepAfterSave, initialHandoffWizardStep, mergeHandoffDraft, normalizeHandoffDraft,
  normalizeHandoffDate,
  resolveChecklistDefaults, shouldUseEditableHandoffWizard, validateChecklistSubmission, validateHandoffDraft,
  validateHandoffWizardStep,
} from "../src/lib/services/handoff-draft-state.mjs";

function validDraft() {
  return normalizeHandoffDraft({
    websiteLaunch: { status: "PENDING_LAUNCH" },
    sourceCode: { visibility: "PRIVATE" },
    maintenanceSupport: { clientCareDisposition: "" },
  });
}

test("normalizes missing, null, partial, and older draft sections safely", () => {
  const draft = normalizeHandoffDraft({ projectSummary: null, privacyDataCompliance: { operationalFacts: "Legacy" }, thirdPartyServices: [null, { service: "CRM" }] });
  assert.equal(draft.projectSummary.projectName, "");
  assert.equal(draft.privacyDataCompliance.operationalFacts, "Legacy");
  assert.equal(draft.privacyDataCompliance.formsDataCollected, "");
  assert.equal(draft.thirdPartyServices.length, 2);
  assert.equal(draft.thirdPartyServices[0]._legacyValue, null);
  assert.equal(draft.thirdPartyServices[1].service, "CRM");
});

test("normalizes trusted legacy ISO dates to their UTC calendar date", () => {
  const draft = normalizeHandoffDraft({
    projectSummary: {
      approvedDate: "2026-09-01T17:45:00.000Z",
      paymentCompletionDate: "2026-09-02T00:30:00+02:00",
    },
    websiteLaunch: { launchDate: "2026-09-03T23:30:00-02:00" },
    warranty: {
      startDate: "2026-09-04T12:00:00.000Z",
      endDate: "2026-09-05T12:00:00.000Z",
    },
  });
  assert.equal(draft.projectSummary.approvedDate, "2026-09-01");
  assert.equal(draft.projectSummary.paymentCompletionDate, "2026-09-01");
  assert.equal(draft.websiteLaunch.launchDate, "2026-09-04");
  assert.equal(draft.warranty.startDate, "2026-09-04");
  assert.equal(draft.warranty.endDate, "2026-09-05");
});

test("date normalization allows nulls, preserves date-only values, and retains malformed input for rejection", () => {
  assert.equal(normalizeHandoffDate(null), "");
  assert.equal(normalizeHandoffDate(undefined), "");
  assert.equal(normalizeHandoffDate("2026-09-01"), "2026-09-01");
  assert.equal(normalizeHandoffDate("not-a-date"), "not-a-date");
  assert.equal(normalizeHandoffDate("2026-02-30T12:00:00.000Z"), "2026-02-30T12:00:00.000Z");
  const malformed = normalizeHandoffDraft({ projectSummary: { approvedDate: "not-a-date" } });
  assert.throws(() => validateHandoffDraft(malformed), /approvedDate must use YYYY-MM-DD/);
  const impossible = normalizeHandoffDraft({ projectSummary: { approvedDate: "2026-02-30T12:00:00.000Z" } });
  assert.throws(() => validateHandoffDraft(impossible), /approvedDate must use YYYY-MM-DD/);
});

test("legacy Packet v1 dates can reach review and issuance uses canonical dates", () => {
  const packetV1 = validDraft();
  packetV1.selectedPolicyKeys = ["final_acceptance_sign_off"];
  packetV1.projectSummary.approvedDate = "2026-09-01T17:45:00.000Z";
  packetV1.projectSummary.paymentCompletionDate = "2026-09-02T02:00:00.000Z";
  packetV1.websiteLaunch.launchDate = "2026-09-03T08:00:00.000Z";
  packetV1.warranty.startDate = "2026-09-04T08:00:00.000Z";
  packetV1.warranty.endDate = "2026-09-05T08:00:00.000Z";
  const canonical = normalizeHandoffDraft(packetV1);
  assert.doesNotThrow(() => validateHandoffWizardStep(canonical, 1));
  assert.doesNotThrow(() => validateHandoffWizardStep(canonical, 2));
  assert.doesNotThrow(() => validateHandoffWizardStep(canonical, 3));
  assert.doesNotThrow(() => validateHandoffDraft(canonical));
  assert.equal(canonical.projectSummary.approvedDate, "2026-09-01");
  assert.equal(canonical.projectSummary.paymentCompletionDate, "2026-09-02");
  assert.equal(canonical.websiteLaunch.launchDate, "2026-09-03");
  assert.equal(canonical.warranty.startDate, "2026-09-04");
  assert.equal(canonical.warranty.endDate, "2026-09-05");
});

test("merge preserves unknown top-level, nested, and existing row properties", () => {
  const current = { future: { enabled: true }, domain: { registrar: "Old", historical: 42 }, thirdPartyServices: [{ service: "CRM", historicalId: "a" }, { service: "Email", historicalId: "b" }] };
  const edits = validDraft(); edits.domain.registrar = "New"; edits.thirdPartyServices = [{ service: "Email updated", purpose: "", accountOwner: "", billingOwner: "", dataHandled: "", sourceIndex: 1 }];
  const merged = mergeHandoffDraft(current, edits);
  assert.deepEqual(merged.future, { enabled: true });
  assert.equal(merged.domain.historical, 42);
  assert.equal(merged.domain.registrar, "New");
  assert.equal(merged.thirdPartyServices[0].historicalId, "b");
});

test("sparse edits preserve trusted recognized fields omitted by the browser", () => {
  const current = validDraft(); current.projectSummary.clientBusinessName = "Trusted Client"; current.websiteLaunch.stagingUrl = "https://staging.example.com";
  const merged = mergeHandoffDraft(current, { websiteLaunch: { liveUrl: "https://example.com" }, thirdPartyServices: [] });
  assert.equal(merged.projectSummary.clientBusinessName, "Trusted Client");
  assert.equal(merged.websiteLaunch.stagingUrl, "https://staging.example.com");
  assert.equal(merged.websiteLaunch.liveUrl, "https://example.com");
});

test("validates third-party service row structure and length", () => {
  const draft = validDraft(); draft.thirdPartyServices = [{ service: "CRM" }];
  assert.throws(() => validateHandoffDraft(draft), /purpose must be text/);
});

test("validates URL and date fields", () => {
  const invalidUrl = validDraft(); invalidUrl.websiteLaunch.stagingUrl = "ftp://example.com";
  assert.throws(() => validateHandoffDraft(invalidUrl), /Invalid URL/);
  const invalidDate = validDraft(); invalidDate.warranty.startDate = "2026-02-30";
  assert.throws(() => validateHandoffDraft(invalidDate), /not a valid date/);
  const timestamp = validDraft(); timestamp.warranty.startDate = "2026-09-02T00:00:00.000Z";
  assert.throws(() => validateHandoffDraft(timestamp), /YYYY-MM-DD/);
});

test("Step 1 accepts legacy nullable optional fields", () => {
  for (const legacy of [
    { adminNote: null, websiteLaunch: { liveUrl: null } },
    { websiteLaunch: { liveUrl: null } },
    { adminNote: null, websiteLaunch: null, domain: null, maintenanceSupport: null, warranty: null },
  ]) {
    const draft = { ...legacy, selectedPolicyKeys: ["final_acceptance_sign_off"] };
    assert.doesNotThrow(() => validateHandoffWizardStep(draft, 1));
  }
});

test("Step 2 accepts an empty admin note and rejects one over 5000 characters", () => {
  const empty = validDraft(); empty.adminNote = "";
  assert.doesNotThrow(() => validateHandoffWizardStep(empty, 2));
  const long = validDraft(); long.adminNote = "x".repeat(5001);
  assert.throws(() => validateHandoffWizardStep(long, 2), /Admin note/);
});

test("review validation does not inspect unrelated edit fields", () => {
  assert.doesNotThrow(() => validateHandoffWizardStep({ adminNote: 42 }, 3));
});

test("full issuance validation remains strict", () => {
  const draft = validDraft(); draft.adminNote = "x".repeat(5001);
  assert.throws(() => validateHandoffDraft(draft), /Admin note/);
});

test("rejects invalid select values", () => {
  const launch = validDraft(); launch.websiteLaunch.status = "UNKNOWN";
  assert.throws(() => validateHandoffDraft(launch), /launch status/);
  const visibility = validDraft(); visibility.sourceCode.visibility = "SECRET";
  assert.throws(() => validateHandoffDraft(visibility), /visibility/);
  const care = validDraft(); care.maintenanceSupport.clientCareDisposition = "MAYBE";
  assert.throws(() => validateHandoffDraft(care), /Client Care/);
});

test("rejects cross-packet checklist IDs and malformed checklist payloads", () => {
  const owned = new Set(["owned"]);
  assert.throws(() => validateChecklistSubmission([{ id: "other", status: "PENDING", note: "" }], owned), /Invalid checklist item/);
  assert.throws(() => validateChecklistSubmission([{ id: "owned", status: "NOPE", note: "" }], owned), /Invalid checklist status/);
  assert.throws(() => validateChecklistSubmission([{ id: "owned", status: "PENDING" }], owned), /Invalid checklist data/);
});

test("issued packets cannot be edited", () => {
  assert.doesNotThrow(() => assertDraftEditable("DRAFT"));
  assert.throws(() => assertDraftEditable("ISSUED"), /immutable/);
  assert.throws(() => assertDraftEditable("VIEWED"), /immutable/);
});

test("secret-looking fields remain rejected recursively", () => {
  for (const key of ["password", "secret", "token", "apiKey", "privateKey", "credentials"]) {
    const draft = validDraft(); draft.domain[key] = "do-not-store";
    assert.throws(() => validateHandoffDraft(draft), /Secret-looking/);
  }
});

test("smart checklist resolves only facts supported by trusted data", () => {
  const items = [
    { id: "live", key: "final_live_url", status: "PENDING" },
    { id: "domain", key: "domain_ownership", status: "PENDING" },
    { id: "services", key: "third_party_services", status: "PENDING" },
    { id: "analytics", key: "analytics_access", status: "PENDING" },
    { id: "forms", key: "forms_email_access", status: "PENDING" },
    { id: "github", key: "github_access", status: "PENDING" },
    { id: "netlify", key: "netlify_access", status: "PENDING" },
  ];
  items.push({ id: "care", key: "client_care_selection", status: "PENDING" });
  const resolved = resolveChecklistDefaults(items, { liveUrl: "https://example.com", thirdPartyServices: [], analyticsCookies: "", websiteProvisioningSucceeded: true, netlifyProvisioningSucceeded: true, clientCareDisposition: "ENROLLED" });
  assert.equal(resolved.find((item) => item.key === "final_live_url").status, "COMPLETED");
  assert.equal(resolved.find((item) => item.key === "domain_ownership").status, "PENDING");
  assert.equal(resolved.find((item) => item.key === "third_party_services").status, "NOT_APPLICABLE");
  assert.equal(resolved.find((item) => item.key === "analytics_access").status, "NOT_APPLICABLE");
  assert.equal(resolved.find((item) => item.key === "forms_email_access").status, "NOT_APPLICABLE");
  assert.equal(resolved.find((item) => item.key === "github_access").status, "COMPLETED");
  assert.equal(resolved.find((item) => item.key === "netlify_access").status, "COMPLETED");
  assert.equal(resolved.find((item) => item.key === "client_care_selection").status, "COMPLETED");
});

test("smart checklist does not overwrite an existing packet decision", () => {
  const items = [{ id: "services", key: "third_party_services", status: "WAIVED" }];
  assert.equal(resolveChecklistDefaults(items, { liveUrl: null, thirdPartyServices: [], analyticsCookies: "" })[0].status, "WAIVED");
});

test("guided completion changes only when persisted draft data changes", () => {
  const persisted = validDraft(), checklist = [{ key: "final_live_url", required: true, status: "PENDING" }];
  const unsavedLocalValues = { liveUrl: "https://example.com", status: "LAUNCHED" };
  assert.deepEqual(guidedHandoffCompletion(persisted, checklist), [false, false, false, false]);
  assert.equal(unsavedLocalValues.liveUrl, "https://example.com");
  persisted.websiteLaunch.liveUrl = unsavedLocalValues.liveUrl;
  persisted.websiteLaunch.status = unsavedLocalValues.status;
  assert.deepEqual(guidedHandoffCompletion(persisted, checklist), [false, false, false, false]);
  checklist[0].status = "COMPLETED";
  assert.deepEqual(guidedHandoffCompletion(persisted, checklist), [true, false, false, false]);
});

test("launch step accepts every resolved final URL checklist status", () => {
  const draft = validDraft();
  draft.websiteLaunch.liveUrl = "https://example.com";
  draft.websiteLaunch.status = "READY_TO_LAUNCH";
  for (const status of ["COMPLETED", "WAIVED", "NOT_APPLICABLE"]) {
    assert.equal(guidedHandoffCompletion(draft, [{ key: "final_live_url", required: true, status }])[0], true);
  }
});

test("wizard selects the first incomplete persisted step", () => {
  assert.equal(initialHandoffWizardStep([false, false, false, false]), 1);
  assert.equal(initialHandoffWizardStep([true, false, false, false]), 2);
  assert.equal(initialHandoffWizardStep([true, true, false, false]), 3);
  assert.equal(initialHandoffWizardStep([true, true, true, false]), 4);
});

test("wizard advances steps 1 through 3 only after a successful complete save", () => {
  assert.equal(handoffWizardStepAfterSave(1, [true, false, false, false], true), 2);
  assert.equal(handoffWizardStepAfterSave(2, [true, true, false, false], true), 3);
  assert.equal(handoffWizardStepAfterSave(3, [true, true, true, false], true), 4);
  assert.equal(handoffWizardStepAfterSave(1, [false, false, false, false], true), 1);
  assert.equal(handoffWizardStepAfterSave(1, [true, false, false, false], false), 1);
});

test("wizard permits backward navigation only to completed steps", () => {
  const completion = [true, true, false, false];
  assert.equal(canNavigateToHandoffStep(1, 3, completion), true);
  assert.equal(canNavigateToHandoffStep(2, 3, completion), true);
  assert.equal(canNavigateToHandoffStep(4, 3, completion), false);
});

test("issued lifecycle states bypass the editable wizard", () => {
  assert.equal(shouldUseEditableHandoffWizard("DRAFT"), true);
  for (const status of ["ISSUED", "SENT", "VIEWED", "ACCEPTED", "COMPLETED"]) assert.equal(shouldUseEditableHandoffWizard(status), false);
});
