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
  const showPricingInPortal = formData.get("showPricingInPortal") === "on";

  try {
    await db.appSettings.upsert({
      where: { id: SETTINGS_ID },
      update: {
        showPricingInPortal,
        invoiceFromName: get("invoiceFromName") || null,
        invoiceFromAddress: get("invoiceFromAddress") || null,
        invoicePaymentInstructions: get("invoicePaymentInstructions") || null,
        invoiceTerms: get("invoiceTerms") || "Net 14",
      },
      create: {
        id: SETTINGS_ID,
        showPricingInPortal,
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
