CREATE TYPE "WebsiteProvisioningStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'SUCCEEDED', 'FAILED', 'NEEDS_RECONCILIATION');
CREATE TABLE "WebsiteProvisioning" (
  "id" TEXT NOT NULL, "buildSetupId" TEXT NOT NULL,
  "status" "WebsiteProvisioningStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "sourceOwner" TEXT NOT NULL, "sourceRepositoryName" TEXT NOT NULL, "sourceRepositoryUrl" TEXT NOT NULL,
  "targetOwner" TEXT NOT NULL, "targetRepositoryName" TEXT NOT NULL, "requestedVisibility" "RepositoryVisibility" NOT NULL,
  "githubRepositoryId" BIGINT, "githubNodeId" TEXT, "repositoryUrl" TEXT, "actualVisibility" "RepositoryVisibility", "defaultBranch" TEXT,
  "attemptCount" INTEGER NOT NULL DEFAULT 0, "lastAttemptAt" TIMESTAMP(3), "provisionedAt" TIMESTAMP(3), "failedAt" TIMESTAMP(3),
  "lastErrorCode" TEXT, "lastErrorMessage" TEXT, "githubRequestId" TEXT, "startedAt" TIMESTAMP(3), "leaseExpiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WebsiteProvisioning_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "WebsiteProvisioning_buildSetupId_key" ON "WebsiteProvisioning"("buildSetupId");
CREATE INDEX "WebsiteProvisioning_status_idx" ON "WebsiteProvisioning"("status");
CREATE INDEX "WebsiteProvisioning_status_leaseExpiresAt_idx" ON "WebsiteProvisioning"("status", "leaseExpiresAt");
CREATE INDEX "WebsiteProvisioning_targetOwner_targetRepositoryName_idx" ON "WebsiteProvisioning"("targetOwner", "targetRepositoryName");
ALTER TABLE "WebsiteProvisioning" ADD CONSTRAINT "WebsiteProvisioning_buildSetupId_fkey" FOREIGN KEY ("buildSetupId") REFERENCES "BuildSetup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
