import { Link2 } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";

// Placeholder route — built out in Phase 4/5 (Portal Builder, Public Portal)
// and Phase 6 (Tracking) of ROADMAP.md.
export default function PortalsPage() {
  return (
    <div>
      <PageHeader
        title="Portals"
        subtitle="Track every client portal you've generated — status, views, and selections."
      />

      <EmptyState
        icon={Link2}
        title="No template portal yet"
        description="Choose a few templates and create a personalized selection portal for a client to get started."
      />
    </div>
  );
}
