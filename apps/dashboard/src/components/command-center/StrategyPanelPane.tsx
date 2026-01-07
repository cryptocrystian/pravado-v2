'use client';

/**
 * StrategyPanelPane - KPIs, Narratives & Recommendations
 *
 * Displays strategic intelligence:
 * - Key Performance Indicators with sparklines
 * - AI-generated narratives and insights
 * - Prioritized recommendations
 *
 * @see /contracts/examples/strategy-panel.json
 */

import type {
  StrategyPanelResponse,
  KPI,
  Narrative,
  Recommendation,
  Pillar,
  Priority,
} from './types';

interface StrategyPanelPaneProps {
  data: StrategyPanelResponse | null;
  isLoading: boolean;
  error: Error | null;
}

// Pillar colors
const pillarColors: Record<Pillar, string> = {
  pr: 'text-brand-magenta',
  content: 'text-brand-iris',
  seo: 'text-brand-cyan',
};

function KPICard({ kpi }: { kpi: KPI }) {
  const trendColor = kpi.trend === 'up' ? 'text-semantic-success' : kpi.trend === 'down' ? 'text-semantic-danger' : 'text-slate-6';
  const statusColor = kpi.status === 'healthy' ? 'bg-semantic-success' : kpi.status === 'warning' ? 'bg-semantic-warning' : 'bg-semantic-danger';

  // Format value based on type
  const formattedValue = kpi.max_value === 1
    ? `${Math.round(kpi.value * 100)}%`
    : kpi.value.toLocaleString();

  const formattedDelta = kpi.delta_7d >= 0 ? `+${kpi.delta_7d}` : `${kpi.delta_7d}`;

  // Simple sparkline rendering
  const sparklineMax = Math.max(...kpi.sparkline);
  const sparklineMin = Math.min(...kpi.sparkline);
  const sparklineRange = sparklineMax - sparklineMin || 1;

  return (
    <div className="p-3 bg-[#13131A] border border-[#1F1F28] rounded-lg">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${statusColor}`} />
          <span className="text-xs font-medium text-slate-6">{kpi.label}</span>
        </div>
        <span className={`text-xs ${trendColor}`}>
          {kpi.trend === 'up' && '↑'}
          {kpi.trend === 'down' && '↓'}
          {kpi.trend === 'flat' && '→'}
          {' '}{formattedDelta} (7d)
        </span>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold text-white">{formattedValue}</span>
        {/* Mini sparkline */}
        <div className="flex items-end gap-[2px] h-6">
          {kpi.sparkline.map((val, i) => (
            <div
              key={i}
              className="w-1 bg-brand-cyan/60 rounded-sm"
              style={{
                height: `${((val - sparklineMin) / sparklineRange) * 100}%`,
                minHeight: '4px',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function NarrativeCard({ narrative }: { narrative: Narrative }) {
  const sentimentStyles = {
    positive: { bg: 'bg-semantic-success/10', border: 'border-semantic-success/20', icon: '✓' },
    warning: { bg: 'bg-semantic-warning/10', border: 'border-semantic-warning/20', icon: '!' },
    opportunity: { bg: 'bg-brand-cyan/10', border: 'border-brand-cyan/20', icon: '★' },
  };

  const style = sentimentStyles[narrative.sentiment];

  return (
    <div className={`p-3 ${style.bg} border ${style.border} rounded-lg`}>
      <div className="flex items-start gap-2 mb-2">
        <span className="text-sm">{style.icon}</span>
        <h4 className="text-sm font-medium text-white">{narrative.title}</h4>
      </div>
      <p className="text-xs text-slate-6 leading-relaxed mb-2">{narrative.body}</p>
      <div className="flex items-center gap-2">
        {narrative.pillars.map((pillar) => (
          <span key={pillar} className={`text-[10px] font-medium uppercase ${pillarColors[pillar]}`}>
            {pillar}
          </span>
        ))}
        <span className="text-[10px] text-slate-5 ml-auto">
          {Math.round(narrative.confidence * 100)}% confidence
        </span>
      </div>
    </div>
  );
}

function RecommendationCard({ rec }: { rec: Recommendation }) {
  const priorityDot: Record<Priority, string> = {
    critical: 'bg-semantic-danger',
    high: 'bg-semantic-danger',
    medium: 'bg-semantic-warning',
    low: 'bg-slate-5',
  };

  return (
    <div className="p-3 bg-[#13131A] border border-[#1F1F28] rounded-lg hover:border-slate-4 transition-colors">
      <div className="flex items-start gap-2 mb-2">
        <span className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${priorityDot[rec.priority]}`} />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-white">{rec.title}</h4>
          <p className="text-xs text-slate-6 mt-1">{rec.description}</p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-3 text-[10px] text-slate-5">
          <span>Effort: <span className="text-white capitalize">{rec.effort}</span></span>
          <span>Impact: <span className="text-white capitalize">{rec.impact}</span></span>
        </div>
        <span className={`text-[10px] font-medium uppercase ${pillarColors[rec.pillar]}`}>
          {rec.pillar}
        </span>
      </div>
      <button className="w-full mt-3 px-3 py-1.5 text-xs font-medium text-brand-cyan bg-brand-cyan/10 border border-brand-cyan/30 rounded hover:bg-brand-cyan/20 transition-colors">
        {rec.action}
      </button>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-4 space-y-6">
      {/* KPIs skeleton */}
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-3 bg-[#13131A] border border-[#1F1F28] rounded-lg animate-pulse">
            <div className="flex items-center justify-between mb-2">
              <div className="h-3 w-16 bg-slate-5 rounded" />
              <div className="h-3 w-12 bg-slate-5 rounded" />
            </div>
            <div className="h-8 w-20 bg-slate-4 rounded" />
          </div>
        ))}
      </div>
      {/* Narratives skeleton */}
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="p-3 bg-[#13131A] border border-[#1F1F28] rounded-lg animate-pulse">
            <div className="h-4 w-3/4 bg-slate-4 rounded mb-2" />
            <div className="h-3 w-full bg-slate-5 rounded mb-1" />
            <div className="h-3 w-2/3 bg-slate-5 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorState({ error }: { error: Error }) {
  return (
    <div className="p-4">
      <div className="p-4 bg-semantic-danger/10 border border-semantic-danger/20 rounded-lg">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-semantic-danger flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-semantic-danger">Failed to load strategy</h4>
            <p className="text-xs text-slate-6 mt-1">{error.message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StrategyPanelPane({ data, isLoading, error }: StrategyPanelPaneProps) {
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  if (!data) {
    return (
      <div className="p-4 text-center text-slate-6">
        <p className="text-sm">No strategy data available</p>
      </div>
    );
  }

  // Show top 4 KPIs
  const topKPIs = data.kpis.slice(0, 4);

  return (
    <div className="p-4 space-y-6">
      {/* KPIs Section */}
      <div>
        <h3 className="text-xs font-semibold text-slate-6 uppercase tracking-wide mb-2 px-1">
          Key Metrics
        </h3>
        <div className="space-y-2">
          {topKPIs.map((kpi) => (
            <KPICard key={kpi.id} kpi={kpi} />
          ))}
        </div>
      </div>

      {/* Narratives Section */}
      <div>
        <h3 className="text-xs font-semibold text-slate-6 uppercase tracking-wide mb-2 px-1">
          AI Insights
        </h3>
        <div className="space-y-2">
          {data.narratives.map((narrative) => (
            <NarrativeCard key={narrative.id} narrative={narrative} />
          ))}
        </div>
      </div>

      {/* Recommendations Section */}
      <div>
        <h3 className="text-xs font-semibold text-slate-6 uppercase tracking-wide mb-2 px-1">
          Recommendations
        </h3>
        <div className="space-y-2">
          {data.recommendations.map((rec) => (
            <RecommendationCard key={rec.id} rec={rec} />
          ))}
        </div>
      </div>
    </div>
  );
}
