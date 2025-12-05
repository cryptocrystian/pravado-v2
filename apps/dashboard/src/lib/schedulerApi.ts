/**
 * Scheduler API Helper (Sprint S42)
 * Client-side functions for scheduler endpoints
 */

import type {
  ListSchedulerTasksQuery,
  ListTaskRunsQuery,
  SchedulerStats,
  SchedulerTask,
  SchedulerTaskListResponse,
  SchedulerTaskRunListResponse,
  TaskExecutionResult,
  UpdateSchedulerTaskInput,
} from '@pravado/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * List all scheduled tasks
 */
export async function listSchedulerTasks(
  query: ListSchedulerTasksQuery = {}
): Promise<SchedulerTaskListResponse> {
  const params = new URLSearchParams();

  if (query.enabled !== undefined) {
    params.append('enabled', String(query.enabled));
  }
  if (query.limit) {
    params.append('limit', String(query.limit));
  }
  if (query.offset) {
    params.append('offset', String(query.offset));
  }

  const url = `${API_BASE_URL}/api/v1/scheduler/tasks${params.toString() ? `?${params}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to list scheduler tasks');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Update task status (toggle enabled/disabled)
 */
export async function updateSchedulerTask(
  taskId: string,
  input: UpdateSchedulerTaskInput
): Promise<SchedulerTask> {
  const response = await fetch(`${API_BASE_URL}/api/v1/scheduler/tasks/${taskId}/toggle`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update scheduler task');
  }

  const result = await response.json();
  return result.data.task;
}

/**
 * Run a task immediately
 */
export async function runTaskNow(taskName: string): Promise<TaskExecutionResult> {
  const response = await fetch(`${API_BASE_URL}/api/v1/scheduler/tasks/${taskName}/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to run scheduler task');
  }

  const result = await response.json();
  return result.data.result;
}

/**
 * List task run history
 */
export async function listTaskRuns(
  query: ListTaskRunsQuery = {}
): Promise<SchedulerTaskRunListResponse> {
  const params = new URLSearchParams();

  if (query.taskId) {
    params.append('taskId', query.taskId);
  }
  if (query.status) {
    params.append('status', query.status);
  }
  if (query.startDate) {
    params.append('startDate', query.startDate);
  }
  if (query.endDate) {
    params.append('endDate', query.endDate);
  }
  if (query.limit) {
    params.append('limit', String(query.limit));
  }
  if (query.offset) {
    params.append('offset', String(query.offset));
  }

  const url = `${API_BASE_URL}/api/v1/scheduler/runs${params.toString() ? `?${params}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to list task runs');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Get scheduler statistics
 */
export async function getSchedulerStats(): Promise<SchedulerStats> {
  const response = await fetch(`${API_BASE_URL}/api/v1/scheduler/stats`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to get scheduler stats');
  }

  const result = await response.json();
  return result.data.stats;
}
