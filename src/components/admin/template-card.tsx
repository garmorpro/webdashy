"use client";

import { useTransition } from "react";
import Link from "next/link";
import { ExternalLink, Heart, LayoutTemplate, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { setTemplateStatus, toggleTemplateFavorite } from "@/lib/actions/templates";
import type { Category, Tag, Template, TemplateTag } from "@prisma/client";

export type TemplateWithRelations = Template & {
  category: Category | null;
  tags: (TemplateTag & { tag: Tag })[];
};

const GRADIENTS = [
  "from-blue-600 to-blue-400",
  "from-slate-700 to-slate-500",
  "from-amber-600 to-amber-400",
  "from-zinc-700 to-zinc-500",
  "from-pink-500 to-rose-400",
  "from-orange-600 to-orange-400",
  "from-red-600 to-red-400",
  "from-emerald-600 to-emerald-400",
  "from-violet-600 to-violet-400",
  "from-teal-600 to-teal-400",
  "from-indigo-600 to-indigo-400",
];

// Deterministic per-template placeholder gradient, used until a real
// thumbnail is uploaded.
function gradientFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return GRADIENTS[hash % GRADIENTS.length];
}

export function TemplateCard({ template }: { template: TemplateWithRelations }) {
  const [, startTransition] = useTransition();

  function handleFavoriteToggle() {
    startTransition(async () => {
      try {
        await toggleTemplateFavorite(template.id, !template.isFavorite);
      } catch {
        toast.error("Couldn't update favorite. Please try again.");
      }
    });
  }

  function handleArchive() {
    startTransition(async () => {
      try {
        await setTemplateStatus(template.id, "ARCHIVED");
        toast.success(`${template.name} archived.`);
      } catch {
        toast.error("Couldn't archive this template. Please try again.");
      }
    });
  }

  return (
    <div className="group overflow-hidden rounded-xl bg-card transition-shadow hover:shadow-[0_14px_32px_-14px_rgba(38,49,94,0.22)]">
      <div className="relative h-40 overflow-hidden">
        {template.thumbnailUrl ? (
          // Arbitrary admin-supplied URLs — next/image would need a
          // remotePatterns allowlist we can't predict ahead of time.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={template.thumbnailUrl}
            alt={template.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className={cn(
              "flex h-full w-full items-center justify-center bg-gradient-to-br",
              gradientFor(template.id)
            )}
          >
            <LayoutTemplate className="h-10 w-10 text-white/70" />
          </div>
        )}

        <button
          type="button"
          onClick={handleFavoriteToggle}
          aria-label={template.isFavorite ? "Remove from favorites" : "Add to favorites"}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm transition-colors hover:bg-white"
        >
          <Heart
            className={cn("h-4 w-4", template.isFavorite && "fill-rose-500 text-rose-500")}
          />
        </button>

        {template.status !== "ACTIVE" ? (
          <Badge
            variant="secondary"
            className="absolute left-2 top-2 bg-white/90 text-slate-700 capitalize"
          >
            {template.status.toLowerCase()}
          </Badge>
        ) : null}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-foreground">{template.name}</h3>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {template.category?.name ?? "Uncategorized"}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  aria-label="More options"
                />
              }
            >
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem render={<Link href={`/templates/${template.id}`} />}>
                Edit template
              </DropdownMenuItem>
              {template.status !== "ARCHIVED" ? (
                <DropdownMenuItem variant="destructive" onClick={handleArchive}>
                  Archive
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {template.previewUrl ? (
          <Button
            variant="outline"
            size="sm"
            className="mt-3 w-full"
            nativeButton={false}
            render={<a href={template.previewUrl} target="_blank" rel="noopener noreferrer" />}
          >
            Preview
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="mt-3 w-full" disabled>
            No preview URL yet
          </Button>
        )}
      </div>
    </div>
  );
}
