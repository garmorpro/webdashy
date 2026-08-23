import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PIPELINE_STEPS, pipelineStepIndex } from "@/lib/client-status";
import type { ClientStatus } from "@prisma/client";

export function ClientStepper({ status }: { status: ClientStatus }) {
  const current = pipelineStepIndex(status);

  return (
    <div className="mb-2 flex items-start gap-0 overflow-x-auto pb-3 pt-1">
      {PIPELINE_STEPS.map((label, i) => {
        const done = i < current;
        const isCurrent = i === current;
        return (
          <div key={label} className="relative flex min-w-[84px] flex-col items-center">
            {i > 0 ? (
              <div
                className={cn(
                  "absolute left-[-50%] top-[13px] h-0.5 w-full",
                  done ? "bg-primary" : "bg-border"
                )}
              />
            ) : null}
            <div
              className={cn(
                "z-10 flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 text-[11px] font-extrabold",
                done && "border-primary bg-primary text-primary-foreground",
                isCurrent && "border-primary text-foreground shadow-[0_0_0_3px_rgba(164,255,79,0.3)]",
                !done && !isCurrent && "border-border bg-card text-muted-foreground"
              )}
            >
              {done ? <Check className="h-3 w-3" /> : i + 1}
            </div>
            <div
              className={cn(
                "mt-1.5 max-w-[84px] text-center text-[11px] font-semibold leading-tight",
                done || isCurrent ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
