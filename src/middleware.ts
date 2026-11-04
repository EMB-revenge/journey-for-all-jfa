import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

const devPreview =
  process.env.NODE_ENV !== "production" &&
  process.env.DEV_ADMIN_PREVIEW === "true";

/**
 * Cheap first line for the admin area: no session cookie, no page. Mirrors
 * what adminProcedure enforces, which stays the real gate.
 */
export function middleware(request: NextRequest) {
  if (devPreview) return NextResponse.next();

  if (!getSessionCookie(request)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};