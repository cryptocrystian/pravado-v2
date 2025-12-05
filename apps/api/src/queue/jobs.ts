/**
 * Job Types for Execution Queue (Sprint S18)
 * Defines job structures for async playbook execution
 */

/**
 * Job priority levels
 */
export type JobPriority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * Job status in queue
 */
export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'retrying' | 'canceled';

/**
 * Base job interface
 */
export interface Job {
  id: string;
  type: 'playbook_step';
  priority: JobPriority;
  status: JobStatus;
  createdAt: string;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  attempt: number;
  maxAttempts: number;
  error?: {
    message: string;
    stack?: string;
    timestamp: string;
  };
  workerId?: string;
}

/**
 * Playbook step execution job
 */
export interface PlaybookStepJob extends Job {
  type: 'playbook_step';
  payload: {
    runId: string;
    stepRunId: string;
    stepId: string;
    stepKey: string;
    playbookId: string;
    orgId: string;
    input: unknown;
    previousOutputs: Record<string, unknown>;
    webhookUrl?: string;
  };
}

/**
 * Job result after execution
 */
export interface JobResult {
  jobId: string;
  status: 'success' | 'failure';
  output?: unknown;
  error?: {
    message: string;
    stack?: string;
  };
  executionTimeMs: number;
  logs?: Array<{
    timestamp: string;
    level: 'info' | 'warn' | 'error';
    message: string;
  }>;
}

/**
 * Job execution context passed to handlers
 */
export interface JobExecutionContext {
  job: PlaybookStepJob;
  workerId: string;
  logger: JobLogger;
  signal?: AbortSignal;
}

/**
 * Logger interface for job execution
 */
export interface JobLogger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string, error?: Error): void;
  getLogs(): Array<{
    timestamp: string;
    level: 'info' | 'warn' | 'error';
    message: string;
  }>;
}

/**
 * Job handler function type
 */
export type JobHandler = (
  context: JobExecutionContext
) => Promise<JobResult>;

/**
 * Queue configuration
 */
export interface QueueConfig {
  maxConcurrency: number;
  defaultMaxAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  maxRetryDelayMs: number;
  pollIntervalMs: number;
  staleJobTimeoutMs: number;
}

/**
 * Default queue configuration
 */
export const DEFAULT_QUEUE_CONFIG: QueueConfig = {
  maxConcurrency: 5,
  defaultMaxAttempts: 3,
  retryDelayMs: 1000,
  retryBackoffMultiplier: 2,
  maxRetryDelayMs: 30000,
  pollIntervalMs: 1000,
  staleJobTimeoutMs: 300000, // 5 minutes
};
