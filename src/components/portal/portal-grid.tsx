"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";
import { PortalTemplateCard } from "@/components/portal/portal-template-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { confirmPortalSelection } from "@/lib/actions/public-portal";
import type { Category, Template } from "@prisma/client";

export function PortalGrid({
  token,
  templates,
}: {
  token: string;
  templates: (Template & { category: Category | null })[];
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState<Template | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    if (!confirming) return;
    setError(null);
    startTransition(async () => {
      const result = await confirmPortalSelection(token, confirming.id);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setConfirming(null);
      router.refresh();
    });
  }

  return (
    <>
      <div className="mb-8 text-center sm:mb-10">
        <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">
          Choose Your Favorite Template
        </h2>
        <p className="mt-2 text-sm text-slate-500 sm:text-base">
          Preview each website and select the design that best fits your business.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {templates.map((template) => (
          <PortalTemplateCard
            key={template.id}
            template={template}
            onChoose={() => {
              setError(null);
              setConfirming(template);
            }}
          />
        ))}
      </div>

      <Dialog
        open={confirming !== null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirming(null);
            setError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose {confirming?.name}?</DialogTitle>
            <DialogDescription>
              You&apos;ve selected <strong>{confirming?.name}</strong> for your website. You can
              preview the template again before confirming.
            </DialogDescription>
          </DialogHeader>

          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <DialogFooter className="sm:justify-between">
            <Button variant="outline" onClick={() => setConfirming(null)} disabled={isPending}>
              Cancel
            </Button>
            <div className="flex gap-2">
              {confirming?.previewUrl ? (
                <Button
                  variant="outline"
                  nativeButton={false}
                  render={
                    <a href={confirming.previewUrl} target="_blank" rel="noopener noreferrer" />
                  }
                >
                  <Eye className="h-4 w-4" />
                  View Preview
                </Button>
              ) : null}
              <Button onClick={handleConfirm} disabled={isPending}>
                {isPending ? "Confirming..." : "Confirm Selection"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
