"use client";

import { saveContactAction } from "@/app/dashboard/actions";
import { useDashboard, useSectionSave } from "@/components/dashboard/dashboard-context";
import { PageHeader } from "@/components/dashboard/page-header";
import { SaveBar } from "@/components/dashboard/save-bar";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/field";

const KEYS = ["email", "phone", "website", "location", "address"] as const;

export default function ContactPage() {
  const { draft, setField } = useDashboard();
  const { save, saving, dirty, discard, error } = useSectionSave([...KEYS], saveContactAction);

  return (
    <>
      <PageHeader
        title="Contact information"
        description="Powers the Call, Message, Email and Save Contact buttons on your card."
      />
      <div className="space-y-5">
        <Card>
          <CardHeader title="Reach me" description="Only filled-in fields are shown on your card." />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Phone number" error={error("phone")} hint="Include your country code, e.g. +63 917 555 0142">
              {(p) => (
                <Input {...p} type="tel" inputMode="tel" autoComplete="tel" value={draft.phone} onChange={(e) => setField("phone", e.target.value)} />
              )}
            </Field>
            <Field label="Email" error={error("email")}>
              {(p) => (
                <Input {...p} type="email" autoComplete="email" value={draft.email} onChange={(e) => setField("email", e.target.value)} />
              )}
            </Field>
            <Field label="Website" optional error={error("website")} className="sm:col-span-2">
              {(p) => (
                <Input
                  {...p}
                  type="url"
                  inputMode="url"
                  placeholder="https://yourwebsite.com"
                  value={draft.website}
                  onChange={(e) => setField("website", e.target.value)}
                />
              )}
            </Field>
          </div>
        </Card>
        <Card>
          <CardHeader title="Location" />
          <div className="grid gap-4 p-5">
            <Field label="City / region" optional error={error("location")} hint="Shown under your name, e.g. Makati City, Philippines">
              {(p) => <Input {...p} value={draft.location} onChange={(e) => setField("location", e.target.value)} />}
            </Field>
            <Field label="Address" optional error={error("address")} hint="Added to the saved contact and linked to Google Maps.">
              {(p) => (
                <Textarea {...p} rows={2} autoComplete="street-address" value={draft.address} onChange={(e) => setField("address", e.target.value)} />
              )}
            </Field>
          </div>
        </Card>
      </div>
      <SaveBar dirty={dirty} saving={saving} onSave={() => void save()} onDiscard={discard} />
    </>
  );
}
