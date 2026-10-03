import "server-only";
import { cookies } from "next/headers";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE, verifySessionToken } from "./session-token";

/** Sets the HTTP-only session cookie (Server Actions / Route Handlers only). */
export async function startSession(userId: string, sessionVersion: number) {
  (await cookies()).set(SESSION_COOKIE, createSessionToken(userId, sessionVersion), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Signature/expiry-checked claims. The account is re-validated against Sheets in getOwner(). */
export async function readSession() {
  return verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
}
