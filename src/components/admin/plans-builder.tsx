"use client";

import { useState, useTransition } from "react";
import { Plus, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PortalPlanCard } from "@/components/portal/portal-plan-card";
import { BundleSavingsPanel } from "@/components/portal/bundle-savings-panel";
import { PlanCardEditor } from "@/components/admin/plan-card-editor";
import { ConfirmActionDialog } from "@/components/admin/confirm-action-dialog";
import { reorderPlans, deletePlan } from "@/lib/actions/plans";
import { updateOneTimeFooterNote } from "@/lib/actions/settings";
import { cn } from "@/lib/utils";
import type { Plan, PlanBillingType, PlanCategory } from "@prisma/client";

type PlanWithCategory = Plan & { category: PlanCategory | null };
type EditTarget = Plan | "new-monthly" | "new-onetime" | null;

// Sentinel for the synthesized tab that groups any plan with no category
// assigned yet — matches portal-grid.tsx's OTHER_TAB, never a real
// PlanCategory id so it can't collide. Also doubles as the Category
// select's "no category" sentinel in plan-card-editor.tsx.
const OTHER_TAB = "none";

function sortedKey(plans: Plan[]): string {
  return [...plans.map((p) => p.id)].sort().join(",");
}

/** One reorderable row of plan cards. Local drag state is the only source
 * of truth for display order while dragging and right after a drop —
 * keying this component by the SET of plan ids (sorted, order-independent)
 * means React remounts it (resetting to the prop order) only when a plan
 * is actually added or removed, never on a plain reorder, so the
 * optimistic order survives the round-trip to the server and back. */
