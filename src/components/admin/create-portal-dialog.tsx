"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PortalTemplateSelector } from "@/components/admin/portal-template-selector";
import { createPortal } from "@/lib/actions/portals";
import type { Category, Template } from "@prisma/client";

const DEFAULT_MESSAGE =
  "Thanks for working with me! Please browse the templates below and choose the one that best fits your vision.";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Generating..." : "Generate Client Portal"}
    </Button>
  );
}

export function CreatePortalDialog({
  client,
  templates,
  onOpenChange,
}: {
  /** null closes the dialog — controlled entirely by the caller's state. */
  client: { id: string; businessName: string } | null;
  templates: (Template & { category: Category | null })[];
  onOpenChange: (open: boolean) => void;
}) {
  const action = client
    ? createPortal.bind(null, client.id)
    : async () => ({ error: "No client selected." });
  const [state, formAction] = useActionState(action, {});

  return (
    <Dialog open={client !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Portal{client ? ` for ${client.businessName}` : ""}</DialogTitle>
          <DialogDescription>
            Pick a curated set of templates and generate a unique link for this client.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-5">
          {state?.error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {state.error}
            </div>
          ) : null}

          <div>
            <h3 className="mb-2 text-sm font-semibold text-foreground">Step 1 — Select Templates</h3>
            <PortalTemplateSelector templates={templates} />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold text-foreground">Step 2 — Portal Message</h3>
            <Label htmlFor="dialog-message" className="sr-only">
              Message to the client
            </Label>
            <Textarea id="dialog-message" name="message" rows={3} defaultValue={DEFAULT_MESSAGE} />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
