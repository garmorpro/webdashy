import { db } from "@/lib/db";
import type { QuestionnairePdfData } from "@/lib/questionnaire-pdf";
import type { QuestionnaireAnswers } from "@/lib/questionnaire-schema";

function toAnswers(json: unknown): QuestionnaireAnswers {
  if (json && typeof json === "object" && !Array.isArray(json)) return json as QuestionnaireAnswers;
  return {};
}

/**
 * Assembles the data a submitted questionnaire's PDF is rendered from —
 * used by the admin-facing view/download route
 * (src/app/api/questionnaire/[id]/pdf/route.ts). Returns null for anything
 * not yet SUBMITTED — same as the "View Responses" UI, exporting a PDF
 * only makes sense once there's a final, locked set of answers.
 */
export async function buildQuestionnairePdfData(
  questionnaireId: string
): Promise<QuestionnairePdfData | null> {
  const questionnaire = await db.designQuestionnaire.findUnique({
    where: { id: questionnaireId },
    include: { client: true },
  });
  if (!questionnaire || questionnaire.status !== "SUBMITTED") return null;

  return {
    businessName: questionnaire.client.businessName,
    submittedAt: questionnaire.submittedAt ?? questionnaire.updatedAt,
    answers: toAnswers(questionnaire.answers),
  };
}
