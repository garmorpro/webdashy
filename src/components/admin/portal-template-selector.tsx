"use client";

import { useState } from "react";
import { Check, LayoutTemplate } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category, Template } from "@prisma/client";

type SelectableTemplate = Template & { category: Category | null };

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

function gradientFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return GRADIENTS[hash % GRADIENTS.length];
}

export function PortalTemplateSelector({
  templates,
  defaultSelectedIds = [],
  min = 2,
  max = 8,
}: {
  templates: SelectableTemplate[];
  defaultSelectedIds?: string[];
  min?: number;
  max?: number;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(defaultSelectedIds));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= max) return prev;
        next.add(id);
      }
      return next;
    });
  }

  const count = selected.size;
  const countMessage =
    count < min
      ? `Select at least ${min} templates (${count} selected).`
      : count > max
        ? `Select at most ${max} templates (${count} selected).`
        : `${count} of ${max} selected.`;

  return (
    <div>
      <p
        className={cn(
          "mb-3 text-sm",
          count < min || count > max ? "text-destructive" : "text-muted-foreground"
        )}
      >
        {countMessage}
      </p>

      {templates.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
          No active templates yet — add and activate templates in the library first.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => {
            const isSelected = selected.has(template.id);
            return (
              <label
                key={template.id}
                className={cn(
                  "group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-colors",
                  isSelected ? "border-primary ring-2 ring-primary/30" : "border-border"
                )}
              >
                <input
                  type="checkbox"
                  name="templateIds"
                  value={template.id}
                  checked={isSelected}
                  onChange={() => toggle(template.id)}
                  className="sr-only"
                />

                <div className="relative h-28 overflow-hidden">
                  {template.thumbnailUrl ? (
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
                      <LayoutTemplate className="h-8 w-8 text-white/70" />
                    </div>
                  )}

                  <div
                    className={cn(
                      "absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-white/80 bg-white/30"
                    )}
                  >
                    {isSelected ? <Check className="h-3.5 w-3.5" /> : null}
                  </div>
                </div>

                <div className="p-3">
                  <p className="truncate text-sm font-medium text-foreground">{template.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {template.category?.name ?? "Uncategorized"}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
