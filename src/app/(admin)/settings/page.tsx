import { Settings } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";

// Placeholder route. Admin auth config, profile, and (later) branding
// options land here — not scoped to a specific roadmap phase yet.
export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" subtitle="Account and application settings." />

      <EmptyState
        icon={Settings}
        title="Nothing to configure yet"
        description="Settings will appear here as authentication and other configurable options are built out."
      />
    </div>
  );
}
