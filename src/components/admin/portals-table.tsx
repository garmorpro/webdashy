"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Copy,
  ExternalLink,
  MoreVertical,
  Pencil,
  Ban,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmActionDialog } from "@/components/admin/confirm-action-dialog";
import { setPortalDisabled, resetPortalSelection } from "@/lib/actions/portals";
import { PORTAL_STATUS_LABELS, PORTAL_STATUS_STYLES } from "@/lib/portal-status";
import type { PortalStatus } from "@prisma/client";

export type PortalRow = {
  id: string;
  clientId: string;
  clientName: string;
  status: PortalStatus;
  templateCount: number;
  viewCount: number;
  selectedTemplateName: string | null;
  createdAt: Date;
  updatedAt: Date;
  portalUrl: string;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

export function PortalsTable({ portals }: { portals: PortalRow[] }) {
  const [, startTransition] = useTransition();
  const [resetTarget, setResetTarget] = useState<PortalRow | null>(null);

  function copyLink(url: string) {
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Portal link copied"))
      .catch(() => toast.error("Couldn't copy the link — copy it manually."));
  }

  function toggleDisabled(portal: PortalRow) {
    const nextDisabled = portal.status !== "DISABLED";
    startTransition(async () => {
      try {
        await setPortalDisabled(portal.id, portal.clientId, nextDisabled);
        toast.success(nextDisabled ? "Portal disabled" : "Portal re-enabled");
      } catch {
        toast.error("Couldn't update the portal. Please try again.");
      }
    });
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Templates</TableHead>
            <TableHead>Views</TableHead>
            <TableHead>Selected Template</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Last Activity</TableHead>
            <TableHead className="w-12 text-right">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {portals.map((portal) => (
            <TableRow key={portal.id}>
              <TableCell>
                <Link
                  href={`/clients/${portal.clientId}`}
                  className="font-medium text-foreground hover:underline"
                >
                  {portal.clientName}
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={PORTAL_STATUS_STYLES[portal.status]}>
                  {PORTAL_STATUS_LABELS[portal.status]}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{portal.templateCount}</TableCell>
              <TableCell className="text-muted-foreground">{portal.viewCount}</TableCell>
              <TableCell className="text-muted-foreground">
                {portal.selectedTemplateName ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {dateFormatter.format(portal.createdAt)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {dateFormatter.format(portal.updatedAt)}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label={`Actions for ${portal.clientName}'s portal`}
                      />
                    }
                  >
                    <MoreVertical className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => copyLink(portal.portalUrl)}>
                      <Copy className="h-4 w-4" />
                      Copy Portal Link
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      render={
                        <a href={portal.portalUrl} target="_blank" rel="noopener noreferrer" />
                      }
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open Portal
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      render={<Link href={`/clients/${portal.clientId}/portal/edit`} />}
                    >
                      <Pencil className="h-4 w-4" />
                      Edit Templates
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleDisabled(portal)}>
                      {portal.status === "DISABLED" ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Enable Portal
                        </>
                      ) : (
                        <>
                          <Ban className="h-4 w-4" />
                          Disable Portal
                        </>
                      )}
                    </DropdownMenuItem>
                    {portal.selectedTemplateName ? (
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setResetTarget(portal)}
                      >
                        <RotateCcw className="h-4 w-4" />
                        Reset Selection
                      </DropdownMenuItem>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ConfirmActionDialog
        open={resetTarget !== null}
        onOpenChange={(open) => !open && setResetTarget(null)}
        title={
          resetTarget
            ? `Reset ${resetTarget.clientName}'s selection?`
            : ""
        }
        description="This clears their confirmed template choice so they can pick again. The portal stays active."
        confirmLabel="Reset Selection"
        pendingLabel="Resetting..."
        onConfirm={async () => {
          if (!resetTarget) return;
          await resetPortalSelection(resetTarget.id, resetTarget.clientId);
          toast.success("Selection reset");
          setResetTarget(null);
        }}
      />
    </div>
  );
}
