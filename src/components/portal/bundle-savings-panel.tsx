import { Check, Sparkles } from "lucide-react";
import type { Plan } from "@prisma/client";

/** Shown alongside a plan flagged Plan.isBundle. All the copy here is
 * hand-typed by the admin (why-text, comparison lines, savings callout) —
 * not computed from other plans — see the Plan model's own comment for
 * why that tradeoff was chosen. */
export function BundleSavingsPanel({ bundle }: { bundle: Plan }) {
  const hasContent = Boolean(
    bundle.bundleWhyText?.trim() || bundle.bundleLines.length > 0 || bundle.bundleSavingsText?.trim()
  );
  if (!hasContent) return null;

  return (
    <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-7">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-lime-100">
          <Sparkles className="h-3.5 w-3.5 text-lime-700" />
        </span>
        <h3 className="text-base font-semibold text-slate-900">Why bundle?</h3>
      </div>

      {bundle.bundleWhyText?.trim() ? (
        <p className="mt-2 text-sm text-slate-500">{bundle.bundleWhyText}</p>
      ) : null}

      {bundle.bundleLines.length > 0 ? (
        <div className="mt-4 flex flex-col divide-y divide-slate-100 rounded-xl bg-slate-50">
          {bundle.bundleLines.map((line) => (
            <div key={line} className="px-4 py-3 text-sm font-medium text-slate-700">
              {line}
            </div>
          ))}
        </div>
      ) : null}

      {bundle.bundleSavingsText?.trim() ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-lime-50 px-4 py-3">
          <Check className="h-4 w-4 shrink-0 text-lime-700" />
          <p className="text-sm font-semibold text-lime-800">{bundle.bundleSavingsText}</p>
        </div>
      ) : null}
    </div>
  );
}
