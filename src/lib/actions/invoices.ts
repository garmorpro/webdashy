"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { nextInvoiceNumber } from "@/lib/invoice-number";
import { renderInvoicePdf } from "@/lib/invoice-pdf";
import { buildInvoicePdfData } from "@/lib/invoice-pdf-data";
import { sendInvoiceEmail } from "@/lib/mail";
import { pipelineStepIndex } from "@/lib/client-status";
import { isWorkflowStageAtLeast } from "@/lib/workflow";
import { synchronizeLaunchHandoffReadiness } from "@/lib/project-completion";
import { advanceClientWorkflow } from "@/lib/services/client-workflow";

export type InvoiceActionState = { error?: string };

async function requireAdmin(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ? null : "You must be signed in.";
}

function readLineItems(formData: FormData): { description: string; amount: number }[] {
  const descriptions = formData.getAll("lineItemDescription").map(String);
  const amounts = formData.getAll("lineItemAmount").map(String);
  const items: { description: string; amount: number }[] = [];
  for (let i = 0; i < descriptions.length; i++) {
    const description = descriptions[i].trim();
    const amount = Number(amounts[i]);
    if (!description || Number.isNaN(amount) || amount < 0) continue;
    items.push({ description, amount });
  }
  return items;
}

const dateFmt = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });
const moneyFmt = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Creates the invoice and immediately emails it to the client (with the
 * PDF attached) in one step — matches the flowchart's single "Generate
 * Invoice" node rather than exposing a separate draft/send action.
 */
export async function createAndSendInvoice(
  clientId: string,
  portalId: string,
  _prevState: InvoiceActionState,
  formData: FormData
): Promise<InvoiceActionState> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };

  const lineItems = readLineItems(formData);
  if (lineItems.length === 0) {
    return { error: "Add at least one line item with a description and amount." };
  }

  const taxAmount = Number(formData.get("taxAmount") ?? 0) || 0;
  const dueDateRaw = String(formData.get("dueDate") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const client = await db.client.findFirst({
    where: { id: clientId, portals: { some: { id: portalId } } },
  });
  if (!client) return { error: "Client project not found." };
  if (!isWorkflowStageAtLeast(client.workflowStage, "REVISIONS_APPROVED")) {
    return { error: "An invoice can only be created after the client approves revisions." };
  }

  const invoiceNumber = await nextInvoiceNumber();

  let invoiceId: string;
  try {
    const invoice = await db.invoice.create({
      data: {
        invoiceNumber,
        clientId,
        portalId,
        status: "SENT",
        dueDate: dueDateRaw ? new Date(dueDateRaw) : null,
        taxAmount,
        notes,
        sentAt: new Date(),
        lineItems: {
          create: lineItems.map((item, i) => ({
            description: item.description,
            amount: item.amount,
            displayOrder: i,
          })),
        },
      },
    });
    invoiceId = invoice.id;
  } catch (err) {
    console.error("createAndSendInvoice failed:", err);
    return { error: "Something went wrong creating the invoice. Please try again." };
  }

  const pdfData = await buildInvoicePdfData(invoiceId);
  if (pdfData) {
    try {
      const pdfBuffer = await renderInvoicePdf(pdfData);
      const total = pdfData.lineItems.reduce((sum, i) => sum + i.amount, 0) + pdfData.taxAmount;
      await sendInvoiceEmail({
        to: client.email,
        contactName: client.contactName,
        businessName: client.businessName,
        invoiceNumber,
        totalDue: moneyFmt(total),
        dueDateStr: pdfData.dueDate ? dateFmt.format(pdfData.dueDate) : "—",
        terms: pdfData.terms,
        paymentInstructions: pdfData.paymentInstructions,
        pdfBuffer,
      });
    } catch (err) {
      console.error("Invoice created but email failed to send:", err);
      // The invoice record is real either way — surface this so the admin
      // knows to resend rather than assuming the client has it.
      return { error: "Invoice created, but the email couldn't be sent. Use Resend to try again." };
    }
  }

  if (pipelineStepIndex("INVOICE_SENT") > pipelineStepIndex(client.status)) {
    await db.client.update({ where: { id: clientId }, data: { status: "INVOICE_SENT" } });
  }
  await advanceClientWorkflow(clientId, "INVOICE");

  revalidatePath(`/clients/${clientId}`);
  return {};
}

export async function resendInvoiceEmail(invoiceId: string, clientId: string) {
  const authError = await requireAdmin();
  if (authError) throw new Error(authError);

  const [invoice, client, pdfData] = await Promise.all([
    db.invoice.findUnique({ where: { id: invoiceId } }),
    db.client.findUnique({ where: { id: clientId } }),
    buildInvoicePdfData(invoiceId),
  ]);
  if (!invoice || !client || !pdfData) throw new Error("Invoice not found.");

  const pdfBuffer = await renderInvoicePdf(pdfData);
  const total = pdfData.lineItems.reduce((sum, i) => sum + i.amount, 0) + pdfData.taxAmount;
  await sendInvoiceEmail({
    to: client.email,
    contactName: client.contactName,
    businessName: client.businessName,
    invoiceNumber: invoice.invoiceNumber,
    totalDue: moneyFmt(total),
    dueDateStr: pdfData.dueDate ? dateFmt.format(pdfData.dueDate) : "—",
    terms: pdfData.terms,
    paymentInstructions: pdfData.paymentInstructions,
    pdfBuffer,
  });

  await db.invoice.update({ where: { id: invoiceId }, data: { sentAt: new Date() } });
  revalidatePath(`/clients/${clientId}`);
}

export async function markInvoicePaid(invoiceId: string, clientId: string) {
  const authError = await requireAdmin();
  if (authError) throw new Error(authError);

  const existing = await db.invoice.findFirst({ where: { id: invoiceId, clientId } });
  if (!existing) throw new Error("Invoice not found.");

  const invoice = await db.invoice.update({
    where: { id: invoiceId },
    data: { status: "PAID", paidAt: new Date() },
  });

  if (invoice.portalId) {
    await synchronizeLaunchHandoffReadiness(clientId, invoice.portalId);
  }

  revalidatePath(`/clients/${clientId}`);
}
