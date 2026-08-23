"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { ContentStatus } from "@prisma/client";

export type RequirementsActionState = { error?: string; success?: string };

async function requireAdmin(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ? null : "You must be signed in.";
}

export async function saveRequirements(
  portalId: string,
  clientId: string,
  _prevState: RequirementsActionState,
  formData: FormData
): Promise<RequirementsActionState> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };

  const pages = String(formData.get("pages") ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  const features = formData.getAll("features").map(String);
  const contentStatus = String(formData.get("contentStatus") ?? "CLIENT_PROVIDED") as ContentStatus;
  const targetLaunchDateRaw = String(formData.get("targetLaunchDate") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;

  try {
    await db.projectRequirements.upsert({
      where: { portalId },
      update: {
        pages,
        features,
        contentStatus,
        targetLaunchDate: targetLaunchDateRaw ? new Date(targetLaunchDateRaw) : null,
        notes,
      },
      create: {
        portalId,
        pages,
        features,
        contentStatus,
        targetLaunchDate: targetLaunchDateRaw ? new Date(targetLaunchDateRaw) : null,
        notes,
      },
    });
  } catch (err) {
    console.error("saveRequirements failed:", err);
    return { error: "Something went wrong saving requirements. Please try again." };
  }

  revalidatePath(`/clients/${clientId}`);
  return { success: "Requirements saved." };
}
