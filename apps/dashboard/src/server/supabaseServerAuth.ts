/**
 * Supabase Server Auth - Canonical Token Extraction
 * Sprint S100: The ONLY place where server-side auth token extraction happens
 *
 * RULES:
 * - This module is server-only
 * - This is the ONLY file that extracts Supabase access tokens
 * - Throws typed error { code: 'AUTH_MISSING' } if no token
 * - Debug logs controlled by NEXT_PUBLIC_DEBUG_AUTH=true
 */

import 'server-only';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// ============================================================================
// Configuration
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const DEBUG_AUTH = process.env.NEXT_PUBLIC_DEBUG_AUTH === 'true';

// ============================================================================
// Error Types
// ============================================================================

export interface AuthError {
  code: 'AUTH_MISSING' | 'AUTH_SESSION_ERROR';
  message: string;
}

export class ServerAuthError extends Error {
  code: AuthError['code'];

  constructor(code: AuthError['code'], message: string) {
    super(message);
    this.code = code;
    this.name = 'ServerAuthError';
  }
}

// ============================================================================
// Debug Logging
// ============================================================================

function debugLog(message: string, data?: Record<string, unknown>) {
  if (DEBUG_AUTH) {
    const safeData = data ? { ...data } : {};
    // Never log full tokens
    if (safeData.tokenPrefix) {
      safeData.tokenPrefix = String(safeData.tokenPrefix).slice(0, 8) + '...';
    }
    console.log(`[AUTH] ${message}`, safeData);
  }
}

// ============================================================================
// Token Extraction
// ============================================================================

/**
 * Get the access token from the server-side Supabase session.
 * This is the ONLY function that should extract tokens.
 *
 * @throws ServerAuthError with code 'AUTH_MISSING' if no token
 * @throws ServerAuthError with code 'AUTH_SESSION_ERROR' if session error
 */
export async function getServerAccessToken(): Promise<string> {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  debugLog('Token extraction started', {
    cookieCount: allCookies.length,
    hasSbCookies: allCookies.some(c => c.name.includes('sb-')),
    sbCookieNames: allCookies.filter(c => c.name.includes('sb-')).map(c => c.name),
  });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return allCookies;
      },
      setAll() {
        // Server components are read-only for cookies
      },
    },
  });

  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    debugLog('Session error', { error: error.message });
    throw new ServerAuthError('AUTH_SESSION_ERROR', error.message);
  }

  const tokenPresent = !!session?.access_token;
  debugLog('Token check', {
    tokenPresent,
    tokenPrefix: tokenPresent ? session.access_token : null,
    userId: session?.user?.id,
  });

  if (!session?.access_token) {
    throw new ServerAuthError('AUTH_MISSING', 'No Supabase access token available in server request context');
  }

  return session.access_token;
}
