'use client';

/**
 * ConflictFilterBar Component (Sprint S74)
 * Filtering and search controls for insight conflicts
 */

import { useState, useCallback } from 'react';
import type { ConflictType, ConflictSeverity, ConflictStatus, ListConflictsQuery } from '@pravado/types';
import {
  getConflictTypeLabel,
  getConflictSeverityLabel,
  getConflictStatusLabel,
} from '../../lib/insightConflictApi';

interface ConflictFilterBarProps {
  filters: ListConflictsQuery;
  onFiltersChange: (filters: ListConflictsQuery) => void;
  onRefresh?: () => void;
  onRunDetection?: () => void;
  loading?: boolean;
  detectionLoading?: boolean;
}

const CONFLICT_TYPES: ConflictType[] = ['contradiction', 'divergence', 'ambiguity', 'missing_data', 'inconsistency'];
const SEVERITIES: ConflictSeverity[] = ['critical', 'high', 'medium', 'low'];
const STATUSES: ConflictStatus[] = ['detected', 'analyzing', 'resolved', 'dismissed'];

export function ConflictFilterBar({
  filters,
  onFiltersChange,
  onRefresh,
  onRunDetection,
  loading,
  detectionLoading,
}: ConflictFilterBarProps) {
  const [searchInput, setSearchInput] = useState(filters.search || '');

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  }, []);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ ...filters, search: searchInput || null });
  }, [filters, searchInput, onFiltersChange]);

  const handleFilterChange = useCallback((key: keyof ListConflictsQuery, value: string | null) => {
    onFiltersChange({ ...filters, [key]: value || null });
  }, [filters, onFiltersChange]);

  const handleClearFilters = useCallback(() => {
    setSearchInput('');
    onFiltersChange({
      limit: filters.limit,
      offset: 0,
    });
  }, [filters.limit, onFiltersChange]);

  const hasActiveFilters = Boolean(
    filters.search ||
    filters.conflictType ||
    filters.severity ||
    filters.status ||
    filters.affectedSystem
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Search conflicts..."
              value={searchInput}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </form>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {/* Type filter */}
          <select
            value={filters.conflictType || ''}
            onChange={(e) => handleFilterChange('conflictType', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          >
            <option value="">All Types</option>
            {CONFLICT_TYPES.map((type) => (
              <option key={type} value={type}>
                {getConflictTypeLabel(type)}
              </option>
            ))}
          </select>

          {/* Severity filter */}
          <select
            value={filters.severity || ''}
            onChange={(e) => handleFilterChange('severity', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          >
            <option value="">All Severities</option>
            {SEVERITIES.map((severity) => (
              <option key={severity} value={severity}>
                {getConflictSeverityLabel(severity)}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {getConflictStatusLabel(status)}
              </option>
            ))}
          </select>

          {/* Sort by */}
          <select
            value={filters.sortBy || 'created_at'}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          >
            <option value="created_at">Newest</option>
            <option value="updated_at">Recently Updated</option>
            <option value="severity">Severity</option>
            <option value="status">Status</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Clear
            </button>
          )}

          <button
            onClick={onRefresh}
            disabled={loading}
            className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
          </button>

          {onRunDetection && (
            <button
              onClick={onRunDetection}
              disabled={detectionLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {detectionLoading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Detecting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Run Detection
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
