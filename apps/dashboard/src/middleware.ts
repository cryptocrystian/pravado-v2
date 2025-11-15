/**
 * Next.js middleware for auth flow routing
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPaths = ['/app', '/onboarding'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('sb-access-token')?.value;

  // Check if user is authenticated
  const isAuthenticated = !!accessToken;

  // If user is not authenticated and trying to access protected route
  if (!isAuthenticated && protectedPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is authenticated and trying to access login
  if (isAuthenticated && pathname === '/login') {
    return NextResponse.redirect(new URL('/callback', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*', '/onboarding', '/login', '/callback'],
};
