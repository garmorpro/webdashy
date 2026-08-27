"use client";

import { Calendar, Download, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  QUESTIONNAIRE_SECTIONS,
  countAnsweredFields,
  formatFieldValue,
  TOTAL_QUESTIONNAIRE_FIELDS,
  type QuestionnaireAnswers,
} from "@/lib/questionnaire-schema";

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

function scrollToSection(sectionId: string) {
  document.getElementById(`qr-section-${sectionId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Read-only view of a submitted questionnaire's answers. Deliberately
 * mirrors the client-facing wizard's own section-nav language (same 6
 * sections, same order) so reviewing an answer feels like a continuation
 * of the form the client actually filled out, not a raw data dump.
 *
 * Fields render in one of two treatments based on their own `type` from
 * questionnaire-schema.ts — never hardcoded per-section, so this stays
 * correct if a field ever moves between sections or changes type:
 *   - "text"/"yesno" (short, factual) → a dense grid, quick to scan.
 *   - "textarea" (long, narrative) → full-width with a left accent bar and
 *     generous line-height, closer to reading a real quote than a form field.
 */
export function QuestionnaireResponsesDialog({
  open,
  onOpenChange,
  businessName,
  submittedAt,
  answers,
  pdfUrl,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessName: string;
  submittedAt: Date | null;
  answers: QuestionnaireAnswers;
  pdfUrl: string;
}) {
  const answered = countAnsweredFields(answers);
  const timeline = answers.launchTimeline?.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[85vh] w-full max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl"
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-7 py-5">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-emerald-600">
              Design Questionnaire
            </p>
            <DialogTitle className="mt-1 text-xl font-extrabold text-foreground">{businessName}</DialogTitle>
            <DialogDescription className="mt-0.5 text-xs font-semibold text-muted-foreground">
              {submittedAt ? `Submitted ${dateFormatter.format(submittedAt)}` : "Submitted"} · {answered} of{" "}
              {TOTAL_QUESTIONNAIRE_FIELDS} questions answered
            </DialogDescription>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              nativeButton={false}
              render={<a href={pdfUrl} target="_blank" rel="noopener noreferrer" />}
            >
              <Download className="h-3.5 w-3.5" />
              Export PDF
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Target timeline — the one answer worth surfacing before anyone
            has to scroll or click into Project Details for it. Deliberately
            references the "launchTimeline" field by its exact key rather
            than going through the generic type-driven section rendering
            below — this is a one-off highlight of a specific answer, not
            part of that generic loop. */}
        <div className="flex shrink-0 items-center gap-2.5 border-b border-border bg-secondary/70 px-7 py-2.5">
          <Calendar className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground">
            Target Timeline
          </span>
          <span className={cn("text-sm font-bold", timeline ? "text-foreground" : "italic text-muted-foreground/60")}>
            {timeline || "Not specified"}
          </span>
        </div>

        <div className="flex min-h-0 flex-1 items-stretch">
          {/* Section nav */}
          <div className="hidden w-52 shrink-0 overflow-y-auto border-r border-border p-3 sm:block">
            <div className="flex flex-col gap-0.5">
              {QUESTIONNAIRE_SECTIONS.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => scrollToSection(section.id)}
                  className="rounded-lg px-3 py-2 text-left text-[12.5px] font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  {section.title}
                </button>
              ))}
            </div>
          </div>

          {/* Answers */}
          <div className="min-w-0 flex-1 overflow-y-auto px-7 py-6">
            {QUESTIONNAIRE_SECTIONS.map((section, i) => {
              const shortFields = section.fields.filter((f) => f.type !== "textarea");
              const longFields = section.fields.filter((f) => f.type === "textarea");

              return (
                <div
                  key={section.id}
                  id={`qr-section-${section.id}`}
                  className={cn("scroll-mt-4", i > 0 && "mt-9 border-t border-border pt-9")}
                >
                  <h3 className="mb-4 text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground">
                    {section.title}
                  </h3>

                  {shortFields.length > 0 ? (
                    <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
                      {shortFields.map((field) => {
                        const raw = answers[field.key]?.trim();
                        const value = raw ? formatFieldValue(field, raw) : "";
                        return (
                          <div key={field.key}>
                            <div className="text-[11px] font-bold text-muted-foreground">{field.label}</div>
                            <div
                              className={cn(
                                "mt-0.5 text-sm font-bold",
                                value ? "text-foreground" : "italic text-muted-foreground/60"
                              )}
                            >
                              {value || "Not answered"}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}

                  {longFields.length > 0 ? (
                    <div className={cn("flex flex-col gap-6", shortFields.length > 0 && "mt-6")}>
                      {longFields.map((field) => {
                        const value = answers[field.key]?.trim();
                        return (
                          <div
                            key={field.key}
                            className={cn(
                              "border-l-[3px] pl-4",
                              value ? "border-primary" : "border-border"
                            )}
                          >
                            <div className="text-sm font-bold text-foreground">{field.label}</div>
                            <div
                              className={cn(
                                "mt-1.5 whitespace-pre-wrap text-sm leading-relaxed",
                                value ? "text-foreground/80" : "italic text-muted-foreground/60"
                              )}
                            >
                              {value || "Not answered"}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
