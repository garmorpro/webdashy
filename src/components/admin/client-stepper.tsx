import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PIPELINE_STEPS, pipelineStepIndex } from "@/lib/client-status";
import type { ClientStatus } from "@prisma/client";

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
              <div
                className={cn(
                  "z-10 flex h-[34px] w-[34px] items-center justify-center rounded-full text-xs font-extrabold",
                  done && "bg-primary text-primary-foreground",
                  isCurrent &&
                    "border-[3px] border-primary bg-card text-foreground shadow-[0_0_0_5px_var(--accent)]",
                  !done && !isCurrent && "border-2 border-border bg-background text-muted-foreground"
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
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
