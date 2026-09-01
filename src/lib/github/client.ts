import "server-only";

import { createSign } from "node:crypto";
import { readFile } from "node:fs/promises";
import { parseGitHubRepositoryUrl, validateRepositoryName, validateRepositoryOwner } from "./repository-validation.mjs";

export { parseGitHubRepositoryUrl, validateRepositoryName, validateRepositoryOwner };

const API = "https://api.github.com";
const API_VERSION = "2022-11-28";

type Repo = { id: number; node_id: string; html_url: string; private: boolean; visibility?: string; default_branch: string; is_template?: boolean };
type GitHubResult<T> = { data: T; requestId: string | null };

export class GitHubApiError extends Error {
  constructor(public code: string, message: string, public requestId: string | null = null, public ambiguous = false) { super(message); }
}

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new GitHubApiError("GITHUB_CONFIGURATION_ERROR", `Server GitHub configuration is missing ${name}.`);
  return value;
}
function base64url(value: string | Buffer) { return Buffer.from(value).toString("base64url"); }
async function appJwt() {
  const appId = required("GITHUB_APP_ID");
  const keyPath = required("GITHUB_APP_PRIVATE_KEY_PATH");
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify({ iat: now - 60, exp: now + 540, iss: appId }));
  const unsigned = `${header}.${payload}`;
  let key: string;
  try { key = await readFile(keyPath, "utf8"); } catch { throw new GitHubApiError("GITHUB_PRIVATE_KEY_UNREADABLE", "The configured GitHub App private key could not be read."); }
  const signer = createSign("RSA-SHA256"); signer.update(unsigned); signer.end();
  return `${unsigned}.${base64url(signer.sign(key))}`;
}
async function request<T>(path: string, init: RequestInit & { token: string }, ambiguousOnNetwork = false): Promise<GitHubResult<T>> {
  const { token, ...options } = init;
  let response: Response;
  try {
    response = await fetch(`${API}${path}`, { ...options, headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "X-GitHub-Api-Version": API_VERSION, "Content-Type": "application/json", ...options.headers }, signal: AbortSignal.timeout(30_000) });
  } catch {
    throw new GitHubApiError(ambiguousOnNetwork ? "CREATE_RESULT_UNKNOWN" : "GITHUB_NETWORK_ERROR", ambiguousOnNetwork ? "GitHub may have created the repository, but the response was not received. Inspect GitHub before retrying." : "GitHub could not be reached. Try again.", null, ambiguousOnNetwork);
  }
  const requestId = response.headers.get("x-github-request-id");
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { message?: string };
    const ambiguous = ambiguousOnNetwork && response.status >= 500;
    throw new GitHubApiError(ambiguous ? "CREATE_RESULT_UNKNOWN" : `GITHUB_${response.status}`, ambiguous ? "GitHub may have created the repository, but returned an inconclusive server error. Inspect GitHub before retrying." : body.message ? `GitHub: ${body.message}` : `GitHub request failed (${response.status}).`, requestId, ambiguous);
  }
  return { data: await response.json() as T, requestId };
}
async function installationToken() {
  const result = await request<{ token: string }>(`/app/installations/${encodeURIComponent(required("GITHUB_APP_INSTALLATION_ID"))}/access_tokens`, { method: "POST", token: await appJwt() });
  return result.data.token;
}
export async function getRepository(owner: string, name: string): Promise<GitHubResult<Repo> | null> {
  const token = await installationToken();
  try { return await request<Repo>(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`, { method: "GET", token }); }
  catch (error) { if (error instanceof GitHubApiError && error.code === "GITHUB_404") return null; throw error; }
}
export async function validateTemplateRepository(owner: string, name: string) {
  const repo = await getRepository(owner, name);
  if (!repo) throw new GitHubApiError("SOURCE_NOT_FOUND", "The source GitHub repository was not found or is not accessible to the GitHub App.");
  if (repo.data.is_template !== true) throw new GitHubApiError("SOURCE_NOT_TEMPLATE", "The source GitHub repository is not configured as a template.", repo.requestId);
  return repo;
}
export async function generateRepository(input: { sourceOwner: string; sourceName: string; targetOwner: string; targetName: string; private: boolean }) {
  const token = await installationToken();
  return request<Repo>(`/repos/${encodeURIComponent(input.sourceOwner)}/${encodeURIComponent(input.sourceName)}/generate`, { method: "POST", token, body: JSON.stringify({ owner: input.targetOwner, name: input.targetName, private: input.private, include_all_branches: false }) }, true);
}
