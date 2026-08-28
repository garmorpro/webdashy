import { Check, Sparkles } from "lucide-react";
import type { Plan } from "@prisma/client";

/** Shown alongside a plan that bundles other plans together (Plan.bundleComponents
 * — see the schema's own comment). All the math here is real, computed from the
 * bundled plans' own live prices — never typed in by hand — so it can't drift
 * from what those plans actually cost on their own. */
export function BundleSavingsPanel({ bundle }: { bundle: Plan & { bundleComponents: Plan[] } }) {
  const components = bundle.bundleComponents;
  const componentSum = components.reduce((sum, p) => sum + Number(p.price), 0);
  const bundlePrice = Number(bundle.price);
  const savings = componentSum - bundlePrice;
  const suffix = (billingType: Plan["billingType"]) => (billingType === "MONTHLY" ? "/mo" : " one-time");

  return (
    <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-7">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-lime-100">
          <Sparkles className="h-3.5 w-3.5 text-lime-700" />
        </span>
        <h3 className="text-base font-semibold text-slate-900">Why bundle?</h3>
      </div>
      <p className="mt-2 text-sm text-slate-500">
        {bundle.name} combines {components.length === 2 ? "both of these" : "all of these"} into
        one plan — here&apos;s what you&apos;d pay separately versus together.
      </p>

      <div className="mt-4 flex flex-col divide-y divide-slate-100 rounded-xl bg-slate-50">
        {components.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-sm font-medium text-slate-700">{p.name}</span>
            <span className="text-sm font-semibold text-slate-500">
              ${Number(p.price).toLocaleString()}
              {suffix(p.billingType)}
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <span className="text-sm font-semibold text-slate-500">Separately</span>
          <span className="text-sm font-semibold text-slate-400 line-through">
            ${componentSum.toLocaleString()}
            {suffix(bundle.billingType)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-b-xl bg-[#1b2951] px-4 py-3">
          <span className="text-sm font-bold text-white">{bundle.name} (bundled)</span>
          <span className="text-sm font-bold text-lime-400">
            ${bundlePrice.toLocaleString()}
            {suffix(bundle.billingType)}
          </span>
        </div>
      </div>

      {savings > 0 ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-lime-50 px-4 py-3">
          <Check className="h-4 w-4 shrink-0 text-lime-700" />
          <p className="text-sm font-semibold text-lime-800">
            You save ${savings.toLocaleString()}
            {suffix(bundle.billingType)} by bundling.
          </p>
        </div>
      ) : null}
    </div>
  );
}
