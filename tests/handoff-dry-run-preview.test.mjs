import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createPublicToken, sha256 } from "../src/lib/services/handoff-packet-state.mjs";
import { handoffSendActionState, isSafeHandoffPreviewEnabled, transientHandoffSendResult } from "../src/lib/services/handoff-dry-run.mjs";

const source = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const packets = source("src/lib/services/handoff-packets.ts");
const action = source("src/lib/actions/handoff.ts");
const admin = source("src/components/admin/launch-handoff-section.tsx");
const publicService = source("src/lib/services/public-handoff.ts");

test("dry-run on an explicitly safe development host returns only a transient preview URL", () => {
  const token = createPublicToken();
  const previewUrl = `https://dev.webdashy.com/h/${token.rawToken}`;
  const attempt = { id: "attempt-1", status: "SENT" };
  const result = transientHandoffSendResult(attempt, previewUrl, { EMAIL_DRY_RUN: "true", SITE_URL: "https://dev.webdashy.com", NODE_ENV: "production" });
  assert.deepEqual(result, { attempt, dryRun: true, previewUrl });
  assert.equal(token.tokenHash, sha256(token.rawToken));
  assert.notEqual(token.tokenHash, token.rawToken);
});

test("production and non-dry-run environments never expose previewUrl", () => {
  const attempt = { id: "attempt-1" };
  for (const env of [
    { EMAIL_DRY_RUN: "false", SITE_URL: "https://dev.webdashy.com" },
    { EMAIL_DRY_RUN: "true", SITE_URL: "https://webdashy.com", NODE_ENV: "production" },
    { EMAIL_DRY_RUN: "true", SITE_URL: "https://unknown.example", NODE_ENV: "development" },
  ]) {
    assert.equal(isSafeHandoffPreviewEnabled(env), false);
    assert.deepEqual(transientHandoffSendResult(attempt, "https://example/h/plaintext", env), { attempt });
  }
});

test("resend rotates the transient URL and only the latest token hash remains valid", () => {
  const first = createPublicToken();
  const second = createPublicToken();
  assert.notEqual(first.rawToken, second.rawToken);
  assert.notEqual(first.tokenHash, second.tokenHash);
  const storedHashAfterResend = second.tokenHash;
  assert.notEqual(sha256(first.rawToken), storedHashAfterResend);
  assert.equal(sha256(second.rawToken), storedHashAfterResend);
});

test("initial send and resend action state preserve their newly returned preview URL", () => {
  const initial = handoffSendActionState({ dryRun: true, previewUrl: "https://dev.webdashy.com/h/initial-token" }, "sent");
  const resend = handoffSendActionState({ dryRun: true, previewUrl: "https://dev.webdashy.com/h/resend-token" }, "resent");
  assert.deepEqual(initial, { success: "sent", dryRun: true, previewUrl: "https://dev.webdashy.com/h/initial-token" });
  assert.deepEqual(resend, { success: "resent", dryRun: true, previewUrl: "https://dev.webdashy.com/h/resend-token" });
  assert.notEqual(initial.previewUrl, resend.previewUrl);
  assert.deepEqual(handoffSendActionState({}, "sent"), { success: "sent" });
});

test("send persistence and audit payloads contain hashes and IDs but never previewUrl or rawToken", () => {
  const persistence = packets.slice(packets.indexOf("export async function sendHandoffPacket"), packets.indexOf("export async function saveFinalLiveUrl"));
  const writes = [...persistence.matchAll(/handoff(?:Packet|EmailAttempt)\.(?:create|update|updateMany)[\s\S]*?(?=await|return|catch)/g)].map((match) => match[0]).join("\n");
  assert.match(persistence, /publicTokenHash:token\.tokenHash/);
  assert.match(persistence, /tokenPreview:token\.tokenPreview/);
  assert.doesNotMatch(writes, /previewUrl|rawToken/);
  assert.match(persistence, /metadata:\{kind,attemptId:attempt\.id\}/);
  assert.doesNotMatch(persistence, /metadata:\{[^}]*previewUrl|metadata:\{[^}]*rawToken/);
  assert.doesNotMatch(persistence, /console\.[a-z]+\([^)]*(?:url|token)/i);
});

