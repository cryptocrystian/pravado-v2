'use client';

/**
 * CiteMind Status Indicator (Sprint S-INT-04)
 *
 * Displays real CiteMind qualification status for content assets.
 * Shows pending/analyzing/passed/warning/blocked states.
 * When expanded, shows 6-factor breakdown and recommendations.
 *
 * Wired to GET /api/citemind/score/[id] via useCiteMindScore hook.
 *
 * @see /docs/canon/CONTENT_WORK_SURFACE_CONTRACT.md
 */

import { useState } from 'react';

import type { CiteMindStatus, CiteMindIssue } from '../types';

interface CiteMindStatusIndicatorProps {
  status: CiteMindStatus;
  issues?: CiteMindIssue[];
  compact?: boolean;
  onViewIssues?: () => void;
  /** Real score data from API (S-INT-04) */
  scoreData?: {
    overall_score: number;
    entity_density_score: number;
    claim_verifiability_score: number;
    structural_clarity_score: number;
    topical_authority_score: number;
    schema_markup_score: number;
    citation_pattern_score: number;
    recommendations: string[];
  } | null;
}

// ============================================
// STATUS CONFIG
// ============================================

const STATUS_CONFIG: Record<
  CiteMindStatus,
  {
    icon: React.ReactNode;
    label: string;
    color: string;
    bg: string;
    description: string;
  }
> = {
  pending: {
    icon: (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="8" fill="currentColor" opacity="0.3" />
      </svg>
    ),
    label: 'Pending',
    color: 'text-white/50',
    bg: 'bg-white/10',
    description: 'Analysis not yet run',
  },
  analyzing: {
    icon: (
      <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    ),
    label: 'Analyzing',
    color: 'text-brand-cyan',
    bg: 'bg-brand-cyan/10',
    description: 'CiteMind analysis in progress',
  },
  passed: {
    icon: (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
    ),
    label: 'Passed',
    color: 'text-semantic-success',
    bg: 'bg-semantic-success/10',
    description: 'All governance checks passed',
  },
  warning: {
    icon: (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
    ),
    label: 'Warning',
    color: 'text-semantic-warning',
    bg: 'bg-semantic-warning/10',
    description: 'Issues found, can proceed with caution',
  },
  blocked: {
    icon: (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
          clipRule="evenodd"
        />
      </svg>
    ),
    label: 'Blocked',
    color: 'text-semantic-danger',
    bg: 'bg-semantic-danger/10',
    description: 'Cannot publish until resolved',
  },
};

// ============================================
// FACTOR BAR
// ============================================

