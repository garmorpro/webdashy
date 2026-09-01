"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getAbsoluteUrl } from "@/lib/site-url";
import { sendReviewOutcomeNotification } from "@/lib/mail";
import { advanceClientWorkflow } from "@/lib/services/client-workflow";
import { synchronizeLaunchHandoffReadiness } from "@/lib/project-completion";

export type ReviewActionState = { error?: string };

async function findDeliveryByToken(reviewToken: string) {
  return db.delivery.findUnique({
    where: { reviewToken },
    include: {
      reviews: { orderBy: { cycle: "desc" }, take: 1 },
      portal: { include: { client: true } },
    },
  });
}

export async function approveDelivery(reviewToken: string): Promise<ReviewActionState> {
  const delivery = await findDeliveryByToken(reviewToken);
  const review = delivery?.reviews[0];
  if (!delivery || !review) return { error: "This review link is no longer valid." };
  if (review.status === "APPROVED") return {};
  if (review.status !== "AWAITING") return { error: "This review round has already received a response." };
  const now = new Date();
  try {
    await db.$transaction(async (tx) => {
      await tx.deliveryReview.update({
        where: { id: review.id },
        data: { status: "APPROVED", respondedAt: now },
      });
      await tx.delivery.update({
        where: { id: delivery.id },
        data: { reviewStatus: "APPROVED", reviewFeedback: null, reviewedAt: now },
      });
      await advanceClientWorkflow(delivery.portal.clientId, "REVISIONS_APPROVED", tx);
    });
  } catch (err) {
    console.error("approveDelivery failed:", err);
    return { error: "We couldn't save your approval. Please try again." };
  }
  revalidatePath(`/r/${reviewToken}`);
  revalidatePath(`/clients/${delivery.portal.clientId}`);
  await synchronizeLaunchHandoffReadiness(delivery.portal.clientId, delivery.portalId);
  await sendReviewOutcomeNotification({
    clientName: delivery.portal.client.businessName,
    approved: true,
    feedback: null,
    clientAdminUrl: await getAbsoluteUrl(`/clients/${delivery.portal.clientId}`),
  });
  return {};
}

export async function requestChanges(reviewToken: string, feedback: string): Promise<ReviewActionState> {
  const trimmed = feedback.trim();
  if (!trimmed) return { error: "Let us know what you'd like changed." };
  const delivery = await findDeliveryByToken(reviewToken);
  const review = delivery?.reviews[0];
  if (!delivery || !review) return { error: "This review link is no longer valid." };
  if (review.status !== "AWAITING") return { error: "This review round has already received a response." };
  const now = new Date();
  await db.$transaction([
    db.deliveryReview.update({
      where: { id: review.id },
      data: { status: "CHANGES_REQUESTED", feedback: trimmed, respondedAt: now },
    }),
    db.delivery.update({
      where: { id: delivery.id },
      data: { reviewStatus: "CHANGES_REQUESTED", reviewFeedback: trimmed, reviewedAt: now },
    }),
  ]);
  revalidatePath(`/r/${reviewToken}`);
  revalidatePath(`/clients/${delivery.portal.clientId}`);
  await sendReviewOutcomeNotification({
    clientName: delivery.portal.client.businessName,
    approved: false,
    feedback: trimmed,
    clientAdminUrl: await getAbsoluteUrl(`/clients/${delivery.portal.clientId}`),
  });
  return {};
}
