import test from "node:test";
import assert from "node:assert/strict";
import { canClaimNetlifyProvisioning, classifyDeployState, isPublicRepositoryEligible, mayReplaceStagingUrl, normalizeNetlifySiteName, siteNameCandidate } from "../src/lib/netlify/provisioning-state.mjs";
import { reconciledRepositoryMetadata } from "../src/lib/github/repository-reconciliation.mjs";

test("only fresh and failed Netlify records can be claimed", () => {
  assert.equal(canClaimNetlifyProvisioning("NOT_STARTED"), true);
  assert.equal(canClaimNetlifyProvisioning("FAILED"), true);
  for (const state of ["IN_PROGRESS", "DEPLOYING", "SUCCEEDED", "NEEDS_RECONCILIATION"]) assert.equal(canClaimNetlifyProvisioning(state), false);
});

test("classifies Netlify deployment states", () => {
  assert.equal(classifyDeployState("ready"), "SUCCEEDED");
  for (const state of ["error", "failed", "canceled"]) assert.equal(classifyDeployState(state), "FAILED");
  for (const state of ["new", "building", "processing", "unknown"]) assert.equal(classifyDeployState(state), "DEPLOYING");
});

test("normalizes deterministic Netlify names and collision candidates", () => {
  assert.equal(normalizeNetlifySiteName("  My Client__Site!! "), "my-client-site");
  assert.equal(normalizeNetlifySiteName("---"), "webdashy-site");
  assert.equal(siteNameCandidate("My Site", 1), "my-site");
  assert.equal(siteNameCandidate("My Site", 2), "my-site-2");
  assert.ok(siteNameCandidate("a".repeat(100), 12).length <= 63);
});

test("managed staging URLs never overwrite a manual change", () => {
  assert.equal(mayReplaceStagingUrl(null, "https://old.netlify.app"), true);
  assert.equal(mayReplaceStagingUrl("https://old.netlify.app", "https://old.netlify.app"), true);
  assert.equal(mayReplaceStagingUrl("https://manual.example", "https://old.netlify.app"), false);
});

test("V1 public repository eligibility is explicit", () => {
  assert.equal(isPublicRepositoryEligible("PUBLIC"), true);
  assert.equal(isPublicRepositoryEligible("PRIVATE"), false);
});

test("GitHub metadata is refreshed only for the recorded immutable repository ID", () => {
  const repository = {
    id: 123,
    node_id: "R_123",
    name: "renamed-repository",
    owner: { login: "NewOwner" },
    html_url: "https://github.com/NewOwner/renamed-repository",
    private: false,
    visibility: "public",
    default_branch: "trunk",
  };

  assert.equal(reconciledRepositoryMetadata(456n, repository), null);
  assert.deepEqual(reconciledRepositoryMetadata(123n, repository), {
    actualVisibility: "PUBLIC",
    defaultBranch: "trunk",
    repositoryUrl: "https://github.com/NewOwner/renamed-repository",
    targetOwner: "NewOwner",
    targetRepositoryName: "renamed-repository",
    githubNodeId: "R_123",
  });
});

test("GitHub private state wins over a stale public visibility label", () => {
  const metadata = reconciledRepositoryMetadata(123n, {
    id: 123,
    node_id: "R_123",
    name: "repository",
    owner: { login: "owner" },
    html_url: "https://github.com/owner/repository",
    private: true,
    visibility: "public",
    default_branch: "main",
  });
  assert.equal(metadata.actualVisibility, "PRIVATE");
});

test("GitHub internal repositories are not treated as publicly eligible", () => {
  const metadata = reconciledRepositoryMetadata(123n, {
    id: 123,
    node_id: "R_123",
    name: "repository",
    owner: { login: "owner" },
    html_url: "https://github.com/owner/repository",
    private: false,
    visibility: "internal",
    default_branch: "main",
  });
  assert.equal(metadata.actualVisibility, "PRIVATE");
});
