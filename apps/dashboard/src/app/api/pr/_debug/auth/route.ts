/**
 * PR Auth Debug Endpoint
 * Sprint S100.1: Proves route handlers can extract Supabase tokens
 *
 * ONLY enabled when NEXT_PUBLIC_DEBUG_AUTH=true
 * Returns 404 when debug mode is disabled
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const DEBUG_AUTH = process.env.NEXT_PUBLIC_DEBUG_AUTH === 'true';

export async function GET() {
  // Gate behind debug flag
  if (!DEBUG_AUTH) {
    return new NextResponse('Not Found', { status: 404 });
  }

  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    // Check for Supabase cookies
    const sbCookies = allCookies.filter(c => c.name.includes('sb-'));
    const hasCookie = sbCookies.length > 0;

    // Create Supabase client
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return allCookies;
        },
        setAll() {
          // Server-only read
        },
      },
    });

    // Get session
    const { data: { session }, error } = await supabase.auth.getSession();

    const hasSession = !!session;
    const tokenPresent = !!session?.access_token;
    const tokenPrefix = tokenPresent ? session.access_token.slice(0, 16) : null;
    const userId = session?.user?.id || null;

    return NextResponse.json({
      debug: true,
      timestamp: new Date().toISOString(),
      hasCookie,
      cookieCount: allCookies.length,
      sbCookieNames: sbCookies.map(c => c.name),
      hasSession,
      tokenPresent,
      tokenPrefix,
      userId,
      sessionError: error?.message || null,
      envCheck: {
        hasSupabaseUrl: !!SUPABASE_URL,
        hasSupabaseAnonKey: !!SUPABASE_ANON_KEY,
      },
    });
  } catch (err) {
    return NextResponse.json({
      debug: true,
      error: err instanceof Error ? err.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
