"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
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
import { slugify } from "@/lib/utils";
import type { TemplateActionState } from "@/lib/actions/templates";
import type { Category, TemplateStatus } from "@prisma/client";

export type TemplateFormValues = {
  name: string;
  slug: string;
  categoryId: string;
  status: TemplateStatus;
  description: string;
  tags: string;
  thumbnailUrl: string;
  desktopScreenshotUrl: string;
  mobileScreenshotUrl: string;
  previewUrl: string;
  repositoryUrl: string;
};

const emptyValues: TemplateFormValues = {
  name: "",
  slug: "",
  categoryId: "",
  status: "DRAFT",
  description: "",
  tags: "",
  thumbnailUrl: "",
  desktopScreenshotUrl: "",
  mobileScreenshotUrl: "",
  previewUrl: "",
  repositoryUrl: "",
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : label}
    </Button>
  );
}

export function TemplateForm({
  action,
  categories,
  defaultValues,
  submitLabel,
  cancelHref,
}: {
  action: (state: TemplateActionState, formData: FormData) => Promise<TemplateActionState>;
  categories: Category[];
  defaultValues?: Partial<TemplateFormValues>;
  submitLabel: string;
  cancelHref: string;
}) {
  const values = { ...emptyValues, ...defaultValues };
  const [state, formAction] = useActionState(action, {});
  const [name, setName] = useState(values.name);
  const [slug, setSlug] = useState(values.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(values.slug));

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      {state?.error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      <div className="space-y-4 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">Basic Information</h2>

        <div className="space-y-1.5">
          <Label htmlFor="name">Template Name</Label>
          <Input
            id="name"
            name="name"
            required
            value={name}
            onChange={(e) => {
              const v = e.target.value;
              setName(v);
              if (!slugTouched) setSlug(slugify(v));
            }}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="slug">Template Slug</Label>
          <Input
            id="slug"
            name="slug"
            value={slug}
            placeholder="auto-generated-from-name"
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={values.description}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="categoryId">Category</Label>
            <Select name="categoryId" defaultValue={values.categoryId || undefined}>
              <SelectTrigger id="categoryId" className="w-full">
                {/* Base UI's SelectValue only resolves a label from items
                    registered inside the (lazily-mounted) popup — before
                    it's ever been opened once, that map is empty and it
                    falls back to printing the raw id. An explicit children
                    render-prop bypasses that lookup entirely. */}
                <SelectValue placeholder="Select a category">
                  {(value) => categories.find((c) => c.id === value)?.name ?? String(value)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue={values.status}>
              <SelectTrigger id="status" className="w-full">
                {/* See the category Select above for why this needs an
                    explicit children render-prop. */}
                <SelectValue className="capitalize">
                  {(value) => String(value).toLowerCase()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tags">Tags</Label>
          <Input id="tags" name="tags" defaultValue={values.tags} placeholder="modern, bold, contractor" />
          <p className="text-xs text-muted-foreground">Comma-separated.</p>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">Preview</h2>

        <div className="space-y-1.5">
          <Label htmlFor="thumbnailUrl">Thumbnail Image URL</Label>
          <Input id="thumbnailUrl" name="thumbnailUrl" type="url" defaultValue={values.thumbnailUrl} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="desktopScreenshotUrl">Desktop Screenshot URL</Label>
            <Input
              id="desktopScreenshotUrl"
              name="desktopScreenshotUrl"
              type="url"
              defaultValue={values.desktopScreenshotUrl}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mobileScreenshotUrl">Mobile Screenshot URL</Label>
            <Input
              id="mobileScreenshotUrl"
              name="mobileScreenshotUrl"
              type="url"
              defaultValue={values.mobileScreenshotUrl}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">URLs</h2>

        <div className="space-y-1.5">
          <Label htmlFor="previewUrl">Live Demo URL</Label>
          <Input id="previewUrl" name="previewUrl" type="url" defaultValue={values.previewUrl} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="repositoryUrl">Repository URL</Label>
          <Input id="repositoryUrl" name="repositoryUrl" type="url" defaultValue={values.repositoryUrl} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <SubmitButton label={submitLabel} />
        <Button variant="outline" render={<Link href={cancelHref} />}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
