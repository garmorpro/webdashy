export function canClaimNetlifyProvisioning(status) {
  return status === "NOT_STARTED" || status === "FAILED";
}

export function normalizeNetlifySiteName(value) {
  const normalized = value.toLowerCase().trim().replace(/[^a-z0-9-]+/g, "-").replace(/-{2,}/g, "-").replace(/^-|-$/g, "").slice(0, 63).replace(/-$/g, "");
  return normalized || "webdashy-site";
}

export function siteNameCandidate(base, attempt) {
  const normalized = normalizeNetlifySiteName(base);
  if (attempt <= 1) return normalized;
  const suffix = `-${attempt}`;
  return `${normalized.slice(0, 63 - suffix.length).replace(/-$/g, "")}${suffix}`;
}

export function classifyDeployState(state) {
  const value = String(state || "unknown").toLowerCase();
  if (value === "ready") return "SUCCEEDED";
  if (["error", "failed", "canceled", "cancelled"].includes(value)) return "FAILED";
  return "DEPLOYING";
}

export function mayReplaceStagingUrl(currentUrl, previousManagedUrl) {
  return currentUrl == null || (previousManagedUrl != null && currentUrl === previousManagedUrl);
}

export function isPublicRepositoryEligible(visibility) {
  return visibility === "PUBLIC";
}
