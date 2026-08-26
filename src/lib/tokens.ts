import { randomBytes, createHash } from "crypto";
import { slugify } from "@/lib/utils";

/**
 * Generates an unguessable public portal token, e.g. `acme-construction-x7f92h4ks`.
 *
 * The business-name prefix is cosmetic only (nicer URLs) — the actual security
 * comes entirely from the random suffix. Never look up a portal by the prefix
 * alone; always require the full token to match exactly.
 */
export function generatePortalToken(businessName: string): string {
  const prefix = slugify(businessName).slice(0, 40);
  const suffix = randomBytes(8).toString("hex"); // 16 hex chars, 64 bits of entropy
  return prefix ? `${prefix}-${suffix}` : suffix;
}

/**
 * Same shape and security model as generatePortalToken (see above) — a
 * separate named export purely so call sites read clearly (Delivery.reviewToken
 * vs Portal.token are different resources, even though the generation logic
 * is identical).
 */
export function generateReviewToken(businessName: string): string {
  return generatePortalToken(businessName);
}

/**
 * Generates a "forgot password" reset token. Returns both the raw token
 * (emailed to the user — the only place it ever exists in full) and a
 * SHA-256 hash of it (what's actually stored in User.resetTokenHash). A
 * fast hash is fine here — unlike a user's password, this token already
 * has 256 bits of CSPRNG entropy, so it doesn't need bcrypt's deliberate
 * slowness, just protection against a DB leak alone being enough to reset
 * an account (the raw token itself is never stored).
 */
export function generatePasswordResetToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("hex");
  return { token, tokenHash: hashResetToken(token) };
}

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Generates a webhook API key (e.g. for the Apple Shortcuts → POST
 * /api/leads integration). Same shape/security reasoning as
 * generatePasswordResetToken above: the raw key is CSPRNG-random, so a
 * fast SHA-256 hash of it is enough — only the hash is ever stored
 * (AppSettings.apiKeyHash), the raw key is shown to the admin exactly
 * once, at generation time, and never persisted anywhere in full.
 */
export function generateApiKey(): { key: string; keyHash: string } {
  const key = `wd_${randomBytes(24).toString("hex")}`;
  return { key, keyHash: hashApiKey(key) };
}

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}
