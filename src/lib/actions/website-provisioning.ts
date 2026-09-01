"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { provisionWebsite } from "@/lib/services/website-provisioning";

export type WebsiteProvisioningActionState = { error?: string; success?: string };

export async function provisionWebsiteAction(
  portalId: string,
  clientId: string,
  buildSetupId: string,
  previous: WebsiteProvisioningActionState
): Promise<WebsiteProvisioningActionState> {
  void previous;
  if (!(await auth())?.user?.id) return { error: "You must be signed in." };
  const result = await provisionWebsite({ portalId, clientId, buildSetupId });
  revalidatePath(`/clients/${clientId}`);
  return result.ok ? { success: result.message } : { error: result.message };
}
