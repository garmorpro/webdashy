import type { ClientStatus, WorkflowStage } from "@prisma/client";

export type WorkflowStageDefinition = Readonly<{
  key: WorkflowStage;
  label: string;
}>;

export const WORKFLOW_STAGES = [
  { key: "ADD_LEAD", label: "Add Lead" },
  { key: "CONTACT", label: "Contact" },
  { key: "QUESTIONNAIRE_SENT", label: "Questionnaire Sent" },
  { key: "QUESTIONNAIRE_COMPLETE", label: "Questionnaire Complete" },
  { key: "PORTAL_SENT", label: "Portal Sent" },
  { key: "TEMPLATE_AND_PLAN", label: "Template & Plan" },
  { key: "BUILD_SETUP", label: "Build Setup" },
  { key: "WEBSITE_DRAFT", label: "Website Draft" },
  { key: "CLIENT_REVIEW", label: "Client Review" },
  { key: "REVISIONS_APPROVED", label: "Revisions / Approved" },
  { key: "INVOICE", label: "Invoice" },
  { key: "PAYMENT_RECEIVED", label: "Payment Received" },
  { key: "LAUNCH_AND_HANDOFF", label: "Launch & Handoff" },
  { key: "CLIENT_CARE", label: "Client Care" },
] as const satisfies readonly WorkflowStageDefinition[];

export const WORKFLOW_STAGE_KEYS = WORKFLOW_STAGES.map((stage) => stage.key);

export const WORKFLOW_STAGE_LABELS = Object.fromEntries(
  WORKFLOW_STAGES.map((stage) => [stage.key, stage.label])
) as Record<WorkflowStage, string>;

const WORKFLOW_STAGE_INDEX = new Map<WorkflowStage, number>(
  WORKFLOW_STAGES.map((stage, index) => [stage.key, index])
);

export function isWorkflowStage(value: unknown): value is WorkflowStage {
  return typeof value === "string" && WORKFLOW_STAGE_INDEX.has(value as WorkflowStage);
}

export function workflowStageIndex(stage: WorkflowStage): number {
  return WORKFLOW_STAGE_INDEX.get(stage) ?? -1;
}

export function workflowStageAtIndex(index: number): WorkflowStage | undefined {
  return WORKFLOW_STAGES[index]?.key;
}

export function nextWorkflowStage(stage: WorkflowStage): WorkflowStage | undefined {
  return workflowStageAtIndex(workflowStageIndex(stage) + 1);
}

export function previousWorkflowStage(stage: WorkflowStage): WorkflowStage | undefined {
  return workflowStageAtIndex(workflowStageIndex(stage) - 1);
}

export function canTransitionWorkflowStage(from: WorkflowStage, to: WorkflowStage): boolean {
  return nextWorkflowStage(from) === to;
}

// Compatibility mapping used by the migration and by new-client creation.
// LOST has no V2 lifecycle equivalent; it remains a legacy disposition.
export function workflowStageForClientStatus(status: ClientStatus): WorkflowStage {
  switch (status) {
    case "LEAD":
    case "LOST":
      return "ADD_LEAD";
    case "CONTACTED":
    case "INTERESTED":
      return "CONTACT";
    case "QUESTIONNAIRE_SENT":
      return "QUESTIONNAIRE_SENT";
    case "QUESTIONNAIRE_DONE":
      return "QUESTIONNAIRE_COMPLETE";
    case "PORTAL_SENT":
    case "VIEWED":
      return "PORTAL_SENT";
    case "TEMPLATE_SELECTED":
      return "TEMPLATE_AND_PLAN";
    case "INVOICE_SENT":
      return "INVOICE";
    case "BUILDING":
      return "BUILD_SETUP";
    case "DELIVERED":
      return "LAUNCH_AND_HANDOFF";
    case "WON":
      return "CLIENT_CARE";
  }
}
