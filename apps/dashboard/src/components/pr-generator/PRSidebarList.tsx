'use client';

/**
 * PR Sidebar List Component (Sprint S38)
 * List of past press releases — DS v3 dark theme
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
            <div key={i} className="h-16 bg-slate-3 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (releases.length === 0) {
    return (
      <div className="p-4 text-center text-white/40 text-sm">
        No press releases yet. Generate your first one!
      </div>
    );
  }

  return (
    <div className="divide-y divide-border-subtle">
      {releases.map((release) => {
        const statusColor = getStatusColor(release.status);
        const isSelected = release.id === selectedId;

        return (
          <button
            key={release.id}
            onClick={() => onSelect(release.id)}
            className={`w-full text-left p-3 hover:bg-slate-3/50 transition-colors ${
              isSelected ? 'bg-brand-iris/10 border-l-2 border-brand-iris' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white/90 truncate">
                  {release.headline || 'Untitled Release'}
                </p>
                <p className="text-xs text-white/50 mt-1">
                  {release.input?.companyName || 'Unknown Company'}
                </p>
              </div>
              <span
                className={`flex-shrink-0 ml-2 w-2 h-2 rounded-full ${
                  statusColor === 'green'
                    ? 'bg-semantic-success'
                    : statusColor === 'blue'
                    ? 'bg-brand-cyan'
                    : statusColor === 'red'
                    ? 'bg-semantic-danger'
                    : 'bg-white/30'
                }`}
              />
            </div>
            <p className="text-xs text-white/30 mt-1">
              {formatRelativeTime(release.createdAt)}
            </p>
          </button>
        );
      })}
    </div>
  );
}
