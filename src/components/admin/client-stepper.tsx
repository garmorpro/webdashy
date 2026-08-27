"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ConfirmActionDialog } from "@/components/admin/confirm-action-dialog";
import { setClientStatus } from "@/lib/actions/clients";
import { PIPELINE_STEPS, pipelineStepIndex, statusForPipelineStep } from "@/lib/client-status";
import type { ClientStatus } from "@prisma/client";

export function ClientStepper({ clientId, status }: { clientId: string; status: ClientStatus }) {
  const current = pipelineStepIndex(status);
  const [revertTarget, setRevertTarget] = useState<number | null>(null);

  return (
    <>
      <div className="rounded-3xl bg-card p-6">
        <div className="flex items-start gap-0 overflow-x-auto">
          {PIPELINE_STEPS.map((label, i) => {
            const done = i < current;
            const isCurrent = i === current;
            // Only a past (already-completed) step can be clicked to revert
            // to it — the current step is already where the client is, and
            // future steps can't be jumped to from here (that'd let someone
            // skip real steps this component has no way to fabricate — see
            // setClientStatus's comment).
            const clickable = done;

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
                  disabled={!clickable}
                  onClick={() => setRevertTarget(i)}
                  title={clickable ? `Move back to ${label}` : undefined}
                  className={cn(
                    "z-10 flex h-[34px] w-[34px] items-center justify-center rounded-full text-xs font-extrabold transition-transform",
                    done && "bg-primary text-primary-foreground",
                    isCurrent &&
                      "border-[3px] border-primary bg-card text-foreground shadow-[0_0_0_5px_var(--accent)]",
                    !done && !isCurrent && "border-2 border-border bg-background text-muted-foreground",
                    clickable ? "cursor-pointer hover:scale-110" : "cursor-default"
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

      <ConfirmActionDialog
        open={revertTarget !== null}
        onOpenChange={(open) => !open && setRevertTarget(null)}
        title={revertTarget !== null ? `Move back to "${PIPELINE_STEPS[revertTarget]}"?` : ""}
        description="This only corrects the pipeline status shown here — it won't undo or delete any actual progress (portal, questionnaire, invoice, etc.) already on record."
        confirmLabel="Move Back"
        pendingLabel="Updating..."
        destructive={false}
        onConfirm={async () => {
          if (revertTarget === null) return;
          const label = PIPELINE_STEPS[revertTarget];
          await setClientStatus(clientId, statusForPipelineStep(revertTarget));
          toast.success(`Moved back to ${label}.`);
          setRevertTarget(null);
        }}
      />
    </>
  );
}
