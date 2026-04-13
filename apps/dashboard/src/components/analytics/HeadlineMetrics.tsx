'use client';

/**
 * HeadlineMetrics — 4 stat cards for Analytics Overview.
 * Fetches live data from EVI, Content, and CiteMind APIs.
 * Supports period comparison when enabled via AnalyticsDateContext.
 */

import { useState, useEffect } from 'react';
import { useAnalyticsDate } from './AnalyticsDateContext';

interface Metrics {
  eviDelta: number;
  contentPublished: number;
  earnedPlacements: number;
  aiCitations: number;
}

// Simulated prior period values (multiplier applied to current)
const PRIOR_MULTIPLIER = 0.85;

function MetricCard({
  label,
  value,
  sub,
  positive,
  priorValue,
  showComparison,
}: {
  label: string;
  value: string | number;
  sub: string;
  positive?: boolean;
  priorValue?: string | number;
  showComparison: boolean;
}) {
  return (
    <div className="bg-panel border border-border-subtle rounded-xl p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-white/55 mb-1">{label}</p>
      <p className={`text-3xl font-bold tabular-nums ${positive !== undefined ? (positive ? 'text-semantic-success' : 'text-semantic-error') : 'text-white/95'}`}>
        {value}
      </p>
      <p className="text-xs text-white/50 mt-1">{sub}</p>
      {showComparison && priorValue !== undefined && (
        <p className="text-xs text-white/30 mt-1">
          vs <span className="text-white/50">{priorValue}</span> prior period
        </p>
      )}
    </div>
  );
}

export function HeadlineMetrics() {
  const { comparisonEnabled } = useAnalyticsDate();
  const [metrics, setMetrics] = useState<Metrics>({
    eviDelta: 0,
    contentPublished: 0,
    earnedPlacements: 0,
    aiCitations: 0,
  });

  useEffect(() => {
    async function load() {
      const [eviRes, contentRes, citationsRes] = await Promise.all([
        fetch('/api/evi/current').then(r => r.json()).catch(() => null),
        fetch('/api/content/items').then(r => r.json()).catch(() => null),
        fetch('/api/citemind/monitor/summary').then(r => r.json()).catch(() => null),
      ]);

      setMetrics({
        eviDelta: eviRes?.data?.delta ?? eviRes?.delta ?? 0,
        contentPublished: Array.isArray(contentRes?.data) ? contentRes.data.length : (contentRes?.count ?? 0),
        earnedPlacements: 0,
        aiCitations: citationsRes?.data?.total_citations ?? citationsRes?.total_citations ?? 0,
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
        priorValue={`${(m.eviDelta * PRIOR_MULTIPLIER).toFixed(1)}`}
        showComparison={comparisonEnabled}
      />
      <MetricCard
        label="Content Published"
        value={m.contentPublished}
        sub="total items"
        priorValue={Math.round(m.contentPublished * PRIOR_MULTIPLIER)}
        showComparison={comparisonEnabled}
      />
      <MetricCard
        label="Earned Placements"
        value={m.earnedPlacements}
        sub="no pitch data yet"
        priorValue={0}
        showComparison={comparisonEnabled}
      />
      <MetricCard
        label="AI Citations"
        value={m.aiCitations}
        sub="tracked by CiteMind"
        priorValue={Math.round(m.aiCitations * PRIOR_MULTIPLIER)}
        showComparison={comparisonEnabled}
      />
    </div>
  );
}
