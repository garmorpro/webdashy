"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { db } from "@/lib/db";
import { generatePasswordResetToken, hashResetToken } from "@/lib/tokens";
import { getAbsoluteUrl } from "@/lib/site-url";
import { sendPasswordResetEmail } from "@/lib/mail";

export type RequestResetState = { submitted?: boolean; error?: string };
export type ResetPasswordState = { error?: string };

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Deliberately public/unauthenticated — this is the "I can't log in"
 * recovery path, so it can't require a session. Resolves the account by
 * email but always reports the same generic "submitted" result whether or
 * not that email matched a real account, so this can't be used to probe
 * which email address the admin account uses.
 */
export async function requestPasswordReset(
  _prevState: RequestResetState,
  formData: FormData
): Promise<RequestResetState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter your email address." };

  const user = await db.user.findUnique({ where: { email } });

  if (user) {
    const { token, tokenHash } = generatePasswordResetToken();
    await db.user.update({
      where: { id: user.id },
      data: {
        resetTokenHash: tokenHash,
        resetTokenExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    try {
      const resetUrl = await getAbsoluteUrl(`/reset-password/${token}`);
      await sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl });
    } catch (err) {
      // Still report success below — don't leak whether email sending is
      // even configured. Logged so it's visible in server logs at least.
      console.error("Failed to send password reset email:", err);
    }
  }

  return { submitted: true };
}

/**
 * Also public/unauthenticated by necessity — resolves strictly by the
 * token's hash (never trusts a client-supplied user id), matching the same
 * unguessable-token security model as the public portal and delivery
 * review links (see ARCHITECTURE.md §6).
 */
export async function resetPassword(
  token: string,
  _prevState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirmPassword) return { error: "Passwords don't match." };

  const user = await db.user.findUnique({ where: { resetTokenHash: hashResetToken(token) } });
  if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
    return { error: "This reset link is invalid or has expired. Request a new one." };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.user.update({
    where: { id: user.id },
    data: { passwordHash, resetTokenHash: null, resetTokenExpiresAt: null },
  });

  try {
    await signIn("credentials", { email: user.email, password, redirectTo: "/" });
  } catch (err) {
    // Same pattern as loginAction/completeSetupAction — signIn's success
    // path throws a redirect internally and must be allowed to propagate.
    // The password is already changed above regardless of what happens here.
    if (err instanceof AuthError) {
      return { error: "Password reset, but automatic sign-in failed — please sign in manually." };
    }
    throw err;
  }

  return {};
}
