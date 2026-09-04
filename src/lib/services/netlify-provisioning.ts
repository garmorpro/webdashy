import "server-only";

import { Prisma, type NetlifyProvisioning, type RepositoryVisibility } from "@prisma/client";
import { db } from "@/lib/db";
import { getRepository, GitHubApiError } from "@/lib/github/client";
import { reconciledRepositoryMetadata } from "@/lib/github/repository-reconciliation.mjs";
import { isWorkflowStageAtLeast } from "@/lib/workflow";
import { createLinkedSite, getNetlifyConfig, getSite, listRecentDeploys, NetlifyApiError, type NetlifyDeploy, type NetlifySite } from "@/lib/netlify/client";
import { configureClientSiteRepository } from "@/lib/github/configure-client-site";
import { classifyDeployState, isPublicRepositoryEligible, siteNameCandidate } from "@/lib/netlify/provisioning-state.mjs";

type Result = { ok: true; message: string } | { ok: false; message: string; code: string };
const LEASE_MS = 5 * 60_000;

function safeError(error: unknown) {
  if (error instanceof NetlifyApiError) return { code: error.code, message: error.message, ambiguous: error.ambiguous };
  return { code: "NETLIFY_PROVISIONING_ERROR", message: "Netlify provisioning failed unexpectedly. Try again.", ambiguous: false };
}

function safeGitHubError(error: unknown): Result {
  if (error instanceof GitHubApiError) return { ok: false, code: error.code, message: error.message };
  return { ok: false, code: "GITHUB_RECONCILIATION_ERROR", message: "The GitHub repository could not be verified before provisioning Netlify. Try again." };
}

async function trustedProject(input: { websiteProvisioningId: string; portalId: string; clientId: string }) {
  return db.websiteProvisioning.findFirst({
    where: { id: input.websiteProvisioningId, buildSetup: { portalId: input.portalId, portal: { clientId: input.clientId } } },
    include: { netlifyProvisioning: true, buildSetup: { include: { portal: { select: { id: true, client: { select: { workflowStage: true } } } } } } },
  });
}

function prerequisiteError(project: Awaited<ReturnType<typeof trustedProject>>): Result | null {
  if (!project) return { ok: false, code: "WEBSITE_PROVISIONING_NOT_FOUND", message: "GitHub Website Provisioning was not found for this client." };
  if (project.status !== "SUCCEEDED") return { ok: false, code: "GITHUB_NOT_READY", message: "GitHub Website Provisioning must succeed before provisioning Netlify." };
  if (project.buildSetup.status !== "CONFIRMED") return { ok: false, code: "BUILD_SETUP_NOT_CONFIRMED", message: "Build Setup must still be confirmed." };
  if (!isWorkflowStageAtLeast(project.buildSetup.portal.client.workflowStage, "BUILD_SETUP")) return { ok: false, code: "WORKFLOW_NOT_READY", message: "This project has not reached Build Setup yet." };
  if (!project.githubRepositoryId) return { ok: false, code: "GITHUB_METADATA_MISSING", message: "The GitHub repository ID must be recorded before provisioning Netlify." };
  return null;
}

function deployFrom(site: NetlifySite, deploys: NetlifyDeploy[]) {
  return deploys.find((deploy) => deploy.id === site.deploy_id) || deploys[0] || (site.deploy_id ? { id: site.deploy_id, build_id: site.build_id, state: site.state || "building", url: site.url, ssl_url: site.ssl_url } : null);
}

type ProvisioningWithPortal = NetlifyProvisioning & { websiteProvisioning: { buildSetup: { portalId: string } } };

async function saveDeployState(row: ProvisioningWithPortal, site: NetlifySite, deploy: NetlifyDeploy | null): Promise<Result> {
  const deployState = deploy?.state || site.state || "pending";
  const classified = classifyDeployState(deployState);
  const sslUrl = deploy?.ssl_url || site.ssl_url || row.sslUrl;
  const now = new Date();
  await db.$transaction(async (tx) => {
    await tx.netlifyProvisioning.update({ where: { id: row.id }, data: {
      status: classified, netlifySiteId: site.id, siteName: site.name || row.siteName,
      adminUrl: site.admin_url || row.adminUrl, siteUrl: site.url || row.siteUrl, sslUrl,
      initialBuildId: deploy?.build_id || row.initialBuildId, initialDeployId: deploy?.id || row.initialDeployId,
      initialDeployState: deployState, initialDeployUrl: deploy?.url || row.initialDeployUrl,
      initialDeploySslUrl: deploy?.ssl_url || row.initialDeploySslUrl, leaseExpiresAt: null,
      provisionedAt: classified === "SUCCEEDED" ? (row.provisionedAt || now) : row.provisionedAt,
      failedAt: classified === "FAILED" ? now : null,
      lastErrorCode: classified === "FAILED" ? "NETLIFY_DEPLOY_FAILED" : null,
      lastErrorMessage: classified === "FAILED" ? `The initial Netlify production deploy reached terminal state: ${deployState}.` : null,
    } });
    if (classified === "SUCCEEDED" && sslUrl) {
      const existing = await tx.delivery.findUnique({ where: { portalId: row.websiteProvisioning.buildSetup.portalId } });
      if (!existing) await tx.delivery.create({ data: { portalId: row.websiteProvisioning.buildSetup.portalId, status: "BUILDING", stagingUrl: sslUrl } });
      else if (existing.stagingUrl === null || (row.sslUrl !== null && existing.stagingUrl === row.sslUrl)) {
        await tx.delivery.update({ where: { id: existing.id }, data: { stagingUrl: sslUrl } });
      }
    }
  });
  if (classified === "SUCCEEDED") return { ok: true, message: "Netlify site provisioned and the initial production deploy is ready." };
  if (classified === "FAILED") return { ok: false, code: "NETLIFY_DEPLOY_FAILED", message: `The initial Netlify deploy failed (${deployState}).` };
  return { ok: true, message: `Netlify is deploying the site (${deployState}). Check the deployment again shortly.` };
}

