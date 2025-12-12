/**
 * Executive Cross-Pillar Signal Timeline (Sprint S94)
 *
 * Visual timeline showing signals from all pillars:
 * - Chronological view of cross-pillar activity
 * - Signal relationships and dependencies
 * - Pillar-colored indicators
 *
 * DS v2 Compliant with AI transparency
 */

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { AIReasoningPopover, type AIReasoningContext } from '@/components/AIReasoningPopover';

// Types
export type SignalType = 'insight' | 'alert' | 'opportunity' | 'risk' | 'milestone' | 'action';
export type SignalSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface TimelineSignal {
  id: string;
  type: SignalType;
  severity: SignalSeverity;
  title: string;
  description: string;
  pillar: 'pr' | 'content' | 'seo' | 'exec' | 'crisis';
  relatedPillars?: ('pr' | 'content' | 'seo' | 'exec' | 'crisis')[];
  timestamp: string;
  sourceSystem: string;
  linkUrl?: string;
  aiGenerated?: boolean;
  connectedSignals?: string[]; // IDs of related signals
}

export interface TimelineData {
  signals: TimelineSignal[];
  generatedAt: string;
  timeWindow: 'today' | 'week' | 'month';
}

interface ExecSignalTimelineProps {
  data: TimelineData | null;
  loading?: boolean;
  maxItems?: number;
}

// AI Dot component
function AIDot({ status = 'idle' }: { status?: 'idle' | 'analyzing' | 'generating' }) {
  const baseClasses = 'w-2 h-2 rounded-full';
  if (status === 'analyzing') {
    return <span className={`${baseClasses} bg-brand-cyan animate-pulse`} />;
  }
  if (status === 'generating') {
    return <span className={`${baseClasses} bg-brand-iris animate-pulse`} />;
  }
  return <span className={`${baseClasses} bg-slate-6`} />;
}

// Pillar colors
const pillarColors: Record<string, { bg: string; text: string; border: string; dot: string; label: string }> = {
  pr: { bg: 'bg-brand-iris/10', text: 'text-brand-iris', border: 'border-brand-iris', dot: 'bg-brand-iris', label: 'PR Intelligence' },
  content: { bg: 'bg-brand-cyan/10', text: 'text-brand-cyan', border: 'border-brand-cyan', dot: 'bg-brand-cyan', label: 'Content Hub' },
  seo: { bg: 'bg-brand-magenta/10', text: 'text-brand-magenta', border: 'border-brand-magenta', dot: 'bg-brand-magenta', label: 'SEO' },
  exec: { bg: 'bg-brand-amber/10', text: 'text-brand-amber', border: 'border-brand-amber', dot: 'bg-brand-amber', label: 'Executive' },
  crisis: { bg: 'bg-semantic-danger/10', text: 'text-semantic-danger', border: 'border-semantic-danger', dot: 'bg-semantic-danger', label: 'Crisis' },
};

// Signal type styling
const signalStyles: Record<SignalType, { icon: string; label: string }> = {
  insight: { icon: '💡', label: 'Insight' },
  alert: { icon: '⚠️', label: 'Alert' },
  opportunity: { icon: '📈', label: 'Opportunity' },
  risk: { icon: '🔴', label: 'Risk' },
  milestone: { icon: '🎯', label: 'Milestone' },
  action: { icon: '▶️', label: 'Action' },
};

// Severity styling
const severityStyles: Record<SignalSeverity, { ring: string; bg: string }> = {
  critical: { ring: 'ring-semantic-danger', bg: 'bg-semantic-danger/20' },
  high: { ring: 'ring-brand-amber', bg: 'bg-brand-amber/20' },
  medium: { ring: 'ring-brand-cyan', bg: 'bg-brand-cyan/20' },
  low: { ring: 'ring-slate-6', bg: 'bg-slate-5/20' },
  info: { ring: 'ring-slate-5', bg: 'bg-slate-4/20' },
};

