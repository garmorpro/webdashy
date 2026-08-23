"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getAbsoluteUrl } from "@/lib/site-url";
import { sendReviewOutcomeNotification } from "@/lib/mail";
import { maybeCompleteProject } from "@/lib/project-completion";

export type ReviewActionState = { error?: string };

/**
 * Resolves strictly by the delivery's own unguessable reviewToken — same
 * security model as public-portal.ts's confirmPortalSelection: never trust
 * a client-supplied portal/client id, only the token itself grants access.
 */
async function findDeliveryByToken(reviewToken: string) {
  return db.delivery.findUnique({
    where: { reviewToken },
    include: { portal: { include: { client: true } } },
  });
}

export async function approveDelivery(reviewToken: string): Promise<ReviewActionState> {
  const delivery = await findDeliveryByToken(reviewToken);
  if (!delivery) return { error: "This review link is no longer valid." };
  if (delivery.reviewStatus === "APPROVED") return {};

  await db.delivery.update({
    where: { id: delivery.id },
    data: { reviewStatus: "APPROVED", reviewFeedback: null, reviewedAt: new Date() },
  });

  await maybeCompleteProject(delivery.portal.clientId, delivery.portalId);

  revalidatePath(`/r/${reviewToken}`);
  revalidatePath(`/clients/${delivery.portal.clientId}`);

  await sendReviewOutcomeNotification({
    clientName: delivery.portal.client.businessName,
    approved: true,
    feedback: null,
    clientAdminUrl: await getAbsoluteUrl(`/clients/${delivery.portal.clientId}`),
  });

  return {};
}

export async function requestChanges(
  reviewToken: string,
  feedback: string
): Promise<ReviewActionState> {
  const trimmed = feedback.trim();
  if (!trimmed) return { error: "Let us know what you'd like changed." };

  const delivery = await findDeliveryByToken(reviewToken);
  if (!delivery) return { error: "This review link is no longer valid." };

  await db.delivery.update({
    where: { id: delivery.id },
    data: { reviewStatus: "CHANGES_REQUESTED", reviewFeedback: trimmed, reviewedAt: new Date() },
  });

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
