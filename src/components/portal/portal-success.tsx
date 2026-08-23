import { CheckCircle2 } from "lucide-react";

export function PortalSuccess({
  templateName,
  planName,
  selectedAt,
}: {
  templateName: string;
  planName: string | null;
  selectedAt: Date;
}) {
  const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "long" });

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm sm:px-12">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <CheckCircle2 className="h-8 w-8" />
      </span>

      <h2 className="mt-6 text-2xl font-semibold text-slate-900">Great choice!</h2>
      <p className="mt-2 text-sm text-slate-500">You selected:</p>
      <p className="mt-1 text-xl font-semibold text-[#1b2951]">
        {templateName}
        {planName ? ` · ${planName} Plan` : ""}
      </p>

      <p className="mt-6 max-w-sm text-sm text-slate-500">
        I&apos;ll be notified of your selection and can begin working with you on your website.
      </p>

      <p className="mt-4 text-xs text-slate-400">
        Selected {dateFormatter.format(selectedAt)}
      </p>
    </div>
  );
}
