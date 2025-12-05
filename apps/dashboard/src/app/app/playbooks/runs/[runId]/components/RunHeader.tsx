/**
 * RunHeader Component (Sprint S19)
 * Shows run overview: ID, name, state, duration, progress
 */

'use client';

import type { PlaybookRunView } from '@pravado/types';

interface RunHeaderProps {
  run: PlaybookRunView;
  streamingMode?: string; // S21: Show "LIVE" or "Polling" indicator
}

/**
 * Get state badge color
 */
function getStateColor(state: string): string {
  const colors: Record<string, string> = {
    queued: 'bg-gray-400',
    running: 'bg-blue-600',
    success: 'bg-green-600',
    failed: 'bg-red-600',
    waiting_for_dependencies: 'bg-yellow-600',
    blocked: 'bg-purple-600',
    canceled: 'bg-gray-600',
  };
  return colors[state] || 'bg-gray-400';
}

/**
 * Get streaming mode badge color (S21)
 */
function getStreamingModeColor(mode: string): string {
  const colors: Record<string, string> = {
    LIVE: 'bg-green-600',
    Polling: 'bg-yellow-600',
    Paused: 'bg-gray-600',
  };
  return colors[mode] || 'bg-gray-600';
}

/**
 * Format duration from start to now/end
 */
function formatDuration(startedAt: string | null, completedAt: string | null): string {
  if (!startedAt) return '—';

  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const durationMs = end - start;

  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

export function RunHeader({ run, streamingMode }: RunHeaderProps) {
  const duration = formatDuration(run.startedAt, run.completedAt);
  const completionRate = run.progress.total > 0
    ? Math.round((run.progress.completed / run.progress.total) * 100)
    : 0;

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left: Run info */}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {run.playbookName}
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-white text-xs font-semibold uppercase ${getStateColor(
                run.state
              )}`}
            >
              {run.state}
            </span>
            {/* S21: Streaming mode indicator */}
            {streamingMode && (
              <span
                className={`px-3 py-1 rounded-full text-white text-xs font-semibold uppercase ${getStreamingModeColor(
                  streamingMode
                )}`}
              >
                {streamingMode}
              </span>
            )}
          </div>

          <div className="mt-2 flex items-center gap-6 text-sm text-gray-600">
            <div>
              <span className="font-medium">Run ID:</span>{' '}
              <span className="font-mono text-xs">{run.id.slice(0, 8)}</span>
            </div>
            <div>
              <span className="font-medium">Version:</span> v{run.playbookVersion}
            </div>
            <div>
              <span className="font-medium">Duration:</span> {duration}
            </div>
          </div>
        </div>

        {/* Right: Progress */}
        <div className="flex flex-col items-end gap-2">
          <div className="text-3xl font-bold text-gray-900">
            {completionRate}%
          </div>
          <div className="text-sm text-gray-600">
            {run.progress.completed} / {run.progress.total} steps
          </div>

          {/* Progress bar */}
          <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${completionRate}%` }}
            />
          </div>

          {/* Status counts */}
          <div className="flex gap-4 text-xs text-gray-600">
            {run.progress.running > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-blue-600 rounded-full" />
                {run.progress.running} running
              </span>
            )}
            {run.progress.failed > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-red-600 rounded-full" />
                {run.progress.failed} failed
              </span>
            )}
            {run.progress.pending > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full" />
                {run.progress.pending} pending
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Error banner if failed */}
      {run.state === 'failed' && Boolean(run.error) && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex items-start gap-2">
            <div className="text-red-600 font-semibold text-sm">⚠ Run Failed</div>
            <div className="text-sm text-red-800">
              {typeof run.error === 'object' && run.error !== null
                ? (run.error as any).message || JSON.stringify(run.error)
                : String(run.error)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
