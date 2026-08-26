import Image from "next/image";

// The public portal's own visual identity — deliberately does not reuse the
// admin shell (no sidebar, no login, no admin controls). Per the "Soft
// Grid" redesign, the admin surface's navy is softened everywhere (see
// globals.css), but this hero stays the literal brand navy (#1b2951) — a
// deep, full-strength moment is exactly what a hero radial gradient wants,
// and it's the one place the real brand color still gets to be the star.
// Uses wordmark-dark.png (the navy "Web" recolored white, "Dashy" kept
// lime) — the regular navy wordmark used elsewhere would vanish against
// this dark gradient.
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
    <div className="min-h-screen bg-background">
      <header className="relative overflow-hidden rounded-b-[2.5rem] bg-[radial-gradient(circle_at_15%_20%,#354b8c,#1b2951_55%)] px-4 py-14 text-center sm:py-16">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/15" />
        <div className="relative mx-auto flex max-w-3xl flex-col items-center">
          <Image
            src="/brand/wordmark-dark.png"
            alt="WebDashy"
            width={616}
            height={114}
            priority
            className="h-6 w-auto"
          />

          <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-primary">
            A website, made for you
          </p>
          <h1 className="mt-2.5 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {clientName}
          </h1>

          {message ? (
            <p className="mt-4 max-w-xl text-balance text-sm font-medium text-slate-300 sm:text-base">
              {message}
            </p>
          ) : null}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12 sm:py-16">{children}</main>
    </div>
  );
}
