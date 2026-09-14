import { Skeleton } from "@/components/ui/skeleton";

export default function LeadsLoading() {
  return (
    <div aria-label="Loading leads" aria-busy="true">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-2 h-4 w-60" />
        </div>
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="mb-4 flex flex-wrap gap-3">
        <Skeleton className="h-9 w-full sm:w-80" />
        <Skeleton className="h-9 w-44" />
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="flex gap-4 border-b border-border p-4 last:border-0">
            <Skeleton className="h-5 flex-1" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="hidden h-5 flex-1 sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
