import { createHash, randomBytes } from "node:crypto";

export function canonicalize(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(",")}}`;
}

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function hashSnapshot(snapshot) {
  return sha256(canonicalize(snapshot));
}

export function createPublicToken() {
  const rawToken = randomBytes(32).toString("base64url");
  return { rawToken, tokenHash: sha256(rawToken), tokenPreview: rawToken.slice(0, 8) };
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
