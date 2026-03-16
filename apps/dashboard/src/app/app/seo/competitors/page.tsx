'use client';

/**
 * Competitive Intelligence — /app/seo/competitors
 * Share of voice, head-to-head, topic comparison, content gaps.
 */

export const dynamic = 'force-dynamic';

import { CompetitorComparison } from '@/components/seo/CompetitorComparison';

export default function CompetitorsPage() {
  return (
    <div className="pt-6 pb-16 px-8">
      <div className="max-w-[1600px] mx-auto">
        <CompetitorComparison />
      </div>
    </div>
  );
}
