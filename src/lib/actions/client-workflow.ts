"use server";

import type { WorkflowStage } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  ClientWorkflowTransitionError,
  transitionClientWorkflow,
} from "@/lib/services/client-workflow";
import { isWorkflowStage } from "@/lib/workflow";

export type WorkflowTransitionActionResult =
  | { success: true; stage: WorkflowStage }
  | { success: false; error: string };

export async function transitionClientWorkflowAction(
  clientId: string,
  targetStage: string
): Promise<WorkflowTransitionActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in." };
  }

  if (!clientId.trim() || !isWorkflowStage(targetStage)) {
    return { success: false, error: "Invalid workflow transition." };
  }

  try {
    const result = await transitionClientWorkflow(clientId, targetStage);
    revalidatePath("/clients");
    revalidatePath(`/clients/${clientId}`);
    return { success: true, stage: result.stage };
  } catch (error) {
    if (error instanceof ClientWorkflowTransitionError) {
      return { success: false, error: error.message };
    }

    console.error("transitionClientWorkflowAction failed:", error);
    return { success: false, error: "Unable to update the client workflow." };
  }
}
