"use client";

import { Briefcase } from "lucide-react";
import { ListEditor } from "@/components/dashboard/list-editor";
import { PageHeader } from "@/components/dashboard/page-header";
import { Field, Input, Textarea } from "@/components/ui/field";
import { formatRange, uid } from "@/lib/utils";

export default function ExperiencePage() {
  return (
    <>
      <PageHeader title="Work experience" description="Drag to reorder. Most recent roles usually go first." />
      <ListEditor
        section="experiences"
        noun="experience"
        emptyIcon={Briefcase}
        emptyTitle="No experience yet"
        emptyDescription="Add your current role and a couple of past positions to build credibility."
        createItem={() => ({
          id: uid(),
          company: "",
          position: "",
          location: "",
          start_date: new Date().toISOString().slice(0, 7),
          end_date: null,
          description: "",
        })}
        summary={(e) => ({
          title: e.position && e.company ? `${e.position} · ${e.company}` : e.position || e.company,
          subtitle: e.start_date ? formatRange(e.start_date, e.end_date) : undefined,
        })}
        renderForm={({ item, update, error }) => (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Position" error={error("position")}>
              {(p) => <Input {...p} value={item.position} onChange={(e) => update({ position: e.target.value })} />}
            </Field>
            <Field label="Company" error={error("company")}>
              {(p) => <Input {...p} value={item.company} onChange={(e) => update({ company: e.target.value })} />}
            </Field>
            <Field label="Start date" error={error("start_date")}>
              {(p) => <Input {...p} type="month" value={item.start_date} onChange={(e) => update({ start_date: e.target.value })} />}
            </Field>
            <Field label="End date" error={error("end_date")}>
              {(p) => (
                <div className="space-y-2">
                  <Input
                    {...p}
                    type="month"
                    value={item.end_date ?? ""}
                    disabled={item.end_date === null}
                    min={item.start_date}
                    onChange={(e) => update({ end_date: e.target.value || null })}
                  />
                  <label className="flex items-center gap-2 text-sm text-zinc-600">
                    <input
                      type="checkbox"
                      className="size-4 rounded border-zinc-300 accent-brand"
                      checked={item.end_date === null}
                      onChange={(e) => update({ end_date: e.target.checked ? null : new Date().toISOString().slice(0, 7) })}
                    />
                    I currently work here
                  </label>
                </div>
              )}
            </Field>
            <Field label="Location" optional error={error("location")} className="sm:col-span-2">
              {(p) => <Input {...p} value={item.location ?? ""} onChange={(e) => update({ location: e.target.value })} />}
            </Field>
            <Field label="Description" optional error={error("description")} className="sm:col-span-2" hint="Focus on outcomes and impact.">
              {(p) => <Textarea {...p} rows={4} value={item.description} onChange={(e) => update({ description: e.target.value })} />}
            </Field>
          </div>
        )}
      />
    </>
  );
}
