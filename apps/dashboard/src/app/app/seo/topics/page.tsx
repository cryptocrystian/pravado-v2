'use client';

/**
 * Topic Clusters — /app/seo/topics
 * Split-pane: 300px cluster list | flex cluster detail.
 *
 * Phase 0 Track 0B: gated behind SEO_TOPICS_WIRED until real cluster data
 * lands. Mock cluster fallback removed.
 */

export const dynamic = 'force-dynamic';

import { ComingSoonGate } from '@/components/gates/ComingSoonGate';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

export default function TopicsPage() {
  const wired = useFeatureFlag('SEO_TOPICS_WIRED');
  if (!wired) {
    return <ComingSoonGate pillar="SEO" subsurface="Topic Clusters" />;
  }
  // Phase 1 wires real cluster data + restores split-pane render.
  return null;
}
