'use client';

/**
 * Pitch Pipeline — /app/pr/pitches
 * 4-column board: Drafts | Awaiting Send | Sent/Tracking | Closed
 */

export const dynamic = 'force-dynamic';

import { Plus, ArrowClockwise } from '@phosphor-icons/react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

import { PitchCard } from '@/components/pr/PitchCard';
import { mockPitches } from '@/components/pr/pr-mock-data';
import type { PitchItem } from '@/components/pr/pr-mock-data';
import { fetchPitchSequences, adaptSequenceToPitchItem } from '@/lib/prApi';

const columns = [
  { id: 'drafts' as const, label: 'Drafts' },
  { id: 'awaiting_send' as const, label: 'Awaiting Send' },
  { id: 'sent' as const, label: 'Sent / Tracking' },
  { id: 'closed' as const, label: 'Closed' },
];

export default function PitchPipelinePage() {
  const [pitches, setPitches] = useState<PitchItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchPitchSequences();
        if (!cancelled) {
          const mapped = data.sequences.map(adaptSequenceToPitchItem);
          // Fall back to mock pitches until real sequences exist
          setPitches(mapped.length > 0 ? mapped : mockPitches);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load pitches');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  function handleRetry() {
    setError(null);
    setIsLoading(true);
    fetchPitchSequences()
      .then((data) => {
        setPitches(data.sequences.map(adaptSequenceToPitchItem));
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load pitches');
      })
      .finally(() => setIsLoading(false));
  }

  if (error) {
    return (
      <div className="pt-6 pb-16 px-8">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-white">Pitch Pipeline</h1>
          </div>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-red-400 mb-3">Could not load pitches. Please try again.</p>
            <button
              type="button"
              onClick={handleRetry}
              className="flex items-center gap-1.5 text-sm text-brand-magenta hover:text-brand-magenta/80 transition-colors"
            >
              <ArrowClockwise size={14} />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-6 pb-16 px-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Pitch Pipeline</h1>
          <Link
            href="/app/pr/pitches/new"
            className="flex items-center gap-1.5 bg-brand-magenta text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-brand-magenta/90 shadow-[0_0_10px_rgba(236,72,153,0.2)] transition-colors"
          >
            <Plus size={14} />
            New Pitch
          </Link>
        </div>

        {!isLoading && pitches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-white/45">
              No pitches yet. Create your first pitch to get started.
            </p>
          </div>
        ) : (
          /* Pipeline board */
          <div className={`grid grid-cols-4 gap-4${isLoading ? ' opacity-50' : ''}`}>
            {columns.map((col) => {
              const colPitches = pitches.filter((p) => p.stage === col.id);
              const count = colPitches.length;

              return (
                <div key={col.id}>
                  {/* Column header */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-white/45">
                      {col.label}
                    </span>
                    <span className="text-xs text-white/30 bg-white/5 px-1.5 py-0.5 rounded-full">
                      {count}
                    </span>
                  </div>

                  {/* Column body */}
                  <div className="bg-white/[0.02] rounded-2xl p-3 min-h-[60vh]">
                    {colPitches.map((pitch) => (
                      <PitchCard key={pitch.id} pitch={pitch} />
                    ))}

                    {col.id === 'closed' && colPitches.length === 0 && (
                      <p className="text-xs text-white/30 text-center py-8">
                        No closed pitches
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
