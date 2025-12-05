'use client';

/**
 * Sequence List Component (Sprint S39)
 * Displays list of pitch sequences with status and contact counts
 */

import type { PRPitchSequence, PRPitchSequenceStats } from '@pravado/types';

import { formatDate, formatSequenceStatus, getStatusColor } from '@/lib/prPitchApi';

interface SequenceListProps {
  sequences: (PRPitchSequence & { stats?: PRPitchSequenceStats })[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreateNew: () => void;
  isLoading?: boolean;
}

export function SequenceList({
  sequences,
  selectedId,
  onSelect,
  onCreateNew,
  isLoading,
}: SequenceListProps) {
  return (
    <div className="w-80 border-r border-gray-200 bg-white flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-900">Pitch Sequences</h2>
          <button
            onClick={onCreateNew}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            + New
          </button>
        </div>
        <p className="text-xs text-gray-500">Manage your outreach campaigns</p>
      </div>

      {/* Sequence List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
          </div>
        ) : sequences.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No sequences yet. Create one to get started.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sequences.map((sequence) => (
              <button
                key={sequence.id}
                onClick={() => onSelect(sequence.id)}
                className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                  selectedId === sequence.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{sequence.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(
                          sequence.status
                        )}`}
                      >
                        {formatSequenceStatus(sequence.status)}
                      </span>
                      {sequence.stats && (
                        <span className="text-xs text-gray-500">
                          {sequence.stats.totalContacts} contacts
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(sequence.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Stats preview */}
                {sequence.stats && sequence.stats.totalContacts > 0 && (
                  <div className="mt-2 flex gap-2">
                    {sequence.stats.sentCount > 0 && (
                      <span className="text-xs text-green-600">
                        {sequence.stats.sentCount} sent
                      </span>
                    )}
                    {sequence.stats.openedCount > 0 && (
                      <span className="text-xs text-purple-600">
                        {sequence.stats.openedCount} opened
                      </span>
                    )}
                    {sequence.stats.repliedCount > 0 && (
                      <span className="text-xs text-emerald-600">
                        {sequence.stats.repliedCount} replied
                      </span>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
