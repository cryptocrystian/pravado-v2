/**
 * Severity Badge Component (Sprint S59)
 * Displays governance severity level with color coding
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { GovernanceSeverityLevel } from '@/lib/governanceApi';

interface SeverityBadgeProps {
  severity: GovernanceSeverityLevel;
  className?: string;
}

const severityConfig: Record<GovernanceSeverityLevel, { label: string; className: string }> = {
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

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const config = severityConfig[severity] || severityConfig.low;

  return (
    <Badge variant="outline" className={cn('text-xs font-medium', config.className, className)}>
      {config.label}
    </Badge>
  );
}
