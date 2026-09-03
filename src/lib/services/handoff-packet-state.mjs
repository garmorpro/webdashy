import { createHash, randomBytes } from "node:crypto";

export function canonicalize(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(",")}}`;
}

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function hashHandoffToken(rawToken) {
  return sha256(rawToken);
}

export function generateHandoffToken() {
  const rawToken = randomBytes(32).toString("base64url");
  return { rawToken, tokenHash: hashHandoffToken(rawToken), tokenPreview: rawToken.slice(0, 8) };
}

export function hashSnapshot(snapshot) {
  return sha256(canonicalize(snapshot));
}

export function createPublicToken() {
  return generateHandoffToken();
}

export function nextPacketVersion(packets) {
  return packets.reduce((highest, packet) => Math.max(highest, packet.version), 0) + 1;
}

export function reusableDraft(packets) {
  return packets.find((packet) => packet.status === "DRAFT" && !packet.supersededById) ?? null;
}

export function canSupersede(status) {
  return ["ISSUED", "SENT", "VIEWED"].includes(status);
}

export function unavailableReason(packet, now = new Date()) {
  if (!packet) return "unavailable";
  if (packet.status === "SUPERSEDED" || packet.supersededById) return "unavailable";
  if (packet.status === "REVOKED" || packet.tokenRevokedAt) return "unavailable";
  if (!packet.tokenExpiresAt || packet.tokenExpiresAt <= now) return "unavailable";
  return null;
}

export function canAccept(status) {
  return ["ISSUED", "SENT", "VIEWED"].includes(status);
}

export function nextViewStatus(status) {
  return status === "SENT" ? "VIEWED" : status;
}

export function completionProblems({ status, hasAcceptance, hasLiveUrl, checklist, careDisposition }) {
  const problems = [];
  if (status !== "ACCEPTED") problems.push("The active packet must be accepted.");
  if (!hasAcceptance) problems.push("The acceptance must belong to the active packet.");
  if (!hasLiveUrl) problems.push("Confirm the final live URL.");
  if (checklist.some((item) => item.required && item.status === "PENDING")) problems.push("Resolve every required checklist item.");
  if (!careDisposition) problems.push("Select a Client Care disposition.");
  return problems;
}
