/**
 * Server-side Supabase client for RSC and server components
 * Sprint S99.1: Provides session access for server-side API calls
 */

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Create a Supabase server client for use in Server Components, Route Handlers, and Server Actions.
 * This client reads auth cookies to get the current user session.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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
}

/**
 * Get the access token from the server-side session.
 * Returns null if no session exists.
 */
export async function getServerAccessToken(): Promise<string | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (error) {
    console.error('[getServerAccessToken] Error:', error);
    return null;
  }
}
