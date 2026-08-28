"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, Check } from "lucide-react";
import { PortalTemplateCard } from "@/components/portal/portal-template-card";
import { PortalPlanCard } from "@/components/portal/portal-plan-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { confirmPortalSelection } from "@/lib/actions/public-portal";
import { cn } from "@/lib/utils";
import type { Category, Template, Plan, PlanCategory } from "@prisma/client";

type PlanWithCategory = Plan & { category: PlanCategory | null };

// Sentinel for the synthesized tab that groups any plan with no category
// assigned yet — never a real PlanCategory id, so it can't collide.
const OTHER_TAB = "__other__";

export function PortalGrid({
  token,
  templates,
  plans,
  categories,
  showPricing,
  oneTimeFooterNote,
}: {
  token: string;
  templates: (Template & { category: Category | null })[];
  plans: PlanWithCategory[];
  categories: PlanCategory[];
  showPricing: boolean;
  oneTimeFooterNote: string | null;
}) {
  const router = useRouter();
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [oneTimeModalOpen, setOneTimeModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Tabs are built from whichever categories actually have a plan in them
  // (in the admin's own displayOrder), plus a trailing "Other" tab only if
  // some plan has no category yet — never an empty tab with nothing to show.
  const hasUncategorized = plans.some((p) => !p.categoryId);
  const tabs = [
    ...categories
      .filter((c) => plans.some((p) => p.categoryId === c.id))
      .map((c) => ({ id: c.id, name: c.name })),
    ...(hasUncategorized ? [{ id: OTHER_TAB, name: "Other" }] : []),
  ];
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? OTHER_TAB);

  const tabPlans = plans.filter((p) =>
    activeTab === OTHER_TAB ? !p.categoryId : p.categoryId === activeTab
  );
  // Monthly plans are the main grid; one-time plans are selectable the same
  // way, just tucked behind the "pay once?" link/modal below instead of
  // cluttering the grid with a second row of cards. Both scoped to the
  // active tab — switching tabs browses a different product line's plans.
  const cardPlans = tabPlans.filter((p) => p.billingType === "MONTHLY");
  const oneTimePlans = tabPlans.filter((p) => p.billingType === "ONE_TIME");

  const selectedTemplate = templates.find((t) => t.id === templateId) ?? null;
  // Looks up the FULL plans list (not tabPlans) — a selection made under one
  // tab must stay reflected in the sticky bar even after switching tabs.
  const selectedPlan = plans.find((p) => p.id === planId) ?? null;
  const canConfirm = Boolean(templateId && planId);

  function handleConfirm() {
    if (!templateId) return;
    setError(null);
    startTransition(async () => {
      const result = await confirmPortalSelection(token, templateId, planId);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setConfirmOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <div className="mb-8 text-center sm:mb-10">
        <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">
          Choose Your Favorite Template
        </h2>
        <p className="mt-2 text-sm text-slate-500 sm:text-base">
          Preview each website and select the design that best fits your business.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {templates.map((template) => (
          <PortalTemplateCard
            key={template.id}
            template={template}
            selected={template.id === templateId}
            onSelect={() => setTemplateId(template.id)}
          />
        ))}
      </div>

      <div className="mb-6 mt-14 text-center sm:mb-8">
        <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Choose Your Plan</h2>
        <p className="mt-2 text-sm text-slate-500 sm:text-base">
          Every plan includes your selected template, built out and launched for you.
        </p>
      </div>

      {tabs.length > 1 ? (
        <div className="mb-8 flex justify-center sm:mb-10">
          <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                  activeTab === tab.id
                    ? "bg-[#1b2951] text-white"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {cardPlans.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {cardPlans.map((plan) => (
            <PortalPlanCard
              key={plan.id}
              plan={plan}
              selected={plan.id === planId}
              showPricing={showPricing}
              onSelect={() => setPlanId(plan.id)}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-sm text-slate-400">
          No plans are available yet — reach out and we&apos;ll get you a quote.
        </p>
      )}

      {showPricing && oneTimePlans.length > 0 ? (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setOneTimeModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-lime-400 bg-lime-50 px-5 py-2.5 text-sm font-semibold text-lime-800 transition-colors hover:bg-lime-100"
          >
            {selectedPlan?.billingType === "ONE_TIME"
              ? `Selected: ${selectedPlan.name} (One-Time) — change?`
              : (oneTimeFooterNote?.trim() || "Prefer to pay once? See one-time options →")}
          </button>
        </div>
      ) : null}

      <div
        className={cn(
          "sticky bottom-4 mt-10 flex flex-col items-center gap-4 rounded-2xl bg-gradient-to-r from-[#1b2951] to-[#26315e] px-6 py-5 text-center shadow-2xl transition-shadow sm:flex-row sm:justify-between sm:text-left",
          canConfirm ? "ring-2 ring-lime-400/60" : "ring-1 ring-white/10"
        )}
      >
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
              canConfirm ? "bg-lime-400" : "bg-white/10"
            )}
          >
            <Check className={cn("h-4.5 w-4.5", canConfirm ? "text-[#1b2951]" : "text-white/40")} />
          </span>
          <p className="text-sm text-slate-300">
            {selectedTemplate || selectedPlan ? (
              <>
                Selected:{" "}
                <span className="font-semibold text-white">
                  {selectedTemplate?.name ?? "no template yet"}
                </span>{" "}
                template ·{" "}
                <span className="font-semibold text-white">
                  {selectedPlan
                    ? `${selectedPlan.name} (${selectedPlan.billingType === "MONTHLY" ? "Monthly" : "One-Time"})`
                    : "no plan yet"}
                </span>{" "}
                plan
              </>
            ) : (
              "Pick a template and a plan to continue."
            )}
          </p>
        </div>
        <Button disabled={!canConfirm} onClick={() => setConfirmOpen(true)} className="shrink-0">
          Confirm Selection
        </Button>
      </div>

      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) setError(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Confirm {selectedTemplate?.name} · {selectedPlan?.name}?
            </DialogTitle>
            <DialogDescription>
              You&apos;ve selected <strong>{selectedTemplate?.name}</strong> on the{" "}
              <strong>{selectedPlan?.name}</strong> plan. You can preview the template again
              before confirming.
            </DialogDescription>
          </DialogHeader>

          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <DialogFooter className="sm:justify-between">
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <div className="flex gap-2">
              {selectedTemplate?.previewUrl ? (
                <Button
                  variant="outline"
                  nativeButton={false}
                  render={
                    <a href={selectedTemplate.previewUrl} target="_blank" rel="noopener noreferrer" />
                  }
                >
                  <Eye className="h-4 w-4" />
                  View Preview
                </Button>
              ) : null}
              <Button onClick={handleConfirm} disabled={isPending}>
                {isPending ? "Confirming..." : "Confirm Selection"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={oneTimeModalOpen} onOpenChange={setOneTimeModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pay once instead?</DialogTitle>
            <DialogDescription>
              Pick the option that fits — built the same way, billed as a single upfront payment
              instead of monthly.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {oneTimePlans.map((plan) => (
              <PortalPlanCard
                key={plan.id}
                plan={plan}
                selected={plan.id === planId}
                showPricing={showPricing}
                onSelect={() => {
                  setPlanId(plan.id);
                  setOneTimeModalOpen(false);
                }}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
