"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Link2, MoreVertical, Pencil, Archive, Trash2 } from "lucide-react";
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
import type { Category, Client, Template } from "@prisma/client";

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

export function ClientsTable({
  clients,
  templates,
}: {
  clients: Client[];
  templates: (Template & { category: Category | null })[];
}) {
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
              <TableRow key={client.id}>
                <TableCell>
                  <Link href={`/clients/${client.id}`} className="block">
                    <span className="font-medium text-foreground">{client.businessName}</span>
                    <span className="block text-xs text-muted-foreground">
                      {client.contactName}
                    </span>
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={`${CLIENT_STATUS_STYLES[client.status]} capitalize`}
                  >
                    {CLIENT_STATUS_LABELS[client.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{client.industry ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {client.estimatedValue
                    ? `$${Number(client.estimatedValue).toLocaleString()}`
                    : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {dateFormatter.format(client.createdAt)}
                </TableCell>
                <TableCell className="text-right">
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
          if (deleteTarget) await deleteClient(deleteTarget.id);
        }}
      />
    </>
  );
}
