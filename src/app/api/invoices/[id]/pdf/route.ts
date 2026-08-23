import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { renderInvoicePdf } from "@/lib/invoice-pdf";
import { buildInvoicePdfData } from "@/lib/invoice-pdf-data";

/**
 * Admin-only view/download of an invoice's PDF (same document attached to
 * the client's email). This is a real route (not a Server Action), so
 * proxy.ts's pathname matcher does protect it — but check auth() here too,
 * for the same defense-in-depth reason every admin Server Action does (see
 * src/lib/actions/clients.ts).
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const data = await buildInvoicePdfData(id);
  if (!data) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const pdfBuffer = await renderInvoicePdf(data);

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="invoice-${data.invoiceNumber}.pdf"`,
    },
  });
}
