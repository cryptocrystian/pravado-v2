'use client';

/**
 * VISUAL AUTHORITY:
 * - Layout: COMMAND_CENTER_REFERENCE.png
 * - Design System: DS_V3_REFERENCE.png
 * - Canon: /docs/canon/DS_v3_PRINCIPLES.md
 * - KPI: /docs/canon/EARNED_VISIBILITY_INDEX.md
 *
 * CRITICAL: Strategy Panel is DIAGNOSTIC ONLY.
 * It explains EVI state but contains NO action buttons.
 * Actions belong in the Action Stream.
 */

/**
 * StrategyPanelPane - EVI North Star Display v1.0
 *
 * Displays the Earned Visibility Index as the single North Star KPI:
 * - Hero: EVI score with delta, status band, sparkline
 * - Driver breakdown: Visibility (40%), Authority (35%), Momentum (25%)
 * - Expandable metrics per driver
 * - AI-generated narratives explaining EVI movement
 * - Upgrade hooks for gated insights
 *
 * @see /docs/canon/EARNED_VISIBILITY_INDEX.md
 * @see /contracts/examples/strategy-panel.json
 */

import { useCallback, useState } from 'react';
import type {
  EarnedVisibilityIndex,
  EVIDriver,
  EVIDriverType,
  EVIFilterState,
  EVIMetric,
  EVIStatus,
  Narrative,
  NarrativeSentiment,
  StrategyPanelResponse,
  TopMover,
  Trend,
  UpgradeHook,
} from './types';

interface StrategyPanelPaneProps {
  data: StrategyPanelResponse | null;
  isLoading: boolean;
  error: Error | null;
  /** Callback when user clicks a driver row to filter Action Stream */
  onDriverFilter?: (filter: EVIFilterState) => void;
  /** Current active filter (for highlighting active filter source) */
  activeFilter?: EVIFilterState | null;
}

// EVI Status band colors
const statusConfig: Record<EVIStatus, { label: string; color: string; bg: string; glow: string }> = {
  at_risk: { label: 'At Risk', color: 'text-semantic-danger', bg: 'bg-semantic-danger', glow: 'rgba(239,68,68,0.3)' },
  emerging: { label: 'Emerging', color: 'text-brand-amber', bg: 'bg-brand-amber', glow: 'rgba(245,158,11,0.3)' },
  competitive: { label: 'Competitive', color: 'text-brand-cyan', bg: 'bg-brand-cyan', glow: 'rgba(6,182,212,0.3)' },
  dominant: { label: 'Dominant', color: 'text-semantic-success', bg: 'bg-semantic-success', glow: 'rgba(34,197,94,0.3)' },
};

// Driver color configuration type
interface DriverColorConfig {
  text: string;
  bg: string;
  border: string;
  bar: string;
}

// Driver colors
const driverColors: Record<EVIDriverType, DriverColorConfig> = {
  visibility: { text: 'text-brand-cyan', bg: 'bg-brand-cyan/10', border: 'border-brand-cyan/30', bar: 'bg-brand-cyan' },
  authority: { text: 'text-brand-iris', bg: 'bg-brand-iris/10', border: 'border-brand-iris/30', bar: 'bg-brand-iris' },
  momentum: { text: 'text-brand-magenta', bg: 'bg-brand-magenta/10', border: 'border-brand-magenta/30', bar: 'bg-brand-magenta' },
};

// Trend rendering
function TrendIndicator({ trend, delta, size = 'sm' }: { trend: Trend; delta: number; size?: 'sm' | 'md' }) {
  const color = trend === 'up' ? 'text-semantic-success' : trend === 'down' ? 'text-semantic-danger' : 'text-white/50';
  const icon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
  const formattedDelta = delta >= 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1);
  const textSize = size === 'md' ? 'text-sm' : 'text-xs';

  return (
    <span className={`${color} ${textSize} font-medium`}>
      {icon} {formattedDelta}
    </span>
  );
}

// Sparkline Component
function Sparkline({ data, color = 'brand-cyan' }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  return (
    <div className="flex items-end gap-[2px] h-6">
      {data.map((val, i) => (
        <div
          key={i}
          className={`w-1 rounded-sm bg-${color}/60`}
          style={{ height: `${Math.max(((val - min) / range) * 100, 15)}%` }}
        />
      ))}
    </div>
  );
}

