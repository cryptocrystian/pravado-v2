/**
 * Tier Badge Component (Sprint S47)
 * Displays journalist tier (A/B/C/D) with color coding
 */

import type { TierLevel } from '@pravado/types';

interface TierBadgeProps {
  tier: TierLevel;
  size?: 'sm' | 'md' | 'lg';
}

const tierColors: Record<TierLevel, string> = {
  A: 'bg-green-100 text-green-800 border-green-300',
  B: 'bg-blue-100 text-blue-800 border-blue-300',
  C: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  D: 'bg-gray-100 text-gray-800 border-gray-300',
};

const tierLabels: Record<TierLevel, string> = {
  A: 'A-Tier',
  B: 'B-Tier',
  C: 'C-Tier',
  D: 'D-Tier',
};

const sizeClasses = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2 py-1',
  lg: 'text-base px-3 py-1.5',
};

export function TierBadge({ tier, size = 'md' }: TierBadgeProps) {
  return (
    <span
      className={`inline-flex items-center font-semibold rounded border ${tierColors[tier]} ${sizeClasses[size]}`}
    >
      {tierLabels[tier]}
    </span>
  );
}
