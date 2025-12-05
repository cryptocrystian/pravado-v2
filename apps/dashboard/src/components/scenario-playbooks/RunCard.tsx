'use client';

/**
 * RunCard Component (Sprint S67)
 * Displays a single scenario run with its status and actions
 */

import type { ScenarioRun, ScenarioRunStatus } from '@pravado/types';
import { SCENARIO_RUN_STATUS_LABELS, RUN_STATUS_COLORS } from '@pravado/types';

interface RunCardProps {
  run: ScenarioRun;
  onView?: (run: ScenarioRun) => void;
  onPause?: (run: ScenarioRun) => void;
  onResume?: (run: ScenarioRun) => void;
  onCancel?: (run: ScenarioRun) => void;
}

export function RunCard({ run, onView, onPause, onResume, onCancel }: RunCardProps) {
  const statusLabel = SCENARIO_RUN_STATUS_LABELS[run.status as ScenarioRunStatus] || run.status;
  const statusColor = RUN_STATUS_COLORS[run.status as ScenarioRunStatus] || 'bg-gray-100 text-gray-800';

  const isRunning = run.status === 'running';
  const isPaused = run.status === 'paused';
  const isAwaitingApproval = run.status === 'awaiting_approval';

  const formatDuration = (start: string | null, end: string | null) => {
    if (!start) return '-';
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date();
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ${diffMins % 60}m`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColor}`}>
              {isRunning && (
                <span className="w-2 h-2 bg-current rounded-full mr-1.5 animate-pulse" />
              )}
              {statusLabel}
            </span>

            {run.riskScore !== null && (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  run.riskScore > 70
                    ? 'bg-red-100 text-red-700'
                    : run.riskScore > 40
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-green-100 text-green-700'
                }`}
              >
                Risk: {run.riskScore.toFixed(0)}
              </span>
            )}

            {run.opportunityScore !== null && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                Opp: {run.opportunityScore.toFixed(0)}
              </span>
            )}
          </div>

          <div className="text-sm text-gray-600 space-y-1">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatDuration(run.startedAt, run.completedAt)}
              </span>

              {run.startedAt && (
                <span className="text-gray-400">
                  Started {new Date(run.startedAt).toLocaleString()}
                </span>
              )}
            </div>

            {run.narrativeSummary && (
              <p className="text-gray-500 line-clamp-2 mt-2">
                {run.narrativeSummary}
              </p>
            )}

            {run.errorMessage && (
              <p className="text-red-600 text-xs mt-1">
                Error: {run.errorMessage}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
        <div className="text-xs text-gray-400">
          ID: {run.id.slice(0, 8)}...
        </div>

        <div className="flex items-center gap-2">
          {isRunning && (
            <button
              onClick={() => onPause?.(run)}
              className="px-2 py-1 text-xs bg-yellow-50 text-yellow-600 rounded hover:bg-yellow-100 transition-colors"
            >
              Pause
            </button>
          )}

          {isPaused && (
            <button
              onClick={() => onResume?.(run)}
              className="px-2 py-1 text-xs bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors"
            >
              Resume
            </button>
          )}

          {isAwaitingApproval && (
            <button
              onClick={() => onView?.(run)}
              className="px-2 py-1 text-xs bg-purple-50 text-purple-600 rounded hover:bg-purple-100 transition-colors"
            >
              Review
            </button>
          )}

          {(isRunning || isPaused || isAwaitingApproval) && (
            <button
              onClick={() => onCancel?.(run)}
              className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
            >
              Cancel
            </button>
          )}

          <button
            onClick={() => onView?.(run)}
            className="px-2 py-1 text-xs bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition-colors"
          >
            Details
          </button>
        </div>
      </div>
    </div>
  );
}