function ReorderableCardRow({
  plans,
  editingId,
  onSelect,
  ghostLabel,
  onAddGhost,
  small,
}: {
  plans: PlanWithCategory[];
  editingId: string | null;
  onSelect: (plan: Plan) => void;
  ghostLabel: string;
  onAddGhost: () => void;
  small?: boolean;
}) {
  const [order, setOrder] = useState(() => plans.map((p) => p.id));
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const byId = new Map(plans.map((p) => [p.id, p]));
  const ordered = order.map((id) => byId.get(id)).filter((p): p is PlanWithCategory => Boolean(p));

  function moveDraggedOver(overId: string) {
    if (!draggedId || draggedId === overId) return;
    setOrder((prev) => {
      const from = prev.indexOf(draggedId);
      const to = prev.indexOf(overId);
      if (from === -1 || to === -1) return prev;
      const next = [...prev];
      next.splice(from, 1);
      next.splice(to, 0, draggedId);
      return next;
    });
  }

  function handleDragEnd() {
    setDraggedId(null);
    startTransition(async () => {
      try {
        await reorderPlans(order);
      } catch {
        toast.error("Couldn't save the new order. Please try again.");
      }
    });
  }

  return (
    <div className={cn("grid gap-4", small ? "grid-cols-1 sm:grid-cols-4" : "grid-cols-1 sm:grid-cols-3")}>
      {ordered.map((plan) => (
        <div
          key={plan.id}
          draggable
          onDragStart={() => setDraggedId(plan.id)}
          onDragOver={(e) => {
            e.preventDefault();
            moveDraggedOver(plan.id);
          }}
          onDrop={(e) => e.preventDefault()}
          onDragEnd={handleDragEnd}
          className={cn(
            "relative transition-opacity",
            !plan.isActive && "opacity-50 grayscale",
            draggedId === plan.id && "opacity-40"
          )}
        >
          <div className="absolute left-2.5 top-2.5 z-10 flex items-center gap-1.5 rounded-md bg-black/10 px-1 py-1 text-white/70 backdrop-blur-sm">
            <GripVertical className="h-3.5 w-3.5 cursor-grab active:cursor-grabbing" />
          </div>
          {!plan.isActive ? (
            <span className="absolute right-3 top-3 z-10 rounded-full bg-slate-800/80 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
              Inactive
            </span>
          ) : null}
          <PortalPlanCard
            plan={plan}
            selected={plan.id === editingId}
            showPricing={true}
            onSelect={() => onSelect(plan)}
          />
        </div>
      ))}

      <button
        type="button"
        onClick={onAddGhost}
        className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
          <Plus className="h-4 w-4" />
        </span>
        <span className="text-xs font-bold">{ghostLabel}</span>
      </button>
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
    <div className="mb-3 space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <label className="text-xs font-bold text-foreground" htmlFor="one-time-footer-note">
          One-time footer note
        </label>
        {dirty ? (
          <Button size="sm" disabled={isPending} onClick={save} className="shrink-0">
            {isPending ? "Saving..." : "Save"}
          </Button>
        ) : null}
      </div>
      <Textarea
        id="one-time-footer-note"
        rows={1}
        placeholder="Prefer to pay once? See one-time options →"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
}

export function PlansBuilder({
  plans,
  categories,
  oneTimeFooterNote,
}: {
  plans: PlanWithCategory[];
  categories: PlanCategory[];
  oneTimeFooterNote: string | null;
}) {
  // Every real category is a tab here, even an empty one — unlike the
  // portal (which only shows tabs that already have a plan), the admin
  // needs somewhere to add the FIRST plan into a brand-new category.
  const tabs = [...categories.map((c) => ({ id: c.id, name: c.name })), { id: OTHER_TAB, name: "Other" }];
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? OTHER_TAB);
  const [editTarget, setEditTarget] = useState<EditTarget>(null);
  const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null);

  const tabPlans = plans.filter((p) =>
    activeTab === OTHER_TAB ? !p.categoryId : p.categoryId === activeTab
  );
  const monthlyPlans = tabPlans.filter((p) => p.billingType === "MONTHLY");
  const oneTimePlans = tabPlans.filter((p) => p.billingType === "ONE_TIME");
  const bundlePlan = monthlyPlans.find((p) => p.isBundle);

  const editingPlan = editTarget === "new-monthly" || editTarget === "new-onetime" ? null : editTarget;
  const editingId = editingPlan?.id ?? null;
  const defaultBillingType: PlanBillingType = editTarget === "new-onetime" ? "ONE_TIME" : "MONTHLY";

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-extrabold text-foreground">Plans</h2>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="bg-card" onClick={() => setEditTarget("new-onetime")}>
            <Plus className="h-4 w-4" />
            One-Time Option
          </Button>
          <Button size="sm" onClick={() => setEditTarget("new-monthly")}>
            <Plus className="h-4 w-4" />
            Add Plan
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Live Preview — this is exactly what clients will see
        </div>
        <div className="inline-flex items-center gap-1 rounded-full bg-secondary p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                // Close the editor on tab switch — it was scoped to a
                // plan on the tab just left, and leaving it open would
                // show that plan's editor while browsing a different
                // tab's cards entirely.
                setEditTarget(null);
              }}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                activeTab === tab.id
                  ? "bg-[#1b2951] text-white"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      <div className={cn("grid gap-5", editTarget !== null && "lg:grid-cols-[1fr_380px]")}>
        <div className="rounded-2xl border-[1.5px] border-dashed border-border bg-white p-6">
          {bundlePlan && monthlyPlans.length === 1 ? (
            <div className="mx-auto grid max-w-3xl grid-cols-1 items-stretch gap-5 lg:grid-cols-2">
              <div className="relative">
                <div className="absolute left-2.5 top-2.5 z-10 flex items-center gap-1.5 rounded-md bg-black/10 px-1 py-1 text-white/70 backdrop-blur-sm">
                  <GripVertical className="h-3.5 w-3.5" />
                </div>
                <PortalPlanCard
                  plan={bundlePlan}
                  selected={bundlePlan.id === editingId}
                  showPricing={true}
                  onSelect={() => setEditTarget(bundlePlan)}
                />
              </div>
              <BundleSavingsPanel bundle={bundlePlan} />
            </div>
          ) : monthlyPlans.length > 0 ? (
            <ReorderableCardRow
              key={`monthly-${activeTab}-${sortedKey(monthlyPlans)}`}
              plans={monthlyPlans}
              editingId={editingId}
              onSelect={setEditTarget}
              ghostLabel="Add Plan"
              onAddGhost={() => setEditTarget("new-monthly")}
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditTarget("new-monthly")}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border py-12 text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                <Plus className="h-4 w-4" />
              </span>
              <span className="text-xs font-bold">No plans in this tab yet — add one</span>
            </button>
          )}

          <div className="mt-6 border-t border-border/60 pt-5">
            <OneTimeFooterNoteField oneTimeFooterNote={oneTimeFooterNote} />
            <div className="mb-3 text-xs font-bold text-muted-foreground">One-Time Options</div>
            {oneTimePlans.length > 0 ? (
              <ReorderableCardRow
                key={`onetime-${activeTab}-${sortedKey(oneTimePlans)}`}
                plans={oneTimePlans}
                editingId={editingId}
                onSelect={setEditTarget}
                ghostLabel="Add Option"
                onAddGhost={() => setEditTarget("new-onetime")}
                small
              />
            ) : (
              <button
                type="button"
                onClick={() => setEditTarget("new-onetime")}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-6 text-xs font-bold text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
                Add a one-time option
              </button>
            )}
          </div>
        </div>

        {editTarget !== null ? (
          <PlanCardEditor
            // Remounts fresh whenever the target plan changes — otherwise
            // clicking directly from editing one plan to another leaves
            // every uncontrolled field (name, tagline, features, ...)
            // showing the PREVIOUS plan's values, since the component
            // instance never unmounts on its own.
            key={typeof editTarget === "string" ? editTarget : editTarget.id}
            plan={editingPlan}
            categories={categories}
            defaultCategoryId={activeTab}
            defaultBillingType={defaultBillingType}
            onClose={() => setEditTarget(null)}
            onSaved={() => setEditTarget(null)}
            onDeleteRequest={setDeleteTarget}
          />
        ) : null}
      </div>

      <ConfirmActionDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={deleteTarget ? `Delete ${deleteTarget.name}?` : ""}
        description="This can't be undone. If a client has already selected this plan, deactivate it instead."
        confirmLabel="Delete Plan"
        pendingLabel="Deleting..."
        onConfirm={async () => {
          if (deleteTarget) {
            await deletePlan(deleteTarget.id);
            setEditTarget(null);
          }
        }}
      />
    </div>
  );
}
