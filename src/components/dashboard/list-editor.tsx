"use client";

import { ChevronDown, Pencil, Plus, Trash2, type LucideIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { saveListAction } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Card, EmptyState } from "@/components/ui/card";
import { useConfirm } from "@/components/ui/confirm-dialog";
import type { FullProfile, ListSection } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDashboard, useSectionSave } from "./dashboard-context";
import { SaveBar } from "./save-bar";
import { DragHandle, SortableList } from "./sortable-list";

type Item<S extends ListSection> = FullProfile[S][number];

interface Props<S extends ListSection> {
  section: S;
  noun: string; // "experience", "project" …
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
  createItem: () => Item<S>;
  summary: (item: Item<S>) => { title: string; subtitle?: string; media?: ReactNode };
  renderForm: (props: {
    item: Item<S>;
    update: (patch: Partial<Item<S>>) => void;
    error: (field: string) => string | undefined;
  }) => ReactNode;
}

/**
 * Generic editor for ordered collections (experience, education, projects…):
 * collapsible rows, drag-to-reorder, add/delete with confirmation, one save.
 */
export function ListEditor<S extends ListSection>({
  section,
  noun,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  createItem,
  summary,
  renderForm,
}: Props<S>) {
  const { draft, setField } = useDashboard();
  const confirm = useConfirm();
  const items = draft[section] as Item<S>[];
  const [open, setOpen] = useState<string | null>(null);

  const { save, saving, dirty, discard, errors } = useSectionSave([section], (v) => saveListAction(section, v[section]));

  const setItems = (next: Item<S>[]) => setField(section, next as FullProfile[S]);

  const add = () => {
    const item = createItem();
    setItems([...items, item]);
    setOpen(item.id);
  };

  const remove = async (item: Item<S>) => {
    const { title } = summary(item);
    const ok = await confirm({
      title: `Delete this ${noun}?`,
      description: `"${title || "Untitled"}" will be removed from your card after you save.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (ok) setItems(items.filter((i) => i.id !== item.id));
  };

  const errorsFor = (index: number) => (field: string) => errors[`${index}.${field}`]?.[0];
  const hasErrors = (index: number) => Object.keys(errors).some((k) => k.startsWith(`${index}.`));

  const onSave = async () => {
    const res = await save();
    if (res.ok) return;
    // Expand the first item that has validation errors.
    const firstBad = Object.keys(res.fieldErrors)
      .map((k) => Number(k.split(".")[0]))
      .filter((n) => !Number.isNaN(n))
      .sort((a, b) => a - b)[0];
    if (firstBad !== undefined && items[firstBad]) setOpen(items[firstBad].id);
  };

  return (
    <>
      {items.length === 0 ? (
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDescription}
          action={
            <Button onClick={add}>
              <Plus className="size-4" /> Add {noun}
            </Button>
          }
        />
      ) : (
        <>
          <SortableList items={items} onReorder={setItems} className="space-y-3">
            {(item, index, handle, dragging) => {
              const s = summary(item);
              const expanded = open === item.id;
              return (
                <Card className={cn("overflow-hidden transition-shadow", dragging && "shadow-xl ring-2 ring-brand/30", hasErrors(index) && "ring-2 ring-red-300")}>
                  <div className="flex items-center gap-2 p-2 pr-3">
                    <DragHandle {...handle} label={`Reorder ${s.title || noun}`} />
                    {s.media}
                    <button
                      type="button"
                      onClick={() => setOpen(expanded ? null : item.id)}
                      className="min-w-0 flex-1 py-1 text-left"
                      aria-expanded={expanded}
                    >
                      <p className="truncate text-sm font-medium text-zinc-900">{s.title || <span className="text-zinc-400">Untitled {noun}</span>}</p>
                      {s.subtitle && <p className="truncate text-xs text-zinc-500">{s.subtitle}</p>}
                    </button>
                    <Button variant="ghost" size="icon" onClick={() => setOpen(expanded ? null : item.id)} aria-label={expanded ? "Collapse" : "Edit"}>
                      {expanded ? <ChevronDown className="size-4 rotate-180" /> : <Pencil className="size-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(item)} aria-label={`Delete ${noun}`} className="hover:bg-red-50 hover:text-red-600">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  {expanded && (
                    <div className="border-t border-zinc-100 bg-zinc-50/50 p-4 sm:p-5">
                      {renderForm({
                        item,
                        update: (p) => setItems(items.map((i) => (i.id === item.id ? { ...i, ...p } : i))),
                        error: errorsFor(index),
                      })}
                    </div>
                  )}
                </Card>
              );
            }}
          </SortableList>
          <Button variant="outline" className="mt-3 w-full border-dashed" onClick={add}>
            <Plus className="size-4" /> Add {noun}
          </Button>
        </>
      )}
      <SaveBar dirty={dirty} saving={saving} onSave={() => void onSave()} onDiscard={discard} label={`Save ${noun === "education" ? "education" : `${noun}s`}`} />
    </>
  );
}
