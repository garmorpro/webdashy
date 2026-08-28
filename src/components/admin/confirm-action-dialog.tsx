"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Controlled confirm dialog with no trigger of its own — open state lives
 * in the parent. Use this (rather than ConfirmDeleteButton, which owns its
 * own trigger button) when the trigger is a dropdown menu item: a Dialog
 * nested inside a Menu fights the menu's own close/focus-return behavior,
 * so the dialog needs to live outside that tree, driven by lifted state.
 */
export function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  pendingLabel,
  destructive = true,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  pendingLabel?: string;
  destructive?: boolean;
  /** Either redirect on success (thrown redirects are handled and left to
   * propagate — the dialog unmounts with the navigation, so this dialog's
   * own auto-close below never gets a chance to run, which is fine), or
   * throw an Error with a user-facing message on failure. Anything else
   * (a resolved promise, no throw) is treated as success and this dialog
   * closes itself — the caller does not need to separately close it. */
  onConfirm: () => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                try {
                  await onConfirm();
                  // A non-redirecting onConfirm resolves normally on
                  // success (e.g. resetPortalSelection, deletePlan just
                  // revalidate in place, they don't navigate away) — close
                  // the dialog here so it doesn't sit open after a
                  // successful action. A redirecting onConfirm throws
                  // before reaching this line, so it never double-closes
                  // on top of the navigation.
                  onOpenChange(false);
                } catch (err) {
                  // A successful action may redirect, which Next.js
                  // implements by throwing an error whose `digest` is
                  // tagged "NEXT_REDIRECT;..." — let that propagate so
                  // navigation actually happens. Any other error is a real
                  // failure: show it and stop (don't rethrow — handled).
                  const digest = (err as { digest?: string } | null)?.digest;
                  if (digest?.startsWith("NEXT_REDIRECT")) throw err;

                  const message =
                    err instanceof Error
                      ? err.message
                      : "Something went wrong. Please try again.";
                  toast.error(message);
                }
              });
            }}
          >
            {pending ? (pendingLabel ?? "Working...") : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
