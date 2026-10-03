import type { NextRequest } from "next/server";
import type { RequestContext } from "./data";

/** Visitor context for analytics. Country comes from the hosting edge (Vercel / Cloudflare) when available. */
export function requestContext(request: NextRequest): RequestContext {
  const h = request.headers;
  return {
    referrer: h.get("referer") ?? "",
    userAgent: h.get("user-agent") ?? "",
    country: h.get("x-vercel-ip-country") ?? h.get("cf-ipcountry") ?? "",
  };
}
