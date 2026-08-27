"use client";

import { useState, useTransition } from "react";
import { FileText, Copy, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { QuestionnaireResponsesDialog } from "@/components/admin/questionnaire-responses-dialog";
import { sendQuestionnaire } from "@/lib/actions/questionnaire";
import { countAnsweredFields, TOTAL_QUESTIONNAIRE_FIELDS } from "@/lib/questionnaire-schema";
import type { QuestionnaireAnswers } from "@/lib/questionnaire-schema";
import type { QuestionnaireStatus } from "@prisma/client";

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

function toAnswers(json: unknown): QuestionnaireAnswers {
  if (json && typeof json === "object" && !Array.isArray(json)) return json as QuestionnaireAnswers;
  return {};
}

export function DesignQuestionnaireSection({
  clientId,
  businessName,
  questionnaire,
  formUrl,
}: {
  clientId: string;
  businessName: string;
  questionnaire: {
    id: string;
    status: QuestionnaireStatus;
    sentAt: Date;
    submittedAt: Date | null;
    answers: unknown;
  } | null;
  formUrl: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [responsesOpen, setResponsesOpen] = useState(false);

  function handleSend() {
    startTransition(async () => {
      const result = await sendQuestionnaire(clientId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Questionnaire sent.");
    });
  }

  function copyLink() {
    if (!formUrl) return;
    navigator.clipboard
      .writeText(formUrl)
      .then(() => toast.success("Questionnaire link copied"))
      .catch(() => toast.error("Couldn't copy the link — copy it manually."));
  }

  // Not sent yet
  if (!questionnaire) {
    return (
      <div className="rounded-xl bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
              <FileText className="h-4.5 w-4.5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-foreground">Design Questionnaire</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Not sent yet — send it once they&apos;ve confirmed they want to move forward.
              </p>
            </div>
          </div>
          <Button size="sm" disabled={isPending} onClick={handleSend}>
            {isPending ? "Sending..." : "Send Questionnaire"}
          </Button>
        </div>
      </div>
    );
  }

  const answers = toAnswers(questionnaire.answers);
  const answered = countAnsweredFields(answers);

  // Submitted — done
  if (questionnaire.status === "SUBMITTED") {
    return (
      <>
        <div className="rounded-xl bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-foreground">Design Questionnaire</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Submitted {questionnaire.submittedAt ? dateFormatter.format(questionnaire.submittedAt) : ""} ·{" "}
                  {answered} of {TOTAL_QUESTIONNAIRE_FIELDS} questions answered
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => setResponsesOpen(true)}>
              View Responses
            </Button>
          </div>
        </div>

        <QuestionnaireResponsesDialog
          open={responsesOpen}
          onOpenChange={setResponsesOpen}
          businessName={businessName}
          submittedAt={questionnaire.submittedAt}
          answers={answers}
          pdfUrl={`/api/questionnaire/${questionnaire.id}/pdf`}
        />
      </>
    );
  }

  // Sent, not yet submitted (SENT or IN_PROGRESS)
  return (
    <div className="rounded-xl bg-card p-6 shadow-[0_0_0_3px_rgba(164,255,79,0.18)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
            <FileText className="h-4.5 w-4.5 text-blue-700" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-foreground">Design Questionnaire</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Sent {dateFormatter.format(questionnaire.sentAt)} ·{" "}
              {questionnaire.status === "IN_PROGRESS" ? "in progress" : "not yet started"}
            </p>
          </div>
        </div>
        <span className="whitespace-nowrap rounded-full bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-blue-700">
          Awaiting response
        </span>
      </div>
      <div className="mt-4 flex gap-2.5 border-t border-border pt-4">
        <Button size="sm" variant="secondary" onClick={copyLink}>
          <Copy className="h-3.5 w-3.5" />
          Copy Link
        </Button>
        <Button size="sm" variant="secondary" disabled={isPending} onClick={handleSend}>
          {isPending ? "Resending..." : "Resend Email"}
        </Button>
      </div>
    </div>
  );
}
