/**
 * Next.js middleware for auth session refresh and route protection
 *
 * Uses @supabase/ssr to refresh the session on every request.
 * This ensures server components (getCurrentUser) always have a valid token.
 *
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const protectedPaths = ['/app', '/onboarding'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Create a response we can modify (to set refreshed session cookies)
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
          // Update request cookies (for downstream server components)
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          // Update response cookies (to send refreshed tokens to browser)
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh the session — this updates cookies if the access token was expired
  const { data: { user } } = await supabase.auth.getUser();

  console.log('[Middleware] Path:', pathname, '| User:', user?.email ?? 'none');

  // If no user and trying to access protected route, redirect to login
  if (!user && protectedPaths.some((path) => pathname.startsWith(path))) {
    console.log('[Middleware] No session, redirecting to /login');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user exists and on login page, redirect to app
  if (user && pathname === '/login') {
    console.log('[Middleware] Has session, redirecting to /app');
    return NextResponse.redirect(new URL('/app', request.url));
  }

  // Session timeout check (S-INT-10):
  // If session age > 24 hours, force re-authentication
  if (user && pathname.startsWith('/app')) {
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session?.expires_at) {
      // Supabase sessions have expires_at in seconds since epoch
      // Default session lifetime is 1 hour with auto-refresh
      // We enforce a hard 24-hour max from initial auth
      const sessionCreated = (sessionData.session.expires_at - 3600) * 1000; // approximate
      const sessionAgeHours = (Date.now() - sessionCreated) / (1000 * 60 * 60);
      if (sessionAgeHours > 24) {
        console.log('[Middleware] Session expired (>24h), forcing re-auth');
        await supabase.auth.signOut();
        const expiredUrl = new URL('/login', request.url);
        expiredUrl.searchParams.set('reason', 'session_expired');
        return NextResponse.redirect(expiredUrl);
      }
    }
  }

  // Onboarding redirect logic (S-INT-07):
  // If user is authenticated and accessing /app, check if they've completed onboarding.
  // If not, redirect to /onboarding/ai-intro.
  // Skip this check for /onboarding paths (to avoid redirect loops).
  if (user && pathname.startsWith('/app')) {
    // Check org membership + completed_onboarding_at + require_mfa
    const { data: membership, error: membershipError } = await supabase
      .from('org_members')
      .select('org_id, orgs!inner(completed_onboarding_at, require_mfa)')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    // Graceful failure: DB errors should not lock the user out
    if (membershipError && membershipError.code !== 'PGRST116') {
      // PGRST116 = "no rows found" (expected for new users)
      // Any other error → allow through rather than trapping in redirect loop
      console.log('[Middleware] Org membership query error, allowing through:', membershipError.message);
      return response;
    }

    const orgData = membership?.orgs as unknown as {
      completed_onboarding_at: string | null;
      require_mfa: boolean;
    } | null;

    if (membership === null && !membershipError) {
      // Confirmed no org exists — redirect to onboarding
      console.log('[Middleware] No org membership, redirecting to /onboarding/ai-intro');
      return NextResponse.redirect(new URL('/onboarding/ai-intro', request.url));
    }

    if (membership && !orgData?.completed_onboarding_at) {
      // Allow through if user used the onboarding escape hatch (completion API was down)
      const hasEscapeCookie = request.cookies.get('onboarding_escape')?.value === 'true';
      if (!hasEscapeCookie) {
        // Org exists but onboarding incomplete — redirect to onboarding
        console.log('[Middleware] Onboarding incomplete, redirecting to /onboarding/ai-intro');
        return NextResponse.redirect(new URL('/onboarding/ai-intro', request.url));
      }
      console.log('[Middleware] Onboarding incomplete but escape cookie set, allowing through');
    }

    // MFA enforcement (S-INT-10):
    // If org requires MFA and user has no verified TOTP factors, redirect to security settings
    // Skip if already on the security settings page
    if (orgData?.require_mfa && !pathname.startsWith('/app/settings/security')) {
      const { data: mfaData } = await supabase.auth.mfa.listFactors();
      const hasVerifiedFactor = (mfaData?.totp ?? []).some(
        (f: { status: string }) => f.status === 'verified'
      );
      if (!hasVerifiedFactor) {
        console.log('[Middleware] Org requires MFA, user not enrolled, redirecting to security settings');
        return NextResponse.redirect(new URL('/app/settings/security', request.url));
      }
    }
  }

  // Admin route protection (ADMIN-01):
  // /app/admin/* requires is_admin = true on the user's profile
  if (user && pathname.startsWith('/app/admin')) {
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!adminProfile?.is_admin) {
      console.log('[Middleware] Non-admin user accessing /app/admin, redirecting');
      return NextResponse.redirect(new URL('/app/command-center', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/app/:path*',
    '/app/admin/:path*',
    '/onboarding/:path*',
    '/login',
    '/api/auth/signout',
    '/auth/callback',
    '/auth/error',
    '/beta',
  ],
};
