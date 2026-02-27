import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { searchParams, pathname } = request.nextUrl;

  // If Supabase redirected with auth code/token → forward to callback
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  if (code || tokenHash) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    if (!searchParams.has("next")) {
      url.searchParams.set("next", "/auth/setup-password");
    }
    return NextResponse.redirect(url);
  }

  // Check for Supabase auth cookie
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.includes("-auth-token"));

  if (!hasAuthCookie && pathname !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|api/|auth/|login|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
