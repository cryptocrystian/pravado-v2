'use client';

/**
 * PlaybookList Component (Sprint S67)
 * Displays a list of scenario playbooks with filtering and pagination
 */

import { useState, useEffect } from 'react';
import type { ScenarioPlaybook, ScenarioListPlaybooksQuery } from '@pravado/types';
import { SCENARIO_PLAYBOOK_STATUS_LABELS, SCENARIO_TRIGGER_TYPE_LABELS, SCENARIO_RISK_LEVEL_LABELS } from '@pravado/types';
import { PlaybookCard } from './PlaybookCard';
import { listPlaybooks, activatePlaybook, archivePlaybook, deletePlaybook } from '../../lib/scenarioPlaybookApi';

interface PlaybookListProps {
  onView?: (playbook: ScenarioPlaybook) => void;
  onEdit?: (playbook: ScenarioPlaybook) => void;
  onCreateNew?: () => void;
}

export function PlaybookList({ onView, onEdit, onCreateNew }: PlaybookListProps) {
  const [playbooks, setPlaybooks] = useState<ScenarioPlaybook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(12);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [riskFilter, setRiskFilter] = useState<string>('');
  const [triggerFilter, setTriggerFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPlaybooks = async () => {
    setLoading(true);
    setError(null);

    try {
      const query: ScenarioListPlaybooksQuery = {
        limit,
        offset: page * limit,
        ...(statusFilter && { status: statusFilter as ScenarioListPlaybooksQuery['status'] }),
        ...(riskFilter && { riskLevel: riskFilter as ScenarioListPlaybooksQuery['riskLevel'] }),
        ...(triggerFilter && { triggerType: triggerFilter as ScenarioListPlaybooksQuery['triggerType'] }),
        ...(searchQuery && { search: searchQuery }),
        sortBy: 'updated_at',
        sortOrder: 'desc',
      };

      const response = await listPlaybooks(query);
      setPlaybooks(response.playbooks);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load playbooks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaybooks();
  }, [page, statusFilter, riskFilter, triggerFilter]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (page === 0) {
        fetchPlaybooks();
      } else {
        setPage(0);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleActivate = async (playbook: ScenarioPlaybook) => {
    try {
      await activatePlaybook(playbook.id);
      fetchPlaybooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate playbook');
    }
  };

  const handleArchive = async (playbook: ScenarioPlaybook) => {
    try {
      await archivePlaybook(playbook.id);
      fetchPlaybooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive playbook');
    }
  };

  const handleDelete = async (playbook: ScenarioPlaybook) => {
    if (!confirm(`Are you sure you want to delete "${playbook.name}"?`)) {
      return;
    }

    try {
      await deletePlaybook(playbook.id);
      fetchPlaybooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete playbook');
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
            placeholder="Search playbooks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          {Object.entries(SCENARIO_PLAYBOOK_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Risk Levels</option>
          {Object.entries(SCENARIO_RISK_LEVEL_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <select
          value={triggerFilter}
          onChange={(e) => setTriggerFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Triggers</option>
          {Object.entries(SCENARIO_TRIGGER_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        {onCreateNew && (
          <button
            onClick={onCreateNew}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + New Playbook
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
      ) : playbooks.length === 0 ? (
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No playbooks found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery || statusFilter || riskFilter || triggerFilter
              ? 'Try adjusting your filters'
              : 'Get started by creating a new playbook'}
          </p>
          {onCreateNew && !searchQuery && !statusFilter && (
            <button
              onClick={onCreateNew}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Create Playbook
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {playbooks.map((playbook) => (
              <PlaybookCard
                key={playbook.id}
                playbook={playbook}
                onView={onView}
                onEdit={onEdit}
                onActivate={handleActivate}
                onArchive={handleArchive}
                onDelete={handleDelete}
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
