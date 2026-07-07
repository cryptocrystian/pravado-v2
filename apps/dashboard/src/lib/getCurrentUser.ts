/**
 * Server-side helper to get current user session
 *
 * Uses getSession() (not getUser()) to avoid triggering token refreshes.
 * The middleware handles all token refreshes via getUser() + writable setAll.
 * This function only READS the already-refreshed session from cookies.
 */

import type { UserSessionData } from '@pravado/types';
import * as Sentry from '@sentry/nextjs';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

import { createServerLogger } from './serverLogger';

const logger = createServerLogger('dashboard:lib:getCurrentUser');
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
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session?.user) {
      logger.info('[getCurrentUser] No session:', error?.message ?? 'no user');
      return null;
    }

    const user = session.user;
    logger.info('[getCurrentUser] User:', user.email);

    // Use service-role client for org queries (bypasses RLS)
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: memberships, error: membershipError } = await supabaseAdmin
      .from('org_members')
      .select('org_id, role, orgs (id, name, created_at, updated_at)')
      .eq('user_id', user.id);

    if (membershipError) {
      logger.error(
        '[getCurrentUser] Org membership error:',
        membershipError.message
      );
      // F37' hardening: surface admin-query failures (e.g. a missing/invalid
      // SUPABASE_SERVICE_ROLE_KEY) to Sentry instead of silently degrading to
      // an empty org list → indefinite "Loading team data..." UX.
      Sentry.captureException(membershipError, {
        tags: {
          phase: 'getCurrentUser_admin_query',
          error_class: membershipError.code || 'PostgrestError',
        },
      });
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

    // Track 0C item 10: identity fallback chain. Supabase magic-link auth
    // does NOT populate raw_user_meta_data by default, so we accept three
    // possible name claims (full_name, fullName, name) before returning null.
    // The topbar then renders an email-prefix fallback so the user menu is
    // never literal "User" with no email. Full plumbing (wizard sets display
    // name via supabase.auth.updateUser) is Phase 1 work.
    const fullName =
      user.user_metadata?.full_name ??
      user.user_metadata?.fullName ??
      user.user_metadata?.name ??
      null;

    return {
      user: {
        id: user.id,
        email: user.email ?? null,
        fullName,
        avatarUrl:
          user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null,
        createdAt: user.created_at || now,
        updatedAt: user.updated_at || now,
      },
      orgs,
      activeOrg,
    };
  } catch (error) {
    logger.error('[getCurrentUser] Error:', error);
    // F37' hardening: this catch previously swallowed admin-query throws
    // (e.g. a missing SUPABASE_SERVICE_ROLE_KEY on the Vercel project) into a
    // silent `null`, which rendered as an indefinite "Loading team data..."
    // with no observability signal. Capture to Sentry, then preserve the
    // existing non-throwing contract (callers rely on `null` for graceful
    // degradation).
    Sentry.captureException(error, {
      tags: {
        phase: 'getCurrentUser_admin_query',
        error_class:
          error instanceof Error ? error.constructor.name : 'unknown',
      },
    });
    return null;
  }
}
