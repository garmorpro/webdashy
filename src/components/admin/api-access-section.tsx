"use client";

import { useState, useTransition } from "react";
import { Copy, KeyRound, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/components/admin/confirm-action-dialog";
import { regenerateApiKey, revokeApiKey } from "@/lib/actions/settings";

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

function copyToClipboard(value: string, label: string) {
  navigator.clipboard
    .writeText(value)
    .then(() => toast.success(`${label} copied`))
    .catch(() => toast.error(`Couldn't copy — copy it manually.`));
}

/**
 * Lets the admin issue a static API key for POST /api/leads (built for an
 * Apple Shortcut, but works from anything that can send a JSON POST with a
 * Bearer header). The raw key only ever exists in this component's local
 * state, right after regenerateApiKey returns it — it's never stored
 * anywhere in full, on the server or in the DB (see that action's comment).
 */
export function ApiAccessSection({
  webhookUrl,
  hasKey,
  keyPreview,
  createdAt,
}: {
  webhookUrl: string;
  hasKey: boolean;
  keyPreview: string | null;
  createdAt: Date | null;
}) {
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  // Mirrors the server-computed hasKey/keyPreview/createdAt props, but as
  // local state so generate/revoke can update the summary line immediately
  // — revalidatePath("/settings") only affects the *next* navigation to
  // this page, it doesn't reach back into this already-mounted component.
  const [keyInfo, setKeyInfo] = useState({ hasKey, keyPreview, createdAt });

  // Used directly for the first-ever "Generate Key" click (nothing to lose
  // yet, so no confirmation needed) — wrapped in its own transition since
  // there's no ConfirmActionDialog managing pending state for this path.
  function handleGenerateDirect() {
    startTransition(async () => {
      const result = await regenerateApiKey();
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setRevealedKey(result.apiKey);
      setKeyInfo({ hasKey: true, keyPreview: result.apiKey.slice(-4), createdAt: new Date() });
    });
  }

  // Passed to ConfirmActionDialog's onConfirm, which awaits it inside its
  // own transition and expects a thrown Error on failure (not a returned
  // {error} — regenerateApiKey's shape is for the direct path above).
  async function handleConfirmRegenerate() {
    const result = await regenerateApiKey();
    if ("error" in result) throw new Error(result.error);
    setRevealedKey(result.apiKey);
    setKeyInfo({ hasKey: true, keyPreview: result.apiKey.slice(-4), createdAt: new Date() });
    setConfirmOpen(false);
  }

  function handleRevoke() {
    startTransition(async () => {
      try {
        await revokeApiKey();
        setRevealedKey(null);
        setKeyInfo({ hasKey: false, keyPreview: null, createdAt: null });
        toast.success("API key revoked.");
      } catch {
        toast.error("Couldn't revoke the key. Please try again.");
      }
    });
  }

  return (
    <div className="rounded-xl bg-card p-6">
      <h2 className="text-sm font-extrabold text-foreground">API Access</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Add a lead from outside the app — an Apple Shortcut, a Zap, anything that can send a
        JSON POST.
      </p>

      <div className="mt-4">
        <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          Webhook URL
        </div>
        <div className="flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-xl bg-secondary px-3.5 py-2.5 text-sm font-semibold text-foreground">
            {webhookUrl}
          </code>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Copy webhook URL"
            onClick={() => copyToClipboard(webhookUrl, "Webhook URL")}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {revealedKey ? (
        <div className="mt-4 rounded-xl border border-primary bg-card p-4 shadow-[0_0_0_3px_rgba(164,255,79,0.18)]">
          <p className="text-xs font-bold text-foreground">
            Copy this key now — you won&apos;t be able to see it again.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-xl bg-secondary px-3.5 py-2.5 text-sm font-semibold text-foreground">
              {revealedKey}
            </code>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Copy API key"
              onClick={() => copyToClipboard(revealedKey, "API key")}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => setRevealedKey(null)}>
            Done, I copied it
          </Button>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <KeyRound className="h-4 w-4 shrink-0" />
            {keyInfo.hasKey ? (
              <span>
                Key ending in <span className="font-bold text-foreground">•••{keyInfo.keyPreview}</span>
                {keyInfo.createdAt ? ` · created ${dateFormatter.format(keyInfo.createdAt)}` : null}
              </span>
            ) : (
              <span>No API key yet — generate one to enable the webhook.</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {keyInfo.hasKey ? (
              <Button type="button" variant="outline" size="sm" onClick={handleRevoke} disabled={isPending}>
                Revoke
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              disabled={isPending}
              onClick={() => (keyInfo.hasKey ? setConfirmOpen(true) : handleGenerateDirect())}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {keyInfo.hasKey ? "Regenerate" : "Generate Key"}
            </Button>
          </div>
        </div>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        Send a POST with header <code className="rounded bg-secondary px-1 py-0.5">Authorization: Bearer &lt;key&gt;</code>{" "}
        and a JSON body — <code className="rounded bg-secondary px-1 py-0.5">businessName</code>,{" "}
        <code className="rounded bg-secondary px-1 py-0.5">contactName</code>, and{" "}
        <code className="rounded bg-secondary px-1 py-0.5">email</code> are required;{" "}
        <code className="rounded bg-secondary px-1 py-0.5">phone</code>,{" "}
        <code className="rounded bg-secondary px-1 py-0.5">industry</code>,{" "}
        <code className="rounded bg-secondary px-1 py-0.5">notes</code>, and{" "}
        <code className="rounded bg-secondary px-1 py-0.5">leadSource</code> are optional. New leads land
        on the Clients page with status Lead.
      </p>

      <ConfirmActionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Regenerate API key?"
        description="The current key stops working immediately — update your Shortcut with the new one, or it'll start failing."
        confirmLabel="Regenerate"
        pendingLabel="Regenerating..."
        destructive={false}
        onConfirm={handleConfirmRegenerate}
      />
    </div>
  );
}
