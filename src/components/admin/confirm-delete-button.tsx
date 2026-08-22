"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
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

export function ConfirmDeleteButton({
  title,
  description,
  triggerLabel = "Delete",
  confirmLabel,
  onConfirm,
}: {
  title: string;
  description: string;
  triggerLabel?: string;
  confirmLabel: string;
  /** Should redirect on success (thrown redirects are handled), or throw
   * an Error with a user-facing message on failure. */
  onConfirm: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="destructive"
        size="sm"
        render={<button type="button" />}
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
        {triggerLabel}
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                try {
                  await onConfirm();
                } catch (err) {
                  // A successful action redirects, which Next.js implements
                  // by throwing an error whose `digest` is tagged
                  // "NEXT_REDIRECT;..." — let that propagate so navigation
                  // actually happens. Any other error is a real failure:
                  // show it and stop (don't rethrow — already handled).
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
            {pending ? "Deleting..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
