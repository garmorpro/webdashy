import test from "node:test";
import assert from "node:assert/strict";
import {
  ClientCareDisposition,
  HandoffChecklistStatus,
  HandoffPacketStatus,
  HandoffTemplateRevisionStatus,
} from "@prisma/client";

test("handoff packet statuses match the V1 lifecycle", () => {
  assert.deepEqual(Object.values(HandoffPacketStatus), [
    "DRAFT",
    "ISSUED",
    "SENT",
    "VIEWED",
    "ACCEPTED",
    "COMPLETED",
    "SUPERSEDED",
    "REVOKED",
  ]);
});

test("template revision statuses preserve draft, published, and retired states", () => {
  assert.deepEqual(Object.values(HandoffTemplateRevisionStatus), [
    "DRAFT",
    "PUBLISHED",
    "RETIRED",
  ]);
});

test("client care dispositions match the supported completion choices", () => {
  assert.deepEqual(Object.values(ClientCareDisposition), [
    "ENROLLED",
    "DECLINED",
    "INCLUDED",
    "NOT_APPLICABLE",
  ]);
});

test("handoff checklist statuses match the V1 checklist lifecycle", () => {
  assert.deepEqual(Object.values(HandoffChecklistStatus), [
    "PENDING",
    "COMPLETED",
    "WAIVED",
    "NOT_APPLICABLE",
  ]);
});
