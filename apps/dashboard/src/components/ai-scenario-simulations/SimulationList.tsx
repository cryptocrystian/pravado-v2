'use client';

/**
 * SimulationList Component (Sprint S71)
 * Displays a list of AI scenario simulations with filtering and pagination
 */

import { useState, useEffect } from 'react';
import type { AIScenarioSimulation, ListAISimulationsQuery } from '@pravado/types';
import { SimulationCard } from './SimulationCard';
import { listSimulations, deleteSimulation, startRun } from '../../lib/aiScenarioSimulationApi';

interface SimulationListProps {
  onView?: (simulation: AIScenarioSimulation) => void;
  onEdit?: (simulation: AIScenarioSimulation) => void;
  onCreateNew?: () => void;
  onRunStarted?: (runId: string, simulationId: string) => void;
}

const OBJECTIVE_OPTIONS = [
  { value: '', label: 'All Objectives' },
  { value: 'crisis_comms', label: 'Crisis Communications' },
  { value: 'investor_relations', label: 'Investor Relations' },
  { value: 'reputation', label: 'Reputation' },
  { value: 'go_to_market', label: 'Go-to-Market' },
  { value: 'regulatory', label: 'Regulatory' },
  { value: 'competitive', label: 'Competitive' },
  { value: 'earnings', label: 'Earnings' },
  { value: 'leadership_change', label: 'Leadership Change' },
  { value: 'm_and_a', label: 'M&A' },
  { value: 'custom', label: 'Custom' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'configured', label: 'Configured' },
  { value: 'running', label: 'Running' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'archived', label: 'Archived' },
];

export function SimulationList({
  onView,
  onEdit,
  onCreateNew,
  onRunStarted,
}: SimulationListProps) {
  const [simulations, setSimulations] = useState<AIScenarioSimulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(12);

  // Filters
  const [objectiveFilter, setObjectiveFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSimulations = async () => {
    setLoading(true);
    setError(null);

    try {
      const query: Partial<ListAISimulationsQuery> = {
        limit,
        offset: page * limit,
        ...(objectiveFilter && { objectiveType: objectiveFilter as ListAISimulationsQuery['objectiveType'] }),
        ...(statusFilter && { status: statusFilter as ListAISimulationsQuery['status'] }),
        ...(searchQuery && { search: searchQuery }),
        sortBy: 'updated_at',
        sortOrder: 'desc',
      };

      const response = await listSimulations(query);
      setSimulations(response.simulations);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load simulations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSimulations();
  }, [page, objectiveFilter, statusFilter]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (page === 0) {
        fetchSimulations();
      } else {
        setPage(0);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleDelete = async (simulation: AIScenarioSimulation) => {
    if (!confirm(`Are you sure you want to delete "${simulation.name}"?`)) {
      return;
    }

    try {
      await deleteSimulation(simulation.id);
      fetchSimulations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete simulation');
    }
  };

  const handleStartRun = async (simulation: AIScenarioSimulation) => {
    try {
      setLoading(true);
      const result = await startRun(simulation.id, { startImmediately: false });
      onRunStarted?.(result.run.id, simulation.id);
      fetchSimulations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start run');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">AI Scenario Simulations</h2>
        {onCreateNew && (
          <button
            onClick={onCreateNew}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
          >
            New Simulation
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-gray-50 p-4 rounded-lg">
        <input
          type="text"
          placeholder="Search simulations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
        />

        <select
          value={objectiveFilter}
          onChange={(e) => setObjectiveFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
        >
          {OBJECTIVE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      )}

      {/* Empty state */}
      {!loading && simulations.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">No simulations found</p>
          {onCreateNew && (
            <button
              onClick={onCreateNew}
              className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              Create your first simulation
            </button>
          )}
        </div>
      )}

      {/* Grid */}
      {!loading && simulations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {simulations.map((simulation) => (
            <SimulationCard
              key={simulation.id}
              simulation={simulation}
              onView={onView}
              onEdit={onEdit}
              onDelete={handleDelete}
              onStartRun={handleStartRun}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Showing {page * limit + 1} to {Math.min((page + 1) * limit, total)} of {total} simulations
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
