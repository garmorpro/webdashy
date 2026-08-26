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
  iconOnly = false,
}: {
  title: string;
  description: string;
  triggerLabel?: string;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
  /** Renders just the trash icon in a square button, no label — for a
   * compact header slot rather than an inline action row. */
  iconOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="destructive"
        size={iconOnly ? "icon" : "sm"}
        render={<button type="button" />}
        onClick={() => setOpen(true)}
        aria-label={iconOnly ? triggerLabel : undefined}
      >
        <Trash2 className="h-4 w-4" />
        {iconOnly ? null : triggerLabel}
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
