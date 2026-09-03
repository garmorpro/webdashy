"use server";

import { revalidatePath } from "next/cache";
import { acceptPublicHandoff } from "@/lib/services/public-handoff";

export type PublicHandoffState = { error?: string; accepted?: boolean };

export async function acceptHandoffAction(token: string, _state: PublicHandoffState, form: FormData): Promise<PublicHandoffState> {
  try {
    await acceptPublicHandoff(token, {
      typedName: String(form.get("typedName") ?? ""), signerTitle: String(form.get("signerTitle") ?? ""),
      authorityConfirmed: form.get("authorityConfirmed") === "on", acknowledgmentConfirmed: form.get("acknowledgmentConfirmed") === "on",
      submissionKey: String(form.get("submissionKey") ?? ""),
    });
    revalidatePath(`/h/${token}`);
    return { accepted: true };
  } catch (error) { return { error: error instanceof Error ? error.message : "Acceptance could not be recorded." }; }
}
