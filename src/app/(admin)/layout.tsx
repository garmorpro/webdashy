import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/admin/sidebar";
import { Topbar } from "@/components/admin/topbar";

// Admin shell: sidebar + topbar wrapping every internal (authenticated)
// route. Kept logically separate from the public portal, which renders its
// own layout under app/p/[token] with no admin chrome at all
// (see ARCHITECTURE.md §3, product-build.md §10).
//
// This layout doesn't itself enforce authentication — middleware.ts does
// that for every request before it ever reaches here. The session lookup
// below is purely to display who's signed in.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar user={session?.user} />
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
