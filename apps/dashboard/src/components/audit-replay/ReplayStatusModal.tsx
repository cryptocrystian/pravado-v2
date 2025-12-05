'use client';

/**
 * Replay Status Modal Component (Sprint S37)
 * Shows live progress via SSE
 */

import { useEffect, useState } from 'react';

import type { ReplayResultSummary } from '@/lib/auditReplayApi';
import { subscribeToReplayEvents } from '@/lib/auditReplayApi';

interface ReplayStatusModalProps {
  jobId: string;
  onClose: () => void;
  onComplete: (result: ReplayResultSummary) => void;
}

export function ReplayStatusModal({
  jobId,
  onClose,
  onComplete,
}: ReplayStatusModalProps) {
  const [status, setStatus] = useState<'connecting' | 'running' | 'completed' | 'failed'>(
    'connecting'
  );
  const [progress, setProgress] = useState(0);
  const [currentEvent, setCurrentEvent] = useState(0);
  const [totalEvents, setTotalEvents] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToReplayEvents(jobId, {
      onStart: () => {
        setStatus('running');
      },
      onProgress: (prog, current, total) => {
        setProgress(prog);
        setCurrentEvent(current);
        setTotalEvents(total);
      },
      onComplete: (result) => {
        setStatus('completed');
        setTimeout(() => {
          onComplete(result);
        }, 1000);
      },
      onError: (err) => {
        setStatus('failed');
        setError(err);
      },
      onDisconnect: () => {
        if (status === 'connecting') {
          setError('Failed to connect to replay stream');
          setStatus('failed');
        }
      },
    });

    return () => {
      unsubscribe();
    };
  }, [jobId, onComplete, status]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Replay Progress</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={status === 'running'}
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

        <div className="px-6 py-4 space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Status</span>
            <span
              className={`px-2 py-1 rounded text-sm font-medium ${
                status === 'completed'
                  ? 'bg-green-100 text-green-800'
                  : status === 'failed'
                  ? 'bg-red-100 text-red-800'
                  : status === 'running'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {status === 'connecting'
                ? 'Connecting...'
                : status === 'running'
                ? 'Running'
                : status === 'completed'
                ? 'Completed'
                : 'Failed'}
            </span>
          </div>

          {/* Progress bar */}
          {(status === 'running' || status === 'completed') && (
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium text-gray-900">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              {totalEvents > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  Processing event {currentEvent} of {totalEvents}
                </div>
              )}
            </div>
          )}

          {/* Connecting spinner */}
          {status === 'connecting' && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          )}

          {/* Error message */}
          {status === 'failed' && error && (
            <div className="p-3 bg-red-50 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Success message */}
          {status === 'completed' && (
            <div className="p-3 bg-green-50 rounded-md">
              <p className="text-sm text-green-700">
                Replay completed successfully! Loading results...
              </p>
            </div>
          )}
        </div>

        <div className="px-6 py-3 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            disabled={status === 'running'}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'completed' ? 'View Results' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
