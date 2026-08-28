"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Plan } from "@prisma/client";

export function PortalPlanCard({
  plan,
  selected,
  showPricing,
  onSelect,
}: {
  plan: Plan;
  selected: boolean;
  showPricing: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative flex w-full flex-col rounded-2xl border-2 bg-white p-6 text-left shadow-sm transition-shadow hover:shadow-lg",
        selected ? "border-lime-400 ring-4 ring-lime-400/30" : "border-slate-200"
      )}
    >
      {plan.isPopular ? (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#1b2951] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
          Most Popular
        </span>
      ) : null}

      <h3 className="text-base font-semibold text-slate-900">{plan.name}</h3>

      {showPricing ? (
        <p className="mt-1.5 text-2xl font-extrabold text-slate-900">
          ${Number(plan.price).toLocaleString()}
          <span className="ml-1 text-xs font-semibold text-slate-400">
            {plan.billingType === "MONTHLY" ? "/month" : "one-time"}
          </span>
        </p>
      ) : (
        <p className="mt-2 text-sm font-semibold text-slate-500">Custom quote after selection</p>
      )}

      {plan.tagline ? <p className="mt-1.5 text-sm text-slate-500">{plan.tagline}</p> : null}

      {plan.features.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-2">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm text-slate-700">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
              {feature}
            </li>
          ))}
        </ul>
      ) : null}

      {selected ? (
        <p className="mt-4 flex items-center gap-1 text-xs font-semibold text-emerald-700">
          <Check className="h-3.5 w-3.5" />
          Selected
        </p>
      ) : null}
    </button>
  );
}
