"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PIPELINE_STEPS, pipelineStepIndex, anchorForPipelineStep } from "@/lib/client-status";
import type { ClientStatus } from "@prisma/client";

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
 * workflow card further down the page, see anchorForPipelineStep), not a
 * status change. An earlier version of this let a click on a past step
 * revert the client's status; that was the wrong read of what "click on a
 * previous item" should do here, so it's gone — clicking never mutates
 * anything now, for any step.
 */
export function ClientStepper({ status }: { status: ClientStatus }) {
  const current = pipelineStepIndex(status);

  return (
    <div className="rounded-3xl bg-card p-6">
      <div className="flex items-start gap-0 overflow-x-auto">
        {PIPELINE_STEPS.map((label, i) => {
          const done = i < current;
          const isCurrent = i === current;
          return (
            <div key={label} className="relative flex min-w-[90px] flex-col items-center gap-2">
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
                onClick={() => scrollToAnchor(anchorForPipelineStep(i))}
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
