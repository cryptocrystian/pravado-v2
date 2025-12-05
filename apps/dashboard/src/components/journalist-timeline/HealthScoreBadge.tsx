/**
 * Health Score Badge Component (Sprint S49)
 * Displays journalist relationship health score with breakdown
 */

import type { RelationshipHealthScore } from '@pravado/types';

interface HealthScoreBadgeProps {
  healthScore: RelationshipHealthScore;
  size?: 'sm' | 'md' | 'lg';
  showBreakdown?: boolean;
  showRecommendations?: boolean;
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'bg-green-100 text-green-800 border-green-300';
  if (score >= 50) return 'bg-blue-100 text-blue-800 border-blue-300';
  if (score >= 30) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  return 'bg-red-100 text-red-800 border-red-300';
}

function getTrendIcon(trend: string): string {
  switch (trend) {
    case 'improving':
      return '📈';
    case 'declining':
      return '📉';
    default:
      return '➡️';
  }
}

function getTrendColor(trend: string): string {
  switch (trend) {
    case 'improving':
      return 'text-green-600';
    case 'declining':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}

const sizeClasses = {
  sm: 'text-xs px-2 py-1',
  md: 'text-sm px-3 py-1.5',
  lg: 'text-base px-4 py-2',
};

export function HealthScoreBadge({
  healthScore,
  size = 'md',
  showBreakdown = false,
  showRecommendations = false,
}: HealthScoreBadgeProps) {
  const score = Math.round(healthScore.score);
  const colorClass = getScoreColor(score);
  const trendIcon = getTrendIcon(healthScore.trend);
  const trendColor = getTrendColor(healthScore.trend);

  if (!showBreakdown && !showRecommendations) {
    // Simple badge view
    return (
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center font-semibold rounded border ${colorClass} ${sizeClasses[size]}`}
        >
          Health Score: {score}/100
        </span>
        <span className={`text-lg ${trendColor}`} title={healthScore.trend}>
          {trendIcon}
        </span>
      </div>
    );
  }

  // Full view with breakdown and recommendations
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      {/* Score Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`text-3xl font-bold ${
              score >= 70
                ? 'text-green-600'
                : score >= 50
                  ? 'text-blue-600'
                  : score >= 30
                    ? 'text-yellow-600'
                    : 'text-red-600'
            }`}
          >
            {score}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-700">
              Relationship Health
            </div>
            <div className={`text-sm flex items-center gap-1 ${trendColor}`}>
              <span>{trendIcon}</span>
              <span className="capitalize">{healthScore.trend}</span>
            </div>
          </div>
        </div>

        {/* Visual Score Indicator */}
        <div className="relative w-20 h-20">
          <svg className="w-20 h-20 transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="40"
              cy="40"
              r="32"
              stroke="#E5E7EB"
              strokeWidth="6"
              fill="none"
            />
            {/* Score circle */}
            <circle
              cx="40"
              cy="40"
              r="32"
              stroke={
                score >= 70
                  ? '#10B981'
                  : score >= 50
                    ? '#3B82F6'
                    : score >= 30
                      ? '#F59E0B'
                      : '#EF4444'
              }
              strokeWidth="6"
              fill="none"
              strokeDasharray={`${(score / 100) * 201} 201`}
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {/* Breakdown */}
      {showBreakdown && (
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-700 border-b pb-2">
            Score Breakdown
          </div>

          {/* Recency */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Recency</span>
            <div className="flex items-center gap-2">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{
                    width: `${(healthScore.breakdown.recency / 25) * 100}%`,
                  }}
                />
              </div>
              <span className="font-medium text-gray-900 w-12 text-right">
                {healthScore.breakdown.recency.toFixed(0)}/25
              </span>
            </div>
          </div>

          {/* Activity */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Activity</span>
            <div className="flex items-center gap-2">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{
                    width: `${(healthScore.breakdown.activity / 15) * 100}%`,
                  }}
                />
              </div>
              <span className="font-medium text-gray-900 w-12 text-right">
                {healthScore.breakdown.activity.toFixed(0)}/15
              </span>
            </div>
          </div>

          {/* Sentiment */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Sentiment</span>
            <div className="flex items-center gap-2">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full"
                  style={{
                    width: `${(healthScore.breakdown.sentiment / 15) * 100}%`,
                  }}
                />
              </div>
              <span className="font-medium text-gray-900 w-12 text-right">
                {healthScore.breakdown.sentiment.toFixed(0)}/15
              </span>
            </div>
          </div>

          {/* Engagement */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Engagement</span>
            <div className="flex items-center gap-2">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-500 h-2 rounded-full"
                  style={{
                    width: `${(healthScore.breakdown.engagement / 20) * 100}%`,
                  }}
                />
              </div>
              <span className="font-medium text-gray-900 w-12 text-right">
                {healthScore.breakdown.engagement.toFixed(0)}/20
              </span>
            </div>
          </div>

          {/* Coverage */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Coverage</span>
            <div className="flex items-center gap-2">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{
                    width: `${(healthScore.breakdown.coverage / 10) * 100}%`,
                  }}
                />
              </div>
              <span className="font-medium text-gray-900 w-12 text-right">
                {healthScore.breakdown.coverage.toFixed(0)}/10
              </span>
            </div>
          </div>

          {/* Impact */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Impact</span>
            <div className="flex items-center gap-2">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-teal-500 h-2 rounded-full"
                  style={{
                    width: `${(healthScore.breakdown.impact / 10) * 100}%`,
                  }}
                />
              </div>
              <span className="font-medium text-gray-900 w-12 text-right">
                {healthScore.breakdown.impact.toFixed(0)}/10
              </span>
            </div>
          </div>

          {/* Penalty (if any) */}
          {healthScore.breakdown.penalty < 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-red-600">Penalty</span>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{
                      width: `${Math.abs(healthScore.breakdown.penalty / 10) * 100}%`,
                    }}
                  />
                </div>
                <span className="font-medium text-red-600 w-12 text-right">
                  {healthScore.breakdown.penalty.toFixed(0)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recommendations */}
      {showRecommendations && healthScore.recommendations.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700 border-b pb-2">
            Recommendations
          </div>
          <ul className="space-y-2">
            {healthScore.recommendations.slice(0, 3).map((rec, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="text-blue-600 mt-0.5">•</span>
                <span className="text-gray-700">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
