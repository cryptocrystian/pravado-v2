/**
 * Server-side OAuth Callback Route Handler
 *
 * Handles the PKCE code exchange server-side, which is more reliable than
 * client-side exchange. Sets auth cookies properly via the response object
 * and redirects to /app (or /onboarding for new users).
 *
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const origin = requestUrl.origin;

  // Handle error from OAuth provider
  if (error) {
    console.error('[Auth Callback] OAuth error:', error, errorDescription);
    return NextResponse.redirect(
      `${origin}/callback?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription || '')}`
    );
  }

  if (!code) {
    console.error('[Auth Callback] No code in callback URL');
    return NextResponse.redirect(`${origin}/login`);
  }

  // Create response to collect cookie operations
  const response = NextResponse.redirect(`${origin}/app`);

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

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error('[Auth Callback] Code exchange failed:', exchangeError.message);
    return NextResponse.redirect(
      `${origin}/callback?error=exchange_failed&error_description=${encodeURIComponent(exchangeError.message)}`
    );
  }

  console.log('[Auth Callback] Session established, redirecting to /app');
  return response;
}
