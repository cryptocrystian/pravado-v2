/**
 * Playbook Run Viewer Page (Sprint S19)
 * Live execution viewer with SSE streaming (S21) and polling fallback
 */

'use client';

import { FLAGS } from '@pravado/feature-flags';
import type { PlaybookRunView } from '@pravado/types';
import { useParams } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo } from 'react';

import { useExecutionStream, type ExecutionEvent } from '@/hooks/useExecutionStream';

import { RunHeader } from './components/RunHeader';
import { StepInspector } from './components/StepInspector';
import { StepTimeline } from './components/StepTimeline';

const POLL_INTERVAL_MS = 2000; // 2 seconds

export default function PlaybookRunViewerPage() {
  const params = useParams();
  const runId = params?.runId as string;

  const [run, setRun] = useState<PlaybookRunView | null>(null);
  const [selectedStepKey, setSelectedStepKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [streamingMode, setStreamingMode] = useState<'sse' | 'polling'>('polling');

  // S21: SSE streaming (only if feature flag enabled)
  const streamingEnabled = FLAGS.ENABLE_EXECUTION_STREAMING;
  const {
    connected: sseConnected,
    lastEvent,
    error: sseError,
  } = useExecutionStream(streamingEnabled ? runId : null, {
    enabled: streamingEnabled,
  });

  /**
   * Fetch run data
   */
  const fetchRun = useCallback(async () => {
    try {
      const response = await fetch(`/api/v1/playbook-runs/${runId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch run: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success || !data.data) {
        throw new Error('Invalid response format');
      }

      setRun(data.data);
      setError(null);

      // Auto-select first step if none selected
      if (!selectedStepKey && data.data.steps.length > 0) {
        setSelectedStepKey(data.data.steps[0].key);
      }

      // Stop polling if run is complete
      const finalStates = ['success', 'failed', 'canceled'];
      if (finalStates.includes(data.data.state)) {
        setIsPolling(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [runId, selectedStepKey]);

  /**
   * Apply SSE event to run state (S21)
   */
  const applyEvent = useCallback((event: ExecutionEvent) => {
    if (!run) return;

    setRun((prevRun) => {
      if (!prevRun) return prevRun;

      const updatedRun = { ...prevRun };

      switch (event.type) {
        case 'run.completed':
          updatedRun.status = 'SUCCEEDED';
          updatedRun.state = 'success';
          updatedRun.completedAt = event.payload.completedAt as string;
          setIsPolling(false);
          break;

        case 'run.failed':
          updatedRun.status = 'FAILED';
          updatedRun.state = 'failed';
          updatedRun.completedAt = event.payload.failedAt as string;
          updatedRun.error = { message: event.payload.error as string };
          setIsPolling(false);
          break;

        case 'step.updated':
        case 'step.completed':
        case 'step.failed':
          // Update specific step state
          if (event.stepKey) {
            updatedRun.steps = updatedRun.steps.map((step) => {
              if (step.key !== event.stepKey) return step;

              const updatedStep = { ...step };

              if (event.type === 'step.updated') {
                if (event.payload.startedAt) {
                  updatedStep.startedAt = event.payload.startedAt as string;
                  updatedStep.state = 'running';
                  updatedStep.status = 'RUNNING';
                }
              } else if (event.type === 'step.completed') {
                updatedStep.status = 'SUCCEEDED';
                updatedStep.state = 'success';
                updatedStep.completedAt = event.payload.completedAt as string;
                if (event.payload.result) {
                  updatedStep.output = event.payload.result as Record<string, unknown>;
                }
              } else if (event.type === 'step.failed') {
                updatedStep.status = 'FAILED';
                updatedStep.state = 'failed';
                updatedStep.completedAt = event.payload.failedAt as string;
                updatedStep.error = { message: event.payload.error as string };
              }

              return updatedStep;
            });
          }
          break;

        case 'step.log.appended':
          // Append log to step
          if (event.stepKey && event.payload.logEntry) {
            updatedRun.steps = updatedRun.steps.map((step) => {
              if (step.key !== event.stepKey) return step;

              const updatedStep = { ...step };
              const logEntry = event.payload.logEntry as {
                level: string;
                message: string;
                timestamp: string;
              };

              // Append to logs array (create if doesn't exist)
              if (!updatedStep.logs) {
                updatedStep.logs = [];
              }
              updatedStep.logs = [...updatedStep.logs, logEntry.message];

              return updatedStep;
            });
          }
          break;
      }

      return updatedRun;
    });
  }, [run]);

  // Initial fetch
  useEffect(() => {
    fetchRun();
  }, [runId]);

  // S21: Apply SSE events when they arrive
  useEffect(() => {
    if (lastEvent && streamingMode === 'sse') {
      applyEvent(lastEvent);
    }
  }, [lastEvent, streamingMode, applyEvent]);

  // S21: Switch between SSE and polling modes
  useEffect(() => {
    if (!streamingEnabled) {
      setStreamingMode('polling');
      return;
    }

    if (sseConnected) {
      // SSE connected - switch to streaming mode
      setStreamingMode('sse');
    } else if (sseError || !sseConnected) {
      // SSE disconnected or error - fallback to polling
      setStreamingMode('polling');
    }
  }, [streamingEnabled, sseConnected, sseError]);

  // Polling (only active when not in SSE mode or polling manually enabled)
  useEffect(() => {
    // Don't poll if SSE is connected
    if (streamingMode === 'sse') {
      return;
    }

    if (!isPolling) return;

    const interval = setInterval(() => {
      fetchRun();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [runId, isPolling, streamingMode, fetchRun]);

  // Determine display mode for indicator
  const displayMode = useMemo(() => {
    if (streamingEnabled && sseConnected && streamingMode === 'sse') {
      return { label: 'LIVE', color: 'bg-green-600', pulse: true };
    } else if (isPolling) {
      return { label: 'Polling', color: 'bg-yellow-600', pulse: false };
    } else {
      return { label: 'Paused', color: 'bg-gray-600', pulse: false };
    }
  }, [streamingEnabled, sseConnected, streamingMode, isPolling]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-gray-600">Loading playbook run...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !run) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="bg-white border border-red-200 rounded-lg p-6 max-w-md">
          <div className="text-red-600 text-xl font-semibold mb-2">⚠ Error</div>
          <div className="text-gray-700">{error || 'Failed to load playbook run'}</div>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchRun();
            }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const selectedStep = run.steps.find((s) => s.key === selectedStepKey) || null;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <RunHeader run={run} streamingMode={displayMode.label} />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Timeline */}
        <div className="w-96 flex-shrink-0 overflow-y-auto">
          <StepTimeline
            steps={run.steps}
            selectedStepKey={selectedStepKey}
            onSelectStep={setSelectedStepKey}
          />
        </div>

        {/* Right: Inspector */}
        <div className="flex-1 overflow-hidden">
          <StepInspector step={selectedStep} />
        </div>
      </div>

      {/* S21: Streaming/Polling indicator */}
      <div
        className={`fixed bottom-4 right-4 ${displayMode.color} text-white px-3 py-2 rounded-full shadow-lg text-xs flex items-center gap-2`}
      >
        {displayMode.pulse && (
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        )}
        {displayMode.label}
      </div>

      {/* Manual refresh button */}
      <button
        onClick={fetchRun}
        className="fixed bottom-4 left-4 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg shadow hover:bg-gray-50 text-sm flex items-center gap-2"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        Refresh
      </button>

      {/* Toggle polling */}
      <button
        onClick={() => setIsPolling(!isPolling)}
        className="fixed bottom-16 left-4 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg shadow hover:bg-gray-50 text-sm"
      >
        {isPolling ? 'Pause' : 'Resume'} updates
      </button>
    </div>
  );
}
