"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { togglePortalPricingVisibility } from "@/lib/actions/settings";

export function PortalPricingToggle({
  showPricingInPortal,
}: {
  showPricingInPortal: boolean;
}) {
  const [pricingOn, setPricingOn] = useState(showPricingInPortal);
  const [, startTransition] = useTransition();

  function handleToggle() {
    const next = !pricingOn;
    setPricingOn(next);
    startTransition(async () => {
      try {
        await togglePortalPricingVisibility(next);
      } catch {
        setPricingOn(!next);
        toast.error("Couldn't update this setting. Please try again.");
      }
    });
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-bold text-foreground">Show pricing on client portals</p>
        <p className="mt-1 max-w-md text-xs text-muted-foreground">
          When off, plan cards on the client portal show what&apos;s included but hide dollar
          amounts — clients pick a tier, you follow up with an exact quote before invoicing.
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={pricingOn}
        aria-label="Show pricing on client portals"
        onClick={handleToggle}
        className={cn(
          "relative h-6 w-10 shrink-0 rounded-full transition-colors",
          pricingOn ? "bg-primary" : "bg-border"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            pricingOn ? "translate-x-[18px]" : "translate-x-0.5"
          )}
        />
      </button>
    </div>
  );
}
