/**
 * Server-side helper to get current user session
 *
 * Uses getSession() (not getUser()) to avoid triggering token refreshes.
 * The middleware handles all token refreshes via getUser() + writable setAll.
 * This function only READS the already-refreshed session from cookies.
 */

import type { UserSessionData } from '@pravado/types';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function getCurrentUser(): Promise<UserSessionData | null> {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Server components cannot write cookies — this is intentionally a no-op.
          // The middleware already refreshed the session before this runs.
        },
      },
    });

    // Use getSession() — reads cookie data WITHOUT triggering a server-side refresh.
    // getUser() would call setAll() to persist refreshed tokens, but since setAll
    // is a no-op here, those tokens would be lost, causing redirect loops.
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session?.user) {
      console.log('[getCurrentUser] No session:', error?.message ?? 'no user');
      return null;
    }

    const user = session.user;
    console.log('[getCurrentUser] User:', user.email);

    // Use service-role client for org queries (bypasses RLS)
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: memberships, error: membershipError } = await supabaseAdmin
      .from('org_members')
      .select('org_id, role, orgs (id, name, created_at, updated_at)')
      .eq('user_id', user.id);

    if (membershipError) {
      console.error('[getCurrentUser] Org membership error:', membershipError.message);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orgs = (memberships || [])
      .filter((m: any) => m.orgs)
      .map((m: any) => ({
        id: m.orgs.id,
        name: m.orgs.name,
        createdAt: m.orgs.created_at,
        updatedAt: m.orgs.updated_at,
      }));

    const activeOrg = orgs.length > 0 ? orgs[0] : null;
    const now = new Date().toISOString();

    return {
      user: {
        id: user.id,
        email: user.email || null,
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
