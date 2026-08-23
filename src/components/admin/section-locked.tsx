import { Lock } from "lucide-react";

/** Shared "not your turn yet" visual for the client-detail workflow cards. */
export function SectionLocked({ title, icon: Icon, reason }: { title: string; icon: React.ElementType; reason: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-5 opacity-60">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Icon className="h-4 w-4" />
        {title}
      </h2>
      <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
        <Lock className="h-3.5 w-3.5" />
        {reason}
      </p>
    </div>
  );
}
