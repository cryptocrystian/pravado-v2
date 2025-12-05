/**
 * Toolbar Component (Sprint S17 + S20 + S23)
 * Top toolbar with save, validate, run, branching, and other actions
 */

'use client';

import { BranchSelector } from './BranchSelector';

export interface ToolbarProps {
  isDirty: boolean;
  hasUnsavedChanges?: boolean;
  isSaving: boolean;
  isValidating: boolean;
  isRunning?: boolean;
  onSave: () => void;
  onValidate: () => void;
  onPreviewExecution: () => void;
  onReset: () => void;
  onRun?: () => void; // S20: Run playbook
  onShowVersionHistory?: () => void; // S20: Show version history
  // S23: Branching props
  playbookId?: string;
  currentBranchId?: string;
  onBranchChange?: (branchId: string) => void;
  onCreateBranch?: () => void;
  onCommit?: () => void; // S23: Commit changes
  onShowMerge?: () => void; // S23: Show merge UI
  onShowVersionGraph?: () => void; // S23: Show version graph
}

export function Toolbar({
  isDirty,
  hasUnsavedChanges,
  isSaving,
  isValidating,
  isRunning,
  onSave,
  onValidate,
  onPreviewExecution,
  onReset,
  onRun,
  onShowVersionHistory,
  playbookId,
  currentBranchId,
  onBranchChange,
  onCreateBranch,
  onCommit,
  onShowMerge,
  onShowVersionGraph,
}: ToolbarProps) {
  return (
    <div className="border-b border-gray-200 bg-white px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">Playbook Editor</h1>
          {isDirty && (
            <span className="text-xs text-orange-600 font-medium">● Unsaved changes</span>
          )}
          {hasUnsavedChanges && !isDirty && (
            <span className="text-xs text-yellow-600 font-medium">
              ● Changes since last version
            </span>
          )}
          {/* S23: Branch Selector */}
          {playbookId && onBranchChange && onCreateBranch && (
            <BranchSelector
              playbookId={playbookId}
              currentBranchId={currentBranchId}
              onBranchChange={onBranchChange}
              onCreateBranch={onCreateBranch}
            />
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* S20: Version History */}
          {onShowVersionHistory && (
            <button
              onClick={onShowVersionHistory}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              History
            </button>
          )}

          {/* S23: Version Graph */}
          {onShowVersionGraph && (
            <button
              onClick={onShowVersionGraph}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
              Graph
            </button>
          )}

          {/* S23: Merge Branches */}
          {onShowMerge && (
            <button
              onClick={onShowMerge}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
              Merge
            </button>
          )}

          <button
            onClick={onValidate}
            disabled={isValidating}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            {isValidating ? 'Validating...' : 'Validate'}
          </button>

          <button
            onClick={onPreviewExecution}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
          >
            Preview Plan
          </button>

          <button
            onClick={onReset}
            disabled={!isDirty}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Reset
          </button>

          <button
            onClick={onSave}
            disabled={!isDirty || isSaving}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>

          {/* S23: Commit Changes */}
          {onCommit && currentBranchId && (
            <button
              onClick={onCommit}
              disabled={!isDirty}
              className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Commit
            </button>
          )}

          {/* S20: Run Playbook */}
          {onRun && (
            <button
              onClick={onRun}
              disabled={isRunning}
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
            >
              {isRunning ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Running...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Run Playbook
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
