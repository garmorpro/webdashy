"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getAbsoluteUrl } from "@/lib/site-url";
import { sendSelectionNotification } from "@/lib/mail";
import { Prisma } from "@prisma/client";
import { advanceClientWorkflow } from "@/lib/services/client-workflow";

export type ConfirmSelectionState = { error?: string };

/**
 * Confirms a client's template choice for a public portal.
 *
 * Security: resolves the portal strictly by its opaque `token` — never
 * trusts a client-supplied portal/client id, so a visitor can never act on
 * a portal other than the one their own link's token grants them (see
 * ARCHITECTURE.md §6). Also re-validates that `templateId` actually
 * belongs to this portal, defense in depth against a tampered request.
 */
export async function confirmPortalSelection(
  token: string,
  templateId: string,
  planId: string | null
): Promise<ConfirmSelectionState> {
  const portal = await db.portal.findUnique({
    where: { token },
    include: {
      client: true,
      templates: { include: { template: true } },
      selection: true,
    },
  });

  if (!portal) return { error: "This portal link is no longer valid." };

  if (portal.status === "DISABLED") {
    return { error: "This portal is no longer available. Please reach out for a new link." };
  }

  if (portal.selection) {
    // Already confirmed (e.g. a double-submit) — nothing to do.
    return {};
  }

  const chosen = portal.templates.find((t) => t.templateId === templateId);
  if (!chosen) {
    return {
      error: "That template isn't part of this selection. Please choose one of the options shown.",
    };
  }

  // Re-validate the plan the same way — never trust a client-supplied id
  // without confirming it's real and currently offered.
  let validPlanId: string | null = null;
  if (planId) {
    const plan = await db.plan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive) {
      return { error: "That plan isn't available. Please choose one of the options shown." };
    }
    validPlanId = plan.id;
  }

  let selectedAt: Date;
  try {
    const created = await db.$transaction(async (tx) => {
      const selection = await tx.templateSelection.create({
        data: { portalId: portal.id, templateId, planId: validPlanId },
      });
      await tx.portal.update({
        where: { id: portal.id },
        data: { status: "SELECTED" },
      });
      await tx.client.update({
        where: { id: portal.clientId },
        data: { status: "TEMPLATE_SELECTED" },
      });
      await advanceClientWorkflow(portal.clientId, "TEMPLATE_AND_PLAN", tx);
      return selection;
    });
    selectedAt = created.selectedAt;
  } catch (err) {
    // Unique constraint on TemplateSelection.portalId — a concurrent
    // request already recorded a selection. Treat as success rather than
    // erroring the visitor over a race they didn't cause.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      revalidatePath(`/p/${token}`);
      return {};
    }
    console.error("confirmPortalSelection failed:", err);
    return { error: "Something went wrong saving your selection. Please try again." };
  }

  revalidatePath(`/p/${token}`);
  revalidatePath("/clients");
  revalidatePath(`/clients/${portal.clientId}`);

  // Best-effort — see sendSelectionNotification's own error handling. Never
  // let email trouble affect the response to the client who just selected.
  await sendSelectionNotification({
    clientName: portal.client.businessName,
    templateName: chosen.template.name,
    selectedAt,
    clientAdminUrl: await getAbsoluteUrl(`/clients/${portal.clientId}`),
  });

  return {};
}
