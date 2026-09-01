-- CreateEnum
CREATE TYPE "WorkflowStage" AS ENUM (
  'ADD_LEAD',
  'CONTACT',
  'QUESTIONNAIRE_SENT',
  'QUESTIONNAIRE_COMPLETE',
  'PORTAL_SENT',
  'TEMPLATE_AND_PLAN',
  'BUILD_SETUP',
  'WEBSITE_DRAFT',
  'CLIENT_REVIEW',
  'REVISIONS_APPROVED',
  'INVOICE',
  'PAYMENT_RECEIVED',
  'LAUNCH_AND_HANDOFF',
  'CLIENT_CARE'
);

-- AlterTable. The default safely initializes every existing row before the
-- status-based backfill below assigns its best-known lifecycle position.
ALTER TABLE "Client"
ADD COLUMN "workflowStage" "WorkflowStage" NOT NULL DEFAULT 'ADD_LEAD';

-- Backfill from the legacy ClientStatus. LOST is intentionally left at
-- ADD_LEAD because it is a disposition, not evidence of lifecycle progress.
UPDATE "Client"
SET "workflowStage" = CASE "status"
  WHEN 'LEAD' THEN 'ADD_LEAD'::"WorkflowStage"
  WHEN 'CONTACTED' THEN 'CONTACT'::"WorkflowStage"
  WHEN 'INTERESTED' THEN 'CONTACT'::"WorkflowStage"
  WHEN 'QUESTIONNAIRE_SENT' THEN 'QUESTIONNAIRE_SENT'::"WorkflowStage"
  WHEN 'QUESTIONNAIRE_DONE' THEN 'QUESTIONNAIRE_COMPLETE'::"WorkflowStage"
  WHEN 'PORTAL_SENT' THEN 'PORTAL_SENT'::"WorkflowStage"
  WHEN 'VIEWED' THEN 'PORTAL_SENT'::"WorkflowStage"
  WHEN 'TEMPLATE_SELECTED' THEN 'TEMPLATE_AND_PLAN'::"WorkflowStage"
  WHEN 'INVOICE_SENT' THEN 'INVOICE'::"WorkflowStage"
  WHEN 'BUILDING' THEN 'BUILD_SETUP'::"WorkflowStage"
  WHEN 'DELIVERED' THEN 'LAUNCH_AND_HANDOFF'::"WorkflowStage"
  WHEN 'WON' THEN 'CLIENT_CARE'::"WorkflowStage"
  WHEN 'LOST' THEN 'ADD_LEAD'::"WorkflowStage"
END;

-- CreateIndex
CREATE INDEX "Client_workflowStage_idx" ON "Client"("workflowStage");
