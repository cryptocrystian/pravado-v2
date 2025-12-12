/**
 * Executive Narrative Density Card (Sprint S94)
 *
 * Enhances any executive narrative content with:
 * - "Why this exists" explanation
 * - Inputs and confidence indicators
 * - Changes vs previous version
 * - Action support links
 *
 * Can wrap digests, board reports, and unified narratives
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AIReasoningPopover, type AIReasoningContext } from '@/components/AIReasoningPopover';

// Types
export interface NarrativeInput {
  source: string;
  pillar: 'pr' | 'content' | 'seo' | 'exec' | 'crisis';
  dataPoints: number;
  lastUpdated: string;
  contributionWeight: number; // 0-100
}

export interface NarrativeChange {
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  field: string;
  previousValue?: string;
  currentValue?: string;
  significance: 'high' | 'medium' | 'low';
}

export interface NarrativeAction {
  id: string;
  label: string;
  href: string;
  type: 'primary' | 'secondary';
  pillar?: 'pr' | 'content' | 'seo' | 'exec' | 'crisis';
}

export interface NarrativeDensityData {
  // Why this exists
  purpose: string;
  triggerEvent?: string;
  audienceContext?: string;

  // Inputs & Confidence
  inputs: NarrativeInput[];
  overallConfidence: number; // 0-100
  dataFreshness: 'real-time' | 'hourly' | 'daily' | 'weekly';
  lastGeneratedAt: string;

  // Changes vs previous
  changes?: NarrativeChange[];
  previousVersion?: {
    generatedAt: string;
    summary: string;
  };

  // Actions
  suggestedActions: NarrativeAction[];
}

interface ExecNarrativeDensityCardProps {
  title: string;
  subtitle?: string;
  content: React.ReactNode;
  density: NarrativeDensityData;
  variant?: 'digest' | 'board-report' | 'narrative';
  showInputDetails?: boolean;
  showChanges?: boolean;
  className?: string;
}

// AI Dot component with enhanced visual presence
function AIDot({ status = 'idle', size = 'sm' }: { status?: 'idle' | 'active'; size?: 'sm' | 'md' }) {
  const sizeClasses = size === 'md' ? 'w-2.5 h-2.5' : 'w-2 h-2';
  const baseClasses = `${sizeClasses} rounded-full`;

  if (status === 'active') {
    return (
      <span className="relative flex">
        <span className={`${baseClasses} bg-brand-cyan`} />
        <span className={`absolute ${baseClasses} bg-brand-cyan animate-ping opacity-40`} />
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

// Change type styling
const changeStyles: Record<string, { icon: string; color: string; label: string }> = {
  added: { icon: '+', color: 'text-semantic-success', label: 'Added' },
  removed: { icon: '-', color: 'text-semantic-danger', label: 'Removed' },
  modified: { icon: '~', color: 'text-brand-amber', label: 'Modified' },
  unchanged: { icon: '=', color: 'text-slate-6', label: 'Unchanged' },
};

// Freshness labels
const freshnessLabels: Record<string, { label: string; color: string }> = {
  'real-time': { label: 'Real-time', color: 'text-semantic-success' },
  hourly: { label: 'Updated hourly', color: 'text-brand-cyan' },
  daily: { label: 'Updated daily', color: 'text-brand-amber' },
  weekly: { label: 'Updated weekly', color: 'text-muted' },
};

// Confidence indicator
function ConfidenceIndicator({ confidence }: { confidence: number }) {
  const getColor = () => {
    if (confidence >= 80) return 'bg-semantic-success';
    if (confidence >= 60) return 'bg-brand-cyan';
    if (confidence >= 40) return 'bg-brand-amber';
    return 'bg-semantic-danger';
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-5/50 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${getColor()}`}
          style={{ width: `${confidence}%` }}
        />
      </div>
      <span className="text-xs font-medium text-muted">{confidence}%</span>
    </div>
  );
}

export function ExecNarrativeDensityCard({
  title,
  subtitle,
  content,
  density,
  variant = 'narrative',
  showInputDetails = true,
  showChanges = true,
  className = '',
}: ExecNarrativeDensityCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [activeSection, setActiveSection] = useState<'inputs' | 'changes' | 'actions'>('inputs');

  // Build AI reasoning context
  const reasoningContext: AIReasoningContext = {
    triggerSource: density.triggerEvent || `${variant} Generation`,
    triggerDescription: density.purpose,
    sourcePillar: 'exec',
    relatedPillars: density.inputs.map((input) => ({
      pillar: input.pillar,
      influence: 'informs' as const,
      description: `${input.dataPoints} data points from ${input.source}`,
    })),
    confidence: density.overallConfidence,
    nextActions: density.suggestedActions.map((a) => ({
      label: a.label,
      href: a.href,
      priority: a.type === 'primary' ? ('high' as const) : ('medium' as const),
    })),
    generatedAt: density.lastGeneratedAt,
  };

  const freshness = freshnessLabels[density.dataFreshness];
  const totalDataPoints = density.inputs.reduce((sum, input) => sum + input.dataPoints, 0);

  return (
    <div className={`panel-card overflow-hidden shadow-lg shadow-slate-1/20 ${className}`}>
      {/* Header - Enhanced visual hierarchy */}
      <div className="px-6 py-5 border-b border-border-subtle bg-gradient-to-r from-slate-3/50 to-slate-3/30">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1.5">
              <AIDot status="active" size="md" />
              <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
              <AIReasoningPopover context={reasoningContext} position="bottom" />
            </div>
            {subtitle && <p className="text-sm text-slate-10">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-4">
            {/* Confidence Badge - Enhanced */}
            <div className="text-right px-4 py-2 rounded-lg bg-slate-4/30 border border-border-subtle">
              <p className="text-xs font-medium text-slate-10 mb-1.5">AI Confidence</p>
              <div className="w-28">
                <ConfidenceIndicator confidence={density.overallConfidence} />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Meta - Enhanced spacing */}
        <div className="flex items-center gap-4 mt-4">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            density.dataFreshness === 'real-time' ? 'bg-semantic-success/10 text-semantic-success' :
            density.dataFreshness === 'hourly' ? 'bg-brand-cyan/10 text-brand-cyan' :
            density.dataFreshness === 'daily' ? 'bg-brand-amber/10 text-brand-amber' :
            'bg-slate-4/50 text-slate-10'
          }`}>{freshness.label}</span>
          <span className="text-xs text-slate-10">
            {totalDataPoints} data points from {density.inputs.length} sources
          </span>
          <span className="text-xs text-slate-10">
            Generated {new Date(density.lastGeneratedAt).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Why This Exists Banner */}
      <div className="px-6 py-3 bg-gradient-to-r from-brand-iris/5 to-brand-cyan/5 border-b border-border-subtle">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-iris/20 flex items-center justify-center">
            <span className="text-xs text-brand-iris">?</span>
          </div>
          <div>
            <p className="text-xs font-medium text-muted uppercase tracking-wider mb-1">
              Why This Exists
            </p>
            <p className="text-sm text-slate-11">{density.purpose}</p>
            {density.audienceContext && (
              <p className="text-xs text-slate-6 mt-1">
                Audience: {density.audienceContext}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">{content}</div>

      {/* Detail Sections Toggle */}
      <div className="border-t border-border-subtle">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full px-6 py-3 flex items-center justify-between text-sm font-medium text-muted hover:text-white hover:bg-slate-3/30 transition-colors"
        >
          <span>{showDetails ? 'Hide Details' : 'Show Details'}</span>
          <svg
            className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showDetails && (
          <div className="border-t border-border-subtle">
            {/* Section Tabs */}
            <div className="flex border-b border-border-subtle">
              {[
                { key: 'inputs', label: 'Data Inputs', count: density.inputs.length },
                { key: 'changes', label: 'Changes', count: density.changes?.length || 0 },
                { key: 'actions', label: 'Actions', count: density.suggestedActions.length },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveSection(tab.key as typeof activeSection)}
                  className={`flex-1 px-4 py-2.5 text-xs font-medium transition-colors ${
                    activeSection === tab.key
                      ? 'text-white border-b-2 border-brand-cyan bg-slate-3/30'
                      : 'text-muted hover:text-white'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded bg-slate-5/50">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="p-4 max-h-[300px] overflow-y-auto">
              {/* Inputs Section */}
              {activeSection === 'inputs' && showInputDetails && (
                <div className="space-y-3">
                  {density.inputs.map((input, idx) => {
                    const pillar = pillarColors[input.pillar];
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 rounded-lg bg-slate-3/30 border border-border-subtle"
                      >
                        <div className={`px-2 py-1 rounded ${pillar.bg} ${pillar.text} text-xs font-medium`}>
                          {pillar.label}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white">{input.source}</p>
                          <p className="text-xs text-muted">
                            {input.dataPoints} data points · {input.contributionWeight}% weight
                          </p>
                        </div>
                        <div className="text-xs text-slate-6">
                          {new Date(input.lastUpdated).toLocaleDateString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Changes Section */}
              {activeSection === 'changes' && showChanges && (
                <div className="space-y-3">
                  {density.previousVersion && (
                    <div className="p-3 rounded-lg bg-slate-4/30 border border-border-subtle mb-4">
                      <p className="text-xs text-muted mb-1">Previous Version</p>
                      <p className="text-sm text-slate-11">{density.previousVersion.summary}</p>
                      <p className="text-xs text-slate-6 mt-1">
                        Generated {new Date(density.previousVersion.generatedAt).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {!density.changes || density.changes.length === 0 ? (
                    <p className="text-sm text-muted text-center py-4">No changes detected from previous version</p>
                  ) : (
                    density.changes.map((change, idx) => {
                      const style = changeStyles[change.type];
                      return (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3 rounded-lg bg-slate-3/30 border border-border-subtle"
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center bg-slate-4/50 ${style.color}`}>
                            <span className="text-sm font-bold">{style.icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs font-medium ${style.color}`}>{style.label}</span>
                              <span className="text-xs text-muted">{change.field}</span>
                              {change.significance !== 'low' && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                  change.significance === 'high'
                                    ? 'bg-semantic-danger/10 text-semantic-danger'
                                    : 'bg-brand-amber/10 text-brand-amber'
                                }`}>
                                  {change.significance}
                                </span>
                              )}
                            </div>
                            {change.previousValue && (
                              <p className="text-xs text-slate-6 line-through">{change.previousValue}</p>
                            )}
                            {change.currentValue && (
                              <p className="text-sm text-white">{change.currentValue}</p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Actions Section */}
              {activeSection === 'actions' && (
                <div className="space-y-2">
                  {density.suggestedActions.length === 0 ? (
                    <p className="text-sm text-muted text-center py-4">No suggested actions</p>
                  ) : (
                    density.suggestedActions.map((action) => {
                      const pillar = action.pillar ? pillarColors[action.pillar] : null;
                      return (
                        <Link
                          key={action.id}
                          href={action.href}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                            action.type === 'primary'
                              ? 'bg-brand-cyan/10 border-brand-cyan/20 hover:bg-brand-cyan/20'
                              : 'bg-slate-3/30 border-border-subtle hover:bg-slate-4/30'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {pillar && (
                              <span className={`text-xs px-2 py-1 rounded ${pillar.bg} ${pillar.text}`}>
                                {pillar.label}
                              </span>
                            )}
                            <span className={`text-sm font-medium ${
                              action.type === 'primary' ? 'text-brand-cyan' : 'text-white'
                            }`}>
                              {action.label}
                            </span>
                          </div>
                          <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Simple wrapper to add density metadata to any content
 */
export function withNarrativeDensity(
  content: React.ReactNode,
  density: NarrativeDensityData
): { content: React.ReactNode; density: NarrativeDensityData } {
  return { content, density };
}

/**
 * Generate default density data from basic inputs
 */
export function generateDefaultDensity(options: {
  purpose: string;
  sources: Array<{ name: string; pillar: 'pr' | 'content' | 'seo' | 'exec' | 'crisis'; count: number }>;
  confidence?: number;
  actions?: NarrativeAction[];
}): NarrativeDensityData {
  return {
    purpose: options.purpose,
    inputs: options.sources.map((s) => ({
      source: s.name,
      pillar: s.pillar,
      dataPoints: s.count,
      lastUpdated: new Date().toISOString(),
      contributionWeight: Math.floor(100 / options.sources.length),
    })),
    overallConfidence: options.confidence || 75,
    dataFreshness: 'daily',
    lastGeneratedAt: new Date().toISOString(),
    suggestedActions: options.actions || [],
  };
}

export default ExecNarrativeDensityCard;
