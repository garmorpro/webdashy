import { CheckCircle2, MessageCircle } from "lucide-react";

export function ReviewOutcome({
  approved,
  feedback,
}: {
  approved: boolean;
  feedback: string | null;
}) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm sm:px-12">
      <span
        className={`flex h-14 w-14 items-center justify-center rounded-full ${approved ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}
      >
        {approved ? <CheckCircle2 className="h-8 w-8" /> : <MessageCircle className="h-8 w-8" />}
      </span>

      <h2 className="mt-6 text-2xl font-semibold text-slate-900">
        {approved ? "Thanks for approving!" : "Thanks for the feedback!"}
      </h2>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        {approved
          ? "We're all set — this project is wrapped up."
          : "We'll make those changes and follow up with you shortly."}
      </p>

      {feedback ? (
        <div className="mt-6 w-full rounded-lg border-l-2 border-amber-400 bg-amber-50 px-4 py-3 text-left text-sm italic text-amber-900">
          &ldquo;{feedback}&rdquo;
        </div>
      ) : null}
    </div>
  );
}
