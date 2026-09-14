"use client";

import { useMemo, useState, useTransition } from "react";
import { MapPin, MoreVertical, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteLead, updateLeadStatus } from "@/lib/actions/leads";
import { LEAD_STATUSES, LEAD_STATUS_LABELS, LEAD_STATUS_STYLES } from "@/lib/lead-status";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { ConfirmActionDialog } from "@/components/admin/confirm-action-dialog";
import { LeadFormDialog, type LeadRow } from "@/components/admin/lead-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" });

function LeadStatusControl({ lead }: { lead: LeadRow }) {
  const [pending, startTransition] = useTransition();
  return (
    <Select
      value={lead.status}
      disabled={pending}
      onValueChange={(status) => {
        if (!status || status === lead.status) return;
        startTransition(async () => {
          try {
            const result = await updateLeadStatus(lead.id, status);
            if (result.error) toast.error(result.error);
            else toast.success("Lead status updated.");
          } catch {
            toast.error("Couldn't change this lead's status. Please try again.");
          }
        });
      }}
    >
      <SelectTrigger aria-label={`Status for ${lead.businessName}`} className="w-36" aria-busy={pending}>
        <SelectValue>
          <Badge variant="secondary" className={LEAD_STATUS_STYLES[lead.status]}>
            {LEAD_STATUS_LABELS[lead.status]}
          </Badge>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {LEAD_STATUSES.map((status) => (
          <SelectItem key={status} value={status}>{LEAD_STATUS_LABELS[status]}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function LeadsView({ leads }: { leads: LeadRow[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [editor, setEditor] = useState<{ lead: LeadRow | null } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LeadRow | null>(null);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter((lead) => {
      if (statusFilter !== "ALL" && lead.status !== statusFilter) return false;
      return !q || [lead.businessName, lead.phone, lead.email, lead.website, lead.address, lead.city, lead.businessCategory]
        .filter(Boolean).join(" ").toLowerCase().includes(q);
    });
  }, [leads, query, statusFilter]);

  const addButton = (
    <Button size="sm" onClick={() => setEditor({ lead: null })}>
      <Plus className="h-4 w-4" /> Add Lead
    </Button>
  );

  return (
    <div className="min-w-0">
      <PageHeader title="Leads" subtitle="Business prospects found on Google Maps." actions={addButton} />
      {leads.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="Add your first lead"
          description="Save business details and keep track of your outreach."
          action={addButton}
        />
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Search leads"
                placeholder="Search businesses, contacts, city..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? "ALL")}>
              <SelectTrigger aria-label="Filter leads by status" className="w-full sm:w-44">
                <SelectValue>{statusFilter === "ALL" ? "All statuses" : LEAD_STATUS_LABELS[statusFilter as LeadRow["status"]]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                {LEAD_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>{LEAD_STATUS_LABELS[status]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="mb-3 text-xs text-muted-foreground" aria-live="polite">
            {filtered.length} of {leads.length} leads
          </p>
          {filtered.length === 0 ? (
            <EmptyState icon={Search} title="No leads found" description="Try a different search or status filter." />
          ) : (
            <div className="max-w-[calc(100vw-2rem)] overflow-x-auto rounded-xl border border-border bg-card md:max-w-[calc(100vw-20rem)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business</TableHead>
                    <TableHead>Phone / Email</TableHead>
                    <TableHead>Website</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Rating / Reviews</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Contacted</TableHead>
                    <TableHead><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <button type="button" className="block max-w-64 truncate text-left font-bold hover:underline" onClick={() => setEditor({ lead })}>
                          {lead.businessName}
                        </button>
                        {lead.city && <span className="block text-xs text-muted-foreground">{lead.city}</span>}
                        {lead.googleMapsUrl && (
                          <a href={lead.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:underline">Google Maps ↗</a>
                        )}
                      </TableCell>
                      <TableCell>
                        {lead.phone && <a className="block hover:underline" href={`tel:${lead.phone}`}>{lead.phone}</a>}
                        {lead.email && <a className="block text-xs text-muted-foreground hover:underline" href={`mailto:${lead.email}`}>{lead.email}</a>}
                        {!lead.phone && !lead.email && "—"}
                      </TableCell>
                      <TableCell>
                        {lead.website ? (
                          <a href={lead.website} target="_blank" rel="noopener noreferrer" className="block max-w-48 truncate hover:underline">
                            {new URL(lead.website).hostname} ↗
                          </a>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{lead.businessCategory ?? "—"}</TableCell>
                      <TableCell>
                        <span>{lead.googleRating === null ? "—" : `${lead.googleRating.toFixed(1)} / 5`}</span>
                        <span className="block text-xs text-muted-foreground">
                          {lead.googleReviewCount === null ? "— reviews" : `${lead.googleReviewCount.toLocaleString("en-US")} reviews`}
                        </span>
                      </TableCell>
                      <TableCell><LeadStatusControl lead={lead} /></TableCell>
                      <TableCell className="text-muted-foreground">
                        {lead.lastContactedAt ? dateFormatter.format(new Date(`${lead.lastContactedAt}T00:00:00Z`)) : "—"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label={`Actions for ${lead.businessName}`} />}>
                            <MoreVertical className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditor({ lead })}><Pencil className="h-4 w-4" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(lead)}><Trash2 className="h-4 w-4" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}
      {editor && <LeadFormDialog key={editor.lead?.id ?? "new"} lead={editor.lead} onClose={() => setEditor(null)} />}
      <ConfirmActionDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title={deleteTarget ? `Delete ${deleteTarget.businessName}?` : "Delete Lead"}
        description="This permanently removes this lead and its notes. This can't be undone."
        confirmLabel="Delete Lead"
        pendingLabel="Deleting..."
        onConfirm={async () => {
          if (!deleteTarget) return;
          const result = await deleteLead(deleteTarget.id);
          if (result.error) throw new Error(result.error);
          toast.success("Lead deleted.");
        }}
      />
    </div>
  );
}
