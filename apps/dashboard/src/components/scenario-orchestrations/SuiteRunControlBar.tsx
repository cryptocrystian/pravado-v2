'use client';

/**
 * SuiteRunControlBar Component (Sprint S72)
 * Controls for advancing, pausing, or aborting a suite run
 */

import { useState } from 'react';
import type { ScenarioSuiteRun } from '@pravado/types';
import {
  advanceSuiteRun,
  abortSuiteRun,
  SUITE_RUN_STATUS_LABELS,
  getStatusBadgeClass,
} from '../../lib/scenarioOrchestrationApi';

interface SuiteRunControlBarProps {
  run: ScenarioSuiteRun;
  onRunUpdated?: (run: ScenarioSuiteRun) => void;
  onError?: (error: string) => void;
}

export function SuiteRunControlBar({
  run,
  onRunUpdated,
  onError,
}: SuiteRunControlBarProps) {
  const [loading, setLoading] = useState(false);
  const [confirmAbort, setConfirmAbort] = useState(false);

  const isActive = run.status === 'running' || run.status === 'paused';
  const canAdvance = run.status === 'running' || run.status === 'paused';
  const canAbort = isActive;
  const isTerminal = run.status === 'completed' || run.status === 'failed' || run.status === 'aborted';

  const handleAdvance = async (skipCurrent: boolean = false) => {
    setLoading(true);
    try {
      const result = await advanceSuiteRun(run.id, { skipCurrent });
      if (result.success && result.run) {
        onRunUpdated?.(result.run);
      }
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Failed to advance run');
    } finally {
      setLoading(false);
    }
  };

  const handleAbort = async () => {
    if (!confirmAbort) {
      setConfirmAbort(true);
      return;
    }
    setLoading(true);
    try {
      const result = await abortSuiteRun(run.id, 'User requested abort');
      if (result.success && result.run) {
        onRunUpdated?.(result.run);
      }
      setConfirmAbort(false);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Failed to abort run');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAbort = () => {
    setConfirmAbort(false);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        {/* Status */}
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(run.status)}`}>
            {SUITE_RUN_STATUS_LABELS[run.status]}
          </span>

          {run.status === 'running' && (
            <span className="flex items-center gap-1 text-sm text-gray-500">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Processing...
            </span>
          )}

          {run.currentItemIndex !== null && run.totalItems && (
            <span className="text-sm text-gray-500">
              Item {run.currentItemIndex + 1} of {run.totalItems}
            </span>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {canAdvance && (
            <>
              <button
                onClick={() => handleAdvance(false)}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <LoadingSpinner />
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                    Advance
                  </>
                )}
              </button>

              <button
                onClick={() => handleAdvance(true)}
                disabled={loading}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                title="Skip current item and advance to next"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {canAbort && (
            confirmAbort ? (
              <div className="flex items-center gap-2 ml-2">
                <span className="text-sm text-red-600">Abort run?</span>
                <button
                  onClick={handleAbort}
                  disabled={loading}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50"
                >
                  {loading ? 'Aborting...' : 'Yes, Abort'}
                </button>
                <button
                  onClick={handleCancelAbort}
                  disabled={loading}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={handleAbort}
                disabled={loading}
                className="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg disabled:opacity-50 ml-2"
                title="Abort run"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )
          )}

          {isTerminal && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Run {run.status}
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {isActive && run.totalItems && run.totalItems > 0 && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span>{Math.round(((run.currentItemIndex || 0) / run.totalItems) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((run.currentItemIndex || 0) / run.totalItems) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Error display */}
      {run.errorDetails && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-red-700">
              <p className="font-medium">Run Error</p>
              <p className="mt-1">{typeof run.errorDetails === 'string' ? run.errorDetails : JSON.stringify(run.errorDetails)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}
