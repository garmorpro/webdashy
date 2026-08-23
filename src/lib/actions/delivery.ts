"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { generateReviewToken } from "@/lib/tokens";
import { getAbsoluteUrl } from "@/lib/site-url";
import { sendDeliveryReviewEmail } from "@/lib/mail";
import { pipelineStepIndex } from "@/lib/client-status";

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

/**
 * Marks the site Delivered and emails the client their review link.
 * Requires a live URL — takes it from the form if provided, otherwise
 * falls back to whatever was already saved via saveDeliveryUrls.
 */
export async function markDelivered(
  portalId: string,
  clientId: string,
  _prevState: DeliveryActionState,
  formData: FormData
): Promise<DeliveryActionState> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };

  const [client, existing] = await Promise.all([
    db.client.findUnique({ where: { id: clientId } }),
    db.delivery.findUnique({ where: { portalId } }),
  ]);
  if (!client) return { error: "Client not found." };

  const liveUrlInput = String(formData.get("liveUrl") ?? "").trim();
  const liveUrl = liveUrlInput || existing?.liveUrl;
  if (!liveUrl) return { error: "Enter the live site URL before marking this delivered." };

  const reviewToken = existing?.reviewToken || generateReviewToken(client.businessName);

  try {
    await db.delivery.upsert({
      where: { portalId },
      update: {
        status: "DELIVERED",
        liveUrl,
        reviewToken,
        reviewStatus: "AWAITING",
        reviewFeedback: null,
        deliveredAt: new Date(),
      },
      create: {
        portalId,
        status: "DELIVERED",
        liveUrl,
        reviewToken,
        deliveredAt: new Date(),
      },
    });
  } catch (err) {
    console.error("markDelivered failed:", err);
    return { error: "Something went wrong. Please try again." };
  }

  try {
    const reviewUrl = await getAbsoluteUrl(`/r/${reviewToken}`);
    await sendDeliveryReviewEmail({
      to: client.email,
      contactName: client.contactName,
      businessName: client.businessName,
      liveUrl,
      reviewUrl,
    });
  } catch (err) {
    console.error("Site marked delivered but review email failed to send:", err);
    return { error: "Marked delivered, but the review email couldn't be sent. Try again from here." };
  }

  await advanceStatus(clientId, "DELIVERED");

  revalidatePath(`/clients/${clientId}`);
  return {};
}
