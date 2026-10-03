"use client";

import { useState } from "react";
import { saveBasicsAction } from "@/app/dashboard/actions";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input, Switch, Textarea } from "@/components/ui/field";
import { useDashboard, useSectionSave } from "./dashboard-context";
import { ImageUpload } from "./image-upload";
import { SaveBar } from "./save-bar";
import { UsernameField } from "./username-field";

const KEYS = ["username", "full_name", "title", "company", "tagline", "avatar_url", "cover_url", "published"] as const;

export function ProfileEditor() {
  const { draft, setField, siteUrl } = useDashboard();
  const [usernameOk, setUsernameOk] = useState(true);
  const { save, saving, dirty, discard, error } = useSectionSave([...KEYS], saveBasicsAction);

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title="Photo & cover" description="Your photo appears on your card, in shared links and in saved contacts." />
        <div className="space-y-6 p-5">
          <ImageUpload
            shape="circle"
            folder="avatars"
            label="Profile photo"
            value={draft.avatar_url}
            onChange={(v) => setField("avatar_url", v)}
          />
          <ImageUpload
            folder="covers"
            label="Cover image"
            hint="Optional — defaults to a gradient from your theme colors"
            value={draft.cover_url}
            onChange={(v) => setField("cover_url", v)}
          />
        </div>
      </Card>

      <Card>
        <CardHeader title="Identity" description="How you introduce yourself." />
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Full name" error={error("full_name")} className="sm:col-span-2">
            {(p) => (
              <Input {...p} value={draft.full_name} onChange={(e) => setField("full_name", e.target.value)} autoComplete="name" maxLength={80} />
            )}
          </Field>
          <Field label="Professional title" error={error("title")} hint="e.g. SAP Audit Staff & Web Developer">
            {(p) => <Input {...p} value={draft.title} onChange={(e) => setField("title", e.target.value)} maxLength={120} />}
          </Field>
          <Field label="Company / organization" optional error={error("company")}>
            {(p) => (
              <Input {...p} value={draft.company} onChange={(e) => setField("company", e.target.value)} autoComplete="organization" maxLength={120} />
            )}
          </Field>
          <Field
            label="Short introduction"
            error={error("tagline")}
            hint={`${draft.tagline.length}/280 · Shown under your name and used as your link preview description.`}
            className="sm:col-span-2"
          >
            {(p) => (
              <Textarea {...p} rows={3} value={draft.tagline} onChange={(e) => setField("tagline", e.target.value)} maxLength={280} />
            )}
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader title="Profile URL" description="Pick a short, memorable username." />
        <div className="space-y-5 p-5">
          <UsernameField
            value={draft.username}
            onChange={(v) => setField("username", v)}
            siteUrl={siteUrl}
            serverError={error("username")}
            onAvailabilityChange={setUsernameOk}
          />
          <Switch
            checked={draft.published}
            onChange={(v) => setField("published", v)}
            label="Card is public"
            description="When off, your profile URL shows a 'not active' page. Your NFC card keeps working once you turn it back on."
          />
        </div>
      </Card>

      <SaveBar
        dirty={dirty}
        saving={saving}
        onSave={() => {
          if (!usernameOk) return;
          void save();
        }}
        onDiscard={discard}
      />
    </div>
  );
}
