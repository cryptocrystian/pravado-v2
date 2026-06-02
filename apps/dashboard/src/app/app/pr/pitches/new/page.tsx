'use client';

/**
 * Pitch Creation — /app/pr/pitches/new
 *
 * Phase 0 Track 0B: gated behind PR_PITCHES_WIRED (same flag as
 * /app/pr/pitches itself). The wizard used mockJournalists to resolve
 * cross-pillar journalist preselection from `?journalist=` query params —
 * delete that fallback. Phase 1 restores the 5-step wizard backed by real
 * journalist data.
 */

export const dynamic = 'force-dynamic';

import { ComingSoonGate } from '@/components/gates/ComingSoonGate';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

export default function NewPitchPage() {
  const wired = useFeatureFlag('PR_PITCHES_WIRED');
  if (!wired) {
    return <ComingSoonGate pillar="PR" subsurface="Pitches" />;
  }
  // Phase 1 restores the wizard render here.
  return null;
}
