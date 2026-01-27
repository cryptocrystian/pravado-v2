/**
 * Routing Truth Endpoint
 * Returns basic app info to verify which Next.js app is responding.
 * NO auth required, NO database calls - always returns 200.
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Git SHA from build-time environment variable
const GIT_SHA = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_SHA || 'local';

export async function GET() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  // Check for Supabase auth cookies
  const hasCookie = allCookies.some(
    (cookie) => cookie.name.includes('auth-token') || cookie.name.includes('sb-')
  );

  return NextResponse.json({
    appName: 'pravado-dashboard',
    version: process.env.npm_package_version || '1.0.0-rc1',
    gitSha: GIT_SHA.substring(0, 8),
    nodeEnv: process.env.NODE_ENV,
    basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
    hostname: process.env.VERCEL_URL || process.env.HOSTNAME || 'localhost',
    hasCookie,
    timestamp: new Date().toISOString(),
  });
}
