'use client';

import type { CrawlJobStatus } from '@pravado/types';

interface CrawlStatusBadgeProps {
  status: CrawlJobStatus;
}

export function CrawlStatusBadge({ status }: CrawlStatusBadgeProps) {
  const colors = {
    queued: 'bg-gray-100 text-gray-800',
    running: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
