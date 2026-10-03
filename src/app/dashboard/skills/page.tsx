"use client";

import { Plus, Wrench, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { saveListAction } from "@/app/dashboard/actions";
import { useDashboard, useSectionSave } from "@/components/dashboard/dashboard-context";
import { PageHeader } from "@/components/dashboard/page-header";
import { SaveBar } from "@/components/dashboard/save-bar";
import { DragHandle, SortableList } from "@/components/dashboard/sortable-list";
import { Button } from "@/components/ui/button";
import { Card, EmptyState } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { cn, uid } from "@/lib/utils";

const SUGGESTIONS = ["Leadership", "Project Management", "Data Analysis", "Communication", "Excel", "SQL", "Figma", "Public Speaking"];

export default function SkillsPage() {
  const { draft, setField } = useDashboard();
  const [input, setInput] = useState("");
  const { save, saving, dirty, discard } = useSectionSave(["skills"], (v) => saveListAction("skills", v.skills));
  const skills = draft.skills;

  function add(raw: string) {
    // Comma-separated input adds several at once.
    const names = raw.split(",").map((s) => s.trim()).filter(Boolean);
    const existing = new Set(skills.map((s) => s.name.toLowerCase()));
    const fresh = names.filter((n) => !existing.has(n.toLowerCase()) && n.length <= 40);
    if (names.length && !fresh.length) toast.info("Already in your list");
    if (skills.length + fresh.length > 60) return toast.error("You can add up to 60 skills");
    if (fresh.length) setField("skills", [...skills, ...fresh.map((name) => ({ id: uid(), name }))]);
    setInput("");
  }

  return (
    <>
      <PageHeader title="Skills" description="Shown as tags on your card. Drag to put your strongest skills first." />
      <Card className="p-5">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            add(input);
          }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a skill and press Enter (comma-separate for many)"
            aria-label="New skill"
            maxLength={200}
          />
          <Button type="submit" disabled={!input.trim()}>
            <Plus className="size-4" /> Add
          </Button>
        </form>

        <div className="mt-5">
          {skills.length === 0 ? (
            <EmptyState icon={Wrench} title="No skills yet" description="Add the tools, domains and strengths you want to be known for." />
          ) : (
            <SortableList items={skills} onReorder={(s) => setField("skills", s)} layout="grid" className="flex flex-wrap gap-2">
              {(skill, _i, handle, dragging) => (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 rounded-full border border-zinc-200 bg-white py-0.5 pl-0.5 pr-1 text-sm font-medium text-zinc-800 shadow-xs",
                    dragging && "shadow-lg ring-2 ring-brand/30",
                  )}
                >
                  <DragHandle {...handle} label={`Reorder ${skill.name}`} />
                  {skill.name}
                  <button
                    type="button"
                    onClick={() => setField("skills", skills.filter((s) => s.id !== skill.id))}
                    className="ml-1 rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-red-600"
                    aria-label={`Remove ${skill.name}`}
                  >
                    <X className="size-3.5" />
                  </button>
                </span>
              )}
            </SortableList>
          )}
        </div>

        <div className="mt-6 border-t border-zinc-100 pt-4">
          <p className="mb-2 text-xs font-medium text-zinc-500">Suggestions</p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.filter((s) => !skills.some((k) => k.name.toLowerCase() === s.toLowerCase())).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => add(s)}
                className="rounded-full border border-dashed border-zinc-300 px-2.5 py-1 text-xs text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>
      </Card>
      <SaveBar dirty={dirty} saving={saving} onSave={() => void save()} onDiscard={discard} />
    </>
  );
}
