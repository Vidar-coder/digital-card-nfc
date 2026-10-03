"use client";

import { Sparkles } from "lucide-react";
import { ListEditor } from "@/components/dashboard/list-editor";
import { PageHeader } from "@/components/dashboard/page-header";
import { serviceIcon, SERVICE_ICONS } from "@/components/profile/service-icons";
import { Field, Input, Textarea } from "@/components/ui/field";
import { cn, uid } from "@/lib/utils";

export default function ServicesPage() {
  return (
    <>
      <PageHeader title="Services" description="What people can hire or work with you for." />
      <ListEditor
        section="services"
        noun="service"
        emptyIcon={Sparkles}
        emptyTitle="No services yet"
        emptyDescription="List 2–4 services so visitors immediately know how you can help."
        createItem={() => ({ id: uid(), name: "", description: "", icon: "sparkles" })}
        summary={(s) => {
          const Icon = serviceIcon(s.icon);
          return {
            title: s.name,
            subtitle: s.description,
            media: (
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-brand">
                <Icon className="size-4" />
              </span>
            ),
          };
        }}
        renderForm={({ item, update, error }) => (
          <div className="grid gap-4">
            <Field label="Service name" error={error("name")}>
              {(p) => <Input {...p} value={item.name} onChange={(e) => update({ name: e.target.value })} maxLength={80} />}
            </Field>
            <Field label="Description" optional error={error("description")}>
              {(p) => <Textarea {...p} rows={3} value={item.description} onChange={(e) => update({ description: e.target.value })} maxLength={500} />}
            </Field>
            <fieldset>
              <legend className="mb-1.5 text-sm font-medium text-zinc-800">Icon</legend>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(SERVICE_ICONS).map(([key, { icon: Icon, label }]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => update({ icon: key })}
                    aria-label={label}
                    aria-pressed={item.icon === key}
                    title={label}
                    className={cn(
                      "flex size-10 items-center justify-center rounded-lg border bg-white text-zinc-600 transition hover:border-zinc-400",
                      item.icon === key ? "border-brand bg-indigo-50 text-brand ring-2 ring-brand/20" : "border-zinc-200",
                    )}
                  >
                    <Icon className="size-4" />
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        )}
      />
    </>
  );
}
