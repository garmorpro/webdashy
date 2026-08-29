import { LayoutGrid, Users, DollarSign, Check } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { avatarColorsFor, initialsFor } from "@/lib/avatar-colors";

export type DashboardActivityEntry = { clientName: string; text: string; at: Date };
export type DashboardPipelineStage = { key: string; label: string; count: number };

export function DashboardView({
  firstName,
  templateCount,
  activeClientCount,
  pipelineValue,
  wonThisMonth,
  pipelineStages,
  activity,
}: {
  firstName: string;
  templateCount: number;
  activeClientCount: number;
  pipelineValue: number;
  wonThisMonth: number;
  pipelineStages: DashboardPipelineStage[];
  activity: DashboardActivityEntry[];
}) {
  const maxStageCount = Math.max(1, ...pipelineStages.map((s) => s.count));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[1.75rem] font-extrabold tracking-tight text-foreground">
          Hey {firstName}
        </h1>
        <p className="mt-1 text-sm font-medium text-muted-foreground">
          Here&apos;s how your studio is doing today.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-card p-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-foreground">
            <LayoutGrid className="h-4 w-4" />
          </span>
          <div className="mt-3 text-2xl font-extrabold text-foreground">{templateCount}</div>
          <div className="text-xs font-semibold text-muted-foreground">templates</div>
        </div>
        <div className="rounded-2xl bg-card p-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-foreground">
            <Users className="h-4 w-4" />
          </span>
          <div className="mt-3 text-2xl font-extrabold text-foreground">{activeClientCount}</div>
          <div className="text-xs font-semibold text-muted-foreground">active clients</div>
        </div>
        <div className="rounded-2xl bg-card p-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-foreground">
            <DollarSign className="h-4 w-4" />
          </span>
          <div className="mt-3 text-2xl font-extrabold text-foreground">
            ${pipelineValue.toLocaleString("en-US")}
          </div>
          <div className="text-xs font-semibold text-muted-foreground">pipeline value</div>
        </div>
        <div className="rounded-2xl bg-accent p-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-card text-emerald-700">
            <Check className="h-4 w-4" />
          </span>
          <div className="mt-3 text-2xl font-extrabold text-accent-foreground">
            ${wonThisMonth.toLocaleString("en-US")}
          </div>
          <div className="text-xs font-semibold text-accent-foreground/80">won this month</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-2xl bg-card p-6">
          <h2 className="mb-4 text-sm font-extrabold text-foreground">Recent activity</h2>
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing yet — activity shows up here once a client interacts with a portal.
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {activity.map((item, i) => {
                const colors = avatarColorsFor(item.clientName);
                return (
                  <div key={i} className="flex items-center gap-3 rounded-2xl px-2 py-2.5">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold"
                      style={{ backgroundColor: colors.bg, color: colors.text }}
                    >
                      {initialsFor(item.clientName)}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-foreground">{item.clientName}</div>
                      <div className="text-xs font-medium text-muted-foreground">{item.text}</div>
                    </div>
                    <div className="text-[11px] font-semibold text-muted-foreground">
                      {formatRelativeTime(item.at)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-card p-6">
          <h2 className="mb-4 text-sm font-extrabold text-foreground">Pipeline</h2>
          <div className="flex flex-col gap-4">
            {pipelineStages.map((stage) => (
              <div key={stage.key}>
                <div className="mb-1.5 flex items-center justify-between text-xs font-bold">
                  <span className={stage.key === "WON" ? "text-emerald-700" : "text-foreground"}>
                    {stage.label}
                  </span>
                  <span className={stage.key === "WON" ? "text-emerald-700" : "text-muted-foreground"}>
                    {stage.count}
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-secondary">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      stage.key === "WON" ? "bg-primary" : "bg-[#B7C3E8]"
                    )}
                    style={{ width: `${(stage.count / maxStageCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