// Format relative time
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// Group signals by date
function groupSignalsByDate(signals: TimelineSignal[]): Map<string, TimelineSignal[]> {
  const groups = new Map<string, TimelineSignal[]>();

  signals.forEach((signal) => {
    const date = new Date(signal.timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let key: string;
    if (date.toDateString() === today.toDateString()) {
      key = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      key = 'Yesterday';
    } else {
      key = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    }

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(signal);
  });

  return groups;
}

export function ExecSignalTimeline({
  data,
  loading,
  maxItems = 50,
}: ExecSignalTimelineProps) {
  const [selectedPillars, setSelectedPillars] = useState<Set<string>>(new Set(['pr', 'content', 'seo', 'exec', 'crisis']));
  const [selectedTypes, setSelectedTypes] = useState<Set<SignalType>>(new Set(['insight', 'alert', 'opportunity', 'risk', 'milestone', 'action']));
  const [expandedSignal, setExpandedSignal] = useState<string | null>(null);

  // Build AI reasoning context
  const buildReasoningContext = (signal: TimelineSignal): AIReasoningContext => ({
    triggerSource: `${pillarColors[signal.pillar].label} Signal`,
    triggerDescription: `${signalStyles[signal.type].label} detected from ${signal.sourceSystem}`,
    sourcePillar: signal.pillar,
    relatedPillars: signal.relatedPillars?.map(p => ({
      pillar: p,
      influence: 'affects' as const,
      description: `Signal propagates to ${pillarColors[p].label}`,
    })),
    confidence: signal.severity === 'critical' || signal.severity === 'high' ? 90 : 75,
    nextActions: signal.linkUrl ? [{ label: 'View Details', href: signal.linkUrl, priority: 'high' }] : [],
    generatedAt: signal.timestamp,
  });

  // Filter signals
  const filteredSignals = useMemo(() => {
    if (!data) return [];
    return data.signals
      .filter(s => selectedPillars.has(s.pillar))
      .filter(s => selectedTypes.has(s.type))
      .slice(0, maxItems);
  }, [data, selectedPillars, selectedTypes, maxItems]);

  // Group by date
  const groupedSignals = useMemo(() => groupSignalsByDate(filteredSignals), [filteredSignals]);

  // Toggle filter
  const togglePillar = (pillar: string) => {
    const newSet = new Set(selectedPillars);
    if (newSet.has(pillar)) {
      newSet.delete(pillar);
    } else {
      newSet.add(pillar);
    }
    setSelectedPillars(newSet);
  };

  const toggleType = (type: SignalType) => {
    const newSet = new Set(selectedTypes);
    if (newSet.has(type)) {
      newSet.delete(type);
    } else {
      newSet.add(type);
    }
    setSelectedTypes(newSet);
  };

  if (loading) {
    return (
      <div className="panel-card p-6">
        <div className="flex items-center justify-center py-12">
          <AIDot status="analyzing" />
          <span className="ml-3 text-muted">Loading signal timeline...</span>
        </div>
      </div>
    );
  }

  if (!data || data.signals.length === 0) {
    return (
      <div className="panel-card p-6">
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-slate-4/50 flex items-center justify-center">
            <svg className="w-6 h-6 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-muted">No signals in this time period</p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel-card overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border-subtle bg-slate-3/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <AIDot status="idle" />
            <div>
              <h2 className="text-lg font-semibold text-white">Cross-Pillar Signal Timeline</h2>
              <p className="text-xs text-muted mt-0.5">
                {filteredSignals.length} signals from {selectedPillars.size} pillars
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-6">
            {data.timeWindow === 'today' ? 'Today' : data.timeWindow === 'week' ? 'This Week' : 'This Month'}
          </span>
        </div>

        {/* Pillar Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {Object.entries(pillarColors).map(([key, colors]) => (
            <button
              key={key}
              onClick={() => togglePillar(key)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedPillars.has(key)
                  ? `${colors.bg} ${colors.text} border ${colors.border}/30`
                  : 'bg-slate-4/30 text-slate-6 border border-transparent'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${selectedPillars.has(key) ? colors.dot : 'bg-slate-6'}`} />
              {colors.label}
            </button>
          ))}
        </div>

        {/* Type Filters */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          {Object.entries(signalStyles).map(([type, style]) => (
            <button
              key={type}
              onClick={() => toggleType(type as SignalType)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
                selectedTypes.has(type as SignalType)
                  ? 'bg-slate-4 text-white'
                  : 'bg-slate-4/30 text-slate-6'
              }`}
            >
              <span className="text-[10px]">{style.icon}</span>
              {style.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="p-4 max-h-[600px] overflow-y-auto">
        {filteredSignals.length === 0 ? (
          <div className="text-center py-8 text-muted">
            <p>No signals match the selected filters</p>
          </div>
        ) : (
          Array.from(groupedSignals.entries()).map(([dateLabel, signals]) => (
            <div key={dateLabel} className="mb-6 last:mb-0">
              {/* Date Header */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-medium text-muted uppercase tracking-wider">
                  {dateLabel}
                </span>
                <div className="flex-1 h-px bg-border-subtle" />
                <span className="text-xs text-slate-6">{signals.length} signals</span>
              </div>

              {/* Signals */}
              <div className="relative pl-6">
                {/* Timeline Line */}
                <div className="absolute left-[11px] top-3 bottom-3 w-px bg-border-subtle" />

                {signals.map((signal, idx) => {
                  const pillar = pillarColors[signal.pillar];
                  const signalStyle = signalStyles[signal.type];
                  const severity = severityStyles[signal.severity];
                  const isExpanded = expandedSignal === signal.id;

                  return (
                    <div key={signal.id} className={`relative mb-4 last:mb-0 ${idx === 0 ? 'pt-0' : ''}`}>
                      {/* Timeline Dot */}
                      <div
                        className={`absolute -left-6 w-[22px] h-[22px] rounded-full flex items-center justify-center ${pillar.bg} ring-2 ${pillar.border} ring-offset-2 ring-offset-slate-2`}
                      >
                        <div className={`w-2 h-2 rounded-full ${pillar.dot}`} />
                      </div>

                      {/* Signal Card */}
                      <div
                        className={`ml-4 rounded-lg border border-border-subtle overflow-hidden ${
                          isExpanded ? 'bg-slate-3/30' : 'bg-slate-2/50'
                        }`}
                      >
                        <div
                          className="p-3 cursor-pointer hover:bg-slate-3/50 transition-colors"
                          onClick={() => setExpandedSignal(isExpanded ? null : signal.id)}
                        >
                          <div className="flex items-start gap-3">
                            {/* Signal Type Icon */}
                            <span className="text-sm flex-shrink-0">{signalStyle.icon}</span>

                            <div className="flex-1 min-w-0">
                              {/* Meta Row */}
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className={`text-xs font-medium ${pillar.text}`}>
                                  {pillar.label}
                                </span>
                                <span className="text-xs text-slate-6">
                                  {formatRelativeTime(signal.timestamp)}
                                </span>
                                {signal.aiGenerated && (
                                  <span className="flex items-center gap-1 text-xs text-brand-iris">
                                    <AIDot status="idle" />
                                    AI
                                  </span>
                                )}
                                {signal.severity !== 'info' && signal.severity !== 'low' && (
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${severity.bg} ${
                                    signal.severity === 'critical' ? 'text-semantic-danger' :
                                    signal.severity === 'high' ? 'text-brand-amber' : 'text-brand-cyan'
                                  }`}>
                                    {signal.severity.toUpperCase()}
                                  </span>
                                )}
                              </div>

                              {/* Title */}
                              <h4 className="font-medium text-white text-sm">{signal.title}</h4>

                              {/* Related Pillars */}
                              {signal.relatedPillars && signal.relatedPillars.length > 0 && (
                                <div className="flex items-center gap-1.5 mt-2">
                                  <span className="text-[10px] text-slate-6">Affects:</span>
                                  {signal.relatedPillars.map(p => {
                                    const pc = pillarColors[p];
                                    return (
                                      <span key={p} className={`text-[10px] px-1.5 py-0.5 rounded ${pc.bg} ${pc.text}`}>
                                        {pc.label.split(' ')[0]}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <AIReasoningPopover context={buildReasoningContext(signal)} position="left" />
                              <svg
                                className={`w-4 h-4 text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Content */}
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-0 border-t border-border-subtle">
                            <p className="text-sm text-slate-11 mt-3">{signal.description}</p>
                            <div className="flex items-center justify-between mt-3">
                              <span className="text-xs text-slate-6">Source: {signal.sourceSystem}</span>
                              {signal.linkUrl && (
                                <Link
                                  href={signal.linkUrl}
                                  className="text-xs font-medium text-brand-cyan hover:underline"
                                >
                                  View Details →
                                </Link>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ExecSignalTimeline;
