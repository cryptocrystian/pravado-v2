/**
 * GET /api/auth/session-check
 *
 * Server-authoritative session + org check, called by the client-side
 * /callback page after Supabase OTP/PKCE exchange completes. Returns
 * the redirect target so the client doesn't have to read org_members
 * itself (it can't — RLS blocks anon reads of that table, see the
 * 2026-05-13 DECISIONS_LOG note on RLS audit).
 *
 * Returns:
 *   200 { hasOrg: true,  redirectTo: '/app/command-center' }     — has membership
 *   200 { hasOrg: false, redirectTo: '/onboarding/ai-intro' }    — no membership, valid session
 *   401 { hasOrg: false, redirectTo: '/login?error=...' }        — no session
 *
 * Authority: docs/sprints/PHASE-0-FIRE-BREAK/TRACK-0A-COLD-START-UNBLOCK.md §5
 */

import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/getCurrentUser';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getCurrentUser();

  if (!session) {
    return NextResponse.json(
      { hasOrg: false, redirectTo: '/login?error=session-fetch-failed' },
      { status: 401 },
    );
  }

  const hasOrg = !!session.activeOrg && session.orgs.length > 0;

  return NextResponse.json({
    hasOrg,
    redirectTo: hasOrg ? '/app/command-center' : '/onboarding/ai-intro',
  });
}
