"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createPlan, updatePlan } from "@/lib/actions/plans";
import type { Plan } from "@prisma/client";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : label}
    </Button>
  );
}

export function PlanFormDialog({
  open,
  onOpenChange,
  plan,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = creating a new plan; a Plan = editing that one. */
  plan: Plan | null;
}) {
  const action = plan ? updatePlan.bind(null, plan.id) : createPlan;
  const [state, formAction] = useActionState(action, {});

  // Close on a successful save — adjusted during render (comparing against
  // the last-seen state) rather than in a useEffect, per React's guidance
  // for state derived from a prop/state change, and so it isn't skipped by
  // onOpenChange's identity changing across renders.
  const [lastState, setLastState] = useState(state);
  if (state !== lastState) {
    setLastState(state);
    if (state?.success) onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{plan ? `Edit ${plan.name}` : "Add Plan"}</DialogTitle>
          <DialogDescription>
            Shown to clients on their template portal as a pricing tier they can pick.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {state?.error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {state.error}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="plan-name">Plan name</Label>
              <Input id="plan-name" name="name" required defaultValue={plan?.name} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plan-price">Price</Label>
              <Input
                id="plan-price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                required
                defaultValue={plan ? Number(plan.price) : undefined}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="plan-tagline">Tagline</Label>
            <Input
              id="plan-tagline"
              name="tagline"
              placeholder="A clean single-purpose site to get found online."
              defaultValue={plan?.tagline ?? ""}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="plan-features">Included features</Label>
            <Textarea
              id="plan-features"
              name="features"
              rows={5}
              placeholder={"One per line, e.g.\nUp to 5 pages\nMobile responsive\nContact form"}
              defaultValue={plan?.features.join("\n") ?? ""}
            />
            <p className="text-xs text-muted-foreground">One feature per line.</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <SubmitButton label={plan ? "Save Changes" : "Add Plan"} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
