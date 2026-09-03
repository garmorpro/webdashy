import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { renderHandoffArchive } from "@/lib/handoff-archive";
import { findDraftHandoffPreview } from "@/lib/services/handoff-preview";

export const dynamic = "force-dynamic";
export async function GET(request:Request, { params }: { params:Promise<{clientId:string}> }) {
  if (!(await auth())?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { clientId } = await params;
  const query = new URL(request.url).searchParams;
  const revisionId = query.get("revisionId");
  const selected = (query.get("documents") ?? "").split(",").map(decodeURIComponent).filter(Boolean);
  if (!revisionId || !selected.length) return NextResponse.json({ error: "Select at least one document." }, { status: 400 });
  const preview = await findDraftHandoffPreview(clientId, revisionId, selected);
  if (!preview) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const archive = await renderHandoffArchive(preview.snapshot, "PREVIEW — NOT ISSUED");
  return new NextResponse(new Uint8Array(archive.buffer), { headers: { "Content-Type":"application/zip", "Content-Disposition":`attachment; filename="WebDashy-Revision-${preview.revision}-Preview.zip"`, "Cache-Control":"private, no-store" } });
}
