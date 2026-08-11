'use client';

/**
 * ClusterDetail — Right panel showing a topic cluster's REAL, SERP-derived facts.
 *
 * HONEST DATA: only fields with a genuine source are shown:
 *   - visibility score (from real avg owned SERP position)
 *   - avg position, total volume (real)
 *   - trend (only when ≥ 2 snapshots exist)
 *   - the member keywords that form the SERP-overlap cluster
 *
 * DELIBERATELY REMOVED (were mock, NOT computed — no real per-cluster source):
 *   per-engine scores, per-competitor head-to-head, tracked-prompt citation
 *   grids, owned/earned citation lists and SAGE recommendations. Those are
 *   CiteMind/EVI signals we do not yet produce per cluster; they are omitted
 *   rather than invented. See the honest note at the foot of the panel.
 */

import { Info, ArrowUp, ArrowDown, Minus } from '@phosphor-icons/react';

import type { SeoTopicCluster } from '@/hooks/useSeoTopics';

import { getClusterStatusLabel, getClusterStatusColor } from './seo-mock-data';

function TrendPill({ trend }: { trend: SeoTopicCluster['trend'] }) {
  if (trend === null) {
    return (
      <span className="text-xs text-white/40" title="Needs ≥ 2 SERP captures">
        No trend yet
      </span>
    );
  }
  if (trend === 'up') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-semantic-success">
        <ArrowUp size={12} weight="bold" /> Improving
      </span>
    );
  }
  if (trend === 'down') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-semantic-danger">
        <ArrowDown size={12} weight="bold" /> Declining
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-white/45">
      <Minus size={12} weight="bold" /> Stable
    </span>
  );
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="bg-panel border border-border-subtle rounded-xl p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-white/45 mb-1.5">
        {label}
      </p>
      <div className="text-lg font-bold text-white">{value}</div>
      {hint && <p className="text-[11px] text-white/40 mt-1">{hint}</p>}
    </div>
  );
}

export function ClusterDetail({
  cluster,
}: {
  cluster: SeoTopicCluster | null;
}) {
  if (!cluster) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-white/45 text-sm">
          Select a cluster to view details
        </p>
      </div>
    );
  }

  const hasScore = cluster.score !== null;
  const statusLabel = hasScore ? getClusterStatusLabel(cluster.score!) : null;
  const statusColor = hasScore ? getClusterStatusColor(cluster.score!) : '';

  return (
    <div className="flex-1 min-w-0 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-2xl font-bold text-white">{cluster.name}</h2>
          {hasScore && (
            <span className="text-2xl font-bold text-white">
              {cluster.score}
            </span>
          )}
          {statusLabel && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor}`}
            >
              {statusLabel}
            </span>
          )}
        </div>
        <p className="text-xs text-white/45">
          {cluster.memberKeywords.length} keyword
          {cluster.memberKeywords.length === 1 ? '' : 's'} &middot; Clustered by
          shared SERP results &middot; Updated{' '}
          {new Date(cluster.computedAt).toLocaleDateString()}
        </p>
      </div>

      {/* Real metrics */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <MetricCard
            label="Visibility Score"
            value={hasScore ? cluster.score : '—'}
            hint={
              hasScore
                ? 'From your average organic position on this cluster'
                : 'You do not rank for any keyword in this cluster yet'
            }
          />
          <MetricCard
            label="Avg Position"
            value={
              cluster.avgPosition !== null ? `#${cluster.avgPosition}` : '—'
            }
            hint="Your best organic rank, averaged across ranking keywords"
          />
          <MetricCard
            label="Total Volume"
            value={
              cluster.totalVolume !== null
                ? cluster.totalVolume.toLocaleString()
                : '—'
            }
            hint="Sum of monthly search volume across member keywords"
          />
        </div>
      </section>

      {/* Trend */}
      <section className="flex items-center gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-white/45">
          Trend
        </h3>
        <TrendPill trend={cluster.trend} />
      </section>

      {/* Member keywords */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-white/45 mb-3">
          Keywords in this cluster
        </h3>
        <div className="flex flex-wrap gap-2">
          {cluster.memberKeywords.map((kw) => (
            <span
              key={kw}
              className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white/5 border border-border-subtle text-[13px] text-white/80"
            >
              {kw}
            </span>
          ))}
        </div>
      </section>

      {/* Honest note on omitted capability */}
      <div className="flex items-start gap-2 border-t border-border-subtle pt-5">
        <Info size={15} className="text-white/35 mt-0.5 shrink-0" />
        <p className="text-[13px] text-white/45 leading-relaxed max-w-2xl">
          Per-engine citation scores, competitor head-to-head and AEO
          recommendations are not shown here — those signals are not yet
          computed per cluster, and we won&rsquo;t display estimated values.
          Clusters and the metrics above are built entirely from your cached
          SERP data.
        </p>
      </div>
    </div>
  );
}
