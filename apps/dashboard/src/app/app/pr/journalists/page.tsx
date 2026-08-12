'use client';

/**
 * Journalist CRM — /app/pr/journalists
 *
 * Gated behind PR_JOURNALISTS_WIRED (default OFF → ComingSoonGate). When the
 * flag is flipped ON, this renders the identity-only Journalist Intelligence
 * list, sourced entirely from the real journalist_profiles table via
 * /api/pr/journalists (no mock fallback in the render path).
 *
 * IDENTITY-ONLY: the list renders name/outlet/beat/engagement/last-activity —
 * NO contact emails (CAN-SPAM-sensitive; withheld until outreach egress +
 * governance are live). The previous mockJournalists fallback (the May 12
 * "fabricated journalist relationships" failure mode) and the mock-fed SAGE
 * Suggested tab are intentionally NOT wired here.
 */

export const dynamic = 'force-dynamic';

import { ComingSoonGate } from '@/components/gates/ComingSoonGate';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

import JournalistsClient from './JournalistsClient';

export default function JournalistsPage() {
  const wired = useFeatureFlag('PR_JOURNALISTS_WIRED');
  if (!wired) {
    return <ComingSoonGate pillar="PR" subsurface="Journalists" />;
  }
  // Client self-loads real profiles from /api/pr/journalists on mount.
  return <JournalistsClient initialProfiles={[]} initialTotal={0} />;
}
