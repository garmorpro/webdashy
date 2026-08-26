"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateAppSettings, type SettingsActionState } from "@/lib/actions/settings";

const FIELD_LABEL = "mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-muted-foreground";
const FIELD_INPUT = "h-10 rounded-xl border-0 bg-secondary px-3.5 text-sm font-semibold shadow-none";
const FIELD_TEXTAREA = "rounded-xl border-0 bg-secondary px-3.5 py-2.5 text-sm font-semibold shadow-none";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Saving..." : "Save Settings"}
    </Button>
  );
}

export function InvoiceSettingsForm({
  invoiceFromName,
  invoiceFromAddress,
  invoicePaymentInstructions,
  invoiceTerms,
}: {
  invoiceFromName: string;
  invoiceFromAddress: string;
  invoicePaymentInstructions: string;
  invoiceTerms: string;
}) {
  const [state, formAction] = useActionState<SettingsActionState, FormData>(updateAppSettings, {});

  return (
    <form action={formAction} className="rounded-xl bg-card p-6">
      <h2 className="text-sm font-extrabold text-foreground">Invoice Details</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Used on every invoice PDF and email sent to clients.
      </p>

      {state?.error ? (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}
      {state?.success ? (
        <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {state.success}
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="invoiceFromName" className={FIELD_LABEL}>
            Business name
          </Label>
          <Input
            id="invoiceFromName"
            name="invoiceFromName"
            placeholder="WebDashy — Garrett Morgan"
            defaultValue={invoiceFromName}
            className={FIELD_INPUT}
          />
        </div>
        <div>
          <Label htmlFor="invoiceTerms" className={FIELD_LABEL}>
            Payment terms
          </Label>
          <Input
            id="invoiceTerms"
            name="invoiceTerms"
            placeholder="Net 14"
            defaultValue={invoiceTerms}
            className={FIELD_INPUT}
          />
        </div>
      </div>

      <div className="mt-4">
        <Label htmlFor="invoiceFromAddress" className={FIELD_LABEL}>
          Business address
        </Label>
        <Textarea
          id="invoiceFromAddress"
          name="invoiceFromAddress"
          rows={2}
          placeholder="123 Studio Lane, Suite 4, Asheville, NC 28801"
          defaultValue={invoiceFromAddress}
          className={FIELD_TEXTAREA}
        />
      </div>

      <div className="mt-4">
        <Label htmlFor="invoicePaymentInstructions" className={FIELD_LABEL}>
          Payment instructions
        </Label>
        <Textarea
          id="invoicePaymentInstructions"
          name="invoicePaymentInstructions"
          rows={2}
          placeholder="Bank transfer or Zelle to garrett@webdashy.com. Reference the invoice number in the memo."
          defaultValue={invoicePaymentInstructions}
          className={FIELD_TEXTAREA}
        />
      </div>

      <div className="mt-5">
        <SubmitButton />
      </div>
    </form>
  );
}
