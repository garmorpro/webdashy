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
import { deleteTemplate } from "@/lib/actions/templates";

export function DeleteTemplateButton({
  templateId,
  templateName,
}: {
  templateId: string;
  templateName: string;
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
        Delete
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {templateName}?</DialogTitle>
          <DialogDescription>
            This permanently removes the template and its tag associations. Templates already
            included in a client portal keep their historical record, but the template itself
            will no longer be selectable. This can&apos;t be undone.
          </DialogDescription>
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
                  await deleteTemplate(templateId);
                } catch (err) {
                  // deleteTemplate redirects on success, which Next.js
                  // implements by throwing an error whose `digest` is
                  // tagged "NEXT_REDIRECT;..." — let that one propagate so
                  // navigation actually happens. Any other error is a real
                  // failure: show it and stop (don't rethrow — we've
                  // already handled it, rethrowing would also trip the
                  // nearest error boundary on top of the toast).
                  const digest = (err as { digest?: string } | null)?.digest;
                  if (digest?.startsWith("NEXT_REDIRECT")) throw err;

                  const message =
                    err instanceof Error
                      ? err.message
                      : "Couldn't delete this template. Please try again.";
                  toast.error(message);
                }
              });
            }}
          >
            {pending ? "Deleting..." : "Delete Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
