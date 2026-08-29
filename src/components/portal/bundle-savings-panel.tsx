import { Check, Sparkles } from "lucide-react";
import type { Plan } from "@prisma/client";

// Splits an admin-typed comparison line like "Website only — $175/mo" into
// a left label and a right-aligned price, so it reads like a real price
// comparison instead of one flat sentence. Falls back to rendering the
// whole line unsplit if it wasn't written with a dash separator.
function splitLine(line: string): [string, string | null] {
  const match = line.match(/^(.*?)\s+[—-]\s+(.+)$/);
  if (!match) return [line, null];
  return [match[1], match[2]];
}

/** Shown alongside a plan flagged Plan.isBundle. The why-text and
 * comparison lines are hand-typed by the admin (see the Plan model's own
 * comment) — only the bundle's own price comes straight from the plan
 * record, so at least that half can never go stale. */
export function BundleSavingsPanel({ bundle }: { bundle: Plan }) {
  const hasContent = Boolean(
    bundle.bundleWhyText?.trim() ||
      bundle.bundleLines.length > 0 ||
      bundle.bundleSavingsText?.trim() ||
      bundle.bundleFooterText?.trim()
  );
  if (!hasContent) return null;

  const suffix = bundle.billingType === "MONTHLY" ? "/mo" : " one-time";

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lime-100">
          <Sparkles className="h-4 w-4 text-lime-700" />
        </span>
        <h3 className="text-lg font-bold text-slate-900">Why bundle?</h3>
      </div>

      {bundle.bundleWhyText?.trim() ? (
        <p className="mt-3 text-[15px] leading-relaxed text-slate-500">{bundle.bundleWhyText}</p>
      ) : null}

      {bundle.bundleLines.length > 0 ? (
        <div className="mt-6 flex flex-col divide-y divide-slate-100">
          {bundle.bundleLines.map((line) => {
            const [label, price] = splitLine(line);
            return (
              <div key={line} className="flex items-baseline justify-between gap-4 py-3">
                <span className="text-[15px] text-slate-600">{label}</span>
                {price ? (
                  <span className="shrink-0 text-[15px] font-medium tabular-nums text-slate-500">
                    {price}
                  </span>
                ) : null}
              </div>
            );
          })}
          <div className="flex items-baseline justify-between gap-4 pt-3.5">
            <span className="text-base font-bold text-slate-900">{bundle.name}</span>
            <span className="shrink-0 text-xl font-extrabold tabular-nums text-slate-900">
              {/* Explicit locale — see portal-plan-card.tsx's comment on
                  the same pattern; a bare toLocaleString() is a real
                  hydration-mismatch source for 4+ digit prices. */}
              ${Number(bundle.price).toLocaleString("en-US")}
              {suffix}
            </span>
          </div>
        </div>
      ) : null}

      {bundle.bundleSavingsText?.trim() ? (
        <div className="mt-5 flex items-center gap-2.5 rounded-xl bg-lime-50 px-4 py-3.5">
          <Check className="h-4 w-4 shrink-0 text-lime-700" />
          <p className="text-[15px] font-bold text-lime-800">{bundle.bundleSavingsText}</p>
        </div>
      ) : null}

      {bundle.bundleFooterText?.trim() ? (
        <p className="mt-4 text-[13px] leading-relaxed text-slate-400">{bundle.bundleFooterText}</p>
      ) : null}
    </div>
  );
}
