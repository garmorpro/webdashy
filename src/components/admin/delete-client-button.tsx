"use client";

import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { deleteClient } from "@/lib/actions/clients";

export function DeleteClientButton({
  clientId,
  clientName,
  iconOnly = false,
}: {
  clientId: string;
  clientName: string;
  iconOnly?: boolean;
}) {
  return (
    <ConfirmDeleteButton
      title={`Delete ${clientName}?`}
      description="This permanently removes the client and any portals created for them. This can't be undone."
      confirmLabel="Delete Client"
      onConfirm={async () => {
        const result = await deleteClient(clientId);
        if (result?.error) throw new Error(result.error);
      }}
      iconOnly={iconOnly}
    />
  );
}
