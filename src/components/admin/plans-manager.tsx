"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Check, Star } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PlanFormDialog } from "@/components/admin/plan-form-dialog";
import { ConfirmActionDialog } from "@/components/admin/confirm-action-dialog";
import { togglePlanActive, movePlan, deletePlan } from "@/lib/actions/plans";
import { updateOneTimeFooterNote } from "@/lib/actions/settings";
import { cn } from "@/lib/utils";
import type { Plan, PlanBillingType } from "@prisma/client";

type FormTarget = Plan | "new-monthly" | "new-onetime" | null;

function PlanCard({
  plan,
  index,
  total,
  onMove,
  onEdit,
  onToggle,
  onDelete,
}: {
  plan: Plan;
  index: number;
  total: number;
  onMove: (plan: Plan, direction: "up" | "down") => void;
  onEdit: (plan: Plan) => void;
  onToggle: (plan: Plan) => void;
  onDelete: (plan: Plan) => void;
}) {
  return (
    <div
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
          disabled={index === 0}
          onClick={() => onMove(plan, "up")}
          className="text-muted-foreground hover:text-foreground disabled:opacity-30"
          aria-label={`Move ${plan.name} up`}
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          disabled={index === total - 1}
          onClick={() => onMove(plan, "down")}
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
            plan.isActive ? "w-fit bg-emerald-50 text-emerald-700" : "w-fit bg-slate-100 text-slate-500"
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
        <Button variant="outline" size="sm" className="bg-card" onClick={() => onEdit(plan)}>
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onToggle(plan)}>
          {plan.isActive ? "Deactivate" : "Activate"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => onDelete(plan)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function OneTimeFooterNoteField({ oneTimeFooterNote }: { oneTimeFooterNote: string | null }) {
  const [value, setValue] = useState(oneTimeFooterNote ?? "");
  const [isPending, startTransition] = useTransition();
  const dirty = value !== (oneTimeFooterNote ?? "");

  function save() {
    startTransition(async () => {
      try {
        await updateOneTimeFooterNote(value);
        toast.success("Footer note saved.");
      } catch {
        toast.error("Couldn't save the footer note. Please try again.");
      }
    });
  }

  return (
    <div className="mb-4 space-y-1.5">
      <label className="text-xs font-bold text-foreground" htmlFor="one-time-footer-note">
        Footer note
      </label>
      <Textarea
        id="one-time-footer-note"
        rows={2}
        placeholder="Prefer to pay once? See one-time options →"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          The clickable line shown below the plan grid on the client portal, once any one-time
          option exists. Leave blank for a generic default.
        </p>
        {dirty ? (
          <Button size="sm" disabled={isPending} onClick={save} className="shrink-0">
            {isPending ? "Saving..." : "Save"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function PlansManager({
  plans,
  oneTimeFooterNote,
}: {
  plans: Plan[];
  oneTimeFooterNote: string | null;
}) {
  const [formTarget, setFormTarget] = useState<FormTarget>(null);
  const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null);
  const [, startTransition] = useTransition();

  const monthlyPlans = plans.filter((p) => p.billingType === "MONTHLY");
  const oneTimePlans = plans.filter((p) => p.billingType === "ONE_TIME");

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

  const editingPlan = formTarget === "new-monthly" || formTarget === "new-onetime" ? null : formTarget;
  const defaultBillingType: PlanBillingType = formTarget === "new-onetime" ? "ONE_TIME" : "MONTHLY";

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-extrabold text-foreground">Plans</h2>
        <Button size="sm" onClick={() => setFormTarget("new-monthly")}>
          <Plus className="h-4 w-4" />
          Add Plan
        </Button>
      </div>

      {monthlyPlans.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No plans yet — add one so clients have something to choose on their portal.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {monthlyPlans.map((plan, i) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              index={i}
              total={monthlyPlans.length}
              onMove={move}
              onEdit={setFormTarget}
              onToggle={toggle}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <div className="mt-6 border-t border-border/60 pt-5">
        <OneTimeFooterNoteField oneTimeFooterNote={oneTimeFooterNote} />

        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-extrabold text-foreground">One-Time Options</h2>
          <Button size="sm" variant="outline" className="bg-card" onClick={() => setFormTarget("new-onetime")}>
            <Plus className="h-4 w-4" />
            Add Option
          </Button>
        </div>

        {oneTimePlans.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No one-time options yet — clients only see the &ldquo;pay once?&rdquo; link once you
            add one.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {oneTimePlans.map((plan, i) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                index={i}
                total={oneTimePlans.length}
                onMove={move}
                onEdit={setFormTarget}
                onToggle={toggle}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </div>

      <PlanFormDialog
        open={formTarget !== null}
        onOpenChange={(open) => !open && setFormTarget(null)}
        plan={editingPlan}
        defaultBillingType={defaultBillingType}
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
