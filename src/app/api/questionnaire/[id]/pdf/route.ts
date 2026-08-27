import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { renderQuestionnairePdf } from "@/lib/questionnaire-pdf";
import { buildQuestionnairePdfData } from "@/lib/questionnaire-pdf-data";
import { slugify } from "@/lib/utils";

/**
 * Admin-only view/download of a submitted Design Questionnaire's PDF —
 * same pattern as /api/invoices/[id]/pdf: a real route (not a Server
 * Action) so proxy.ts's pathname matcher does protect it, but auth() is
 * still checked here too for the same defense-in-depth reason every
 * admin Server Action does (see src/lib/actions/clients.ts).
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const data = await buildQuestionnairePdfData(id);
  if (!data) {
    return NextResponse.json({ error: "Questionnaire not found or not yet submitted" }, { status: 404 });
  }

  const pdfBuffer = await renderQuestionnairePdf(data);

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${slugify(data.businessName)}-design-questionnaire.pdf"`,
    },
  });
}
