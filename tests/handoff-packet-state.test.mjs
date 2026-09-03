import test from "node:test";
import assert from "node:assert/strict";
import { canonicalize, canAccept, canSupersede, completionProblems, createPublicToken, generateHandoffToken, hashHandoffToken, hashSnapshot, nextPacketVersion, nextViewStatus, reusableDraft, sha256, unavailableReason } from "../src/lib/services/handoff-packet-state.mjs";
import { evaluateHandoffReadiness } from "../src/lib/services/handoff-readiness-state.mjs";
import { canonicalSnapshotSchemaVersion, isSnapshotShapeValid, revision3LegacySelectionIssue, snapshotSchemaVersionProblem, validateRevision3Snapshot, validateSnapshotShape } from "../src/lib/services/handoff-snapshot-schema.mjs";

const agreement = { key:"client_agreement", title:"Client Agreement", subtitle:"Project terms", required:true, legalReviewRequired:true, contentStrategy:"PROJECT_FACTS_V2", sections:[{heading:"1. Project and Parties",paragraphs:["Agreement terms"]}] };
const revision3Snapshot = (draftData = {selectedPolicyKeys:["client_agreement"],projectSummary:{projectName:"Test project"}}) => ({snapshotSchemaVersion:3,issuedAt:"2026-09-03T00:00:00.000Z",packet:{id:"packet-v7",version:7},recipient:{name:"Test Client",email:"client@example.com"},acceptanceText:"I accept this Client Agreement",draftData,template:{id:"template",slug:"client-handoff",revisionId:"revision-3",revision:3,schemaVersion:3},sections:[structuredClone(agreement)],policyModules:[structuredClone(agreement)],handoffFacts:{factModelVersion:2}});

