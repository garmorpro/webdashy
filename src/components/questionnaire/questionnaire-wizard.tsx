"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { saveQuestionnaireProgress, submitQuestionnaire } from "@/lib/actions/questionnaire";
import {
  QUESTIONNAIRE_SECTIONS,
  getMissingRequiredFields,
  isSectionComplete,
  sectionIndexForField,
  type QuestionnaireAnswers,
} from "@/lib/questionnaire-schema";

const FIELD_LABEL = "text-sm font-bold text-foreground";
const FIELD_INPUT = "mt-2 h-11 rounded-xl border-0 bg-secondary px-4 text-sm font-semibold shadow-none";
const FIELD_TEXTAREA = "mt-2 min-h-24 rounded-xl border-0 bg-secondary px-4 py-3 text-sm font-semibold shadow-none";

export function QuestionnaireWizard({
  token,
  initialAnswers,
}: {
  token: string;
  initialAnswers: QuestionnaireAnswers;
}) {
  const router = useRouter();
  const [sectionIndex, setSectionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuestionnaireAnswers>(initialAnswers);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, startTransition] = useTransition();
  const isFirstRun = useRef(true);

  const section = QUESTIONNAIRE_SECTIONS[sectionIndex];
  const isLastSection = sectionIndex === QUESTIONNAIRE_SECTIONS.length - 1;

  // Shared by the debounced autosave and the immediate on-navigate save
  // below. A failed save (network blip, brief outage) must never strand
  // the indicator on "Saving…" forever or block the visitor from
  // continuing — it just falls back to "idle" and the next edit/nav
  // retries with the latest answers anyway.
  function saveNow(currentAnswers: QuestionnaireAnswers) {
    setSaveState("saving");
    saveQuestionnaireProgress(token, currentAnswers)
      .then(() => setSaveState("saved"))
      .catch((err) => {
        console.error("Questionnaire autosave failed:", err);
        setSaveState("idle");
      });
  }

  // Debounced autosave — skips the very first run so loading the page
  // doesn't immediately re-save the untouched initial answers.
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    const timeout = setTimeout(() => saveNow(answers), 1200);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- saveNow is stable enough here; re-running on every render would break the debounce
  }, [answers, token]);

  function setField(key: string, value: string) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function goToSection(i: number) {
    // A direct call (not the debounce) so the fields on the section
    // someone's leaving are saved immediately rather than waiting out the
    // debounce window right as they navigate away from it.
    saveNow(answers);
    setSectionIndex(i);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSubmit() {
    setSubmitError(null);
    startTransition(async () => {
      const result = await submitQuestionnaire(token, answers);
      if (result.error) {
        setSubmitError(result.error);
        const missing = getMissingRequiredFields(answers);
        if (missing.length > 0) {
          const target = sectionIndexForField(missing[0]);
          if (target !== -1) setSectionIndex(target);
        }
        return;
      }
      // The server now has status SUBMITTED — re-render this route so the
      // server component swaps in the locked confirmation view instead.
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-9 md:flex-row md:items-start">
      {/* Section nav */}
      <div className="shrink-0 md:sticky md:top-8 md:w-60">
        <div className="flex flex-col gap-1 rounded-2xl bg-card p-3.5 shadow-[0_8px_24px_-14px_rgba(38,49,94,0.14)]">
          {QUESTIONNAIRE_SECTIONS.map((s, i) => {
            const done = isSectionComplete(s, answers);
            const active = i === sectionIndex;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => goToSection(i)}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[13px] font-semibold transition-colors",
                  active ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold",
                    done
                      ? "bg-primary text-primary-foreground"
                      : active
                        ? "bg-foreground text-background"
                        : "border-2 border-border text-muted-foreground"
                  )}
                >
                  {done ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                {s.title}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-1.5 px-1 text-xs font-semibold text-muted-foreground">
          <Check className="h-3 w-3 text-emerald-600" />
          {saveState === "saving" ? "Saving…" : "Progress saves automatically"}
        </div>
      </div>

      {/* Active section */}
      <div className="min-w-0 flex-1 rounded-3xl bg-card p-6 shadow-[0_8px_24px_-14px_rgba(38,49,94,0.14)] sm:p-9">
        <p className="text-[11px] font-extrabold uppercase tracking-wide text-emerald-600">
          Section {sectionIndex + 1} of {QUESTIONNAIRE_SECTIONS.length}
        </p>
        <h2 className="mt-1.5 text-xl font-extrabold text-foreground sm:text-2xl">{section.title}</h2>
        {section.description ? (
          <p className="mt-1.5 text-sm text-muted-foreground">{section.description}</p>
        ) : null}

        <div className="mt-7 flex flex-col gap-6">
          {section.fields.map((field) => (
            <div key={field.key}>
              <Label htmlFor={field.key} className={FIELD_LABEL}>
                {field.label} {field.required ? <span className="text-destructive">*</span> : null}
              </Label>
              {field.helper ? (
                <p className="mt-1 text-xs text-muted-foreground">{field.helper}</p>
              ) : null}

              {field.type === "textarea" ? (
                <Textarea
                  id={field.key}
                  value={answers[field.key] ?? ""}
                  onChange={(e) => setField(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className={FIELD_TEXTAREA}
                />
              ) : field.type === "yesno" ? (
                <div className="mt-2 flex gap-2">
                  {(["yes", "no"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setField(field.key, v)}
                      className={cn(
                        "rounded-full px-5 py-2 text-sm font-bold capitalize transition-colors",
                        answers[field.key] === v
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              ) : (
                <Input
                  id={field.key}
                  value={answers[field.key] ?? ""}
                  onChange={(e) => setField(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className={FIELD_INPUT}
                />
              )}
            </div>
          ))}
        </div>

        {submitError && isLastSection ? (
          <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {submitError}
          </div>
        ) : null}

        <div className="mt-9 flex items-center justify-between border-t border-border pt-6">
          <Button
            type="button"
            variant="outline"
            disabled={sectionIndex === 0}
            onClick={() => goToSection(sectionIndex - 1)}
          >
            Back
          </Button>

          {isLastSection ? (
            <Button type="button" disabled={isSubmitting} onClick={handleSubmit}>
              {isSubmitting ? "Submitting…" : "Submit Questionnaire"}
            </Button>
          ) : (
            <Button type="button" onClick={() => goToSection(sectionIndex + 1)}>
              Save &amp; Continue
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
