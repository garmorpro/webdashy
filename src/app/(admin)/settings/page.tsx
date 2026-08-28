import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAppSettings } from "@/lib/settings";
import { getAbsoluteUrl } from "@/lib/site-url";
import { PageHeader } from "@/components/admin/page-header";
import { ProfileForm } from "@/components/admin/profile-form";
import { PortalPricingToggle } from "@/components/admin/portal-pricing-toggle";
import { PlansManager } from "@/components/admin/plans-manager";
import { InvoiceSettingsForm } from "@/components/admin/invoice-settings-form";
import { ApiAccessSection } from "@/components/admin/api-access-section";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  // proxy.ts guarantees a session exists for any route under (admin), but
  // TypeScript doesn't know that — fall back to empty values rather than
  // asserting, in case that ever changes.
  const [user, plans, settings, webhookUrl] = await Promise.all([
    session?.user?.id ? db.user.findUnique({ where: { id: session.user.id } }) : null,
    db.plan.findMany({ orderBy: { displayOrder: "asc" } }),
    getAppSettings(),
    getAbsoluteUrl("/api/leads"),
  ]);

  return (
    <div>
      <PageHeader title="Settings" subtitle="Account and application settings." />

      <div className="space-y-4">
        <ProfileForm name={user?.name ?? ""} email={user?.email ?? ""} />

        <div className="rounded-xl bg-card p-6">
          <h2 className="mb-1 text-sm font-extrabold text-foreground">Client Portal Pricing</h2>
          <div className="border-b border-border pb-5">
            <PortalPricingToggle showPricingInPortal={settings.showPricingInPortal} />
          </div>
          <div className="mt-5">
            <PlansManager plans={plans} oneTimeFooterNote={settings.oneTimeFooterNote} />
          </div>
        </div>

        <InvoiceSettingsForm
          invoiceFromName={settings.invoiceFromName ?? ""}
          invoiceFromAddress={settings.invoiceFromAddress ?? ""}
          invoicePaymentInstructions={settings.invoicePaymentInstructions ?? ""}
          invoiceTerms={settings.invoiceTerms}
        />

        <ApiAccessSection
          webhookUrl={webhookUrl}
          hasKey={Boolean(settings.apiKeyHash)}
          keyPreview={settings.apiKeyPreview}
          createdAt={settings.apiKeyCreatedAt}
        />
      </div>
    </div>
  );
}
