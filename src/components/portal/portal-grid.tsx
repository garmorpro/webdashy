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
}: {
  token: string;
  templates: (Template & { category: Category | null })[];
  plans: Plan[];
  showPricing: boolean;
}) {
  const router = useRouter();
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // A one-time plan with a footer note set exists purely to produce that
  // note — it's excluded from the selectable grid entirely rather than
  // shown as a redundant card that duplicates what the note already says.
  // A one-time plan WITHOUT a note still behaves like any other plan (a
  // real, directly selectable one-time tier).
  const isFooterOnly = (p: Plan) => p.billingType === "ONE_TIME" && Boolean(p.footerNote);
  const cardPlans = plans.filter((p) => !isFooterOnly(p));
  // Gated behind showPricing too, same as the plan cards themselves, since a
  // note like "also available for $3,800" is itself a dollar amount.
  const footerNotes = showPricing
    ? plans.filter(isFooterOnly).map((p) => p.footerNote as string)
    : [];

  const selectedTemplate = templates.find((t) => t.id === templateId) ?? null;
  const selectedPlan = cardPlans.find((p) => p.id === planId) ?? null;
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

      {footerNotes.length > 0 ? (
        <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-4 text-center">
          {footerNotes.map((note, i) => (
            <p key={i} className="text-sm text-slate-600">
              {note}
            </p>
          ))}
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
    </>
  );
}
