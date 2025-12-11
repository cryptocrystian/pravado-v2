/**
 * Server-side helper to get current user session
 * Uses @supabase/ssr for proper cookie handling in Next.js App Router
 */

import type { UserSessionData } from '@pravado/types';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function getCurrentUser(): Promise<UserSessionData | null> {
  const cookieStore = await cookies();

  // Create Supabase server client with cookie handlers
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

    // Return minimal session - org will be handled by onboarding
    const now = new Date().toISOString();
    return {
      user: {
        id: user.id,
        fullName: user.user_metadata?.full_name || user.user_metadata?.name || null,
        avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
        createdAt: user.created_at || now,
        updatedAt: user.updated_at || now,
      },
      orgs: [], // Empty orgs array - onboarding will handle org creation
      activeOrg: null, // Will redirect to onboarding if null
    };
  } catch (error) {
    console.error('[getCurrentUser] Error:', error);
    return null;
  }
}
