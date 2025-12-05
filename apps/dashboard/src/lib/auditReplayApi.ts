/**
 * Audit Replay API Client (Sprint S37)
 * Client-side API helpers for audit replay functionality
 */

import type {
  AuditReplayFilters,
  AuditReplayRun,
  AuditReplayStatus,
  ReplaySnapshot,
  ReplayTimelineEvent,
  ReplayResultSummary,
  ReplaySSEEvent,
  StateDiff,
} from '@pravado/types';

// Re-export types for convenience
export type {
  AuditReplayFilters,
  AuditReplayRun,
  AuditReplayStatus,
  ReplaySnapshot,
  ReplayTimelineEvent,
  ReplayResultSummary,
  ReplaySSEEvent,
  StateDiff,
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * API Response wrapper
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Create a new replay job
 */
export async function createReplayJob(
  filters?: AuditReplayFilters
): Promise<{ jobId: string; status: AuditReplayStatus }> {
  const response = await fetch(`${API_BASE}/api/v1/audit/replay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ filters }),
  });

  const result: ApiResponse<{ jobId: string; status: AuditReplayStatus }> =
    await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to create replay job');
  }

  return result.data;
}

/**
 * Get replay job status and timeline
 */
export async function getReplayStatus(
  jobId: string
): Promise<{ run: AuditReplayRun; timeline?: ReplayTimelineEvent[] }> {
  const response = await fetch(`${API_BASE}/api/v1/audit/replay/${jobId}`, {
    method: 'GET',
    credentials: 'include',
  });

  const result: ApiResponse<{ run: AuditReplayRun; timeline?: ReplayTimelineEvent[] }> =
    await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to get replay status');
  }

  return result.data;
}

/**
 * List replay runs for the organization
 */
export async function listReplayRuns(
  limit = 20,
  offset = 0
): Promise<{ runs: AuditReplayRun[]; total: number; hasMore: boolean }> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  const response = await fetch(`${API_BASE}/api/v1/audit/replays?${params}`, {
    method: 'GET',
    credentials: 'include',
  });

  const result: ApiResponse<{ runs: AuditReplayRun[]; total: number; hasMore: boolean }> =
    await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to list replay runs');
  }

  return result.data;
}

/**
 * Get a specific snapshot
 */
export async function getReplaySnapshot(
  runId: string,
  snapshotIndex: number
): Promise<ReplaySnapshot> {
  const response = await fetch(
    `${API_BASE}/api/v1/audit/replay/${runId}/snapshots/${snapshotIndex}`,
    {
      method: 'GET',
      credentials: 'include',
    }
  );

  const result: ApiResponse<ReplaySnapshot> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to get snapshot');
  }

  return result.data;
}

/**
 * Get the SSE stream URL for a replay job
 */
export function getReplayStreamUrl(jobId: string): string {
  return `${API_BASE}/api/v1/audit/replay/${jobId}/stream`;
}

/**
 * Subscribe to replay events via SSE
 */
export function subscribeToReplayEvents(
  jobId: string,
  callbacks: {
    onStart?: () => void;
    onProgress?: (progress: number, current: number, total: number) => void;
    onSnapshot?: (snapshot: ReplaySnapshot) => void;
    onComplete?: (result: ReplayResultSummary) => void;
    onError?: (error: string) => void;
    onDisconnect?: () => void;
  }
): () => void {
  const eventSource = new EventSource(getReplayStreamUrl(jobId), {
    withCredentials: true,
  });

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as ReplaySSEEvent;

      switch (data.type) {
        case 'replay.started':
          callbacks.onStart?.();
          break;

        case 'replay.progress':
          callbacks.onProgress?.(
            data.data.progress || 0,
            data.data.currentEvent || 0,
            data.data.totalEvents || 0
          );
          break;

        case 'replay.snapshot':
          if (data.data.snapshot) {
            callbacks.onSnapshot?.(data.data.snapshot);
          }
          break;

        case 'replay.completed':
          if (data.data.result) {
            callbacks.onComplete?.(data.data.result);
          }
          eventSource.close();
          break;

        case 'replay.failed':
          callbacks.onError?.(data.data.error || 'Replay failed');
          eventSource.close();
          break;
      }
    } catch (err) {
      console.error('Failed to parse SSE event:', err);
    }
  };

  eventSource.onerror = () => {
    callbacks.onDisconnect?.();
    eventSource.close();
  };

  // Return cleanup function
  return () => {
    eventSource.close();
  };
}

/**
 * Format replay status for display
 */
export function getReplayStatusColor(status: AuditReplayStatus): string {
  switch (status) {
    case 'queued':
      return 'gray';
    case 'running':
      return 'blue';
    case 'success':
      return 'green';
    case 'failed':
      return 'red';
    default:
      return 'gray';
  }
}

/**
 * Format replay status for display
 */
export function getReplayStatusLabel(status: AuditReplayStatus): string {
  switch (status) {
    case 'queued':
      return 'Queued';
    case 'running':
      return 'Running';
    case 'success':
      return 'Completed';
    case 'failed':
      return 'Failed';
    default:
      return status;
  }
}

/**
 * Format duration in human-readable form
 */
export function formatDuration(startTime: string, endTime?: string | null): string {
  const start = new Date(startTime).getTime();
  const end = endTime ? new Date(endTime).getTime() : Date.now();
  const duration = end - start;

  if (duration < 1000) {
    return `${duration}ms`;
  } else if (duration < 60000) {
    return `${Math.round(duration / 1000)}s`;
  } else {
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.round((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }
}

/**
 * Format entity type for display
 */
export function formatEntityType(entityType: string): string {
  switch (entityType) {
    case 'content':
      return 'Content';
    case 'playbook':
      return 'Playbook';
    case 'billing':
      return 'Billing';
    case 'agent':
      return 'Agent';
    case 'execution':
      return 'Execution';
    default:
      return entityType.charAt(0).toUpperCase() + entityType.slice(1);
  }
}

/**
 * Get entity type color
 */
export function getEntityTypeColor(entityType: string): string {
  switch (entityType) {
    case 'content':
      return 'blue';
    case 'playbook':
      return 'purple';
    case 'billing':
      return 'green';
    case 'agent':
      return 'indigo';
    case 'execution':
      return 'orange';
    default:
      return 'gray';
  }
}

/**
 * Format diff operation for display
 */
export function formatDiffOperation(operation: 'added' | 'removed' | 'modified'): {
  label: string;
  color: string;
  icon: string;
} {
  switch (operation) {
    case 'added':
      return { label: 'Added', color: 'green', icon: '+' };
    case 'removed':
      return { label: 'Removed', color: 'red', icon: '-' };
    case 'modified':
      return { label: 'Modified', color: 'yellow', icon: '~' };
  }
}
