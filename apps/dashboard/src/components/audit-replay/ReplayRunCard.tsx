'use client';

/**
 * Replay Run Card Component (Sprint S37)
 * Displays a replay run summary
 */

import type { AuditReplayRun } from '@/lib/auditReplayApi';
import { formatDuration, getReplayStatusColor, getReplayStatusLabel } from '@/lib/auditReplayApi';

interface ReplayRunCardProps {
  run: AuditReplayRun;
  onClick: () => void;
  selected?: boolean;
}

export function ReplayRunCard({ run, onClick, selected }: ReplayRunCardProps) {
  const statusColor = getReplayStatusColor(run.status);

  const statusColorClasses: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-800',
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg border cursor-pointer transition-all ${
        selected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-900">
          Replay #{run.id.slice(0, 8)}
        </span>
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${statusColorClasses[statusColor]}`}
        >
          {getReplayStatusLabel(run.status)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-gray-500">Events:</span>{' '}
          <span className="font-medium text-gray-900">{run.eventCount}</span>
        </div>
        <div>
          <span className="text-gray-500">Snapshots:</span>{' '}
          <span className="font-medium text-gray-900">{run.snapshotCount}</span>
        </div>
      </div>

      {run.startedAt && (
        <div className="mt-2 text-xs text-gray-500">
          Duration: {formatDuration(run.startedAt, run.finishedAt)}
        </div>
      )}

      <div className="mt-2 text-xs text-gray-400">
        Created: {new Date(run.createdAt).toLocaleString()}
      </div>
    </div>
  );
}
