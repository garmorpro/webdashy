import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Sidebar } from "@/components/admin/sidebar";
import { Topbar } from "@/components/admin/topbar";

// Admin shell: sidebar + topbar wrapping every internal (authenticated)
// route. Kept logically separate from the public portal, which renders its
// own layout under app/p/[token] with no admin chrome at all
// (see ARCHITECTURE.md §3, product-build.md §10).
//
// This layout doesn't itself enforce authentication — proxy.ts does that
// for every request before it ever reaches here. The lookup below is
// purely to display who's signed in.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // Read the name/email fresh from the DB rather than trusting the JWT
  // session's copy — JWT sessions don't auto-refresh, so without this a
  // profile update on the Settings page wouldn't show up in the topbar
  // until the next login.
  const user = session?.user?.id
    ? await db.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, email: true },
      })
    : null;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar user={user} />
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
