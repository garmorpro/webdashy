"use client";

import { Eye, LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Category, Template } from "@prisma/client";

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

export function PortalTemplateCard({
  template,
  onChoose,
}: {
  template: Template & { category: Category | null };
  onChoose: () => void;
}) {
  const screenshot = template.desktopScreenshotUrl || template.thumbnailUrl;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {screenshot ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={screenshot} alt={template.name} className="h-full w-full object-cover" />
        ) : (
          <div
            className={cn(
              "flex h-full w-full items-center justify-center bg-gradient-to-br",
              gradientFor(template.id)
            )}
          >
            <LayoutTemplate className="h-12 w-12 text-white/70" />
          </div>
        )}
      </div>

      <div className="p-5">
        <h3 className="text-base font-semibold text-slate-900">{template.name}</h3>
        <p className="mt-0.5 text-sm text-slate-500">
          {template.category?.name ?? "Website Template"}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {template.previewUrl ? (
            <Button
              variant="outline"
              nativeButton={false}
              className="h-auto min-h-9 whitespace-normal px-2 py-2 text-center text-xs leading-tight"
              render={<a href={template.previewUrl} target="_blank" rel="noopener noreferrer" />}
            >
              <Eye className="h-3.5 w-3.5 shrink-0" />
              View Preview
            </Button>
          ) : (
            <Button
              variant="outline"
              disabled
              className="h-auto min-h-9 whitespace-normal px-2 py-2 text-center text-xs leading-tight"
            >
              <Eye className="h-3.5 w-3.5 shrink-0" />
              View Preview
            </Button>
          )}

          <Button
            onClick={onChoose}
            className="h-auto min-h-9 whitespace-normal px-2 py-2 text-center text-xs leading-tight"
          >
            Choose This Template
          </Button>
        </div>
      </div>
    </div>
  );
}
