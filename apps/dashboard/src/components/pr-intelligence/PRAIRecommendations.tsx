/**
 * PR AI Recommendations (Sprint S95)
 *
 * Actionable, prioritized recommendations with:
 * - Confidence scoring
 * - Impact assessment
 * - One-click actions
 * - AI reasoning transparency
 *
 * DS v2 Compliant
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AIReasoningPopover, type AIReasoningContext } from '@/components/AIReasoningPopover';

// Types
export interface PRRecommendation {
  id: string;
  type: 'pitch' | 'outreach' | 'press_release' | 'follow_up' | 'monitor' | 'respond';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  rationale: string;
  confidence: number; // 0-100
  impact: {
    coverage: 'high' | 'medium' | 'low';
    sentiment: 'positive' | 'neutral' | 'negative';
    reach: number; // estimated audience reach
  };
  actionLabel: string;
  actionUrl: string;
  estimatedEffort: 'quick' | 'moderate' | 'involved';
  relatedJournalists?: string[];
  relatedOutlets?: string[];
  deadline?: string;
  sourcePillars?: ('content' | 'seo' | 'exec' | 'crisis')[];
}

export interface PRAIRecommendationsData {
  generatedAt: string;
  recommendations: PRRecommendation[];
  totalOpportunityValue: number; // aggregate reach
  aiConfidence: number; // overall confidence
}

interface PRAIRecommendationsProps {
  data: PRAIRecommendationsData | null;
  loading?: boolean;
  onAction?: (recommendation: PRRecommendation) => void;
  maxVisible?: number;
}

// AI Dot component
function AIDot({ status = 'idle' }: { status?: 'idle' | 'analyzing' | 'generating' }) {
  const baseClasses = 'w-2 h-2 rounded-full';

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

// Type styling
const typeStyles: Record<string, { icon: string; bg: string; text: string; label: string }> = {
  pitch: { icon: '🎯', bg: 'bg-brand-iris/10', text: 'text-brand-iris', label: 'Pitch' },
  outreach: { icon: '📧', bg: 'bg-brand-cyan/10', text: 'text-brand-cyan', label: 'Outreach' },
  press_release: { icon: '📰', bg: 'bg-brand-magenta/10', text: 'text-brand-magenta', label: 'Press Release' },
  follow_up: { icon: '🔄', bg: 'bg-brand-amber/10', text: 'text-brand-amber', label: 'Follow Up' },
  monitor: { icon: '👁️', bg: 'bg-slate-5/60', text: 'text-slate-11', label: 'Monitor' },
  respond: { icon: '💬', bg: 'bg-semantic-warning/10', text: 'text-semantic-warning', label: 'Respond' },
};

// Priority styling
const priorityStyles: Record<string, { bg: string; text: string; ring: string; label: string }> = {
  critical: { bg: 'bg-semantic-danger/15', text: 'text-semantic-danger', ring: 'ring-semantic-danger/30', label: 'Critical' },
  high: { bg: 'bg-brand-amber/15', text: 'text-brand-amber', ring: 'ring-brand-amber/30', label: 'High Priority' },
  medium: { bg: 'bg-brand-iris/15', text: 'text-brand-iris', ring: 'ring-brand-iris/30', label: 'Medium' },
  low: { bg: 'bg-slate-5/60', text: 'text-slate-11', ring: 'ring-slate-6/30', label: 'Low' },
};

// Effort labels
const effortLabels: Record<string, { label: string; color: string }> = {
  quick: { label: '5-10 min', color: 'text-semantic-success' },
  moderate: { label: '30-60 min', color: 'text-brand-amber' },
  involved: { label: '1-2 hours', color: 'text-brand-magenta' },
};

// Pillar colors
const pillarColors: Record<string, { bg: string; text: string; label: string }> = {
  content: { bg: 'bg-brand-cyan/10', text: 'text-brand-cyan', label: 'Content' },
  seo: { bg: 'bg-brand-magenta/10', text: 'text-brand-magenta', label: 'SEO' },
  exec: { bg: 'bg-brand-amber/10', text: 'text-brand-amber', label: 'Executive' },
  crisis: { bg: 'bg-semantic-danger/10', text: 'text-semantic-danger', label: 'Crisis' },
};

function formatReach(reach: number): string {
  if (reach >= 1000000) return `${(reach / 1000000).toFixed(1)}M`;
  if (reach >= 1000) return `${(reach / 1000).toFixed(0)}K`;
  return reach.toString();
}

export function PRAIRecommendations({
  data,
  loading,
  onAction,
  maxVisible = 5,
}: PRAIRecommendationsProps) {
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState<'all' | 'critical' | 'high'>('all');

  // Build AI reasoning context
  const buildReasoningContext = (rec: PRRecommendation): AIReasoningContext => ({
    triggerSource: `${typeStyles[rec.type].label} Recommendation`,
    triggerDescription: rec.rationale,
    sourcePillar: 'pr',
    relatedPillars: (rec.sourcePillars || []).map((p) => ({
      pillar: p,
      influence: 'informs',
      description: `${pillarColors[p]?.label || p} signals influenced this recommendation`,
    })),
    confidence: rec.confidence,
    nextActions: [
      { label: rec.actionLabel, href: rec.actionUrl, priority: 'high' },
      { label: 'View Related Coverage', href: '/app/pr/journalists', priority: 'medium' },
    ],
    generatedAt: data?.generatedAt,
  });

  if (loading) {
    return (
      <div className="panel-card p-6 shadow-lg shadow-slate-1/20">
        <div className="flex items-center justify-center py-12">
          <AIDot status="generating" />
          <span className="ml-3 text-muted">Generating recommendations...</span>
        </div>
      </div>
    );
  }

  if (!data || data.recommendations.length === 0) {
    return (
      <div className="panel-card p-6 shadow-lg shadow-slate-1/20">
        <div className="text-center py-10">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-brand-iris/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-brand-iris" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <p className="text-muted font-medium">No recommendations yet</p>
          <p className="text-sm text-slate-10 mt-1">AI will generate recommendations based on PR activity</p>
        </div>
      </div>
    );
  }

  // Filter recommendations
  const filteredRecs = data.recommendations.filter((rec) => {
    if (filter === 'all') return true;
    if (filter === 'critical') return rec.priority === 'critical';
    if (filter === 'high') return rec.priority === 'critical' || rec.priority === 'high';
    return true;
  });

  const visibleRecs = showAll ? filteredRecs : filteredRecs.slice(0, maxVisible);
  const hasMore = filteredRecs.length > maxVisible;
  const criticalCount = data.recommendations.filter((r) => r.priority === 'critical').length;
  const highCount = data.recommendations.filter((r) => r.priority === 'high').length;

  return (
    <div className="panel-card overflow-hidden shadow-lg shadow-slate-1/20">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border-subtle bg-gradient-to-r from-slate-3/50 to-slate-3/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-brand-iris/15 ring-1 ring-brand-iris/20">
              <svg className="w-5 h-5 text-brand-iris" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">AI Recommendations</h2>
                <AIDot status="idle" />
              </div>
              <p className="text-sm text-slate-10 mt-0.5">
                {data.recommendations.length} actionable items · {data.aiConfidence}% confidence
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 bg-slate-4/40 rounded-lg p-1">
              {[
                { key: 'all', label: 'All', count: data.recommendations.length },
                { key: 'critical', label: 'Critical', count: criticalCount },
                { key: 'high', label: 'High+', count: criticalCount + highCount },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key as typeof filter)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    filter === f.key
                      ? 'bg-brand-iris/20 text-brand-iris'
                      : 'text-slate-10 hover:text-white hover:bg-slate-5/50'
                  }`}
                >
                  {f.label} ({f.count})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Opportunity Value Bar */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-semantic-success/10 border border-semantic-success/20">
            <svg className="w-4 h-4 text-semantic-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className="text-sm font-semibold text-semantic-success">{formatReach(data.totalOpportunityValue)}</span>
            <span className="text-sm text-semantic-success/80">potential reach</span>
          </div>
          {criticalCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-semantic-danger/15 border border-semantic-danger/30">
              <span className="w-2 h-2 rounded-full bg-semantic-danger animate-pulse" />
              <span className="text-sm font-semibold text-semantic-danger">{criticalCount} critical</span>
            </div>
          )}
        </div>
      </div>

      {/* Recommendations List */}
      <div className="p-5 space-y-4 max-h-[520px] overflow-y-auto">
        {visibleRecs.map((rec) => {
          const type = typeStyles[rec.type];
          const priority = priorityStyles[rec.priority];
          const effort = effortLabels[rec.estimatedEffort];
          const isCritical = rec.priority === 'critical';

          return (
            <div
              key={rec.id}
              className={`p-5 rounded-xl border-l-4 transition-all ${
                isCritical
                  ? 'border-l-semantic-danger bg-semantic-danger/5 border border-semantic-danger/20'
                  : rec.priority === 'high'
                    ? 'border-l-brand-amber bg-brand-amber/5 border border-brand-amber/20'
                    : 'border-l-brand-iris bg-slate-3/30 border border-border-subtle'
              } hover:shadow-md`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-lg ${type.bg}`}>
                  {type.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Badges Row */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${type.bg} ${type.text}`}>
                      {type.label}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${priority.bg} ${priority.text}`}>
                      {priority.label}
                    </span>
                    <span className="text-xs text-slate-10 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className={effort.color}>{effort.label}</span>
                    </span>
                    <span className="text-xs text-slate-10">{rec.confidence}% confidence</span>
                  </div>

                  {/* Title & Description */}
                  <h4 className="font-semibold text-white text-base leading-snug">{rec.title}</h4>
                  <p className="text-sm text-slate-11 mt-1.5 leading-relaxed">{rec.description}</p>

                  {/* Impact Row */}
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-10">Coverage:</span>
                      <span className={`text-xs font-medium ${
                        rec.impact.coverage === 'high' ? 'text-semantic-success' :
                        rec.impact.coverage === 'medium' ? 'text-brand-amber' : 'text-slate-11'
                      }`}>
                        {rec.impact.coverage.charAt(0).toUpperCase() + rec.impact.coverage.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-10">Reach:</span>
                      <span className="text-xs font-medium text-brand-cyan">{formatReach(rec.impact.reach)}</span>
                    </div>
                    {rec.deadline && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-10">Due:</span>
                        <span className="text-xs font-medium text-brand-amber">
                          {new Date(rec.deadline).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Related Journalists/Outlets */}
                  {(rec.relatedJournalists?.length || rec.relatedOutlets?.length) ? (
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      {rec.relatedJournalists?.slice(0, 2).map((j, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-brand-iris/10 text-brand-iris">
                          {j}
                        </span>
                      ))}
                      {rec.relatedOutlets?.slice(0, 2).map((o, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-slate-5/60 text-slate-11">
                          {o}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {/* Source Pillars */}
                  {rec.sourcePillars && rec.sourcePillars.length > 0 && (
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-xs text-slate-10">Informed by:</span>
                      {rec.sourcePillars.map((p) => {
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

                {/* Actions */}
                <div className="flex-shrink-0 flex flex-col items-end gap-2">
                  <AIReasoningPopover context={buildReasoningContext(rec)} position="left" />
                  <Link
                    href={rec.actionUrl}
                    onClick={() => onAction?.(rec)}
                    className={`px-4 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                      isCritical
                        ? 'bg-semantic-danger text-white hover:bg-semantic-danger/90'
                        : rec.priority === 'high'
                          ? 'bg-brand-amber/20 text-brand-amber hover:bg-brand-amber/30'
                          : 'bg-brand-iris/20 text-brand-iris hover:bg-brand-iris/30'
                    }`}
                  >
                    {rec.actionLabel}
                  </Link>
                </div>
              </div>
            </div>
          );
        })}

        {/* Show More */}
        {hasMore && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full py-3 text-sm font-medium text-brand-iris hover:text-brand-iris/80 transition-colors"
          >
            {showAll ? 'Show Less' : `Show ${filteredRecs.length - maxVisible} More Recommendations`}
          </button>
        )}
      </div>
    </div>
  );
}

export default PRAIRecommendations;
