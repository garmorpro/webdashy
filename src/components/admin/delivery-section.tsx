"use client";

import { useActionState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Hammer, Copy, ExternalLink, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionLocked } from "@/components/admin/section-locked";
import { startBuilding, saveDeliveryUrls, markDelivered } from "@/lib/actions/delivery";
import { REVIEW_STATUS_LABELS, REVIEW_STATUS_STYLES } from "@/lib/delivery-status";
import type { Delivery } from "@prisma/client";

function SaveButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : label}
    </Button>
  );
}

function NotStarted({ portalId, clientId }: { portalId: string; clientId: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <div className="rounded-xl border border-primary bg-card p-5 shadow-[0_0_0_3px_rgba(164,255,79,0.18)]">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Hammer className="h-4 w-4 text-muted-foreground" />
        Build &amp; Delivery
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">Invoice is paid — ready to start building.</p>
      <Button
        className="mt-4"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            try {
              await startBuilding(portalId, clientId);
            } catch {
              toast.error("Couldn't update this project. Please try again.");
            }
          })
        }
      >
        Start Building
      </Button>
    </div>
  );
}

function Building({
  portalId,
  clientId,
  delivery,
}: {
  portalId: string;
  clientId: string;
  delivery: Delivery;
}) {
  const saveAction = saveDeliveryUrls.bind(null, portalId, clientId);
  const [saveState, saveFormAction] = useActionState(saveAction, {});
  const deliverAction = markDelivered.bind(null, portalId, clientId);
  const [deliverState, deliverFormAction] = useActionState(deliverAction, {});

  return (
    <div className="rounded-xl border border-primary bg-card p-5 shadow-[0_0_0_3px_rgba(164,255,79,0.18)]">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Hammer className="h-4 w-4 text-muted-foreground" />
        Build &amp; Delivery
      </h2>
      <Badge variant="secondary" className="mt-2 w-fit bg-amber-50 text-amber-700">
        Building
      </Badge>

      <form action={saveFormAction} className="mt-4 space-y-3">
        {saveState?.error ? (
          <p className="text-sm text-destructive">{saveState.error}</p>
        ) : null}
        <div className="space-y-1.5">
          <Label htmlFor="staging-url">Staging / preview URL (optional)</Label>
          <Input
            id="staging-url"
            name="stagingUrl"
            type="url"
            placeholder="https://staging.example.com"
            defaultValue={delivery.stagingUrl ?? ""}
          />
        </div>
        <SaveButton label="Save" />
      </form>

      <form action={deliverFormAction} className="mt-5 space-y-3 border-t border-border pt-4">
        {deliverState?.error ? (
          <p className="text-sm text-destructive">{deliverState.error}</p>
        ) : null}
        <div className="space-y-1.5">
          <Label htmlFor="live-url">Live site URL</Label>
          <Input
            id="live-url"
            name="liveUrl"
            type="url"
            required
            placeholder="https://example.com"
            defaultValue={delivery.liveUrl ?? ""}
          />
        </div>
        <SaveButton label="Mark Delivered & Notify Client" />
      </form>
    </div>
  );
}

function Delivered({
  delivery,
  reviewUrl,
}: {
  delivery: Delivery;
  reviewUrl: string;
}) {
  const approved = delivery.reviewStatus === "APPROVED";

  function copyLink() {
    navigator.clipboard
      .writeText(reviewUrl)
      .then(() => toast.success("Review link copied"))
      .catch(() => toast.error("Couldn't copy the link — copy it manually."));
  }

  const dateFmt = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

  if (approved) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Hammer className="h-4 w-4 text-muted-foreground" />
            Build &amp; Delivery
          </h2>
          <Badge variant="secondary" className={REVIEW_STATUS_STYLES.APPROVED}>
            {REVIEW_STATUS_LABELS.APPROVED}
          </Badge>
        </div>
        <div className="mt-3 flex items-start gap-2 text-sm text-foreground">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <span>
            Delivered {delivery.deliveredAt ? dateFmt.format(delivery.deliveredAt) : ""}
            {delivery.reviewedAt ? ` · approved ${dateFmt.format(delivery.reviewedAt)}` : ""}
          </span>
        </div>
        {delivery.reviewFeedback ? (
          <div className="mt-3 rounded-lg border-l-2 border-primary bg-secondary px-4 py-3 text-sm italic text-foreground">
            &ldquo;{delivery.reviewFeedback}&rdquo;
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={
        "rounded-xl border bg-card p-5 " +
        (delivery.reviewStatus === "CHANGES_REQUESTED"
          ? "border-rose-300"
          : "border-primary shadow-[0_0_0_3px_rgba(164,255,79,0.18)]")
      }
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Hammer className="h-4 w-4 text-muted-foreground" />
          Build &amp; Delivery
        </h2>
        <Badge variant="secondary" className={REVIEW_STATUS_STYLES[delivery.reviewStatus]}>
          {REVIEW_STATUS_LABELS[delivery.reviewStatus]}
        </Badge>
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
        <code className="flex-1 truncate text-sm text-foreground">{reviewUrl}</code>
        <Button variant="outline" size="sm" onClick={copyLink}>
          <Copy className="h-3.5 w-3.5" />
          Copy
        </Button>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<a href={reviewUrl} target="_blank" rel="noopener noreferrer" />}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open
        </Button>
      </div>

      {delivery.reviewFeedback ? (
        <div className="mt-3 rounded-lg border-l-2 border-rose-400 bg-rose-50 px-4 py-3 text-sm italic text-rose-900">
          &ldquo;{delivery.reviewFeedback}&rdquo;
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Sent to the client — awaiting their review.</p>
      )}
    </div>
  );
}

export function DeliverySection({
  portalId,
  clientId,
  delivery,
  reviewUrl,
  locked,
}: {
  portalId: string;
  clientId: string;
  delivery: Delivery | null;
  reviewUrl: string | null;
  locked: boolean;
}) {
  if (locked) {
    return (
      <SectionLocked
        title="Build & Delivery"
        icon={Hammer}
        reason="Available once the invoice is paid."
      />
    );
  }

  if (!delivery) return <NotStarted portalId={portalId} clientId={clientId} />;
  if (delivery.status === "BUILDING") {
    return <Building portalId={portalId} clientId={clientId} delivery={delivery} />;
  }
  return <Delivered delivery={delivery} reviewUrl={reviewUrl ?? ""} />;
}
