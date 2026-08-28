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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { createPlan, updatePlan } from "@/lib/actions/plans";
import type { Plan, PlanBillingType } from "@prisma/client";

const BILLING_TYPE_LABELS: Record<PlanBillingType, string> = {
  ONE_TIME: "One-time",
  MONTHLY: "Monthly",
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : label}
    </Button>
  );
}

/** Matches PortalPricingToggle's exact button+span markup — a plain boolean
 * switch, submitted via a hidden input since the rest of this form is
 * native FormData rather than controlled state. */
function ToggleField({
  name,
  label,
  checked,
  onChange,
}: {
  name: string;
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-secondary px-4 py-3">
      <span className="text-sm font-bold text-foreground">{label}</span>
      <input type="hidden" name={name} value={checked ? "true" : "false"} />
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors",
          checked ? "bg-primary" : "bg-border"
        )}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-[18px]" : "translate-x-0.5"
          )}
        />
      </button>
    </div>
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
  const [isPopular, setIsPopular] = useState(plan?.isPopular ?? false);
  const [isRecommended, setIsRecommended] = useState(plan?.isRecommended ?? false);
  // Defaults a brand-new plan to Monthly (most plans are) — unrelated to
  // the schema's own ONE_TIME default, which only exists to keep rows
  // created before this field existed displaying exactly as they always
  // did (see the Plan model's own comment).
  const [billingType, setBillingType] = useState<PlanBillingType>(plan?.billingType ?? "MONTHLY");

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

          <div className="space-y-1.5">
            <Label htmlFor="plan-name">Plan name</Label>
            <Input id="plan-name" name="name" required defaultValue={plan?.name} />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            <div className="space-y-1.5">
              <Label htmlFor="plan-billing-type">Billing</Label>
              <Select
                name="billingType"
                value={billingType}
                onValueChange={(value) => setBillingType(value as PlanBillingType)}
              >
                <SelectTrigger id="plan-billing-type" className="w-full">
                  {/* Bare SelectValue only resolves a label once the popup's
                      been opened at least once — see client-form.tsx for
                      the full explanation of why this needs a children
                      render-prop instead. */}
                  <SelectValue>
                    {(value) => BILLING_TYPE_LABELS[value as PlanBillingType] ?? String(value)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ONE_TIME">One-time</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <ToggleField
              name="isPopular"
              label="Most popular"
              checked={isPopular}
              onChange={setIsPopular}
            />
            <ToggleField
              name="isRecommended"
              label="Recommended"
              checked={isRecommended}
              onChange={setIsRecommended}
            />
          </div>

          {billingType === "ONE_TIME" ? (
            <div className="space-y-1.5">
              <Label htmlFor="plan-footer-note">Footer note</Label>
              <Textarea
                id="plan-footer-note"
                name="footerNote"
                rows={2}
                placeholder={
                  'Prefer to pay once? Also available as a one-time build — $3,800 (hosting $10/mo, edits optional).'
                }
                defaultValue={plan?.footerNote ?? ""}
              />
              <p className="text-xs text-muted-foreground">
                Shown as its own note below the plan grid on the client portal. Leave blank to
                hide it. Only shown for one-time plans.
              </p>
            </div>
          ) : null}

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
