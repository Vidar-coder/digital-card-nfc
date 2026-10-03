import "server-only";
import type { ApiAction, ApiErrorCode, ApiFailure, ApiResponse } from "./types";

/**
 * Low-level client for the Google Apps Script Web App.
 *
 * SERVER-ONLY: the API key lives in GOOGLE_APPS_SCRIPT_API_KEY (no NEXT_PUBLIC_
 * prefix), so it is never bundled for the browser. Browsers talk to Next.js
 * (pages, Server Actions, /api routes) and Next.js talks to Apps Script.
 *
 * Apps Script specifics handled here:
 *  - the API key travels in the JSON body (Apps Script can't read headers)
 *  - responses arrive via a 302 redirect to script.googleusercontent.com
 *  - HTTP status is always 200; success is in the body
 *  - an HTML response means the deployment isn't public ("Anyone") or the URL is wrong
 */

const API_URL = process.env.GOOGLE_APPS_SCRIPT_URL ?? "";
const API_KEY = process.env.GOOGLE_APPS_SCRIPT_API_KEY ?? "";

/** Actions safe to retry automatically (no side effects). */
const IDEMPOTENT = /^(get|check|health)/;

export class AppsScriptError extends Error {
  constructor(
    public code: ApiErrorCode,
    message: string,
    public details: ApiFailure["error"]["details"] = null,
  ) {
    super(message);
    this.name = "AppsScriptError";
  }

  /** Field errors keyed by sheet column ("email", "0.company"), if any. */
  get fieldErrors(): Record<string, string[]> | undefined {
    const d = this.details;
    return d && typeof d === "object" && "fields" in d ? (d.fields as Record<string, string[]>) : undefined;
  }
}

function failure(code: ApiErrorCode, message: string, details: string | null = null): ApiFailure {
  return { success: false, message, data: null, error: { code, details } };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Sends one action to Apps Script. Never throws — always resolves to the
 * standard envelope { success, message, data, error }.
 */
export async function apiRequest<T = unknown>(
  action: ApiAction,
  data: object = {},
  { timeoutMs = 20_000, retries }: { timeoutMs?: number; retries?: number } = {},
): Promise<ApiResponse<T>> {
  if (!API_URL || !API_KEY) {
    return failure("SETUP_REQUIRED", "GOOGLE_APPS_SCRIPT_URL / GOOGLE_APPS_SCRIPT_API_KEY are not set");
  }
  const attempts = 1 + (retries ?? (IDEMPOTENT.test(action) ? 2 : 0));
  let last: ApiResponse<T> = failure("NETWORK_ERROR", "No response");

  for (let attempt = 0; attempt < attempts; attempt++) {
    if (attempt > 0) await sleep(400 * 2 ** (attempt - 1)); // 400ms, 800ms
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        // text/plain avoids an unnecessary preflight if this is ever proxied; Apps Script ignores it.
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action, apiKey: API_KEY, data }),
        redirect: "follow",
        cache: "no-store",
        signal: AbortSignal.timeout(timeoutMs),
      });
      const text = await res.text();
      let json: ApiResponse<T>;
      try {
        json = JSON.parse(text) as ApiResponse<T>;
      } catch {
        // Typically a Google sign-in/permission HTML page.
        return failure(
          "SETUP_REQUIRED",
          "Apps Script returned a non-JSON response. Check the Web App URL and that the deployment's access is set to 'Anyone'.",
          text.slice(0, 200),
        );
      }
      if (json.success || !["BUSY", "INTERNAL_ERROR"].includes(json.error?.code)) return json;
      last = json; // transient — retry if allowed
    } catch (e) {
      last = failure("NETWORK_ERROR", e instanceof Error ? e.message : "Network error");
    }
  }
  return last;
}

/** Like apiRequest but returns `data` directly and throws AppsScriptError on failure. */
export async function call<T = unknown>(action: ApiAction, data: object = {}, opts?: { timeoutMs?: number; retries?: number }): Promise<T> {
  const res = await apiRequest<T>(action, data, opts);
  if (!res.success) throw new AppsScriptError(res.error.code, res.message, res.error.details);
  return res.data;
}
