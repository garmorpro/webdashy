"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { WORKFLOW_STAGES, workflowStageIndex } from "@/lib/workflow";
import type { WorkflowStage } from "@prisma/client";

const WORKFLOW_STAGE_ANCHORS: Record<WorkflowStage, string> = {
  ADD_LEAD: "contact",
  CONTACT: "contact",
  QUESTIONNAIRE_SENT: "questionnaire",
  QUESTIONNAIRE_COMPLETE: "questionnaire",
  PORTAL_SENT: "portal",
  TEMPLATE_AND_PLAN: "portal",
  BUILD_SETUP: "delivery",
  WEBSITE_DRAFT: "delivery",
  CLIENT_REVIEW: "delivery",
  REVISIONS_APPROVED: "delivery",
  INVOICE: "invoice",
  PAYMENT_RECEIVED: "invoice",
  LAUNCH_AND_HANDOFF: "delivery",
  CLIENT_CARE: "delivery",
};

function scrollToAnchor(anchorId: string) {
  // "instant" rather than "smooth" — this scrolls the whole page (not a
  // scoped overflow container the way the questionnaire dialog's own
  // section nav does), and window-level smooth scrolling didn't reliably
  // animate/complete when tested in this repo's dev/QA browser tooling.
  // An instant jump is a perfectly normal pattern for anchor nav like this
  // and sidesteps that uncertainty entirely.
  document.getElementById(`section-${anchorId}`)?.scrollIntoView({ behavior: "instant", block: "start" });
}

/**
 * Every step is clickable — this is pure navigation (jump to the matching
 * workflow card further down the page), not a
 * status change. An earlier version of this let a click on a past step
 * revert the client's status; that was the wrong read of what "click on a
 * previous item" should do here, so it's gone — clicking never mutates
 * anything now, for any step.
 */
export function ClientStepper({ workflowStage }: { workflowStage: WorkflowStage }) {
  const current = workflowStageIndex(workflowStage);

  return (
    <div className="rounded-3xl bg-card p-6">
      <div className="flex items-start gap-0 overflow-x-auto">
        {WORKFLOW_STAGES.map(({ key, label }, i) => {
          const done = i < current;
          const isCurrent = i === current;
          return (
            <div key={key} className="relative flex min-w-[90px] flex-col items-center gap-2">
              {i > 0 ? (
                <div
                  className={cn(
                    "absolute left-[-50%] top-[17px] h-1 w-full rounded-full",
                    done ? "bg-primary" : "bg-secondary"
                  )}
                />
              ) : null}
              <button
                type="button"
                onClick={() => scrollToAnchor(WORKFLOW_STAGE_ANCHORS[key])}
                title={`Jump to ${label}`}
                className={cn(
                  "z-10 flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-full text-xs font-extrabold transition-transform hover:scale-110",
                  done && "bg-primary text-primary-foreground",
                  isCurrent &&
                    "border-[3px] border-primary bg-card text-foreground shadow-[0_0_0_5px_var(--accent)]",
                  !done && !isCurrent && "border-2 border-border bg-background text-muted-foreground"
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </button>
              <div
                className={cn(
                  "max-w-[88px] text-center text-[11px] leading-tight",
                  done || isCurrent ? "font-bold text-foreground" : "font-semibold text-muted-foreground"
                )}
              >
                {label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
