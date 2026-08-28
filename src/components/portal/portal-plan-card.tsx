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
  // Either badge gets the same bold, inverted card treatment — a featured
  // plan should read as visually distinct at a glance, not just carry a
  // small label a visitor might skim past. A bundle plan always gets this
  // treatment too, independent of Most Popular/Recommended — it's the
  // premium tier next to a "Why bundle?" panel, so it should never read as
  // just another plain card.
  const featured = plan.isPopular || plan.isRecommended || plan.isBundle;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative flex h-full w-full flex-col rounded-2xl border-2 p-6 text-left shadow-sm transition-shadow hover:shadow-lg",
        featured ? "border-transparent bg-[#1b2951]" : "bg-white",
        selected && !featured ? "border-lime-400 ring-4 ring-lime-400/30" : null,
        selected && featured ? "ring-4 ring-lime-400/40" : null,
        !selected && !featured ? "border-slate-200" : null
      )}
    >
      {plan.isPopular ? (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-lime-400 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#1b2951]">
          Most Popular
        </span>
      ) : null}

      {/* Only shown when Most Popular isn't also set — that ribbon already
          spans the top edge and wraps on narrow cards, so a second badge in
          the same corner would collide with it. Most Popular is the bolder
          claim, so it wins when a plan carries both flags. */}
      {plan.isRecommended && !plan.isPopular ? (
        <span
          className={cn(
            "absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
            featured ? "bg-white/10 text-orange-300" : "bg-blue-50 text-blue-700"
          )}
        >
          Recommended
        </span>
      ) : null}

      <h3 className={cn("text-base font-semibold", featured ? "text-white" : "text-slate-900")}>
        {plan.name}
      </h3>

      {showPricing ? (
        <p
          className={cn(
            "mt-1.5 text-2xl font-extrabold",
            featured ? "text-white" : "text-slate-900"
          )}
        >
          ${Number(plan.price).toLocaleString()}
          <span
            className={cn(
              "ml-1 text-xs font-semibold",
              featured ? "text-white/50" : "text-slate-400"
            )}
          >
            {plan.billingType === "MONTHLY" ? "/month" : "one-time"}
          </span>
        </p>
      ) : (
        <p
          className={cn(
            "mt-2 text-sm font-semibold",
            featured ? "text-white/70" : "text-slate-500"
          )}
        >
          Custom quote after selection
        </p>
      )}

      {plan.tagline ? (
        <p className={cn("mt-1.5 text-sm", featured ? "text-white/70" : "text-slate-500")}>
          {plan.tagline}
        </p>
      ) : null}

      {plan.features.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-2">
          {plan.features.map((feature) => (
            <li
              key={feature}
              className={cn(
                "flex items-start gap-2 text-sm",
                featured ? "text-white/90" : "text-slate-700"
              )}
            >
              <Check
                className={cn(
                  "mt-0.5 h-3.5 w-3.5 shrink-0",
                  featured ? "text-lime-400" : "text-emerald-600"
                )}
              />
              {feature}
            </li>
          ))}
        </ul>
      ) : null}

      {/* Not a real nested <button> — the whole card is already clickable
          via the outer button; this is a purely visual CTA row that just
          rides that same click, so people have an explicit "this is what
          I'm choosing" affordance instead of only an implicit card click. */}
      <div
        className={cn(
          "mt-5 flex items-center justify-center gap-1.5 rounded-full py-2.5 text-sm font-bold transition-colors",
          selected
            ? "bg-lime-400 text-[#1b2951]"
            : featured
              ? "bg-white/10 text-white"
              : "bg-slate-100 text-slate-700"
        )}
      >
        {selected ? (
          <>
            <Check className="h-4 w-4" />
            Selected
          </>
        ) : plan.isBundle ? (
          "Get the Bundle"
        ) : (
          `Choose ${plan.name}`
        )}
      </div>
    </button>
  );
}
