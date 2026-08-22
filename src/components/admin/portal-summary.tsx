"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Copy, ExternalLink, Eye, Ban, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { setPortalDisabled, resetPortalSelection } from "@/lib/actions/portals";
import { PORTAL_STATUS_LABELS, PORTAL_STATUS_STYLES } from "@/lib/portal-status";
import type { PortalStatus } from "@prisma/client";

export function PortalSummary({
  portalId,
  clientId,
  status,
  portalUrl,
  message,
  templateNames,
  viewCount,
  createdAt,
  selectedTemplateName,
  selectedAt,
}: {
  portalId: string;
  clientId: string;
  status: PortalStatus;
  portalUrl: string;
  message: string | null;
  templateNames: string[];
  viewCount: number;
  createdAt: Date;
  selectedTemplateName: string | null;
  selectedAt: Date | null;
}) {
  const [isPending, startTransition] = useTransition();

  const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });
  const isDisabled = status === "DISABLED";

  function copyLink() {
    navigator.clipboard
      .writeText(portalUrl)
      .then(() => toast.success("Portal link copied"))
      .catch(() => toast.error("Couldn't copy the link — copy it manually."));
  }

  function toggleDisabled() {
    startTransition(async () => {
      try {
        await setPortalDisabled(portalId, clientId, !isDisabled);
        toast.success(isDisabled ? "Portal re-enabled" : "Portal disabled");
      } catch {
        toast.error("Couldn't update the portal. Please try again.");
      }
    });
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">Template Portal</h2>
        <Badge variant="secondary" className={PORTAL_STATUS_STYLES[status]}>
          {PORTAL_STATUS_LABELS[status]}
        </Badge>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
        <code className="flex-1 truncate text-sm text-foreground">{portalUrl}</code>
        <Button variant="outline" size="sm" onClick={copyLink}>
          <Copy className="h-3.5 w-3.5" />
          Copy Portal Link
        </Button>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<a href={portalUrl} target="_blank" rel="noopener noreferrer" />}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open Portal
        </Button>
      </div>

      <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Templates Shared</dt>
          <dd className="text-foreground">{templateNames.join(", ")}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Created</dt>
          <dd className="text-foreground">{dateFormatter.format(createdAt)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Total Views</dt>
          <dd className="flex items-center gap-1 text-foreground">
            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
            {viewCount}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Selected Template</dt>
          <dd className="flex items-center gap-1 text-foreground">
            {selectedTemplateName ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                {selectedTemplateName}
                {selectedAt ? (
                  <span className="text-muted-foreground">
                    · {dateFormatter.format(selectedAt)}
                  </span>
                ) : null}
              </>
            ) : (
              <span className="text-muted-foreground">Not selected yet</span>
            )}
          </dd>
        </div>
        {message ? (
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Portal Message</dt>
            <dd className="text-foreground">{message}</dd>
          </div>
        ) : null}
      </dl>

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <Button
          variant="outline"
          size="sm"
          render={<Link href={`/clients/${clientId}/portal/edit`} />}
        >
          Edit Templates
        </Button>

        <Button variant="outline" size="sm" disabled={isPending} onClick={toggleDisabled}>
          {isDisabled ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Enable Portal
            </>
          ) : (
            <>
              <Ban className="h-3.5 w-3.5" />
              Disable Portal
            </>
          )}
        </Button>

        {selectedTemplateName ? (
          <ConfirmDeleteButton
            triggerLabel="Reset Selection"
            title="Reset this client's selection?"
            description="This clears their confirmed template choice so they can pick again. The portal stays active."
            confirmLabel="Reset Selection"
            onConfirm={() => resetPortalSelection(portalId, clientId)}
          />
        ) : null}
      </div>
    </div>
  );
}
