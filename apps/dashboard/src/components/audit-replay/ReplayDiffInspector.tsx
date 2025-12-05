'use client';

/**
 * Replay Diff Inspector Component (Sprint S37)
 * Shows before/after state snapshots with diffs
 */

import type { ReplaySnapshot, StateDiff } from '@/lib/auditReplayApi';
import { formatDiffOperation, formatEntityType } from '@/lib/auditReplayApi';

interface ReplayDiffInspectorProps {
  snapshot: ReplaySnapshot | null;
  loading?: boolean;
  onClose: () => void;
}

export function ReplayDiffInspector({
  snapshot,
  loading,
  onClose,
}: ReplayDiffInspectorProps) {
  if (!snapshot && !loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        Select an event to view details
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  const diffColorClasses: Record<string, string> = {
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Event #{snapshot!.snapshotIndex + 1}
            </h3>
            <p className="text-sm text-gray-500">{snapshot!.eventType}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Meta info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Timestamp:</span>{' '}
            <span className="font-medium">
              {new Date(snapshot!.timestamp).toLocaleString()}
            </span>
          </div>
          {snapshot!.entityType && (
            <div>
              <span className="text-gray-500">Entity:</span>{' '}
              <span className="font-medium">
                {formatEntityType(snapshot!.entityType)}
                {snapshot!.entityId && (
                  <span className="text-gray-400 ml-1">
                    ({snapshot!.entityId.slice(0, 8)}...)
                  </span>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Diffs */}
        {snapshot!.diff.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Changes</h4>
            <div className="space-y-2">
              {snapshot!.diff.map((diff: StateDiff, idx: number) => {
                const { label, color, icon } = formatDiffOperation(diff.operation);
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded border ${diffColorClasses[color]}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm">{icon}</span>
                      <span className="font-medium">{diff.field}</span>
                      <span className="text-xs opacity-75">({label})</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                      {diff.operation !== 'added' && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Before</div>
                          <pre className="bg-white bg-opacity-50 p-2 rounded text-xs overflow-auto max-h-24">
                            {JSON.stringify(diff.before, null, 2)}
                          </pre>
                        </div>
                      )}
                      {diff.operation !== 'removed' && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">After</div>
                          <pre className="bg-white bg-opacity-50 p-2 rounded text-xs overflow-auto max-h-24">
                            {JSON.stringify(diff.after, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Full state view */}
        <div className="grid grid-cols-2 gap-4">
          {snapshot!.stateBefore && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">State Before</h4>
              <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-48">
                {JSON.stringify(snapshot!.stateBefore, null, 2)}
              </pre>
            </div>
          )}
          {snapshot!.stateAfter && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">State After</h4>
              <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-48">
                {JSON.stringify(snapshot!.stateAfter, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* No changes message */}
        {snapshot!.diff.length === 0 && !snapshot!.stateBefore && !snapshot!.stateAfter && (
          <div className="text-center py-4 text-gray-500">
            No state changes recorded for this event
          </div>
        )}
      </div>
    </div>
  );
}
