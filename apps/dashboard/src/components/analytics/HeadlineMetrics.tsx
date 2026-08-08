'use client';

/**
 * HeadlineMetrics — 4 stat cards for Analytics Overview.
 * Fetches live data from EVI, Content, Media-Monitoring, and CiteMind APIs.
 *
 * HONEST DATA: every card renders a real value or a real zero. The only
 * "vs prior period" comparison shown is the EVI card, which has a real
 * backend-computed delta. Content / Earned Placements / AI Citations have no
 * real prior-period series wired yet, so they show NO fabricated comparison
 * (the previous ×0.85 cosmetic multiplier was removed as it invented data).
 */

import { useState, useEffect } from 'react';

import { useAnalyticsDate } from './AnalyticsDateContext';

interface Metrics {
  eviDelta: number;
  eviHasDelta: boolean;
  contentPublished: number;
  earnedPlacements: number;
  earnedThisWeek: number;
  aiCitations: number;
}

function MetricCard({
  label,
  value,
  sub,
  positive,
  comparison,
}: {
  label: string;
  value: string | number;
  sub: string;
  positive?: boolean;
  /** Only rendered when a REAL comparison exists. Never fabricated. */
  comparison?: string;
}) {
  return (
    <div className="bg-panel border border-border-subtle rounded-xl p-5">
      <p className="text-meta font-semibold uppercase tracking-wide text-white/55 mb-1">
        {label}
      </p>
      <p
        className={`text-3xl font-bold tabular-nums ${positive !== undefined ? (positive ? 'text-semantic-success' : 'text-semantic-error') : 'text-white/95'}`}
      >
        {value}
      </p>
      <p className="text-meta text-white/50 mt-1">{sub}</p>
      {comparison && (
        <p className="text-meta text-white/30 mt-1">{comparison}</p>
      )}
    </div>
  );
}

export function HeadlineMetrics() {
  const { comparisonEnabled } = useAnalyticsDate();
  const [metrics, setMetrics] = useState<Metrics>({
    eviDelta: 0,
    eviHasDelta: false,
    contentPublished: 0,
    earnedPlacements: 0,
    earnedThisWeek: 0,
    aiCitations: 0,
  });

  useEffect(() => {
    async function load() {
      const [eviRes, contentRes, mediaRes, citationsRes] = await Promise.all([
        fetch('/api/evi/current')
          .then((r) => r.json())
          .catch(() => null),
        fetch('/api/content/items')
          .then((r) => r.json())
          .catch(() => null),
        fetch('/api/media-monitoring/stats')
          .then((r) => r.json())
          .catch(() => null),
        fetch('/api/citemind/monitor/summary')
          .then((r) => r.json())
          .catch(() => null),
      ]);

      const eviDelta = eviRes?.data?.delta ?? eviRes?.delta ?? null;
      const stats = mediaRes?.data?.stats ?? mediaRes?.data ?? null;

      setMetrics({
        eviDelta: typeof eviDelta === 'number' ? eviDelta : 0,
        eviHasDelta: typeof eviDelta === 'number',
        contentPublished: Array.isArray(contentRes?.data)
          ? contentRes.data.length
          : (contentRes?.count ?? 0),
        earnedPlacements: stats?.totalMentions ?? 0,
        earnedThisWeek: stats?.mentionsThisWeek ?? 0,
        aiCitations:
          citationsRes?.data?.total_citations ??
          citationsRes?.total_citations ??
          0,
      });
    }

    load();
  }, []);

  const m = metrics;

  return (
    <div className="grid grid-cols-4 gap-4">
      <MetricCard
        label="EVI Change"
        value={`${m.eviDelta >= 0 ? '+' : ''}${m.eviDelta}`}
        sub="vs prior period"
        positive={m.eviDelta >= 0}
        comparison={
          comparisonEnabled && m.eviHasDelta
            ? `${m.eviDelta >= 0 ? 'up' : 'down'} ${Math.abs(m.eviDelta)} pts vs prior period`
            : undefined
        }
      />
      <MetricCard
        label="Content Published"
        value={m.contentPublished}
        sub="total items"
      />
      <MetricCard
        label="Earned Placements"
        value={m.earnedPlacements}
        sub={
          m.earnedPlacements > 0
            ? `${m.earnedThisWeek} in the last 7 days`
            : 'no earned mentions detected yet'
        }
      />
      <MetricCard
        label="AI Citations"
        value={m.aiCitations}
        sub="tracked by CiteMind"
      />
    </div>
  );
}
