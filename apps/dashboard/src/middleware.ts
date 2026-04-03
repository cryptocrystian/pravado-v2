/**
 * Next.js middleware — session refresh ONLY
 *
 * Does NOT redirect. Only refreshes the Supabase session cookie
 * so that server components can read it. All auth gating is
 * handled by pages/layouts.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
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

  // Just refresh the session — no redirects
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    // Match everything EXCEPT static files and API routes
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};
