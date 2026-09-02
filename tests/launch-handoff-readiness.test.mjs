import test from "node:test";
import assert from "node:assert/strict";
import {
  workflowStageAfterHandoffBegins,
  workflowStageAfterLaunchHandoffReadiness,
} from "../src/lib/services/launch-handoff-readiness-state.mjs";
import { workflowStepState } from "../src/components/admin/client-stepper-state.mjs";

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

test("beginning handoff advances Payment Received to Launch & Handoff", () => {
  const facts = { reviewApproved: true, invoiceCount: 1, unpaidInvoiceCount: 0 };
  assert.equal(workflowStageAfterHandoffBegins("PAYMENT_RECEIVED", facts), "LAUNCH_AND_HANDOFF");
  assert.equal(workflowStageAfterHandoffBegins("INVOICE", facts), "INVOICE");
});

test("beginning handoff never regresses later workflow stages", () => {
  const facts = { reviewApproved: true, invoiceCount: 1, unpaidInvoiceCount: 0 };
  assert.equal(workflowStageAfterHandoffBegins("LAUNCH_AND_HANDOFF", facts), "LAUNCH_AND_HANDOFF");
  assert.equal(workflowStageAfterHandoffBegins("CLIENT_CARE", facts), "CLIENT_CARE");
});

test("stepper marks Payment Received complete and Launch & Handoff current", () => {
  const payment = workflowStepState(11, 12), handoff = workflowStepState(12, 12), care = workflowStepState(13, 12);
  assert.deepEqual(payment, { done: true, current: false });
  assert.deepEqual(handoff, { done: false, current: true });
  assert.deepEqual(care, { done: false, current: false });
});
