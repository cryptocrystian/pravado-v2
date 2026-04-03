/**
 * Next.js middleware — session refresh + auth gate
 *
 * 1. Refreshes the Supabase session cookie
 * 2. Redirects unauthenticated users from /app,/onboarding → /login
 * 3. Redirects authenticated users from /login → /app
 *
 * CRITICAL: All redirects use the `response` object (not NextResponse.redirect)
 * so that refreshed Supabase cookies are included. Using NextResponse.redirect()
 * creates a new response that drops the refreshed cookies, causing infinite loops.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Mutable response that accumulates refreshed cookies
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

  // Refresh session — may update cookies via setAll
  const { data: { user } } = await supabase.auth.getUser();

  // --- Auth gate redirects ---
  // IMPORTANT: We rewrite `response` instead of returning NextResponse.redirect()
  // so that any cookies set by getUser() (token refresh) are preserved.

  if (!user && (pathname.startsWith('/app') || pathname.startsWith('/onboarding'))) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    response = NextResponse.redirect(url);

    // Re-apply any cookies that were set during getUser() refresh
    // Without this, the redirect drops refreshed tokens
    const allCookies = request.cookies.getAll();
    for (const cookie of allCookies) {
      if (cookie.name.startsWith('sb-')) {
        response.cookies.set(cookie.name, cookie.value);
      }
    }
  }

  if (user && pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/app';
    response = NextResponse.redirect(url);

    // Re-apply refreshed auth cookies onto the redirect response
    const allCookies = request.cookies.getAll();
    for (const cookie of allCookies) {
      if (cookie.name.startsWith('sb-')) {
        response.cookies.set(cookie.name, cookie.value);
      }
    }
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
