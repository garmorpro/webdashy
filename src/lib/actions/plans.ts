"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { PlanBillingType } from "@prisma/client";

export type PlanActionState = { error?: string; success?: boolean };

// Keeps the pricing tier list (both here and the client-facing portal grid)
// from growing unbounded — no cap existed before this.
const MAX_PLANS = 10;

// See clients.ts for why this check has to live in the action itself —
// proxy.ts's route-based matcher doesn't cover Server Action dispatch.
async function requireAdmin(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ? null : "You must be signed in.";
}

function parseFeatures(raw: string): string[] {
  return raw
    .split("\n")
    .map((f) => f.trim())
    .filter(Boolean);
}

function readPlanFields(formData: FormData) {
  const get = (key: string) => String(formData.get(key) ?? "").trim();
  const billingTypeRaw = get("billingType");
  // Falls back to ONE_TIME on anything unrecognized rather than trusting
  // the raw value — formData is untrusted input (see clients.ts).
  const billingType = (billingTypeRaw === "MONTHLY" ? "MONTHLY" : "ONE_TIME") as PlanBillingType;
  return {
    name: get("name"),
    priceRaw: get("price"),
    billingType,
    // "none" is the form's sentinel for "no category" — Select needs a
    // real string value for its own item, unlike the nullable DB column.
    categoryId: ["none", ""].includes(get("categoryId")) ? null : get("categoryId"),
    isPopular: get("isPopular") === "true",
    isRecommended: get("isRecommended") === "true",
    tagline: get("tagline") || null,
    features: parseFeatures(get("features")),
    // "Why bundle?" panel fields — hand-typed, not computed (see the Plan
    // model's own comment). Cleared server-side below when isBundle is off,
    // same as billingType/footerNote elsewhere in this file.
    isBundle: get("isBundle") === "true",
    bundleWhyText: get("bundleWhyText") || null,
    bundleLines: parseFeatures(get("bundleLines")),
    bundleSavingsText: get("bundleSavingsText") || null,
  };
}

export async function createPlan(
  _prevState: PlanActionState,
  formData: FormData
): Promise<PlanActionState> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };

  const fields = readPlanFields(formData);
  if (!fields.name) return { error: "Plan name is required." };

  const price = Number(fields.priceRaw);
  if (!fields.priceRaw || Number.isNaN(price) || price < 0) {
    return { error: "Price must be a positive number." };
  }

  const existingCount = await db.plan.count();
  if (existingCount >= MAX_PLANS) {
    return { error: `You can have at most ${MAX_PLANS} plans. Deactivate or delete one first.` };
  }

  try {
    const maxOrder = await db.plan.aggregate({ _max: { displayOrder: true } });
    await db.plan.create({
      data: {
        name: fields.name,
        price,
        billingType: fields.billingType,
        categoryId: fields.categoryId,
        isPopular: fields.isPopular,
        isRecommended: fields.isRecommended,
        tagline: fields.tagline,
        features: fields.features,
        displayOrder: (maxOrder._max.displayOrder ?? -1) + 1,
        isBundle: fields.isBundle,
        // Nulled/emptied whenever isBundle is off, same pattern as
        // billingType clearing footerNote elsewhere in this file — keeps a
        // toggled-off bundle from leaving stale copy behind if re-enabled.
        bundleWhyText: fields.isBundle ? fields.bundleWhyText : null,
        bundleLines: fields.isBundle ? fields.bundleLines : [],
        bundleSavingsText: fields.isBundle ? fields.bundleSavingsText : null,
      },
    });
  } catch (err) {
    console.error("createPlan failed:", err);
    return { error: "Something went wrong saving the plan. Please try again." };
  }

  revalidatePath("/settings");
  revalidatePath("/p", "layout");
  return { success: true };
}

export async function updatePlan(
  planId: string,
  _prevState: PlanActionState,
  formData: FormData
): Promise<PlanActionState> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };

  const fields = readPlanFields(formData);
  if (!fields.name) return { error: "Plan name is required." };

  const price = Number(fields.priceRaw);
  if (!fields.priceRaw || Number.isNaN(price) || price < 0) {
    return { error: "Price must be a positive number." };
  }

  try {
    await db.plan.update({
      where: { id: planId },
      data: {
        name: fields.name,
        price,
        billingType: fields.billingType,
        categoryId: fields.categoryId,
        isPopular: fields.isPopular,
        isRecommended: fields.isRecommended,
        tagline: fields.tagline,
        features: fields.features,
        isBundle: fields.isBundle,
        bundleWhyText: fields.isBundle ? fields.bundleWhyText : null,
        bundleLines: fields.isBundle ? fields.bundleLines : [],
        bundleSavingsText: fields.isBundle ? fields.bundleSavingsText : null,
      },
    });
  } catch (err) {
    console.error("updatePlan failed:", err);
    return { error: "Something went wrong saving the plan. Please try again." };
  }

  revalidatePath("/settings");
  revalidatePath("/p", "layout");
  return { success: true };
}

export async function togglePlanActive(planId: string, isActive: boolean) {
  const authError = await requireAdmin();
  if (authError) throw new Error(authError);

  await db.plan.update({ where: { id: planId }, data: { isActive } });
  revalidatePath("/settings");
  revalidatePath("/p", "layout");
}

export async function movePlan(planId: string, direction: "up" | "down") {
  const authError = await requireAdmin();
  if (authError) throw new Error(authError);

  const target = await db.plan.findUnique({ where: { id: planId } });
  if (!target) return;

  // Scoped to the same billingType — the Settings UI now renders Monthly
  // and One-Time plans as two separate lists (see plans-manager.tsx), so
  // reordering must stay within whichever list the admin is looking at
  // rather than reaching across into the other one.
  const plans = await db.plan.findMany({
    where: { billingType: target.billingType },
    orderBy: { displayOrder: "asc" },
  });
  const index = plans.findIndex((p) => p.id === planId);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= plans.length) return;

  const a = plans[index];
  const b = plans[swapWith];
  await db.$transaction([
    db.plan.update({ where: { id: a.id }, data: { displayOrder: b.displayOrder } }),
    db.plan.update({ where: { id: b.id }, data: { displayOrder: a.displayOrder } }),
  ]);
  revalidatePath("/settings");
}

export async function deletePlan(planId: string) {
  const authError = await requireAdmin();
  if (authError) throw new Error(authError);

  const usedCount = await db.templateSelection.count({ where: { planId } });
  if (usedCount > 0) {
    throw new Error(
      "This plan can't be deleted because a client has selected it. Deactivate it instead to hide it from new portals."
    );
  }

  await db.plan.delete({ where: { id: planId } });
  revalidatePath("/settings");
  revalidatePath("/p", "layout");
}
