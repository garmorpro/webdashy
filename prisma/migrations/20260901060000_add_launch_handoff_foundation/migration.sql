CREATE TYPE "HandoffTemplateRevisionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'RETIRED');
CREATE TYPE "HandoffPacketStatus" AS ENUM ('DRAFT', 'ISSUED', 'SENT', 'VIEWED', 'ACCEPTED', 'COMPLETED', 'SUPERSEDED', 'REVOKED');
CREATE TYPE "HandoffEmailStatus" AS ENUM ('PENDING', 'SENDING', 'SENT', 'FAILED', 'DELIVERY_UNKNOWN');
CREATE TYPE "HandoffEmailKind" AS ENUM ('INITIAL', 'RESEND', 'ACCEPTED_COPY');
CREATE TYPE "HandoffChecklistStatus" AS ENUM ('PENDING', 'COMPLETED', 'WAIVED', 'NOT_APPLICABLE');
CREATE TYPE "ClientCareDisposition" AS ENUM ('ENROLLED', 'DECLINED', 'INCLUDED', 'NOT_APPLICABLE');
CREATE TYPE "ProjectAuditActorType" AS ENUM ('ADMIN', 'CLIENT_TOKEN', 'SYSTEM');

CREATE TABLE "HandoffTemplate" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HandoffTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HandoffTemplateRevision" (
  "id" TEXT NOT NULL,
  "templateId" TEXT NOT NULL,
  "revision" INTEGER NOT NULL,
  "status" "HandoffTemplateRevisionStatus" NOT NULL DEFAULT 'DRAFT',
  "schemaVersion" INTEGER NOT NULL DEFAULT 1,
  "sections" JSONB NOT NULL,
  "acceptanceText" TEXT NOT NULL,
  "contentHash" TEXT,
  "publishedAt" TIMESTAMP(3),
  "publishedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HandoffTemplateRevision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HandoffPacket" (
  "id" TEXT NOT NULL,
  "portalId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "templateRevisionId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "status" "HandoffPacketStatus" NOT NULL DEFAULT 'DRAFT',
  "recipientName" TEXT NOT NULL,
  "recipientEmail" TEXT NOT NULL,
  "draftData" JSONB NOT NULL,
  "snapshot" JSONB,
  "snapshotSchemaVersion" INTEGER NOT NULL DEFAULT 1,
  "snapshotHash" TEXT,
  "publicTokenHash" TEXT,
  "tokenPreview" TEXT,
  "tokenExpiresAt" TIMESTAMP(3),
  "tokenRevokedAt" TIMESTAMP(3),
  "issuedAt" TIMESTAMP(3),
  "firstSentAt" TIMESTAMP(3),
  "lastSentAt" TIMESTAMP(3),
  "firstViewedAt" TIMESTAMP(3),
  "lastViewedAt" TIMESTAMP(3),
  "viewCount" INTEGER NOT NULL DEFAULT 0,
  "completedAt" TIMESTAMP(3),
  "completedByUserId" TEXT,
  "supersededById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HandoffPacket_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HandoffAcceptance" (
  "id" TEXT NOT NULL,
  "packetId" TEXT NOT NULL,
  "typedName" TEXT NOT NULL,
  "signerTitle" TEXT,
  "authorityConfirmed" BOOLEAN NOT NULL DEFAULT false,
  "acknowledgmentConfirmed" BOOLEAN NOT NULL,
  "acknowledgmentText" TEXT NOT NULL,
  "packetSnapshotHash" TEXT NOT NULL,
  "acceptedAt" TIMESTAMP(3) NOT NULL,
  "submissionKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HandoffAcceptance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HandoffChecklistItem" (
  "id" TEXT NOT NULL,
  "packetId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "required" BOOLEAN NOT NULL DEFAULT false,
  "status" "HandoffChecklistStatus" NOT NULL DEFAULT 'PENDING',
  "note" TEXT,
  "completedAt" TIMESTAMP(3),
  "completedByUserId" TEXT,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HandoffChecklistItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HandoffEmailAttempt" (
  "id" TEXT NOT NULL,
  "packetId" TEXT NOT NULL,
  "recipientEmail" TEXT NOT NULL,
  "status" "HandoffEmailStatus" NOT NULL DEFAULT 'PENDING',
  "kind" "HandoffEmailKind" NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "providerMessageId" TEXT,
  "attemptedAt" TIMESTAMP(3) NOT NULL,
  "sentAt" TIMESTAMP(3),
  "errorCode" TEXT,
  "errorMessage" TEXT,
  "snapshotHash" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HandoffEmailAttempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClientCareEnrollment" (
  "id" TEXT NOT NULL,
  "portalId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "disposition" "ClientCareDisposition" NOT NULL,
  "planNameSnapshot" TEXT,
  "monthlyAmountSnapshot" DECIMAL(10,2),
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "warrantyStartsAt" TIMESTAMP(3),
  "warrantyEndsAt" TIMESTAMP(3),
  "supportEmail" TEXT,
  "responseExpectation" TEXT,
  "notes" TEXT,
  "confirmedAt" TIMESTAMP(3),
  "confirmedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClientCareEnrollment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProjectAuditEvent" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "portalId" TEXT,
  "packetId" TEXT,
  "actorType" "ProjectAuditActorType" NOT NULL,
  "actorUserId" TEXT,
  "eventType" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProjectAuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HandoffTemplate_slug_key" ON "HandoffTemplate"("slug");
CREATE UNIQUE INDEX "HandoffTemplateRevision_templateId_revision_key" ON "HandoffTemplateRevision"("templateId", "revision");
CREATE INDEX "HandoffTemplateRevision_status_idx" ON "HandoffTemplateRevision"("status");
CREATE INDEX "HandoffTemplateRevision_publishedByUserId_idx" ON "HandoffTemplateRevision"("publishedByUserId");
CREATE UNIQUE INDEX "HandoffPacket_publicTokenHash_key" ON "HandoffPacket"("publicTokenHash");
CREATE UNIQUE INDEX "HandoffPacket_portalId_version_key" ON "HandoffPacket"("portalId", "version");
CREATE INDEX "HandoffPacket_clientId_idx" ON "HandoffPacket"("clientId");
CREATE INDEX "HandoffPacket_templateRevisionId_idx" ON "HandoffPacket"("templateRevisionId");
CREATE INDEX "HandoffPacket_status_idx" ON "HandoffPacket"("status");
CREATE INDEX "HandoffPacket_completedByUserId_idx" ON "HandoffPacket"("completedByUserId");
CREATE INDEX "HandoffPacket_supersededById_idx" ON "HandoffPacket"("supersededById");
CREATE UNIQUE INDEX "HandoffAcceptance_packetId_key" ON "HandoffAcceptance"("packetId");
CREATE UNIQUE INDEX "HandoffAcceptance_submissionKey_key" ON "HandoffAcceptance"("submissionKey");
CREATE UNIQUE INDEX "HandoffChecklistItem_packetId_key_key" ON "HandoffChecklistItem"("packetId", "key");
CREATE INDEX "HandoffChecklistItem_packetId_displayOrder_idx" ON "HandoffChecklistItem"("packetId", "displayOrder");
CREATE INDEX "HandoffChecklistItem_completedByUserId_idx" ON "HandoffChecklistItem"("completedByUserId");
CREATE UNIQUE INDEX "HandoffEmailAttempt_idempotencyKey_key" ON "HandoffEmailAttempt"("idempotencyKey");
CREATE INDEX "HandoffEmailAttempt_packetId_attemptedAt_idx" ON "HandoffEmailAttempt"("packetId", "attemptedAt");
CREATE INDEX "HandoffEmailAttempt_status_idx" ON "HandoffEmailAttempt"("status");
CREATE UNIQUE INDEX "ClientCareEnrollment_portalId_key" ON "ClientCareEnrollment"("portalId");
CREATE INDEX "ClientCareEnrollment_clientId_idx" ON "ClientCareEnrollment"("clientId");
CREATE INDEX "ClientCareEnrollment_disposition_idx" ON "ClientCareEnrollment"("disposition");
CREATE INDEX "ClientCareEnrollment_confirmedByUserId_idx" ON "ClientCareEnrollment"("confirmedByUserId");
CREATE INDEX "ProjectAuditEvent_clientId_createdAt_idx" ON "ProjectAuditEvent"("clientId", "createdAt");
CREATE INDEX "ProjectAuditEvent_portalId_createdAt_idx" ON "ProjectAuditEvent"("portalId", "createdAt");
CREATE INDEX "ProjectAuditEvent_packetId_createdAt_idx" ON "ProjectAuditEvent"("packetId", "createdAt");
CREATE INDEX "ProjectAuditEvent_actorUserId_idx" ON "ProjectAuditEvent"("actorUserId");
CREATE INDEX "ProjectAuditEvent_eventType_idx" ON "ProjectAuditEvent"("eventType");

ALTER TABLE "HandoffTemplateRevision" ADD CONSTRAINT "HandoffTemplateRevision_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "HandoffTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HandoffTemplateRevision" ADD CONSTRAINT "HandoffTemplateRevision_publishedByUserId_fkey" FOREIGN KEY ("publishedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HandoffPacket" ADD CONSTRAINT "HandoffPacket_portalId_fkey" FOREIGN KEY ("portalId") REFERENCES "Portal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HandoffPacket" ADD CONSTRAINT "HandoffPacket_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HandoffPacket" ADD CONSTRAINT "HandoffPacket_templateRevisionId_fkey" FOREIGN KEY ("templateRevisionId") REFERENCES "HandoffTemplateRevision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HandoffPacket" ADD CONSTRAINT "HandoffPacket_completedByUserId_fkey" FOREIGN KEY ("completedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HandoffPacket" ADD CONSTRAINT "HandoffPacket_supersededById_fkey" FOREIGN KEY ("supersededById") REFERENCES "HandoffPacket"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HandoffAcceptance" ADD CONSTRAINT "HandoffAcceptance_packetId_fkey" FOREIGN KEY ("packetId") REFERENCES "HandoffPacket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HandoffChecklistItem" ADD CONSTRAINT "HandoffChecklistItem_packetId_fkey" FOREIGN KEY ("packetId") REFERENCES "HandoffPacket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HandoffChecklistItem" ADD CONSTRAINT "HandoffChecklistItem_completedByUserId_fkey" FOREIGN KEY ("completedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HandoffEmailAttempt" ADD CONSTRAINT "HandoffEmailAttempt_packetId_fkey" FOREIGN KEY ("packetId") REFERENCES "HandoffPacket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClientCareEnrollment" ADD CONSTRAINT "ClientCareEnrollment_portalId_fkey" FOREIGN KEY ("portalId") REFERENCES "Portal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ClientCareEnrollment" ADD CONSTRAINT "ClientCareEnrollment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ClientCareEnrollment" ADD CONSTRAINT "ClientCareEnrollment_confirmedByUserId_fkey" FOREIGN KEY ("confirmedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProjectAuditEvent" ADD CONSTRAINT "ProjectAuditEvent_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProjectAuditEvent" ADD CONSTRAINT "ProjectAuditEvent_portalId_fkey" FOREIGN KEY ("portalId") REFERENCES "Portal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProjectAuditEvent" ADD CONSTRAINT "ProjectAuditEvent_packetId_fkey" FOREIGN KEY ("packetId") REFERENCES "HandoffPacket"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProjectAuditEvent" ADD CONSTRAINT "ProjectAuditEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
