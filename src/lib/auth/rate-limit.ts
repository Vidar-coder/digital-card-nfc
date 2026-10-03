import "server-only";

/**
 * Small in-memory fixed-window limiter (per server instance). Good enough to
 * slow password guessing on a single server; on multi-instance hosting put a
 * shared limiter (e.g. Upstash Redis) or a WAF rule in front of /login.
 */
const buckets = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryInSec: number } {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    if (buckets.size > 10_000) for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
    return { ok: true, retryInSec: 0 };
  }
  b.count++;
  return { ok: b.count <= limit, retryInSec: Math.ceil((b.reset - now) / 1000) };
}

export function clearRateLimit(key: string) {
  buckets.delete(key);
}