export async function provisionNetlify(input: { websiteProvisioningId: string; portalId: string; clientId: string }): Promise<Result> {
  const storedProject = await trustedProject(input);
  const invalid = prerequisiteError(storedProject);
  if (invalid || !storedProject) return invalid!;
  const repositoryId = storedProject.githubRepositoryId!;

  let project: NonNullable<Awaited<ReturnType<typeof trustedProject>>>;
  try {
    const repository = await getRepository(storedProject.targetOwner, storedProject.targetRepositoryName);
    if (!repository) return { ok: false, code: "GITHUB_REPOSITORY_NOT_FOUND", message: "The provisioned GitHub repository was not found or is not accessible to the GitHub App." };
    const metadata = reconciledRepositoryMetadata(repositoryId, repository.data);
    if (!metadata) {
      return { ok: false, code: "GITHUB_REPOSITORY_ID_MISMATCH", message: "The GitHub repository at the recorded owner/name does not match the provisioned repository ID. It was not adopted." };
    }
    if (!repository.data.owner.login || !repository.data.name || !repository.data.default_branch || !repository.data.html_url) {
      return { ok: false, code: "GITHUB_METADATA_MISSING", message: "GitHub returned incomplete repository metadata required for Netlify provisioning." };
    }
    project = await db.websiteProvisioning.update({
      where: { id: storedProject.id },
      data: {
        ...metadata,
        actualVisibility: metadata.actualVisibility as RepositoryVisibility,
        githubRequestId: repository.requestId,
      },
      include: { netlifyProvisioning: true, buildSetup: { include: { portal: { select: { id: true, client: { select: { workflowStage: true } } } } } } },
    });
  } catch (error) {
    return safeGitHubError(error);
  }

  if (!isPublicRepositoryEligible(project.actualVisibility)) return { ok: false, code: "PRIVATE_REPOSITORY_UNSUPPORTED", message: "Netlify provisioning in Workflow V2 currently supports public GitHub repositories only. The current Netlify Free flow cannot provision this private repository." };
  let config;
  try { config = getNetlifyConfig(); } catch (error) { const safe = safeError(error); return { ok: false, code: safe.code, message: safe.message }; }
  const repositoryPath = `${project.targetOwner}/${project.targetRepositoryName}`;
  const baseName = siteNameCandidate(project.buildSetup.siteSlug, 1);
  let row;
  try {
    row = await db.netlifyProvisioning.upsert({ where: { websiteProvisioningId: project.id }, update: {}, create: { websiteProvisioningId: project.id, siteName: baseName, accountSlug: config.accountSlug, githubRepositoryId: repositoryId, repositoryPath, repositoryBranch: project.defaultBranch!, netlifyGithubInstallationId: config.installationId } });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) throw error;
    row = await db.netlifyProvisioning.findUniqueOrThrow({ where: { websiteProvisioningId: project.id } });
  }
  if (row.status === "SUCCEEDED") return { ok: true, message: "The Netlify site is already provisioned." };
  if (row.status === "IN_PROGRESS" || row.status === "DEPLOYING") return { ok: false, code: "NETLIFY_ALREADY_ACTIVE", message: "Netlify provisioning is already active. Use Check Deployment to refresh it." };
  if (row.status === "NEEDS_RECONCILIATION") return { ok: false, code: "NEEDS_RECONCILIATION", message: "The site creation result is ambiguous. Inspect Netlify before any retry." };
  if (row.netlifySiteId) return { ok: false, code: "NETLIFY_SITE_ALREADY_EXISTS", message: "A Netlify site is already recorded. Use Check Deployment instead of creating another site." };
  const now = new Date();
  const claimed = await db.netlifyProvisioning.updateMany({ where: { id: row.id, status: { in: ["NOT_STARTED", "FAILED"] }, netlifySiteId: null }, data: { status: "IN_PROGRESS", githubRepositoryId: repositoryId, repositoryPath, repositoryBranch: project.defaultBranch!, attemptCount: { increment: 1 }, lastAttemptAt: now, startedAt: now, failedAt: null, leaseExpiresAt: new Date(now.getTime() + LEASE_MS), lastErrorCode: null, lastErrorMessage: null } });
  if (claimed.count !== 1) return { ok: false, code: "NETLIFY_ALREADY_ACTIVE", message: "Another Netlify provisioning request acquired this project first." };
  try {
    let created: NetlifySite | null = null;
    let chosenName = baseName;
    for (let candidate = 1; candidate <= 5; candidate += 1) {
      chosenName = siteNameCandidate(baseName, candidate);
      try { created = (await createLinkedSite({ name: chosenName, repositoryId, repositoryPath, branch: project.defaultBranch! })).data; break; }
      catch (error) { if (!(error instanceof NetlifyApiError && error.status === 422 && candidate < 5)) throw error; }
    }
    if (!created) throw new NetlifyApiError("NETLIFY_SITE_NAME_UNAVAILABLE", "Netlify could not allocate a unique site name.", 422, false, false, { limit: null, remaining: null, reset: null, retryAfter: null });

    const saved = await db.netlifyProvisioning.update({
      where: { id: row.id },
      data: {
        status: "DEPLOYING",
        netlifySiteId: created.id,
        siteName: created.name || chosenName,
        adminUrl: created.admin_url,
        siteUrl: created.url,
        sslUrl: created.ssl_url,
        initialBuildId: created.build_id,
        initialDeployId: created.deploy_id,
        initialDeployState: created.state,
        siteCreatedAt: new Date(),
        leaseExpiresAt: null,
      },
      include: {
        websiteProvisioning: {
          include: {
            buildSetup: {
              select: { portalId: true },
            },
          },
        },
      },
    });

    const clientSiteUrl = created.ssl_url || created.url;
    if (!clientSiteUrl) {
      throw new NetlifyApiError(
        "NETLIFY_SITE_URL_MISSING",
        "Netlify created the site but did not return a usable site URL.",
        null,
        false,
        false,
        { limit: null, remaining: null, reset: null, retryAfter: null }
      );
    }

    try {
      await configureClientSiteRepository({
        owner: project.targetOwner,
        repo: project.targetRepositoryName,
        branch: project.defaultBranch!,
        siteUrl: clientSiteUrl,
      });
    } catch (error) {
      console.error("Client repository configuration failed:", error);
      throw new NetlifyApiError(
        "CLIENT_REPOSITORY_CONFIGURATION_FAILED",
        "Netlify created the site, but WebDashy could not configure the generated client repository.",
        null,
        false,
        false,
        { limit: null, remaining: null, reset: null, retryAfter: null }
      );
    }
    try {
      const deploys = (await listRecentDeploys(created.id)).data;
      return saveDeployState(saved, created, deployFrom(created, deploys));
    } catch {
      return { ok: true, message: "The Netlify site was created and its deploy is in progress. Use Check Deployment to refresh it." };
    }
  } catch (error) {
    const safe = safeError(error);
    await db.netlifyProvisioning.update({ where: { id: row.id }, data: { status: safe.ambiguous ? "NEEDS_RECONCILIATION" : "FAILED", failedAt: new Date(), leaseExpiresAt: null, lastErrorCode: safe.code, lastErrorMessage: safe.message } });
    return { ok: false, code: safe.code, message: safe.message };
  }
}

