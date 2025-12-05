/**
 * Scheduler Status Badge Component (Sprint S42)
 * Displays task run status with color coding
 */

import type { SchedulerTaskStatus } from '@pravado/types';

interface StatusBadgeProps {
  status: SchedulerTaskStatus | null;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  if (!status) {
    return <span className="text-gray-400 text-sm">N/A</span>;
  }

  const styles: Record<SchedulerTaskStatus, { bg: string; text: string }> = {
    success: { bg: 'bg-green-100', text: 'text-green-800' },
    failure: { bg: 'bg-red-100', text: 'text-red-800' },
  };

  const { bg, text } = styles[status];

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
      {status}
    </span>
  );
}
