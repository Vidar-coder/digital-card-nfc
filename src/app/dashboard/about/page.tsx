"use client";

import { saveAboutAction } from "@/app/dashboard/actions";
import { useDashboard, useSectionSave } from "@/components/dashboard/dashboard-context";
import { PageHeader } from "@/components/dashboard/page-header";
import { RichTextEditor } from "@/components/dashboard/rich-text-editor";
import { SaveBar } from "@/components/dashboard/save-bar";

export default function AboutPage() {
  const { draft, setField } = useDashboard();
  const { save, saving, dirty, discard } = useSectionSave(["about_html"], saveAboutAction);

  return (
    <>
      <PageHeader
        title="About me"
        description="A few short paragraphs about who you are, what you do and what you're great at."
      />
      <RichTextEditor value={draft.about_html} onChange={(html) => setField("about_html", html)} />
      <p className="mt-2 text-xs text-zinc-500">
        Tip: keep it scannable — visitors usually read this on a phone, right after tapping your card.
      </p>
      <SaveBar dirty={dirty} saving={saving} onSave={() => void save()} onDiscard={discard} />
    </>
  );
}
