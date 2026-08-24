"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PortalTemplateSelector } from "@/components/admin/portal-template-selector";
import type { PortalActionState } from "@/lib/actions/portals";
import type { Category, Template } from "@prisma/client";

const DEFAULT_MESSAGE =
  "Thanks for working with me! Please browse the templates below and choose the one that best fits your vision.";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : label}
    </Button>
  );
}

export function PortalForm({
  action,
  templates,
  defaultSelectedIds,
  defaultMessage,
  submitLabel,
  cancelHref,
}: {
  action: (state: PortalActionState, formData: FormData) => Promise<PortalActionState>;
  templates: (Template & { category: Category | null })[];
  defaultSelectedIds?: string[];
  defaultMessage?: string;
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} className="max-w-4xl space-y-6">
      {state?.error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      <div className="space-y-3 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">Step 1 — Select Templates</h2>
        <p className="text-sm text-muted-foreground">
          Choose a curated shortlist (2–8) rather than the entire library.
        </p>
        <PortalTemplateSelector templates={templates} defaultSelectedIds={defaultSelectedIds} />
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">Step 2 — Portal Message</h2>
        <div className="space-y-1.5">
          <Label htmlFor="message">Message to the client</Label>
          <Textarea
            id="message"
            name="message"
            rows={3}
            defaultValue={defaultMessage ?? DEFAULT_MESSAGE}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <SubmitButton label={submitLabel} />
        <Button variant="outline" nativeButton={false} render={<Link href={cancelHref} />}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