// EVI Hero Component
function EVIHero({ evi }: { evi: EarnedVisibilityIndex }) {
  const status = statusConfig[evi.status];

  return (
    <div className="p-4 bg-[#0D0D12] border border-[#1A1A24] rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs text-white/50 uppercase tracking-wide font-semibold">Earned Visibility Index</h3>
        <span className={`text-[11px] px-2 py-0.5 rounded-full ${status.bg}/20 ${status.color} font-semibold`}>
          {status.label}
        </span>
      </div>

      {/* Score Display */}
      <div className="flex items-center gap-6">
        {/* Large Score */}
        <div className="text-center">
          <div
            className={`text-5xl font-bold ${status.color}`}
            style={{ textShadow: `0 0 40px ${status.glow}` }}
          >
            {evi.score.toFixed(1)}
          </div>
          <div className="flex items-center justify-center gap-2 mt-1">
            <TrendIndicator trend={evi.trend} delta={evi.delta_7d} size="md" />
            <span className="text-[11px] text-white/30">7d</span>
          </div>
        </div>

        {/* Sparkline + 30d delta */}
        <div className="flex-1">
          <Sparkline data={evi.sparkline} color={status.color.replace('text-', '')} />
          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] text-white/40">30-day trend</span>
            <span className={`text-[11px] ${evi.delta_30d >= 0 ? 'text-semantic-success' : 'text-semantic-danger'}`}>
              {evi.delta_30d >= 0 ? '+' : ''}{evi.delta_30d.toFixed(1)} pts
            </span>
          </div>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="mt-4">
        <div className="h-1.5 bg-[#1A1A24] rounded-full overflow-hidden">
          <div
            className={`h-full ${status.bg} rounded-full transition-all duration-500`}
            style={{ width: `${evi.score}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-white/30">0</span>
          <span className="text-[10px] text-white/30">100</span>
        </div>
      </div>
    </div>
  );
}

// Driver Row Component (Expandable + Filterable)
function DriverRow({
  driver,
  isExpanded,
  onToggle,
  onFilter,
  isFiltered,
}: {
  driver: EVIDriver;
  isExpanded: boolean;
  onToggle: () => void;
  onFilter?: () => void;
  isFiltered?: boolean;
}) {
  const colors = driverColors[driver.type];
  const weightPct = Math.round(driver.weight * 100);

  return (
    <div className={`border ${colors.border} rounded-lg overflow-hidden transition-all ${isFiltered ? 'ring-2 ring-brand-cyan/50' : ''}`}>
      {/* Driver Header - Always visible */}
      <div className={`w-full p-3 ${colors.bg} flex items-center justify-between`}>
        <button
          onClick={onToggle}
          className="flex items-center gap-3 hover:brightness-110 transition-all flex-1"
        >
          <div className={`w-8 h-8 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center`}>
            <span className={`text-lg font-bold ${colors.text}`}>
              {driver.type === 'visibility' ? 'V' : driver.type === 'authority' ? 'A' : 'M'}
            </span>
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${colors.text}`}>{driver.label}</span>
              <span className="text-[10px] text-white/40">({weightPct}%)</span>
            </div>
            <TrendIndicator trend={driver.trend} delta={driver.delta_7d} />
          </div>
        </button>

        <div className="flex items-center gap-2">
          <span className={`text-2xl font-bold ${colors.text}`}>{driver.score.toFixed(1)}</span>
          {/* Filter button */}
          {onFilter && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFilter();
              }}
              className={`p-1.5 rounded-lg transition-all ${
                isFiltered
                  ? 'bg-brand-cyan/20 text-brand-cyan'
                  : 'hover:bg-white/10 text-white/40 hover:text-white/70'
              }`}
              title={isFiltered ? 'Clear filter' : `Filter actions by ${driver.label}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </button>
          )}
          <button onClick={onToggle} className="p-1 hover:bg-white/10 rounded transition-all">
            <svg
              className={`w-4 h-4 text-white/50 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded Metrics */}
      {isExpanded && (
        <div className="p-3 bg-[#0A0A0F] border-t border-[#1A1A24] space-y-2">
          {driver.metrics.map((metric) => (
            <MetricRow key={metric.id} metric={metric} driverColors={colors} />
          ))}
        </div>
      )}
    </div>
  );
}

