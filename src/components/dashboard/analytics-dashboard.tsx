"use client";

import {
  Contact,
  Eye,
  Globe,
  Mail,
  MessageSquare,
  MousePointerClick,
  Nfc,
  Phone,
  QrCode,
  Share2,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PLATFORM_META } from "@/components/profile/social-icon";
import { Card, CardHeader } from "@/components/ui/card";
import type { AnalyticsEventType, AnalyticsSummary, SocialPlatform } from "@/lib/types";
import { cn } from "@/lib/utils";

// Categorical slots 1–2 of the validated reference palette (blue, orange).
const SERIES = { views: "#2a78d6", actions: "#eb6834" } as const;
const BAR = "#2a78d6"; // single-series bars use slot 1

const STATS: { key: AnalyticsEventType; label: string; icon: LucideIcon }[] = [
  { key: "view", label: "Profile views", icon: Eye },
  { key: "vcard_download", label: "Contacts saved", icon: Contact },
  { key: "qr_scan", label: "QR scans", icon: QrCode },
  { key: "nfc_tap", label: "NFC taps", icon: Nfc },
  { key: "share", label: "Shares", icon: Share2 },
  { key: "phone_click", label: "Phone clicks", icon: Phone },
  { key: "email_click", label: "Email clicks", icon: Mail },
  { key: "social_click", label: "Social clicks", icon: MousePointerClick },
];

const ACTIONS: { key: AnalyticsEventType; label: string; icon: LucideIcon }[] = [
  { key: "vcard_download", label: "Saved contact", icon: Contact },
  { key: "social_click", label: "Social media", icon: MousePointerClick },
  { key: "email_click", label: "Email", icon: Mail },
  { key: "phone_click", label: "Call", icon: Phone },
  { key: "website_click", label: "Website", icon: Globe },
  { key: "sms_click", label: "Message", icon: MessageSquare },
  { key: "share", label: "Share", icon: Share2 },
];

const fmtDay = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
const nf = new Intl.NumberFormat();

function StatTile({ label, value, icon: Icon, sub }: { label: string; value: number; icon: LucideIcon; sub?: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between text-zinc-500">
        <span className="text-xs font-medium">{label}</span>
        <Icon className="size-4" aria-hidden />
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-zinc-900">{nf.format(value)}</p>
      {sub && <p className="mt-0.5 text-xs text-zinc-500">{sub}</p>}
    </Card>
  );
}

