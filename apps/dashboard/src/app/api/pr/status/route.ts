/**
 * PR Backend Status API Route Handler
 * Sprint S100.1: Dev-only endpoint for checking PR backend health
 *
 * ALWAYS returns 200 with diagnostic info (no auth required for debugging).
 * This route is critical for diagnosing routing and auth issues.
 *
 * Returns:
 * - Connection status
 * - Auth status (with reason)
 * - Database entity counts (if authenticated)
 * - Environment flag states
 * - Error summary
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { getPRConfig, validatePRConfig } from '@/lib/env/pr-config';
import { checkSupabaseHealth, hasServiceRoleKey } from '@/server/supabaseServerClient';

// Import Supabase client factory directly to avoid 'server-only' issues in edge cases
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const GIT_SHA = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_SHA || 'local';

type AuthStatus = 'ok' | 'missing_session' | 'no_org' | 'error';

interface AuthResult {
  status: AuthStatus;
  userId?: string;
  orgId?: string;
  error?: string;
}

async function checkAuth(): Promise<AuthResult> {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseAnonKey) {
      return { status: 'error', error: 'Supabase credentials not configured' };
    }

    const client = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return allCookies;
        },
        setAll() {
          // Read-only in server components
        },
      },
    });

    const { data: { user }, error: userError } = await client.auth.getUser();

    if (userError || !user) {
      return { status: 'missing_session', error: userError?.message || 'No user session' };
    }

    // Use service role key to query org membership (bypasses RLS)
    if (!serviceRoleKey) {
      return { status: 'error', error: 'Service role key not configured' };
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Get first org membership
    const { data: memberships, error: orgError } = await adminClient
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1);

    if (orgError || !memberships || memberships.length === 0) {
      return { status: 'no_org', userId: user.id, error: 'User has no organization membership' };
    }

    return { status: 'ok', userId: user.id, orgId: memberships[0].org_id };
  } catch (err) {
    return { status: 'error', error: err instanceof Error ? err.message : 'Unknown auth error' };
  }
}

export async function GET() {
  const config = getPRConfig();
  const authResult = await checkAuth();

  const result: Record<string, unknown> = {
    // Routing truth
    appName: 'pravado-dashboard',
    gitSha: GIT_SHA.substring(0, 8),
    timestamp: new Date().toISOString(),
    environment: config.environment,

    // PR Flags
    prFlags: {
      demoMode: config.isDemoMode,
      strictApi: config.isStrictApi,
      allowMockFallback: config.allowMockFallback,
      showBackendStatus: config.showBackendStatus,
    },

    // Environment checks
    envVars: {
      SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: hasServiceRoleKey(),
      PRAVADO_STRICT_API: process.env.PRAVADO_STRICT_API || 'not set',
      PRAVADO_DEMO_MODE: process.env.PRAVADO_DEMO_MODE || 'not set',
    },

    // Auth status
    auth: {
      status: authResult.status,
      authenticated: authResult.status === 'ok',
      userId: authResult.userId ? authResult.userId.substring(0, 8) + '...' : null,
      orgId: authResult.orgId ? authResult.orgId.substring(0, 8) + '...' : null,
      error: authResult.error,
    },
  };

  // Validate config
  const { valid, warnings } = validatePRConfig();
  result.configValid = valid;
  result.configWarnings = warnings;

  // Check Supabase health
  const health = await checkSupabaseHealth();
  result.supabase = health;

  // If authenticated with org, get entity counts
  if (authResult.status === 'ok' && authResult.orgId) {
    try {
      const cookieStore = await cookies();
      const allCookies = cookieStore.getAll();
      const client = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        {
          cookies: {
            getAll() { return allCookies; },
            setAll() {},
          },
        }
      );

      const orgId = authResult.orgId;

      // Get counts
      const [journalists, sequences, mediaLists] = await Promise.all([
        client.from('journalist_profiles').select('id', { count: 'exact', head: true }).eq('org_id', orgId),
        client.from('pr_pitch_sequences').select('id', { count: 'exact', head: true }).eq('org_id', orgId),
        client.from('media_lists').select('id', { count: 'exact', head: true }).eq('org_id', orgId),
      ]);

      result.counts = {
        journalists: journalists.count || 0,
        sequences: sequences.count || 0,
        mediaLists: mediaLists.count || 0,
      };
    } catch (err) {
      result.countsError = err instanceof Error ? err.message : 'Failed to get counts';
    }
  }

  // Summary
  const issues: string[] = [];
  if (!health.connected) issues.push('Supabase not connected');
  if (authResult.status !== 'ok') issues.push(`Auth: ${authResult.status}`);

  result.summary = {
    ok: issues.length === 0,
    issues,
    message: issues.length === 0
      ? 'PR Backend is healthy and ready'
      : `PR Backend has ${issues.length} issue(s): ${issues.join(', ')}`,
  };

  // Console log in strict mode
  if (config.isStrictApi || config.environment === 'development') {
    console.log('\n╔═══════════════════════════════════════════════════╗');
    console.log('║           PR BACKEND STATUS                       ║');
    console.log('╠═══════════════════════════════════════════════════╣');
    console.log(`║  Git SHA: ${GIT_SHA.substring(0, 8).padEnd(40)}║`);
    console.log(`║  Connected: ${health.connected ? '✓ YES' : '✗ NO'}                              ║`);
    console.log(`║  Auth Status: ${authResult.status.padEnd(35)}║`);
    if (result.counts) {
      const counts = result.counts as Record<string, number>;
      console.log(`║  Journalists: ${String(counts.journalists).padEnd(34)}║`);
      console.log(`║  Sequences:   ${String(counts.sequences).padEnd(34)}║`);
    }
    console.log('╚═══════════════════════════════════════════════════╝\n');
  }

  // ALWAYS return 200 - this is a diagnostic endpoint
  const response = NextResponse.json(result);

  // Add debug header
  response.headers.set('x-pr-auth', authResult.status);

  return response;
}
