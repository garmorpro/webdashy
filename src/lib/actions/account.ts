"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export type AccountActionState = { error?: string; success?: string };

export async function updateProfile(
  _prevState: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in." };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  if (!name) return { error: "Name is required." };
  if (!email) return { error: "Email is required." };

  try {
    await db.user.update({
      where: { id: session.user.id },
      data: { name, email },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "That email is already in use." };
    }
    console.error("updateProfile failed:", err);
    return { error: "Something went wrong saving your profile. Please try again." };
  }

  revalidatePath("/settings");
  revalidatePath("/", "layout"); // refreshes the topbar's cached name/initials
  return { success: "Profile updated." };
}

export async function changePassword(
  _prevState: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in." };

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "All fields are required." };
  }
  if (newPassword.length < 8) {
    return { error: "New password must be at least 8 characters." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "New password and confirmation don't match." };
  }

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { error: "You must be signed in." };

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return { error: "Current password is incorrect." };

  const passwordHash = await bcrypt.hash(newPassword, 12);

  try {
    await db.user.update({ where: { id: user.id }, data: { passwordHash } });
  } catch (err) {
    console.error("changePassword failed:", err);
    return { error: "Something went wrong changing your password. Please try again." };
  }

  return { success: "Password changed." };
}
