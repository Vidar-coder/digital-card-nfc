"use client";

import { Link2 } from "lucide-react";
import { ListEditor } from "@/components/dashboard/list-editor";
import { PageHeader } from "@/components/dashboard/page-header";
import { PLATFORM_META, SocialIcon } from "@/components/profile/social-icon";
import { Field, Input, Select } from "@/components/ui/field";
import type { SocialPlatform } from "@/lib/types";
import { prettyUrl, uid } from "@/lib/utils";

const PLATFORMS = Object.keys(PLATFORM_META) as SocialPlatform[];

export default function SocialPage() {
  return (
    <>
      <PageHeader
        title="Social links"
        description="Icons only appear on your card for the accounts you add here."
      />
      <ListEditor
        section="social_links"
        noun="link"
        emptyIcon={Link2}
        emptyTitle="No social links"
        emptyDescription="Connect LinkedIn, Instagram, GitHub and more so people can follow you."
        createItem={() => ({ id: uid(), platform: "linkedin", url: "", label: null })}
        summary={(l) => ({
          title: l.platform === "custom" ? l.label || "Custom link" : PLATFORM_META[l.platform].label,
          subtitle: l.url ? prettyUrl(l.url) : "No URL yet",
          media: (
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
              <SocialIcon platform={l.platform} className="size-4" />
            </span>
          ),
        })}
        renderForm={({ item, update, error }) => (
          <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
            <Field label="Platform" error={error("platform")}>
              {(p) => (
                <Select {...p} value={item.platform} onChange={(e) => update({ platform: e.target.value as SocialPlatform })}>
                  {PLATFORMS.map((pl) => (
                    <option key={pl} value={pl}>
                      {PLATFORM_META[pl].label}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Profile URL" error={error("url")}>
              {(p) => (
                <Input
                  {...p}
                  type="url"
                  inputMode="url"
                  placeholder={PLATFORM_META[item.platform].placeholder}
                  value={item.url}
                  onChange={(e) => update({ url: e.target.value })}
                />
              )}
            </Field>
            {item.platform === "custom" && (
              <Field label="Label" error={error("label")} className="sm:col-span-2" hint="Shown as the icon tooltip, e.g. 'Calendly'">
                {(p) => <Input {...p} value={item.label ?? ""} onChange={(e) => update({ label: e.target.value || null })} maxLength={40} />}
              </Field>
            )}
          </div>
        )}
      />
    </>
  );
}
