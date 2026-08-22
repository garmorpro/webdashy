"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import { db } from "@/lib/db";

export type LoginActionState = { error?: string };
export type SetupActionState = { error?: string };

export async function loginAction(
  callbackUrl: string,
  _prevState: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl || "/",
    });
  } catch (err) {
    // signIn() implements a successful login by throwing a Next.js redirect
    // internally — only an actual AuthError means the credentials were
    // wrong. Anything else must propagate so that redirect happens.
    if (err instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw err;
  }

  return {};
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

/**
 * One-time admin bootstrap. Creates the first (and, for V1, only) admin
 * account through a real form instead of a plaintext password sitting in
 * .env — see the /setup page for the "why" of this.
 *
 * Guarded twice: the page itself only renders this form while
 * `db.user.count() === 0`, and this action re-checks the same thing
 * immediately before creating the row. Neither check is perfectly atomic
 * against a genuine concurrent race, but that's an acceptable trade-off
 * for a bootstrap step run once, by hand, on a private VM — not a
 * public-facing registration endpoint.
 */
export async function completeSetupAction(
  _prevState: SetupActionState,
  formData: FormData
): Promise<SetupActionState> {
  const existing = await db.user.count();
  if (existing > 0) {
    return { error: "Setup has already been completed. Please sign in instead." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!name) return { error: "Name is required." };
  if (!email) return { error: "Email is required." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirmPassword) return { error: "Passwords don't match." };

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await db.user.create({ data: { name, email, passwordHash } });
  } catch (err) {
    console.error("completeSetupAction failed:", err);
    return { error: "Something went wrong creating your account. Please try again." };
  }

  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (err) {
    // Same pattern as loginAction — signIn's success path throws a
    // redirect internally and must be allowed to propagate. The account
    // was already created above regardless of what happens here.
    if (err instanceof AuthError) {
      return { error: "Account created, but automatic sign-in failed — please sign in manually." };
    }
    throw err;
  }

  return {};
}
