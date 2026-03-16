/**
 * GSC OAuth Callback Route (Sprint S-INT-06)
 *
 * Proxies the Google OAuth callback to the backend, which handles
 * token exchange, site selection, and connection storage.
 * The backend returns a redirect to /app/seo?gsc=connected|error.
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code') || '';
  const state = searchParams.get('state') || '';
  const error = searchParams.get('error') || '';

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL
    || process.env.PRAVADO_API_BASE_URL
    || process.env.API_BASE_URL
    || 'http://localhost:3001';

  // Forward the callback to the backend
  const params = new URLSearchParams();
  if (code) params.set('code', code);
  if (state) params.set('state', state);
  if (error) params.set('error', error);

  try {
    const backendRes = await fetch(
      `${apiBaseUrl}/api/v1/integrations/gsc/callback?${params}`,
      { redirect: 'manual' } // Don't follow redirects — we'll handle them
    );

    // The backend sends a redirect response
    const location = backendRes.headers.get('location');
    if (location) {
      return NextResponse.redirect(location);
    }

    // Fallback: redirect to SEO page
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${appUrl}/app/seo?gsc=connected`);
  } catch {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${appUrl}/app/seo?gsc=error&reason=proxy_error`);
  }
}
