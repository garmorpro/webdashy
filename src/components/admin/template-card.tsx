"use client";

import { useState } from "react";
import { ExternalLink, Heart, LayoutTemplate, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { MockTemplate } from "@/lib/mock-templates";

export function TemplateCard({ template }: { template: MockTemplate }) {
  const [favorited, setFavorited] = useState(false);

  return (
    <div className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <div
        className={cn(
          "relative flex h-40 items-center justify-center bg-gradient-to-br",
          template.gradient
        )}
      >
        <LayoutTemplate className="h-10 w-10 text-white/70" />

        <button
          type="button"
          onClick={() => setFavorited((f) => !f)}
          aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm transition-colors hover:bg-white"
        >
          <Heart
            className={cn("h-4 w-4", favorited && "fill-rose-500 text-rose-500")}
          />
        </button>

        {template.status !== "Active" ? (
          <Badge
            variant="secondary"
            className="absolute left-2 top-2 bg-white/90 text-slate-700"
          >
            {template.status}
          </Badge>
        ) : null}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-foreground">
              {template.name}
            </h3>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {template.category} / {template.industry}
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
              <DropdownMenuItem>Edit template</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuItem variant="destructive">Archive</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="mt-3 w-full"
          nativeButton={false}
          render={
            <a href={template.previewUrl} target="_blank" rel="noopener noreferrer" />
          }
        >
          Preview
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
