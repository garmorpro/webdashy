"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientForm, type ClientFormValues } from "@/components/admin/client-form";
import type { ClientActionState } from "@/lib/actions/clients";

/**
 * Wraps ClientForm with the same collapsed-summary / expand-to-edit
 * pattern as RequirementsSection — a client that already exists doesn't
 * need its full edit form taking up permanent screen real estate, and
 * this keeps the client detail page's header (name/contact/email/phone/
 * industry) scannable at a glance instead of buried in input fields.
 */
export function ClientContactSection({
  action,
  cancelHref,
  values,
}: {
  action: (state: ClientActionState, formData: FormData) => Promise<ClientActionState>;
  cancelHref: string;
  values: ClientFormValues;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <ClientForm
        action={action}
        submitLabel="Save Changes"
        // Cancel navigates back to this same page rather than away to the
        // clients list — ClientForm's cancelHref is also used on /clients/new,
        // where "away" is correct, so this is a context-specific override.
        cancelHref={cancelHref}
        defaultValues={values}
      />
    );
  }

  return (
    <div className="max-w-2xl rounded-2xl bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-extrabold text-foreground">Contact</h2>
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Contact
          </div>
          <div className="mt-1 break-words text-sm font-bold text-foreground">
            {values.contactName}
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Email
          </div>
          <div className="mt-1 break-words text-sm font-bold text-foreground">{values.email}</div>
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Phone
          </div>
          <div className="mt-1 break-words text-sm font-bold text-foreground">
            {values.phone || "—"}
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Industry
          </div>
          <div className="mt-1 break-words text-sm font-bold text-foreground">
            {values.industry || "—"}
          </div>
        </div>
      </div>
    </div>
  );
}
