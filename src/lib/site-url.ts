import { headers } from "next/headers";

/**
 * Builds an absolute URL for the current request's origin — works whether
 * WebDashy is reached by IP (today) or a real domain (once Cloudflare/TLS
 * are set up later, see DEPLOYMENT.md), without needing a hardcoded env var.
 * Reads `x-forwarded-proto`/`host`, which nginx sets (see nginx/webdashy.conf).
 */
export async function getAbsoluteUrl(path: string): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "localhost";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}${path.startsWith("/") ? path : `/${path}`}`;
}
