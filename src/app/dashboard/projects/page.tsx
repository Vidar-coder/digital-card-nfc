"use client";

import { Layers } from "lucide-react";
import { ImageUpload } from "@/components/dashboard/image-upload";
import { ListEditor } from "@/components/dashboard/list-editor";
import { PageHeader } from "@/components/dashboard/page-header";
import { TagInput } from "@/components/dashboard/tag-input";
import { Field, Input, Textarea } from "@/components/ui/field";
import { uid } from "@/lib/utils";

export default function ProjectsPage() {
  return (
    <>
      <PageHeader title="Portfolio" description="Showcase your best work. The first two projects get the most attention." />
      <ListEditor
        section="projects"
        noun="project"
        emptyIcon={Layers}
        emptyTitle="No projects yet"
        emptyDescription="Add a project with an image and a link — it's the fastest way to show what you can do."
        createItem={() => ({
          id: uid(),
          title: "",
          description: "",
          image_url: null,
          technologies: [],
          project_url: null,
          github_url: null,
        })}
        summary={(p) => ({
          title: p.title,
          subtitle: p.technologies.join(" · "),
          media: (
            <span className="flex h-9 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
              {p.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image_url} alt="" className="size-full object-cover" />
              ) : (
                <Layers className="size-4 opacity-70" />
              )}
            </span>
          ),
        })}
        renderForm={({ item, update, error }) => (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <ImageUpload folder="projects" label="Project image" value={item.image_url} onChange={(v) => update({ image_url: v })} />
            </div>
            <Field label="Title" error={error("title")} className="sm:col-span-2">
              {(p) => <Input {...p} value={item.title} onChange={(e) => update({ title: e.target.value })} maxLength={120} />}
            </Field>
            <Field label="Description" optional error={error("description")} className="sm:col-span-2">
              {(p) => <Textarea {...p} rows={3} value={item.description} onChange={(e) => update({ description: e.target.value })} maxLength={1000} />}
            </Field>
            <Field label="Technologies" optional hint="Press Enter or comma to add" className="sm:col-span-2" error={error("technologies")}>
              {(p) => <TagInput id={p.id} value={item.technologies} onChange={(v) => update({ technologies: v })} placeholder="Next.js, Python…" />}
            </Field>
            <Field label="Project URL" optional error={error("project_url")}>
              {(p) => (
                <Input {...p} type="url" placeholder="https://" value={item.project_url ?? ""} onChange={(e) => update({ project_url: e.target.value || null })} />
              )}
            </Field>
            <Field label="GitHub URL" optional error={error("github_url")}>
              {(p) => (
                <Input {...p} type="url" placeholder="https://github.com/…" value={item.github_url ?? ""} onChange={(e) => update({ github_url: e.target.value || null })} />
              )}
            </Field>
          </div>
        )}
      />
    </>
  );
}
