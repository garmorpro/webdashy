import {
  LayoutTemplate,
  Users,
  Link2,
  Send,
  Eye,
  MousePointerClick,
} from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Mock data — replaced with real queries once Phase 7 (Dashboard) builds on
// top of real template/client/portal data. See ROADMAP.md.
const metrics = [
  { label: "Total Templates", value: 24, icon: LayoutTemplate },
  { label: "Total Clients", value: 12, icon: Users },
  { label: "Active Portals", value: 8, icon: Link2 },
  { label: "Templates Shared", value: 37, icon: Send },
  { label: "Portal Views", value: 156, icon: Eye },
  { label: "Template Selections", value: 5, icon: MousePointerClick },
];

const recentActivity = [
  {
    client: "Acme Construction",
    action: "Selected Modern Construction",
    time: "5 minutes ago",
  },
  {
    client: "Bloom & Co. Marketing",
    action: "Viewed their portal",
    time: "2 hours ago",
  },
  {
    client: "NextGen Roofing",
    action: "Portal created",
    time: "Yesterday",
  },
];

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="A quick look at your templates, clients, and portal activity."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label} className="border-border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.label}
                </CardTitle>
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-accent-foreground">
                  <Icon className="h-4 w-4" />
                </span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-foreground">
                  {metric.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6 border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {recentActivity.map((item, i) => (
              <li key={i} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.client}</p>
                  <p className="text-sm text-muted-foreground">{item.action}</p>
                </div>
                <span className="text-xs text-muted-foreground">{item.time}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
