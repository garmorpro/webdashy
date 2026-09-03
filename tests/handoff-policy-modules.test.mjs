import test from "node:test";
import assert from "node:assert/strict";
import {
  HANDOFF_POLICY_MODULES,
  assertRevision3IssuanceInvariant,
  carryForwardSelectedPolicyKeys,
  defaultHandoffPolicyKeys,
  normalizeSelectedPolicyKeys,
  normalizeSelectedPolicyKeysForSchema,
  selectedHandoffPolicyModules,
} from "../src/lib/services/handoff-policy-modules.mjs";
import { HANDOFF_ACCEPTANCE_TEXT, HANDOFF_REVISION_3_ACCEPTANCE_TEXT, HANDOFF_TEMPLATE_MODULES, HANDOFF_TEMPLATE_REVISION_3_MODULES, HANDOFF_TEMPLATE_REVIEW_NOTE } from "../src/lib/services/handoff-template-content.mjs";

test("Revision 3 contains exactly one required default Client Agreement", () => {
  assert.deepEqual(HANDOFF_TEMPLATE_REVISION_3_MODULES.map((item) => item.key), ["client_agreement"]);
  assert.equal(HANDOFF_TEMPLATE_REVISION_3_MODULES.every((item) => item.defaultIncluded), true);
  assert.equal(HANDOFF_TEMPLATE_REVISION_3_MODULES[0].required, true);
  assert.equal(HANDOFF_TEMPLATE_REVISION_3_MODULES[0].legalReviewRequired, true);
});

test("Revision 3 freezes both signing confirmations and the typed-name signature meaning",()=>{assert.match(HANDOFF_REVISION_3_ACCEPTANCE_TEXT,/authorized to accept this Agreement on behalf of \[Client Business Name\]/);assert.match(HANDOFF_REVISION_3_ACCEPTANCE_TEXT,/reviewed and agree to the Client Agreement/);assert.match(HANDOFF_REVISION_3_ACCEPTANCE_TEXT,/completed website and deliverables/);assert.match(HANDOFF_REVISION_3_ACCEPTANCE_TEXT,/typed full legal name is my electronic signature/);assert.doesNotMatch(HANDOFF_REVISION_3_ACCEPTANCE_TEXT,/documents included|packet version/i);});

test("new packet drafts select all core policy modules by default", () => {
  const defaults = defaultHandoffPolicyKeys();
  assert.equal(defaults.length, 9);
  assert.ok(defaults.includes("project_completion_summary"));
  assert.ok(defaults.includes("final_acceptance_sign_off"));
  assert.ok(!defaults.includes("hosting_deployment_handoff"));
});

test("optional policy modules can be toggled while required modules remain selected", () => {
  const selected = normalizeSelectedPolicyKeys(["hosting_deployment_handoff"]);
  assert.deepEqual(selected, ["final_acceptance_sign_off", "hosting_deployment_handoff"]);
});

test("selected modules preserve template content and exclude unselected modules", () => {
  const sections = HANDOFF_POLICY_MODULES.map((module) => ({ ...module, content: `Content for ${module.key}` }));
  const selected = selectedHandoffPolicyModules(sections, ["website_handoff_summary", "source_code_repository_handoff"]);
  assert.deepEqual(selected.map((module) => module.key), ["website_handoff_summary", "final_acceptance_sign_off", "source_code_repository_handoff"]);
  assert.equal(selected[0].content, "Content for website_handoff_summary");
  assert.ok(!selected.some((module) => module.key === "domain_ownership_renewal_agreement"));
});

test("Revision 3 Client Agreement cannot be deselected", () => {
  const selected = selectedHandoffPolicyModules(HANDOFF_TEMPLATE_REVISION_3_MODULES, []);
  assert.deepEqual(selected.map((item) => item.key), ["client_agreement"]);
});

test("Revision 3 correction normalizes a Packet v6-style legacy selection exactly", () => {
  assert.deepEqual(normalizeSelectedPolicyKeysForSchema(3, ["client_agreement", "final_acceptance_sign_off", "website_handoff_summary"]), ["client_agreement"]);
  assert.deepEqual(normalizeSelectedPolicyKeysForSchema(3, []), ["client_agreement"]);
});

