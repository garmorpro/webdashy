"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { beginLaunchHandoff, generateHandoffPacket, issueHandoffPacket, publishHandoffRevision, saveHandoffDraft, supersedeHandoffPacket } from "@/lib/services/handoff-packets";
import { HANDOFF_SECTION_FIELDS } from "@/lib/services/handoff-draft";

export type HandoffActionState = { error?: string; success?: string };
async function admin() { const session = await auth(); if (!session?.user?.id) throw new Error("You must be signed in."); return session.user.id; }
async function result(work: (userId: string) => Promise<unknown>, path: string, success: string): Promise<HandoffActionState> {
  try { await work(await admin()); revalidatePath(path); return { success }; } catch (error) { console.error("Handoff action failed:", error); return { error: error instanceof Error ? error.message : "The handoff action failed." }; }
}
export async function publishHandoffTemplateAction(revisionId: string, state: HandoffActionState, form: FormData) { void state; void form; return result((id) => publishHandoffRevision(revisionId, id), "/settings", "Template revision published."); }
export async function generateHandoffPacketAction(portalId: string, clientId: string, state: HandoffActionState, form: FormData) { void state; void form; return result((id) => generateHandoffPacket(portalId, clientId, id), `/clients/${clientId}`, "Handoff packet draft generated."); }
export async function beginLaunchHandoffAction(portalId: string, clientId: string, state: HandoffActionState, form: FormData) { void state; void form; return result((id) => beginLaunchHandoff(portalId, clientId, id), `/clients/${clientId}`, "Launch & Handoff started."); }
export async function saveHandoffPacketAction(packetId: string, portalId: string, clientId: string, _state: HandoffActionState, form: FormData) {
  return result(async (id) => {
    const edits: Record<string, unknown> = {};
    for (const [section, fields] of Object.entries(HANDOFF_SECTION_FIELDS)) edits[section] = Object.fromEntries(fields.filter((field) => form.has(`${section}.${field}`)).map((field) => [field, String(form.get(`${section}.${field}`) ?? "")]));
    const rows = JSON.parse(String(form.get("thirdPartyServices") ?? "[]"));
    edits.thirdPartyServices = Array.isArray(rows) ? rows.map((row) => ({
      sourceIndex: Number.isInteger(row?.sourceIndex) ? row.sourceIndex : -1,
      service: typeof row?.service === "string" ? row.service : "", purpose: typeof row?.purpose === "string" ? row.purpose : "",
      accountOwner: typeof row?.accountOwner === "string" ? row.accountOwner : "", billingOwner: typeof row?.billingOwner === "string" ? row.billingOwner : "",
      dataHandled: typeof row?.dataHandled === "string" ? row.dataHandled : "",
    })) : rows;
    const checklist = JSON.parse(String(form.get("checklist") ?? "[]"));
    await saveHandoffDraft(packetId, portalId, clientId, id, { recipientName: String(form.get("recipientName") ?? ""), recipientEmail: String(form.get("recipientEmail") ?? ""), edits, checklist });
  }, `/clients/${clientId}`, "Draft saved.");
}
export async function issueHandoffPacketAction(packetId: string, portalId: string, clientId: string, state: HandoffActionState, form: FormData) { void state; void form; return result((id) => issueHandoffPacket(packetId, portalId, clientId, id), `/clients/${clientId}`, "Packet issued. The one-time token was secured for future delivery."); }
export async function supersedeHandoffPacketAction(packetId: string, portalId: string, clientId: string, state: HandoffActionState, form: FormData) { void state; void form; return result((id) => supersedeHandoffPacket(packetId, portalId, clientId, id), `/clients/${clientId}`, "Corrected packet draft created."); }