test("readiness reports every hard blocker", () => {
  const result = evaluateHandoffReadiness({ buildSetupConfirmed:false,websiteProvisioningSucceeded:false,netlifyProvisioningSucceeded:false,deliveryExists:false,deliveryReviewApproved:false,invoiceCount:0,unpaidInvoiceCount:0,recipientEmail:"",publishedTemplateExists:false,liveUrl:null,domainDetailsComplete:false,clientCareSelected:false,requiredChecklistPending:2 });
  assert.equal(result.blocked, true); assert.equal(result.checks.filter((c) => c.status === "BLOCKED").length, 9);
});
test("packet versions increment and an active draft is reused", () => { const packets = [{ version: 2,status:"ISSUED" },{ version: 3,status:"DRAFT",supersededById:null }]; assert.equal(nextPacketVersion(packets),4); assert.equal(reusableDraft(packets),packets[1]); });
test("canonical snapshot hashing is stable across key order", () => { const a={z:1,a:{d:2,b:[3,{y:true,x:null}]}}; const b={a:{b:[3,{x:null,y:true}],d:2},z:1}; assert.equal(canonicalize(a),canonicalize(b)); assert.equal(hashSnapshot(a),hashSnapshot(b)); });
test("public tokens use 32 random bytes and store-compatible hashes only", () => { const token=createPublicToken(); assert.ok(token.rawToken.length >= 43); assert.equal(token.tokenHash,sha256(token.rawToken)); assert.equal(token.tokenHash.length,64); assert.ok(!token.tokenHash.includes(token.rawToken)); });
test("send and public validation share canonical URL-safe token helpers",()=>{const token=generateHandoffToken();assert.match(token.rawToken,/^[A-Za-z0-9_-]{43}$/);assert.equal(hashHandoffToken(token.rawToken),token.tokenHash);assert.equal(createPublicToken().rawToken.length,43);});
test("only issued lifecycle packets can be versioned; accepted and immutable terminal packets cannot", () => { assert.equal(canSupersede("ISSUED"),true); assert.equal(canSupersede("VIEWED"),true); assert.equal(canSupersede("ACCEPTED"),false); assert.equal(canSupersede("SUPERSEDED"),false); });
test("public lookup rejects expired, revoked, and superseded packets",()=>{const future=new Date("2030-01-01");const base={status:"SENT",tokenExpiresAt:new Date("2031-01-01"),tokenRevokedAt:null,supersededById:null};assert.equal(unavailableReason(base,future),null);assert.equal(unavailableReason({...base,tokenExpiresAt:new Date("2029-01-01")},future),"unavailable");assert.equal(unavailableReason({...base,tokenRevokedAt:new Date()},future),"unavailable");assert.equal(unavailableReason({...base,status:"SUPERSEDED"},future),"unavailable");});
test("first sent view advances to viewed without changing other states",()=>{assert.equal(nextViewStatus("SENT"),"VIEWED");assert.equal(nextViewStatus("VIEWED"),"VIEWED");assert.equal(nextViewStatus("ACCEPTED"),"ACCEPTED");});
test("acceptance permits only active pre-acceptance lifecycle states",()=>{assert.equal(canAccept("ISSUED"),true);assert.equal(canAccept("SENT"),true);assert.equal(canAccept("VIEWED"),true);assert.equal(canAccept("ACCEPTED"),false);});
test("completion gates all required business facts",()=>{const ok={status:"ACCEPTED",hasAcceptance:true,hasLiveUrl:true,checklist:[{required:true,status:"COMPLETED"}],careDisposition:"ENROLLED"};assert.deepEqual(completionProblems(ok),[]);assert.equal(completionProblems({...ok,hasLiveUrl:false}).length,1);assert.equal(completionProblems({...ok,checklist:[{required:true,status:"PENDING"}]}).length,1);});
test("snapshot schema format is selected independently from revision number",()=>{
  assert.equal(canonicalSnapshotSchemaVersion(1),1);
  assert.equal(canonicalSnapshotSchemaVersion(2),2);
  assert.equal(canonicalSnapshotSchemaVersion(3),3);
  assert.throws(()=>canonicalSnapshotSchemaVersion(4),/Unsupported handoff snapshot schema version/);
});
test("Revision 3 snapshot schema mismatch is classified after token lookup",()=>{
  const snapshot=revision3Snapshot();
  assert.equal(snapshotSchemaVersionProblem(1,snapshot),"SNAPSHOT_SCHEMA_VERSION_MISMATCH");
  assert.equal(snapshotSchemaVersionProblem(3,snapshot),null);
  assert.equal(isSnapshotShapeValid(snapshot),true);
});
test("Revision 3 snapshot shape rejects Packet v6-style legacy contamination",()=>{
  const legacy={...agreement,key:"final_acceptance_sign_off"}, valid=revision3Snapshot();
  assert.equal(isSnapshotShapeValid(valid),true);
  assert.equal(isSnapshotShapeValid({...valid,sections:[agreement,legacy]}),false);
  assert.equal(isSnapshotShapeValid({...valid,policyModules:[agreement,legacy]}),false);
});
test("Packet v7 regression identifies the issuer defect but accepts its authoritative single agreement",()=>{
  const packetV7=revision3Snapshot({selectedPolicyKeys:["client_agreement","final_acceptance_sign_off"],projectSummary:{projectName:"Test project"}});
  assert.deepEqual(revision3LegacySelectionIssue(packetV7),{valid:false,schemaPath:"draftData.selectedPolicyKeys[1]",schemaIssue:"legacy document selection was frozen before Revision 3 normalization"});
  assert.equal(validateRevision3Snapshot(packetV7).valid,true);
});
test("Revision 3 gives an exact path for malformed structured agreement content",()=>{
  const malformed=revision3Snapshot(); malformed.policyModules[0].sections=[];
  assert.deepEqual(validateSnapshotShape(malformed),{valid:false,schemaPath:"policyModules[0].sections",schemaIssue:"client_agreement module is missing required structured content"});
});
test("Revision 3 requires one Client Agreement and no Final Acceptance document",()=>{
  const valid=revision3Snapshot();
  assert.equal(validateRevision3Snapshot(valid).valid,true);
  assert.equal(valid.policyModules.some(({key})=>key==="final_acceptance_sign_off"),false);
});
test("historical schema 1 and 2 snapshot shapes remain supported",()=>{
  assert.equal(isSnapshotShapeValid({snapshotSchemaVersion:1,packet:{id:"v1"},acceptanceText:"Accept",draftData:{},checklist:[]}),true);
  assert.equal(isSnapshotShapeValid({snapshotSchemaVersion:2,packet:{id:"v2"},acceptanceText:"Accept",draftData:{},policyModules:[]}),true);
});
