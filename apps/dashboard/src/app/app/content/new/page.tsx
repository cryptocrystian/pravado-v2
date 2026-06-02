'use client';

/**
 * Entry Point Selection — /app/content/new
 *
 * Phase 0 Track 0B: gated behind CONTENT_EDITOR_WIRED. The three option
 * cards rendered mock brief + template lists; those have been removed.
 * Phase 1 restores the SAGE Brief / Template / Blank entry point flow
 * backed by real briefs and template data.
 */

export const dynamic = 'force-dynamic';

import { ComingSoonGate } from '@/components/gates/ComingSoonGate';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

export default function NewContentEntryPage() {
  const wired = useFeatureFlag('CONTENT_EDITOR_WIRED');
  if (!wired) {
    return <ComingSoonGate pillar="Content" subsurface="New" />;
  }
  // Phase 1 restores the three-card entry render here.
  return null;
}
