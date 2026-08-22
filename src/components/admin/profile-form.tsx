"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile, type AccountActionState } from "@/lib/actions/account";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save Profile"}
    </Button>
  );
}

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const [state, formAction] = useActionState<AccountActionState, FormData>(updateProfile, {});

  return (
    <form action={formAction} className="max-w-md space-y-4 rounded-xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-foreground">Profile</h2>

      {state?.error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}
      {state?.success ? (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {state.success}
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required defaultValue={name} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required defaultValue={email} />
        <p className="text-xs text-muted-foreground">This is also your login email.</p>
      </div>

      <SubmitButton />
    </form>
  );
}
