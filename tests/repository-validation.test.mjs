import test from "node:test";
import assert from "node:assert/strict";
import { parseGitHubRepositoryUrl, validateRepositoryName } from "../src/lib/github/repository-validation.mjs";

test("parses canonical GitHub repository URLs", () => {
  assert.deepEqual(parseGitHubRepositoryUrl("https://github.com/WebDashy/ironpeak-construction"), { owner: "WebDashy", name: "ironpeak-construction", url: "https://github.com/WebDashy/ironpeak-construction" });
  assert.equal(parseGitHubRepositoryUrl("https://github.com/WebDashy/site.git").name, "site");
});
test("rejects non-canonical or nested GitHub URLs", () => {
  for (const value of ["http://github.com/a/b", "https://www.github.com/a/b", "https://github.com/a/b/tree/main", "git@github.com:a/b.git", "https://github.com/a/b?q=1"]) assert.throws(() => parseGitHubRepositoryUrl(value));
});
test("validates target repository names", () => {
  assert.equal(validateRepositoryName("client-iron_peak.site"), "client-iron_peak.site");
  for (const value of ["", ".", "bad name", "-leading", "trailing-", "a".repeat(101)]) assert.throws(() => validateRepositoryName(value));
});
