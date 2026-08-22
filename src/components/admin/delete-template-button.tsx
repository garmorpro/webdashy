"use client";

import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { deleteTemplate } from "@/lib/actions/templates";

export function DeleteTemplateButton({
  templateId,
  templateName,
}: {
  templateId: string;
  templateName: string;
}) {
  return (
    <ConfirmDeleteButton
      title={`Delete ${templateName}?`}
      description="This permanently removes the template and its tag associations. Templates already included in a client portal keep their historical record, but the template itself will no longer be selectable. This can't be undone."
      confirmLabel="Delete Template"
      onConfirm={() => deleteTemplate(templateId)}
    />
  );
}
