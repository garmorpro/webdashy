import "server-only";

import { db } from "@/lib/db";
import { hashSnapshot } from "./handoff-packet-state.mjs";
import type { HandoffSnapshot } from "./public-handoff";

export async function findAdminHandoff(packetId:string) {
  const packet=await db.handoffPacket.findUnique({where:{id:packetId},include:{acceptance:true}});
  if(!packet?.snapshot||!packet.snapshotHash||packet.status==="DRAFT"||hashSnapshot(packet.snapshot)!==packet.snapshotHash) return null;
  return {packet,snapshot:packet.snapshot as unknown as HandoffSnapshot};
}
