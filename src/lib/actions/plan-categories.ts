"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// See clients.ts for why this check has to live in every action itself —
// proxy.ts's route-based matcher doesn't cover Server Action dispatch.
async function requireAdmin(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ? null : "You must be signed in.";
}

export async function createPlanCategory(name: string): Promise<{ error?: string }> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };

  const trimmed = name.trim();
  if (!trimmed) return { error: "Category name is required." };

  const maxOrder = await db.planCategory.aggregate({ _max: { displayOrder: true } });
  await db.planCategory.create({
    data: { name: trimmed, displayOrder: (maxOrder._max.displayOrder ?? -1) + 1 },
  });

  revalidatePath("/settings");
  revalidatePath("/p", "layout");
  return {};
}

export async function renamePlanCategory(
  categoryId: string,
  name: string
): Promise<{ error?: string }> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };

  const trimmed = name.trim();
  if (!trimmed) return { error: "Category name is required." };

  await db.planCategory.update({ where: { id: categoryId }, data: { name: trimmed } });

  revalidatePath("/settings");
  revalidatePath("/p", "layout");
  return {};
}

export async function movePlanCategory(categoryId: string, direction: "up" | "down") {
  const authError = await requireAdmin();
  if (authError) throw new Error(authError);

  const categories = await db.planCategory.findMany({ orderBy: { displayOrder: "asc" } });
  const index = categories.findIndex((c) => c.id === categoryId);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= categories.length) return;

  const a = categories[index];
  const b = categories[swapWith];
  await db.$transaction([
    db.planCategory.update({ where: { id: a.id }, data: { displayOrder: b.displayOrder } }),
    db.planCategory.update({ where: { id: b.id }, data: { displayOrder: a.displayOrder } }),
  ]);
  revalidatePath("/settings");
  revalidatePath("/p", "layout");
}

// Returns { error } instead of throwing — see the matching comment on
// deleteTemplate in templates.ts: a thrown Server Action error gets its
// message redacted in production, so this must return it instead.
export async function deletePlanCategory(categoryId: string): Promise<{ error: string } | undefined> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };

  const usedCount = await db.plan.count({ where: { categoryId } });
  if (usedCount > 0) {
    return {
      error: "This category is still assigned to a plan — move those plans to a different category first.",
    };
  }

  await db.planCategory.delete({ where: { id: categoryId } });
  revalidatePath("/settings");
  revalidatePath("/p", "layout");
}
