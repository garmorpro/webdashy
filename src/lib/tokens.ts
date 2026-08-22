import { randomBytes } from "crypto";
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
