'use client';

/**
 * SimulationResultsPanel Component (Sprint S67)
 * Displays simulation results with projected metrics and recommendations
 */

import type { SimulationResult, ScenarioRiskLevel } from '@pravado/types';
import { SCENARIO_RISK_LEVEL_LABELS, RISK_LEVEL_COLORS } from '@pravado/types';

interface SimulationResultsPanelProps {
  result: SimulationResult;
  onStartRun?: () => void;
  onClose?: () => void;
}

export function SimulationResultsPanel({
  result,
  onStartRun,
  onClose,
}: SimulationResultsPanelProps) {
  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-red-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getOpportunityColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-blue-600';
    return 'text-gray-600';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Simulation Results</h3>
            <p className="text-sm text-blue-100">
              Simulated at {new Date(result.simulatedAt).toLocaleString()}
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-3 gap-4 p-6 bg-gray-50 border-b border-gray-200">
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">Risk Score</p>
          <p className={`text-3xl font-bold ${getRiskColor(result.riskScore)}`}>
            {result.riskScore.toFixed(0)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">Opportunity Score</p>
          <p className={`text-3xl font-bold ${getOpportunityColor(result.opportunityScore)}`}>
            {result.opportunityScore.toFixed(0)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">Confidence</p>
          <p className="text-3xl font-bold text-gray-900">
            {(result.confidenceScore * 100).toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Narrative Summary */}
      {result.narrativeSummary && (
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Narrative Summary</h4>
          <p className="text-sm text-gray-600 whitespace-pre-line">
            {result.narrativeSummary}
          </p>
        </div>
      )}

      {/* Projected Metrics Timeline */}
      {result.projectedMetrics?.timeline && result.projectedMetrics.timeline.length > 0 && (
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Projected Metrics</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="pb-2 pr-4">Day</th>
                  <th className="pb-2 pr-4">Sentiment</th>
                  <th className="pb-2 pr-4">Coverage</th>
                  <th className="pb-2">Risk Level</th>
                </tr>
              </thead>
              <tbody>
                {result.projectedMetrics.timeline.map((point, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2 pr-4 text-gray-900 font-medium">{point.day}</td>
                    <td className="py-2 pr-4">
                      <span className={point.sentimentProjected >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {point.sentimentProjected >= 0 ? '+' : ''}{point.sentimentProjected.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-2 pr-4">
                      <span className={point.coverageProjected >= 0 ? 'text-blue-600' : 'text-red-600'}>
                        {point.coverageProjected >= 0 ? '+' : ''}{point.coverageProjected.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${RISK_LEVEL_COLORS[point.riskLevel as ScenarioRiskLevel] || 'bg-gray-100'}`}>
                        {SCENARIO_RISK_LEVEL_LABELS[point.riskLevel as ScenarioRiskLevel] || point.riskLevel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {result.recommendations && result.recommendations.length > 0 && (
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Recommendations</h4>
          <div className="space-y-3">
            {result.recommendations.map((rec, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border ${
                  rec.priority === 'high'
                    ? 'border-red-200 bg-red-50'
                    : rec.priority === 'medium'
                      ? 'border-yellow-200 bg-yellow-50'
                      : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      rec.priority === 'high'
                        ? 'bg-red-100 text-red-700'
                        : rec.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {rec.priority}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{rec.action}</p>
                    <p className="text-xs text-gray-600 mt-1">{rec.rationale}</p>
                    {rec.expectedImpact && (
                      <p className="text-xs text-blue-600 mt-1">
                        Expected impact: {typeof rec.expectedImpact === 'string'
                          ? rec.expectedImpact
                          : `Risk: ${rec.expectedImpact.riskScoreChange ?? 0}, Reach: ${rec.expectedImpact.expectedReach ?? 0}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step Previews */}
      {result.stepPreviews && result.stepPreviews.length > 0 && (
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Step Previews</h4>
          <div className="space-y-2">
            {result.stepPreviews.map((step, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">{step.stepName}</p>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs ${RISK_LEVEL_COLORS[step.riskLevel as ScenarioRiskLevel] || 'bg-gray-100'}`}>
                      {SCENARIO_RISK_LEVEL_LABELS[step.riskLevel as ScenarioRiskLevel] || step.riskLevel}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{step.actionType}</p>
                  <p className="text-xs text-gray-600 mt-1">{step.predictedOutcome}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="p-6 flex items-center justify-end gap-3">
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
        )}
        {onStartRun && (
          <button
            onClick={onStartRun}
            className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700"
          >
            Start Real Run
          </button>
        )}
      </div>
    </div>
  );
}
