"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";

export type LoginActionState = { error?: string };

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
