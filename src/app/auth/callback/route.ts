import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Handles the redirect from Supabase invite/magic-link emails.
 * Exchanges the auth code for a session, then redirects to `next` param.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/dashboard";

  const redirectTo = new URL(next, origin);

  if (code || token_hash) {
    const response = NextResponse.redirect(redirectTo);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    if (code) {
      // OAuth / PKCE code exchange
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        return NextResponse.redirect(new URL("/login?error=auth", origin));
      }
    } else if (token_hash && type) {
      // Email verification / invite token
      const { error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as "invite" | "email" | "magiclink",
      });
      if (error) {
        return NextResponse.redirect(new URL("/login?error=invite", origin));
      }
    }

    return response;
  }

  // No code or token — redirect to login
  return NextResponse.redirect(new URL("/login", origin));
}
