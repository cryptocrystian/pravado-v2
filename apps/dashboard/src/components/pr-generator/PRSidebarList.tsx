'use client';

/**
 * PR Sidebar List Component (Sprint S38)
 * List of past press releases
 */

import type { PRGeneratedRelease } from '@pravado/types';

import { formatRelativeTime, getStatusColor } from '@/lib/pressReleaseApi';

interface PRSidebarListProps {
  releases: PRGeneratedRelease[];
  selectedId?: string;
  onSelect: (id: string) => void;
  isLoading?: boolean;
}

export function PRSidebarList({
  releases,
  selectedId,
  onSelect,
  isLoading,
}: PRSidebarListProps) {
  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (releases.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        No press releases yet. Generate your first one!
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {releases.map((release) => {
        const statusColor = getStatusColor(release.status);
        const isSelected = release.id === selectedId;

        return (
          <button
            key={release.id}
            onClick={() => onSelect(release.id)}
            className={`w-full text-left p-3 hover:bg-gray-50 transition-colors ${
              isSelected ? 'bg-blue-50 border-l-2 border-blue-600' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {release.headline || 'Untitled Release'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {release.input?.companyName || 'Unknown Company'}
                </p>
              </div>
              <span
                className={`flex-shrink-0 ml-2 w-2 h-2 rounded-full ${
                  statusColor === 'green'
                    ? 'bg-green-500'
                    : statusColor === 'blue'
                    ? 'bg-blue-500'
                    : statusColor === 'red'
                    ? 'bg-red-500'
                    : 'bg-gray-400'
                }`}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {formatRelativeTime(release.createdAt)}
            </p>
          </button>
        );
      })}
    </div>
  );
}
