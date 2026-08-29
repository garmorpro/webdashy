"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { createPlan, updatePlan, togglePlanActive } from "@/lib/actions/plans";
import type { Plan, PlanBillingType, PlanCategory } from "@prisma/client";

const BILLING_TYPE_LABELS: Record<PlanBillingType, string> = {
  ONE_TIME: "One-time",
  MONTHLY: "Monthly",
};

// Sentinel for "no category" — Plan.categoryId is nullable, but Select needs
// a real string value for its own item; mapped back to null on submit.
const NO_CATEGORY = "none";

// Badge and Bundle are two INDEPENDENT axes, not one 4-way choice — a plan
// can be a Bundle AND Most Popular at once (that's real, live data: the
// "Website + Reviews" bundle also carries the Most Popular ribbon). What's
// mutually exclusive is only the badge itself: a plan can't be both
// Standard and Recommended, or both Most Popular and Recommended — Most
// Popular wins the ribbon over Recommended if both were ever somehow set.
// Bundle is a separate toggle underneath, combinable with any badge.
type Badge = "standard" | "popular" | "recommended";

const BADGE_LABELS: Record<Badge, string> = {
  standard: "Standard",
  popular: "Most Popular",
  recommended: "Recommended",
};

function badgeFromPlan(plan: Plan | null): Badge {
  if (plan?.isPopular) return "popular";
  if (plan?.isRecommended) return "recommended";
  return "standard";
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="flex-1">
      {pending ? "Saving..." : label}
    </Button>
  );
}

/** Matches PortalPricingToggle's exact button+span markup — a plain boolean
 * switch, submitted via a hidden input since the rest of this form is
 * native FormData rather than controlled state. */
function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-secondary px-3 py-2.5">
      <span className="text-sm font-bold text-foreground">{label}</span>
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

