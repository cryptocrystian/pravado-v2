'use client';

/**
 * EVIDriverBreakdown — real EVI component contribution + data-coverage.
 *
 * HONEST DATA: reads the live EVI snapshot (/api/evi/current) and shows each
 * canonical component (Visibility 40% / Authority 35% / Momentum 25%) with its
 * real 0-100 score, weighted contribution, and per-component data coverage.
 * The overall coverage indicator is shown honestly (partial until all signals
 * land) — it is NOT rounded up or hidden.
 *
 * This replaces the legacy PillarContribution, which used hard-coded pillar
 * deltas (not real). EVI's canon math is component-based (V/A/M), not per-pillar,
 * so cross-pillar attribution is deferred until that source is real.
 */

import { useEVICurrent } from '@/lib/useEVI';

const COMPONENTS = [
  { key: 'visibility', label: 'Visibility', weight: 0.4, color: '#00D9FF' },
  { key: 'authority', label: 'Authority', weight: 0.35, color: '#A855F7' },
  { key: 'momentum', label: 'Momentum', weight: 0.25, color: '#E879F9' },
] as const;

interface ComponentPersist {
  coverage?: number;
}

function coverageLabel(coverage: number): { text: string; className: string } {
  const pct = Math.round(coverage * 100);
  if (pct >= 90) {
    return {
      text: `${pct}% signal coverage`,
      className: 'text-semantic-success',
    };
  }
  if (pct >= 40) {
    return {
      text: `${pct}% signal coverage — partial`,
      className: 'text-white/55',
    };
  }
  return {
    text: `${pct}% signal coverage — insufficient`,
    className: 'text-white/40',
  };
}

export function EVIDriverBreakdown() {
  const { data, isLoading } = useEVICurrent();

  if (isLoading) {
    return (
      <div className="bg-panel border border-border-subtle rounded-xl p-5 animate-pulse">
        <div className="h-4 w-40 bg-white/8 rounded mb-4" />
        <div className="h-24 w-full bg-white/8 rounded" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-panel border border-border-subtle rounded-xl p-5">
        <h3 className="text-meta font-semibold uppercase tracking-wider text-white/45 mb-2">
          EVI Driver Breakdown
        </h3>
        <p className="text-sm text-white/40 py-4">
          No EVI snapshot available yet. Drivers appear after the first
          calculation.
        </p>
      </div>
    );
  }

  const sb = (data.signal_breakdown ?? {}) as Record<string, unknown>;
  const overallCoverage =
    typeof sb.overall_coverage === 'number' ? sb.overall_coverage : 0;
  const overall = coverageLabel(overallCoverage);

  const scores: Record<string, number> = {
    visibility: data.visibility_score,
    authority: data.authority_score,
    momentum: data.momentum_score,
  };

  return (
    <div className="bg-panel border border-border-subtle rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-meta font-semibold uppercase tracking-wider text-white/45">
          EVI Driver Breakdown
        </h3>
        <span className={`text-meta ${overall.className}`}>{overall.text}</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {COMPONENTS.map((c) => {
          const score = scores[c.key] ?? 0;
          const contribution = score * c.weight;
          const compCoverage =
            typeof (sb[c.key] as ComponentPersist | undefined)?.coverage ===
            'number'
              ? (sb[c.key] as ComponentPersist).coverage!
              : 0;
          const cov = coverageLabel(compCoverage);
          return (
            <div
              key={c.key}
              className="bg-slate-3/30 border border-border-subtle rounded-lg p-3"
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: c.color }}
                />
                <span className="text-meta font-medium text-white/60">
                  {c.label}
                </span>
                <span className="text-meta text-white/30 ml-auto">
                  {Math.round(c.weight * 100)}%
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-white/90 tabular-nums">
                  {score.toFixed(1)}
                </span>
                <span className="text-meta text-white/40">/ 100</span>
              </div>
              <p className="text-meta text-white/40 mt-0.5">
                +{contribution.toFixed(1)} to EVI
              </p>
              <p className={`text-meta mt-1 ${cov.className}`}>{cov.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
