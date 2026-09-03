import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { renderHandoffArchive } from "@/lib/handoff-archive";
import { findAdminHandoff } from "@/lib/services/handoff-download";
export const dynamic="force-dynamic";
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}) { if(!(await auth())?.user?.id)return NextResponse.json({error:"Unauthorized"},{status:401});const {id}=await params;const found=await findAdminHandoff(id);if(!found)return NextResponse.json({error:"Not found"},{status:404});const zip=await renderHandoffArchive(found.snapshot,found.packet.snapshotHash!,found.packet.acceptance);return new NextResponse(new Uint8Array(zip.buffer),{headers:{"Content-Type":"application/zip","Content-Disposition":`attachment; filename="${zip.filename}"`,"Cache-Control":"private, no-store"}});}
