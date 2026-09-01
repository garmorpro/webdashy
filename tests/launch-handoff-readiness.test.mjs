import test from "node:test";
import assert from "node:assert/strict";
import {
  workflowStageAfterLaunchHandoffReadiness,
} from "../src/lib/services/launch-handoff-readiness-state.mjs";

function applyReadinessEvent(state, event) {
  const next = { ...state };
  if (event === "approval") next.reviewApproved = true;
  if (event === "payment") next.unpaidInvoiceCount = 0;
  next.workflowStage = workflowStageAfterLaunchHandoffReadiness(next.workflowStage, next);
  return next;
}

const initialState = {
  workflowStage: "INVOICE",
  reviewApproved: false,
  invoiceCount: 1,
  unpaidInvoiceCount: 1,
};

test("approval followed by payment reaches Payment Received without skipping to Client Care", () => {
  const afterApproval = applyReadinessEvent(initialState, "approval");
  assert.equal(afterApproval.workflowStage, "INVOICE");

  const afterPayment = applyReadinessEvent(afterApproval, "payment");
  assert.equal(afterPayment.workflowStage, "PAYMENT_RECEIVED");
  assert.notEqual(afterPayment.workflowStage, "CLIENT_CARE");
});

test("payment followed by approval reaches Payment Received without skipping to Client Care", () => {
  const afterPayment = applyReadinessEvent(initialState, "payment");
  assert.equal(afterPayment.workflowStage, "INVOICE");

  const afterApproval = applyReadinessEvent(afterPayment, "approval");
  assert.equal(afterApproval.workflowStage, "PAYMENT_RECEIVED");
  assert.notEqual(afterApproval.workflowStage, "CLIENT_CARE");
});

test("readiness synchronization never regresses stages beyond Payment Received", () => {
  const workflowStage = workflowStageAfterLaunchHandoffReadiness("LAUNCH_AND_HANDOFF", {
    reviewApproved: true,
    invoiceCount: 1,
    unpaidInvoiceCount: 0,
  });
  assert.equal(workflowStage, "LAUNCH_AND_HANDOFF");
});
