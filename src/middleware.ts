import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.includes("-auth-token"));

  if (!hasAuthCookie) {
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
