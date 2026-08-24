"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { BOARD_COLUMNS, boardColumnKey } from "@/lib/client-status";
import { formatRelativeTime, cn } from "@/lib/utils";
import type { Client } from "@prisma/client";

function money(n: number) {
  return `$${n.toLocaleString("en-US")}`;
}

export function ClientsBoard({ clients }: { clients: Client[] }) {
  const router = useRouter();

  const columns = useMemo(() => {
    return BOARD_COLUMNS.map((col) => ({
      ...col,
      clients: clients.filter((c) => boardColumnKey(c.status) === col.key),
    }));
  }, [clients]);

  const activeCols = columns.filter((c) => c.key !== "WON" && c.key !== "LOST");
  const activeCount = activeCols.reduce((sum, c) => sum + c.clients.length, 0);
  const pipelineValue = activeCols
    .flatMap((c) => c.clients)
    .reduce((sum, c) => sum + Number(c.estimatedValue ?? 0), 0);
  const wonColumn = columns.find((c) => c.key === "WON")!;
  const wonValue = wonColumn.clients.reduce((sum, c) => sum + Number(c.estimatedValue ?? 0), 0);

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Total Clients
          </div>
          <div className="mt-1 text-2xl font-extrabold text-foreground">{clients.length}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Active Pipeline
          </div>
          <div className="mt-1 text-2xl font-extrabold text-foreground">{activeCount}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">across {activeCols.length} stages</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Pipeline Value
          </div>
          <div className="mt-1 text-2xl font-extrabold text-foreground">{money(pipelineValue)}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">not yet won or lost</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Won</div>
          <div className="mt-1 text-2xl font-extrabold text-foreground">{money(wonValue)}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {wonColumn.clients.length} client{wonColumn.clients.length === 1 ? "" : "s"}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex items-start gap-3.5">
          {columns.map((col) => (
            <div key={col.key} className="w-[248px] shrink-0">
              <div className="mb-2.5 flex items-center justify-between gap-2 px-1">
                <span className="text-xs font-bold text-foreground">{col.label}</span>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                  {col.clients.length}
                </span>
              </div>
              <div
                className={cn(
                  "mb-2.5 h-[3px] rounded-full",
                  col.key === "LOST" ? "bg-rose-200" : "bg-border"
                )}
              />
              <div className="flex flex-col gap-2">
                {col.clients.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => router.push(`/clients/${client.id}`)}
                    className={cn(
                      "rounded-[10px] border border-border bg-card p-2.5 text-left transition-shadow hover:border-primary hover:shadow-md",
                      col.key === "LOST" && "opacity-60"
                    )}
                  >
                    <div className="text-sm font-bold text-foreground">{client.businessName}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{client.contactName}</div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">
                        {client.estimatedValue ? money(Number(client.estimatedValue)) : "—"}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {formatRelativeTime(client.updatedAt)}
                      </span>
                    </div>
                    {client.industry ? (
                      <span className="mt-1.5 inline-block rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                        {client.industry}
                      </span>
                    ) : null}
                  </button>
                ))}
                {col.clients.length === 0 ? (
                  <p className="px-1 py-2 text-xs text-muted-foreground">No clients here</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
