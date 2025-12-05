/**
 * Audit Replay Page (Sprint S37)
 * State reconstruction and timeline visualization
 */

'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';

import {
  ReplayConfigurator,
  ReplayRunCard,
  ReplayTimeline,
  ReplayDiffInspector,
  ReplayStatusModal,
} from '@/components/audit-replay';
import type {
  AuditReplayFilters,
  AuditReplayRun,
  ReplaySnapshot,
  ReplayTimelineEvent,
  ReplayResultSummary,
} from '@/lib/auditReplayApi';
import {
  createReplayJob,
  getReplayStatus,
  listReplayRuns,
  getReplaySnapshot,
} from '@/lib/auditReplayApi';

export default function AuditReplayPage() {
  // State
  const [runs, setRuns] = useState<AuditReplayRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<AuditReplayRun | null>(null);
  const [timeline, setTimeline] = useState<ReplayTimelineEvent[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<ReplaySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [creatingReplay, setCreatingReplay] = useState(false);
  const [loadingSnapshot, setLoadingSnapshot] = useState(false);

  // Load replay runs
  const loadRuns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await listReplayRuns();
      setRuns(result.runs);
    } catch (err: unknown) {
      console.error('Failed to load replay runs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load replay runs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  // Start a new replay
  const handleStartReplay = async (filters: AuditReplayFilters) => {
    try {
      setCreatingReplay(true);
      setError(null);
      const result = await createReplayJob(filters);
      setActiveJobId(result.jobId);
    } catch (err: unknown) {
      console.error('Failed to create replay:', err);
      setError(err instanceof Error ? err.message : 'Failed to create replay');
    } finally {
      setCreatingReplay(false);
    }
  };

  // Handle replay completion
  const handleReplayComplete = async (_result: ReplayResultSummary) => {
    setActiveJobId(null);
    await loadRuns();

    // Select the new run if we have one
    if (runs.length > 0) {
      await handleSelectRun(runs[0]);
    }
  };

  // Select a replay run
  const handleSelectRun = async (run: AuditReplayRun) => {
    try {
      setSelectedRun(run);
      setSelectedSnapshot(null);

      if (run.status === 'success') {
        const result = await getReplayStatus(run.id);
        setTimeline(result.timeline || []);
      } else {
        setTimeline([]);
      }
    } catch (err: unknown) {
      console.error('Failed to load run details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load run details');
    }
  };

  // Select a timeline event
  const handleSelectEvent = async (index: number) => {
    if (!selectedRun) return;

    try {
      setLoadingSnapshot(true);
      const snapshot = await getReplaySnapshot(selectedRun.id, index);
      setSelectedSnapshot(snapshot);
    } catch (err: unknown) {
      console.error('Failed to load snapshot:', err);
    } finally {
      setLoadingSnapshot(false);
    }
  };

  // Render loading state
  if (loading && runs.length === 0) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
          <p className="mt-4 text-gray-600">Loading replay runs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Audit Replay</h1>
        <p className="text-gray-600">
          Reconstruct and visualize past system state from audit logs
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
          <button
            onClick={() => setError(null)}
            className="float-right text-red-700 hover:text-red-900"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Configurator and runs */}
        <div className="space-y-6">
          {/* Replay Configurator */}
          <ReplayConfigurator
            onStartReplay={handleStartReplay}
            loading={creatingReplay}
          />

          {/* Past Runs */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Past Replays</h3>
            {runs.length === 0 ? (
              <p className="text-gray-500 text-sm">No replay runs yet</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {runs.map((run) => (
                  <ReplayRunCard
                    key={run.id}
                    run={run}
                    onClick={() => handleSelectRun(run)}
                    selected={selectedRun?.id === run.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Middle column - Timeline */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Event Timeline
            {selectedRun && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({timeline.length} events)
              </span>
            )}
          </h3>

          {!selectedRun ? (
            <div className="text-center py-8 text-gray-500">
              Select a replay run to view timeline
            </div>
          ) : selectedRun.status !== 'success' ? (
            <div className="text-center py-8 text-gray-500">
              {selectedRun.status === 'running' && 'Replay in progress...'}
              {selectedRun.status === 'queued' && 'Replay queued...'}
              {selectedRun.status === 'failed' && (
                <span className="text-red-600">
                  Replay failed: {selectedRun.errorMessage}
                </span>
              )}
            </div>
          ) : (
            <div className="max-h-[600px] overflow-y-auto">
              <ReplayTimeline
                events={timeline}
                selectedIndex={selectedSnapshot?.snapshotIndex}
                onSelectEvent={handleSelectEvent}
              />
            </div>
          )}
        </div>

        {/* Right column - Diff Inspector */}
        <div>
          <ReplayDiffInspector
            snapshot={selectedSnapshot}
            loading={loadingSnapshot}
            onClose={() => setSelectedSnapshot(null)}
          />

          {/* Result Summary */}
          {selectedRun?.result && (
            <div className="mt-6 bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Replay Summary
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Events</span>
                  <span className="font-medium">
                    {selectedRun.result.totalEvents}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Snapshots</span>
                  <span className="font-medium">
                    {selectedRun.result.totalSnapshots}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Additions</span>
                  <span className="font-medium text-green-600">
                    +{selectedRun.result.stateChanges.additions}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Modifications</span>
                  <span className="font-medium text-yellow-600">
                    ~{selectedRun.result.stateChanges.modifications}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Deletions</span>
                  <span className="font-medium text-red-600">
                    -{selectedRun.result.stateChanges.deletions}
                  </span>
                </div>

                {/* Entity breakdown */}
                <div className="pt-3 border-t border-gray-100">
                  <div className="text-gray-500 mb-2">By Entity</div>
                  {Object.entries(selectedRun.result.entityBreakdown).map(
                    ([entity, count]) => (
                      <div key={entity} className="flex justify-between text-xs">
                        <span className="capitalize">{entity}</span>
                        <span>{count as number}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Modal */}
      {activeJobId && (
        <ReplayStatusModal
          jobId={activeJobId}
          onClose={() => setActiveJobId(null)}
          onComplete={handleReplayComplete}
        />
      )}
    </div>
  );
}
