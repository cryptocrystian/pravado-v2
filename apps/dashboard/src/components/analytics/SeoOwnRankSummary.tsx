'use client';

/**
 * SeoOwnRankSummary — REAL own-property rank summary (Analytics-SEO panel 2).
 * Stats come from seo_keywords.current_position + seo_keyword_metrics (GSC /
 * DataForSEO volume). Average position and total volume render null-safe: when
 * their real source is absent the tile shows an honest em-dash, never a 0 stand-in.
 */

import type { OwnRankSummaryPanel } from '@/hooks/useAnalyticsSeo';

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub: string;
}) {
  return (
    <div className="bg-panel border border-border-subtle rounded-xl p-5">
      <p className="text-meta font-semibold uppercase tracking-wide text-white/55 mb-1">
        {label}
      </p>
      <p className="text-3xl font-bold tabular-nums text-white/95">{value}</p>
      <p className="text-meta text-white/50 mt-1">{sub}</p>
    </div>
  );
}

export function SeoOwnRankSummary({
  summary,
}: {
  summary: OwnRankSummaryPanel;
}) {
  if (!summary.hasData) {
    return (
      <div className="bg-panel border border-border-subtle rounded-xl p-10 flex flex-col items-center justify-center text-center">
        <p className="text-sm text-white/85">No tracked keywords yet.</p>
        <p className="text-[13px] text-white/55 mt-1.5 leading-relaxed max-w-md">
          Connect Google Search Console and track keywords to see your
          own-property rank summary. Average position and volume are computed
          only from real GSC / SERP data.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        label="Tracked Keywords"
        value={summary.trackedKeywords}
        sub={`${summary.rankedKeywords} currently ranking`}
      />
      <StatCard
        label="Avg Position"
        value={summary.avgPosition ?? '—'}
        sub={
          summary.avgPosition !== null
            ? 'mean owned SERP rank'
            : 'no ranked keywords yet'
        }
      />
      <StatCard
        label="Total Volume"
        value={
          summary.totalVolume !== null
            ? summary.totalVolume.toLocaleString()
            : '—'
        }
        sub={
          summary.totalVolume !== null
            ? 'monthly searches'
            : 'no volume data yet'
        }
      />
      <StatCard
        label="GSC Keywords"
        value={summary.gscKeywords}
        sub="backed by Search Console"
      />
    </div>
  );
}
