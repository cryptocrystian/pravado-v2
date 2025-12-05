/**
 * Scheduler Types (Sprint S42)
 * Types for scheduled background tasks and cron jobs
 */

// ========================================
// ENUMS & CONSTANTS
// ========================================

export type SchedulerTaskStatus = 'success' | 'failure';

export const SCHEDULER_TASK_STATUSES: readonly SchedulerTaskStatus[] = ['success', 'failure'] as const;

// ========================================
// DATABASE RECORDS
// ========================================

export interface SchedulerTaskRecord {
  id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  schedule: string; // Cron expression
  last_run_at: string | null; // ISO timestamp
  last_run_status: SchedulerTaskStatus | null;
  created_at: string;
  updated_at: string;
}

export interface SchedulerTaskRunRecord {
  id: string;
  task_id: string;
  started_at: string;
  finished_at: string | null;
  status: SchedulerTaskStatus | null;
  error: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

// ========================================
// DOMAIN TYPES
// ========================================

export interface SchedulerTask {
  id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  schedule: string;
  lastRunAt: Date | null;
  lastRunStatus: SchedulerTaskStatus | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SchedulerTaskRun {
  id: string;
  taskId: string;
  startedAt: Date;
  finishedAt: Date | null;
  status: SchedulerTaskStatus | null;
  error: string | null;
  metadata: Record<string, any>;
  createdAt: Date;
}

// ========================================
// JOINED TYPES
// ========================================

export interface SchedulerTaskWithRuns extends SchedulerTask {
  recentRuns: SchedulerTaskRun[];
  totalRuns: number;
  successCount: number;
  failureCount: number;
}

// ========================================
// INPUT TYPES
// ========================================

export interface UpdateSchedulerTaskInput {
  enabled?: boolean;
  description?: string;
}

export interface RunTaskInput {
  taskName: string;
  runImmediately?: boolean;
}

// ========================================
// QUERY TYPES
// ========================================

export interface ListSchedulerTasksQuery {
  enabled?: boolean;
  limit?: number;
  offset?: number;
}

export interface ListTaskRunsQuery {
  taskId?: string;
  status?: SchedulerTaskStatus;
  startDate?: string; // ISO date
  endDate?: string; // ISO date
  limit?: number;
  offset?: number;
}

// ========================================
// RESPONSE TYPES
// ========================================

export interface SchedulerTaskListResponse {
  tasks: SchedulerTask[];
  total: number;
}

export interface SchedulerTaskRunListResponse {
  runs: SchedulerTaskRun[];
  total: number;
}

export interface SchedulerStats {
  totalTasks: number;
  enabledTasks: number;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  last24hRuns: number;
}

// ========================================
// RESULT TYPES
// ========================================

export interface TaskExecutionResult {
  taskId: string;
  taskName: string;
  runId: string;
  status: SchedulerTaskStatus;
  error: string | null;
  duration: number; // milliseconds
  metadata: Record<string, any>;
}

export interface CronMatchResult {
  isDue: boolean;
  nextRunTime: Date | null;
  reason: string;
}

// ========================================
// TASK-SPECIFIC TYPES
// ========================================

// Hourly RSS Fetch Task
export interface HourlyRssFetchMetadata {
  feedsFetched: number;
  jobsCreated: number;
  errors: string[];
}

// 10-Minute Queue Jobs Task
export interface QueueJobsMetadata {
  jobsEnqueued: number;
  errors: string[];
}

// Nightly Cleanup Task
export interface NightlyCleanupMetadata {
  crawlJobsDeleted: number;
  taskRunsDeleted: number;
  errors: string[];
}

// ========================================
// TRANSFORM FUNCTIONS
// ========================================

export function transformSchedulerTaskRecord(record: SchedulerTaskRecord): SchedulerTask {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    enabled: record.enabled,
    schedule: record.schedule,
    lastRunAt: record.last_run_at ? new Date(record.last_run_at) : null,
    lastRunStatus: record.last_run_status,
    createdAt: new Date(record.created_at),
    updatedAt: new Date(record.updated_at),
  };
}

export function transformSchedulerTaskRunRecord(record: SchedulerTaskRunRecord): SchedulerTaskRun {
  return {
    id: record.id,
    taskId: record.task_id,
    startedAt: new Date(record.started_at),
    finishedAt: record.finished_at ? new Date(record.finished_at) : null,
    status: record.status,
    error: record.error,
    metadata: record.metadata,
    createdAt: new Date(record.created_at),
  };
}
