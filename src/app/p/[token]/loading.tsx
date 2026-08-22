import { Skeleton } from "@/components/ui/skeleton";

export default function PortalLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 px-4 py-14 text-center">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-3">
          <Skeleton className="h-7 w-28 bg-white/10" />
          <Skeleton className="mt-4 h-8 w-56 bg-white/10" />
          <Skeleton className="h-4 w-72 bg-white/10" />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-10 flex flex-col items-center gap-2">
          <Skeleton className="h-7 w-72" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <Skeleton className="aspect-[4/3] w-full rounded-none" />
              <div className="space-y-3 p-5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
