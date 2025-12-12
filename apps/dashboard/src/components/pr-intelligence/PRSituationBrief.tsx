/**
 * PR Situation Brief (Sprint S95)
 *
 * Top-level summary answering:
 * - What changed since last time?
 * - What signals are emerging?
 * - What requires PR team attention?
 *
 * DS v2 Compliant with AI transparency
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AIReasoningPopover, type AIReasoningContext } from '@/components/AIReasoningPopover';

// Types
export interface PRChange {
  id: string;
  type: 'new_coverage' | 'mention' | 'journalist_activity' | 'outlet_change' | 'sentiment_shift';
  title: string;
  description: string;
  outlet?: string;
  journalist?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  timestamp: string;
  linkUrl?: string;
}

export interface PRSignal {
  id: string;
  type: 'opportunity' | 'risk' | 'trend' | 'alert';
  severity: number; // 0-100
  title: string;
  description: string;
  confidence: number; // 0-100
  affectedPillars: ('content' | 'seo' | 'exec' | 'crisis')[];
  actionUrl?: string;
}

export interface PRAttentionItem {
  id: string;
  priority: 'critical' | 'high' | 'medium';
  title: string;
  description: string;
  actionLabel: string;
  actionUrl: string;
  dueBy?: string;
}

export interface PRSituationBriefData {
  generatedAt: string;
  timeWindow: 'today' | 'week' | 'month';
  changes: PRChange[];
  signals: PRSignal[];
  attentionItems: PRAttentionItem[];
  aiSummary?: string;
  stats: {
    totalMentions: number;
    positiveCoverage: number;
    negativeCoverage: number;
    journalistsEngaged: number;
  };
}

interface PRSituationBriefProps {
  data: PRSituationBriefData | null;
  loading?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
}

// AI Dot component with enhanced visual presence
function AIDot({ status = 'idle', size = 'sm' }: { status?: 'idle' | 'analyzing' | 'generating'; size?: 'sm' | 'md' }) {
  const sizeClasses = size === 'md' ? 'w-2.5 h-2.5' : 'w-2 h-2';
  const baseClasses = `${sizeClasses} rounded-full`;

  if (status === 'analyzing') {
    return (
      <span className="relative flex">
        <span className={`${baseClasses} bg-brand-cyan animate-pulse`} />
        <span className={`absolute ${baseClasses} bg-brand-cyan animate-ping opacity-50`} />
      </span>
    );
  }
  if (status === 'generating') {
    return (
      <span className="relative flex">
        <span className={`${baseClasses} bg-brand-iris animate-pulse`} />
        <span className={`absolute ${baseClasses} bg-brand-iris animate-ping opacity-50`} />
      </span>
    );
  }
  return <span className={`${baseClasses} bg-slate-6`} />;
}

// Change type styling
const changeTypeStyles: Record<string, { icon: string; color: string; label: string }> = {
  new_coverage: { icon: '📰', color: 'text-brand-cyan', label: 'New Coverage' },
  mention: { icon: '💬', color: 'text-brand-iris', label: 'Mention' },
  journalist_activity: { icon: '✍️', color: 'text-brand-magenta', label: 'Journalist Activity' },
  outlet_change: { icon: '🏢', color: 'text-brand-amber', label: 'Outlet Change' },
  sentiment_shift: { icon: '📊', color: 'text-semantic-warning', label: 'Sentiment Shift' },
};

// Signal type styling
const signalTypeStyles: Record<string, { bg: string; text: string; label: string }> = {
  opportunity: { bg: 'bg-semantic-success/10', text: 'text-semantic-success', label: 'Opportunity' },
  risk: { bg: 'bg-semantic-danger/10', text: 'text-semantic-danger', label: 'Risk' },
  trend: { bg: 'bg-brand-cyan/10', text: 'text-brand-cyan', label: 'Trend' },
  alert: { bg: 'bg-brand-amber/10', text: 'text-brand-amber', label: 'Alert' },
};

// Priority styling
const priorityStyles: Record<string, { bg: string; text: string; border: string; label: string }> = {
  critical: { bg: 'bg-semantic-danger/15', text: 'text-semantic-danger', border: 'border-semantic-danger/30', label: 'Critical' },
  high: { bg: 'bg-brand-amber/15', text: 'text-brand-amber', border: 'border-brand-amber/30', label: 'High' },
  medium: { bg: 'bg-slate-4/60', text: 'text-slate-11', border: 'border-border-subtle', label: 'Medium' },
};

// Sentiment colors
const sentimentColors: Record<string, string> = {
  positive: 'text-semantic-success',
  neutral: 'text-slate-10',
  negative: 'text-semantic-danger',
};

// Pillar colors for affected pillars
const pillarColors: Record<string, { bg: string; text: string; label: string }> = {
  content: { bg: 'bg-brand-cyan/10', text: 'text-brand-cyan', label: 'Content' },
  seo: { bg: 'bg-brand-magenta/10', text: 'text-brand-magenta', label: 'SEO' },
  exec: { bg: 'bg-brand-amber/10', text: 'text-brand-amber', label: 'Executive' },
  crisis: { bg: 'bg-semantic-danger/10', text: 'text-semantic-danger', label: 'Crisis' },
};

export function PRSituationBrief({
  data,
  loading,
  onRefresh,
  refreshing,
}: PRSituationBriefProps) {
  const [activeTab, setActiveTab] = useState<'attention' | 'signals' | 'changes'>('attention');

  // Build AI reasoning context
  const buildReasoningContext = (): AIReasoningContext => ({
    triggerSource: 'PR Intelligence Analysis',
    triggerDescription: `Synthesized from ${data?.stats.totalMentions || 0} mentions and ${data?.stats.journalistsEngaged || 0} journalist interactions`,
    sourcePillar: 'pr',
    relatedPillars: [
      { pillar: 'content', influence: 'informs', description: 'Coverage trends inform content strategy' },
      { pillar: 'exec', influence: 'updates', description: 'High-priority signals update executive digest' },
      { pillar: 'crisis', influence: 'affects', description: 'Negative signals may trigger crisis workflows' },
    ],
    confidence: 85,
    nextActions: [
      { label: 'View All Coverage', href: '/app/pr/journalists', priority: 'high' },
      { label: 'Generate Pitch', href: '/app/pr/pitches', priority: 'medium' },
      { label: 'Create Press Release', href: '/app/pr/generator', priority: 'low' },
    ],
    generatedAt: data?.generatedAt,
  });

  if (loading) {
    return (
      <div className="panel-card p-6 shadow-lg shadow-slate-1/20">
        <div className="flex items-center justify-center py-16">
          <AIDot status="analyzing" />
          <span className="ml-3 text-muted">Analyzing PR landscape...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="panel-card p-6 shadow-lg shadow-slate-1/20">
        <div className="text-center py-12">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-brand-iris/10 flex items-center justify-center">
            <AIDot status="idle" size="md" />
          </div>
          <p className="text-muted font-medium">No PR data available</p>
          <p className="text-sm text-slate-10 mt-1">Connect your media monitoring to get started</p>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="mt-4 px-4 py-2 text-sm font-medium bg-brand-iris/20 text-brand-iris hover:bg-brand-iris/30 rounded-lg transition-colors"
            >
              {refreshing ? 'Generating...' : 'Generate Brief'}
            </button>
          )}
        </div>
      </div>
    );
  }

  const criticalItems = data.attentionItems.filter(i => i.priority === 'critical');
  const highRisks = data.signals.filter(s => s.type === 'risk' && s.severity >= 70);

  return (
    <div className="panel-card overflow-hidden shadow-lg shadow-slate-1/20">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border-subtle bg-gradient-to-r from-slate-3/50 to-slate-3/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-brand-iris/15 ring-1 ring-brand-iris/20">
              <svg className="w-5 h-5 text-brand-iris" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">PR Situation Brief</h2>
                <AIDot status="idle" size="md" />
              </div>
              <p className="text-sm text-slate-10 mt-0.5">
                Last updated {new Date(data.generatedAt).toLocaleTimeString()} · Media intelligence overview
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AIReasoningPopover context={buildReasoningContext()} position="bottom" />
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-4/50 hover:bg-slate-4 text-muted hover:text-white transition-all border border-border-subtle"
              >
                <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-sm font-medium">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-3 mt-5">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-4/60 border border-border-subtle">
            <span className="text-sm font-semibold text-white">{data.stats.totalMentions}</span>
            <span className="text-sm text-slate-10">Mentions</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-semantic-success/10 border border-semantic-success/20">
            <span className="text-sm font-semibold text-semantic-success">{data.stats.positiveCoverage}</span>
            <span className="text-sm text-semantic-success/80">Positive</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-semantic-danger/10 border border-semantic-danger/20">
            <span className="text-sm font-semibold text-semantic-danger">{data.stats.negativeCoverage}</span>
            <span className="text-sm text-semantic-danger/80">Negative</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-iris/10 border border-brand-iris/20">
            <span className="text-sm font-semibold text-brand-iris">{data.stats.journalistsEngaged}</span>
            <span className="text-sm text-brand-iris/80">Journalists</span>
          </div>
          {criticalItems.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-semantic-danger/15 border border-semantic-danger/30 shadow-sm ml-auto">
              <span className="w-2 h-2 rounded-full bg-semantic-danger animate-pulse" />
              <span className="text-sm font-semibold text-semantic-danger">{criticalItems.length} Critical</span>
            </div>
          )}
        </div>
      </div>

      {/* AI Summary */}
      {data.aiSummary && (
        <div className="px-6 py-5 bg-gradient-to-r from-brand-iris/8 via-brand-cyan/5 to-brand-iris/8 border-b border-border-subtle">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-iris/20">
                <svg className="w-3.5 h-3.5 text-brand-iris" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </div>
            <p className="text-sm text-slate-11 leading-relaxed flex-1">{data.aiSummary}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border-subtle bg-slate-2/50">
        {[
          { key: 'attention', label: 'Requires Attention', count: data.attentionItems.length, urgent: criticalItems.length > 0 },
          { key: 'signals', label: 'PR Signals', count: data.signals.length, urgent: highRisks.length > 0 },
          { key: 'changes', label: 'What Changed', count: data.changes.length, urgent: false },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex-1 px-4 py-3.5 text-sm font-medium transition-all relative ${
              activeTab === tab.key
                ? 'text-white bg-slate-3/50'
                : 'text-slate-10 hover:text-white hover:bg-slate-3/30'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              {tab.label}
              {tab.count > 0 && (
                <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${
                  tab.urgent && activeTab !== tab.key
                    ? 'bg-semantic-danger/20 text-semantic-danger'
                    : activeTab === tab.key
                      ? 'bg-brand-iris/20 text-brand-iris'
                      : 'bg-slate-5/60 text-slate-11'
                }`}>
                  {tab.count}
                </span>
              )}
            </span>
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-iris" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-5 max-h-[420px] overflow-y-auto">
        {/* Attention Items */}
        {activeTab === 'attention' && (
          <div className="space-y-4">
            {data.attentionItems.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-semantic-success/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-semantic-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-medium text-white">All Clear</p>
                <p className="text-sm text-slate-10 mt-1">No items require immediate PR attention</p>
              </div>
            ) : (
              data.attentionItems.map((item) => {
                const priority = priorityStyles[item.priority];
                const isCritical = item.priority === 'critical';
                return (
                  <div
                    key={item.id}
                    className={`p-5 rounded-xl border-l-4 ${
                      isCritical
                        ? 'border-l-semantic-danger bg-semantic-danger/5 border border-semantic-danger/20'
                        : item.priority === 'high'
                          ? 'border-l-brand-amber bg-brand-amber/5 border border-brand-amber/20'
                          : 'border-l-slate-6 bg-slate-3/30 border border-border-subtle'
                    } shadow-sm`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${priority.bg} ${priority.text}`}>
                            {priority.label}
                          </span>
                          {item.dueBy && (
                            <span className="text-xs text-slate-10 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Due {new Date(item.dueBy).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <h4 className="font-semibold text-white text-base leading-snug">{item.title}</h4>
                        <p className="text-sm text-slate-11 mt-1.5 leading-relaxed">{item.description}</p>
                      </div>
                      <Link
                        href={item.actionUrl}
                        className={`flex-shrink-0 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                          isCritical
                            ? 'bg-semantic-danger/20 text-semantic-danger hover:bg-semantic-danger/30'
                            : 'bg-brand-iris/15 text-brand-iris hover:bg-brand-iris/25'
                        }`}
                      >
                        {item.actionLabel}
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Signals */}
        {activeTab === 'signals' && (
          <div className="space-y-4">
            {data.signals.length === 0 ? (
              <div className="text-center py-12 text-muted">
                <p>No emerging signals detected</p>
              </div>
            ) : (
              data.signals.map((signal) => {
                const style = signalTypeStyles[signal.type];
                const isRisk = signal.type === 'risk';
                return (
                  <div
                    key={signal.id}
                    className={`p-5 rounded-xl border ${style.bg} ${isRisk ? 'border-semantic-danger/20' : 'border-border-subtle'}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${style.bg}`}>
                        {isRisk ? (
                          <svg className="w-5 h-5 text-semantic-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        ) : signal.type === 'opportunity' ? (
                          <svg className="w-5 h-5 text-semantic-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${style.bg} ${style.text}`}>
                            {style.label}
                          </span>
                          <span className="text-xs text-slate-10">{signal.confidence}% confidence</span>
                          <span className="text-xs text-slate-10">· {signal.severity}% severity</span>
                        </div>
                        <h4 className="font-semibold text-white text-base leading-snug">{signal.title}</h4>
                        <p className="text-sm text-slate-11 mt-1.5 leading-relaxed">{signal.description}</p>
                        {signal.affectedPillars.length > 0 && (
                          <div className="flex items-center gap-2 mt-3">
                            <span className="text-xs text-slate-10">Affects:</span>
                            {signal.affectedPillars.map((p) => {
                              const pc = pillarColors[p];
                              return (
                                <span key={p} className={`text-xs px-2 py-0.5 rounded-full ${pc.bg} ${pc.text}`}>
                                  {pc.label}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      {signal.actionUrl && (
                        <Link
                          href={signal.actionUrl}
                          className="flex-shrink-0 p-2 rounded-lg hover:bg-slate-4/50 text-muted hover:text-white transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Changes */}
        {activeTab === 'changes' && (
          <div className="space-y-4">
            {data.changes.length === 0 ? (
              <div className="text-center py-12 text-muted">
                <p>No changes detected since last review</p>
              </div>
            ) : (
              data.changes.map((change) => {
                const style = changeTypeStyles[change.type];
                return (
                  <div
                    key={change.id}
                    className="p-4 rounded-xl border border-border-subtle bg-slate-3/20"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-slate-4/50 flex items-center justify-center text-lg">
                        {style.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className={`text-xs font-semibold ${style.color}`}>{style.label}</span>
                          {change.outlet && (
                            <span className="text-xs text-slate-10">{change.outlet}</span>
                          )}
                          {change.journalist && (
                            <span className="text-xs text-brand-iris">{change.journalist}</span>
                          )}
                          {change.sentiment && (
                            <span className={`text-xs ${sentimentColors[change.sentiment]}`}>
                              {change.sentiment.charAt(0).toUpperCase() + change.sentiment.slice(1)}
                            </span>
                          )}
                          <span className="text-xs text-slate-10">
                            {new Date(change.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <h4 className="font-semibold text-white">{change.title}</h4>
                        <p className="text-sm text-slate-11 mt-1">{change.description}</p>
                      </div>
                      {change.linkUrl && (
                        <Link
                          href={change.linkUrl}
                          className="flex-shrink-0 p-2 rounded-lg hover:bg-slate-4/50 text-muted hover:text-white transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PRSituationBrief;
