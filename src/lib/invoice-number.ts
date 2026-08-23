import { db } from "@/lib/db";

/**
 * Generates the next sequential invoice number for the current year, e.g.
 * `INV-2026-0001`. Counts existing invoices for the year rather than
 * keeping a separate counter row — fine at this volume (a single-admin
 * tool), and self-correcting if an invoice is ever deleted.
 *
 * Single-admin app, so a true race is unlikely, but createInvoice still
 * retries once on a unique-constraint conflict rather than assuming this
 * is airtight.
 */
export async function nextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await db.invoice.count({
    where: { invoiceNumber: { startsWith: `INV-${year}-` } },
  });
  const sequence = String(count + 1).padStart(4, "0");
  return `INV-${year}-${sequence}`;
}
