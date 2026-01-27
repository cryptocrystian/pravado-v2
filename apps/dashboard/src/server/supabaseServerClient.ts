/**
 * Supabase Server Client - Direct Database Access
 * Sprint S100.1: Server-side client for PR pillar direct DB queries
 *
 * This client is used for:
 * - Direct database queries from Next.js API routes
 * - Seeding operations
 * - Backend status checks
 *
 * RULES:
 * - This module is server-only
 * - Uses service role key for admin operations
 * - Regular user queries still go through getServerClient (with user auth)
 */

import 'server-only';

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// Environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Create a Supabase client with the service role key.
 * This bypasses RLS and should only be used for admin operations.
 */
export function createServiceClient(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Create a Supabase client that inherits the user's session from cookies.
 * This client respects RLS policies.
 */
export async function createUserClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return allCookies;
      },
      setAll() {
        // Server components are read-only for cookies
      },
    },
  });
}

/**
 * Get the current user's org ID from their session.
 * Returns null if no user is logged in or if they have no org.
 */
export async function getUserOrgId(client: SupabaseClient): Promise<string | null> {
  const { data: { user } } = await client.auth.getUser();
  if (!user) return null;

  const { data: userOrg } = await client
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  return userOrg?.org_id || null;
}

/**
 * Validate that the service role key is configured.
 */
export function hasServiceRoleKey(): boolean {
  return !!SUPABASE_SERVICE_ROLE_KEY;
}

/**
 * Check Supabase connection health.
 */
export async function checkSupabaseHealth(): Promise<{
  connected: boolean;
  hasServiceRole: boolean;
  error?: string;
}> {
  try {
    if (!SUPABASE_URL) {
      return { connected: false, hasServiceRole: false, error: 'SUPABASE_URL not configured' };
    }

    const hasServiceRole = hasServiceRoleKey();
    const client = hasServiceRole ? createServiceClient() : createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Simple health check query
    const { error } = await client.from('orgs').select('count').limit(1);

    if (error) {
      return { connected: false, hasServiceRole, error: error.message };
    }

    return { connected: true, hasServiceRole };
  } catch (err) {
    return {
      connected: false,
      hasServiceRole: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
