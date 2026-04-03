/**
 * Server-side helper to get current user session
 *
 * IMPORTANT: This runs in server components where cookies are READ-ONLY.
 * It must NEVER trigger a Supabase token refresh (getUser/getSession can
 * both do this). Instead it decodes the JWT directly from cookies.
 * The middleware handles all token refreshes.
 */

import type { UserSessionData } from '@pravado/types';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Decode a JWT payload without verification.
 * The middleware already verified the token — we just need the claims.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    return payload;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<UserSessionData | null> {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    // Find the Supabase access token cookie
    // Supabase stores it as sb-<ref>-auth-token (may be chunked: .0, .1, etc.)
    const authCookieBase = allCookies
      .filter(c => c.name.includes('-auth-token'))
      .sort((a, b) => a.name.localeCompare(b.name));

    if (authCookieBase.length === 0) {
      console.log('[getCurrentUser] No auth token cookie found');
      return null;
    }

    // Reassemble chunked cookie value
    let tokenData: string;
    // Check if it's a single cookie with JSON or chunked
    if (authCookieBase.length === 1 && !authCookieBase[0].name.endsWith('.0')) {
      tokenData = authCookieBase[0].value;
    } else {
      // Chunked cookies: sb-xxx-auth-token.0, sb-xxx-auth-token.1, etc.
      tokenData = authCookieBase.map(c => c.value).join('');
    }

    // Parse the session JSON from the cookie
    let accessToken: string;
    let userId: string;
    let userMeta: Record<string, unknown> = {};

    try {
      // Supabase stores session as base64-encoded JSON
      const parsed = JSON.parse(tokenData);
      accessToken = parsed.access_token || parsed;

      // Decode JWT to get user info
      const payload = decodeJwtPayload(typeof accessToken === 'string' ? accessToken : tokenData);
      if (!payload || !payload.sub) {
        console.log('[getCurrentUser] Could not decode JWT');
        return null;
      }

      userId = payload.sub as string;
      userMeta = (payload.user_metadata as Record<string, unknown>) || {};
    } catch {
      // Try treating the whole thing as a JWT directly
      const payload = decodeJwtPayload(tokenData);
      if (!payload || !payload.sub) {
        console.log('[getCurrentUser] Could not parse token data');
        return null;
      }
      userId = payload.sub as string;
      userMeta = (payload.user_metadata as Record<string, unknown>) || {};
    }

    console.log('[getCurrentUser] User found from JWT:', userId);

    // Use service-role client to query org memberships (bypasses RLS)
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
      .eq('user_id', userId);

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

    const activeOrg = orgs.length > 0 ? orgs[0] : null;

    console.log('[getCurrentUser] Active org:', activeOrg?.name || 'none');

    const now = new Date().toISOString();
    return {
      user: {
        id: userId,
        fullName: (userMeta.full_name || userMeta.name || null) as string | null,
        avatarUrl: (userMeta.avatar_url || userMeta.picture || null) as string | null,
        createdAt: now,
        updatedAt: now,
      },
      orgs,
      activeOrg,
    };
  } catch (error) {
    console.error('[getCurrentUser] Error:', error);
    return null;
  }
}
