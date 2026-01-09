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
 * StrategyPanelPane - Progressive Disclosure Pattern
 *
 * DS v3 density-optimized with glanceable design:
 * - Hero: AEO Health Score (large, prominent)
 * - Key metrics grid (4 compact KPIs)
 * - Primary bottleneck highlight
 * - Top 3 recommendations + "View all" drawer trigger
 * - Insights Drawer for full recommendation list
 *
 * @see /contracts/examples/strategy-panel.json
 */

import { useCallback, useEffect, useState } from 'react';
import type {
  KPI,
  Narrative,
  Pillar,
  Priority,
  Recommendation,
  StrategyPanelResponse,
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

// Priority styling
const priorityConfig: Record<Priority, { dot: string; label: string }> = {
  critical: { dot: 'bg-semantic-danger animate-pulse', label: 'Critical' },
  high: { dot: 'bg-semantic-warning', label: 'High' },
  medium: { dot: 'bg-brand-cyan', label: 'Medium' },
  low: { dot: 'bg-white/30', label: 'Low' },
};

// Hero AEO Health Score Component - Compact
function AEOHealthScore({ score, breakdown }: { score: number; breakdown: { pr: number; content: number; seo: number } }) {
  const scoreColor = score >= 80 ? 'text-semantic-success' : score >= 60 ? 'text-brand-amber' : 'text-semantic-danger';
  const glowColor = score >= 80 ? 'rgba(34,197,94,0.3)' : score >= 60 ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)';
  const progressColor = score >= 80 ? 'bg-semantic-success' : score >= 60 ? 'bg-brand-amber' : 'bg-semantic-danger';

  return (
    <div className="p-3 bg-[#0D0D12] border border-[#1A1A24] rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs text-white/50 uppercase tracking-wide font-semibold">AEO Health Score</h3>
        <span className="text-[11px] text-white/30">Updated 2h ago</span> {/* typography-allow: meta */}
      </div>

      <div className="flex items-center gap-4">
        {/* Large Score */}
        <div className="text-center">
          <div className={`text-4xl font-bold ${scoreColor}`} style={{ textShadow: `0 0 30px ${glowColor}` }}>
            {score}
          </div>
          <p className="text-xs text-white/50 mt-0.5">
            {score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Work'}
          </p>
        </div>

        {/* Mini breakdown */}
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-brand-magenta w-12">PR</span> {/* typography-allow: pillar */}
            <div className="flex-1 h-1.5 bg-[#1A1A24] rounded-full overflow-hidden">
              <div className="h-full bg-brand-magenta rounded-full" style={{ width: `${breakdown.pr}%` }} />
            </div>
            <span className="text-xs text-white w-6 text-right">{breakdown.pr}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-brand-iris w-12">Content</span> {/* typography-allow: pillar */}
            <div className="flex-1 h-1.5 bg-[#1A1A24] rounded-full overflow-hidden">
              <div className="h-full bg-brand-iris rounded-full" style={{ width: `${breakdown.content}%` }} />
            </div>
            <span className="text-xs text-white w-6 text-right">{breakdown.content}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-brand-cyan w-12">SEO</span> {/* typography-allow: pillar */}
            <div className="flex-1 h-1.5 bg-[#1A1A24] rounded-full overflow-hidden">
              <div className="h-full bg-brand-cyan rounded-full" style={{ width: `${breakdown.seo}%` }} />
            </div>
            <span className="text-xs text-white w-6 text-right">{breakdown.seo}</span>
          </div>
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="h-1 bg-[#1A1A24] rounded-full overflow-hidden mt-3">
        <div className={`h-full ${progressColor} rounded-full transition-all duration-500`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

// Compact KPI Card
function KPICard({ kpi }: { kpi: KPI }) {
  const trendColor = kpi.trend === 'up' ? 'text-semantic-success' : kpi.trend === 'down' ? 'text-semantic-danger' : 'text-white/50';
  const trendIcon = kpi.trend === 'up' ? '↑' : kpi.trend === 'down' ? '↓' : '→';
  const statusDot = kpi.status === 'healthy' ? 'bg-semantic-success' : kpi.status === 'warning' ? 'bg-semantic-warning' : 'bg-semantic-danger';

  const formattedValue = kpi.max_value === 1 ? `${Math.round(kpi.value * 100)}%` : kpi.value.toLocaleString();
  const formattedDelta = kpi.delta_7d >= 0 ? `+${kpi.delta_7d}` : `${kpi.delta_7d}`;

  // Sparkline
  const sparkMax = Math.max(...kpi.sparkline);
  const sparkMin = Math.min(...kpi.sparkline);
  const sparkRange = sparkMax - sparkMin || 1;

  return (
    <div className="p-2 bg-[#0D0D12] border border-[#1A1A24] rounded-lg hover:border-[#2A2A36] transition-colors">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <span className={`w-1 h-1 rounded-full ${statusDot}`} />
          <span className="text-[11px] text-white/50 font-medium truncate">{kpi.label}</span> {/* typography-allow: label */}
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <span className="text-base font-bold text-white">{formattedValue}</span>
          <span className={`text-[11px] ${trendColor} ml-1`}> {/* typography-allow: trend */}
            {trendIcon} {formattedDelta}
          </span>
        </div>
        <div className="flex items-end gap-[1px] h-3">
          {kpi.sparkline.slice(-6).map((val, i) => (
            <div
              key={i}
              className="w-[2px] bg-brand-cyan/50 rounded-sm"
              style={{ height: `${Math.max(((val - sparkMin) / sparkRange) * 100, 15)}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Primary Bottleneck Card
function BottleneckCard({ narrative }: { narrative: Narrative }) {
  return (
    <div className="p-2.5 bg-semantic-warning/8 border border-semantic-warning/20 rounded-lg">
      <div className="flex items-start gap-2">
        <span className="text-semantic-warning text-sm">⚠</span>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-semibold text-white mb-0.5">{narrative.title}</h4>
          <p className="text-xs text-white/50 line-clamp-2">{narrative.body}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            {narrative.pillars.map(pillar => (
              <span key={pillar} className={`text-[11px] font-bold uppercase ${pillarColors[pillar].text}`}> {/* typography-allow: badge */}
                {pillar}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact Recommendation Card
function RecommendationCard({ rec, onClick }: { rec: Recommendation; onClick?: () => void }) {
  const priorityStyle = priorityConfig[rec.priority];

  return (
    <button
      onClick={onClick}
      className="w-full p-2 bg-[#0D0D12] border border-[#1A1A24] rounded-lg hover:border-[#2A2A36] transition-colors text-left group"
    >
      <div className="flex items-start gap-2">
        <span className={`w-1.5 h-1.5 mt-1 rounded-full flex-shrink-0 ${priorityStyle.dot}`} />
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-semibold text-white line-clamp-1 group-hover:text-brand-cyan transition-colors">{rec.title}</h4>
          <p className="text-[11px] text-white/50 line-clamp-1 mt-0.5">{rec.description}</p> {/* typography-allow: description */}
        </div>
        <span className={`text-[11px] font-bold uppercase ${pillarColors[rec.pillar].text}`}>{rec.pillar}</span> {/* typography-allow: badge */}
      </div>
    </button>
  );
}

// Monthly Targets Section
function MonthlyTargets() {
  const targets = [
    { label: 'PR Coverage', current: 24, target: 30, pillar: 'pr' as Pillar },
    { label: 'Content Pieces', current: 8, target: 12, pillar: 'content' as Pillar },
    { label: 'SEO Tasks', current: 15, target: 20, pillar: 'seo' as Pillar },
  ];

  return (
    <div className="p-2.5 bg-[#0D0D12] border border-[#1A1A24] rounded-lg">
      <h3 className="text-xs text-white/50 uppercase tracking-wide font-semibold mb-2">Monthly Targets</h3>
      <div className="space-y-2">
        {targets.map((t, i) => {
          const pct = Math.min((t.current / t.target) * 100, 100);
          return (
            <div key={i}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs text-white">{t.label}</span>
                <span className={`text-[11px] ${pillarColors[t.pillar].text}`}>{t.current}/{t.target}</span> {/* typography-allow: progress */}
              </div>
              <div className="h-1 bg-[#1A1A24] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${t.pillar === 'pr' ? 'bg-brand-magenta' : t.pillar === 'content' ? 'bg-brand-iris' : 'bg-brand-cyan'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Insights Drawer Component
function InsightsDrawer({
  isOpen,
  onClose,
  recommendations,
  narratives,
}: {
  isOpen: boolean;
  onClose: () => void;
  recommendations: Recommendation[];
  narratives: Narrative[];
}) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer - slides from right */}
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-[#0D0D12] border-l border-[#1A1A24] shadow-2xl shadow-black/50 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1A1A24] bg-[#0A0A0F]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-iris/10 border border-brand-iris/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-brand-iris" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Strategy Insights</h2>
              <p className="text-[11px] text-white/55">All recommendations and AI insights</p> {/* typography-allow: drawer subtitle */}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/50 hover:text-white hover:bg-[#1A1A24] rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* AI Insights Section */}
          <div>
            <h3 className="text-[11px] text-white/55 uppercase tracking-wide font-semibold mb-2 flex items-center gap-1.5"> {/* typography-allow: section header */}
              <span className="w-1.5 h-1.5 rounded-full bg-brand-iris animate-pulse" />
              AI Insights
            </h3>
            <div className="space-y-2">
              {narratives.map((narrative) => {
                const sentimentConfig = {
                  positive: { bg: 'bg-semantic-success/8', border: 'border-semantic-success/20', icon: '✓', iconColor: 'text-semantic-success' },
                  warning: { bg: 'bg-semantic-warning/8', border: 'border-semantic-warning/20', icon: '!', iconColor: 'text-semantic-warning' },
                  opportunity: { bg: 'bg-brand-cyan/8', border: 'border-brand-cyan/20', icon: '★', iconColor: 'text-brand-cyan' },
                };
                const style = sentimentConfig[narrative.sentiment];

                return (
                  <div key={narrative.id} className={`p-3 ${style.bg} border ${style.border} rounded-lg`}>
                    <div className="flex items-start gap-2">
                      <span className={`text-sm ${style.iconColor}`}>{style.icon}</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-white mb-1">{narrative.title}</h4>
                        <p className="text-[11px] text-white/55 leading-relaxed">{narrative.body}</p> {/* typography-allow: narrative body */}
                        <div className="flex items-center gap-2 mt-2">
                          {narrative.pillars.map(pillar => (
                            <span key={pillar} className={`text-[11px] font-bold uppercase ${pillarColors[pillar].text}`}> {/* typography-allow: pillar badge */}
                              {pillar}
                            </span>
                          ))}
                          <span className="text-[11px] text-white/40 ml-auto">{Math.round(narrative.confidence * 100)}% confidence</span> {/* typography-allow: confidence */}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* All Recommendations Section */}
          <div>
            <h3 className="text-[11px] text-white/55 uppercase tracking-wide font-semibold mb-2"> {/* typography-allow: section header */}
              All Recommendations ({recommendations.length})
            </h3>
            <div className="space-y-2">
              {recommendations.map((rec) => {
                const priorityStyle = priorityConfig[rec.priority];
                const effortLabel = rec.effort === 'low' ? 'Quick Win' : rec.effort === 'medium' ? 'Moderate' : 'Major';
                const impactLabel = rec.impact === 'high' ? 'High Impact' : rec.impact === 'medium' ? 'Medium' : 'Low';

                return (
                  <div key={rec.id} className="p-3 bg-[#0A0A0F] border border-[#1A1A24] rounded-lg hover:border-[#2A2A36] transition-colors">
                    <div className="flex items-start gap-2 mb-2">
                      <span className={`w-2 h-2 mt-0.5 rounded-full flex-shrink-0 ${priorityStyle.dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-semibold text-white">{rec.title}</h4>
                          <span className={`text-[11px] font-bold uppercase px-1.5 py-0.5 rounded ${pillarColors[rec.pillar].bg} ${pillarColors[rec.pillar].text}`}> {/* typography-allow: pillar badge */}
                            {rec.pillar}
                          </span>
                        </div>
                        <p className="text-[11px] text-white/55 mt-1">{rec.description}</p> {/* typography-allow: rec description */}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-[#1A1A24]">
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-white/55"> {/* typography-allow: effort label */}
                          Effort: <span className="text-white">{effortLabel}</span>
                        </span>
                        <span className="text-[11px] text-white/55"> {/* typography-allow: impact label */}
                          Impact: <span className={rec.impact === 'high' ? 'text-semantic-success' : 'text-white'}>{impactLabel}</span>
                        </span>
                      </div>
                      <button className={`px-2 py-1 text-[11px] font-semibold rounded ${pillarColors[rec.pillar].bg} ${pillarColors[rec.pillar].text} border ${pillarColors[rec.pillar].border} hover:brightness-110 transition-all`}> {/* typography-allow: action button */}
                        {rec.action}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[#1A1A24] bg-[#0A0A0F]">
          <p className="text-[11px] text-white/40 text-center"> {/* typography-allow: footer hint */}
            Press <kbd className="px-1 py-0.5 bg-[#1A1A24] rounded text-white/55">Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-3 space-y-3">
      {/* AEO Score skeleton */}
      <div className="h-28 bg-[#0D0D12] border border-[#1A1A24] rounded-lg animate-pulse" />
      {/* KPIs skeleton */}
      <div className="grid grid-cols-2 gap-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-14 bg-[#0D0D12] border border-[#1A1A24] rounded-lg animate-pulse" />
        ))}
      </div>
      {/* Recommendations skeleton */}
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-12 bg-[#0D0D12] border border-[#1A1A24] rounded-lg animate-pulse" />
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
            <p className="text-[11px] text-white/50 mt-0.5">{error.message}</p> {/* typography-allow: error meta */}
          </div>
        </div>
      </div>
    </div>
  );
}

export function StrategyPanelPane({ data, isLoading, error }: StrategyPanelPaneProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleOpenDrawer = useCallback(() => {
    setIsDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState error={error} />;
  if (!data) return (
    <div className="p-6 text-center text-white/50">
      <p className="text-xs">No strategy data available</p>
    </div>
  );

  // Calculate AEO score and breakdown (mock)
  const aeoScore = 87;
  const aeoBreakdown = { pr: 87, content: 82, seo: 91 };
  const topKPIs = data.kpis.slice(0, 4);
  const topRecommendations = data.recommendations.slice(0, 3);
  const primaryBottleneck = data.narratives.find(n => n.sentiment === 'warning');

  return (
    <>
      <div className="p-3 space-y-3 h-full overflow-y-auto">
        {/* Hero: AEO Health Score */}
        <AEOHealthScore score={aeoScore} breakdown={aeoBreakdown} />

        {/* Key Metrics Grid */}
        <div>
          <h3 className="text-[11px] text-white/50 uppercase tracking-wide font-semibold mb-2 px-0.5">Key Metrics</h3> {/* typography-allow: section header */}
          <div className="grid grid-cols-2 gap-2">
            {topKPIs.map(kpi => (
              <KPICard key={kpi.id} kpi={kpi} />
            ))}
          </div>
        </div>

        {/* Primary Bottleneck */}
        {primaryBottleneck && (
          <div>
            <h3 className="text-[11px] text-white/50 uppercase tracking-wide font-semibold mb-2 px-0.5">Primary Bottleneck</h3> {/* typography-allow: section header */}
            <BottleneckCard narrative={primaryBottleneck} />
          </div>
        )}

        {/* Top Recommendations + View All */}
        <div>
          <div className="flex items-center justify-between mb-2 px-0.5">
            <h3 className="text-[11px] text-white/50 uppercase tracking-wide font-semibold">Recommendations</h3> {/* typography-allow: section header */}
            <button
              onClick={handleOpenDrawer}
              className="text-[11px] text-brand-cyan hover:text-brand-cyan/80 transition-colors" /* typography-allow: link */
            >
              View all ({data.recommendations.length}) →
            </button>
          </div>
          <div className="space-y-1.5">
            {topRecommendations.map(rec => (
              <RecommendationCard key={rec.id} rec={rec} onClick={handleOpenDrawer} />
            ))}
          </div>
        </div>

        {/* Monthly Targets */}
        <MonthlyTargets />
      </div>

      {/* Insights Drawer */}
      <InsightsDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        recommendations={data.recommendations}
        narratives={data.narratives}
      />
    </>
  );
}
