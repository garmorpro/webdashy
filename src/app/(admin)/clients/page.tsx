import { Plus, Users } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { Button } from "@/components/ui/button";

// Placeholder route — built out in Phase 3 (Clients) of ROADMAP.md.
export default function ClientsPage() {
  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle="A lightweight CRM for your prospective website clients."
        actions={
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Add New Client
          </Button>
        }
      />

      <EmptyState
        icon={Users}
        title="Add your first potential client"
        description="Create a client and send them a personalized template selection portal."
        action={
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Add Client
          </Button>
        }
      />
    </div>
  );
}
