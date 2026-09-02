const WORKFLOW_STAGES = [
  "ADD_LEAD",
  "CONTACT",
  "QUESTIONNAIRE_SENT",
  "QUESTIONNAIRE_COMPLETE",
  "PORTAL_SENT",
  "TEMPLATE_AND_PLAN",
  "BUILD_SETUP",
  "WEBSITE_DRAFT",
  "CLIENT_REVIEW",
  "REVISIONS_APPROVED",
  "INVOICE",
  "PAYMENT_RECEIVED",
  "LAUNCH_AND_HANDOFF",
  "CLIENT_CARE",
];

export function isLaunchHandoffReady({
  reviewApproved,
  invoiceCount,
  unpaidInvoiceCount,
}) {
  return reviewApproved && invoiceCount > 0 && unpaidInvoiceCount === 0;
}

export function workflowStageAfterLaunchHandoffReadiness(currentStage, readiness) {
  if (!isLaunchHandoffReady(readiness)) return currentStage;

  const currentIndex = WORKFLOW_STAGES.indexOf(currentStage);
  const paymentReceivedIndex = WORKFLOW_STAGES.indexOf("PAYMENT_RECEIVED");
  return currentIndex >= paymentReceivedIndex ? currentStage : "PAYMENT_RECEIVED";
}

export function workflowStageAfterHandoffBegins(currentStage, readiness) {
  if (!isLaunchHandoffReady(readiness)) return currentStage;
  const currentIndex = WORKFLOW_STAGES.indexOf(currentStage);
  const handoffIndex = WORKFLOW_STAGES.indexOf("LAUNCH_AND_HANDOFF");
  return currentIndex >= handoffIndex ? currentStage : currentStage === "PAYMENT_RECEIVED" ? "LAUNCH_AND_HANDOFF" : currentStage;
}
