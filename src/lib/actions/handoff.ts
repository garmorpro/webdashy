"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { beginLaunchHandoff, completeHandoff, generateHandoffPacket, issueHandoffPacket, publishHandoffRevision, saveFinalLiveUrl, saveHandoffDraft, sendHandoffPacket, supersedeHandoffPacket, supersedeHandoffPacketFromLatestTemplate } from "@/lib/services/handoff-packets";
import { HANDOFF_SECTION_FIELDS } from "@/lib/services/handoff-draft";
import { handoffSendActionState } from "@/lib/services/handoff-dry-run.mjs";

export type HandoffActionState = { error?: string; success?: string; completedSteps?: boolean[]; dryRun?: boolean; previewUrl?: string };
async function admin() { const session = await auth(); if (!session?.user?.id) throw new Error("You must be signed in."); return session.user.id; }
async function result(work: (userId: string) => Promise<unknown>, path: string, success: string): Promise<HandoffActionState> {
  try { await work(await admin()); revalidatePath(path); return { success }; } catch (error) { console.error("Handoff action failed:", error); return { error: error instanceof Error ? error.message : "The handoff action failed." }; }
}
export async function publishHandoffTemplateAction(revisionId: string, state: HandoffActionState, form: FormData) { void state; void form; return result((id) => publishHandoffRevision(revisionId, id), "/settings", "Template revision published."); }
export async function generateHandoffPacketAction(portalId: string, clientId: string, state: HandoffActionState, form: FormData) { void state; void form; return result((id) => generateHandoffPacket(portalId, clientId, id), `/clients/${clientId}`, "Handoff packet draft generated."); }
export async function beginLaunchHandoffAction(portalId: string, clientId: string, state: HandoffActionState, form: FormData) { void state; void form; return result((id) => beginLaunchHandoff(portalId, clientId, id), `/clients/${clientId}`, "Launch & Handoff started."); }
export async function saveHandoffPacketAction(packetId: string, portalId: string, clientId: string, _state: HandoffActionState, form: FormData) {
  try {
    const step = Number(form.get("wizardStep"));
    if (![1, 2].includes(step)) throw new Error("Invalid handoff wizard step.");
    const edits: Record<string, unknown> = {};
    if (step === 1) edits.selectedPolicyKeys = form.getAll("selectedPolicyKeys").map(String);
    if (step === 2) {
      for (const [section, fields] of Object.entries(HANDOFF_SECTION_FIELDS)) edits[section] = Object.fromEntries(fields.filter((field) => form.has(`${section}.${field}`)).map((field) => [field, String(form.get(`${section}.${field}`) ?? "")]));
      if (form.has("adminNote")) edits.adminNote = String(form.get("adminNote") ?? "");
    }
    const checklist = step === 2 ? JSON.parse(String(form.get("checklist") ?? "[]")) : undefined;
    const completedSteps = await saveHandoffDraft(packetId, portalId, clientId, await admin(), { step, edits, checklist });
    revalidatePath(`/clients/${clientId}`);
    return { success: "Draft saved.", completedSteps };
  } catch (error) { console.error("Handoff action failed:", error); return { error: error instanceof Error ? error.message : "The handoff action failed." }; }
}
export async function issueHandoffPacketAction(packetId: string, portalId: string, clientId: string, state: HandoffActionState, form: FormData) { void state; void form; return result((id) => issueHandoffPacket(packetId, portalId, clientId, id), `/clients/${clientId}`, "Packet issued as an immutable snapshot. Its secure token will be generated when sent."); }
export async function supersedeHandoffPacketAction(packetId: string, portalId: string, clientId: string, state: HandoffActionState, form: FormData) { void state; void form; return result((id) => supersedeHandoffPacket(packetId, portalId, clientId, id), `/clients/${clientId}`, "Corrected packet draft created."); }
export async function supersedeHandoffPacketFromLatestTemplateAction(packetId: string, portalId: string, clientId: string, state: HandoffActionState, form: FormData) { void state; void form; return result((id) => supersedeHandoffPacketFromLatestTemplate(packetId, portalId, clientId, id), `/clients/${clientId}`, "New packet draft created from the latest published template."); }
export async function sendHandoffPacketAction(packetId:string,portalId:string,clientId:string,_state:HandoffActionState,form:FormData):Promise<HandoffActionState>{try{const sent=await sendHandoffPacket(packetId,portalId,clientId,await admin(),String(form.get("idempotencyKey")??""));const actionState=handoffSendActionState(sent,"Handoff packet sent. Any earlier secure link is now invalid.");revalidatePath(`/clients/${clientId}`);return actionState;}catch(error){console.error("Handoff action failed:",error);return {error:error instanceof Error?error.message:"The handoff action failed."};}}
export async function saveFinalLiveUrlAction(packetId:string,portalId:string,clientId:string,_state:HandoffActionState,form:FormData){return result(id=>saveFinalLiveUrl(packetId,portalId,clientId,id,String(form.get("liveUrl")??"")),`/clients/${clientId}`,"Final live URL confirmed.");}
export async function completeHandoffAction(packetId:string,portalId:string,clientId:string,state:HandoffActionState,form:FormData){void state;void form;return result(id=>completeHandoff(packetId,portalId,clientId,id),`/clients/${clientId}`,"Handoff completed. Client Care is now active.");}
