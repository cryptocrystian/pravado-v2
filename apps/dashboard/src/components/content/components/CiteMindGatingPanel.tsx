'use client';

/**
 * CiteMind Gating Panel
 *
 * Governs content actions based on CiteMind status.
 * Per canon: blocked disables actions, warning requires acknowledgment.
 *
 * @see /docs/canon/CONTENT_PILLAR_CANON.md Section 4.2
 * @see /docs/canon/CITEMIND_SYSTEM.md
 */

import { useState, useCallback } from 'react';

import { citeMindStatus as statusTokens, card, text, label, interactive } from '../tokens';
import type { CiteMindStatus, CiteMindIssue } from '../types';

// ============================================
// TYPES
// ============================================

export interface CiteMindGatingPanelProps {
  /** Current CiteMind status */
  status: CiteMindStatus;
  /** Issues/warnings if any */
  issues?: CiteMindIssue[];
  /** Required citations for this content */
  requiredCitations?: string[];
  /** Whether user has acknowledged warnings */
  warningAcknowledged?: boolean;
  /** Callback when acknowledgment changes */
  onAcknowledgmentChange?: (acknowledged: boolean) => void;
  /** Callback to view issue details */
  onViewIssue?: (issue: CiteMindIssue) => void;
  /** Callback to run CiteMind analysis */
  onAnalyze?: () => void;
  /** Whether analysis is running */
  isAnalyzing?: boolean;
  /** Last analyzed timestamp */
  lastAnalyzedAt?: string;
}

// ============================================
// STATUS ICONS
// ============================================

function StatusIcon({ status }: { status: CiteMindStatus }) {
  const iconClasses = 'w-5 h-5';

  switch (status) {
    case 'passed':
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'warning':
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    case 'blocked':
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      );
    case 'analyzing':
      return (
        <svg className={`${iconClasses} animate-spin`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      );
    default:
      return (
        <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}

// ============================================
// ISSUE ITEM
// ============================================

function IssueItem({
  issue,
  onClick,
}: {
  issue: CiteMindIssue;
  onClick?: () => void;
}) {
  const isError = issue.severity === 'error';

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-2 rounded-md transition-colors ${
        isError
          ? 'bg-semantic-danger/5 hover:bg-semantic-danger/10'
          : 'bg-semantic-warning/5 hover:bg-semantic-warning/10'
      }`}
    >
      <div className="flex items-start gap-2">
        <span className={`mt-0.5 ${isError ? 'text-semantic-danger' : 'text-semantic-warning'}`}>
          {isError ? (
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
        </span>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-medium ${isError ? 'text-semantic-danger' : 'text-semantic-warning'}`}>
            {issue.type.replace(/_/g, ' ')}
          </p>
          <p className={`text-[10px] ${text.secondary} truncate`}>
            {issue.message}
          </p>
          {issue.section && (
            <p className={`text-[10px] ${text.hint} mt-0.5`}>
              Section: {issue.section}
            </p>
          )}
        </div>
        <svg className="w-4 h-4 text-white/30 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function CiteMindGatingPanel({
  status,
  issues = [],
  requiredCitations = [],
  warningAcknowledged = false,
  onAcknowledgmentChange,
  onViewIssue,
  onAnalyze,
  isAnalyzing = false,
  lastAnalyzedAt,
}: CiteMindGatingPanelProps) {
  const [localAcknowledged, setLocalAcknowledged] = useState(warningAcknowledged);
  const tokens = statusTokens[status];

  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;

  const handleAcknowledgmentToggle = useCallback(() => {
    const newValue = !localAcknowledged;
    setLocalAcknowledged(newValue);
    onAcknowledgmentChange?.(newValue);
  }, [localAcknowledged, onAcknowledgmentChange]);

  // Get status message
  const getStatusMessage = () => {
    switch (status) {
      case 'passed':
        return 'Content meets all CiteMind requirements';
      case 'warning':
        return `${warningCount} warning${warningCount !== 1 ? 's' : ''} require review`;
      case 'blocked':
        return `${errorCount} issue${errorCount !== 1 ? 's' : ''} must be resolved`;
      case 'analyzing':
        return 'Analyzing content...';
      default:
        return 'Pending CiteMind analysis';
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className={label}>CiteMind Governance</h3>
        {lastAnalyzedAt && (
          <span className={`text-[10px] ${text.hint}`}>
            Last: {new Date(lastAnalyzedAt).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Status Card */}
      <div className={`p-3 rounded-lg border ${tokens.bg} ${tokens.border}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${tokens.bg} ${tokens.text}`}>
            <StatusIcon status={status} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${tokens.text} capitalize`}>
                {status === 'passed' ? 'Approved' : status}
              </span>
              <span className={`w-2 h-2 rounded-full ${tokens.dot}`} />
            </div>
            <p className={`text-xs ${text.secondary}`}>
              {getStatusMessage()}
            </p>
          </div>
        </div>
      </div>

      {/* Issues List */}
      {issues.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className={label}>Issues ({issues.length})</span>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {issues.map((issue, index) => (
              <IssueItem
                key={index}
                issue={issue}
                onClick={() => onViewIssue?.(issue)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Required Citations */}
      {requiredCitations.length > 0 && (
        <div>
          <span className={`${label} block mb-2`}>Required Citations ({requiredCitations.length})</span>
          <div className="space-y-1">
            {requiredCitations.map((citation, index) => (
              <div
                key={index}
                className={`p-2 ${card.base} flex items-center gap-2`}
              >
                <svg className="w-3.5 h-3.5 text-brand-iris shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span className={`text-xs ${text.secondary} truncate`}>{citation}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warning Acknowledgment */}
      {status === 'warning' && (
        <div className={`p-3 rounded-lg border ${statusTokens.warning.bg} ${statusTokens.warning.border}`}>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={localAcknowledged}
              onChange={handleAcknowledgmentToggle}
              className="mt-0.5 w-4 h-4 rounded border-semantic-warning/50 bg-transparent text-semantic-warning focus:ring-semantic-warning/30"
            />
            <div>
              <p className="text-xs font-medium text-semantic-warning">
                Acknowledge warnings to proceed
              </p>
              <p className={`text-[10px] ${text.secondary} mt-0.5`}>
                I understand the content has warnings and choose to proceed with actions.
              </p>
            </div>
          </label>
        </div>
      )}

      {/* Re-analyze Button */}
      <button
        onClick={onAnalyze}
        disabled={isAnalyzing}
        className={`w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
          isAnalyzing
            ? 'bg-brand-iris/20 text-brand-iris cursor-wait'
            : interactive.button
        }`}
      >
        {isAnalyzing ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Analyzing...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Re-analyze Content
          </span>
        )}
      </button>
    </div>
  );
}

export default CiteMindGatingPanel;
