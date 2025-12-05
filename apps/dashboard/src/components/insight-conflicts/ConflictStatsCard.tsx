'use client';

/**
 * ConflictStatsCard Component (Sprint S74)
 * Statistics display card for insight conflicts
 */

import type { ConflictStats } from '@pravado/types';
import {
  formatResolutionRate,
  formatAvgResolutionTime,
} from '../../lib/insightConflictApi';

interface ConflictStatsCardProps {
  stats: ConflictStats | null;
  loading?: boolean;
}

export function ConflictStatsCard({ stats, loading }: ConflictStatsCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i}>
              <div className="h-8 w-12 bg-gray-200 rounded mb-1"></div>
              <div className="h-4 w-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-4">
      {/* Main stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <StatItem
          label="Total Conflicts"
          value={stats.totalConflicts}
          color="text-gray-900"
        />
        <StatItem
          label="Detected"
          value={stats.detectedCount}
          color="text-blue-600"
        />
        <StatItem
          label="Analyzing"
          value={stats.analyzingCount}
          color="text-yellow-600"
        />
        <StatItem
          label="Resolved"
          value={stats.resolvedCount}
          color="text-green-600"
        />
        <StatItem
          label="Resolution Rate"
          value={formatResolutionRate(stats.resolutionRate)}
          color="text-indigo-600"
        />
        <StatItem
          label="Avg Resolution"
          value={formatAvgResolutionTime(stats.averageResolutionTime)}
          color="text-purple-600"
        />
      </div>

      {/* Breakdown rows */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
        {/* By severity */}
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-3">By Severity</h4>
          <div className="grid grid-cols-4 gap-2">
            <MiniStat label="Critical" value={stats.criticalCount} color="bg-red-500" />
            <MiniStat label="High" value={stats.highCount} color="bg-orange-500" />
            <MiniStat label="Medium" value={stats.mediumCount} color="bg-yellow-500" />
            <MiniStat label="Low" value={stats.lowCount} color="bg-green-500" />
          </div>
        </div>

        {/* By type */}
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-3">By Type</h4>
          <div className="grid grid-cols-5 gap-2">
            <MiniStat
              label="Contradiction"
              value={stats.contradictionCount}
              color="bg-red-400"
            />
            <MiniStat
              label="Divergence"
              value={stats.divergenceCount}
              color="bg-orange-400"
            />
            <MiniStat
              label="Ambiguity"
              value={stats.ambiguityCount}
              color="bg-yellow-400"
            />
            <MiniStat
              label="Missing"
              value={stats.missingDataCount}
              color="bg-blue-400"
            />
            <MiniStat
              label="Inconsist."
              value={stats.inconsistencyCount}
              color="bg-purple-400"
            />
          </div>
        </div>
      </div>

      {/* Clusters */}
      {stats.clusterCount > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>{stats.clusterCount} conflict cluster{stats.clusterCount !== 1 ? 's' : ''} identified</span>
          </div>
        </div>
      )}
    </div>
  );
}

function StatItem({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1">
        <div className={`w-2 h-2 rounded-full ${color}`}></div>
        <span className="text-lg font-semibold text-gray-900">{value}</span>
      </div>
      <div className="text-xs text-gray-500 truncate">{label}</div>
    </div>
  );
}
