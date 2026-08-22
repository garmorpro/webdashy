"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { generatePortalToken } from "@/lib/tokens";

export type PortalActionState = { error?: string };

const MIN_TEMPLATES = 2;
const MAX_TEMPLATES = 8;

function readTemplateIds(formData: FormData): string[] {
  return Array.from(new Set(formData.getAll("templateIds").map(String).filter(Boolean)));
}

function validateTemplateCount(templateIds: string[]): string | undefined {
  if (templateIds.length < MIN_TEMPLATES) {
    return `Select at least ${MIN_TEMPLATES} templates.`;
  }
  if (templateIds.length > MAX_TEMPLATES) {
    return `Select at most ${MAX_TEMPLATES} templates — a curated shortlist works best.`;
  }
  return undefined;
}

export async function createPortal(
  clientId: string,
  _prevState: PortalActionState,
  formData: FormData
): Promise<PortalActionState> {
  const templateIds = readTemplateIds(formData);
  const countError = validateTemplateCount(templateIds);
  if (countError) return { error: countError };

  const message = String(formData.get("message") ?? "").trim() || null;

  const client = await db.client.findUnique({ where: { id: clientId } });
  if (!client) return { error: "Client not found." };

  const token = generatePortalToken(client.businessName);

  try {
    await db.portal.create({
      data: {
        clientId,
        token,
        message,
        status: "ACTIVE",
        templates: {
          create: templateIds.map((templateId, i) => ({ templateId, displayOrder: i })),
        },
      },
    });
  } catch (err) {
    console.error("createPortal failed:", err);
    return { error: "Something went wrong creating the portal. Please try again." };
  }

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/portals");
  redirect(`/clients/${clientId}`);
}

export async function updatePortalTemplates(
  portalId: string,
  clientId: string,
  _prevState: PortalActionState,
  formData: FormData
): Promise<PortalActionState> {
  const templateIds = readTemplateIds(formData);
  const countError = validateTemplateCount(templateIds);
  if (countError) return { error: countError };

  const message = String(formData.get("message") ?? "").trim() || null;

  try {
    await db.$transaction([
      db.portalTemplate.deleteMany({ where: { portalId } }),
      db.portalTemplate.createMany({
        data: templateIds.map((templateId, i) => ({ portalId, templateId, displayOrder: i })),
      }),
      db.portal.update({ where: { id: portalId }, data: { message } }),
    ]);
  } catch (err) {
    console.error("updatePortalTemplates failed:", err);
    return { error: "Something went wrong saving the portal. Please try again." };
  }

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/portals");
  redirect(`/clients/${clientId}`);
}

export async function setPortalDisabled(portalId: string, clientId: string, disabled: boolean) {
  await db.portal.update({
    where: { id: portalId },
    data: { status: disabled ? "DISABLED" : "ACTIVE" },
  });
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/portals");
}

export async function resetPortalSelection(portalId: string, clientId: string) {
  const portal = await db.portal.findUnique({ where: { id: portalId } });
  if (!portal) throw new Error("Portal not found.");

  await db.$transaction([
    db.templateSelection.deleteMany({ where: { portalId } }),
    db.portal.update({
      where: { id: portalId },
      data: { status: portal.status === "SELECTED" ? "ACTIVE" : portal.status },
    }),
  ]);

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/portals");
}
