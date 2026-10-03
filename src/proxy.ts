import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "./lib/auth/session-token";

/**
 * Optimistic auth routing based on the signed session cookie (no network call).
 * The full check — account status and session_version in 01_Users — runs in
 * the dashboard layout and in every server action via getOwner().
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let signedIn = false;
  try {
    signedIn = verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value) !== null;
  } catch {
    signedIn = false; // SESSION_SECRET missing → treat as signed out (setup guide explains)
  }

  if (pathname.startsWith("/dashboard") && !signedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  if ((pathname === "/login" || pathname === "/register") && signedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
