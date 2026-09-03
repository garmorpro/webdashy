import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { renderHandoffDocumentPdf } from "@/lib/handoff-pdf";
import { findDraftHandoffPreview } from "@/lib/services/handoff-preview";

export const dynamic = "force-dynamic";
export async function GET(request:Request, { params }: { params:Promise<{clientId:string;documentKey:string}> }) {
  if (!(await auth())?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [{ clientId, documentKey }, revisionId] = await Promise.all([params, Promise.resolve(new URL(request.url).searchParams.get("revisionId"))]);
  if (!revisionId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const preview = await findDraftHandoffPreview(clientId, revisionId, [documentKey]);
  if (preview?.revision === 3 && documentKey !== "client_agreement") return NextResponse.json({ error: "Not found" }, { status: 404 });
  const documentModule = preview?.snapshot.policyModules?.find((item)=>item.key===documentKey);
  if (!preview || !documentModule) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const pdf = await renderHandoffDocumentPdf(preview.snapshot, documentModule, "PREVIEW — NOT ISSUED");
  const disposition = new URL(request.url).searchParams.get("download") === "1" ? "attachment" : "inline";
  return new NextResponse(new Uint8Array(pdf), { headers: { "Content-Type":"application/pdf", "Content-Disposition":`${disposition}; filename="revision-${preview.revision}-preview-${documentKey}.pdf"`, "Cache-Control":"private, no-store" } });
}
