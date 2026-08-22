import { LayoutTemplate } from "lucide-react";

// The public portal's own visual identity — deliberately does not reuse the
// admin shell (no sidebar, no login, no admin controls). Dark navy gradient
// header + white content area, per product-build.md §23.
export function PortalShell({
  clientName,
  message,
  children,
}: {
  clientName: string;
  message: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 px-4 py-10 text-center sm:py-14">
        <div className="mx-auto flex max-w-3xl flex-col items-center">
          <div className="flex items-center gap-2 text-white/90">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/10">
              <LayoutTemplate className="h-4 w-4" />
            </span>
            <span className="text-sm font-medium tracking-wide">WebDashy</span>
          </div>

          <div className="mt-6 h-px w-16 bg-white/20" />

          <h1 className="mt-6 text-2xl font-semibold text-white sm:text-3xl">{clientName}</h1>
          <p className="mt-1 text-sm font-medium uppercase tracking-wide text-blue-300">
            Website Template Selection
          </p>

          {message ? (
            <p className="mt-4 max-w-xl text-balance text-sm text-slate-300 sm:text-base">
              {message}
            </p>
          ) : null}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:py-14">{children}</main>
    </div>
  );
}
