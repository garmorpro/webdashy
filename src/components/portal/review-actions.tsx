"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { approveDelivery, requestChanges } from "@/lib/actions/public-delivery-review";

export function ReviewActions({ reviewToken }: { reviewToken: string }) {
  const router = useRouter();
  const [showChanges, setShowChanges] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      const result = await approveDelivery(reviewToken);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleRequestChanges() {
    setError(null);
    startTransition(async () => {
      const result = await requestChanges(reviewToken, feedback);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      {error ? (
        <div className="mx-auto mb-4 max-w-md rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {!showChanges ? (
        <div className="flex flex-wrap justify-center gap-3">
          <Button disabled={isPending} onClick={handleApprove}>
            <CheckCircle2 className="h-4 w-4" />
            {isPending ? "Approving..." : "Approve — Looks Great!"}
          </Button>
          <Button variant="outline" disabled={isPending} onClick={() => setShowChanges(true)}>
            Request Changes
          </Button>
        </div>
      ) : (
        <div className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-white p-5">
          <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="feedback">
            What would you like changed?
          </label>
          <Textarea
            id="feedback"
            rows={4}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="mb-3"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" disabled={isPending} onClick={() => setShowChanges(false)}>
              Cancel
            </Button>
            <Button disabled={isPending} onClick={handleRequestChanges}>
              {isPending ? "Sending..." : "Send Feedback"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
