"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";
import { PortalTemplateCard } from "@/components/portal/portal-template-card";
import { PortalPlanCard } from "@/components/portal/portal-plan-card";
import { BundleSavingsPanel } from "@/components/portal/bundle-savings-panel";
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
  // A bundle is any plan on this tab flagged Plan.isBundle — drives the
  // "Why bundle?" panel below the grid. Its copy is hand-typed (see
  // bundle-savings-panel.tsx), so it's shown regardless of showPricing.
  const bundlePlan = tabPlans.find((p) => p.isBundle);

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

      {cardPlans.length === 1 && bundlePlan ? (
        // A tab that's just one bundle plan (the common shape — e.g. a
        // "Website + Reviews" tab) gets the plan card and its "Why bundle?"
        // panel side by side, matching how a bundle should be pitched:
        // the offer on one side, the case for it on the other.
        <div className="mx-auto grid max-w-4xl grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
          <PortalPlanCard
            plan={cardPlans[0]}
            selected={cardPlans[0].id === planId}
            showPricing={showPricing}
            onSelect={() => setPlanId(cardPlans[0].id)}
          />
          <BundleSavingsPanel bundle={bundlePlan} />
        </div>
      ) : cardPlans.length > 0 ? (
        <>
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
          {bundlePlan ? (
            <div className="mx-auto mt-8 max-w-2xl">
              <BundleSavingsPanel bundle={bundlePlan} />
            </div>
          ) : null}
        </>
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

      {/* `sticky` lives on this plain outer wrapper, with none of the
          visual styling on it — a `position: sticky` element combined with
          `overflow: hidden` on the SAME node is a known Chromium repaint
          trap: a pure content/text update inside it (no accompanying
          layout change) can fail to visually repaint until some other
          interaction forces one, even though the underlying DOM/React
          state updated correctly. Keeping the clipped, rounded, styled box
          as a plain non-sticky CHILD sidesteps that failure mode
          entirely. */}
      <div className="sticky bottom-4 mt-10 will-change-transform">
        <div
          // Forces a full unmount+remount of this whole box whenever the
          // selection changes, instead of React patching the existing DOM
          // node's text in place. Belt-and-suspenders on top of the
          // sticky/overflow split above: whatever the exact browser-paint
          // mechanism turns out to be, a brand-new DOM node can't possibly
          // show stale content, since there's no old version of it to be
          // stale — this doesn't rely on a specific theory being right.
          key={`${templateId ?? "none"}-${planId ?? "none"}`}
          className={cn(
            "flex items-stretch overflow-hidden rounded-2xl bg-gradient-to-r from-[#1b2951] to-[#26315e] shadow-2xl transition-shadow",
            canConfirm ? "ring-2 ring-lime-400/60" : "ring-1 ring-white/10"
          )}
        >
          <div className="w-1.5 shrink-0 bg-lime-400" />
          <div className="flex flex-1 flex-col items-center justify-between gap-4 px-6 py-5 sm:flex-row">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-7">
              <div className="text-center sm:text-left">
                <div className="text-[10.5px] font-bold uppercase tracking-wide text-slate-400">
                  Template
                </div>
                <div className="text-[15px] font-bold text-white">
                  {selectedTemplate?.name ?? "—"}
                </div>
              </div>
              <div className="hidden h-8 w-px bg-white/15 sm:block" />
              <div className="text-center sm:text-left">
                <div className="text-[10.5px] font-bold uppercase tracking-wide text-slate-400">
                  Plan
                </div>
                <div className="text-[15px] font-bold text-white">
                  {selectedPlan ? (
                    <>
                      {selectedPlan.name}{" "}
                      <span className="font-semibold text-slate-400">
                        ({selectedPlan.billingType === "MONTHLY" ? "Monthly" : "One-Time"})
                      </span>
                    </>
                  ) : (
                    "—"
                  )}
                </div>
              </div>
            </div>
            <Button disabled={!canConfirm} onClick={() => setConfirmOpen(true)} className="shrink-0">
              Confirm Selection
            </Button>
          </div>
        </div>
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
