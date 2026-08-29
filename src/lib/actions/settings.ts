"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { generateApiKey } from "@/lib/tokens";

export type SettingsActionState = { error?: string; success?: string };

async function requireAdmin(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ? null : "You must be signed in.";
}

const SETTINGS_ID = "singleton";

export async function updateAppSettings(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };

  const get = (key: string) => String(formData.get(key) ?? "").trim();

  // Deliberately does NOT touch showPricingInPortal — that field is owned
  // by togglePortalPricingVisibility below (see its comment) so saving
  // Invoice Details can never silently flip the pricing toggle off.
  try {
    await db.appSettings.upsert({
      where: { id: SETTINGS_ID },
      update: {
        invoiceFromName: get("invoiceFromName") || null,
        invoiceFromAddress: get("invoiceFromAddress") || null,
        invoicePaymentInstructions: get("invoicePaymentInstructions") || null,
        invoiceTerms: get("invoiceTerms") || "Net 14",
      },
      create: {
        id: SETTINGS_ID,
        invoiceFromName: get("invoiceFromName") || null,
        invoiceFromAddress: get("invoiceFromAddress") || null,
        invoicePaymentInstructions: get("invoicePaymentInstructions") || null,
        invoiceTerms: get("invoiceTerms") || "Net 14",
      },
    });
  } catch (err) {
    console.error("updateAppSettings failed:", err);
    return { error: "Something went wrong saving settings. Please try again." };
  }

  revalidatePath("/settings");
  revalidatePath("/p", "layout");
  return { success: "Settings saved." };
}

// Split out from updateAppSettings so the pricing toggle can live visually
// next to Plans (matching the Settings mockup's grouping) without a save
// there ever touching the separate Invoice Details fields — a full-form
// upsert of just the toggle's FormData would null those out.
export async function togglePortalPricingVisibility(showPricingInPortal: boolean) {
  const authError = await requireAdmin();
  if (authError) throw new Error(authError);

  await db.appSettings.upsert({
    where: { id: SETTINGS_ID },
    update: { showPricingInPortal },
    create: { id: SETTINGS_ID, showPricingInPortal },
  });

  revalidatePath("/settings");
  revalidatePath("/p", "layout");
}

// Split out from updateAppSettings for the same reason as
// togglePortalPricingVisibility above — this is edited from inside
// PlansBuilder (right above the One-Time Options section), and a full-form
// upsert from that save would null out Invoice Details.
export async function updateOneTimeFooterNote(text: string) {
  const authError = await requireAdmin();
  if (authError) throw new Error(authError);

  const oneTimeFooterNote = text.trim() || null;

  await db.appSettings.upsert({
    where: { id: SETTINGS_ID },
    update: { oneTimeFooterNote },
    create: { id: SETTINGS_ID, oneTimeFooterNote },
  });

  revalidatePath("/settings");
  revalidatePath("/p", "layout");
}

/**
 * Issues a fresh webhook API key (POST /api/leads — see that route),
 * immediately invalidating any previous one (only the hash is stored, so
 * there's no way to have two valid keys at once without a bigger schema
 * change nobody's asked for). Returns the raw key exactly this once — the
 * caller must show it to the admin now, since it can never be read back
 * after this call returns.
 */
export async function regenerateApiKey(): Promise<{ apiKey: string } | { error: string }> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };

  const { key, keyHash } = generateApiKey();
  const preview = key.slice(-4);

  await db.appSettings.upsert({
    where: { id: SETTINGS_ID },
    update: { apiKeyHash: keyHash, apiKeyPreview: preview, apiKeyCreatedAt: new Date() },
    create: { id: SETTINGS_ID, apiKeyHash: keyHash, apiKeyPreview: preview, apiKeyCreatedAt: new Date() },
  });

  revalidatePath("/settings");
  return { apiKey: key };
}

/** Revokes the current key without issuing a new one. */
export async function revokeApiKey() {
  const authError = await requireAdmin();
  if (authError) throw new Error(authError);

  await db.appSettings.upsert({
    where: { id: SETTINGS_ID },
    update: { apiKeyHash: null, apiKeyPreview: null, apiKeyCreatedAt: null },
    create: { id: SETTINGS_ID },
  });

  revalidatePath("/settings");
}
