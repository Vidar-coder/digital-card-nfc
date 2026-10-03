import { ANALYTICS_EVENTS, type AnalyticsEvent, type AnalyticsEventType, type AnalyticsSummary } from "../types";

type EventLike = Pick<AnalyticsEvent, "event_type" | "meta" | "created_at">;

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const ACTION_EVENTS: AnalyticsEventType[] = [
  "vcard_download", "phone_click", "sms_click", "email_click", "social_click", "website_click", "share",
];

/** Aggregates raw events into dashboard-ready numbers. Shared by both data stores. */
export function summarizeEvents(events: EventLike[], rangeDays: number): AnalyticsSummary {
  const totals = Object.fromEntries(ANALYTICS_EVENTS.map((e) => [e, 0])) as Record<AnalyticsEventType, number>;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const daily = new Map<string, { views: number; actions: number }>();
  for (let i = rangeDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    daily.set(dayKey(d), { views: 0, actions: 0 });
  }

  const social = new Map<string, number>();
  const sources = new Map<string, number>();

  for (const ev of events) {
    if (!(ev.event_type in totals)) continue;
    totals[ev.event_type]++;
    const bucket = daily.get(ev.created_at.slice(0, 10));
    if (bucket) {
      if (ev.event_type === "view") bucket.views++;
      else if (ACTION_EVENTS.includes(ev.event_type)) bucket.actions++;
    }
    if (ev.event_type === "social_click") {
      const p = ev.meta?.platform ?? "other";
      social.set(p, (social.get(p) ?? 0) + 1);
    }
    if (ev.event_type === "view") {
      const s = ev.meta?.source ?? "direct";
      sources.set(s, (sources.get(s) ?? 0) + 1);
    }
  }

  return {
    totals,
    rangeDays,
    daily: [...daily.entries()].map(([date, v]) => ({ date, ...v })),
    socialBreakdown: [...social.entries()]
      .map(([platform, clicks]) => ({ platform, clicks }))
      .sort((a, b) => b.clicks - a.clicks),
    sources: [...sources.entries()]
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count),
  };
}