test("Revision 3 issuance rejects any contaminated selection, section, or module list", () => {
  const agreement = { key: "client_agreement" };
  const legacy = { key: "final_acceptance_sign_off" };
  assert.doesNotThrow(() => assertRevision3IssuanceInvariant(3, ["client_agreement"], [agreement], [agreement]));
  assert.throws(() => assertRevision3IssuanceInvariant(3, ["client_agreement", "final_acceptance_sign_off"], [agreement], [agreement]), /selected policy\/document keys/);
  assert.throws(() => assertRevision3IssuanceInvariant(3, ["client_agreement"], [agreement, legacy], [agreement]), /snapshot\.sections keys/);
  assert.throws(() => assertRevision3IssuanceInvariant(3, ["client_agreement"], [agreement], [agreement, legacy]), /snapshot\.policyModules keys/);
});

test("Revision 1 and 2 retain historical required-module selection behavior", () => {
  assert.deepEqual(normalizeSelectedPolicyKeysForSchema(1, ["website_handoff_summary"]), ["website_handoff_summary", "final_acceptance_sign_off"]);
  assert.deepEqual(normalizeSelectedPolicyKeysForSchema(2, ["project_completion_summary"]), ["project_completion_summary", "final_acceptance_sign_off"]);
});

test("legacy template sections receive safe placeholder module content", () => {
  const selected = selectedHandoffPolicyModules([{ id: "project_summary", heading: "Legacy" }], ["project_completion_summary"]);
  assert.equal(selected[0].key, "project_completion_summary");
  assert.match(selected[0].content, /PLACEHOLDER ONLY/);
});

test("all default documents contain substantive structured draft content", () => {
  const defaults = HANDOFF_TEMPLATE_MODULES.filter((item) => item.defaultIncluded || item.required);
  assert.equal(defaults.length, 9);
  for (const item of defaults) {
    assert.ok(item.purpose.length > 60, item.key);
    assert.ok(item.sections.length >= 2, item.key);
    assert.ok(item.content.length > 300, item.key);
    assert.doesNotMatch(item.content, /PLACEHOLDER ONLY/i);
  }
});

test("all optional modules are usable and review status is revision data", () => {
  const optional = HANDOFF_TEMPLATE_MODULES.filter((item) => !item.defaultIncluded && !item.required);
  assert.equal(optional.length, 8);
  for (const item of optional) {
    assert.ok(item.sections.length >= 2, item.key);
    assert.equal(item.reviewNote, HANDOFF_TEMPLATE_REVIEW_NOTE);
  }
  assert.match(HANDOFF_ACCEPTANCE_TEXT, /immutable issued Agreement snapshot/);
});

test("new template content cannot mutate an already-issued v1 snapshot", () => {
  const issuedV1 = structuredClone({ policyModules: [{ key: "project_completion_summary", content: "Frozen Packet v1 wording" }] });
  const before = JSON.stringify(issuedV1);
  const revision2 = structuredClone(HANDOFF_TEMPLATE_MODULES);
  revision2[0].sections[0].paragraphs[0] = "Future revised wording";
  assert.equal(JSON.stringify(issuedV1), before);
});

test("latest-template versions carry forward only keys present in the new revision and enforce acceptance", () => {
  const revision2 = HANDOFF_TEMPLATE_MODULES.filter((item) => ["website_handoff_summary", "final_acceptance_sign_off"].includes(item.key));
  assert.deepEqual(carryForwardSelectedPolicyKeys(revision2, ["website_handoff_summary", "legacy_removed_module"]), ["website_handoff_summary", "final_acceptance_sign_off"]);
});

test("latest-template selection uses new bodies instead of immutable placeholder bodies", () => {
  const issuedV1 = [{ key: "website_handoff_summary", content: "PLACEHOLDER ONLY — frozen revision 1" }];
  const selectedKeys = carryForwardSelectedPolicyKeys(HANDOFF_TEMPLATE_MODULES, issuedV1.map((item) => item.key));
  const version2 = selectedHandoffPolicyModules(HANDOFF_TEMPLATE_MODULES, selectedKeys);
  assert.match(issuedV1[0].content, /PLACEHOLDER ONLY/);
  assert.doesNotMatch(version2.find((item) => item.key === "website_handoff_summary").content, /PLACEHOLDER ONLY/);
});
