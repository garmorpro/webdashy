import "server-only";

import type { WorkflowStage } from "@prisma/client";
import { db } from "@/lib/db";
import { canTransitionWorkflowStage } from "@/lib/workflow";

export class ClientWorkflowTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClientWorkflowTransitionError";
  }
}

export async function transitionClientWorkflow(
  clientId: string,
  targetStage: WorkflowStage
): Promise<{ stage: WorkflowStage }> {
  const client = await db.client.findUnique({
    where: { id: clientId },
    select: { workflowStage: true },
  });

  if (!client) {
    throw new ClientWorkflowTransitionError("Client not found.");
  }

  if (client.workflowStage === targetStage) {
    return { stage: client.workflowStage };
  }

  if (!canTransitionWorkflowStage(client.workflowStage, targetStage)) {
    throw new ClientWorkflowTransitionError(
      `Cannot transition workflow from ${client.workflowStage} to ${targetStage}.`
    );
  }

  // Include the observed stage in the mutation so concurrent transitions
  // cannot silently skip a stage.
  const result = await db.client.updateMany({
    where: { id: clientId, workflowStage: client.workflowStage },
    data: { workflowStage: targetStage },
  });

  if (result.count !== 1) {
    throw new ClientWorkflowTransitionError(
      "The client workflow changed while this transition was being saved."
    );
  }

  return { stage: targetStage };
}
