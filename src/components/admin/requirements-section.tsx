"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { ClipboardList, Pencil, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionLocked } from "@/components/admin/section-locked";
import { saveRequirements } from "@/lib/actions/requirements";
import { REQUIREMENT_FEATURES } from "@/lib/requirement-features";
import { CONTENT_STATUS_LABELS } from "@/lib/delivery-status";
import type { ProjectRequirements, ContentStatus } from "@prisma/client";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save Requirements"}
    </Button>
  );
}

export function RequirementsSection({
  portalId,
  clientId,
  requirements,
  locked,
  questionnaireDefaults,
}: {
  portalId: string;
  clientId: string;
  requirements: ProjectRequirements | null;
  locked: boolean;
  questionnaireDefaults?: {
    pages: string;
    launchTimeline: string;
    customerActions: string;
    pagesNeedingUpdates: string;
    googleAnalytics: string;
  } | null;
}) {
  const action = saveRequirements.bind(null, portalId, clientId);
  const [state, formAction] = useActionState(action, {});
  const [editing, setEditing] = useState(!requirements);

  const initialPages =
    requirements?.pages.join(", ") ?? questionnaireDefaults?.pages ?? "";
  const [pagesText, setPagesText] = useState(initialPages);
  const pageCount = pagesText
    .split(",")
    .map((page) => page.trim())
    .filter(Boolean).length;

  const questionnaireLaunchDate = (() => {
    const raw = questionnaireDefaults?.launchTimeline?.trim();
    if (!raw) return "";

    const match = raw.match(/\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})\b/);
    if (!match) return "";

    const [, month, day, year] = match;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  })();

  // Close the form back to the summary view on a successful save. Adjusted
  // during render (comparing against the last-seen state) rather than in a
  // useEffect, per React's guidance for state derived from a prop/state
  // change — see https://react.dev/learn/you-might-not-need-an-effect.
  const [lastState, setLastState] = useState(state);
  if (state !== lastState) {
    setLastState(state);
    if (state?.success) setEditing(false);
  }

  if (locked) {
    return (
      <SectionLocked
        title="Project Requirements"
        icon={ClipboardList}
        reason="Available once the client selects a template and plan on their portal."
      />
    );
  }

  if (requirements && !editing) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
            Project Requirements
          </h2>
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        </div>
        <div className="mt-3 flex items-start gap-2 text-sm text-foreground">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <span>
            {requirements.pages.length} page{requirements.pages.length === 1 ? "" : "s"} ·{" "}
            {requirements.features.length} feature{requirements.features.length === 1 ? "" : "s"} ·
            content: <b>{CONTENT_STATUS_LABELS[requirements.contentStatus].toLowerCase()}</b>
            {requirements.targetLaunchDate
              ? ` · target ${new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(requirements.targetLaunchDate)}`
              : ""}
          </span>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-primary bg-card p-5 shadow-[0_0_0_3px_rgba(164,255,79,0.18)]">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <ClipboardList className="h-4 w-4 text-muted-foreground" />
        Project Requirements
      </h2>

      {state?.error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="req-pages">Pages needed</Label>
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
            {pageCount} {pageCount === 1 ? "page" : "pages"}
          </span>
        </div>
        <Input
          id="req-pages"
          name="pages"
          placeholder="Home, About, Services, Gallery, Contact"
          value={pagesText}
          onChange={(event) => setPagesText(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">Comma-separated.</p>
      </div>

      <div className="space-y-1.5">
        <Label>Key features</Label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {REQUIREMENT_FEATURES.map((feature) => (
            <label key={feature} className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                name="features"
                value={feature}
                defaultChecked={requirements?.features.includes(feature)}
                className="h-4 w-4 accent-primary"
              />
              {feature}
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="req-content">Content status</Label>
          <Select name="contentStatus" defaultValue={requirements?.contentStatus ?? "CLIENT_PROVIDED"}>
            <SelectTrigger id="req-content" className="w-full">
              {/* See client-form.tsx's status Select for why this needs an
                  explicit children render-prop rather than a bare <SelectValue />. */}
              <SelectValue>
                {(value) => CONTENT_STATUS_LABELS[value as ContentStatus] ?? String(value)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(CONTENT_STATUS_LABELS) as ContentStatus[]).map((cs) => (
                <SelectItem key={cs} value={cs}>
                  {CONTENT_STATUS_LABELS[cs]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="req-date">Target launch date</Label>
          <Input
            id="req-date"
            name="targetLaunchDate"
            type="date"
            defaultValue={
              requirements?.targetLaunchDate
                ? requirements.targetLaunchDate.toISOString().slice(0, 10)
                : questionnaireLaunchDate
            }
          />
        </div>
      </div>

      {questionnaireDefaults ? (
        <div className="rounded-xl border bg-muted/30 p-4">
          <div className="text-sm font-semibold text-foreground">
            Questionnaire context
          </div>

          <div className="mt-3 grid gap-3 text-sm">
            {questionnaireDefaults.launchTimeline ? (
              <div>
                <span className="font-medium">Launch timeline:</span>{" "}
                <span className="text-muted-foreground">
                  {questionnaireDefaults.launchTimeline}
                </span>
              </div>
            ) : null}

            {questionnaireDefaults.customerActions ? (
              <div>
                <span className="font-medium">Customer actions:</span>{" "}
                <span className="text-muted-foreground">
                  {questionnaireDefaults.customerActions}
                </span>
              </div>
            ) : null}

            {questionnaireDefaults.pagesNeedingUpdates ? (
              <div>
                <span className="font-medium">Ongoing updates:</span>{" "}
                <span className="text-muted-foreground">
                  {questionnaireDefaults.pagesNeedingUpdates}
                </span>
              </div>
            ) : null}

            {questionnaireDefaults.googleAnalytics ? (
              <div>
                <span className="font-medium">Google Analytics:</span>{" "}
                <span className="text-muted-foreground">
                  {questionnaireDefaults.googleAnalytics}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="req-notes">Additional notes</Label>
        <Textarea id="req-notes" name="notes" rows={3} defaultValue={requirements?.notes ?? ""} />
      </div>

      <div className="flex items-center gap-2">
        <SubmitButton />
        {requirements ? (
          <Button type="button" variant="outline" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
