import { Skeleton } from "@/components/ui/skeleton";

// Shown instantly while the Server Component above fetches from the
// database — without this, force-dynamic routes render nothing until the
// full round-trip completes, which reads as the app "hanging".
export default function TemplatesLoading() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="mt-2 h-4 w-80" />
        </div>
        <Skeleton className="h-8 w-32" />
      </div>

      <Skeleton className="mb-4 h-9 w-full max-w-sm" />

      <div className="mb-6 flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-20 rounded-full" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
            <Skeleton className="h-40 w-full rounded-none" />
            <div className="space-y-2 p-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="mt-3 h-8 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
