'use client';

/**
 * Content Loading Skeleton
 *
 * Density-adaptive loading skeletons for Content pillar views.
 * Follows the Command Center density pattern.
 *
 * @see /docs/canon/CONTENT_WORK_SURFACE_CONTRACT.md
 */

import type { DensityLevel } from '../types';

interface ContentLoadingSkeletonProps {
  density?: DensityLevel;
  count?: number;
  type?: 'card' | 'list' | 'dashboard' | 'calendar';
}

const DENSITY_CONFIG: Record<DensityLevel, { height: string; count: number }> = {
  comfortable: { height: 'h-44', count: 3 },
  standard: { height: 'h-24', count: 5 },
  compact: { height: 'h-12', count: 8 },
};

export function ContentLoadingSkeleton({
  density = 'comfortable',
  count,
  type = 'card',
}: ContentLoadingSkeletonProps) {
  const config = DENSITY_CONFIG[density];
  const skeletonCount = count ?? config.count;

  if (type === 'dashboard') {
    return <DashboardSkeleton />;
  }

  if (type === 'calendar') {
    return <CalendarSkeleton />;
  }

  if (type === 'list') {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div
            key={i}
            className="h-12 bg-[#13131A] rounded-lg animate-pulse border border-[#1A1A24]"
          />
        ))}
      </div>
    );
  }

  // Card skeleton (default)
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: skeletonCount }).map((_, i) => (
        <div
          key={i}
          className={`${config.height} bg-[#13131A] rounded-lg animate-pulse border border-[#1A1A24]`}
        >
          {density === 'comfortable' && (
            <div className="p-4 h-full flex flex-col">
              {/* Header row */}
              <div className="flex items-start justify-between mb-3">
                <div className="h-5 w-48 bg-[#1A1A24] rounded" />
                <div className="h-5 w-16 bg-[#1A1A24] rounded-full" />
              </div>
              {/* Metrics row */}
              <div className="flex gap-4 mb-3">
                <div className="h-4 w-20 bg-[#1A1A24] rounded" />
                <div className="h-4 w-20 bg-[#1A1A24] rounded" />
                <div className="h-4 w-20 bg-[#1A1A24] rounded" />
              </div>
              {/* Tags row */}
              <div className="flex gap-2 mt-auto">
                <div className="h-5 w-16 bg-[#1A1A24] rounded-md" />
                <div className="h-5 w-20 bg-[#1A1A24] rounded-md" />
              </div>
            </div>
          )}
          {density === 'standard' && (
            <div className="p-3 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="h-4 w-40 bg-[#1A1A24] rounded" />
                <div className="h-4 w-12 bg-[#1A1A24] rounded-full" />
              </div>
              <div className="flex gap-3">
                <div className="h-3 w-16 bg-[#1A1A24] rounded" />
                <div className="h-3 w-16 bg-[#1A1A24] rounded" />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-4 space-y-4">
      {/* Authority metrics row */}
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-[#13131A] rounded-lg animate-pulse border border-[#1A1A24] p-4">
            <div className="h-3 w-20 bg-[#1A1A24] rounded mb-2" />
            <div className="h-8 w-12 bg-[#1A1A24] rounded" />
          </div>
        ))}
      </div>

      {/* Themes section */}
      <div className="bg-[#13131A] rounded-lg animate-pulse border border-[#1A1A24] p-4">
        <div className="h-4 w-32 bg-[#1A1A24] rounded mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-[#1A1A24] rounded-lg" />
          ))}
        </div>
      </div>

      {/* Proposals section */}
      <div className="bg-[#13131A] rounded-lg animate-pulse border border-[#1A1A24] p-4">
        <div className="h-4 w-40 bg-[#1A1A24] rounded mb-4" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-[#1A1A24] rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <div className="p-4">
      {/* Calendar header */}
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 w-32 bg-[#1A1A24] rounded animate-pulse" />
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-[#1A1A24] rounded animate-pulse" />
          <div className="h-8 w-8 bg-[#1A1A24] rounded animate-pulse" />
        </div>
      </div>

      {/* Calendar grid */}
      <div className="bg-[#13131A] rounded-lg border border-[#1A1A24] p-4 animate-pulse">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="h-4 bg-[#1A1A24] rounded" />
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-20 bg-[#1A1A24] rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Export for use in specific contexts
export { DashboardSkeleton, CalendarSkeleton };
