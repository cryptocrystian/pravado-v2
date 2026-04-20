/**
 * Hostname-based domain separation middleware
 *
 * pravado.io      → marketing pages only
 * app.pravado.io  → dashboard + auth only
 *
 * On pravado.io:  /app/* redirects to app.pravado.io
 * On app.pravado.io: marketing routes redirect to pravado.io
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Marketing-only paths — served from pravado.io
const MARKETING_PATHS = [
  '/',
  '/audit',
  '/platform',
  '/pricing',
  '/models',
  '/about',
];

// Auth/utility paths — served from both domains
const SHARED_PATHS = [
  '/login',
  '/beta',
  '/callback',
  '/legal',
  '/terms',
  '/privacy',
  '/cookies',
];

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const path = request.nextUrl.pathname;

  // Identify domain context
  const isMainDomain =
    hostname === 'pravado.io' ||
    hostname === 'www.pravado.io';

  const isAppDomain = hostname === 'app.pravado.io';

  // Skip middleware in local dev / Vercel preview deployments
  // (neither pravado.io nor app.pravado.io)
  if (!isMainDomain && !isAppDomain) {
    return NextResponse.next();
  }

  const isMarketingPath = MARKETING_PATHS.some(
    (p) => path === p || path.startsWith(p + '/')
  );
  const isDashboardPath = path.startsWith('/app/');
  const isApiPath = path.startsWith('/api/');
  const isSharedPath = SHARED_PATHS.some(
    (p) => path === p || path.startsWith(p + '/')
  );
  const isStaticPath =
    path.startsWith('/_next/') ||
    path.startsWith('/favicon') ||
    /\.(png|jpg|jpeg|svg|ico|webp|gif|woff|woff2|ttf)$/.test(path);

  // Never redirect static assets or API routes
  if (isStaticPath || isApiPath) {
    return NextResponse.next();
  }

  // ── On pravado.io ────────────────────────────────────────
  // Dashboard paths belong on app.pravado.io
  if (isMainDomain && isDashboardPath) {
    const url = new URL(request.url);
    url.host = 'app.pravado.io';
    return NextResponse.redirect(url, { status: 301 });
  }

  // ── On app.pravado.io ────────────────────────────────────
  // Marketing paths belong on pravado.io
  if (isAppDomain && isMarketingPath) {
    const url = new URL(request.url);
    url.host = 'pravado.io';
    return NextResponse.redirect(url, { status: 301 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - Public files with extensions
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf)).*)',
  ],
};
