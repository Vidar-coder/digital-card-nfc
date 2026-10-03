"use client";

import { Award, GraduationCap } from "lucide-react";
import { ListEditor } from "@/components/dashboard/list-editor";
import { PageHeader } from "@/components/dashboard/page-header";
import { Field, Input } from "@/components/ui/field";
import { uid } from "@/lib/utils";

const toYear = (v: string) => (v ? Number(v) : null);

export default function EducationPage() {
  return (
    <>
      <PageHeader title="Education" description="Schools, degrees and fields of study." />
      <ListEditor
        section="education"
        noun="education"
        emptyIcon={GraduationCap}
        emptyTitle="No education added"
        emptyDescription="Add your degree or relevant training."
        createItem={() => ({ id: uid(), school: "", degree: "", field: "", start_year: null, end_year: null })}
        summary={(e) => ({
          title: e.school,
          subtitle: [[e.degree, e.field].filter(Boolean).join(" in "), [e.start_year, e.end_year].filter(Boolean).join("–")]
            .filter(Boolean)
            .join(" · "),
        })}
        renderForm={({ item, update, error }) => (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="School" error={error("school")} className="sm:col-span-2">
              {(p) => <Input {...p} value={item.school} onChange={(e) => update({ school: e.target.value })} />}
            </Field>
            <Field label="Degree" error={error("degree")} hint="e.g. Bachelor of Science">
              {(p) => <Input {...p} value={item.degree} onChange={(e) => update({ degree: e.target.value })} />}
            </Field>
            <Field label="Field of study" error={error("field")}>
              {(p) => <Input {...p} value={item.field} onChange={(e) => update({ field: e.target.value })} />}
            </Field>
            <Field label="Start year" optional error={error("start_year")}>
              {(p) => (
                <Input {...p} type="number" inputMode="numeric" min={1950} max={2100} value={item.start_year ?? ""} onChange={(e) => update({ start_year: toYear(e.target.value) })} />
              )}
            </Field>
            <Field label="End year" optional error={error("end_year")} hint="Leave empty if ongoing">
              {(p) => (
                <Input {...p} type="number" inputMode="numeric" min={1950} max={2100} value={item.end_year ?? ""} onChange={(e) => update({ end_year: toYear(e.target.value) })} />
              )}
            </Field>
          </div>
        )}
      />

      <div className="mt-12">
        <PageHeader title="Certifications" description="Licenses and professional certifications." />
        <ListEditor
          section="certifications"
          noun="certification"
          emptyIcon={Award}
          emptyTitle="No certifications yet"
          emptyDescription="Licenses like CPA, CISA or vendor certifications build instant trust."
          createItem={() => ({ id: uid(), name: "", issuer: "", year: null, url: null })}
          summary={(c) => ({ title: c.name, subtitle: [c.issuer, c.year].filter(Boolean).join(" · ") })}
          renderForm={({ item, update, error }) => (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Certification name" error={error("name")} className="sm:col-span-2">
                {(p) => <Input {...p} value={item.name} onChange={(e) => update({ name: e.target.value })} />}
              </Field>
              <Field label="Issuer" optional error={error("issuer")}>
                {(p) => <Input {...p} value={item.issuer} onChange={(e) => update({ issuer: e.target.value })} />}
              </Field>
              <Field label="Year" optional error={error("year")}>
                {(p) => (
                  <Input {...p} type="number" inputMode="numeric" value={item.year ?? ""} onChange={(e) => update({ year: toYear(e.target.value) })} />
                )}
              </Field>
              <Field label="Credential URL" optional error={error("url")} className="sm:col-span-2">
                {(p) => (
                  <Input {...p} type="url" placeholder="https://" value={item.url ?? ""} onChange={(e) => update({ url: e.target.value || null })} />
                )}
              </Field>
            </div>
          )}
        />
      </div>
    </>
  );
}
