'use client';

/**
 * SEO Analytics — /app/analytics/seo
 * Four panels, each from a REAL source and each independently honest-empty:
 *   1. Engine breakdown — CiteMind (citation_summaries.by_engine + citation_monitor_results)
 *   2. Own-rank summary — GSC (seo_keywords.current_position + seo_keyword_metrics)
 *   3. Competitive movement — seo_snapshots.position over captured_at (empty until >= 2 snapshots)
 *   4. Topic-cluster performance — persisted seo_keyword_clusters (real fields)
 *
 * HONEST DATA: no mock. Every value is a stored value or a real null; the CSV
 * export is derived ONLY from the real loaded data. Gated behind ANALYTICS_SEO_WIRED.
 */

export const dynamic = 'force-dynamic';

import { WarningCircle, DownloadSimple } from '@phosphor-icons/react';

import { CitationVelocityByEngine } from '@/components/analytics/CitationVelocityByEngine';
import { CitationVelocityChart } from '@/components/analytics/CitationVelocityChart';
import { SeoCompetitiveMovement } from '@/components/analytics/SeoCompetitiveMovement';
import { SeoEngineBreakdown } from '@/components/analytics/SeoEngineBreakdown';
import { SeoOwnRankSummary } from '@/components/analytics/SeoOwnRankSummary';
import { TopicOpportunityMatrix } from '@/components/analytics/TopicOpportunityMatrix';
import { ComingSoonGate } from '@/components/gates/ComingSoonGate';
import {
  useAnalyticsSeo,
  type AnalyticsSeoData,
} from '@/hooks/useAnalyticsSeo';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

// ============================================================================
// CSV export — derived ONLY from the real loaded data (no mock, no fabrication).
// ============================================================================

function escapeCsv(value: string | number | null): string {
  if (value === null) return '';
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function buildCsv(data: AnalyticsSeoData): string {
  const lines: string[] = [];
  const row = (cells: Array<string | number | null>) =>
    lines.push(cells.map(escapeCsv).join(','));

  row(['section', 'label', 'metric', 'value']);

  // Panel 1 — engine breakdown
  for (const e of data.engineBreakdown.engines) {
    row(['engine_breakdown', e.engine, 'queries', e.queries]);
    row(['engine_breakdown', e.engine, 'citations', e.mentions]);
    row([
      'engine_breakdown',
      e.engine,
      'rate',
      e.rate !== null ? Math.round(e.rate * 100) / 100 : null,
    ]);
  }

  // Panel 2 — own-rank summary
  const s = data.summary;
  row(['summary', 'tracked_keywords', 'count', s.trackedKeywords]);
  row(['summary', 'ranked_keywords', 'count', s.rankedKeywords]);
  row(['summary', 'avg_position', 'value', s.avgPosition]);
  row(['summary', 'total_volume', 'value', s.totalVolume]);
  row(['summary', 'gsc_keywords', 'count', s.gscKeywords]);

  // Panel 3 — competitive movement
  for (const m of data.competitiveMovement.movers) {
    row([
      'competitive_movement',
      m.keyword,
      'from_position',
      m.earliestPosition,
    ]);
    row(['competitive_movement', m.keyword, 'to_position', m.latestPosition]);
    row(['competitive_movement', m.keyword, 'delta', m.delta]);
  }

  // Panel 4 — topic-cluster performance
  for (const c of data.topicPerformance.clusters) {
    row(['topic_performance', c.name, 'score', c.score]);
    row(['topic_performance', c.name, 'avg_position', c.avgPosition]);
    row(['topic_performance', c.name, 'total_volume', c.totalVolume]);
    row(['topic_performance', c.name, 'trend', c.trend]);
  }

  return lines.join('\n');
}

function downloadCsv(data: AnalyticsSeoData) {
  const csv = buildCsv(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `analytics-seo-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================================================
// Page
// ============================================================================

export default function SEOAnalyticsPage() {
  const wired = useFeatureFlag('ANALYTICS_SEO_WIRED');
  const { data, isLoading, error } = useAnalyticsSeo();

  if (!wired) {
    return <ComingSoonGate pillar="Analytics" subsurface="SEO" />;
  }

  // Loading — honest skeletons
  if (isLoading) {
    return (
      <div className="pt-6 pb-16 px-8">
        <div className="max-w-[1600px] mx-auto space-y-4">
          <div className="h-8 w-56 bg-white/5 rounded-lg animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 bg-white/5 rounded-xl animate-pulse"
              />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 bg-white/5 rounded-xl animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error — honest, no fake fallback
  if (error || !data) {
    return (
      <div className="flex h-[calc(100vh-49px)] items-center justify-center p-8">
        <div className="bg-panel border border-semantic-danger/20 rounded-xl p-8 flex flex-col items-center justify-center text-center max-w-md">
          <WarningCircle
            size={26}
            className="text-semantic-danger mb-3"
            weight="fill"
          />
          <p className="text-sm text-white/85 leading-relaxed">
            Couldn&rsquo;t load SEO analytics.
          </p>
          <p className="text-[13px] text-white/50 leading-relaxed mt-1">
            {error instanceof Error
              ? error.message
              : 'Please try again shortly.'}
          </p>
        </div>
      </div>
    );
  }

  const { engineBreakdown, summary, competitiveMovement, topicPerformance } =
    data;

  return (
    <div className="pt-6 pb-16 px-8 overflow-y-auto h-[calc(100vh-49px)]">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header + CSV export (real data only) */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/95">
              SEO Analytics
            </h1>
            <p className="text-[13px] text-white/45 mt-0.5">
              Engine breakdown, own-property rank, competitive movement, and
              topic performance — all from your real data.
            </p>
          </div>
          <button
            type="button"
            onClick={() => downloadCsv(data)}
            className="flex items-center gap-2 text-sm text-white/70 hover:text-brand-cyan border border-border-subtle hover:border-brand-cyan/40 rounded-lg px-3 py-2 transition-colors"
          >
            <DownloadSimple size={16} weight="bold" />
            Export CSV
          </button>
        </div>

        {/* Panel 2 — Own-rank summary (stat tiles across the top) */}
        <section>
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-white/60 mb-3">
            Own-Property Rank
          </h2>
          <SeoOwnRankSummary summary={summary} />
        </section>

        {/* Panel 1 — Engine breakdown (CiteMind) */}
        <section>
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-white/60 mb-3">
            Engine Breakdown
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SeoEngineBreakdown engines={engineBreakdown.engines} />
            <CitationVelocityChart data={engineBreakdown.totalVelocity} />
            <div className="lg:col-span-2">
              <CitationVelocityByEngine
                data={engineBreakdown.velocity}
                engines={engineBreakdown.velocityEngines}
              />
            </div>
          </div>
        </section>

        {/* Panels 3 + 4 — Competitive movement + Topic performance */}
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SeoCompetitiveMovement movement={competitiveMovement} />
            <TopicOpportunityMatrix clusters={topicPerformance.clusters} />
          </div>
        </section>
      </div>
    </div>
  );
}
