'use client';

/**
 * VISUAL AUTHORITY:
 * - Layout: COMMAND_CENTER_REFERENCE.png
 * - Design System: DS_V3_REFERENCE.png
 * - Canon: /docs/canon/DS_v3_PRINCIPLES.md
 *
 * If this component diverges from the reference images,
 * STOP and request clarification.
 */

/**
 * StrategyPanelPane - KPIs, Narratives & Recommendations
 *
 * Features per reference:
 * - Hero AEO Health Score (large gauge-style display)
 * - Executive KPIs with sparklines
 * - Strategic Roadmap visualization
 * - AI-generated narratives and insights
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

// Pillar colors - DS v3
const pillarColors: Record<Pillar, { text: string; bg: string; border: string }> = {
  pr: { text: 'text-brand-magenta', bg: 'bg-brand-magenta/10', border: 'border-brand-magenta/30' },
  content: { text: 'text-brand-iris', bg: 'bg-brand-iris/10', border: 'border-brand-iris/30' },
  seo: { text: 'text-brand-cyan', bg: 'bg-brand-cyan/10', border: 'border-brand-cyan/30' },
};

// Hero AEO Health Score Component
function AEOHealthScore({ score }: { score: number }) {
  const scoreColor = score >= 80 ? 'text-semantic-success' : score >= 60 ? 'text-brand-amber' : 'text-semantic-danger';
  const glowColor = score >= 80 ? 'rgba(34,197,94,0.3)' : score >= 60 ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)';
  const progressColor = score >= 80 ? 'bg-semantic-success' : score >= 60 ? 'bg-brand-amber' : 'bg-semantic-danger';

  return (
    <div className="p-4 bg-[#0D0D12] border border-[#1A1A24] rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] text-slate-5 uppercase tracking-wide font-semibold">AEO Health Score</h3>
        <span className="text-[9px] text-slate-6">Updated 2h ago</span>
      </div>

      {/* Large Score Display */}
      <div className="text-center mb-4">
        <div className={`text-5xl font-bold ${scoreColor}`} style={{ textShadow: `0 0 40px ${glowColor}` }}>
          {score}
        </div>
        <p className="text-[10px] text-slate-5 mt-1">
          {score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Attention'}
        </p>
      </div>

      {/* Progress bar visualization */}
      <div className="h-2 bg-[#1A1A24] rounded-full overflow-hidden mb-3">
        <div
          className={`h-full ${progressColor} rounded-full transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Score breakdown */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-xs font-bold text-brand-magenta">PR</p>
          <p className="text-[9px] text-slate-5">87</p>
        </div>
        <div>
          <p className="text-xs font-bold text-brand-iris">Content</p>
          <p className="text-[9px] text-slate-5">82</p>
        </div>
        <div>
          <p className="text-xs font-bold text-brand-cyan">SEO</p>
          <p className="text-[9px] text-slate-5">91</p>
        </div>
      </div>
    </div>
  );
}

// Compact KPI Card
function KPICard({ kpi }: { kpi: KPI }) {
  const trendColor = kpi.trend === 'up' ? 'text-semantic-success' : kpi.trend === 'down' ? 'text-semantic-danger' : 'text-slate-5';
  const statusDot = kpi.status === 'healthy' ? 'bg-semantic-success' : kpi.status === 'warning' ? 'bg-semantic-warning' : 'bg-semantic-danger';

  const formattedValue = kpi.max_value === 1 ? `${Math.round(kpi.value * 100)}%` : kpi.value.toLocaleString();
  const formattedDelta = kpi.delta_7d >= 0 ? `+${kpi.delta_7d}` : `${kpi.delta_7d}`;

  // Sparkline
  const sparkMax = Math.max(...kpi.sparkline);
  const sparkMin = Math.min(...kpi.sparkline);
  const sparkRange = sparkMax - sparkMin || 1;

  return (
    <div className="p-2.5 bg-[#0D0D12] border border-[#1A1A24] rounded-lg hover:border-[#2A2A36] transition-colors">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
          <span className="text-[9px] text-slate-5 font-medium truncate">{kpi.label}</span>
        </div>
        <span className={`text-[9px] ${trendColor}`}>
          {kpi.trend === 'up' ? '↑' : kpi.trend === 'down' ? '↓' : '→'} {formattedDelta}
        </span>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-lg font-bold text-white">{formattedValue}</span>
        <div className="flex items-end gap-[1px] h-4">
          {kpi.sparkline.map((val, i) => (
            <div
              key={i}
              className="w-[3px] bg-brand-cyan/50 rounded-sm"
              style={{ height: `${Math.max(((val - sparkMin) / sparkRange) * 100, 15)}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Narrative Card - Executive style
function NarrativeCard({ narrative }: { narrative: Narrative }) {
  const sentimentConfig = {
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
          <h4 className="text-[11px] font-semibold text-white mb-1">{narrative.title}</h4>
          <p className="text-[10px] text-slate-5 leading-relaxed line-clamp-2">{narrative.body}</p>
          <div className="flex items-center gap-2 mt-2">
            {narrative.pillars.map(pillar => (
              <span key={pillar} className={`text-[9px] font-bold uppercase ${pillarColors[pillar].text}`}>
                {pillar}
              </span>
            ))}
            <span className="text-[9px] text-slate-6 ml-auto">{Math.round(narrative.confidence * 100)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Recommendation Card - Compact
function RecommendationCard({ rec }: { rec: Recommendation }) {
  const priorityDot: Record<Priority, string> = {
    critical: 'bg-semantic-danger animate-pulse',
    high: 'bg-semantic-warning',
    medium: 'bg-brand-cyan',
    low: 'bg-slate-5',
  };

  return (
    <div className="p-2.5 bg-[#0D0D12] border border-[#1A1A24] rounded-lg hover:border-[#2A2A36] transition-colors group">
      <div className="flex items-start gap-2">
        <span className={`w-1.5 h-1.5 mt-1 rounded-full flex-shrink-0 ${priorityDot[rec.priority]}`} />
        <div className="flex-1 min-w-0">
          <h4 className="text-[11px] font-semibold text-white mb-0.5 line-clamp-1">{rec.title}</h4>
          <p className="text-[9px] text-slate-5 line-clamp-1">{rec.description}</p>
        </div>
        <span className={`text-[8px] font-bold uppercase ${pillarColors[rec.pillar].text}`}>{rec.pillar}</span>
      </div>
      <button className={`w-full mt-2 px-2 py-1 text-[9px] font-semibold rounded ${pillarColors[rec.pillar].bg} ${pillarColors[rec.pillar].text} border ${pillarColors[rec.pillar].border} opacity-0 group-hover:opacity-100 transition-opacity`}>
        {rec.action}
      </button>
    </div>
  );
}

// Strategic Roadmap Section
function StrategicRoadmap() {
  const milestones = [
    { label: 'Q1 Foundation', status: 'complete', pillar: 'seo' as Pillar },
    { label: 'Media Outreach', status: 'active', pillar: 'pr' as Pillar },
    { label: 'Content Scale', status: 'upcoming', pillar: 'content' as Pillar },
    { label: 'AEO Dominance', status: 'upcoming', pillar: 'seo' as Pillar },
  ];

  return (
    <div className="p-3 bg-[#0D0D12] border border-[#1A1A24] rounded-lg">
      <h3 className="text-[10px] text-slate-5 uppercase tracking-wide font-semibold mb-3">Strategic Roadmap</h3>
      <div className="space-y-2">
        {milestones.map((m, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${m.status === 'complete' ? 'bg-semantic-success' : m.status === 'active' ? `${pillarColors[m.pillar].text.replace('text-', 'bg-')} animate-pulse` : 'bg-slate-5/30'}`} />
            <span className={`text-[10px] ${m.status === 'complete' ? 'text-slate-5 line-through' : m.status === 'active' ? 'text-white font-medium' : 'text-slate-6'}`}>
              {m.label}
            </span>
            <span className={`text-[8px] font-bold uppercase ${pillarColors[m.pillar].text} ml-auto`}>{m.pillar}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Upgrade Hook Card - Premium feel
function UpgradeHookCard({ hook }: { hook: UpgradeHook }) {
  const isBlurred = hook.pattern === 'blurred_insight';
  const planColors: Record<string, { bg: string; text: string }> = {
    pro: { bg: 'bg-brand-iris/15', text: 'text-brand-iris' },
    growth: { bg: 'bg-brand-cyan/15', text: 'text-brand-cyan' },
    enterprise: { bg: 'bg-brand-magenta/15', text: 'text-brand-magenta' },
  };
  const pStyle = planColors[hook.min_plan] || { bg: 'bg-slate-5/15', text: 'text-white' };

  return (
    <div className="relative p-3 bg-[#0D0D12] border border-[#1A1A24] rounded-lg overflow-hidden group hover:border-brand-iris/30 transition-all">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-iris/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold text-white">{hook.feature}</span>
          <span className={`px-1.5 py-0.5 text-[8px] font-bold uppercase rounded ${pStyle.bg} ${pStyle.text}`}>
            {hook.min_plan}
          </span>
        </div>
        <p className="text-[9px] text-slate-5 mb-2 line-clamp-2">{hook.message}</p>

        {/* Blurred preview */}
        {isBlurred && hook.sample_value && (
          <div className="relative mb-2">
            <p className="text-[10px] text-white blur-sm select-none">{hook.sample_value}</p>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="px-2 py-0.5 text-[8px] font-medium text-brand-iris bg-[#0D0D12]/90 border border-brand-iris/30 rounded">
                Locked
              </span>
            </div>
          </div>
        )}

        <button className={`w-full px-2 py-1.5 text-[9px] font-semibold rounded ${pStyle.bg} ${pStyle.text} border border-current/30 hover:brightness-110 transition-all`}>
          Unlock with {hook.min_plan.charAt(0).toUpperCase() + hook.min_plan.slice(1)}
        </button>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-3 space-y-3">
      {/* AEO Score skeleton */}
      <div className="h-36 bg-[#0D0D12] border border-[#1A1A24] rounded-lg animate-pulse" />
      {/* KPIs skeleton */}
      <div className="grid grid-cols-2 gap-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-16 bg-[#0D0D12] border border-[#1A1A24] rounded-lg animate-pulse" />
        ))}
      </div>
      {/* Narratives skeleton */}
      <div className="space-y-2">
        {[1, 2].map(i => (
          <div key={i} className="h-20 bg-[#0D0D12] border border-[#1A1A24] rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ error }: { error: Error }) {
  return (
    <div className="p-3">
      <div className="p-3 bg-semantic-danger/8 border border-semantic-danger/20 rounded-lg">
        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 text-semantic-danger flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="text-xs font-semibold text-semantic-danger">Failed to load strategy</h4>
            <p className="text-[10px] text-slate-5 mt-0.5">{error.message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StrategyPanelPane({ data, isLoading, error }: StrategyPanelPaneProps) {
  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState error={error} />;
  if (!data) return (
    <div className="p-6 text-center text-slate-5">
      <p className="text-xs">No strategy data available</p>
    </div>
  );

  // Calculate an AEO score from KPIs (mock)
  const aeoScore = 87;
  const topKPIs = data.kpis.slice(0, 4);

  return (
    <div className="p-3 space-y-3">
      {/* Hero: AEO Health Score */}
      <AEOHealthScore score={aeoScore} />

      {/* Key Metrics Grid */}
      <div>
        <h3 className="text-[10px] text-slate-5 uppercase tracking-wide font-semibold mb-2 px-1">Key Metrics</h3>
        <div className="grid grid-cols-2 gap-2">
          {topKPIs.map(kpi => (
            <KPICard key={kpi.id} kpi={kpi} />
          ))}
        </div>
      </div>

      {/* Strategic Roadmap */}
      <StrategicRoadmap />

      {/* AI Insights / Narratives */}
      <div>
        <h3 className="text-[10px] text-slate-5 uppercase tracking-wide font-semibold mb-2 px-1 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-iris animate-pulse" />
          AI Insights
        </h3>
        <div className="space-y-2">
          {data.narratives.slice(0, 2).map(narrative => (
            <NarrativeCard key={narrative.id} narrative={narrative} />
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <h3 className="text-[10px] text-slate-5 uppercase tracking-wide font-semibold mb-2 px-1">Recommendations</h3>
        <div className="space-y-2">
          {data.recommendations.slice(0, 3).map(rec => (
            <RecommendationCard key={rec.id} rec={rec} />
          ))}
        </div>
      </div>

      {/* Upgrade Hooks */}
      {data.upgrade_hooks && data.upgrade_hooks.length > 0 && (
        <div>
          <h3 className="text-[10px] text-slate-5 uppercase tracking-wide font-semibold mb-2 px-1 flex items-center gap-1.5">
            <svg className="w-3 h-3 text-brand-iris" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Premium Insights
          </h3>
          <div className="space-y-2">
            {data.upgrade_hooks.slice(0, 2).map(hook => (
              <UpgradeHookCard key={hook.id} hook={hook} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