export function PlanCardEditor({
  plan,
  categories,
  defaultCategoryId,
  defaultBillingType,
  onClose,
  onSaved,
  onDeleteRequest,
}: {
  /** null = creating a new plan; a Plan = editing that one. */
  plan: Plan | null;
  categories: PlanCategory[];
  /** Pre-fills Category when creating a new plan from a specific tab. */
  defaultCategoryId: string;
  /** Pre-fills Billing when creating a new plan (Monthly vs. the One-Time
   * Options row within the same tab). */
  defaultBillingType: PlanBillingType;
  onClose: () => void;
  onSaved: () => void;
  onDeleteRequest: (plan: Plan) => void;
}) {
  const action = plan ? updatePlan.bind(null, plan.id) : createPlan;
  const [state, formAction] = useActionState(action, {});
  const [badge, setBadge] = useState<Badge>(badgeFromPlan(plan));
  const [isBundle, setIsBundle] = useState(plan?.isBundle ?? false);
  const [billingType, setBillingType] = useState<PlanBillingType>(
    plan?.billingType ?? defaultBillingType
  );
  const [categoryId, setCategoryId] = useState(plan?.categoryId ?? defaultCategoryId);
  const [isPending, setIsPending] = useState(false);

  // Close on a successful save — adjusted during render (comparing against
  // the last-seen state) rather than in a useEffect, per React's guidance
  // for state derived from a prop/state change.
  const [lastState, setLastState] = useState(state);
  if (state !== lastState) {
    setLastState(state);
    if (state?.success) onSaved();
  }

  async function toggleActive() {
    if (!plan) return;
    setIsPending(true);
    try {
      await togglePlanActive(plan.id, !plan.isActive);
      toast.success(plan.isActive ? `${plan.name} deactivated` : `${plan.name} activated`);
    } catch {
      toast.error("Couldn't update this plan. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-[0_8px_24px_-14px_rgba(38,49,94,0.14)]">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-sm font-extrabold text-foreground">
          {plan ? `Editing: ${plan.name}` : "Add Plan"}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-bold text-muted-foreground hover:text-foreground"
        >
          Close
        </button>
      </div>

      <form action={formAction} className="flex flex-1 flex-col overflow-y-auto">
        <div className="flex-1 space-y-4">
          {state?.error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {state.error}
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="pce-name">Plan name</Label>
            <Input id="pce-name" name="name" required defaultValue={plan?.name} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pce-price">Price</Label>
              <Input
                id="pce-price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                required
                defaultValue={plan ? Number(plan.price) : undefined}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pce-billing">Billing</Label>
              <Select
                name="billingType"
                value={billingType}
                onValueChange={(value) => setBillingType(value as PlanBillingType)}
              >
                <SelectTrigger id="pce-billing" className="w-full">
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

          <div className="space-y-1.5">
            <Label htmlFor="pce-category">Category / Tab</Label>
            <Select
              name="categoryId"
              value={categoryId}
              onValueChange={(value) => setCategoryId(value as string)}
            >
              <SelectTrigger id="pce-category" className="w-full">
                <SelectValue>
                  {(value) =>
                    categories.find((c) => c.id === value)?.name ??
                    (value === NO_CATEGORY ? "No category (Other tab)" : String(value))
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_CATEGORY}>No category (Other tab)</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Badge</Label>
            <input type="hidden" name="isPopular" value={badge === "popular" ? "true" : "false"} />
            <input
              type="hidden"
              name="isRecommended"
              value={badge === "recommended" ? "true" : "false"}
            />
            <div className="grid grid-cols-3 gap-1">
              {(Object.keys(BADGE_LABELS) as Badge[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setBadge(option)}
                  className={cn(
                    "rounded-lg px-1 py-2 text-[11px] font-bold transition-colors",
                    badge === option
                      ? "bg-[#1b2951] text-white"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                >
                  {BADGE_LABELS[option]}
                </button>
              ))}
            </div>
          </div>

          <input type="hidden" name="isBundle" value={isBundle ? "true" : "false"} />
          <ToggleField label="Is this a bundle?" checked={isBundle} onChange={setIsBundle} />
          {isBundle ? (
            <p className="-mt-2.5 text-xs text-muted-foreground">
              A bundle is always the featured dark card, on top of whatever badge is set above.
            </p>
          ) : null}

          {isBundle ? (
            <div className="space-y-4 rounded-xl border border-border p-3">
              <div className="space-y-1.5">
                <Label htmlFor="pce-bundle-why">Why bundle?</Label>
                <Textarea
                  id="pce-bundle-why"
                  name="bundleWhyText"
                  rows={2}
                  placeholder="Buying them separately adds up fast."
                  defaultValue={plan?.bundleWhyText ?? ""}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pce-bundle-lines">Price comparison</Label>
                <Textarea
                  id="pce-bundle-lines"
                  name="bundleLines"
                  rows={3}
                  placeholder={"One per line, e.g.\nWebsite only — $175/mo"}
                  defaultValue={plan?.bundleLines.join("\n") ?? ""}
                />
                <p className="text-xs text-muted-foreground">One comparison line per row.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pce-bundle-savings">Savings callout</Label>
                <Input
                  id="pce-bundle-savings"
                  name="bundleSavingsText"
                  placeholder="You save $57/month"
                  defaultValue={plan?.bundleSavingsText ?? ""}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pce-bundle-footer">Footer note</Label>
                <Input
                  id="pce-bundle-footer"
                  name="bundleFooterText"
                  placeholder="Just want a website? Head to the Websites tab — no reviews, no problem."
                  defaultValue={plan?.bundleFooterText ?? ""}
                />
              </div>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="pce-tagline">Tagline</Label>
            <Input
              id="pce-tagline"
              name="tagline"
              placeholder="A clean single-purpose site to get found online."
              defaultValue={plan?.tagline ?? ""}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pce-features">Features (one per line)</Label>
            <Textarea
              id="pce-features"
              name="features"
              rows={5}
              placeholder={"One per line, e.g.\nUp to 5 pages\nMobile responsive"}
              defaultValue={plan?.features.join("\n") ?? ""}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 border-t border-border/60 pt-4">
          <SubmitButton label={plan ? "Save Changes" : "Add Plan"} />
          {plan ? (
            <>
              <Button type="button" variant="outline" disabled={isPending} onClick={toggleActive}>
                {plan.isActive ? "Deactivate" : "Activate"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => onDeleteRequest(plan)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          ) : null}
        </div>
      </form>
    </div>
  );
}
