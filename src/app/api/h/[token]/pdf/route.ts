import { NextResponse } from "next/server";
import { findPublicHandoff } from "@/lib/services/public-handoff";
import { renderHandoffPdf } from "@/lib/handoff-pdf";
export const dynamic = "force-dynamic";
export async function GET(_request:Request,{params}:{params:Promise<{token:string}>}) { const {token}=await params; const found=await findPublicHandoff(token); if(!found) return NextResponse.json({error:"Unavailable"},{status:404}); const pdf=await renderHandoffPdf(found.snapshot,found.packet.snapshotHash!,found.packet.acceptance); return new NextResponse(new Uint8Array(pdf),{headers:{"Content-Type":"application/pdf","Content-Disposition":`inline; filename="webdashy-handoff-v${found.snapshot.packet.version}.pdf"`,"X-Robots-Tag":"noindex, nofollow","Cache-Control":"private, no-store"}}); }
