"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

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
