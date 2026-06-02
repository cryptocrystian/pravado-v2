'use client';

/**
 * SAGE Brief Flow — /app/content/new/brief/[id]
 *
 * Phase 0 Track 0B: gated behind CONTENT_EDITOR_WIRED. The stub used
 * mockBriefs to look up the brief by id — that import is removed.
 * Phase 1 restores the brief detail + Generate flow against real briefs.
 */

export const dynamic = 'force-dynamic';

import { ComingSoonGate } from '@/components/gates/ComingSoonGate';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function BriefFlowPage(_props: PageProps) {
  const wired = useFeatureFlag('CONTENT_EDITOR_WIRED');
  if (!wired) {
    return <ComingSoonGate pillar="Content" subsurface="Brief" />;
  }
  // Phase 1 restores the brief detail render here.
  return null;
}
