/**
 * Journalist Discovery Dashboard Page (Sprint S48.2)
 * Main page for reviewing and resolving discovered journalists
 */

'use client';

import { useState, useEffect } from 'react';
import type {
  DiscoveredJournalist,
  DiscoveryQuery,
  DiscoveryStats,
} from '@pravado/types';
import * as journalistDiscoveryApi from '@/lib/journalistDiscoveryApi';
import { DiscoveryFilters } from '@/components/journalist-discovery/DiscoveryFilters';
import { DiscoveryList } from '@/components/journalist-discovery/DiscoveryList';
import { DiscoveryDetailDrawer } from '@/components/journalist-discovery/DiscoveryDetailDrawer';
import { MergeConflictResolver } from '@/components/journalist-discovery/MergeConflictResolver';

export default function JournalistDiscoveryPage() {
  const [discoveries, setDiscoveries] = useState<DiscoveredJournalist[]>([]);
  const [selectedDiscovery, setSelectedDiscovery] = useState<DiscoveredJournalist | null>(null);
  const [stats, setStats] = useState<DiscoveryStats | null>(null);
  const [filters, setFilters] = useState<DiscoveryQuery>({
    status: ['pending'],
    sortBy: 'created_at',
    sortOrder: 'desc',
    limit: 20,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMergeResolver, setShowMergeResolver] = useState(false);
  const [mergeTargetId, setMergeTargetId] = useState<string | null>(null);

  // Load discoveries on mount and when filters change
  useEffect(() => {
    loadDiscoveries();
    loadStats();
  }, []);

  const loadDiscoveries = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await journalistDiscoveryApi.listDiscoveries(filters);
      setDiscoveries(response.discoveries);
    } catch (err: any) {
      setError(err.message || 'Failed to load discoveries');
      console.error('Failed to load discoveries:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await journalistDiscoveryApi.getDiscoveryStats();
      setStats(statsData);
    } catch (err: any) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleFiltersChange = (newFilters: DiscoveryQuery) => {
    setFilters(newFilters);
  };

  const handleSearch = () => {
    loadDiscoveries();
  };

  const handleSelectDiscovery = (discovery: DiscoveredJournalist) => {
    setSelectedDiscovery(discovery);
    setShowMergeResolver(false);
  };

  const handleResolved = () => {
    loadDiscoveries();
    loadStats();
    setSelectedDiscovery(null);
  };

  const handleMergeClick = (targetJournalistId: string) => {
    setMergeTargetId(targetJournalistId);
    setShowMergeResolver(true);
  };

  const handleMergeConfirm = async (resolutions: Record<string, string>) => {
    if (!selectedDiscovery || !mergeTargetId) return;

    try {
      await journalistDiscoveryApi.resolveDiscovery(selectedDiscovery.id, {
        action: 'merge',
        targetJournalistId: mergeTargetId,
        notes: `Merged with resolutions: ${JSON.stringify(resolutions)}`,
      });
      handleResolved();
      setShowMergeResolver(false);
    } catch (err: any) {
      alert(`Error: ${err.message || 'Failed to merge'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Journalist Discovery</h1>
              <p className="text-sm text-gray-600 mt-1">
                Review and resolve discovered journalists
              </p>
            </div>
            <button
              onClick={loadDiscoveries}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {/* Stats Bar */}
          {stats && (
            <div className="mt-4 grid grid-cols-5 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-gray-900">{stats.totalDiscoveries}</div>
                <div className="text-xs text-gray-600">Total</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-yellow-800">{stats.pendingCount}</div>
                <div className="text-xs text-gray-600">Pending</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-blue-800">{stats.confirmedCount}</div>
                <div className="text-xs text-gray-600">Confirmed</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-green-800">{stats.mergedCount}</div>
                <div className="text-xs text-gray-600">Merged</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-gray-700">
                  {Math.round(stats.avgConfidenceScore * 100)}%
                </div>
                <div className="text-xs text-gray-600">Avg Confidence</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="max-w-7xl mx-auto px-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Main Content: Three-Panel Layout */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Panel: Filters & List */}
          <div className="col-span-3 space-y-4">
            <DiscoveryFilters
              filters={filters}
              onChange={handleFiltersChange}
              onSearch={handleSearch}
            />
          </div>

          {/* Middle Panel: Discovery List */}
          <div className="col-span-5">
            <div className="bg-white rounded-lg border border-gray-200 p-4 min-h-[600px]">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">
                  Discoveries ({discoveries.length})
                </h2>
                {filters.status &&
                  ((Array.isArray(filters.status) && filters.status.length > 0) ||
                    (!Array.isArray(filters.status) && filters.status)) && (
                    <span className="text-sm text-gray-600">
                      Filtered:{' '}
                      {Array.isArray(filters.status)
                        ? filters.status.join(', ')
                        : filters.status}
                    </span>
                  )}
              </div>
              <DiscoveryList
                discoveries={discoveries}
                onSelect={handleSelectDiscovery}
                selectedId={selectedDiscovery?.id}
                loading={loading}
              />
            </div>
          </div>

          {/* Right Panel: Suggested Matches */}
          <div className="col-span-4">
            {selectedDiscovery && (
              <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-4">
                <h2 className="text-lg font-semibold mb-4">
                  {selectedDiscovery.suggestedMatches &&
                  selectedDiscovery.suggestedMatches.length > 0
                    ? 'S46 Graph Matches'
                    : 'No Matches Found'}
                </h2>
                {selectedDiscovery.suggestedMatches &&
                selectedDiscovery.suggestedMatches.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDiscovery.suggestedMatches.map((match, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {match.journalistName}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">{match.matchReason}</div>
                          </div>
                          <div className="text-sm font-semibold text-blue-600">
                            {Math.round(match.similarityScore * 100)}%
                          </div>
                        </div>
                        {selectedDiscovery.status === 'pending' && (
                          <button
                            onClick={() => handleMergeClick(match.journalistId)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View Merge Conflicts →
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No matching journalists found in the S46 graph. This appears to be a new
                    journalist.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Drawer (Overlay) */}
      {selectedDiscovery && !showMergeResolver && (
        <DiscoveryDetailDrawer
          discovery={selectedDiscovery}
          onClose={() => setSelectedDiscovery(null)}
          onResolved={handleResolved}
        />
      )}

      {/* Merge Conflict Resolver (Modal) */}
      {showMergeResolver && selectedDiscovery && mergeTargetId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <MergeConflictResolver
              discoveryId={selectedDiscovery.id}
              targetJournalistId={mergeTargetId}
              onCancel={() => setShowMergeResolver(false)}
              onConfirm={handleMergeConfirm}
            />
          </div>
        </div>
      )}
    </div>
  );
}
