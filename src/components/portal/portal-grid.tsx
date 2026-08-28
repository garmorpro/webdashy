"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";
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
import type { Category, Template, Plan } from "@prisma/client";

export function PortalGrid({
  token,
  templates,
  plans,
  showPricing,
  oneTimeFooterNote,
}: {
  token: string;
  templates: (Template & { category: Category | null })[];
  plans: Plan[];
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

  // Monthly plans are the main grid; one-time plans are selectable the same
  // way, just tucked behind the "pay once?" link/modal below instead of
  // cluttering the grid with a second row of cards.
  const cardPlans = plans.filter((p) => p.billingType === "MONTHLY");
  const oneTimePlans = plans.filter((p) => p.billingType === "ONE_TIME");

  const selectedTemplate = templates.find((t) => t.id === templateId) ?? null;
  // Looks up the full plans list (not just cardPlans) — the selection can
  // be a one-time plan picked from the modal below, not just a card here.
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

      <div className="mb-8 mt-14 text-center sm:mb-10">
        <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Choose Your Plan</h2>
        <p className="mt-2 text-sm text-slate-500 sm:text-base">
          Every plan includes your selected template, built out and launched for you.
        </p>
      </div>

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
              ? `Selected: ${selectedPlan.name} (one-time) — change?`
              : (oneTimeFooterNote?.trim() || "Prefer to pay once? See one-time options →")}
          </button>
        </div>
      ) : null}

      <div className="sticky bottom-4 mt-10 flex flex-col items-center gap-3 rounded-2xl bg-[#26315e] px-6 py-4 text-center shadow-2xl sm:flex-row sm:justify-between sm:text-left">
        <p className="text-sm text-slate-300">
          {selectedTemplate || selectedPlan ? (
            <>
              Selected:{" "}
              <span className="font-semibold text-white">
                {selectedTemplate?.name ?? "no template yet"}
              </span>{" "}
              template ·{" "}
              <span className="font-semibold text-white">{selectedPlan?.name ?? "no plan yet"}</span>{" "}
              plan
            </>
          ) : (
            "Pick a template and a plan to continue."
          )}
        </p>
        <Button disabled={!canConfirm} onClick={() => setConfirmOpen(true)}>
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
