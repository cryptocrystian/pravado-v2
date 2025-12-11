/**
 * Next.js middleware for auth flow routing
 * Uses simple cookie check - actual session validation happens in layout
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPaths = ['/app', '/onboarding'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for Supabase auth cookies (they start with 'sb-' and contain 'auth-token')
  const cookies = request.cookies.getAll();
  const hasAuthCookie = cookies.some(
    (cookie) => cookie.name.includes('auth-token') || cookie.name.includes('sb-')
  );

  console.log('[Middleware] Path:', pathname, '| Has auth cookie:', hasAuthCookie);

  // If no auth cookies and trying to access protected route, redirect to login
  if (!hasAuthCookie && protectedPaths.some((path) => pathname.startsWith(path))) {
    console.log('[Middleware] No auth cookie, redirecting to /login');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If has auth cookies and on login page, redirect to app
  // (let the app layout validate the session and handle onboarding)
  if (hasAuthCookie && pathname === '/login') {
    console.log('[Middleware] Has auth cookie, redirecting to /app');
    return NextResponse.redirect(new URL('/app', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*', '/onboarding', '/login'],
};
