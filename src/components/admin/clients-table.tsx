"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Link2, Eye, CheckCircle2, EyeOff, MoreVertical, Pencil, Archive, Trash2 } from "lucide-react";
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
import { CreatePortalDialog } from "@/components/admin/create-portal-dialog";
import { ConfirmActionDialog } from "@/components/admin/confirm-action-dialog";
import { archiveClient, deleteClient } from "@/lib/actions/clients";
import { CLIENT_STATUS_LABELS, CLIENT_STATUS_STYLES } from "@/lib/client-status";
import { avatarColorsFor, initialsFor } from "@/lib/avatar-colors";
import type { Category, Client, PortalStatus, Template } from "@prisma/client";

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

// A client's most recent portal, flattened down to just what this table
// (and the row-level "Portal" column) needs — see clients/page.tsx for
// where this gets assembled from the real Portal/TemplateSelection rows.
export type ClientWithPortal = Client & {
  portal: {
    status: PortalStatus;
    viewCount: number;
    selectedTemplateName: string | null;
  } | null;
};

function avatarStyleFor(name: string): React.CSSProperties {
  const colors = avatarColorsFor(name);
  return { backgroundColor: colors.bg, color: colors.text };
}

function PortalCell({ portal }: { portal: ClientWithPortal["portal"] }) {
  if (!portal) {
    return <span className="text-xs font-semibold italic text-muted-foreground/70">No portal yet</span>;
  }

  if (portal.selectedTemplateName) {
    return (
      <div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
          <CheckCircle2 className="h-3 w-3" />
          Selected
        </div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">
          &rarr; {portal.selectedTemplateName}
        </div>
      </div>
    );
  }

  if (portal.status === "DISABLED") {
    return (
      <div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700">
          <EyeOff className="h-3 w-3" />
          Disabled
        </div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">
          {portal.viewCount} view{portal.viewCount === 1 ? "" : "s"}
        </div>
      </div>
    );
  }

  if (portal.status === "VIEWED") {
    return (
      <div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700">
          <Eye className="h-3 w-3" />
          Viewed
        </div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">
          {portal.viewCount} view{portal.viewCount === 1 ? "" : "s"}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700">
        <Link2 className="h-3 w-3" />
        Sent
      </div>
      <div className="mt-0.5 text-[11px] text-muted-foreground">Not viewed yet</div>
    </div>
  );
}

export function ClientsTable({
  clients,
  templates,
}: {
  clients: ClientWithPortal[];
  templates: (Template & { category: Category | null })[];
}) {
  const router = useRouter();
  const [portalTarget, setPortalTarget] = useState<Client | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [, startTransition] = useTransition();

  function handleArchive(client: Client) {
    startTransition(async () => {
      try {
        await archiveClient(client.id);
        toast.success(`${client.businessName} archived.`);
      } catch {
        toast.error("Couldn't archive this client. Please try again.");
      }
    });
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Portal</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Est. Value</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-12 text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow
                key={client.id}
                className="cursor-pointer"
                onClick={() => router.push(`/clients/${client.id}`)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold"
                      style={avatarStyleFor(client.businessName)}
                    >
                      {initialsFor(client.businessName)}
                    </div>
                    <div>
                      <span className="font-bold text-foreground">{client.businessName}</span>
                      <span className="block text-xs text-muted-foreground">
                        {client.contactName}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={`${CLIENT_STATUS_STYLES[client.status]} capitalize`}
                  >
                    {CLIENT_STATUS_LABELS[client.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <PortalCell portal={client.portal} />
                </TableCell>
                <TableCell className="text-muted-foreground">{client.industry ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {client.estimatedValue
                    ? `$${Number(client.estimatedValue).toLocaleString("en-US")}`
                    : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {dateFormatter.format(client.createdAt)}
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label={`Actions for ${client.businessName}`}
                        />
                      }
                    >
                      <MoreVertical className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setPortalTarget(client)}>
                        <Link2 className="h-4 w-4" />
                        Start Portal
                      </DropdownMenuItem>
                      <DropdownMenuItem render={<Link href={`/clients/${client.id}`} />}>
                        <Pencil className="h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleArchive(client)}>
                        <Archive className="h-4 w-4" />
                        Archive
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setDeleteTarget(client)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <CreatePortalDialog
        client={portalTarget}
        templates={templates}
        onOpenChange={(open) => !open && setPortalTarget(null)}
      />

      <ConfirmActionDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={deleteTarget ? `Delete ${deleteTarget.businessName}?` : ""}
        description="This permanently removes the client and any portals created for them. This can't be undone."
        confirmLabel="Delete Client"
        pendingLabel="Deleting..."
        onConfirm={async () => {
          if (deleteTarget) {
            const result = await deleteClient(deleteTarget.id);
            if (result?.error) throw new Error(result.error);
          }
        }}
      />
    </>
  );
}
