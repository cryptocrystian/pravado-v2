'use client';

/**
 * Journalist CRM — /app/pr/journalists
 *
 * Phase 0 Track 0B: full ComingSoonGate behind PR_JOURNALISTS_WIRED. The
 * page previously fell back to `mockJournalists` (Sarah Chen, Marcus Webb,
 * etc.) whenever the API returned empty or errored — the exact "fabricated
 * journalist relationships" failure mode flagged in the May 12 audit.
 *
 * The SAGE Suggested tab consumes `mockSageJournalists` from pr-mock-data.ts;
 * that import is exempt per the Feb brief and returns when Phase 1
 * Workstream 2 wires journalist data. The mock-leak grep allows-list this
 * file's pr-mock-data.ts import path.
 */

export const dynamic = 'force-dynamic';

import { ComingSoonGate } from '@/components/gates/ComingSoonGate';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

export default function JournalistsPage() {
  const wired = useFeatureFlag('PR_JOURNALISTS_WIRED');
  if (!wired) {
    return <ComingSoonGate pillar="PR" subsurface="Journalists" />;
  }
  // Phase 1 restores the split-pane CRM render here.
  return null;
}
