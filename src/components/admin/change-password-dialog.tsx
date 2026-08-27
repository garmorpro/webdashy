"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { changePassword } from "@/lib/actions/account";

const FIELD_LABEL = "mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-muted-foreground";
const FIELD_INPUT = "h-10 rounded-xl border-0 bg-secondary px-3.5 text-sm font-semibold shadow-none";

/**
 * Was its own always-open card on the Settings page; now a button in
 * Profile's top action row that pops the same 3-field form into a modal —
 * changing your password is rare enough that it doesn't need permanent
 * screen real estate.
 *
 * Calls changePassword directly via useTransition (rather than
 * useActionState) so "close the dialog on success" happens synchronously
 * inside the submit handler, not a useEffect reacting to state — closing
 * from an effect trips the "don't setState in an effect" lint rule, since
 * there's nothing here actually syncing with an external system.
 */
export function ChangePasswordDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await changePassword({}, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      toast.success(result.success ?? "Password changed.");
      formRef.current?.reset();
      setOpen(false);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <DialogTrigger render={<Button type="button" variant="outline" size="sm" />}>
        Change Password
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>Enter your current password, then choose a new one.</DialogDescription>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

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

          <Button type="submit" size="sm" className="w-full" disabled={isPending}>
            {isPending ? "Changing..." : "Change Password"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
