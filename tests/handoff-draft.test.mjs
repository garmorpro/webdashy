import test from "node:test";
import assert from "node:assert/strict";
import {
  assertDraftEditable, guidedHandoffCompletion, mergeHandoffDraft, normalizeHandoffDraft,
  resolveChecklistDefaults, validateChecklistSubmission, validateHandoffDraft,
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
  const resolved = resolveChecklistDefaults(items, { liveUrl: "https://example.com", thirdPartyServices: [], analyticsCookies: "" });
  assert.equal(resolved.find((item) => item.key === "final_live_url").status, "COMPLETED");
  assert.equal(resolved.find((item) => item.key === "domain_ownership").status, "PENDING");
  assert.equal(resolved.find((item) => item.key === "third_party_services").status, "NOT_APPLICABLE");
  assert.equal(resolved.find((item) => item.key === "analytics_access").status, "NOT_APPLICABLE");
  assert.equal(resolved.find((item) => item.key === "forms_email_access").status, "NOT_APPLICABLE");
  assert.equal(resolved.find((item) => item.key === "github_access").status, "PENDING");
  assert.equal(resolved.find((item) => item.key === "netlify_access").status, "PENDING");
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
  assert.deepEqual(guidedHandoffCompletion(persisted, checklist), [true, false, false, false]);
});
