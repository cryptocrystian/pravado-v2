/**
 * Server-side helper to get current user session
 */

import type { UserSessionData } from '@pravado/types';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function getCurrentUser(): Promise<UserSessionData | null> {
  const cookieStore = await cookies();

  // Get all cookies and find the Supabase auth token
  // Supabase stores session in cookies with format: sb-<project-ref>-auth-token
  const allCookies = cookieStore.getAll();
  const authCookie = allCookies.find(c => c.name.includes('auth-token'));

  if (!authCookie?.value) {
    console.log('[getCurrentUser] No auth cookie found');
    return null;
  }

  try {
    // Parse the auth token (it's base64 encoded JSON)
    const tokenData = JSON.parse(authCookie.value);
    const accessToken = tokenData?.access_token;

    if (!accessToken) {
      console.log('[getCurrentUser] No access token in cookie');
      return null;
    }

    // Create a Supabase client with the access token
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });

    // Get user from Supabase
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      console.log('[getCurrentUser] Failed to get user:', userError?.message);
      return null;
    }

    // For now, return a minimal session without org (let the app handle org setup)
    // TODO: Fetch org membership using service role to avoid RLS issues
    return {
      user: {
        id: user.id,
        email: user.email || '',
        fullName: user.user_metadata?.full_name || user.user_metadata?.name || null,
        avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
      },
      activeOrg: null, // Will redirect to onboarding if null
    } as UserSessionData;
  } catch (error) {
    console.error('[getCurrentUser] Error:', error);
    return null;
  }
}
