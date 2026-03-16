'use client';

/**
 * HeadlineMetrics — 4 stat cards for Analytics Overview.
 * Fetches live data from EVI, Content, and CiteMind APIs.
 * Falls back to 0 when endpoints are unavailable.
 */

import { useState, useEffect } from 'react';

interface Metrics {
  eviDelta: number;
  contentPublished: number;
  earnedPlacements: number;
  aiCitations: number;
}

export function HeadlineMetrics() {
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
      {/* EVI Change */}
      <div className="bg-panel border border-border-subtle rounded-xl p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/55 mb-1">
          EVI Change
        </p>
        <p className={`text-3xl font-bold tabular-nums ${m.eviDelta >= 0 ? 'text-semantic-success' : 'text-semantic-error'}`}>
          {m.eviDelta >= 0 ? '+' : ''}{m.eviDelta}
        </p>
        <p className="text-xs text-white/50 mt-1">vs prior period</p>
      </div>

      {/* Content Published */}
      <div className="bg-panel border border-border-subtle rounded-xl p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/55 mb-1">
          Content Published
        </p>
        <p className="text-3xl font-bold text-white/95 tabular-nums">{m.contentPublished}</p>
        <p className="text-xs text-white/50 mt-1">total items</p>
      </div>

      {/* Earned Placements */}
      <div className="bg-panel border border-border-subtle rounded-xl p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/55 mb-1">
          Earned Placements
        </p>
        <p className="text-3xl font-bold text-white/95 tabular-nums">{m.earnedPlacements}</p>
        <p className="text-xs text-white/50 mt-1">no pitch data yet</p>
      </div>

      {/* Total Citations */}
      <div className="bg-panel border border-border-subtle rounded-xl p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/55 mb-1">
          AI Citations
        </p>
        <p className="text-3xl font-bold text-white/95 tabular-nums">{m.aiCitations}</p>
        <p className="text-xs text-white/50 mt-1">tracked by CiteMind</p>
      </div>
    </div>
  );
}
