/**
 * PR API Authentication Helper
 * Sprint S100.1: Centralized auth handling for PR API routes
 *
 * Provides:
 * - Proper 401 (not authenticated) vs 403 (authenticated but forbidden) distinction
 * - Debug header for diagnosing auth issues
 * - Consistent error response format
 */

import 'server-only';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type PRAuthStatus = 'ok' | 'missing_session' | 'no_org' | 'forbidden' | 'error';

// Environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export interface PRAuthResult {
  status: PRAuthStatus;
  userId?: string;
  orgId?: string;
  error?: string;
  client?: SupabaseClient;
}

/**
 * Authenticate a PR API request.
 * Returns auth status with user/org info and a pre-configured Supabase client.
 *
 * Uses service role key for org lookup to bypass RLS (consistent with getCurrentUser).
 */
export async function authenticatePRRequest(): Promise<PRAuthResult> {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return { status: 'error', error: 'Supabase credentials not configured' };
    }

    // Create user-scoped client for auth verification
    const userClient = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return allCookies;
        },
        setAll() {
          // Read-only in server components
        },
      },
    });

    // Verify user session
    const { data: { user }, error: userError } = await userClient.auth.getUser();

    if (userError || !user) {
      return { status: 'missing_session', error: userError?.message || 'No user session' };
    }

    // Use service role key to query org membership (bypasses RLS)
    // This is consistent with how getCurrentUser works
    if (!SERVICE_ROLE_KEY) {
      return { status: 'error', error: 'Service role key not configured' };
    }

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get first org membership (use first org as active)
    const { data: memberships, error: orgError } = await adminClient
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1);

    if (orgError) {
      console.error('[prAuth] Org lookup error:', orgError.message);
      return {
        status: 'no_org',
        userId: user.id,
        error: `Org lookup failed: ${orgError.message}`,
      };
    }

    if (!memberships || memberships.length === 0) {
      return {
        status: 'no_org',
        userId: user.id,
        error: 'User has no organization membership',
      };
    }

    const orgId = memberships[0].org_id;

    // Return the user client for subsequent queries (respects RLS)
    return {
      status: 'ok',
      userId: user.id,
      orgId,
      client: userClient,
    };
  } catch (err) {
    console.error('[prAuth] Auth error:', err);
    return {
      status: 'error',
      error: err instanceof Error ? err.message : 'Unknown auth error',
    };
  }
}

/**
 * Create an error response with the appropriate status code and debug header.
 *
 * Status code mapping:
 * - missing_session -> 401 (Unauthorized - not authenticated)
 * - no_org -> 403 (Forbidden - authenticated but no org access)
 * - forbidden -> 403 (Forbidden - authenticated but not allowed)
 * - error -> 500 (Internal Server Error)
 */
export function createAuthErrorResponse(
  authResult: PRAuthResult,
  customMessage?: string
): NextResponse {
  const statusCodes: Record<PRAuthStatus, number> = {
    ok: 200,
    missing_session: 401,
    no_org: 403,
    forbidden: 403,
    error: 500,
  };

  const statusMessages: Record<PRAuthStatus, string> = {
    ok: 'OK',
    missing_session: 'Authentication required. Please log in.',
    no_org: 'No organization membership. Please join or create an organization.',
    forbidden: 'Access forbidden for this resource.',
    error: 'Internal authentication error.',
  };

  const response = NextResponse.json(
    {
      error: customMessage || statusMessages[authResult.status],
      code: authResult.status.toUpperCase(),
      authStatus: authResult.status,
    },
    { status: statusCodes[authResult.status] }
  );

  // Add debug header (always in dev, optionally in production)
  response.headers.set('x-pr-auth', authResult.status);

  return response;
}

/**
 * Add debug header to a successful response.
 */
export function addPRAuthHeader(response: NextResponse, status: PRAuthStatus): NextResponse {
  response.headers.set('x-pr-auth', status);
  return response;
}

/**
 * Higher-order function to wrap PR API handlers with auth.
 * Automatically handles auth errors and provides client + orgId to the handler.
 */
export async function withPRAuth<T>(
  handler: (client: SupabaseClient, orgId: string, userId: string) => Promise<T>
): Promise<NextResponse> {
  const auth = await authenticatePRRequest();

  if (auth.status !== 'ok' || !auth.client || !auth.orgId || !auth.userId) {
    return createAuthErrorResponse(auth);
  }

  try {
    const result = await handler(auth.client, auth.orgId, auth.userId);
    const response = NextResponse.json(result);
    return addPRAuthHeader(response, 'ok');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[PR API] Handler error:', message);

    const response = NextResponse.json(
      { error: message, code: 'HANDLER_ERROR' },
      { status: 500 }
    );
    return addPRAuthHeader(response, 'ok'); // Auth was ok, handler failed
  }
}
