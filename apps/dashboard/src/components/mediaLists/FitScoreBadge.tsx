/**
 * Fit Score Badge Component (Sprint S47)
 * Displays journalist fit score (0-1) with color coding
 */

interface FitScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

function getScoreColor(score: number): string {
  if (score >= 0.8) return 'bg-green-100 text-green-800 border-green-300';
  if (score >= 0.6) return 'bg-blue-100 text-blue-800 border-blue-300';
  if (score >= 0.4) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  return 'bg-gray-100 text-gray-800 border-gray-300';
}

const sizeClasses = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2 py-1',
  lg: 'text-base px-3 py-1.5',
};

export function FitScoreBadge({ score, size = 'md', showLabel = false }: FitScoreBadgeProps) {
  const percentage = Math.round(score * 100);
  const colorClass = getScoreColor(score);

  return (
    <span
      className={`inline-flex items-center font-semibold rounded border ${colorClass} ${sizeClasses[size]}`}
    >
      {showLabel && <span className="mr-1">Fit:</span>}
      {percentage}%
    </span>
  );
}
