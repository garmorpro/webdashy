"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { generatePortalToken } from "@/lib/tokens";
import { getAbsoluteUrl } from "@/lib/site-url";
import { sendPortalEmail } from "@/lib/mail";
import { pipelineStepIndex } from "@/lib/client-status";

export type PortalActionState = { error?: string };

const MIN_TEMPLATES = 2;
const MAX_TEMPLATES = 8;

// See clients.ts for why this check has to live in the action itself —
// proxy.ts's route-based matcher doesn't cover Server Action dispatch.
async function requireAdmin(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ? null : "You must be signed in.";
}

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
  const authError = await requireAdmin();
  if (authError) return { error: authError };

  const templateIds = readTemplateIds(formData);
  const countError = validateTemplateCount(templateIds);
  if (countError) return { error: countError };

  const message = String(formData.get("message") ?? "").trim() || null;

  const client = await db.client.findUnique({ where: { id: clientId } });
  if (!client) return { error: "Client not found." };

  const existingPortal = await db.portal.findFirst({ where: { clientId } });
  if (existingPortal) {
    // The UI only links here when a client has no portal yet, so this only
    // fires from a stale tab/bookmark — bounce to the real state instead of
    // silently creating a second, orphaned portal link for the same client.
    redirect(`/clients/${clientId}`);
  }

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

  try {
    const portalUrl = await getAbsoluteUrl(`/p/${token}`);
    await sendPortalEmail({
      to: client.email,
      contactName: client.contactName,
      businessName: client.businessName,
      portalUrl,
      message,
    });
  } catch (err) {
    console.error("Portal created but email failed to send:", err);
    // The portal record is real either way — surface this so the admin
    // knows to resend rather than assuming the client has the link.
    return { error: "Portal created, but the email couldn't be sent. Use Resend from the client page." };
  }

  if (pipelineStepIndex("PORTAL_SENT") > pipelineStepIndex(client.status)) {
    await db.client.update({ where: { id: clientId }, data: { status: "PORTAL_SENT" } });
  }

  revalidatePath(`/clients/${clientId}`);
  redirect(`/clients/${clientId}`);
}

/** Re-sends the existing portal link — e.g. after createPortal's email failed, or on request. */
export async function resendPortalEmail(portalId: string, clientId: string) {
  const authError = await requireAdmin();
  if (authError) throw new Error(authError);

  const portal = await db.portal.findUnique({ where: { id: portalId }, include: { client: true } });
  if (!portal) throw new Error("Portal not found.");

  const portalUrl = await getAbsoluteUrl(`/p/${portal.token}`);
  await sendPortalEmail({
    to: portal.client.email,
    contactName: portal.client.contactName,
    businessName: portal.client.businessName,
    portalUrl,
    message: portal.message,
  });

  revalidatePath(`/clients/${clientId}`);
}

export async function updatePortalTemplates(
  portalId: string,
  clientId: string,
  _prevState: PortalActionState,
  formData: FormData
): Promise<PortalActionState> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };

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
  redirect(`/clients/${clientId}`);
}

export async function setPortalDisabled(portalId: string, clientId: string, disabled: boolean) {
  const authError = await requireAdmin();
  if (authError) throw new Error(authError);

  await db.portal.update({
    where: { id: portalId },
    data: { status: disabled ? "DISABLED" : "ACTIVE" },
  });
  revalidatePath(`/clients/${clientId}`);
}

// Returns { error } instead of throwing — see the matching comment on
// deleteTemplate in templates.ts: a thrown Server Action error gets its
// message redacted in production, so this must return it instead.
export async function resetPortalSelection(
  portalId: string,
  clientId: string
): Promise<{ error: string } | undefined> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };

  const [portal, client] = await Promise.all([
    db.portal.findUnique({ where: { id: portalId } }),
    db.client.findUnique({ where: { id: clientId } }),
  ]);
  if (!portal) return { error: "Portal not found." };

  await db.$transaction([
    db.templateSelection.deleteMany({ where: { portalId } }),
    db.portal.update({
      where: { id: portalId },
      data: { status: portal.status === "SELECTED" ? "ACTIVE" : portal.status },
    }),
    // confirmPortalSelection sets Client.status to TEMPLATE_SELECTED
    // unconditionally on selection — undo that here too, so resetting a
    // selection doesn't leave the client record claiming a selection that
    // no longer exists. Only touch it if nothing's moved the client further
    // along (e.g. BUILDING/WON) since the selection was made.
    ...(client?.status === "TEMPLATE_SELECTED"
      ? [db.client.update({ where: { id: clientId }, data: { status: "PORTAL_SENT" as const } })]
      : []),
  ]);

  revalidatePath(`/clients/${clientId}`);
}