// Metric Row Component
function MetricRow({ metric, driverColors }: { metric: EVIMetric; driverColors: DriverColorConfig }) {
  const pct = (metric.value / metric.max_value) * 100;

  return (
    <div className="p-2 bg-[#0D0D12] border border-[#1A1A24] rounded-lg">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-white/70">{metric.label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-white">
            {metric.value}{metric.max_value === 100 ? '' : `/${metric.max_value}`}
          </span>
          <TrendIndicator trend={metric.trend} delta={metric.delta_7d} />
        </div>
      </div>
      <div className="h-1 bg-[#1A1A24] rounded-full overflow-hidden">
        <div
          className={`h-full ${driverColors.bar} rounded-full`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <p className="text-[10px] text-white/40 mt-1">{metric.description}</p>
    </div>
  );
}

// Narrative Card Component
function NarrativeCard({ narrative }: { narrative: Narrative }) {
  const sentimentConfig: Record<NarrativeSentiment, { bg: string; border: string; icon: string; iconColor: string }> = {
    positive: { bg: 'bg-semantic-success/8', border: 'border-semantic-success/20', icon: '✓', iconColor: 'text-semantic-success' },
    warning: { bg: 'bg-semantic-warning/8', border: 'border-semantic-warning/20', icon: '!', iconColor: 'text-semantic-warning' },
    opportunity: { bg: 'bg-brand-cyan/8', border: 'border-brand-cyan/20', icon: '★', iconColor: 'text-brand-cyan' },
  };
  const style = sentimentConfig[narrative.sentiment];

  return (
    <div className={`p-3 ${style.bg} border ${style.border} rounded-lg`}>
      <div className="flex items-start gap-2">
        <span className={`text-sm ${style.iconColor}`}>{style.icon}</span>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-semibold text-white mb-1">{narrative.title}</h4>
          <p className="text-[11px] text-white/55 leading-relaxed">{narrative.body}</p>
          <div className="flex items-center gap-2 mt-2">
            {narrative.drivers.map((driver) => (
              <span key={driver} className={`text-[10px] font-bold uppercase ${driverColors[driver].text}`}>
                {driver}
              </span>
            ))}
            <span className="text-[10px] text-white/40 ml-auto">{Math.round(narrative.confidence * 100)}% confidence</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Upgrade Hook Card Component
function UpgradeHookCard({ hook }: { hook: UpgradeHook }) {
  const isBlurred = hook.pattern === 'blurred_insight';

  return (
    <div className="p-3 bg-[#0D0D12] border border-brand-iris/20 rounded-lg relative overflow-hidden">
      {isBlurred && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-iris/5 to-transparent" />
      )}
      <div className="flex items-start gap-2">
        <span className="text-brand-iris">✦</span>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-semibold text-white mb-0.5">{hook.feature}</h4>
          <p className="text-[11px] text-white/55">{hook.message}</p>
          {hook.sample_value && (
            <div className={`mt-2 text-xs font-mono ${isBlurred ? 'blur-sm' : ''} text-brand-iris`}>
              {hook.sample_value}
            </div>
          )}
          <button className="mt-2 text-[11px] text-brand-iris hover:text-brand-iris/80 font-semibold transition-colors">
            Upgrade to {hook.min_plan} →
          </button>
        </div>
      </div>
    </div>
  );
}

// Top Mover Card Component
function TopMoverCard({ mover, onClick }: { mover: TopMover; onClick?: () => void }) {
  const colors = driverColors[mover.driver];
  const isPositive = mover.delta_points >= 0;
  const trendColor = isPositive ? 'text-semantic-success' : 'text-semantic-danger';

  // Evidence type icons
  const evidenceIcons: Record<string, string> = {
    citation: '📰',
    url: '🔗',
    diff: '📝',
    metric: '📊',
  };

  return (
    <button
      onClick={onClick}
      className={`
        w-full p-2.5 bg-[#0D0D12] border border-[#1A1A24] rounded-lg
        hover:border-brand-cyan/30 hover:bg-[#0D0D12]/80
        transition-all text-left group
      `}
    >
      <div className="flex items-start gap-2">
        {/* Evidence type icon */}
        <span className="text-sm">{evidenceIcons[mover.evidence_type] || '📊'}</span>

        <div className="flex-1 min-w-0">
          {/* Driver + Delta */}
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-bold uppercase ${colors.text}`}>
              {mover.driver}
            </span>
            <span className={`text-xs font-bold ${trendColor}`}>
              {isPositive ? '+' : ''}{mover.delta_points.toFixed(1)} pts
            </span>
            <span className={`text-[10px] ${mover.trend === 'up' ? 'text-semantic-success' : 'text-semantic-danger'}`}>
              {mover.trend === 'up' ? '↑' : '↓'}
            </span>
          </div>

          {/* Reason */}
          <p className="text-[11px] text-white/70 line-clamp-2">{mover.reason}</p>

          {/* Deep link hint */}
          <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] text-brand-cyan">{mover.deep_link.label}</span>
            <svg className="w-3 h-3 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </button>
  );
}

// Loading Skeleton
function LoadingSkeleton() {
  return (
    <div className="p-3 space-y-3">
      {/* EVI Hero skeleton */}
      <div className="h-36 bg-[#0D0D12] border border-[#1A1A24] rounded-lg animate-pulse" />
      {/* Driver rows skeleton */}
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-[#0D0D12] border border-[#1A1A24] rounded-lg animate-pulse" />
        ))}
      </div>
      {/* Narratives skeleton */}
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-20 bg-[#0D0D12] border border-[#1A1A24] rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}

// Error State
function ErrorState({ error }: { error: Error }) {
  return (
    <div className="p-3">
      <div className="p-3 bg-semantic-danger/8 border border-semantic-danger/20 rounded-lg">
        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 text-semantic-danger flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <h4 className="text-xs font-semibold text-semantic-danger">Failed to load strategy</h4>
            <p className="text-[11px] text-white/50 mt-0.5">{error.message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StrategyPanelPane({
  data,
  isLoading,
  error,
  onDriverFilter,
  activeFilter,
}: StrategyPanelPaneProps) {
  const [expandedDrivers, setExpandedDrivers] = useState<Set<EVIDriverType>>(new Set());

  const toggleDriver = useCallback((driverType: EVIDriverType) => {
    setExpandedDrivers((prev) => {
      const next = new Set(prev);
      if (next.has(driverType)) {
        next.delete(driverType);
      } else {
        next.add(driverType);
      }
      return next;
    });
  }, []);

  // Handle driver filter click - toggle or clear
  const handleDriverFilter = useCallback((driverType: EVIDriverType, label: string) => {
    if (!onDriverFilter) return;

    // If already filtered by this driver, clear it
    if (activeFilter?.driver === driverType) {
      onDriverFilter(null as unknown as EVIFilterState);
    } else {
      onDriverFilter({
        driver: driverType,
        source: 'driver_click',
        label: `${label} actions`,
      });
    }
  }, [onDriverFilter, activeFilter]);

  // Handle top mover click
  const handleTopMoverClick = useCallback((mover: TopMover) => {
    if (!onDriverFilter) return;

    onDriverFilter({
      driver: mover.driver,
      pillar: mover.pillar,
      source: 'top_mover_click',
      label: `${mover.driver} → ${mover.pillar}`,
    });
  }, [onDriverFilter]);

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState error={error} />;
  if (!data) {
    return (
      <div className="p-6 text-center text-white/50">
        <p className="text-xs">No strategy data available</p>
      </div>
    );
  }

  const { evi, narratives, upgrade_hooks, top_movers } = data;

  return (
    <div className="p-3 space-y-3 h-full overflow-y-auto">
      {/* EVI Hero - North Star KPI */}
      <EVIHero evi={evi} />

      {/* Driver Breakdown */}
      <div>
        <h3 className="text-[11px] text-white/50 uppercase tracking-wide font-semibold mb-2 px-0.5">
          EVI Drivers
        </h3>
        <div className="space-y-2">
          {evi.drivers.map((driver) => (
            <DriverRow
              key={driver.type}
              driver={driver}
              isExpanded={expandedDrivers.has(driver.type)}
              onToggle={() => toggleDriver(driver.type)}
              onFilter={onDriverFilter ? () => handleDriverFilter(driver.type, driver.label) : undefined}
              isFiltered={activeFilter?.driver === driver.type}
            />
          ))}
        </div>
      </div>

      {/* Top Movers (7d) - EVI Attribution */}
      {top_movers && top_movers.length > 0 && (
        <div>
          <h3 className="text-[11px] text-white/50 uppercase tracking-wide font-semibold mb-2 px-0.5 flex items-center gap-1.5">
            <span className="text-semantic-success">↑</span>
            Top Movers (7d)
          </h3>
          <div className="space-y-1.5">
            {top_movers.slice(0, 5).map((mover) => (
              <TopMoverCard
                key={mover.id}
                mover={mover}
                onClick={() => handleTopMoverClick(mover)}
              />
            ))}
          </div>
        </div>
      )}

      {/* AI Narratives */}
      {narratives.length > 0 && (
        <div>
          <h3 className="text-[11px] text-white/50 uppercase tracking-wide font-semibold mb-2 px-0.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-iris animate-pulse" />
            AI Insights
          </h3>
          <div className="space-y-2">
            {narratives.map((narrative) => (
              <NarrativeCard key={narrative.id} narrative={narrative} />
            ))}
          </div>
        </div>
      )}

      {/* Upgrade Hooks */}
      {upgrade_hooks.length > 0 && (
        <div>
          <h3 className="text-[11px] text-white/50 uppercase tracking-wide font-semibold mb-2 px-0.5">
            Unlock More Insights
          </h3>
          <div className="space-y-2">
            {upgrade_hooks.slice(0, 2).map((hook) => (
              <UpgradeHookCard key={hook.id} hook={hook} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
