"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CLIENT_STATUSES, CLIENT_STATUS_LABELS } from "@/lib/client-status";
import type { ClientActionState } from "@/lib/actions/clients";
import type { ClientStatus } from "@prisma/client";

export type ClientFormValues = {
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  industry: string;
  status: ClientStatus;
  leadSource: string;
  estimatedValue: string;
  notes: string;
};

const emptyValues: ClientFormValues = {
  businessName: "",
  contactName: "",
  email: "",
  phone: "",
  website: "",
  industry: "",
  status: "LEAD",
  leadSource: "",
  estimatedValue: "",
  notes: "",
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : label}
    </Button>
  );
}

export function ClientForm({
  action,
  defaultValues,
  submitLabel,
  cancelHref,
}: {
  action: (state: ClientActionState, formData: FormData) => Promise<ClientActionState>;
  defaultValues?: Partial<ClientFormValues>;
  submitLabel: string;
  cancelHref: string;
}) {
  const values = { ...emptyValues, ...defaultValues };
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      {state?.error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      <div className="space-y-4 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">Contact</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="businessName">Business Name</Label>
            <Input id="businessName" name="businessName" required defaultValue={values.businessName} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contactName">Contact Name</Label>
            <Input id="contactName" name="contactName" required defaultValue={values.contactName} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required defaultValue={values.email} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" type="tel" defaultValue={values.phone} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="website">Website</Label>
            <Input id="website" name="website" type="url" defaultValue={values.website} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="industry">Industry</Label>
            <Input id="industry" name="industry" defaultValue={values.industry} />
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">Lead Information</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="status">Lead Status</Label>
            <Select name="status" defaultValue={values.status}>
              <SelectTrigger id="status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CLIENT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {CLIENT_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="leadSource">Lead Source</Label>
            <Input id="leadSource" name="leadSource" defaultValue={values.leadSource} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="estimatedValue">Estimated Project Value</Label>
          <Input
            id="estimatedValue"
            name="estimatedValue"
            type="number"
            min="0"
            step="0.01"
            defaultValue={values.estimatedValue}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" rows={4} defaultValue={values.notes} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <SubmitButton label={submitLabel} />
        <Button variant="outline" render={<Link href={cancelHref} />}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
