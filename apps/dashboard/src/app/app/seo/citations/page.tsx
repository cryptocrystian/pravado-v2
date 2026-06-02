'use client';

/**
 * Citation Tracking — /app/seo/citations
 * Full citation table with slide-in detail panel.
 *
 * Phase 0 Track 0B: gated behind SEO_CITATIONS_WIRED until real data lands.
 */

export const dynamic = 'force-dynamic';

import { ComingSoonGate } from '@/components/gates/ComingSoonGate';
import { CitationsTable } from '@/components/seo/CitationsTable';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

export default function CitationsPage() {
  const wired = useFeatureFlag('SEO_CITATIONS_WIRED');
  if (!wired) {
    return <ComingSoonGate pillar="SEO" subsurface="Citations" />;
  }
  return (
    <div className="pt-6 pb-16 px-8">
      <div className="max-w-[1600px] mx-auto">
        <CitationsTable />
      </div>
    </div>
  );
}
