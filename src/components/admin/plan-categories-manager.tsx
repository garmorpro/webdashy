"use client";

import { useState, useTransition } from "react";
import { Plus, ChevronUp, ChevronDown, Pencil, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createPlanCategory,
  renamePlanCategory,
  movePlanCategory,
  deletePlanCategory,
} from "@/lib/actions/plan-categories";
import type { PlanCategory } from "@prisma/client";

/**
 * Manages the tabs clients see on the portal (e.g. "Websites" / "Reviews" /
 * "Website + Reviews") — deliberately lightweight (name + order only)
 * compared to PlansManager, since a category is just a label and a
 * position, not a pricing tier with its own fields.
 */
export function PlanCategoriesManager({ categories }: { categories: PlanCategory[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [isPending, startTransition] = useTransition();

  function startEdit(category: PlanCategory) {
    setEditingId(category.id);
    setEditValue(category.name);
  }

  function saveEdit(categoryId: string) {
    const name = editValue.trim();
    if (!name) return;
    startTransition(async () => {
      try {
        const result = await renamePlanCategory(categoryId, name);
        if (result?.error) {
          toast.error(result.error);
          return;
        }
        setEditingId(null);
      } catch {
        toast.error("Couldn't rename this category. Please try again.");
      }
    });
  }

  function move(category: PlanCategory, direction: "up" | "down") {
    startTransition(async () => {
      try {
        await movePlanCategory(category.id, direction);
      } catch {
        toast.error("Couldn't reorder categories. Please try again.");
      }
    });
  }

  function remove(category: PlanCategory) {
    startTransition(async () => {
      try {
        await deletePlanCategory(category.id);
        toast.success(`${category.name} deleted.`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't delete this category.");
      }
    });
  }

  function addCategory() {
    const name = newName.trim();
    if (!name) return;
    startTransition(async () => {
      try {
        const result = await createPlanCategory(name);
        if (result?.error) {
          toast.error(result.error);
          return;
        }
        setNewName("");
        setAdding(false);
      } catch {
        toast.error("Couldn't add this category. Please try again.");
      }
    });
  }

  return (
    <div className="mb-6 border-b border-border/60 pb-5">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 className="text-sm font-extrabold text-foreground">Plan Categories</h2>
        {!adding ? (
          <Button size="sm" variant="outline" className="bg-card" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
        ) : null}
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        Shown as tabs on the client portal for browsing plans (e.g. &ldquo;Websites&rdquo;,
        &ldquo;Reviews&rdquo;) — assign each plan to one from its own Edit dialog.
      </p>

      {categories.length === 0 && !adding ? (
        <p className="text-sm text-muted-foreground">
          No categories yet — plans without one show under a generic &ldquo;Other&rdquo; tab.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {categories.map((category, i) => (
            <div
              key={category.id}
              className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2"
            >
              <div className="flex flex-col">
                <button
                  type="button"
                  disabled={i === 0}
                  onClick={() => move(category, "up")}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  aria-label={`Move ${category.name} up`}
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  disabled={i === categories.length - 1}
                  onClick={() => move(category, "down")}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  aria-label={`Move ${category.name} down`}
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>

              {editingId === category.id ? (
                <>
                  <Input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveEdit(category.id)}
                    className="h-8 flex-1 bg-card"
                  />
                  <Button size="icon-sm" disabled={isPending} onClick={() => saveEdit(category.id)}>
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => setEditingId(null)}
                    aria-label="Cancel"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-bold text-foreground">{category.name}</span>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => startEdit(category)}
                    aria-label={`Rename ${category.name}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    disabled={isPending}
                    onClick={() => remove(category)}
                    aria-label={`Delete ${category.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {adding ? (
        <div className="mt-2 flex items-center gap-2">
          <Input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCategory()}
            placeholder="e.g. Websites"
            className="h-8 flex-1"
          />
          <Button size="sm" disabled={isPending} onClick={addCategory}>
            Add
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setAdding(false);
              setNewName("");
            }}
          >
            Cancel
          </Button>
        </div>
      ) : null}
    </div>
  );
}
