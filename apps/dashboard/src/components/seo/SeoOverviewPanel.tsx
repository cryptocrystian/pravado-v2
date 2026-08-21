'use client';

/**
 * SeoOverviewPanel — the SINGLE, honest SEO Overview body shared by all three
 * mode views (Manual / Copilot / Autopilot).
 *
 * HONEST DATA ONLY. Replaces the previous per-view mock overviews
 * (MOCK_SHARE_OF_MODEL / MOCK_COMPETITORS / MOCK_LAYER_HEALTH / MOCK_ACTION_QUEUE)
 * which rendered fabricated numbers on the SEO pillar's landing page. Every block
 * here reads a real source and degrades to an honest-empty state:
 *   1. GSC connection      — real (GscConnectionCard / /api/integrations/gsc/status)
 *   2. Competitive Share of Voice — real DataForSEO SERP (useSeoCompetitors);
 *                            honest-empty until keyword tracking + a SERP refresh.
 *   3. SEO recommendations — real SAGE action stream (SeoRecommendationsQueue).
 *
 * DELIBERATELY OMITTED: the "Share of Model" hero and "Layer Health" cards. There
 * is no live Share-of-Model computation or technical-layer-health source in the
 * product yet, so showing either would fabricate data. Tracked as a launch gap
 * (see SESSION_PRIMER) — reintroduce here once a real source exists.
 */

import { lazy, Suspense } from 'react';

import { useSeoCompetitors } from '@/hooks/useSeoCompetitors';

import { SeoRecommendationsQueue } from './SeoRecommendationsQueue';

const GscConnectionCard = lazy(() =>
  import('./GscConnectionCard').then((m) => ({ default: m.GscConnectionCard }))
);

function CompetitiveShareOfVoice() {
  const { shareOfVoice, isLoading, error } = useSeoCompetitors();

  const rows = [...shareOfVoice].sort((a, b) => b.sharePct - a.sharePct);
  const maxPct = rows.length ? Math.max(...rows.map((r) => r.sharePct)) : 0;

  return (
    <div className="bg-panel border border-border-subtle rounded-xl shadow-elev-1 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white/90">
          Competitive Share of Voice
        </h3>
        <span className="text-[11px] text-white/40 uppercase tracking-wider">
          Tracked-keyword SERP
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-6 bg-slate-3 rounded animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-semantic-danger/90">
          Couldn&rsquo;t load competitor data: {error.message}
        </p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-white/50 leading-relaxed">
          No share-of-voice data yet. It appears once you add tracked keywords
          and run a SERP refresh (requires DataForSEO). Until then this stays
          empty rather than showing sample numbers.
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map((entry) => (
            <div key={entry.domain} className="flex items-center gap-3">
              <span
                className={`text-sm w-40 shrink-0 truncate ${
                  entry.isOwned
                    ? 'font-semibold text-brand-cyan'
                    : 'text-white/70'
                }`}
                title={entry.domain}
              >
                {entry.domain}
              </span>
              <div className="flex-1 h-6 bg-slate-3 rounded overflow-hidden">
                <div
                  className={`h-full rounded transition-all duration-500 ${
                    entry.isOwned
                      ? 'bg-brand-cyan shadow-[0_0_16px_rgba(0,217,255,0.15)]'
                      : 'bg-white/20'
                  }`}
                  style={{
                    width: `${maxPct > 0 ? (entry.sharePct / maxPct) * 100 : 0}%`,
                  }}
                />
              </div>
              <span
                className={`text-sm font-bold tabular-nums w-14 text-right ${
                  entry.isOwned ? 'text-brand-cyan' : 'text-white/70'
                }`}
              >
                {entry.sharePct.toFixed(1)}%
              </span>
              <span className="text-[13px] tabular-nums w-16 text-right text-white/40">
                {entry.appearances} pos
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SeoOverviewPanel() {
  return (
    <div className="space-y-6">
      {/* GSC connection status — real */}
      <Suspense fallback={null}>
        <GscConnectionCard />
      </Suspense>

      {/* Competitive Share of Voice — real SERP, honest-empty */}
      <CompetitiveShareOfVoice />

      {/* SEO recommendations — real SAGE action stream */}
      <SeoRecommendationsQueue />
    </div>
  );
}
