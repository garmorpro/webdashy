import { db } from "@/lib/db";
import { getAppSettings } from "@/lib/settings";
import type { InvoicePdfData } from "@/lib/invoice-pdf";

/**
 * Assembles the data an invoice's PDF is rendered from — shared between the
 * action that emails it (src/lib/actions/invoices.ts) and the admin-facing
 * view/download route (src/app/api/invoices/[id]/pdf/route.ts), so both
 * always render byte-identical PDFs from the same source.
 */
export async function buildInvoicePdfData(invoiceId: string): Promise<InvoicePdfData | null> {
  const [invoice, settings] = await Promise.all([
    db.invoice.findUnique({
      where: { id: invoiceId },
      include: { client: true, lineItems: { orderBy: { displayOrder: "asc" } } },
    }),
    getAppSettings(),
  ]);
  if (!invoice) return null;

  return {
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    terms: settings.invoiceTerms,
    fromName: settings.invoiceFromName || "WebDashy",
    fromAddress: settings.invoiceFromAddress,
    billToName: invoice.client.businessName,
    billToContactName: invoice.client.contactName,
    billToEmail: invoice.client.email,
    lineItems: invoice.lineItems.map((li) => ({
      description: li.description,
      amount: Number(li.amount),
    })),
    taxAmount: Number(invoice.taxAmount),
    paymentInstructions: settings.invoicePaymentInstructions,
    notes: invoice.notes,
  };
}
