/**
 * Executive Situation Brief (Sprint S94)
 *
 * AI-generated brief answering:
 * - What changed since last time?
 * - What risks/opportunities are emerging?
 * - What requires executive attention now?
 *
 * DS v2 Compliant with AI transparency
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AIReasoningPopover, type AIReasoningContext } from '@/components/AIReasoningPopover';

// Types
export interface SituationChange {
  id: string;
  pillar: 'pr' | 'content' | 'seo' | 'exec' | 'crisis';
  title: string;
  description: string;
  changeType: 'new' | 'escalated' | 'resolved' | 'trending';
  previousValue?: string;
  currentValue?: string;
  timestamp: string;
  linkUrl?: string;
}

export interface EmergingSignal {
  id: string;
  type: 'risk' | 'opportunity';
  severity: number; // 0-100
  title: string;
  description: string;
  sourcePillar: 'pr' | 'content' | 'seo' | 'exec' | 'crisis';
  affectedPillars: ('pr' | 'content' | 'seo' | 'exec' | 'crisis')[];
  confidence: number; // 0-100
  actionUrl?: string;
}

export interface AttentionItem {
  id: string;
  priority: 'critical' | 'high' | 'medium';
  title: string;
  description: string;
  dueBy?: string;
  pillar: 'pr' | 'content' | 'seo' | 'exec' | 'crisis';
  actionLabel: string;
  actionUrl: string;
}

export interface SituationBriefData {
  generatedAt: string;
  timeWindow: 'today' | 'week' | 'month';
  changes: SituationChange[];
  emergingSignals: EmergingSignal[];
  attentionItems: AttentionItem[];
  aiSummary?: string;
}

interface ExecSituationBriefProps {
  data: SituationBriefData | null;
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

// Pillar colors matching DS v2
const pillarColors: Record<string, { bg: string; text: string; border: string; label: string }> = {
  pr: { bg: 'bg-brand-iris/10', text: 'text-brand-iris', border: 'border-brand-iris/20', label: 'PR Intelligence' },
  content: { bg: 'bg-brand-cyan/10', text: 'text-brand-cyan', border: 'border-brand-cyan/20', label: 'Content Hub' },
  seo: { bg: 'bg-brand-magenta/10', text: 'text-brand-magenta', border: 'border-brand-magenta/20', label: 'SEO' },
  exec: { bg: 'bg-brand-amber/10', text: 'text-brand-amber', border: 'border-brand-amber/20', label: 'Executive' },
  crisis: { bg: 'bg-semantic-danger/10', text: 'text-semantic-danger', border: 'border-semantic-danger/20', label: 'Crisis' },
};

// Change type icons
const changeTypeIcons: Record<string, { icon: string; label: string; color: string }> = {
  new: { icon: '●', label: 'New', color: 'text-brand-cyan' },
  escalated: { icon: '▲', label: 'Escalated', color: 'text-semantic-danger' },
  resolved: { icon: '✓', label: 'Resolved', color: 'text-semantic-success' },
  trending: { icon: '→', label: 'Trending', color: 'text-brand-amber' },
};

// Priority styling
const priorityStyles: Record<string, { bg: string; text: string; label: string }> = {
  critical: { bg: 'bg-semantic-danger/10', text: 'text-semantic-danger', label: 'Critical' },
  high: { bg: 'bg-brand-amber/10', text: 'text-brand-amber', label: 'High' },
  medium: { bg: 'bg-slate-5/50', text: 'text-muted', label: 'Medium' },
};

export function ExecSituationBrief({
  data,
  loading,
  onRefresh,
  refreshing,
}: ExecSituationBriefProps) {
  const [activeTab, setActiveTab] = useState<'changes' | 'signals' | 'attention'>('attention');

  // Build AI reasoning context for the brief
  const buildReasoningContext = (): AIReasoningContext => ({
    triggerSource: 'Executive Situation Analysis',
    triggerDescription: `Generated from ${data?.changes.length || 0} changes, ${data?.emergingSignals.length || 0} signals across all pillars`,
    sourcePillar: 'exec',
    relatedPillars: [
      { pillar: 'pr', influence: 'informs', description: 'PR signals and media coverage' },
      { pillar: 'content', influence: 'informs', description: 'Content performance metrics' },
      { pillar: 'seo', influence: 'informs', description: 'Search visibility data' },
    ],
    confidence: 85,
    nextActions: [
      { label: 'Review All Signals', href: '/app/exec', priority: 'high' },
      { label: 'View Crisis Radar', href: '/app/exec/crisis', priority: 'medium' },
    ],
    generatedAt: data?.generatedAt,
  });

  if (loading) {
    return (
      <div className="panel-card p-6">
        <div className="flex items-center justify-center py-12">
          <AIDot status="analyzing" />
          <span className="ml-3 text-muted">Analyzing situation...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="panel-card p-6">
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-slate-4/50 flex items-center justify-center">
            <AIDot status="idle" />
          </div>
          <p className="text-muted">No situation data available</p>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="mt-4 px-4 py-2 text-sm font-medium text-brand-cyan hover:text-white hover:bg-brand-cyan/20 rounded-lg transition-colors"
            >
              {refreshing ? 'Generating...' : 'Generate Brief'}
            </button>
          )}
        </div>
      </div>
    );
  }

  const criticalAttention = data.attentionItems.filter(i => i.priority === 'critical');
  const highRisks = data.emergingSignals.filter(s => s.type === 'risk' && s.severity >= 70);

  return (
    <div className="panel-card overflow-hidden shadow-lg shadow-slate-1/20">
      {/* Header - Enhanced visual hierarchy */}
      <div className="px-6 py-5 border-b border-border-subtle bg-gradient-to-r from-slate-3/50 to-slate-3/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-brand-amber/15 ring-1 ring-brand-amber/20">
              <svg className="w-5 h-5 text-brand-amber" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">Executive Situation Brief</h2>
                <AIDot status="idle" size="md" />
              </div>
              <p className="text-sm text-slate-10 mt-0.5">
                Last updated {new Date(data.generatedAt).toLocaleTimeString()} · AI-synthesized overview
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
                aria-label="Refresh brief"
              >
                <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-sm font-medium">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats - Enhanced contrast & spacing */}
        <div className="flex items-center gap-3 mt-5">
          {criticalAttention.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-semantic-danger/15 border border-semantic-danger/30 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-semantic-danger animate-pulse" />
              <span className="text-sm font-semibold text-semantic-danger">
                {criticalAttention.length} Critical
              </span>
            </div>
          )}
          {highRisks.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-amber/15 border border-brand-amber/30 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-brand-amber" />
              <span className="text-sm font-semibold text-brand-amber">
                {highRisks.length} High Risks
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-4/60 border border-border-subtle">
            <span className="text-sm font-medium text-slate-11">
              {data.changes.length} Changes
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-cyan/10 border border-brand-cyan/20">
            <span className="text-sm font-medium text-brand-cyan">
              {data.emergingSignals.filter(s => s.type === 'opportunity').length} Opportunities
            </span>
          </div>
        </div>
      </div>

      {/* AI Summary - Enhanced readability */}
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

      {/* Tabs - Improved visual distinction */}
      <div className="flex border-b border-border-subtle bg-slate-2/50">
        {[
          { key: 'attention', label: 'Requires Attention', count: data.attentionItems.length, urgent: criticalAttention.length > 0 },
          { key: 'signals', label: 'Emerging Signals', count: data.emergingSignals.length, urgent: highRisks.length > 0 },
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
                      ? 'bg-brand-cyan/20 text-brand-cyan'
                      : 'bg-slate-5/60 text-slate-11'
                }`}>
                  {tab.count}
                </span>
              )}
            </span>
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-cyan" />
            )}
          </button>
        ))}
      </div>

      {/* Content - Enhanced spacing and card contrast */}
      <div className="p-5 max-h-[420px] overflow-y-auto">
        {/* Attention Items */}
        {activeTab === 'attention' && (
          <div className="space-y-4">
            {data.attentionItems.length === 0 ? (
              <div className="text-center py-12 text-muted">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-semantic-success/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-semantic-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-medium text-white">All Clear</p>
                <p className="text-sm text-slate-10 mt-1">No items require immediate attention</p>
              </div>
            ) : (
              data.attentionItems.map((item) => {
                const priority = priorityStyles[item.priority];
                const pillar = pillarColors[item.pillar];
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
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${pillar.bg} ${pillar.text}`}>
                            {pillar.label}
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
                            : 'bg-brand-cyan/15 text-brand-cyan hover:bg-brand-cyan/25'
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

        {/* Emerging Signals */}
        {activeTab === 'signals' && (
          <div className="space-y-3">
            {data.emergingSignals.length === 0 ? (
              <div className="text-center py-8 text-muted">
                <p>No emerging signals detected</p>
              </div>
            ) : (
              data.emergingSignals.map((signal) => {
                const pillar = pillarColors[signal.sourcePillar];
                const isRisk = signal.type === 'risk';
                return (
                  <div
                    key={signal.id}
                    className={`p-4 rounded-lg border ${
                      isRisk ? 'bg-semantic-danger/5 border-semantic-danger/20' : 'bg-semantic-success/5 border-semantic-success/20'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        isRisk ? 'bg-semantic-danger/10' : 'bg-semantic-success/10'
                      }`}>
                        {isRisk ? (
                          <svg className="w-4 h-4 text-semantic-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-semantic-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium ${isRisk ? 'text-semantic-danger' : 'text-semantic-success'}`}>
                            {isRisk ? 'Risk' : 'Opportunity'} ({signal.severity}%)
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded ${pillar.bg} ${pillar.text}`}>
                            {pillar.label}
                          </span>
                          <span className="text-xs text-slate-6">
                            {signal.confidence}% confidence
                          </span>
                        </div>
                        <h4 className="font-medium text-white">{signal.title}</h4>
                        <p className="text-sm text-muted mt-1">{signal.description}</p>
                        {signal.affectedPillars.length > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-slate-6">Affects:</span>
                            {signal.affectedPillars.map((p) => {
                              const pc = pillarColors[p];
                              return (
                                <span key={p} className={`text-xs px-1.5 py-0.5 rounded ${pc.bg} ${pc.text}`}>
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
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="space-y-3">
            {data.changes.length === 0 ? (
              <div className="text-center py-8 text-muted">
                <p>No changes detected since last review</p>
              </div>
            ) : (
              data.changes.map((change) => {
                const changeType = changeTypeIcons[change.changeType];
                const pillar = pillarColors[change.pillar];
                return (
                  <div
                    key={change.id}
                    className="p-4 rounded-lg border border-border-subtle bg-slate-3/20"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-slate-4/50 ${changeType.color}`}>
                        <span className="text-xs">{changeType.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium ${changeType.color}`}>
                            {changeType.label}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded ${pillar.bg} ${pillar.text}`}>
                            {pillar.label}
                          </span>
                          <span className="text-xs text-slate-6">
                            {new Date(change.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <h4 className="font-medium text-white">{change.title}</h4>
                        <p className="text-sm text-muted mt-1">{change.description}</p>
                        {change.previousValue && change.currentValue && (
                          <div className="flex items-center gap-2 mt-2 text-xs">
                            <span className="text-slate-6 line-through">{change.previousValue}</span>
                            <span className="text-slate-6">→</span>
                            <span className="text-white font-medium">{change.currentValue}</span>
                          </div>
                        )}
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

export default ExecSituationBrief;
