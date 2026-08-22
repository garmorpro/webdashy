import { LayoutTemplate } from "lucide-react";

// Shown for a disabled-but-real portal — not a 404 (the token is genuine,
// it's just been turned off by the admin), and not a scary error either.
export function PortalUnavailable() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="mx-auto flex max-w-md flex-col items-center rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <LayoutTemplate className="h-6 w-6" />
        </span>
        <h1 className="mt-6 text-lg font-semibold text-slate-900">
          This portal is no longer available
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Please reach out if you need a new link to view your website options.
        </p>
      </div>
    </div>
  );
}
