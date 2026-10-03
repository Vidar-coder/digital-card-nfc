import { after, NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { trackEvent } from "@/lib/data";
import { requestContext } from "@/lib/request-context";
import { ANALYTICS_EVENTS } from "@/lib/types";

const bodySchema = z.object({
  username: z.string().min(1).max(40),
  type: z.enum(ANALYTICS_EVENTS),
  meta: z.record(z.string().max(40), z.string().max(120)).nullable().optional(),
});

// Simple per-instance rate limit (best effort). For multi-instance production
// deployments, put a shared limiter (e.g. Upstash) or a WAF rule in front.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 60;
const hits = new Map<string, { count: number; reset: number }>();

function limited(key: string): boolean {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.reset < now) {
    hits.set(key, { count: 1, reset: now + WINDOW_MS });
    if (hits.size > 5000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
    return false;
  }
  entry.count++;
  return entry.count > MAX_PER_WINDOW;
}

const BOT_UA = /bot|crawler|spider|preview|facebookexternalhit|slurp|whatsapp|telegram|discord|slack/i;

export async function POST(request: NextRequest) {
  const ua = request.headers.get("user-agent") ?? "";
  if (BOT_UA.test(ua)) return new NextResponse(null, { status: 204 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (limited(ip)) return new NextResponse(null, { status: 429 });

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid event" }, { status: 400 });

  const { username, type, meta } = parsed.data;
  // Respond immediately; the write (which can take ~1s on Google Sheets) runs after the response.
  const ctx = requestContext(request);
  after(() => trackEvent(username.toLowerCase(), type, meta ?? null, ctx).catch(() => {}));
  return new NextResponse(null, { status: 204 });
}
