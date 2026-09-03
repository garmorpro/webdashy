import test from "node:test";
import assert from "node:assert/strict";
import { revision3AgreementState } from "../src/lib/services/handoff-agreement-state.mjs";

const state = (status, extra = {}) => revision3AgreementState({ status, acceptance: null, firstSentAt: null, emailAttempts: [], ...extra }).label;

test("Revision 3 agreement status mapping is explicit", () => {
  assert.equal(state("DRAFT"), "Draft Agreement");
  assert.equal(state("ISSUED"), "Issued");
  assert.equal(state("SENT", { firstSentAt: "2026-09-03T11:52:00Z" }), "Awaiting Signature");
  assert.equal(state("VIEWED", { firstSentAt: "2026-09-03T11:52:00Z" }), "Awaiting Signature");
  assert.equal(state("ACCEPTED", { acceptance: { typedName: "Garrett Morgan" } }), "Signed");
  assert.equal(state("COMPLETED", { acceptance: { typedName: "Garrett Morgan" } }), "Completed");
  assert.equal(state("ISSUED", { emailAttempts: [{ status: "FAILED" }] }), "Delivery Failed");
});
