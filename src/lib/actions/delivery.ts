"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { generateReviewToken } from "@/lib/tokens";
import { getAbsoluteUrl } from "@/lib/site-url";
import { sendDeliveryReviewEmail } from "@/lib/mail";
import { pipelineStepIndex } from "@/lib/client-status";
import {
  advanceClientWorkflow,
  ClientWorkflowTransitionError,
  transitionClientWorkflow,
} from "@/lib/services/client-workflow";

export type DeliveryActionState = { error?: string };

async function requireAdmin(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ? null : "You must be signed in.";
}

async function advanceStatus(clientId: string, status: "BUILDING" | "DELIVERED") {
  const client = await db.client.findUnique({ where: { id: clientId } });
  if (client && pipelineStepIndex(status) > pipelineStepIndex(client.status)) {
    await db.client.update({ where: { id: clientId }, data: { status } });
  }
}

export async function startBuilding(portalId: string, clientId: string) {
  const authError = await requireAdmin();
  if (authError) throw new Error(authError);
  await db.delivery.upsert({
    where: { portalId },
    update: { status: "BUILDING" },
    create: { portalId, status: "BUILDING" },
  });
  await advanceStatus(clientId, "BUILDING");
  await advanceClientWorkflow(clientId, "BUILD_SETUP");
  revalidatePath(`/clients/${clientId}`);
}

export async function saveDeliveryUrls(
  portalId: string,
  clientId: string,
  _prevState: DeliveryActionState,
  formData: FormData
): Promise<DeliveryActionState> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };
  const stagingUrl = String(formData.get("stagingUrl") ?? "").trim() || null;
  const liveUrl = String(formData.get("liveUrl") ?? "").trim() || null;
  try {
    await db.delivery.upsert({
      where: { portalId },
      update: { stagingUrl, liveUrl },
      create: { portalId, stagingUrl, liveUrl, status: "BUILDING" },
    });
  } catch (err) {
    console.error("saveDeliveryUrls failed:", err);
    return { error: "Something went wrong saving. Please try again." };
  }
  revalidatePath(`/clients/${clientId}`);
  return {};
}

export async function markWebsiteDraftReady(
  portalId: string,
  clientId: string,
  _prevState: DeliveryActionState,
  formData: FormData
): Promise<DeliveryActionState> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };
  const existing = await db.delivery.findUnique({ where: { portalId } });
  const stagingUrl = String(formData.get("stagingUrl") ?? "").trim() || existing?.stagingUrl;
  if (!stagingUrl) return { error: "Enter a staging URL before marking the draft ready." };
  try {
    await db.$transaction(async (tx) => {
      await tx.delivery.upsert({
        where: { portalId },
        update: { stagingUrl },
        create: { portalId, stagingUrl, status: "BUILDING" },
      });
      await transitionClientWorkflow(clientId, "WEBSITE_DRAFT", tx);
    });
  } catch (err) {
    console.error("markWebsiteDraftReady failed:", err);
    return {
      error:
        err instanceof ClientWorkflowTransitionError
          ? err.message
          : "Something went wrong. Please try again.",
    };
  }
  revalidatePath(`/clients/${clientId}`);
  return {};
}

export async function sendClientReview(
  portalId: string,
  clientId: string,
  _prevState: DeliveryActionState,
  formData: FormData
): Promise<DeliveryActionState> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };
  const [client, existing] = await Promise.all([
    db.client.findUnique({ where: { id: clientId } }),
    db.delivery.findUnique({
      where: { portalId },
      include: { portal: { select: { clientId: true } } },
    }),
  ]);
  if (!client || existing?.portal.clientId !== clientId) return { error: "Client project not found." };
  const canSend =
    client.workflowStage === "WEBSITE_DRAFT" ||
    (client.workflowStage === "CLIENT_REVIEW" && existing.reviewStatus === "CHANGES_REQUESTED");
  if (!canSend) return { error: "This project is not ready to send for client review." };
  const stagingUrl = String(formData.get("stagingUrl") ?? "").trim() || existing?.stagingUrl;
  if (!stagingUrl) return { error: "Enter a staging URL before sending the review." };
  const reviewToken = existing?.reviewToken || generateReviewToken(client.businessName);

  try {
    await db.delivery.upsert({
      where: { portalId },
      update: { stagingUrl, reviewToken },
      create: { portalId, stagingUrl, reviewToken },
    });
    const reviewUrl = await getAbsoluteUrl(`/r/${reviewToken}`);
    await sendDeliveryReviewEmail({
      to: client.email,
      contactName: client.contactName,
      businessName: client.businessName,
      stagingUrl,
      reviewUrl,
    });
  } catch (err) {
    console.error("Client review email failed to send:", err);
    return { error: "The review email couldn't be sent. The workflow was not advanced; please try again." };
  }

  try {
    await db.$transaction(async (tx) => {
      const delivery = await tx.delivery.findUniqueOrThrow({ where: { portalId } });
      const latest = await tx.deliveryReview.findFirst({
        where: { deliveryId: delivery.id },
        orderBy: { cycle: "desc" },
        select: { cycle: true },
      });
      await tx.delivery.update({
        where: { id: delivery.id },
        data: { reviewStatus: "AWAITING", reviewFeedback: null, reviewedAt: null },
      });
      await tx.deliveryReview.create({
        data: { deliveryId: delivery.id, cycle: (latest?.cycle ?? 0) + 1, stagingUrl },
      });
      await transitionClientWorkflow(clientId, "CLIENT_REVIEW", tx);
    });
  } catch (err) {
    console.error("Review email sent but review state failed to save:", err);
    return { error: "The email was sent, but the review state couldn't be saved. Refresh before retrying." };
  }
  revalidatePath(`/clients/${clientId}`);
  return {};
}
