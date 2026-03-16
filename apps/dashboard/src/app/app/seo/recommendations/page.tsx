'use client';

/**
 * SAGE Recommendations — /app/seo/recommendations
 * Prioritized action queue with urgency sections.
 */

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { CaretDown } from '@phosphor-icons/react';
import { RecommendationCard } from '@/components/seo/RecommendationCard';
import { mockRecommendations, mockMediumCount } from '@/components/seo/seo-mock-data';

export default function RecommendationsPage() {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [showMedium, setShowMedium] = useState(false);

  const handleDismiss = (id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
  };

  const critical = mockRecommendations
    .filter((r) => r.urgency === 'critical' && !dismissed.has(r.id));
  const high = mockRecommendations
    .filter((r) => r.urgency === 'high' && !dismissed.has(r.id));

  return (
    <div className="pt-6 pb-16 px-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white">
              SAGE Recommendations
            </h1>
            <span className="text-xs text-white/45">
              Last updated: Now
            </span>
          </div>
          <p className="text-sm text-white/70">
            12 actions identified &middot; Estimated total EVI impact: +18
            points
          </p>
        </div>

        {/* Critical Section */}
        {critical.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs font-bold uppercase tracking-wider text-red-500 mb-4">
              Critical &mdash; Act This Week
            </h2>
            {critical.map((rec) => (
              <RecommendationCard
                key={rec.id}
                rec={rec}
                onDismiss={handleDismiss}
              />
            ))}
          </section>
        )}

        {/* High Section */}
        {high.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-500 mb-4">
              High &mdash; Act This Month
            </h2>
            {high.map((rec) => (
              <RecommendationCard
                key={rec.id}
                rec={rec}
                onDismiss={handleDismiss}
              />
            ))}
          </section>
        )}

        {/* Medium Section */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider text-white/45 mb-4">
            Medium &mdash; Act This Quarter
          </h2>
          {!showMedium ? (
            <button
              type="button"
              onClick={() => setShowMedium(true)}
              className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white/70 hover:text-white transition-colors"
            >
              <CaretDown size={14} />
              {mockMediumCount} more recommendations &mdash; Show All
            </button>
          ) : (
            <div className="bg-white/[0.02] rounded-2xl p-4 text-sm text-white/45">
              <p className="mb-2">
                7 medium-priority recommendations would be shown here in
                production.
              </p>
              <p>
                Topics include: internal linking improvements, meta description
                updates, mobile optimization, and schema expansion.
              </p>
            </div>
          )}
        </section>

        {/* Effort/Impact Note */}
        <p className="text-xs text-white/45 italic mt-8">
          Impact estimates are ranges based on historical CiteMind data. Actual
          results vary based on content quality, distribution, and competitive
          landscape.
        </p>
      </div>
    </div>
  );
}
