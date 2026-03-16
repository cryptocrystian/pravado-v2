'use client';

/**
 * Pitch Creation — /app/pr/pitches/new
 * 5-step wizard for creating and sending pitches.
 * Reads ?journalist= query param from cross-pillar flows (Content → PR).
 */

export const dynamic = 'force-dynamic';

import { useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PitchWizard } from '@/components/pr/PitchWizard';
import { mockJournalists } from '@/components/pr/pr-mock-data';

export default function NewPitchPage() {
  const searchParams = useSearchParams();
  const journalistName = searchParams?.get('journalist');

  const preselected = useMemo(() => {
    if (!journalistName) return undefined;
    return mockJournalists.find(
      (j) => j.name.toLowerCase() === journalistName.toLowerCase(),
    );
  }, [journalistName]);

  return (
    <div className="pt-6 pb-16 px-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Back link */}
        <Link
          href="/app/pr/pitches"
          className="text-sm text-white/45 hover:text-white/70 transition-colors mb-6 inline-block"
        >
          &larr; Back to Pitches
        </Link>

        <PitchWizard preselectedJournalist={preselected} />
      </div>
    </div>
  );
}
