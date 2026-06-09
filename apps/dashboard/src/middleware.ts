/**
 * Next.js middleware — session refresh + auth gate + request-ID propagation
 *
 * 1. Generates / forwards an `x-request-id` so downstream Route Handlers,
 *    Server Components, and api fetches can correlate logs end-to-end
 *    (Phase 0.5 Plan 02).
 * 2. Refreshes the Supabase session cookie.
 * 3. Redirects unauthenticated users from /app,/onboarding → /login.
 * 4. Redirects authenticated users from /login → /app.
 *
 * CRITICAL: All redirects use the `response` object (not NextResponse.redirect)
 * so that refreshed Supabase cookies are included. Using NextResponse.redirect()
 * creates a new response that drops the refreshed cookies, causing infinite loops.
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const REQUEST_ID_HEADER = 'x-request-id';

function ensureRequestId(request: NextRequest): string {
  const existing = request.headers.get(REQUEST_ID_HEADER);
  if (existing && existing.length > 0) return existing;
  // Web Crypto API is available in the Edge runtime where middleware runs.
  return crypto.randomUUID();
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Phase 0.5 Plan 02: ensure every dashboard request carries an
  // `x-request-id` so the api logs (Pino's request.id) and the
  // dashboard server tier's logs can be joined. Mutate the request
  // headers so downstream `headers()` reads see it.
  const requestId = ensureRequestId(request);
  request.headers.set(REQUEST_ID_HEADER, requestId);

  // Mutable response that accumulates refreshed cookies + carries the
  // request ID back to the caller.
  let response = NextResponse.next({ request });
  response.headers.set(REQUEST_ID_HEADER, requestId);

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
          response.headers.set(REQUEST_ID_HEADER, requestId);
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh session — may update cookies via setAll
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // --- Auth gate redirects ---
  // IMPORTANT: We rewrite `response` instead of returning NextResponse.redirect()
  // so that any cookies set by getUser() (token refresh) are preserved.

  if (
    !user &&
    (pathname.startsWith('/app') || pathname.startsWith('/onboarding'))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    response = NextResponse.redirect(url);
    response.headers.set(REQUEST_ID_HEADER, requestId);

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
    response.headers.set(REQUEST_ID_HEADER, requestId);

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
  matcher: ['/app/:path*', '/onboarding/:path*', '/login'],
};
