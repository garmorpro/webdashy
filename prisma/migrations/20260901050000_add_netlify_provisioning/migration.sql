CREATE TYPE "NetlifyProvisioningStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'DEPLOYING', 'SUCCEEDED', 'FAILED', 'NEEDS_RECONCILIATION');

CREATE TABLE "NetlifyProvisioning" (
    "id" TEXT NOT NULL,
    "websiteProvisioningId" TEXT NOT NULL,
    "status" "NetlifyProvisioningStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "netlifySiteId" TEXT,
    "siteName" TEXT NOT NULL,
    "adminUrl" TEXT,
    "siteUrl" TEXT,
    "sslUrl" TEXT,
    "accountSlug" TEXT NOT NULL,
    "githubRepositoryId" BIGINT NOT NULL,
    "repositoryPath" TEXT NOT NULL,
    "repositoryBranch" TEXT NOT NULL,
    "netlifyGithubInstallationId" BIGINT NOT NULL,
    "initialBuildId" TEXT,
    "initialDeployId" TEXT,
    "initialDeployState" TEXT,
    "initialDeployUrl" TEXT,
    "initialDeploySslUrl" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "siteCreatedAt" TIMESTAMP(3),
    "provisionedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "leaseExpiresAt" TIMESTAMP(3),
    "lastErrorCode" TEXT,
    "lastErrorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "NetlifyProvisioning_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NetlifyProvisioning_websiteProvisioningId_key" ON "NetlifyProvisioning"("websiteProvisioningId");
CREATE UNIQUE INDEX "NetlifyProvisioning_netlifySiteId_key" ON "NetlifyProvisioning"("netlifySiteId");
CREATE INDEX "NetlifyProvisioning_status_idx" ON "NetlifyProvisioning"("status");
CREATE INDEX "NetlifyProvisioning_status_leaseExpiresAt_idx" ON "NetlifyProvisioning"("status", "leaseExpiresAt");
CREATE INDEX "NetlifyProvisioning_siteName_idx" ON "NetlifyProvisioning"("siteName");
ALTER TABLE "NetlifyProvisioning" ADD CONSTRAINT "NetlifyProvisioning_websiteProvisioningId_fkey" FOREIGN KEY ("websiteProvisioningId") REFERENCES "WebsiteProvisioning"("id") ON DELETE CASCADE ON UPDATE CASCADE;