export async function reconcileNetlify(input: { netlifyProvisioningId: string; portalId: string; clientId: string }): Promise<Result> {
  const row = await db.netlifyProvisioning.findFirst({
    where: {
      id: input.netlifyProvisioningId,
      websiteProvisioning: {
        buildSetup: {
          portalId: input.portalId,
          portal: { clientId: input.clientId },
        },
      },
    },
    include: {
      websiteProvisioning: {
        include: {
          buildSetup: {
            select: { portalId: true },
          },
        },
      },
    },
  });

  if (!row) {
    return {
      ok: false,
      code: "NETLIFY_PROVISIONING_NOT_FOUND",
      message: "Netlify provisioning was not found for this client.",
    };
  }

  if (!row.netlifySiteId) {
    return {
      ok: false,
      code: "MANUAL_RECONCILIATION_REQUIRED",
      message:
        "No Netlify site ID was recorded. Inspect Netlify manually; a second site will not be created automatically.",
    };
  }

  try {
    const [site, deploys] = await Promise.all([
      getSite(row.netlifySiteId),
      listRecentDeploys(row.netlifySiteId),
    ]);

    const siteUrl = site.data.ssl_url || site.data.url;
    if (siteUrl) {
      try {
        await configureClientSiteRepository({
          owner: row.websiteProvisioning.targetOwner,
          repo: row.websiteProvisioning.targetRepositoryName,
          branch: row.repositoryBranch,
          siteUrl,
        });
      } catch (error) {
        console.error("Client repository reconciliation failed:", error);
        return {
          ok: false,
          code: "CLIENT_REPOSITORY_CONFIGURATION_FAILED",
          message:
            "Netlify is connected, but WebDashy could not update the client repository configuration.",
        };
      }
    }

    return saveDeployState(
      row,
      site.data,
      deployFrom(site.data, deploys.data)
    );
  } catch (error) {
    const safe = safeError(error);
    return { ok: false, code: safe.code, message: safe.message };
  }
}
