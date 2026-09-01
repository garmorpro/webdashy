import "server-only";

import type { Prisma, WorkflowStage } from "@prisma/client";
import { db } from "@/lib/db";
import { canTransitionWorkflowStage, workflowStageIndex } from "@/lib/workflow";

type WorkflowClient = Pick<Prisma.TransactionClient, "client">;

export class ClientWorkflowTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClientWorkflowTransitionError";
  }
}

export async function transitionClientWorkflow(
  clientId: string,
  targetStage: WorkflowStage,
  client: WorkflowClient = db
): Promise<{ stage: WorkflowStage }> {
  const record = await client.client.findUnique({
    where: { id: clientId },
    select: { workflowStage: true },
  });

  if (!record) {
    throw new ClientWorkflowTransitionError("Client not found.");
  }

  if (record.workflowStage === targetStage) {
    return { stage: record.workflowStage };
  }

  if (!canTransitionWorkflowStage(record.workflowStage, targetStage)) {
    throw new ClientWorkflowTransitionError(
      `Cannot transition workflow from ${record.workflowStage} to ${targetStage}.`
    );
  }

  // Include the observed stage in the mutation so concurrent transitions
  // cannot silently skip a stage.
  const result = await client.client.updateMany({
    where: { id: clientId, workflowStage: record.workflowStage },
    data: { workflowStage: targetStage },
  });

  if (result.count !== 1) {
    throw new ClientWorkflowTransitionError(
      "The client workflow changed while this transition was being saved."
    );
  }

  return { stage: targetStage };
}

/** Advance to a proven business milestone without ever regressing progress. */
export async function advanceClientWorkflow(
  clientId: string,
  targetStage: WorkflowStage,
  client: WorkflowClient = db
): Promise<{ stage: WorkflowStage }> {
  const record = await client.client.findUnique({
    where: { id: clientId },
    select: { workflowStage: true },
  });

  if (!record) throw new ClientWorkflowTransitionError("Client not found.");

  if (workflowStageIndex(record.workflowStage) >= workflowStageIndex(targetStage)) {
    return { stage: record.workflowStage };
  }

  const result = await client.client.updateMany({
    where: { id: clientId, workflowStage: record.workflowStage },
    data: { workflowStage: targetStage },
  });
  if (result.count !== 1) {
    throw new ClientWorkflowTransitionError(
      "The client workflow changed while this milestone was being saved."
    );
  }
  return { stage: targetStage };
}
