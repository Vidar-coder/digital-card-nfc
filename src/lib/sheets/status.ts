import "server-only";
import { isAppsScriptConfigured, isSessionSecretConfigured } from "../config";
import { apiRequest } from "./client";
import type { SystemInfo } from "./types";

/** Minimum Apps Script version this app needs (apps-script/Config.gs → APP.VERSION). */
export const REQUIRED_SCRIPT_VERSION = "1.1.0";

function older(a: string, b: string) {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) < (pb[i] ?? 0);
  return false;
}

export interface BackendStatus {
  urlAndKeySet: boolean;
  sessionSecretSet: boolean;
  /** API reachable AND the key accepted */
  connected: boolean;
  error: string | null;
  info: SystemInfo | null;
  /** Deployed script is older than this app expects — paste the new Code.gs and deploy a new version. */
  outdated: boolean;
}

/** Live check of the Apps Script connection (used by /setup and the Google Sheet page). */
export async function getBackendStatus(): Promise<BackendStatus> {
  const base = { urlAndKeySet: isAppsScriptConfigured, sessionSecretSet: isSessionSecretConfigured };
  if (!isAppsScriptConfigured) return { ...base, connected: false, error: null, info: null, outdated: false };
  // Apps Script can take 10s+ to cold-start after being idle.
  const res = await apiRequest<SystemInfo>("getSystemInfo", {}, { timeoutMs: 25_000, retries: 1 });
  return res.success
    ? { ...base, connected: true, error: null, info: res.data, outdated: older(res.data.version, REQUIRED_SCRIPT_VERSION) }
    : { ...base, connected: false, error: `${res.message} (${res.error.code})`, info: null, outdated: false };
}
