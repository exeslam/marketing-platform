import { NextResponse, type NextRequest } from "next/server";

/**
 * Lightweight auth check for middleware (Edge Runtime compatible).
 * Checks for Supabase auth cookie existence — no SDK imports needed.
 * Full auth verification happens in Server Components via getUser().
 */
export function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for any Supabase auth cookie (sb-<project>-auth-token*)
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.includes("-auth-token"));

  // Not logged in → redirect to login (except public routes)
  if (!hasAuthCookie && pathname !== "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Logged in → redirect away from login
  if (hasAuthCookie && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
