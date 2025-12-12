/**
 * Executive Decision Readiness Panel (Sprint S94)
 *
 * Displays ranked decisions that are:
 * - Pending: Awaiting input or data
 * - Recommended: AI-suggested actions ready for approval
 * - Blocked: Stalled decisions needing attention
 *
 * DS v2 Compliant with AI transparency
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AIReasoningPopover, type AIReasoningContext } from '@/components/AIReasoningPopover';

// Types
export type DecisionStatus = 'pending' | 'recommended' | 'blocked';
export type DecisionUrgency = 'critical' | 'high' | 'medium' | 'low';
export type DecisionCategory = 'strategic' | 'operational' | 'tactical' | 'crisis';

export interface DecisionDependency {
  id: string;
  type: 'data' | 'approval' | 'external' | 'resource';
  description: string;
  satisfied: boolean;
  satisfiedAt?: string;
}

export interface DecisionRecommendation {
  option: string;
  confidence: number; // 0-100
  rationale: string;
  risks: string[];
  benefits: string[];
}

export interface Decision {
  id: string;
  title: string;
  description: string;
  status: DecisionStatus;
  urgency: DecisionUrgency;
  category: DecisionCategory;
  sourcePillar: 'pr' | 'content' | 'seo' | 'exec' | 'crisis';
  dependencies: DecisionDependency[];
  recommendation?: DecisionRecommendation;
  dueBy?: string;
  owner?: string;
  createdAt: string;
  updatedAt: string;
  actionUrl?: string;
}

export interface DecisionPanelData {
  decisions: Decision[];
  generatedAt: string;
}

interface ExecDecisionPanelProps {
  data: DecisionPanelData | null;
  loading?: boolean;
  onApprove?: (decisionId: string) => void;
  onDefer?: (decisionId: string) => void;
  onResolve?: (decisionId: string) => void;
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

// Pillar colors
const pillarColors: Record<string, { bg: string; text: string; label: string }> = {
  pr: { bg: 'bg-brand-iris/10', text: 'text-brand-iris', label: 'PR' },
  content: { bg: 'bg-brand-cyan/10', text: 'text-brand-cyan', label: 'Content' },
  seo: { bg: 'bg-brand-magenta/10', text: 'text-brand-magenta', label: 'SEO' },
  exec: { bg: 'bg-brand-amber/10', text: 'text-brand-amber', label: 'Executive' },
  crisis: { bg: 'bg-semantic-danger/10', text: 'text-semantic-danger', label: 'Crisis' },
};

// Status styling
const statusStyles: Record<DecisionStatus, { bg: string; text: string; border: string; label: string; icon: string }> = {
  pending: {
    bg: 'bg-brand-amber/10',
    text: 'text-brand-amber',
    border: 'border-brand-amber/20',
    label: 'Pending',
    icon: '◯',
  },
  recommended: {
    bg: 'bg-semantic-success/10',
    text: 'text-semantic-success',
    border: 'border-semantic-success/20',
    label: 'Recommended',
    icon: '✓',
  },
  blocked: {
    bg: 'bg-semantic-danger/10',
    text: 'text-semantic-danger',
    border: 'border-semantic-danger/20',
    label: 'Blocked',
    icon: '✕',
  },
};

// Urgency styling
const urgencyStyles: Record<DecisionUrgency, { dot: string; label: string }> = {
  critical: { dot: 'bg-semantic-danger', label: 'Critical' },
  high: { dot: 'bg-brand-amber', label: 'High' },
  medium: { dot: 'bg-brand-cyan', label: 'Medium' },
  low: { dot: 'bg-slate-6', label: 'Low' },
};

// Category labels
const categoryLabels: Record<DecisionCategory, string> = {
  strategic: 'Strategic',
  operational: 'Operational',
  tactical: 'Tactical',
  crisis: 'Crisis Response',
};

export function ExecDecisionPanel({
  data,
  loading,
  onApprove,
  onDefer,
  onResolve,
}: ExecDecisionPanelProps) {
  const [selectedStatus, setSelectedStatus] = useState<DecisionStatus | 'all'>('all');
  const [expandedDecision, setExpandedDecision] = useState<string | null>(null);

  // Build AI reasoning context
  const buildReasoningContext = (decision: Decision): AIReasoningContext => ({
    triggerSource: `${categoryLabels[decision.category]} Decision Analysis`,
    triggerDescription: decision.recommendation?.rationale || 'Analysis based on cross-pillar signals',
    sourcePillar: decision.sourcePillar,
    relatedPillars: [
      { pillar: 'exec', influence: 'informs', description: 'Executive oversight required' },
    ],
    confidence: decision.recommendation?.confidence || 70,
    nextActions: [
      { label: 'View Details', href: decision.actionUrl || '/app/exec', priority: 'high' },
      { label: 'Review Dependencies', href: '/app/exec', priority: 'medium' },
    ],
    generatedAt: decision.updatedAt,
  });

  if (loading) {
    return (
      <div className="panel-card p-6">
        <div className="flex items-center justify-center py-12">
          <AIDot status="analyzing" />
          <span className="ml-3 text-muted">Analyzing decisions...</span>
        </div>
      </div>
    );
  }

  if (!data || data.decisions.length === 0) {
    return (
      <div className="panel-card p-6">
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-slate-4/50 flex items-center justify-center">
            <svg className="w-6 h-6 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <p className="text-muted">No pending decisions</p>
          <p className="text-sm text-slate-6 mt-1">All decisions have been resolved</p>
        </div>
      </div>
    );
  }

  // Filter and sort decisions
  const filteredDecisions = data.decisions
    .filter(d => selectedStatus === 'all' || d.status === selectedStatus)
    .sort((a, b) => {
      // Sort by urgency first
      const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      if (urgencyDiff !== 0) return urgencyDiff;
      // Then by status (recommended first)
      const statusOrder = { recommended: 0, blocked: 1, pending: 2 };
      return statusOrder[a.status] - statusOrder[b.status];
    });

  // Count by status
  const statusCounts = {
    pending: data.decisions.filter(d => d.status === 'pending').length,
    recommended: data.decisions.filter(d => d.status === 'recommended').length,
    blocked: data.decisions.filter(d => d.status === 'blocked').length,
  };

  return (
    <div className="panel-card overflow-hidden shadow-lg shadow-slate-1/20">
      {/* Header - Enhanced visual hierarchy */}
      <div className="px-6 py-5 border-b border-border-subtle bg-gradient-to-r from-slate-3/50 to-slate-3/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-brand-iris/15 ring-1 ring-brand-iris/20">
              <svg className="w-5 h-5 text-brand-iris" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">Decision Readiness</h2>
                <AIDot status="idle" size="md" />
              </div>
              <p className="text-sm text-slate-10 mt-0.5">
                {data.decisions.length} decisions tracked · AI-prioritized queue
              </p>
            </div>
          </div>
          {/* Quick Stats */}
          {statusCounts.blocked > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-semantic-danger/15 border border-semantic-danger/30">
              <span className="w-2 h-2 rounded-full bg-semantic-danger animate-pulse" />
              <span className="text-sm font-semibold text-semantic-danger">{statusCounts.blocked} Blocked</span>
            </div>
          )}
        </div>

        {/* Status Tabs - Enhanced contrast */}
        <div className="flex items-center gap-2 mt-5">
          <button
            onClick={() => setSelectedStatus('all')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              selectedStatus === 'all'
                ? 'bg-slate-4 text-white shadow-sm'
                : 'text-slate-10 hover:text-white hover:bg-slate-4/50'
            }`}
          >
            All ({data.decisions.length})
          </button>
          {(['recommended', 'pending', 'blocked'] as DecisionStatus[]).map((status) => {
            const style = statusStyles[status];
            const count = statusCounts[status];
            const isActive = selectedStatus === status;
            return (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                  isActive
                    ? `${style.bg} ${style.text} shadow-sm ring-1 ${style.border}`
                    : 'text-slate-10 hover:text-white hover:bg-slate-4/50'
                }`}
              >
                <span className={`text-xs ${isActive ? '' : 'opacity-60'}`}>{style.icon}</span>
                {style.label}
                <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                  isActive ? 'bg-white/10' : 'bg-slate-5/50'
                }`}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Decisions List - Enhanced spacing */}
      <div className="p-5 max-h-[520px] overflow-y-auto space-y-4">
        {filteredDecisions.length === 0 ? (
          <div className="text-center py-12 text-muted">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-4/50 flex items-center justify-center">
              <svg className="w-6 h-6 text-slate-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="font-medium text-white">No Matching Decisions</p>
            <p className="text-sm text-slate-10 mt-1">No decisions match the selected filter</p>
          </div>
        ) : (
          filteredDecisions.map((decision) => {
            const status = statusStyles[decision.status];
            const urgency = urgencyStyles[decision.urgency];
            const pillar = pillarColors[decision.sourcePillar];
            const isExpanded = expandedDecision === decision.id;
            const satisfiedDeps = decision.dependencies.filter(d => d.satisfied).length;
            const totalDeps = decision.dependencies.length;
            const isBlocked = decision.status === 'blocked';
            const isRecommended = decision.status === 'recommended';

            return (
              <div
                key={decision.id}
                className={`rounded-xl border overflow-hidden shadow-sm transition-all ${
                  isBlocked
                    ? 'border-semantic-danger/30 bg-semantic-danger/5'
                    : isRecommended
                      ? 'border-semantic-success/30 bg-semantic-success/5'
                      : `${status.border} bg-slate-3/20`
                }`}
              >
                {/* Decision Header - Enhanced contrast */}
                <div
                  className={`p-5 cursor-pointer hover:bg-white/[0.02] transition-all`}
                  onClick={() => setExpandedDecision(isExpanded ? null : decision.id)}
                >
                  <div className="flex items-start gap-4">
                    {/* Urgency Indicator - Enhanced visibility */}
                    <div className={`w-3 h-3 rounded-full mt-1.5 ${urgency.dot} ring-2 ring-offset-2 ring-offset-slate-2 ${
                      decision.urgency === 'critical' ? 'ring-semantic-danger/30' : 'ring-transparent'
                    }`} />

                    <div className="flex-1 min-w-0">
                      {/* Meta row - Better spacing */}
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${status.bg} ${status.text}`}>
                          {status.icon} {status.label}
                        </span>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${pillar.bg} ${pillar.text}`}>
                          {pillar.label}
                        </span>
                        <span className="text-xs text-slate-10 px-2 py-1 bg-slate-4/30 rounded-full">
                          {categoryLabels[decision.category]}
                        </span>
                        {decision.dueBy && (
                          <span className="text-xs text-slate-10 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Due {new Date(decision.dueBy).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* Title - Enhanced typography */}
                      <h4 className="font-semibold text-white text-base leading-snug">{decision.title}</h4>

                      {/* Dependencies Progress - Enhanced visual */}
                      {totalDeps > 0 && (
                        <div className="flex items-center gap-3 mt-3">
                          <div className="flex-1 h-2 bg-slate-5/50 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                satisfiedDeps === totalDeps ? 'bg-semantic-success' : 'bg-brand-amber'
                              }`}
                              style={{ width: `${(satisfiedDeps / totalDeps) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-slate-11">
                            {satisfiedDeps}/{totalDeps} dependencies
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions - Better spacing */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <AIReasoningPopover context={buildReasoningContext(decision)} position="left" />
                      <div className={`p-1.5 rounded-lg ${isExpanded ? 'bg-slate-4' : 'hover:bg-slate-4/50'} transition-colors`}>
                        <svg
                          className={`w-4 h-4 text-slate-10 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="p-4 border-t border-border-subtle bg-slate-2/50 space-y-4">
                    {/* Description */}
                    <p className="text-sm text-slate-11">{decision.description}</p>

                    {/* Recommendation */}
                    {decision.recommendation && (
                      <div className="p-3 rounded-lg bg-semantic-success/5 border border-semantic-success/20">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium text-semantic-success">
                            AI Recommendation ({decision.recommendation.confidence}% confidence)
                          </span>
                        </div>
                        <p className="text-sm font-medium text-white mb-2">
                          {decision.recommendation.option}
                        </p>
                        <p className="text-sm text-muted">{decision.recommendation.rationale}</p>

                        {/* Benefits & Risks */}
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          {decision.recommendation.benefits.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-semantic-success mb-1">Benefits</p>
                              <ul className="text-xs text-muted space-y-1">
                                {decision.recommendation.benefits.map((b, i) => (
                                  <li key={i} className="flex items-start gap-1">
                                    <span className="text-semantic-success">+</span>
                                    {b}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {decision.recommendation.risks.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-semantic-danger mb-1">Risks</p>
                              <ul className="text-xs text-muted space-y-1">
                                {decision.recommendation.risks.map((r, i) => (
                                  <li key={i} className="flex items-start gap-1">
                                    <span className="text-semantic-danger">-</span>
                                    {r}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Dependencies */}
                    {decision.dependencies.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted mb-2">Dependencies</p>
                        <div className="space-y-2">
                          {decision.dependencies.map((dep) => (
                            <div
                              key={dep.id}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                                dep.satisfied
                                  ? 'bg-semantic-success/5 border border-semantic-success/20'
                                  : 'bg-slate-4/30 border border-border-subtle'
                              }`}
                            >
                              <span className={`text-xs ${dep.satisfied ? 'text-semantic-success' : 'text-slate-6'}`}>
                                {dep.satisfied ? '✓' : '○'}
                              </span>
                              <span className="text-xs text-muted flex-1">{dep.description}</span>
                              <span className="text-xs text-slate-6 capitalize">{dep.type}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-2">
                      {decision.status === 'recommended' && onApprove && (
                        <button
                          onClick={() => onApprove(decision.id)}
                          className="px-4 py-2 text-sm font-medium bg-semantic-success/20 text-semantic-success hover:bg-semantic-success/30 rounded-lg transition-colors"
                        >
                          Approve Recommendation
                        </button>
                      )}
                      {decision.status === 'blocked' && onResolve && (
                        <button
                          onClick={() => onResolve(decision.id)}
                          className="px-4 py-2 text-sm font-medium bg-brand-amber/20 text-brand-amber hover:bg-brand-amber/30 rounded-lg transition-colors"
                        >
                          Resolve Blockers
                        </button>
                      )}
                      {onDefer && (
                        <button
                          onClick={() => onDefer(decision.id)}
                          className="px-4 py-2 text-sm font-medium text-muted hover:text-white hover:bg-slate-4/50 rounded-lg transition-colors"
                        >
                          Defer
                        </button>
                      )}
                      {decision.actionUrl && (
                        <Link
                          href={decision.actionUrl}
                          className="ml-auto px-4 py-2 text-sm font-medium text-brand-cyan hover:bg-brand-cyan/10 rounded-lg transition-colors"
                        >
                          View Details →
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default ExecDecisionPanel;
