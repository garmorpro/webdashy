"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { provisionNetlify, reconcileNetlify } from "@/lib/services/netlify-provisioning";

export type NetlifyActionState = { error?: string; success?: string };

export async function provisionNetlifyAction(portalId: string, clientId: string, websiteProvisioningId: string, previous: NetlifyActionState): Promise<NetlifyActionState> {
  void previous;
  if (!(await auth())?.user?.id) return { error: "You must be signed in." };
  const result = await provisionNetlify({ portalId, clientId, websiteProvisioningId });
  revalidatePath(`/clients/${clientId}`);
  return result.ok ? { success: result.message } : { error: result.message };
}

export async function reconcileNetlifyAction(portalId: string, clientId: string, netlifyProvisioningId: string, previous: NetlifyActionState): Promise<NetlifyActionState> {
  void previous;
  if (!(await auth())?.user?.id) return { error: "You must be signed in." };
  const result = await reconcileNetlify({ portalId, clientId, netlifyProvisioningId });
  revalidatePath(`/clients/${clientId}`);
  return result.ok ? { success: result.message } : { error: result.message };
}
