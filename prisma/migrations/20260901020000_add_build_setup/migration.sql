CREATE TYPE "BuildSetupStatus" AS ENUM ('DRAFT', 'CONFIRMED');
CREATE TYPE "RepositoryVisibility" AS ENUM ('PRIVATE', 'PUBLIC');
CREATE TABLE "BuildSetup" (
  "id" TEXT NOT NULL, "portalId" TEXT NOT NULL, "templateSelectionId" TEXT NOT NULL,
  "projectRequirementsId" TEXT, "questionnaireId" TEXT,
  "status" "BuildSetupStatus" NOT NULL DEFAULT 'DRAFT', "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "confirmedAt" TIMESTAMP(3), "confirmedByUserId" TEXT, "projectName" TEXT NOT NULL,
  "siteSlug" TEXT NOT NULL, "repositoryName" TEXT NOT NULL, "repositoryOwner" TEXT,
  "repositoryVisibility" "RepositoryVisibility" NOT NULL DEFAULT 'PRIVATE', "sourceRepositoryUrl" TEXT NOT NULL,
  "sourceRef" TEXT, "primaryDomain" TEXT, "existingWebsiteUrl" TEXT, "templateId" TEXT NOT NULL,
  "templateNameSnapshot" TEXT NOT NULL, "templateSlugSnapshot" TEXT NOT NULL, "planId" TEXT,
  "planNameSnapshot" TEXT, "planFeaturesSnapshot" TEXT[], "businessProfile" JSONB NOT NULL,
  "pages" JSONB NOT NULL, "features" JSONB NOT NULL, "contentStatus" "ContentStatus" NOT NULL,
  "contentBrief" JSONB NOT NULL, "designBrief" JSONB NOT NULL, "targetLaunchDate" TIMESTAMP(3),
  "notes" TEXT, "unresolvedItems" TEXT[], "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "BuildSetup_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BuildSetup_portalId_key" ON "BuildSetup"("portalId");
CREATE INDEX "BuildSetup_templateSelectionId_idx" ON "BuildSetup"("templateSelectionId");
CREATE INDEX "BuildSetup_projectRequirementsId_idx" ON "BuildSetup"("projectRequirementsId");
CREATE INDEX "BuildSetup_questionnaireId_idx" ON "BuildSetup"("questionnaireId");
CREATE INDEX "BuildSetup_confirmedByUserId_idx" ON "BuildSetup"("confirmedByUserId");
CREATE INDEX "BuildSetup_status_idx" ON "BuildSetup"("status");
ALTER TABLE "BuildSetup" ADD CONSTRAINT "BuildSetup_portalId_fkey" FOREIGN KEY ("portalId") REFERENCES "Portal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BuildSetup" ADD CONSTRAINT "BuildSetup_templateSelectionId_fkey" FOREIGN KEY ("templateSelectionId") REFERENCES "TemplateSelection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BuildSetup" ADD CONSTRAINT "BuildSetup_projectRequirementsId_fkey" FOREIGN KEY ("projectRequirementsId") REFERENCES "ProjectRequirements"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BuildSetup" ADD CONSTRAINT "BuildSetup_questionnaireId_fkey" FOREIGN KEY ("questionnaireId") REFERENCES "DesignQuestionnaire"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BuildSetup" ADD CONSTRAINT "BuildSetup_confirmedByUserId_fkey" FOREIGN KEY ("confirmedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BuildSetup" ADD CONSTRAINT "BuildSetup_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BuildSetup" ADD CONSTRAINT "BuildSetup_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
