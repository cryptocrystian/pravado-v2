'use client';

/**
 * SeoOverviewPanel — the SINGLE, honest SEO Overview body shared by all three
 * mode views (Manual / Copilot / Autopilot).
 *
 * HONEST DATA ONLY. Replaces the previous per-view mock overviews
 * (MOCK_SHARE_OF_MODEL / MOCK_COMPETITORS / MOCK_LAYER_HEALTH / MOCK_ACTION_QUEUE)
 * which rendered fabricated numbers on the SEO pillar's landing page. Every block
 * here reads a real source and degrades to an honest-empty state:
 *   1. Share of Model     — real CiteMind Engine 3 (useShareOfModel); the Layer 3
 *                            "moat" metric (SEO_AEO_PILLAR_CANON §4). Honest-empty
 *                            until the citation monitor samples the org's queries.
 *   2. GSC connection      — real (GscConnectionCard / /api/integrations/gsc/status)
 *   3. Competitive Share of Voice — real DataForSEO SERP (useSeoCompetitors);
 *                            honest-empty until keyword tracking + a SERP refresh.
 *   4. SEO recommendations — real SAGE action stream (SeoRecommendationsQueue).
 *
 * DELIBERATELY OMITTED: the "Layer Health" cards — no live technical-layer-health
 * source exists yet, so showing them would fabricate data. Tracked as a launch
 * gap (see SESSION_PRIMER) — reintroduce once a real source exists.
 */

import { lazy, Suspense } from 'react';

import { useSeoCompetitors } from '@/hooks/useSeoCompetitors';
import { useShareOfModel } from '@/hooks/useShareOfModel';

import { SeoRecommendationsQueue } from './SeoRecommendationsQueue';

const GscConnectionCard = lazy(() =>
  import('./GscConnectionCard').then((m) => ({ default: m.GscConnectionCard }))
);

function ShareOfModelHero() {
  const { data, isLoading, error } = useShareOfModel();

  const pct = data?.shareOfModel;
  const trend = data?.trendDelta ?? null;
  const topics = (data?.topics ?? []).slice(0, 4);

  return (
    <div className="bg-panel border border-border-subtle rounded-xl shadow-elev-1 p-6">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-white/50">
            Share of Model
          </span>

          {isLoading ? (
            <div className="mt-2 h-12 w-40 bg-slate-3 rounded animate-pulse" />
          ) : error ? (
            <p className="mt-2 text-sm text-semantic-danger/90">
              Couldn&rsquo;t load Share of Model: {error.message}
            </p>
          ) : !data?.available || pct === null || pct === undefined ? (
            <p className="mt-2 text-sm text-white/50 max-w-md leading-relaxed">
              No Share of Model yet. It appears once CiteMind samples your topic
              queries across AI engines and records brand vs. competitor
              citations. Shown empty rather than as a sample number.
            </p>
          ) : (
            <>
              <div className="mt-2 flex items-baseline gap-3">
                <span className="text-5xl font-bold text-brand-cyan tabular-nums shadow-[0_0_24px_rgba(0,217,255,0.25)]">
                  {pct.toFixed(1)}%
                </span>
                {trend !== null && (
                  <span
                    className={`flex items-center gap-1 text-sm font-semibold ${
                      trend > 0
                        ? 'text-semantic-success'
                        : trend < 0
                          ? 'text-semantic-danger'
                          : 'text-white/50'
                    }`}
                  >
                    {trend > 0 ? '+' : ''}
                    {trend.toFixed(1)} pts
                  </span>
                )}
              </div>
              <span className="text-[13px] text-white/50 mt-1 block">
                Brand vs. competitor AI citations · last {data.periodDays} days
                · {data.brandCitations + data.competitorCitations} citations
                across {data.sampledQueries} sampled answers
              </span>
            </>
          )}
        </div>
        <div className="p-3 rounded-xl bg-brand-cyan/10 ring-1 ring-brand-cyan/20 shadow-[0_0_20px_rgba(0,217,255,0.12)]">
          <svg
            className="w-6 h-6 text-brand-cyan"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
      </div>

      {/* Per-topic breakdown — only when there's real topic data */}
      {topics.length > 0 && (
        <div className="mt-5 pt-5 border-t border-border-subtle space-y-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">
            By topic
          </span>
          {topics.map((t) => (
            <div key={t.topic} className="flex items-center gap-3">
              <span
                className="text-sm w-44 shrink-0 truncate text-white/70"
                title={t.topic}
              >
                {t.topic}
              </span>
              <div className="flex-1 h-5 bg-slate-3 rounded overflow-hidden">
                <div
                  className="h-full rounded bg-brand-cyan/70"
                  style={{ width: `${t.shareOfModel}%` }}
                />
              </div>
              <span className="text-sm font-bold tabular-nums w-14 text-right text-white/70">
                {t.shareOfModel.toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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
      {/* Share of Model — Layer 3 "moat" metric (real CiteMind Engine 3) */}
      <ShareOfModelHero />

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