function FactorBar({ label, score }: { label: string; score: number }) {
  const color =
    score >= 75 ? 'bg-semantic-success' :
    score >= 55 ? 'bg-semantic-warning' :
    'bg-semantic-danger';

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-white/50 w-20 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-white/60 w-7 text-right">{Math.round(score)}</span>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function CiteMindStatusIndicator({
  status,
  issues,
  compact = false,
  onViewIssues,
  scoreData,
}: CiteMindStatusIndicatorProps) {
  const config = STATUS_CONFIG[status];
  const [expanded, setExpanded] = useState(false);

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${config.bg} ${config.color}`}
        title={config.description}
      >
        {config.icon}
        {status !== 'pending' && <span>{config.label}</span>}
      </span>
    );
  }

  return (
    <div className={`rounded-lg border ${config.bg} border-current/20`}>
      {/* Header — clickable to expand */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 text-left"
      >
        <div className="flex items-center gap-2">
          <span className={config.color}>{config.icon}</span>
          <span className={`text-sm font-medium ${config.color} flex-1`}>
            CiteMind: {config.label}
            {scoreData && (
              <span className="ml-1 text-xs text-white/40">({Math.round(scoreData.overall_score)}/100)</span>
            )}
          </span>
          <svg
            className={`w-3 h-3 text-white/30 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <p className="text-xs text-white/55 mt-1">{config.description}</p>
      </button>

      {/* Expanded: Factor Breakdown */}
      {expanded && scoreData && (
        <div className="px-3 pb-3 space-y-2 border-t border-white/5 pt-2">
          <FactorBar label="Entities" score={scoreData.entity_density_score} />
          <FactorBar label="Claims" score={scoreData.claim_verifiability_score} />
          <FactorBar label="Structure" score={scoreData.structural_clarity_score} />
          <FactorBar label="Authority" score={scoreData.topical_authority_score} />
          <FactorBar label="Schema" score={scoreData.schema_markup_score} />
          <FactorBar label="Citation" score={scoreData.citation_pattern_score} />

          {/* Recommendations */}
          {scoreData.recommendations.length > 0 && (
            <div className="mt-2 pt-2 border-t border-white/5">
              <p className="text-xs font-medium text-white/50 mb-1">Recommendations</p>
              <ul className="space-y-1">
                {scoreData.recommendations.map((rec, i) => (
                  <li key={i} className="text-xs text-white/40 leading-relaxed">
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Issues (non-expanded) */}
      {!expanded && issues && issues.length > 0 && (
        <div className="px-3 pb-3 space-y-2">
          {issues.slice(0, 3).map((issue, i) => (
            <div
              key={i}
              className={`text-xs px-2 py-1.5 rounded ${
                issue.severity === 'error'
                  ? 'bg-semantic-danger/10 text-semantic-danger'
                  : 'bg-semantic-warning/10 text-semantic-warning'
              }`}
            >
              {issue.message}
              {issue.section && (
                <span className="text-white/40 ml-1">(Section: {issue.section})</span>
              )}
            </div>
          ))}
          {issues.length > 3 && (
            <p className="text-xs text-white/40">
              +{issues.length - 3} more issues
            </p>
          )}
        </div>
      )}

      {onViewIssues && (status === 'warning' || status === 'blocked') && !expanded && (
        <div className="px-3 pb-3">
          <button
            onClick={onViewIssues}
            className={`text-xs font-medium ${config.color} hover:underline`}
          >
            View Issues
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================
// GATE PANEL VARIANT
// ============================================

interface CiteMindGatePanelProps {
  status: CiteMindStatus;
  issues?: CiteMindIssue[];
  onViewIssues?: () => void;
  onRequestReview?: () => void;
  onProceedAnyway?: () => void;
  onPublish?: () => void;
}

export function CiteMindGatePanel({
  status,
  issues,
  onViewIssues,
  onRequestReview,
  onProceedAnyway,
  onPublish,
}: CiteMindGatePanelProps) {
  const config = STATUS_CONFIG[status];

  if (status === 'passed') {
    return (
      <div className="p-4 rounded-lg bg-semantic-success/10 border border-semantic-success/20">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-semantic-success">{config.icon}</span>
          <span className="text-sm font-semibold text-semantic-success">
            CiteMind: PASSED
          </span>
        </div>
        <p className="text-xs text-white/55 mb-3">
          All governance checks passed. Ready for publication.
        </p>
        {onPublish && (
          <button
            onClick={onPublish}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-semantic-success hover:bg-semantic-success/90 rounded-lg transition-colors"
          >
            Publish
          </button>
        )}
      </div>
    );
  }

  if (status === 'blocked') {
    return (
      <div className="p-4 rounded-lg bg-semantic-danger/10 border border-semantic-danger/20">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-semantic-danger">{config.icon}</span>
          <span className="text-sm font-semibold text-semantic-danger">
            CiteMind: BLOCKED
          </span>
        </div>
        <p className="text-xs text-white/55 mb-3">
          Cannot publish until resolved:
        </p>
        {issues && issues.length > 0 && (
          <ul className="text-xs text-semantic-danger space-y-1 mb-3">
            {issues.map((issue, i) => (
              <li key={i}>{issue.message}</li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          {onViewIssues && (
            <button
              onClick={onViewIssues}
              className="flex-1 px-3 py-2 text-xs font-medium text-white/70 bg-slate-3 hover:bg-slate-4 rounded-lg transition-colors"
            >
              View Issues
            </button>
          )}
          {onRequestReview && (
            <button
              onClick={onRequestReview}
              className="flex-1 px-3 py-2 text-xs font-medium text-semantic-danger bg-semantic-danger/10 hover:bg-semantic-danger/20 rounded-lg transition-colors"
            >
              Request Review
            </button>
          )}
        </div>
      </div>
    );
  }

  if (status === 'warning') {
    return (
      <div className="p-4 rounded-lg bg-semantic-warning/10 border border-semantic-warning/20">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-semantic-warning">{config.icon}</span>
          <span className="text-sm font-semibold text-semantic-warning">
            CiteMind: WARNING
          </span>
        </div>
        <p className="text-xs text-white/55 mb-3">
          Issues found (can proceed with caution):
        </p>
        {issues && issues.length > 0 && (
          <ul className="text-xs text-semantic-warning space-y-1 mb-3">
            {issues.map((issue, i) => (
              <li key={i}>{issue.message}</li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          {onViewIssues && (
            <button
              onClick={onViewIssues}
              className="flex-1 px-3 py-2 text-xs font-medium text-white/70 bg-slate-3 hover:bg-slate-4 rounded-lg transition-colors"
            >
              View Issues
            </button>
          )}
          {onProceedAnyway && (
            <button
              onClick={onProceedAnyway}
              className="flex-1 px-3 py-2 text-xs font-medium text-semantic-warning bg-semantic-warning/10 hover:bg-semantic-warning/20 rounded-lg transition-colors"
            >
              Proceed Anyway
            </button>
          )}
        </div>
      </div>
    );
  }

  // Pending or Analyzing
  return (
    <div className={`p-4 rounded-lg ${config.bg} border border-current/20`}>
      <div className="flex items-center gap-2">
        <span className={config.color}>{config.icon}</span>
        <span className={`text-sm font-medium ${config.color}`}>
          CiteMind: {config.label}
        </span>
      </div>
      <p className="text-xs text-white/55 mt-1">{config.description}</p>
    </div>
  );
}
