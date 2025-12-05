'use client';

/**
 * RunList Component (Sprint S67)
 * Displays a list of scenario runs with filtering
 */

import { useState, useEffect } from 'react';
import type { ScenarioRun, ListScenarioRunsQuery } from '@pravado/types';
import { SCENARIO_RUN_STATUS_LABELS } from '@pravado/types';
import { RunCard } from './RunCard';
import {
  listScenarioRuns,
  pauseScenarioRun,
  resumeScenarioRun,
  cancelScenarioRun,
} from '../../lib/scenarioPlaybookApi';

interface RunListProps {
  scenarioId?: string;
  playbookId?: string;
  onView?: (run: ScenarioRun) => void;
  maxItems?: number;
  showFilters?: boolean;
}

export function RunList({
  scenarioId,
  playbookId,
  onView,
  maxItems,
  showFilters = true,
}: RunListProps) {
  const [runs, setRuns] = useState<ScenarioRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const limit = maxItems || 10;

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');

  const fetchRuns = async () => {
    setLoading(true);
    setError(null);

    try {
      const query: ListScenarioRunsQuery = {
        limit,
        offset: page * limit,
        ...(scenarioId && { scenarioId }),
        ...(playbookId && { playbookId }),
        ...(statusFilter && { status: statusFilter as ListScenarioRunsQuery['status'] }),
        sortBy: 'started_at',
        sortOrder: 'desc',
      };

      const response = await listScenarioRuns(query);
      setRuns(response.runs);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load runs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, [page, statusFilter, scenarioId, playbookId]);

  const handlePause = async (run: ScenarioRun) => {
    try {
      await pauseScenarioRun(run.id);
      fetchRuns();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pause run');
    }
  };

  const handleResume = async (run: ScenarioRun) => {
    try {
      await resumeScenarioRun(run.id);
      fetchRuns();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume run');
    }
  };

  const handleCancel = async (run: ScenarioRun) => {
    if (!confirm('Are you sure you want to cancel this run?')) {
      return;
    }

    try {
      await cancelScenarioRun(run.id, 'Cancelled by user');
      fetchRuns();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel run');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      {/* Filters */}
      {showFilters && (
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            {Object.entries(SCENARIO_RUN_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <button
            onClick={fetchRuns}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : runs.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <svg
            className="mx-auto h-10 w-10 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No runs found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Start a scenario to see runs here
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {runs.map((run) => (
              <RunCard
                key={run.id}
                run={run}
                onView={onView}
                onPause={handlePause}
                onResume={handleResume}
                onCancel={handleCancel}
              />
            ))}
          </div>

          {/* Pagination */}
          {!maxItems && totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-gray-600">
                Showing {page * limit + 1} - {Math.min((page + 1) * limit, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
