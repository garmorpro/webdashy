"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePassword, type AccountActionState } from "@/lib/actions/account";

const FIELD_LABEL = "mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-muted-foreground";
const FIELD_INPUT = "h-10 rounded-xl border-0 bg-secondary px-3.5 text-sm font-semibold shadow-none";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Changing..." : "Change Password"}
    </Button>
  );
}

export function ChangePasswordForm() {
  const [state, formAction] = useActionState<AccountActionState, FormData>(changePassword, {});
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the password fields after a successful change — leaving the old
  // and new passwords sitting in the form is both pointless and a bit rude
  // to browser password managers.
  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="max-w-md rounded-xl bg-card p-6">
      <h2 className="mb-4 text-sm font-extrabold text-foreground">Change Password</h2>

      {state?.error ? (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}
      {state?.success ? (
        <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {state.success}
        </div>
      ) : null}

      <div className="space-y-4">
        <div>
          <Label htmlFor="currentPassword" className={FIELD_LABEL}>
            Current Password
          </Label>
          <Input
            id="currentPassword"
            name="currentPassword"
            type="password"
            required
            autoComplete="current-password"
            className={FIELD_INPUT}
          />
        </div>

        <div>
          <Label htmlFor="newPassword" className={FIELD_LABEL}>
            New Password
          </Label>
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={FIELD_INPUT}
          />
        </div>

        <div>
          <Label htmlFor="confirmPassword" className={FIELD_LABEL}>
            Confirm New Password
          </Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={FIELD_INPUT}
          />
        </div>
      </div>

      <div className="mt-5">
        <SubmitButton />
      </div>
    </form>
  );
}
