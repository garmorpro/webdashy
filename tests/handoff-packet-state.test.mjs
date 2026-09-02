import test from "node:test";
import assert from "node:assert/strict";
import { canonicalize, canSupersede, createPublicToken, hashSnapshot, nextPacketVersion, reusableDraft, sha256 } from "../src/lib/services/handoff-packet-state.mjs";
import { evaluateHandoffReadiness } from "../src/lib/services/handoff-readiness-state.mjs";

test("readiness reports every hard blocker", () => {
  const result = evaluateHandoffReadiness({ buildSetupConfirmed:false,websiteProvisioningSucceeded:false,netlifyProvisioningSucceeded:false,deliveryExists:false,deliveryReviewApproved:false,invoiceCount:0,unpaidInvoiceCount:0,recipientEmail:"",publishedTemplateExists:false,liveUrl:null,domainDetailsComplete:false,clientCareSelected:false,requiredChecklistPending:2 });
  assert.equal(result.blocked, true); assert.equal(result.checks.filter((c) => c.status === "BLOCKED").length, 9);
});
test("packet versions increment and an active draft is reused", () => { const packets = [{ version: 2,status:"ISSUED" },{ version: 3,status:"DRAFT",supersededById:null }]; assert.equal(nextPacketVersion(packets),4); assert.equal(reusableDraft(packets),packets[1]); });
test("canonical snapshot hashing is stable across key order", () => { const a={z:1,a:{d:2,b:[3,{y:true,x:null}]}}; const b={a:{b:[3,{x:null,y:true}],d:2},z:1}; assert.equal(canonicalize(a),canonicalize(b)); assert.equal(hashSnapshot(a),hashSnapshot(b)); });
test("public tokens use 32 random bytes and store-compatible hashes only", () => { const token=createPublicToken(); assert.ok(token.rawToken.length >= 43); assert.equal(token.tokenHash,sha256(token.rawToken)); assert.equal(token.tokenHash.length,64); assert.ok(!token.tokenHash.includes(token.rawToken)); });
test("only issued lifecycle packets can be corrected; accepted cannot", () => { assert.equal(canSupersede("ISSUED"),true); assert.equal(canSupersede("VIEWED"),true); assert.equal(canSupersede("ACCEPTED"),false); });
