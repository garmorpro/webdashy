import { headers } from "next/headers";

/**
 * Builds an absolute URL from the deployment's canonical origin. Request
 * headers remain a fallback for local development and direct-IP access.
 */
export async function getAbsoluteUrl(path: string): Promise<string> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const siteUrl = process.env.SITE_URL?.replace(/\/+$/, "");

  if (siteUrl) return `${siteUrl}${normalizedPath}`;

  const h = await headers();
  const firstHeaderValue = (value: string | null) => value?.split(",", 1)[0]?.trim() || undefined;
  const host = firstHeaderValue(h.get("x-forwarded-host")) ?? h.get("host") ?? "localhost";
  const proto = firstHeaderValue(h.get("x-forwarded-proto")) ?? "http";

  return `${proto}://${host}${normalizedPath}`;
}
