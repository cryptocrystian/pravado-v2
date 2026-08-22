/**
 * GET /api/auth/session-check
 *
 * Server-authoritative session + org check, called by the client-side
 * /callback page after Supabase OTP/PKCE exchange completes. Returns
 * the redirect target so the client doesn't have to read org_members
 * itself (it can't — RLS blocks anon reads of that table, see the
 * 2026-05-13 DECISIONS_LOG note on RLS audit).
 *
 * The gate keys on onboarding COMPLETION, not mere org existence: a user with
 * an org that has not finished onboarding is still routed to the wizard. This
 * fixes the audit funnel (the Silo Tax audit pre-creates the org + membership,
 * so `hasOrg` was true and the user skipped onboarding into an unseeded
 * dashboard) and anyone who abandoned onboarding mid-wizard.
 *
 * Returns:
 *   200 { hasOrg: true,  onboardingCompleted: true,  redirectTo: '/app/command-center' }
 *   200 { hasOrg: true,  onboardingCompleted: false, redirectTo: '/onboarding/ai-intro' }
 *   200 { hasOrg: false, onboardingCompleted: false, redirectTo: '/onboarding/ai-intro' }
 *   401 { hasOrg: false, redirectTo: '/login?error=...' }        — no session
 *
 * Authority: docs/sprints/PHASE-0-FIRE-BREAK/TRACK-0A-COLD-START-UNBLOCK.md §5
 */

import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/getCurrentUser';
import { backendFetch } from '@/server/backendProxy';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getCurrentUser();

  if (!session) {
    return NextResponse.json(
      { hasOrg: false, redirectTo: '/login?error=session-fetch-failed' },
      { status: 401 }
    );
  }

  const hasOrg = !!session.activeOrg && session.orgs.length > 0;

  if (!hasOrg) {
    return NextResponse.json({
      hasOrg: false,
      onboardingCompleted: false,
      redirectTo: '/onboarding/ai-intro',
    });
  }

  // Has an org — route to the dashboard ONLY once onboarding is complete.
  // Fail-safe direction: if we can't determine completion (backend hiccup),
  // treat as complete so we never trap an established user in the wizard —
  // this just preserves the prior "has org → dashboard" behavior on error.
  let onboardingCompleted = true;
  try {
    const status = await backendFetch<{ completed?: boolean }>(
      '/api/v1/onboarding/status'
    );
    onboardingCompleted = !!status?.completed;
  } catch {
    onboardingCompleted = true;
  }

  return NextResponse.json({
    hasOrg: true,
    onboardingCompleted,
    redirectTo: onboardingCompleted
      ? '/app/command-center'
      : '/onboarding/ai-intro',
  });
}
