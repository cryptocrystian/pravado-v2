'use client';

/**
 * StrategyPanelPane - KPIs, Narratives & Recommendations
 *
 * Displays strategic intelligence:
 * - Key Performance Indicators with sparklines
 * - AI-generated narratives and insights
 * - Prioritized recommendations
 * - Upgrade hooks (blurred insights, locked features)
 *
 * @see /contracts/examples/strategy-panel.json
 */

import type {
  KPI,
  Narrative,
  Pillar,
  Priority,
  Recommendation,
  StrategyPanelResponse,
  UpgradeHook,
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

function UpgradeHookCard({ hook }: { hook: UpgradeHook }) {
  const isBlurred = hook.pattern === 'blurred_insight';
  const isLocked = hook.pattern === 'locked_feature';

  // Plan badge colors
  const planColors: Record<string, { bg: string; text: string }> = {
    pro: { bg: 'bg-brand-iris/10', text: 'text-brand-iris' },
    growth: { bg: 'bg-brand-cyan/10', text: 'text-brand-cyan' },
    enterprise: { bg: 'bg-brand-magenta/10', text: 'text-brand-magenta' },
  };

  const planStyle = planColors[hook.min_plan] || { bg: 'bg-slate-4', text: 'text-white' };

  return (
    <div className="relative p-4 bg-[#13131A] border border-[#1F1F28] rounded-lg overflow-hidden group hover:border-brand-iris/30 transition-all duration-200">
      {/* Gradient overlay for visual appeal */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-iris/5 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="relative flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {isLocked ? (
            <div className="w-8 h-8 rounded-lg bg-slate-4/50 flex items-center justify-center">
              <svg className="w-4 h-4 text-slate-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-brand-iris/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-brand-iris" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path
                  fillRule="evenodd"
                  d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
          <div>
            <h4 className="text-sm font-medium text-white">{hook.feature}</h4>
            <span className={`text-[10px] font-semibold uppercase ${planStyle.text}`}>
              {hook.min_plan} plan
            </span>
          </div>
        </div>
        <span className={`px-2 py-0.5 text-[10px] font-medium rounded ${planStyle.bg} ${planStyle.text}`}>
          Upgrade
        </span>
      </div>

      {/* Description */}
      <p className="relative text-xs text-slate-6 mb-3 leading-relaxed">
        {hook.message}
      </p>

      {/* Blurred sample value preview */}
      {isBlurred && hook.sample_value && (
        <div className="relative mb-3">
          <div className="p-3 bg-[#0A0A0F] border border-[#1F1F28] rounded select-none">
            <p className="text-sm text-white blur-sm pointer-events-none">
              {hook.sample_value}
            </p>
          </div>
          {/* Overlay text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="px-3 py-1.5 text-xs font-medium text-brand-iris bg-[#13131A]/90 border border-brand-iris/30 rounded-full shadow-lg">
              Preview locked
            </span>
          </div>
        </div>
      )}

      {/* Locked feature placeholder */}
      {isLocked && (
        <div className="relative mb-3">
          <div className="p-3 bg-[#0A0A0F] border border-[#1F1F28] rounded">
            <div className="flex items-center gap-2 opacity-50">
              <div className="h-3 w-3/4 bg-slate-5/30 rounded" />
            </div>
            <div className="flex items-center gap-2 mt-2 opacity-30">
              <div className="h-3 w-1/2 bg-slate-5/30 rounded" />
            </div>
          </div>
        </div>
      )}

      {/* CTA Button */}
      <button className="relative w-full px-3 py-2 text-xs font-medium text-brand-iris bg-brand-iris/10 border border-brand-iris/30 rounded hover:bg-brand-iris/20 hover:border-brand-iris/50 transition-all duration-200 flex items-center justify-center gap-2 group">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
            clipRule="evenodd"
          />
        </svg>
        Unlock with {hook.min_plan.charAt(0).toUpperCase() + hook.min_plan.slice(1)}
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

      {/* Upgrade Hooks Section */}
      {data.upgrade_hooks && data.upgrade_hooks.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-slate-6 uppercase tracking-wide mb-2 px-1 flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-brand-iris" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Premium Insights
          </h3>
          <div className="space-y-3">
            {data.upgrade_hooks.map((hook) => (
              <UpgradeHookCard key={hook.id} hook={hook} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
