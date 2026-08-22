"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

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
  templateId: string
): Promise<ConfirmSelectionState> {
  const portal = await db.portal.findUnique({
    where: { token },
    include: { templates: true, selection: true },
  });

  if (!portal) return { error: "This portal link is no longer valid." };

  if (portal.status === "DISABLED") {
    return { error: "This portal is no longer available. Please reach out for a new link." };
  }

  if (portal.selection) {
    // Already confirmed (e.g. a double-submit) — nothing to do.
    return {};
  }

  const isValidTemplate = portal.templates.some((t) => t.templateId === templateId);
  if (!isValidTemplate) {
    return {
      error: "That template isn't part of this selection. Please choose one of the options shown.",
    };
  }

  try {
    await db.$transaction([
      db.templateSelection.create({
        data: { portalId: portal.id, templateId },
      }),
      db.portal.update({
        where: { id: portal.id },
        data: { status: "SELECTED" },
      }),
      db.client.update({
        where: { id: portal.clientId },
        data: { status: "TEMPLATE_SELECTED" },
      }),
    ]);
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
  revalidatePath("/portals");
  return {};
}
