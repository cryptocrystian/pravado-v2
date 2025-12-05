/**
 * Confidence Badge Component (Sprint S48.2)
 * Displays journalist discovery confidence score (0-1) with color coding
 */

interface ConfidenceBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showBreakdown?: boolean;
  breakdown?: {
    nameConfidence?: number;
    emailConfidence?: number;
    outletConfidence?: number;
    socialConfidence?: number;
    beatConfidence?: number;
  };
}

function getScoreColor(score: number): string {
  if (score >= 0.8) return 'bg-green-100 text-green-800 border-green-300';
  if (score >= 0.6) return 'bg-blue-100 text-blue-800 border-blue-300';
  if (score >= 0.4) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  return 'bg-red-100 text-red-800 border-red-300';
}

const sizeClasses = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2 py-1',
  lg: 'text-base px-3 py-1.5',
};

export function ConfidenceBadge({
  score,
  size = 'md',
  showLabel = false,
  showBreakdown = false,
  breakdown,
}: ConfidenceBadgeProps) {
  const percentage = Math.round(score * 100);
  const colorClass = getScoreColor(score);

  if (showBreakdown && breakdown) {
    return (
      <div className="space-y-2">
        <span
          className={`inline-flex items-center font-semibold rounded border ${colorClass} ${sizeClasses[size]}`}
        >
          {showLabel && <span className="mr-1">Confidence:</span>}
          {percentage}%
        </span>
        <div className="text-xs space-y-1 text-gray-600">
          {breakdown.nameConfidence !== undefined && (
            <div>
              Name: {Math.round(breakdown.nameConfidence * 100)}%
            </div>
          )}
          {breakdown.emailConfidence !== undefined && (
            <div>
              Email: {Math.round(breakdown.emailConfidence * 100)}%
            </div>
          )}
          {breakdown.outletConfidence !== undefined && (
            <div>
              Outlet: {Math.round(breakdown.outletConfidence * 100)}%
            </div>
          )}
          {breakdown.socialConfidence !== undefined && (
            <div>
              Social: {Math.round(breakdown.socialConfidence * 100)}%
            </div>
          )}
          {breakdown.beatConfidence !== undefined && (
            <div>
              Beat: {Math.round(breakdown.beatConfidence * 100)}%
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center font-semibold rounded border ${colorClass} ${sizeClasses[size]}`}
    >
      {showLabel && <span className="mr-1">Confidence:</span>}
      {percentage}%
    </span>
  );
}
