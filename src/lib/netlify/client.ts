import "server-only";

const API_ROOT = "https://api.netlify.com/api/v1";

export type RateLimit = { limit: string | null; remaining: string | null; reset: string | null; retryAfter: string | null };
export type NetlifySite = { id: string; name: string; admin_url?: string; url?: string; ssl_url?: string; state?: string; build_id?: string; deploy_id?: string };
export type NetlifyDeploy = { id: string; build_id?: string; state: string; url?: string; ssl_url?: string; created_at?: string; published_at?: string };

export class NetlifyApiError extends Error {
  constructor(public code: string, message: string, public status: number | null, public retryable: boolean, public ambiguous: boolean, public rateLimit: RateLimit) { super(message); this.name = "NetlifyApiError"; }
}

export function getNetlifyConfig() {
  const token = process.env.NETLIFY_ACCESS_TOKEN?.trim();
  const accountSlug = process.env.NETLIFY_ACCOUNT_SLUG?.trim();
  const installation = process.env.NETLIFY_GITHUB_INSTALLATION_ID?.trim();
  if (!token || !accountSlug || !installation || !/^\d+$/.test(installation)) throw new NetlifyApiError("NETLIFY_CONFIG_MISSING", "Netlify provisioning is not configured correctly.", null, false, false, emptyRateLimit());
  return { token, accountSlug, installationId: BigInt(installation) };
}

function emptyRateLimit(): RateLimit { return { limit: null, remaining: null, reset: null, retryAfter: null }; }
function rateLimit(headers: Headers): RateLimit { return { limit: headers.get("x-ratelimit-limit"), remaining: headers.get("x-ratelimit-remaining"), reset: headers.get("x-ratelimit-reset"), retryAfter: headers.get("retry-after") }; }

async function request<T>(path: string, init: RequestInit = {}, creation = false): Promise<{ data: T; rateLimit: RateLimit }> {
  let response: Response;
  try {
    response = await fetch(`${API_ROOT}${path}`, { ...init, cache: "no-store", headers: { Authorization: `Bearer ${getNetlifyConfig().token}`, "Content-Type": "application/json", ...init.headers } });
  } catch {
    throw new NetlifyApiError("NETLIFY_NETWORK_ERROR", "Netlify could not be reached. The result may need manual inspection.", null, true, creation, emptyRateLimit());
  }
  const limits = rateLimit(response.headers);
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string; error?: string } | null;
    const retryable = response.status === 429 || response.status >= 500;
    const message = response.status === 429 ? "Netlify rate limited the request. Try again later." : response.status === 422 ? "Netlify rejected the site configuration or site name." : response.status >= 500 ? "Netlify returned a temporary server error." : (body?.message || body?.error || `Netlify request failed (${response.status}).`);
    throw new NetlifyApiError(`NETLIFY_HTTP_${response.status}`, message, response.status, retryable, creation && response.status >= 500, limits);
  }
  return { data: await response.json() as T, rateLimit: limits };
}

export async function createLinkedSite(input: { name: string; repositoryId: bigint; repositoryPath: string; branch: string }) {
  const config = getNetlifyConfig();
  return request<NetlifySite>(`/${encodeURIComponent(config.accountSlug)}/sites`, { method: "POST", body: JSON.stringify({ name: input.name, account_slug: config.accountSlug, repo: { provider: "github", installation_id: Number(config.installationId), id: Number(input.repositoryId), repo: input.repositoryPath, private: false, branch: input.branch }, default_hooks_data: {} }) }, true);
}
export function getSite(siteId: string) { return request<NetlifySite>(`/sites/${encodeURIComponent(siteId)}`); }
export function listRecentDeploys(siteId: string) { return request<NetlifyDeploy[]>(`/sites/${encodeURIComponent(siteId)}/deploys?per_page=10`); }
