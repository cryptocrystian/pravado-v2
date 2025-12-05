/**
 * Risk Level Badge Component (Sprint S60)
 * Displays risk level with appropriate color coding
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { RiskRadarLevel } from '@/lib/riskRadarApi';

interface RiskLevelBadgeProps {
  level: RiskRadarLevel;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const levelConfig: Record<RiskRadarLevel, { label: string; className: string }> = {
  low: {
    label: 'Low',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  medium: {
    label: 'Medium',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  high: {
    label: 'High',
    className: 'bg-orange-100 text-orange-800 border-orange-200',
  },
  critical: {
    label: 'Critical',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
};

const sizeClasses = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2 py-0.5',
  lg: 'text-base px-3 py-1',
};

export function RiskLevelBadge({ level, size = 'md', className }: RiskLevelBadgeProps) {
  const config = levelConfig[level] || levelConfig.medium;

  return (
    <Badge
      variant="outline"
      className={cn(config.className, sizeClasses[size], className)}
    >
      {config.label}
    </Badge>
  );
}
