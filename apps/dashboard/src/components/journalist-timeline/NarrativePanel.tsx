/**
 * Narrative Panel Component (Sprint S49)
 * Displays AI-generated journalist relationship narrative
 */

import type { JournalistNarrative } from '@pravado/types';

interface NarrativePanelProps {
  narrative: JournalistNarrative;
  isLoading?: boolean;
  onRegenerate?: () => void;
}

function formatActivityLevel(level: string): { label: string; color: string } {
  switch (level) {
    case 'very_active':
      return { label: 'Very Active', color: 'text-green-600' };
    case 'active':
      return { label: 'Active', color: 'text-blue-600' };
    case 'moderate':
      return { label: 'Moderate', color: 'text-gray-600' };
    case 'low':
      return { label: 'Low Activity', color: 'text-yellow-600' };
    case 'inactive':
      return { label: 'Inactive', color: 'text-red-600' };
    default:
      return { label: 'Unknown', color: 'text-gray-400' };
  }
}

function formatSentiment(sentiment: string): { icon: string; color: string } {
  switch (sentiment) {
    case 'positive':
      return { icon: '😊', color: 'text-green-600' };
    case 'negative':
      return { icon: '😞', color: 'text-red-600' };
    case 'neutral':
      return { icon: '😐', color: 'text-gray-600' };
    default:
      return { icon: '❓', color: 'text-gray-400' };
  }
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'low':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}

export function NarrativePanel({
  narrative,
  isLoading = false,
  onRegenerate,
}: NarrativePanelProps) {
  const activityDisplay = formatActivityLevel(narrative.activityLevel);
  const sentimentDisplay = formatSentiment(narrative.overallSentiment);

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Relationship Narrative
          </h2>
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Regenerate
            </button>
          )}
        </div>

        {/* Executive Summary */}
        <p className="text-lg text-gray-700 leading-relaxed">
          {narrative.executiveSummary}
        </p>

        {/* Generated Date */}
        <div className="text-xs text-gray-500 mt-3">
          Generated {new Date(narrative.generatedAt).toLocaleString()} • Timeframe: {narrative.timeframe.replace(/_/g, ' ')}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Activity Level */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Activity Level</div>
            <div className={`text-sm font-semibold ${activityDisplay.color}`}>
              {activityDisplay.label}
            </div>
          </div>

          {/* Overall Sentiment */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Overall Sentiment</div>
            <div className={`text-sm font-semibold ${sentimentDisplay.color} flex items-center gap-1`}>
              <span>{sentimentDisplay.icon}</span>
              <span className="capitalize">{narrative.overallSentiment}</span>
            </div>
          </div>

          {/* Health Score */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Health Score</div>
            <div className={`text-sm font-semibold ${
              narrative.healthScore >= 70 ? 'text-green-600' :
              narrative.healthScore >= 50 ? 'text-blue-600' :
              narrative.healthScore >= 30 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {Math.round(narrative.healthScore)}/100
            </div>
          </div>

          {/* Last Interaction */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Last Interaction</div>
            <div className="text-sm font-semibold text-gray-900">
              {narrative.lastInteractionDays === 0
                ? 'Today'
                : narrative.lastInteractionDays === 1
                  ? 'Yesterday'
                  : `${narrative.lastInteractionDays} days ago`}
            </div>
          </div>
        </div>

        {/* Sentiment Analysis */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Sentiment Analysis
          </h3>
          <p className="text-sm text-gray-700 mb-2">
            {narrative.sentimentExplanation}
          </p>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Trend:</span>
            <span className={`font-medium capitalize ${
              narrative.sentimentTrend === 'improving' ? 'text-green-600' :
              narrative.sentimentTrend === 'declining' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {narrative.sentimentTrend === 'improving' ? '📈' :
               narrative.sentimentTrend === 'declining' ? '📉' : '➡️'}{' '}
              {narrative.sentimentTrend}
            </span>
          </div>
        </div>

        {/* Engagement Metrics */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Engagement Metrics
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">Reply Rate</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${narrative.replyRate * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {Math.round(narrative.replyRate * 100)}%
                </span>
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Open Rate</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${narrative.openRate * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {Math.round(narrative.openRate * 100)}%
                </span>
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Click Rate</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full"
                    style={{ width: `${narrative.clickRate * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {Math.round(narrative.clickRate * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Coverage Summary */}
        {narrative.coverageCount > 0 && narrative.coverageSummary && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-900 mb-2 flex items-center gap-2">
              🎉 Coverage Achieved
            </h3>
            <p className="text-sm text-green-800 mb-2">
              {narrative.coverageSummary}
            </p>
            {narrative.lastCoverageDate && (
              <div className="text-xs text-green-700">
                Most recent: {new Date(narrative.lastCoverageDate).toLocaleDateString()}
              </div>
            )}
          </div>
        )}

        {/* Key Highlights */}
        {narrative.highlights.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Key Highlights
            </h3>
            <div className="space-y-3">
              {narrative.highlights.map((highlight, index) => (
                <div
                  key={index}
                  className={`border-l-4 pl-4 py-2 ${
                    highlight.importance === 'high'
                      ? 'border-red-500 bg-red-50'
                      : highlight.importance === 'medium'
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-blue-500 bg-blue-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="font-medium text-gray-900 text-sm">
                      {highlight.title}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      highlight.importance === 'high'
                        ? 'bg-red-100 text-red-700'
                        : highlight.importance === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-blue-100 text-blue-700'
                    }`}>
                      {highlight.importance}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    {highlight.description}
                  </p>
                  <div className="text-xs text-gray-500">
                    {new Date(highlight.date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {narrative.recommendations.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Recommendations
            </h3>
            <div className="space-y-3">
              {narrative.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${getPriorityColor(rec.priority)}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl">
                      {rec.type === 'action' ? '🎯' : rec.type === 'warning' ? '⚠️' : '💡'}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-medium text-sm">{rec.title}</div>
                        <span className="text-xs px-2 py-0.5 bg-white bg-opacity-50 rounded capitalize">
                          {rec.priority} priority
                        </span>
                      </div>
                      <p className="text-sm opacity-90">
                        {rec.description}
                      </p>
                      {rec.suggestedAction && (
                        <div className="mt-2 text-sm font-medium">
                          → {rec.suggestedAction}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
