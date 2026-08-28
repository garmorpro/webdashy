"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Check, Star } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlanFormDialog } from "@/components/admin/plan-form-dialog";
import { ConfirmActionDialog } from "@/components/admin/confirm-action-dialog";
import { togglePlanActive, movePlan, deletePlan } from "@/lib/actions/plans";
import { cn } from "@/lib/utils";
import type { Plan } from "@prisma/client";

export function PlansManager({ plans }: { plans: Plan[] }) {
  const [formTarget, setFormTarget] = useState<Plan | null | "new">(null);
  const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null);
  const [, startTransition] = useTransition();

  function toggle(plan: Plan) {
    startTransition(async () => {
      try {
        await togglePlanActive(plan.id, !plan.isActive);
        toast.success(plan.isActive ? `${plan.name} deactivated` : `${plan.name} activated`);
      } catch {
        toast.error("Couldn't update this plan. Please try again.");
      }
    });
  }

  function move(plan: Plan, direction: "up" | "down") {
    startTransition(async () => {
      try {
        await movePlan(plan.id, direction);
      } catch {
        toast.error("Couldn't reorder plans. Please try again.");
      }
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-extrabold text-foreground">Plans</h2>
        <Button size="sm" onClick={() => setFormTarget("new")}>
          <Plus className="h-4 w-4" />
          Add Plan
        </Button>
      </div>

      {plans.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No plans yet — add one so clients have something to choose on their portal.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {plans.map((plan, i) => (
            <div
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-xl bg-secondary p-4",
                plan.isPopular && "ring-2 ring-primary"
              )}
            >
              {plan.isPopular ? (
                <span className="absolute -top-2.5 left-4 flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                  <Star className="h-2.5 w-2.5 fill-current" />
                  Most Popular
                </span>
              ) : null}

              <div className="absolute right-3 top-3 flex flex-col">
                <button
                  type="button"
                  disabled={i === 0}
                  onClick={() => move(plan, "up")}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  aria-label={`Move ${plan.name} up`}
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  disabled={i === plans.length - 1}
                  onClick={() => move(plan, "down")}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  aria-label={`Move ${plan.name} down`}
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pr-10">
                <Badge
                  variant="secondary"
                  className={
                    plan.isActive
                      ? "w-fit bg-emerald-50 text-emerald-700"
                      : "w-fit bg-slate-100 text-slate-500"
                  }
                >
                  {plan.isActive ? "Active" : "Inactive"}
                </Badge>
                {plan.isRecommended ? (
                  <Badge variant="secondary" className="w-fit bg-blue-50 text-blue-700">
                    Recommended
                  </Badge>
                ) : null}
              </div>

              <h3 className="mt-3 text-sm font-extrabold text-foreground">{plan.name}</h3>
              <p className="text-xl font-extrabold text-foreground">
                ${Number(plan.price).toLocaleString()}
                <span className="ml-1 text-xs font-semibold text-muted-foreground">
                  {plan.billingType === "MONTHLY" ? "/month" : "one-time"}
                </span>
              </p>
              {plan.tagline ? (
                <p className="mt-0.5 text-xs font-medium text-muted-foreground">{plan.tagline}</p>
              ) : null}

              {plan.features.length > 0 ? (
                <ul className="mt-3 flex flex-1 flex-col gap-1.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-xs text-foreground">
                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />
                      {f}
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="mt-4 flex items-center gap-1 border-t border-border/60 pt-3">
                <Button variant="outline" size="sm" className="bg-card" onClick={() => setFormTarget(plan)}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => toggle(plan)}>
                  {plan.isActive ? "Deactivate" : "Activate"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeleteTarget(plan)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <PlanFormDialog
        open={formTarget !== null}
        onOpenChange={(open) => !open && setFormTarget(null)}
        plan={formTarget === "new" ? null : formTarget}
      />

      <ConfirmActionDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={deleteTarget ? `Delete ${deleteTarget.name}?` : ""}
        description="This can't be undone. If a client has already selected this plan, deactivate it instead."
        confirmLabel="Delete Plan"
        pendingLabel="Deleting..."
        onConfirm={async () => {
          if (deleteTarget) await deletePlan(deleteTarget.id);
        }}
      />
    </div>
  );
}
