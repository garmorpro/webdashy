"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile, type AccountActionState } from "@/lib/actions/account";

// Shared "filled" field treatment for Settings — a tinted, borderless box
// instead of the outlined Input used on Client/Template/Portal forms. The
// --secondary token exists specifically for this ("the filled input look
// inside a white card" — see globals.css); Settings is the first place it's
// actually applied to real fields.
const FIELD_LABEL = "mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-muted-foreground";
const FIELD_INPUT = "h-10 rounded-xl border-0 bg-secondary px-3.5 text-sm font-semibold shadow-none";

function initialsFor(name?: string | null, email?: string | null): string {
  const source = name?.trim() || email?.trim() || "";
  if (!source) return "?";
  const parts = source.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending} className="shrink-0">
      {pending ? "Saving..." : "Save Profile"}
    </Button>
  );
}

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const [state, formAction] = useActionState<AccountActionState, FormData>(updateProfile, {});

  return (
    <form action={formAction} className="rounded-xl bg-card p-6">
      <h2 className="mb-4 text-sm font-extrabold text-foreground">Profile</h2>

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

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-1 items-center gap-5">
          <Avatar className="hidden h-[60px] w-[60px] shrink-0 rounded-2xl sm:flex">
            <AvatarFallback className="rounded-2xl bg-foreground text-lg font-extrabold text-background">
              {initialsFor(name, email)}
            </AvatarFallback>
          </Avatar>

          <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name" className={FIELD_LABEL}>
                Name
              </Label>
              <Input id="name" name="name" required defaultValue={name} className={FIELD_INPUT} />
            </div>

            <div>
              <Label htmlFor="email" className={FIELD_LABEL}>
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                defaultValue={email}
                className={FIELD_INPUT}
              />
              <p className="mt-1.5 text-xs text-muted-foreground">This is also your login email.</p>
            </div>
          </div>
        </div>

        <SubmitButton />
      </div>
    </form>
  );
}
