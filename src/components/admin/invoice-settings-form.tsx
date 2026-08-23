"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { updateAppSettings, type SettingsActionState } from "@/lib/actions/settings";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save Settings"}
    </Button>
  );
}

export function InvoiceSettingsForm({
  showPricingInPortal,
  invoiceFromName,
  invoiceFromAddress,
  invoicePaymentInstructions,
  invoiceTerms,
}: {
  showPricingInPortal: boolean;
  invoiceFromName: string;
  invoiceFromAddress: string;
  invoicePaymentInstructions: string;
  invoiceTerms: string;
}) {
  const [state, formAction] = useActionState<SettingsActionState, FormData>(updateAppSettings, {});
  const [pricingOn, setPricingOn] = useState(showPricingInPortal);

  return (
    <form action={formAction} className="space-y-6 rounded-xl border border-border bg-card p-5">
      {state?.error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}
      {state?.success ? (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {state.success}
        </div>
      ) : null}

      <div>
        <h2 className="text-sm font-semibold text-foreground">Client Portal Pricing</h2>
        <div className="mt-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground">Show pricing on client portals</p>
            <p className="mt-1 max-w-md text-xs text-muted-foreground">
              When off, plan cards on the client portal show what&apos;s included but hide dollar
              amounts — clients pick a tier, you follow up with an exact quote before invoicing.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={pricingOn}
            onClick={() => setPricingOn((v) => !v)}
            className={cn(
              "relative h-6 w-10 shrink-0 rounded-full transition-colors",
              pricingOn ? "bg-primary" : "bg-border"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                pricingOn ? "translate-x-[18px]" : "translate-x-0.5"
              )}
            />
          </button>
          <input type="hidden" name="showPricingInPortal" value={pricingOn ? "on" : "off"} />
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <h2 className="text-sm font-semibold text-foreground">Invoice Details</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Used on every invoice PDF and email sent to clients.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="invoiceFromName">Business name</Label>
            <Input
              id="invoiceFromName"
              name="invoiceFromName"
              placeholder="WebDashy — Garrett Morgan"
              defaultValue={invoiceFromName}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invoiceTerms">Payment terms</Label>
            <Input
              id="invoiceTerms"
              name="invoiceTerms"
              placeholder="Net 14"
              defaultValue={invoiceTerms}
            />
          </div>
        </div>

        <div className="mt-4 space-y-1.5">
          <Label htmlFor="invoiceFromAddress">Business address</Label>
          <Textarea
            id="invoiceFromAddress"
            name="invoiceFromAddress"
            rows={2}
            placeholder="123 Studio Lane, Suite 4, Asheville, NC 28801"
            defaultValue={invoiceFromAddress}
          />
        </div>

        <div className="mt-4 space-y-1.5">
          <Label htmlFor="invoicePaymentInstructions">Payment instructions</Label>
          <Textarea
            id="invoicePaymentInstructions"
            name="invoicePaymentInstructions"
            rows={2}
            placeholder="Bank transfer or Zelle to garrett@webdashy.com. Reference the invoice number in the memo."
            defaultValue={invoicePaymentInstructions}
          />
        </div>
      </div>

      <SubmitButton />
    </form>
  );
}
