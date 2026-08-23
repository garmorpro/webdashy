"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { FileText, Plus, X, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SectionLocked } from "@/components/admin/section-locked";
import { createAndSendInvoice, markInvoicePaid, resendInvoiceEmail } from "@/lib/actions/invoices";
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_STYLES } from "@/lib/invoice-status";
import type { Invoice, InvoiceLineItem } from "@prisma/client";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Sending..." : "Create & Send Invoice"}
    </Button>
  );
}

function money(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function NewInvoiceForm({ clientId, portalId }: { clientId: string; portalId: string }) {
  const action = createAndSendInvoice.bind(null, clientId, portalId);
  const [state, formAction] = useActionState(action, {});
  const [items, setItems] = useState([{ description: "", amount: "" }]);

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-primary bg-card p-5 shadow-[0_0_0_3px_rgba(164,255,79,0.18)]">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <FileText className="h-4 w-4 text-muted-foreground" />
        Invoice
      </h2>

      {state?.error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      <div className="space-y-2">
        <Label>Line items</Label>
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              name="lineItemDescription"
              placeholder="Standard Plan — website build"
              value={item.description}
              onChange={(e) =>
                setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, description: e.target.value } : it)))
              }
              className="flex-1"
            />
            <Input
              name="lineItemAmount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={item.amount}
              onChange={(e) =>
                setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, amount: e.target.value } : it)))
              }
              className="w-32"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              disabled={items.length === 1}
              onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
              aria-label="Remove line item"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setItems((prev) => [...prev, { description: "", amount: "" }])}
        >
          <Plus className="h-3.5 w-3.5" />
          Add line item
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="inv-due">Due date</Label>
          <Input id="inv-due" name="dueDate" type="date" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="inv-tax">Tax</Label>
          <Input id="inv-tax" name="taxAmount" type="number" min="0" step="0.01" defaultValue="0" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="inv-notes">Notes to client (optional)</Label>
        <Textarea id="inv-notes" name="notes" rows={2} />
      </div>

      <SubmitButton />
    </form>
  );
}

function ExistingInvoice({
  invoice,
  clientId,
}: {
  invoice: Invoice & { lineItems: InvoiceLineItem[] };
  clientId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const subtotal = invoice.lineItems.reduce((sum, li) => sum + Number(li.amount), 0);
  const total = subtotal + Number(invoice.taxAmount);
  const dateFmt = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

  function handlePaid() {
    startTransition(async () => {
      try {
        await markInvoicePaid(invoice.id, clientId);
        toast.success("Invoice marked paid.");
      } catch {
        toast.error("Couldn't update the invoice. Please try again.");
      }
    });
  }

  function handleResend() {
    startTransition(async () => {
      try {
        await resendInvoiceEmail(invoice.id, clientId);
        toast.success("Invoice resent.");
      } catch {
        toast.error("Couldn't resend the invoice. Please try again.");
      }
    });
  }

  const isPaid = invoice.status === "PAID";

  return (
    <div
      className={`rounded-xl border bg-card p-5 ${isPaid ? "border-border" : "border-primary shadow-[0_0_0_3px_rgba(164,255,79,0.18)]"}`}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <FileText className="h-4 w-4 text-muted-foreground" />
          Invoice
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className={INVOICE_STATUS_STYLES[invoice.status]}>
            {INVOICE_STATUS_LABELS[invoice.status]}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<a href={`/api/invoices/${invoice.id}/pdf`} target="_blank" rel="noopener noreferrer" />}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View PDF
          </Button>
        </div>
      </div>

      {isPaid ? (
        <p className="mt-3 text-sm text-foreground">
          <b>{money(total)}</b>{" "}
          <span className="text-muted-foreground">
            paid {invoice.paidAt ? dateFmt.format(invoice.paidAt) : ""}
          </span>
        </p>
      ) : (
        <>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-2 font-semibold">Description</th>
                <th className="pb-2 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((li) => (
                <tr key={li.id} className="border-b border-border">
                  <td className="py-2 text-foreground">{li.description}</td>
                  <td className="py-2 text-right tabular-nums text-muted-foreground">
                    {money(Number(li.amount))}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-border font-bold">
                <td className="pt-2 text-foreground">Total due</td>
                <td className="pt-2 text-right tabular-nums text-foreground">{money(total)}</td>
              </tr>
            </tbody>
          </table>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button disabled={isPending} onClick={handlePaid}>
              Mark as Paid
            </Button>
            <Button variant="outline" disabled={isPending} onClick={handleResend}>
              Resend to Client
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export function InvoiceSection({
  clientId,
  portalId,
  invoice,
  locked,
}: {
  clientId: string;
  portalId: string;
  invoice: (Invoice & { lineItems: InvoiceLineItem[] }) | null;
  locked: boolean;
}) {
  if (locked) {
    return (
      <SectionLocked
        title="Invoice"
        icon={FileText}
        reason="Available once project requirements are saved."
      />
    );
  }

  if (invoice) return <ExistingInvoice invoice={invoice} clientId={clientId} />;

  return <NewInvoiceForm clientId={clientId} portalId={portalId} />;
}
