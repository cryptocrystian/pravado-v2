'use client';

/**
 * Outreach Run List Component (Sprint S44)
 * Displays list of outreach runs with status and progress
 */

import type { OutreachRun } from '@pravado/types';

import { stopOutreachRun } from '@/lib/prOutreachApi';

export interface OutreachRunListProps {
  runs: OutreachRun[];
  selectedRun: OutreachRun | null;
  onRunSelect: (run: OutreachRun) => void;
  onRunChange: () => void;
  isLoading: boolean;
  sequenceName?: string;
}

export function OutreachRunList({
  runs,
  selectedRun,
  onRunSelect,
  onRunChange,
  isLoading,
  sequenceName,
}: OutreachRunListProps) {
  const handleStopRun = async (run: OutreachRun, event: React.MouseEvent) => {
    event.stopPropagation();

    if (!confirm('Stop this outreach run?')) {
      return;
    }

    try {
      await stopOutreachRun(run.id, 'manual_stop');
      onRunChange();
    } catch (error) {
      console.error('Failed to stop run:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'stopped':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  return (
    <div className="bg-white rounded-lg border">
      {/* Header */}
      <div className="p-4 border-b">
        <div>
          <h2 className="text-lg font-semibold">Outreach Runs</h2>
          <p className="text-sm text-gray-600">
            {sequenceName || 'Select a sequence to view runs'}
          </p>
        </div>
      </div>

      {/* List */}
      <div className="divide-y max-h-[600px] overflow-y-auto">
        {isLoading && (
          <div className="p-8 text-center text-gray-500">Loading runs...</div>
        )}

        {!isLoading && runs.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No runs found
            <p className="text-sm mt-1">Start a sequence to create runs</p>
          </div>
        )}

        {!isLoading &&
          runs.map((run) => (
            <div
              key={run.id}
              onClick={() => onRunSelect(run)}
              className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedRun?.id === run.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">Run #{run.id.slice(0, 8)}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(run.status)}`}>
                      {run.status}
                    </span>
                  </div>

                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    <div>Steps sent: {run.totalStepsSent}</div>
                    <div>Current step: {run.currentStepNumber}</div>
                    {run.repliedAt && (
                      <div className="text-green-600">Replied at step {run.replyStepNumber}</div>
                    )}
                    {run.lastError && (
                      <div className="text-red-600">Error: {run.lastError}</div>
                    )}
                  </div>

                  <div className="mt-2 text-xs text-gray-500">
                    <div>Created: {formatDate(run.createdAt)}</div>
                    {run.nextStepAt && (
                      <div>Next step: {formatDate(run.nextStepAt)}</div>
                    )}
                  </div>
                </div>

                {run.status === 'running' && (
                  <button
                    onClick={(e) => handleStopRun(run, e)}
                    className="ml-2 p-1 hover:bg-red-100 hover:text-red-600 rounded"
                    title="Stop run"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
