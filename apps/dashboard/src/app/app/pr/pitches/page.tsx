'use client';

/**
 * Pitch Pipeline — /app/pr/pitches
 *
 * Phase 0 Track 0B: full ComingSoonGate behind PR_PITCHES_WIRED. The page
 * was rendering an error state ("Could not load pitches.") even on success
 * because of a broken fallback to mockPitches; fixing the underlying error
 * state is Phase 1 work.
 */

export const dynamic = 'force-dynamic';

import { ComingSoonGate } from '@/components/gates/ComingSoonGate';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

export default function PitchPipelinePage() {
  const wired = useFeatureFlag('PR_PITCHES_WIRED');
  if (!wired) {
    return <ComingSoonGate pillar="PR" subsurface="Pitches" />;
  }
  // Phase 1 restores the 4-column pipeline board backed by real sequences.
  return null;
}
