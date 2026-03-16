'use client';

/**
 * Citation Tracking — /app/seo/citations
 * Full citation table with slide-in detail panel.
 */

export const dynamic = 'force-dynamic';

import { CitationsTable } from '@/components/seo/CitationsTable';

export default function CitationsPage() {
  return (
    <div className="pt-6 pb-16 px-8">
      <div className="max-w-[1600px] mx-auto">
        <CitationsTable />
      </div>
    </div>
  );
}
