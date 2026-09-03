import { NextResponse } from "next/server";
import { renderHandoffArchive } from "@/lib/handoff-archive";
import { findPublicHandoff } from "@/lib/services/public-handoff";
export const dynamic="force-dynamic";
export async function GET(_request:Request,{params}:{params:Promise<{token:string}>}) {const {token}=await params;const found=await findPublicHandoff(token);if(!found)return NextResponse.json({error:"Unavailable"},{status:404});const zip=await renderHandoffArchive(found.snapshot,found.packet.snapshotHash!,found.packet.acceptance);return new NextResponse(new Uint8Array(zip.buffer),{headers:{"Content-Type":"application/zip","Content-Disposition":`attachment; filename="${zip.filename}"`,"X-Robots-Tag":"noindex, nofollow","Cache-Control":"private, no-store"}});}
