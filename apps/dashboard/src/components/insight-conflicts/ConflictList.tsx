'use client';

/**
 * ConflictList Component (Sprint S74)
 * List component for displaying insight conflicts
 */

import type { InsightConflict } from '@pravado/types';
import { ConflictCard } from './ConflictCard';

interface ConflictListProps {
  conflicts: InsightConflict[];
  loading?: boolean;
  onView?: (conflict: InsightConflict) => void;
  onAnalyze?: (conflict: InsightConflict) => void;
  onResolve?: (conflict: InsightConflict) => void;
  onDismiss?: (conflict: InsightConflict) => void;
  selectedConflicts?: Set<string>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
  emptyMessage?: string;
}

export function ConflictList({
  conflicts,
  loading,
  onView,
  onAnalyze,
  onResolve,
  onDismiss,
  selectedConflicts = new Set(),
  onSelectionChange,
  emptyMessage = 'No conflicts found',
}: ConflictListProps) {
  const handleSelect = (conflict: InsightConflict) => {
    if (!onSelectionChange) return;

    const newSelection = new Set(selectedConflicts);
    if (newSelection.has(conflict.id)) {
      newSelection.delete(conflict.id);
    } else {
      newSelection.add(conflict.id);
    }
    onSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    if (!onSelectionChange) return;

    if (selectedConflicts.size === conflicts.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(conflicts.map(c => c.id)));
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-5 w-20 bg-gray-200 rounded"></div>
                  <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
                </div>
                <div className="h-6 w-3/4 bg-gray-200 rounded"></div>
                <div className="h-4 w-1/2 bg-gray-200 rounded mt-2"></div>
              </div>
              <div className="h-5 w-20 bg-gray-200 rounded-full"></div>
            </div>
            <div className="flex gap-2 mb-4">
              <div className="h-4 w-16 bg-gray-200 rounded"></div>
              <div className="h-4 w-16 bg-gray-200 rounded"></div>
              <div className="h-4 w-16 bg-gray-200 rounded"></div>
            </div>
            <div className="flex gap-2 pt-3 border-t border-gray-100">
              <div className="h-8 flex-1 bg-gray-200 rounded"></div>
              <div className="h-8 flex-1 bg-gray-200 rounded"></div>
              <div className="h-8 flex-1 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conflicts.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <svg
          className="w-16 h-16 mx-auto text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-1">{emptyMessage}</h3>
        <p className="text-sm text-gray-500">
          Conflicts will appear here when detected across your intelligence systems.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selection header */}
      {onSelectionChange && conflicts.length > 0 && (
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <input
                type="checkbox"
                checked={selectedConflicts.size === conflicts.length}
                onChange={handleSelectAll}
                className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
              />
              Select all
            </button>
            {selectedConflicts.size > 0 && (
              <span className="text-sm text-gray-500">
                {selectedConflicts.size} selected
              </span>
            )}
          </div>
          <span className="text-sm text-gray-500">
            {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Conflict cards */}
      <div className="grid gap-4">
        {conflicts.map((conflict) => (
          <ConflictCard
            key={conflict.id}
            conflict={conflict}
            onView={onView}
            onAnalyze={onAnalyze}
            onResolve={onResolve}
            onDismiss={onDismiss}
            selected={selectedConflicts.has(conflict.id)}
            onSelect={onSelectionChange ? handleSelect : undefined}
          />
        ))}
      </div>
    </div>
  );
}
