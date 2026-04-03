/**
 * Next.js middleware — minimal auth gate
 *
 * ONLY does two things:
 * 1. Refreshes the Supabase session (so server components get a valid token)
 * 2. Redirects unauthenticated users away from /app and /onboarding
 *
 * All other checks (onboarding status, session timeout, MFA, admin)
 * are handled client-side to avoid redirect loops.
 *
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Create a mutable response for cookie updates
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

  // Refresh session — this is the primary job of the middleware
  const { data: { user } } = await supabase.auth.getUser();

  // Unauthenticated users cannot access /app or /onboarding
  if (!user && (pathname.startsWith('/app') || pathname.startsWith('/onboarding'))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Authenticated users on /login go to /app
  if (user && pathname === '/login') {
    return NextResponse.redirect(new URL('/app', request.url));
  }

  // Everything else: pass through with refreshed cookies
  return response;
}

export const config = {
  matcher: [
    '/app/:path*',
    '/onboarding/:path*',
    '/login',
  ],
};
