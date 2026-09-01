const OWNER_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;
const REPOSITORY_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9._-]{0,98}[A-Za-z0-9])?$/;

export function validateRepositoryName(value) {
  if (!REPOSITORY_PATTERN.test(value) || value === "." || value === "..") {
    throw new Error("Repository name must be 1-100 characters and use only letters, numbers, periods, underscores, or hyphens.");
  }
  return value;
}

export function validateRepositoryOwner(value) {
  if (!OWNER_PATTERN.test(value) || value.includes("--")) {
    throw new Error("GitHub owner is invalid.");
  }
  return value;
}

export function parseGitHubRepositoryUrl(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error("Source repository must be a valid GitHub HTTPS URL."); }
  if (url.protocol !== "https:" || url.hostname !== "github.com" || url.port || url.username || url.password || url.search || url.hash) {
    throw new Error("Source repository must be a canonical https://github.com/owner/repository URL.");
  }
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length !== 2) throw new Error("Source repository URL must identify exactly one GitHub repository.");
  const owner = validateRepositoryOwner(parts[0]);
  const name = validateRepositoryName(parts[1].replace(/\.git$/, ""));
  return { owner, name, url: `https://github.com/${owner}/${name}` };
}
