/**
 * Status Badge Component (Sprint S59)
 * Displays governance finding status with color coding
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { GovernanceFindingStatus } from '@/lib/governanceApi';

interface StatusBadgeProps {
  status: GovernanceFindingStatus;
  className?: string;
}

const statusConfig: Record<GovernanceFindingStatus, { label: string; className: string }> = {
  open: {
    label: 'Open',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
  acknowledged: {
    label: 'Acknowledged',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  resolved: {
    label: 'Resolved',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  dismissed: {
    label: 'Dismissed',
    className: 'bg-gray-100 text-gray-800 border-gray-200',
  },
  escalated: {
    label: 'Escalated',
    className: 'bg-purple-100 text-purple-800 border-purple-200',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.open;

  return (
    <Badge variant="outline" className={cn('text-xs font-medium', config.className, className)}>
      {config.label}
    </Badge>
  );
}
