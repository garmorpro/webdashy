import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAppSettings } from "@/lib/settings";
import { PageHeader } from "@/components/admin/page-header";
import { ProfileForm } from "@/components/admin/profile-form";
import { ChangePasswordForm } from "@/components/admin/change-password-form";
import { PlansManager } from "@/components/admin/plans-manager";
import { InvoiceSettingsForm } from "@/components/admin/invoice-settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  // proxy.ts guarantees a session exists for any route under (admin), but
  // TypeScript doesn't know that — fall back to empty values rather than
  // asserting, in case that ever changes.
  const [user, plans, settings] = await Promise.all([
    session?.user?.id ? db.user.findUnique({ where: { id: session.user.id } }) : null,
    db.plan.findMany({ orderBy: { displayOrder: "asc" } }),
    getAppSettings(),
  ]);

  return (
    <div>
      <PageHeader title="Settings" subtitle="Account and application settings." />

      <div className="space-y-6">
        <ProfileForm name={user?.name ?? ""} email={user?.email ?? ""} />
        <ChangePasswordForm />
        <PlansManager plans={plans} />
        <InvoiceSettingsForm
          showPricingInPortal={settings.showPricingInPortal}
          invoiceFromName={settings.invoiceFromName ?? ""}
          invoiceFromAddress={settings.invoiceFromAddress ?? ""}
          invoicePaymentInstructions={settings.invoicePaymentInstructions ?? ""}
          invoiceTerms={settings.invoiceTerms}
        />
      </div>
    </div>
  );
}
