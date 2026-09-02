import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAppSettings } from "@/lib/settings";
import { getAbsoluteUrl } from "@/lib/site-url";
import { PageHeader } from "@/components/admin/page-header";
import { ProfileForm } from "@/components/admin/profile-form";
import { PortalPricingToggle } from "@/components/admin/portal-pricing-toggle";
import { PlanCategoriesManager } from "@/components/admin/plan-categories-manager";
import { PlansBuilder } from "@/components/admin/plans-builder";
import { InvoiceSettingsForm } from "@/components/admin/invoice-settings-form";
import { ApiAccessSection } from "@/components/admin/api-access-section";
import { HandoffTemplateSettings } from "@/components/admin/handoff-template-settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  // proxy.ts guarantees a session exists for any route under (admin), but
  // TypeScript doesn't know that — fall back to empty values rather than
  // asserting, in case that ever changes.
  const [user, plans, planCategories, settings, webhookUrl, handoffRevisions] = await Promise.all([
    session?.user?.id ? db.user.findUnique({ where: { id: session.user.id } }) : null,
    db.plan.findMany({ orderBy: { displayOrder: "asc" }, include: { category: true } }),
    db.planCategory.findMany({ orderBy: { displayOrder: "asc" } }),
    getAppSettings(),
    getAbsoluteUrl("/api/leads"),
    db.handoffTemplateRevision.findMany({ where: { template: { isDefault: true } }, include: { template: true }, orderBy: { revision: "desc" } }),
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
            <PlanCategoriesManager categories={planCategories} />
            <PlansBuilder
              plans={plans}
              categories={planCategories}
              oneTimeFooterNote={settings.oneTimeFooterNote}
            />
          </div>
        </div>

        <InvoiceSettingsForm
          invoiceFromName={settings.invoiceFromName ?? ""}
          invoiceFromAddress={settings.invoiceFromAddress ?? ""}
          invoicePaymentInstructions={settings.invoicePaymentInstructions ?? ""}
          invoiceTerms={settings.invoiceTerms}
        />

        <HandoffTemplateSettings revisions={handoffRevisions.map((item) => ({ id: item.id, revision: item.revision, status: item.status, templateName: item.template.name }))} />

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
