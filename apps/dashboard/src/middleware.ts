/**
 * Next.js middleware — session refresh + auth gate
 *
 * 1. Refreshes the Supabase session (so server components get valid tokens)
 * 2. Redirects unauthenticated users away from /app and /onboarding
 * 3. Redirects authenticated users from /login to /app
 *
 * All other checks (onboarding, session timeout, MFA, admin) are
 * handled by layouts/pages to keep the middleware simple and loop-free.
 *
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let response carry refreshed session cookies
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh the session — the primary job of this middleware
  const { data: { user } } = await supabase.auth.getUser();

  // Gate: unauthenticated users cannot access /app or /onboarding
  if (!user && (pathname.startsWith('/app') || pathname.startsWith('/onboarding'))) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Convenience: authenticated users on /login go straight to /app
  if (user && pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/app';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    '/app/:path*',
    '/onboarding/:path*',
    '/login',
  ],
};
