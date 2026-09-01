"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { generateQuestionnaireToken } from "@/lib/tokens";
import { getAbsoluteUrl } from "@/lib/site-url";
import { sendQuestionnaireEmail, sendQuestionnaireSubmittedNotification } from "@/lib/mail";
import { pipelineStepIndex } from "@/lib/client-status";
import { advanceClientWorkflow } from "@/lib/services/client-workflow";
import { getMissingRequiredFields, type QuestionnaireAnswers } from "@/lib/questionnaire-schema";
import type { Prisma } from "@prisma/client";

// See clients.ts for why this check has to live in the action itself —
// proxy.ts's route-based matcher doesn't cover Server Action dispatch.
async function requireAdmin(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ? null : "You must be signed in.";
}

/**
 * Admin-only. Creates the client's DesignQuestionnaire row on first send
 * (a client only ever gets one — resending reuses the same token/row
 * rather than invalidating whatever progress they've already saved) and
 * emails them the link. Moves Client.status to QUESTIONNAIRE_SENT, but
 * only forward — never regresses a client who's already further along
 * (e.g. re-sending a link to someone already BUILDING shouldn't roll
 * their pipeline position back).
 */
export async function sendQuestionnaire(clientId: string): Promise<{ error?: string }> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };

  const client = await db.client.findUnique({
    where: { id: clientId },
    include: { questionnaire: true },
  });
  if (!client) return { error: "Client not found." };

  if (client.questionnaire?.status === "SUBMITTED") {
    return { error: "This client already submitted their questionnaire." };
  }

  let questionnaire = client.questionnaire;
  try {
    if (!questionnaire) {
      const token = generateQuestionnaireToken(client.businessName);
      questionnaire = await db.designQuestionnaire.create({
        data: { clientId, token },
      });
    }

    const formUrl = await getAbsoluteUrl(`/q/${questionnaire.token}`);
    await sendQuestionnaireEmail({
      to: client.email,
      contactName: client.contactName,
      businessName: client.businessName,
      formUrl,
    });
  } catch (err) {
    console.error("sendQuestionnaire failed:", err);
    return { error: "Something went wrong sending the questionnaire. Please try again." };
  }

  if (pipelineStepIndex(client.status) < pipelineStepIndex("QUESTIONNAIRE_SENT")) {
    await db.client.update({ where: { id: clientId }, data: { status: "QUESTIONNAIRE_SENT" } });
  }
  await advanceClientWorkflow(clientId, "QUESTIONNAIRE_SENT");

  revalidatePath(`/clients/${clientId}`);
  return {};
}

/**
 * Public — no session, called from the client-facing wizard's autosave.
 * Re-resolves everything from the unguessable `token` rather than trusting
 * any id the caller passes (same rule as confirmPortalSelection/
 * approveDelivery — see ARCHITECTURE.md §6). A no-op past submission
 * (rather than an error) keeps a stray autosave firing right as someone
 * else submits from not surfacing a confusing error.
 */
export async function saveQuestionnaireProgress(
  token: string,
  answers: QuestionnaireAnswers
): Promise<{ error?: string }> {
  const questionnaire = await db.designQuestionnaire.findUnique({ where: { token } });
  if (!questionnaire) return { error: "This link isn't valid." };
  if (questionnaire.status === "SUBMITTED") return {};

  await db.designQuestionnaire.update({
    where: { token },
    data: {
      answers: answers as Prisma.InputJsonValue,
      status: questionnaire.status === "SENT" ? "IN_PROGRESS" : questionnaire.status,
    },
  });

  return {};
}

/**
 * Public — same token-only trust model as saveQuestionnaireProgress. Locks
 * the questionnaire (no further saves accepted once SUBMITTED — the public
 * page itself also stops rendering the form and shows the locked
 * confirmation instead), advances Client.status forward-only, and notifies
 * the admin.
 */
export async function submitQuestionnaire(
  token: string,
  answers: QuestionnaireAnswers
): Promise<{ error?: string }> {
  const questionnaire = await db.designQuestionnaire.findUnique({
    where: { token },
    include: { client: true },
  });
  if (!questionnaire) return { error: "This link isn't valid." };
  if (questionnaire.status === "SUBMITTED") {
    return { error: "This questionnaire has already been submitted." };
  }

  const missing = getMissingRequiredFields(answers);
  if (missing.length > 0) {
    return { error: "Please fill out all required fields before submitting." };
  }

  await db.designQuestionnaire.update({
    where: { token },
    data: {
      answers: answers as Prisma.InputJsonValue,
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
  });

  if (pipelineStepIndex(questionnaire.client.status) < pipelineStepIndex("QUESTIONNAIRE_DONE")) {
    await db.client.update({
      where: { id: questionnaire.clientId },
      data: { status: "QUESTIONNAIRE_DONE" },
    });
  }
  await advanceClientWorkflow(questionnaire.clientId, "QUESTIONNAIRE_COMPLETE");

  try {
    const clientAdminUrl = await getAbsoluteUrl(`/clients/${questionnaire.clientId}`);
    await sendQuestionnaireSubmittedNotification({
      clientName: questionnaire.client.businessName,
      clientAdminUrl,
    });
  } catch (err) {
    // Best-effort by design (see sendQuestionnaireSubmittedNotification) —
    // this catch is just so a network hiccup here can never fail the
    // submission itself, which is already committed above.
    console.error("Failed to notify admin of questionnaire submission:", err);
  }

  revalidatePath(`/clients/${questionnaire.clientId}`);
  return {};
}