test("send creates one token, atomically rotates the observed hash, and verifies the returned token hash", () => {
  const send = packets.slice(packets.indexOf("export async function sendHandoffPacket"), packets.indexOf("export async function saveFinalLiveUrl"));
  assert.equal((send.match(/createPublicToken\(\)/g) ?? []).length, 1);
  assert.match(send, /publicTokenHash:packet\.publicTokenHash/);
  assert.match(send, /publicTokenHash:token\.tokenHash/);
  assert.match(send, /current\.publicTokenHash!==sha256\(token\.rawToken\)/);
  assert.match(send, /where:\{id:packet\.id,publicTokenHash:token\.tokenHash\}/);
  assert.match(send, /rotated\.count!==1/);
  assert.match(send, /finalized\.count!==1/);
});

test("public lookup accepts active sent/viewed tokens and retains malformed and lifecycle rejection gates", () => {
  assert.match(publicService, /\^\[A-Za-z0-9_-\]\{43\}\$/);
  assert.match(publicService, /const tokenHash = hashHandoffToken\(rawToken\)/);
  assert.match(publicService, /findUnique\(\{ where: \{ publicTokenHash: tokenHash \}/);
  assert.match(publicService, /status: "SENT"/);
  assert.match(publicService, /status: "VIEWED"/);
  assert.match(publicService, /unavailableReason\(packet\)/);
  assert.match(publicService, /hashSnapshot\(packet\.snapshot\) !== packet\.snapshotHash/);
});

test("dry-run send invokes the real public validator before returning previewUrl", () => {
  const send = packets.slice(packets.indexOf("export async function sendHandoffPacket"), packets.indexOf("export async function saveFinalLiveUrl"));
  assert.match(send, /validatePublicHandoff\(token\.rawToken\)/);
  assert.match(send, /if\(!publicValidation\.result\)throw/);
  assert.ok(send.indexOf("validatePublicHandoff(token.rawToken)") < send.indexOf("transientHandoffSendResult(savedAttempt,url)"));
});

test("issuance persists the canonical Revision 3 schema version beside the immutable snapshot", () => {
  const issue = packets.slice(packets.indexOf("export async function issueHandoffPacket"), packets.indexOf("export async function sendHandoffPacket"));
  assert.match(issue, /canonicalSnapshotSchemaVersion\(packet\.templateRevision\.schemaVersion\)/);
  assert.ok(issue.indexOf("normalizeSelectedPolicyKeysForSchema") < issue.indexOf("const safeDraft = clean(draft)"));
  assert.match(issue, /const snapshot = \{ snapshotSchemaVersion,/);
  assert.match(issue, /validateSnapshotShape\(snapshot\)/);
  assert.ok(issue.indexOf("validateSnapshotShape(snapshot)") < issue.indexOf('status: "ISSUED"'));
  assert.match(issue, /data: \{ status: "ISSUED", snapshot, snapshotSchemaVersion, snapshotHash/);
  assert.match(issue, /snapshotSchemaVersionProblem\(issuedPacket\.snapshotSchemaVersion, issuedPacket\.snapshot\)/);
});

test("public validation reports a found packet's schema mismatch before schema or hash dispatch", () => {
  const lookup = publicService.slice(publicService.indexOf("export async function validatePublicHandoff"), publicService.indexOf("function failed"));
  const found = lookup.indexOf('if (!packet) return failed("TOKEN_HASH_NOT_FOUND"');
  const mismatch = lookup.indexOf("snapshotSchemaVersionProblem(packet.snapshotSchemaVersion, packet.snapshot)");
  const hash = lookup.indexOf("hashSnapshot(packet.snapshot)");
  assert.ok(found >= 0 && mismatch > found && hash > mismatch);
  assert.match(lookup, /return failed\(schemaVersionProblem, tokenHash, packet\.status\)/);
});

test("Revision 3 public page dispatches from the validated snapshot schema version", () => {
  const page = source("src/app/h/[token]/page.tsx");
  assert.match(page, /snapshot\.snapshotSchemaVersion===3/);
  assert.match(page, /Client Agreement/);
  assert.match(page, /AcceptanceForm/);
});

test("authenticated action passes the transient URL to the admin warning without rendering token text", () => {
  assert.match(action, /const actionState=handoffSendActionState\(sent/);
  assert.match(action, /revalidatePath[\s\S]*?return actionState/);
  assert.match(admin, /sendState\.dryRun&&sendState\.previewUrl/);
  assert.match(admin, /Open Client Signing Page/);
  assert.match(admin, /target="_blank"/);
  assert.doesNotMatch(admin, />\{sendState\.previewUrl\}</);
});
