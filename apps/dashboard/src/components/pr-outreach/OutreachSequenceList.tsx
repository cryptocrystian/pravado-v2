'use client';

/**
 * Outreach Sequence List Component (Sprint S44)
 * Displays list of outreach sequences with status and stats
 */

import type { OutreachSequence } from '@pravado/types';

import { deleteOutreachSequence, updateOutreachSequence } from '@/lib/prOutreachApi';

export interface OutreachSequenceListProps {
  sequences: OutreachSequence[];
  selectedSequence: OutreachSequence | null;
  onSequenceSelect: (sequence: OutreachSequence) => void;
  onSequenceChange: () => void;
  isLoading: boolean;
  onNewSequence: () => void;
  onEditSequence: (sequence: OutreachSequence) => void;
}

export function OutreachSequenceList({
  sequences,
  selectedSequence,
  onSequenceSelect,
  onSequenceChange,
  isLoading,
  onNewSequence,
  onEditSequence,
}: OutreachSequenceListProps) {
  const handleToggleActive = async (sequence: OutreachSequence, event: React.MouseEvent) => {
    event.stopPropagation();

    try {
      await updateOutreachSequence(sequence.id, {
        isActive: !sequence.isActive,
      });
      onSequenceChange();
    } catch (error) {
      console.error('Failed to toggle sequence:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDelete = async (sequence: OutreachSequence, event: React.MouseEvent) => {
    event.stopPropagation();

    if (!confirm(`Delete sequence "${sequence.name}"? All runs will be stopped.`)) {
      return;
    }

    try {
      await deleteOutreachSequence(sequence.id);
      onSequenceChange();
    } catch (error) {
      console.error('Failed to delete sequence:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="bg-white rounded-lg border">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Outreach Sequences</h2>
            <p className="text-sm text-gray-600">Email campaign sequences</p>
          </div>
          <button
            onClick={onNewSequence}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            + New Sequence
          </button>
        </div>
      </div>

      {/* List */}
      <div className="divide-y max-h-[600px] overflow-y-auto">
        {isLoading && (
          <div className="p-8 text-center text-gray-500">Loading sequences...</div>
        )}

        {!isLoading && sequences.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-gray-500">No sequences found</p>
            <button
              onClick={onNewSequence}
              className="mt-2 text-blue-600 hover:underline text-sm"
            >
              Create your first sequence
            </button>
          </div>
        )}

        {!isLoading &&
          sequences.map((sequence) => (
            <div
              key={sequence.id}
              onClick={() => onSequenceSelect(sequence)}
              className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedSequence?.id === sequence.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{sequence.name}</h3>
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        sequence.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {sequence.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {sequence.description && (
                    <p className="text-sm text-gray-600 mt-1">{sequence.description}</p>
                  )}

                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                    <span>Total: {sequence.totalRuns}</span>
                    <span>Active: {sequence.activeRuns}</span>
                    <span>Completed: {sequence.completedRuns}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditSequence(sequence);
                    }}
                    className="p-1 hover:bg-gray-200 rounded"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => handleToggleActive(sequence, e)}
                    className="p-1 hover:bg-gray-200 rounded"
                    title={sequence.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {sequence.isActive ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={(e) => handleDelete(sequence, e)}
                    className="p-1 hover:bg-red-100 hover:text-red-600 rounded"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
