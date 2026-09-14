"use client";

import { useActionState } from "react";
import { toast } from "sonner";
import type { Lead, LeadStatus } from "@prisma/client";
import { createLead, updateLead, type LeadActionState } from "@/lib/actions/leads";
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from "@/lib/lead-status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Prisma Decimal must become a plain number before crossing into the browser.
// Dates are ISO strings; lastContactedAt is a date-only YYYY-MM-DD value.
export type LeadRow = Omit<Lead, "googleRating" | "lastContactedAt" | "createdAt" | "updatedAt"> & {
  googleRating: number | null;
  lastContactedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const fields = [
  { name: "businessName", label: "Business name", required: true },
  { name: "phone", label: "Phone", type: "tel" },
  { name: "email", label: "Email", type: "email" },
  { name: "website", label: "Website", inputMode: "url", placeholder: "example.com" },
  { name: "address", label: "Address" },
  { name: "city", label: "City" },
  { name: "googleMapsUrl", label: "Google Maps URL", inputMode: "url" },
  { name: "businessCategory", label: "Business category" },
  { name: "googleRating", label: "Google rating", type: "number", min: 0, max: 5, step: 0.1 },
  { name: "googleReviewCount", label: "Google review count", type: "number", min: 0, max: 2147483647, step: 1 },
  { name: "lastContactedAt", label: "Last contacted date", type: "date" },
] satisfies Array<{
  name: keyof LeadRow;
  label: string;
  required?: boolean;
  type?: string;
  inputMode?: "url";
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
}>;

export function LeadFormDialog({
  lead,
  onClose,
}: {
  lead: LeadRow | null;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState<LeadActionState, FormData>(
    async (previous, formData) => {
      try {
        const result = lead
          ? await updateLead(lead.id, previous, formData)
          : await createLead(previous, formData);
        if (result.success) {
          toast.success(lead ? "Lead updated." : "Lead added.");
          onClose();
        }
        return result;
      } catch {
        return { error: "Couldn't save this lead. Please try again." };
      }
    },
    {},
  );

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !pending) onClose(); }}>
      <DialogContent className="sm:max-w-2xl" showCloseButton={!pending}>
        <DialogHeader>
          <DialogTitle>{lead ? "Edit Lead" : "Add Lead"}</DialogTitle>
          <DialogDescription>
            Save a business prospect. Only business name and status are required.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-5">
          {state.error && (
            <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {state.error}
            </p>
          )}
          <fieldset disabled={pending} className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.map(({ name, label, ...props }) => (
              <div key={name} className="min-w-0 space-y-1.5">
                <Label htmlFor={`lead-${name}`}>{label}</Label>
                <Input
                  id={`lead-${name}`}
                  name={name}
                  defaultValue={lead?.[name] ?? ""}
                  {...props}
                />
              </div>
            ))}
            <div className="space-y-1.5">
              <Label htmlFor="lead-status">Status</Label>
              <Select name="status" defaultValue={lead?.status ?? "NEW"} disabled={pending} required>
                <SelectTrigger id="lead-status" className="w-full">
                  <SelectValue>
                    {(value) => LEAD_STATUS_LABELS[value as LeadStatus] ?? "Choose status"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {LEAD_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>{LEAD_STATUS_LABELS[status]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="lead-notes">Notes</Label>
              <Textarea id="lead-notes" name="notes" rows={4} defaultValue={lead?.notes ?? ""} />
            </div>
          </fieldset>
          <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" disabled={pending} onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : lead ? "Save Changes" : "Add Lead"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
