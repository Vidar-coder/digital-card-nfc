import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Stateless signed session token: base64url(JSON claims) + "." + HMAC-SHA256.
 * Claims: user id, session version (revocation: bumping it in 01_Users signs out
 * every device), expiry. No server-side session store is needed.
 * Shared by the proxy (optimistic check) and server code (full check).
 */

export const SESSION_COOKIE = "tc_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export interface SessionClaims {
  uid: string; // 01_Users.user_id
  v: number; // 01_Users.session_version
  exp: number; // unix seconds
}

function secret(): string {
  const s = process.env.SESSION_SECRET ?? "";
  if (s.length < 32) throw new Error("SESSION_SECRET must be set (at least 32 characters)");
  return s;
}

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

export function createSessionToken(uid: string, version: number): string {
  const claims: SessionClaims = { uid, v: version, exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE };
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

/** Returns the claims if the signature is valid and the token hasn't expired. */
export function verifySessionToken(token: string | undefined | null): SessionClaims | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  try {
    const expected = Buffer.from(sign(payload));
    const given = Buffer.from(sig);
    if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString()) as SessionClaims;
    if (typeof claims.uid !== "string" || typeof claims.v !== "number" || claims.exp < Date.now() / 1000) return null;
    return claims;
  } catch {
    return null;
  }
}
