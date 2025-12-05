'use client';

/**
 * ConflictAnalysisPanel Component (Sprint S74)
 * Panel for displaying conflict analysis results
 */

import type { InsightConflict } from '@pravado/types';
import {
  getResolutionTypeLabel,
  getResolutionTypeColor,
  getResolutionTypeBgColor,
  getDifficultyLabel,
  getDifficultyColor,
  formatConfidenceScore,
  getConfidenceScoreColor,
  getSourceSystemLabel,
  getEdgeTypeLabel,
  getEdgeTypeColor,
} from '../../lib/insightConflictApi';

interface ConflictAnalysisPanelProps {
  conflict: InsightConflict;
  onAnalyze?: () => void;
  analyzing?: boolean;
}

export function ConflictAnalysisPanel({
  conflict,
  onAnalyze,
  analyzing,
}: ConflictAnalysisPanelProps) {
  const analysis = conflict.analysisResult;
  const rootCauseAnalysis = conflict.rootCauseAnalysis;
  const hasAnalysis = !!analysis;

  if (!hasAnalysis && !analyzing) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center">
          <svg
            className="w-12 h-12 mx-auto text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No analysis available
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Run analysis to get insights about this conflict&apos;s severity, root causes, and suggested resolutions.
          </p>
          {onAnalyze && (
            <button
              onClick={onAnalyze}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              Run Analysis
            </button>
          )}
        </div>
      </div>
    );
  }

  if (analyzing) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center">
          <svg className="animate-spin w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="ml-3 text-gray-600">Analyzing conflict...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
      {/* Header */}
      <div className="p-4">
        <h3 className="text-lg font-medium text-gray-900">Analysis Results</h3>
      </div>

      {/* Severity & Recommendation */}
      {analysis && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-500 mb-1">Severity Score</div>
            <div className={`text-2xl font-bold ${getSeverityScoreColor(analysis.severityScore)}`}>
              {Math.round(analysis.severityScore)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Suggested Resolution</div>
            <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${getResolutionTypeBgColor(analysis.suggestedResolutionType)} ${getResolutionTypeColor(analysis.suggestedResolutionType)}`}>
              {getResolutionTypeLabel(analysis.suggestedResolutionType)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Difficulty</div>
            <div className={`text-lg font-semibold ${getDifficultyColor(analysis.estimatedResolutionDifficulty)}`}>
              {getDifficultyLabel(analysis.estimatedResolutionDifficulty)}
            </div>
          </div>
        </div>
      )}

      {/* Severity Rationale */}
      {analysis?.severityRationale && (
        <div className="p-4">
          <div className="text-sm text-gray-500 mb-2">Severity Rationale</div>
          <p className="text-sm text-gray-700">{analysis.severityRationale}</p>
        </div>
      )}

      {/* Root Causes */}
      {analysis?.rootCauses && analysis.rootCauses.length > 0 && (
        <div className="p-4">
          <div className="text-sm text-gray-500 mb-3">Root Causes</div>
          <div className="space-y-2">
            {analysis.rootCauses.map((cause, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-medium">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{cause.cause}</p>
                  {cause.evidence && (
                    <p className="text-xs text-gray-500 mt-1">{cause.evidence}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span className={getConfidenceScoreColor(cause.confidence)}>
                      {formatConfidenceScore(cause.confidence)}
                    </span>
                    {cause.sourceSystem && (
                      <span>{getSourceSystemLabel(cause.sourceSystem)}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Root Cause Analysis (Extended) */}
      {rootCauseAnalysis && (
        <div className="p-4">
          <div className="text-sm text-gray-500 mb-3">Deep Root Cause Analysis</div>

          {/* Primary Cause */}
          <div className="mb-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
            <div className="text-xs font-medium text-indigo-600 uppercase mb-1">Primary Cause</div>
            <p className="text-sm font-medium text-gray-900">{rootCauseAnalysis.primaryCause.cause}</p>
            {rootCauseAnalysis.primaryCause.evidence && (
              <p className="text-xs text-gray-600 mt-1">{rootCauseAnalysis.primaryCause.evidence}</p>
            )}
            <div className="mt-2 text-xs">
              <span className={getConfidenceScoreColor(rootCauseAnalysis.primaryCause.confidence)}>
                Confidence: {formatConfidenceScore(rootCauseAnalysis.primaryCause.confidence)}
              </span>
            </div>
          </div>

          {/* Contributing Causes */}
          {rootCauseAnalysis.contributingCauses && rootCauseAnalysis.contributingCauses.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-medium text-gray-500 uppercase mb-2">Contributing Factors</div>
              <ul className="space-y-1">
                {rootCauseAnalysis.contributingCauses.map((cause, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-gray-400">•</span>
                    <span>{cause.cause}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {rootCauseAnalysis.recommendations && rootCauseAnalysis.recommendations.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase mb-2">Recommendations</div>
              <ul className="space-y-1">
                {rootCauseAnalysis.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                    <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Related Conflicts */}
      {analysis?.relatedConflicts && analysis.relatedConflicts.length > 0 && (
        <div className="p-4">
          <div className="text-sm text-gray-500 mb-3">Related Conflicts</div>
          <div className="space-y-2">
            {analysis.relatedConflicts.map((related, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getEdgeTypeColor(related.edgeType) }}
                  ></div>
                  <span className="text-sm text-gray-700 font-mono truncate" style={{ maxWidth: '200px' }}>
                    {related.conflictId.slice(0, 8)}...
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{getEdgeTypeLabel(related.edgeType)}</span>
                  <span>{Math.round(related.similarity * 100)}% similar</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Affected Systems */}
      {analysis?.affectedSystemsAnalysis && analysis.affectedSystemsAnalysis.length > 0 && (
        <div className="p-4">
          <div className="text-sm text-gray-500 mb-3">Affected Systems Impact</div>
          <div className="space-y-2">
            {analysis.affectedSystemsAnalysis.map((system, index) => (
              <div key={index} className="p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">
                    {getSourceSystemLabel(system.system)}
                  </span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                    system.impactLevel === 'high' ? 'bg-red-100 text-red-700' :
                    system.impactLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {system.impactLevel} impact
                  </span>
                </div>
                <p className="text-xs text-gray-600">{system.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getSeverityScoreColor(score: number): string {
  if (score >= 80) return 'text-red-600';
  if (score >= 60) return 'text-orange-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-green-600';
}
