import { Skeleton } from "@/components/ui/skeleton";

export function FormLoadingSkeleton({ sections = 2 }: { sections?: number }) {
  return (
    <div>
      <div className="mb-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-2 h-4 w-96" />
      </div>

      <div className="max-w-2xl space-y-6">
        {Array.from({ length: sections }).map((_, i) => (
          <div key={i} className="space-y-4 rounded-xl border border-border bg-card p-5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
        ))}
        <div className="flex gap-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  );
}
