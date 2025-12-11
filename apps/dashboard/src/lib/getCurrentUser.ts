/**
 * Server-side helper to get current user session
 * Uses @supabase/ssr for proper cookie handling in Next.js App Router
 */

import type { UserSessionData } from '@pravado/types';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function getCurrentUser(): Promise<UserSessionData | null> {
  const cookieStore = await cookies();

  // Create Supabase server client with cookie handlers for auth
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // In server components, we can't set cookies
        // This is fine for read-only access
      },
    },
  });

  try {
    // Get the current user from the session
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      console.log('[getCurrentUser] No user found:', error?.message);
      return null;
    }

    console.log('[getCurrentUser] User found:', user.email);

    // Create admin client to query org memberships (bypasses RLS)
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Query user's organizations
    const { data: memberships, error: membershipError } = await supabaseAdmin
      .from('org_members')
      .select(`
        org_id,
        role,
        orgs (
          id,
          name,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', user.id);

    if (membershipError) {
      console.error('[getCurrentUser] Error fetching org memberships:', membershipError);
    }

    console.log('[getCurrentUser] Memberships found:', memberships?.length || 0);

    // Build orgs array from memberships
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orgs = (memberships || [])
      .filter((m: any) => m.orgs)
      .map((m: any) => ({
        id: m.orgs.id,
        name: m.orgs.name,
        createdAt: m.orgs.created_at,
        updatedAt: m.orgs.updated_at,
      }));

    // Use the first org as active org (could be enhanced with user preference)
    const activeOrg = orgs.length > 0 ? orgs[0] : null;

    console.log('[getCurrentUser] Active org:', activeOrg?.name || 'none');

    const now = new Date().toISOString();
    return {
      user: {
        id: user.id,
        fullName: user.user_metadata?.full_name || user.user_metadata?.name || null,
        avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
        createdAt: user.created_at || now,
        updatedAt: user.updated_at || now,
      },
      orgs,
      activeOrg,
    };
  } catch (error) {
    console.error('[getCurrentUser] Error:', error);
    return null;
  }
}
