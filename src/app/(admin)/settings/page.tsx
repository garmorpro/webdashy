import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { ProfileForm } from "@/components/admin/profile-form";
import { ChangePasswordForm } from "@/components/admin/change-password-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  // proxy.ts guarantees a session exists for any route under (admin), but
  // TypeScript doesn't know that — fall back to empty values rather than
  // asserting, in case that ever changes.
  const user = session?.user?.id
    ? await db.user.findUnique({ where: { id: session.user.id } })
    : null;

  return (
    <div>
      <PageHeader title="Settings" subtitle="Account and application settings." />

      <div className="space-y-6">
        <ProfileForm name={user?.name ?? ""} email={user?.email ?? ""} />
        <ChangePasswordForm />
      </div>
    </div>
  );
}
