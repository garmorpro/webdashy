"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Plus } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createClient, type ClientActionState } from "@/lib/actions/clients";

const FIELD_LABEL = "mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-muted-foreground";
const FIELD_INPUT = "h-12 rounded-2xl border-0 bg-secondary px-4 text-base font-semibold shadow-none";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="h-12 w-full rounded-full text-base font-extrabold">
      {pending ? "Adding..." : "Add Lead"}
    </Button>
  );
}

/**
 * Mobile-first "just the basics" way to log a lead on your phone — meant
 * for the moment right after meeting someone, not for a desk session.
 * Only asks for what createClient actually requires (business name,
 * contact name, email) plus phone as a quick optional extra; everything
 * else (industry, status, estimated value, notes) can be filled in later
 * from the full client form. Hidden on desktop (md:hidden on the trigger)
 * — the PageHeader's "Add New Client" button already covers that case.
 */
export function QuickAddLeadSheet() {
  const [state, formAction] = useActionState<ClientActionState, FormData>(createClient, {});

  return (
    <Sheet>
      <SheetTrigger
        render={
          <button
            type="button"
            aria-label="Quick add lead"
            className="fixed bottom-6 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_12px_26px_-8px_rgba(164,255,79,0.85)] transition-transform active:scale-95 md:hidden"
          />
        }
      >
        <Plus className="h-6 w-6" />
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className="max-h-[85vh] overflow-y-auto rounded-t-[1.75rem] border-0 px-6 pb-8 pt-3"
        showCloseButton={false}
      >
        <div className="mx-auto mb-4 h-1 w-10 shrink-0 rounded-full bg-border" />

        <SheetTitle className="text-lg font-extrabold text-foreground">Quick Add Lead</SheetTitle>
        <SheetDescription className="mt-0.5 text-sm text-muted-foreground">
          Just the basics — fill in the rest later.
        </SheetDescription>

        <form action={formAction} className="mt-5">
          {state?.error ? (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {state.error}
            </div>
          ) : null}

          <div className="flex flex-col gap-3.5">
            <div>
              <Label htmlFor="qa-businessName" className={FIELD_LABEL}>
                Business Name
              </Label>
              <Input
                id="qa-businessName"
                name="businessName"
                required
                placeholder="e.g. Coastal Bloom Florist"
                className={FIELD_INPUT}
              />
            </div>
            <div>
              <Label htmlFor="qa-contactName" className={FIELD_LABEL}>
                Contact Name
              </Label>
              <Input
                id="qa-contactName"
                name="contactName"
                required
                placeholder="e.g. Marisol Reyes"
                className={FIELD_INPUT}
              />
            </div>
            <div>
              <Label htmlFor="qa-email" className={FIELD_LABEL}>
                Email
              </Label>
              <Input
                id="qa-email"
                name="email"
                type="email"
                required
                placeholder="name@business.com"
                className={FIELD_INPUT}
              />
            </div>
            <div>
              <Label htmlFor="qa-phone" className={FIELD_LABEL}>
                Phone <span className="normal-case text-muted-foreground/70">(optional)</span>
              </Label>
              <Input
                id="qa-phone"
                name="phone"
                type="tel"
                placeholder="(555) 000-0000"
                className={FIELD_INPUT}
              />
            </div>
          </div>

          <div className="mt-6">
            <SubmitButton />
          </div>

          <SheetClose className="mt-3.5 w-full text-center text-sm font-semibold text-muted-foreground">
            Cancel
          </SheetClose>
        </form>
      </SheetContent>
    </Sheet>
  );
}
