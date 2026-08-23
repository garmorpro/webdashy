import type { InvoiceStatus } from "@prisma/client";

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  PAID: "Paid",
};

export const INVOICE_STATUS_STYLES: Record<InvoiceStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  SENT: "bg-blue-50 text-blue-700",
  PAID: "bg-emerald-50 text-emerald-700",
};
