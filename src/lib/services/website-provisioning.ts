import "server-only";

import { Prisma, type RepositoryVisibility } from "@prisma/client";
import { db } from "@/lib/db";
import { isWorkflowStageAtLeast } from "@/lib/workflow";
import { generateRepository, getRepository, GitHubApiError, parseGitHubRepositoryUrl, validateRepositoryName, validateRepositoryOwner, validateTemplateRepository } from "@/lib/github/client";

export type ProvisioningResult = { ok: true; message: string } | { ok: false; message: string; code?: string };
const LEASE_MS = 5 * 60_000;

function safeError(error: unknown) {
  if (error instanceof GitHubApiError) return { code: error.code, message: error.message, requestId: error.requestId, ambiguous: error.ambiguous };
  if (error instanceof Error && (error.message.startsWith("Repository name") || error.message.startsWith("GitHub owner") || error.message.startsWith("Source repository"))) return { code: "VALIDATION_ERROR", message: error.message, requestId: null, ambiguous: false };
  return { code: "PROVISIONING_ERROR", message: "Website provisioning failed unexpectedly. Try again.", requestId: null, ambiguous: false };
}

export async function provisionWebsite(input: { buildSetupId: string; portalId: string; clientId: string }): Promise<ProvisioningResult> {
  const setup = await db.buildSetup.findFirst({
    where: { id: input.buildSetupId, portalId: input.portalId, portal: { clientId: input.clientId } },
    include: { portal: { select: { client: { select: { workflowStage: true } } } }, websiteProvisioning: true },
  });
  if (!setup) return { ok: false, code: "BUILD_SETUP_NOT_FOUND", message: "Build Setup was not found for this client." };
  if (setup.status !== "CONFIRMED") return { ok: false, code: "BUILD_SETUP_NOT_CONFIRMED", message: "Confirm Build Setup before provisioning the website." };
  if (!isWorkflowStageAtLeast(setup.portal.client.workflowStage, "BUILD_SETUP")) return { ok: false, code: "WORKFLOW_NOT_READY", message: "This project has not reached Build Setup yet." };
  if (setup.sourceRef?.trim()) return { ok: false, code: "SOURCE_REF_UNSUPPORTED", message: "Website provisioning cannot use a source ref in this version. Clear Source ref / branch and reconfirm Build Setup." };

  let source: { owner: string; name: string; url: string };
  let targetOwner: string;
  try {
    source = parseGitHubRepositoryUrl(setup.sourceRepositoryUrl);
    targetOwner = validateRepositoryOwner(setup.repositoryOwner?.trim() || process.env.GITHUB_DEFAULT_OWNER?.trim() || "");
    validateRepositoryName(setup.repositoryName);
  } catch (error) {
    const safe = safeError(error);
    return { ok: false, code: safe.code, message: safe.message };
  }

  const requestedVisibility: RepositoryVisibility = setup.repositoryVisibility;
  let row;
  try {
    row = await db.websiteProvisioning.upsert({
      where: { buildSetupId: setup.id }, update: {},
      create: { buildSetupId: setup.id, sourceOwner: source.owner, sourceRepositoryName: source.name, sourceRepositoryUrl: setup.sourceRepositoryUrl, targetOwner, targetRepositoryName: setup.repositoryName, requestedVisibility },
    });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) throw error;
    row = await db.websiteProvisioning.findUniqueOrThrow({ where: { buildSetupId: setup.id } });
  }
  if (row.status === "SUCCEEDED") return { ok: true, message: "Website repository is already provisioned." };
  if (row.status === "IN_PROGRESS") return { ok: false, code: "PROVISIONING_IN_PROGRESS", message: "Website provisioning is already in progress." };
  if (row.status === "NEEDS_RECONCILIATION") return { ok: false, code: "NEEDS_RECONCILIATION", message: "Inspect the target repository in GitHub before any retry." };

  const now = new Date();
  const claimed = await db.websiteProvisioning.updateMany({
    where: { id: row.id, status: { in: ["NOT_STARTED", "FAILED"] } },
    data: {
      status: "IN_PROGRESS", sourceOwner: source.owner, sourceRepositoryName: source.name, sourceRepositoryUrl: setup.sourceRepositoryUrl,
      targetOwner, targetRepositoryName: setup.repositoryName, requestedVisibility,
      attemptCount: { increment: 1 }, lastAttemptAt: now, startedAt: now, leaseExpiresAt: new Date(now.getTime() + LEASE_MS),
      failedAt: null, lastErrorCode: null, lastErrorMessage: null, githubRequestId: null,
    },
  });
  if (claimed.count !== 1) return { ok: false, code: "PROVISIONING_IN_PROGRESS", message: "Another provisioning attempt acquired this website first." };

  try {
    await validateTemplateRepository(source.owner, source.name);
    const existingTarget = await getRepository(targetOwner, setup.repositoryName);
    if (existingTarget) {
      if (row.githubRepositoryId === BigInt(existingTarget.data.id)) {
        const actualVisibility: RepositoryVisibility = existingTarget.data.private || existingTarget.data.visibility === "private" ? "PRIVATE" : "PUBLIC";
        await db.websiteProvisioning.update({ where: { id: row.id }, data: { status: "SUCCEEDED", githubNodeId: existingTarget.data.node_id, repositoryUrl: existingTarget.data.html_url, actualVisibility, defaultBranch: existingTarget.data.default_branch, githubRequestId: existingTarget.requestId, provisionedAt: row.provisionedAt ?? new Date(), leaseExpiresAt: null } });
        return { ok: true, message: "Previously recorded website repository verified successfully." };
      }
      throw new GitHubApiError("TARGET_ALREADY_EXISTS", "The target GitHub repository already exists and has no matching recorded GitHub ID. It was not adopted.", existingTarget.requestId);
    }
    const created = await generateRepository({ sourceOwner: source.owner, sourceName: source.name, targetOwner, targetName: setup.repositoryName, private: requestedVisibility === "PRIVATE" });
    const actualVisibility: RepositoryVisibility = created.data.private || created.data.visibility === "private" ? "PRIVATE" : "PUBLIC";
    await db.websiteProvisioning.update({ where: { id: row.id }, data: {
      status: "SUCCEEDED", githubRepositoryId: BigInt(created.data.id), githubNodeId: created.data.node_id,
      repositoryUrl: created.data.html_url, actualVisibility, defaultBranch: created.data.default_branch,
      githubRequestId: created.requestId, provisionedAt: new Date(), leaseExpiresAt: null,
    } });
    return { ok: true, message: "Website repository provisioned successfully." };
  } catch (error) {
    const safe = safeError(error);
    console.error("Website provisioning failed:", safe.code, safe.message);
    await db.websiteProvisioning.update({ where: { id: row.id }, data: {
      status: safe.ambiguous ? "NEEDS_RECONCILIATION" : "FAILED", failedAt: new Date(), leaseExpiresAt: null,
      lastErrorCode: safe.code, lastErrorMessage: safe.message, githubRequestId: safe.requestId,
    } });
    return { ok: false, code: safe.code, message: safe.message };
  }
}
