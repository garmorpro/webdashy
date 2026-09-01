import test from "node:test";
import assert from "node:assert/strict";
import { canBeginProvisioning } from "../src/lib/services/provisioning-state.mjs";

test("only fresh and definitely failed provisioning can acquire a retry lease", () => {
  assert.equal(canBeginProvisioning("NOT_STARTED"), true);
  assert.equal(canBeginProvisioning("FAILED"), true);
  for (const status of ["IN_PROGRESS", "SUCCEEDED", "NEEDS_RECONCILIATION"]) assert.equal(canBeginProvisioning(status), false);
});
