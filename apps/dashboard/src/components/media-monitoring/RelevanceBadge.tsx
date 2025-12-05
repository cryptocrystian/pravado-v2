'use client';

/**
 * Relevance Badge Component (Sprint S40)
 * Displays relevance score as a colored badge
 */

interface RelevanceBadgeProps {
  score: number;
  showLabel?: boolean;
}

export function RelevanceBadge({ score, showLabel = true }: RelevanceBadgeProps) {
  const percentage = Math.round(score * 100);

  const getColor = () => {
    if (percentage >= 80) return 'bg-green-100 text-green-800 border-green-300';
    if (percentage >= 60) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (percentage >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getLabel = () => {
    if (percentage >= 80) return 'High';
    if (percentage >= 60) return 'Medium';
    if (percentage >= 40) return 'Low';
    return 'Minimal';
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${getColor()}`}
    >
      <span className="font-semibold">{percentage}%</span>
      {showLabel && <span className="text-xs opacity-75">{getLabel()}</span>}
    </span>
  );
}
