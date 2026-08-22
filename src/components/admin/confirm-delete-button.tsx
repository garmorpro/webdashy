"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/components/admin/confirm-action-dialog";

/** Self-contained trigger button + confirm dialog. For a dropdown-menu-item
 * trigger instead, use ConfirmActionDialog directly with lifted state. */
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
  onConfirm: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        render={<button type="button" />}
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
        {triggerLabel}
      </Button>
      <ConfirmActionDialog
        open={open}
        onOpenChange={setOpen}
        title={title}
        description={description}
        confirmLabel={confirmLabel}
        pendingLabel="Deleting..."
        onConfirm={onConfirm}
      />
    </>
  );
}
