'use client';

/**
 * ScenarioList Component (Sprint S67)
 * Displays a list of scenarios with filtering and pagination
 */

import { useState, useEffect } from 'react';
import type { Scenario, ListScenariosQuery } from '@pravado/types';
import { SCENARIO_TYPE_LABELS, SCENARIO_RUN_STATUS_LABELS } from '@pravado/types';
import { ScenarioCard } from './ScenarioCard';
import { listScenarios, deleteScenario, simulateScenario, startScenarioRun } from '../../lib/scenarioPlaybookApi';

interface ScenarioListProps {
  onView?: (scenario: Scenario) => void;
  onEdit?: (scenario: Scenario) => void;
  onCreateNew?: () => void;
  onSimulationResult?: (result: unknown) => void;
  onRunStarted?: (run: unknown) => void;
}

export function ScenarioList({
  onView,
  onEdit,
  onCreateNew,
  onSimulationResult,
  onRunStarted,
}: ScenarioListProps) {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(12);

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchScenarios = async () => {
    setLoading(true);
    setError(null);

    try {
      const query: ListScenariosQuery = {
        limit,
        offset: page * limit,
        ...(typeFilter && { scenarioType: typeFilter as ListScenariosQuery['scenarioType'] }),
        ...(statusFilter && { status: statusFilter as ListScenariosQuery['status'] }),
        ...(searchQuery && { search: searchQuery }),
        sortBy: 'updated_at',
        sortOrder: 'desc',
      };

      const response = await listScenarios(query);
      setScenarios(response.scenarios);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scenarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScenarios();
  }, [page, typeFilter, statusFilter]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (page === 0) {
        fetchScenarios();
      } else {
        setPage(0);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleDelete = async (scenario: Scenario) => {
    if (!confirm(`Are you sure you want to delete "${scenario.name}"?`)) {
      return;
    }

    try {
      await deleteScenario(scenario.id);
      fetchScenarios();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete scenario');
    }
  };

  const handleSimulate = async (scenario: Scenario) => {
    try {
      setLoading(true);
      const result = await simulateScenario(scenario.id);
      onSimulationResult?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Simulation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleStartRun = async (scenario: Scenario) => {
    try {
      setLoading(true);
      const run = await startScenarioRun({ scenarioId: scenario.id });
      onRunStarted?.(run);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start run');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search scenarios..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Types</option>
          {Object.entries(SCENARIO_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

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

        {onCreateNew && (
          <button
            onClick={onCreateNew}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            + New Scenario
          </button>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-full mb-2" />
              <div className="h-4 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : scenarios.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No scenarios found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery || typeFilter || statusFilter
              ? 'Try adjusting your filters'
              : 'Get started by creating a new scenario'}
          </p>
          {onCreateNew && !searchQuery && !typeFilter && (
            <button
              onClick={onCreateNew}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
            >
              Create Scenario
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scenarios.map((scenario) => (
              <ScenarioCard
                key={scenario.id}
                scenario={scenario}
                onView={onView}
                onEdit={onEdit}
                onDelete={handleDelete}
                onSimulate={handleSimulate}
                onStartRun={handleStartRun}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-gray-600">
                Showing {page * limit + 1} - {Math.min((page + 1) * limit, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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