/** Horizontal bars with labels + values in text ink; the bar carries magnitude only. */
function BarList({ rows, total }: { rows: { label: string; value: number; icon?: LucideIcon }[]; total: number }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label} className="group" title={`${r.label}: ${nf.format(r.value)} (${total ? Math.round((r.value / total) * 100) : 0}%)`}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-zinc-700">
              {r.icon && <r.icon className="size-3.5 text-zinc-400" aria-hidden />}
              {r.label}
            </span>
            <span className="tabular-nums text-zinc-900">
              {nf.format(r.value)}
              <span className="ml-1.5 text-xs text-zinc-400">{total ? Math.round((r.value / total) * 100) : 0}%</span>
            </span>
          </div>
          <div className="h-2 rounded-full bg-zinc-100">
            <div
              className="h-2 rounded-full transition-[width] duration-500 group-hover:brightness-110"
              style={{ width: `${(r.value / max) * 100}%`, background: BAR, minWidth: r.value ? 4 : 0 }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { dataKey: string; value: number }[]; label?: string }) {
  if (!active || !payload?.length || !label) return null;
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium text-zinc-900">{fmtDay(label)}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2 text-zinc-600">
          <span className="size-2 rounded-full" style={{ background: SERIES[p.dataKey as keyof typeof SERIES] }} />
          {p.dataKey === "views" ? "Views" : "Actions"}
          <span className="ml-auto pl-4 font-medium tabular-nums text-zinc-900">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

export function AnalyticsDashboard({ summary }: { summary: AnalyticsSummary }) {
  const { totals, daily, rangeDays } = summary;
  const [showTable, setShowTable] = useState(false);

  const actionsTotal = ACTIONS.reduce((s, a) => s + totals[a.key], 0);
  const saveRate = totals.view ? Math.round((totals.vcard_download / totals.view) * 100) : 0;
  const empty = totals.view === 0 && actionsTotal === 0;

  return (
    <div className="space-y-5">
      <div className="flex rounded-xl bg-zinc-200/60 p-1 sm:w-fit" role="group" aria-label="Date range">
        {[7, 30, 90].map((d) => (
          <Link
            key={d}
            href={`/dashboard/analytics?range=${d}`}
            aria-current={rangeDays === d ? "true" : undefined}
            className={cn(
              "flex h-8 flex-1 items-center justify-center rounded-lg px-4 text-sm font-medium text-zinc-600 sm:flex-none",
              rangeDays === d && "bg-white text-zinc-900 shadow-xs",
            )}
          >
            {d} days
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STATS.map((s) => (
          <StatTile
            key={s.key}
            label={s.label}
            value={totals[s.key]}
            icon={s.icon}
            sub={s.key === "vcard_download" && totals.view ? `${saveRate}% of views` : undefined}
          />
        ))}
      </div>

      <Card>
        <CardHeader
          title="Views & engagement"
          description={`Daily, last ${rangeDays} days`}
          action={
            <button type="button" onClick={() => setShowTable((v) => !v)} className="text-xs font-medium text-brand hover:underline">
              {showTable ? "Show chart" : "View as table"}
            </button>
          }
        />
        <div className="p-5">
          {empty ? (
            <p className="py-16 text-center text-sm text-zinc-500">
              No activity yet. Share your card or program your NFC tag — visits will appear here.
            </p>
          ) : showTable ? (
            <div className="max-h-80 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white text-left text-xs text-zinc-500">
                  <tr>
                    <th className="py-2 font-medium">Date</th>
                    <th className="py-2 text-right font-medium">Views</th>
                    <th className="py-2 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 tabular-nums">
                  {[...daily].reverse().map((d) => (
                    <tr key={d.date}>
                      <td className="py-1.5 text-zinc-700">{fmtDay(d.date)}</td>
                      <td className="py-1.5 text-right text-zinc-900">{d.views}</td>
                      <td className="py-1.5 text-right text-zinc-900">{d.actions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <>
              <div className="mb-3 flex gap-4 text-xs text-zinc-600" aria-hidden>
                <span className="flex items-center gap-1.5">
                  <span className="h-0.5 w-4 rounded" style={{ background: SERIES.views }} /> Views
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-0.5 w-4 rounded" style={{ background: SERIES.actions }} /> Actions
                </span>
              </div>
              <div className="h-64" role="img" aria-label={`Line chart of daily views and actions over the last ${rangeDays} days`}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={daily} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fillViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={SERIES.views} stopOpacity={0.16} />
                        <stop offset="100%" stopColor={SERIES.views} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#f0f0f1" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={fmtDay}
                      tick={{ fontSize: 11, fill: "#71717a" }}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={28}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#a1a1aa", strokeDasharray: "3 3" }} />
                    <Area type="monotone" dataKey="views" stroke={SERIES.views} strokeWidth={2} fill="url(#fillViews)" activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }} />
                    <Area type="monotone" dataKey="actions" stroke={SERIES.actions} strokeWidth={2} fill="transparent" activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Visitor actions" description={`${nf.format(actionsTotal)} total`} />
          <div className="p-5">
            <BarList total={actionsTotal} rows={ACTIONS.map((a) => ({ label: a.label, value: totals[a.key], icon: a.icon })).sort((x, y) => y.value - x.value)} />
          </div>
        </Card>
        <div className="space-y-5">
          <Card>
            <CardHeader title="Traffic sources" />
            <div className="p-5">
              {summary.sources.length ? (
                <BarList
                  total={totals.view}
                  rows={summary.sources.map((s) => ({
                    label: { nfc: "NFC tap", qr: "QR scan", direct: "Direct link", referral: "Referral" }[s.source] ?? s.source,
                    value: s.count,
                  }))}
                />
              ) : (
                <p className="text-sm text-zinc-500">No visits in this period.</p>
              )}
            </div>
          </Card>
          <Card>
            <CardHeader title="Social clicks" />
            <div className="p-5">
              {summary.socialBreakdown.length ? (
                <BarList
                  total={totals.social_click}
                  rows={summary.socialBreakdown.map((s) => ({
                    label: PLATFORM_META[s.platform as SocialPlatform]?.label ?? s.platform,
                    value: s.clicks,
                  }))}
                />
              ) : (
                <p className="text-sm text-zinc-500">No social clicks yet.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
