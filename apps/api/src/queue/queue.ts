/**
 * In-Memory Job Queue (Sprint S18)
 * Pluggable queue implementation (can be swapped for Redis later)
 */

import type {
  PlaybookStepJob,
  JobResult,
  JobHandler,
  QueueConfig,
  JobPriority,
  JobLogger,
  JobExecutionContext,
} from './jobs';
import { DEFAULT_QUEUE_CONFIG } from './jobs';

/**
 * Queue statistics
 */
export interface QueueStats {
  queued: number;
  running: number;
  completed: number;
  failed: number;
  retrying: number;
}

/**
 * Job queue implementation
 */
export class JobQueue {
  private jobs: Map<string, PlaybookStepJob> = new Map();
  private handlers: Map<string, JobHandler> = new Map();
  private config: QueueConfig;
  private pollInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(config: Partial<QueueConfig> = {}) {
    this.config = { ...DEFAULT_QUEUE_CONFIG, ...config };
  }

  /**
   * Register a job handler
   */
  registerHandler(jobType: string, handler: JobHandler): void {
    this.handlers.set(jobType, handler);
  }

  /**
   * Add a job to the queue
   */
  async enqueue(job: PlaybookStepJob): Promise<void> {
    this.jobs.set(job.id, {
      ...job,
      status: 'queued',
      createdAt: new Date().toISOString(),
      // Preserve existing attempt counter, default to 0 for new jobs
      attempt: job.attempt ?? 0,
    });
  }

  /**
   * Get a job by ID
   */
  getJob(jobId: string): PlaybookStepJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Update job status
   */
  updateJobStatus(jobId: string, status: PlaybookStepJob['status']): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.status = status;
      if (status === 'running' && !job.startedAt) {
        job.startedAt = new Date().toISOString();
      }
      if ((status === 'completed' || status === 'failed') && !job.completedAt) {
        job.completedAt = new Date().toISOString();
      }
    }
  }

  /**
   * Mark job as failed with error
   */
  failJob(jobId: string, error: Error): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.status = 'failed';
      job.error = {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      };
      job.completedAt = new Date().toISOString();
    }
  }

  /**
   * Retry a failed job
   */
  async retryJob(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    // Check if we would exceed max attempts after incrementing
    if (job.attempt + 1 > job.maxAttempts) {
      return false;
    }

    job.attempt += 1;
    job.status = 'retrying';

    // Calculate backoff delay
    const delay = Math.min(
      this.config.retryDelayMs * Math.pow(this.config.retryBackoffMultiplier, job.attempt - 1),
      this.config.maxRetryDelayMs
    );

    job.scheduledAt = new Date(Date.now() + delay).toISOString();

    return true;
  }

  /**
   * Cancel a job
   */
  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    if (job.status === 'running') {
      // Job is running, mark for cancellation
      // Worker will check this and abort
      job.status = 'canceled';
      return true;
    }

    if (job.status === 'queued' || job.status === 'retrying') {
      job.status = 'canceled';
      job.completedAt = new Date().toISOString();
      return true;
    }

    return false;
  }

  /**
   * Get next job to execute (priority-based)
   */
  getNextJob(): PlaybookStepJob | null {
    const now = new Date();

    // Get all jobs ready to execute
    const readyJobs = Array.from(this.jobs.values()).filter((job) => {
      if (job.status !== 'queued' && job.status !== 'retrying') {
        return false;
      }

      // Check if scheduled time has passed
      if (job.scheduledAt) {
        return new Date(job.scheduledAt) <= now;
      }

      return true;
    });

    if (readyJobs.length === 0) {
      return null;
    }

    // Sort by priority then creation time
    const priorityOrder: Record<JobPriority, number> = {
      urgent: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    readyJobs.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    return readyJobs[0];
  }

  /**
   * Execute a job
   */
  async executeJob(job: PlaybookStepJob, workerId: string): Promise<JobResult> {
    const handler = this.handlers.get(job.type);
    if (!handler) {
      throw new Error(`No handler registered for job type: ${job.type}`);
    }

    // Create logger
    const logs: Array<{
      timestamp: string;
      level: 'info' | 'warn' | 'error';
      message: string;
    }> = [];

    const logger: JobLogger = {
      info: (message: string) => {
        logs.push({
          timestamp: new Date().toISOString(),
          level: 'info',
          message,
        });
      },
      warn: (message: string) => {
        logs.push({
          timestamp: new Date().toISOString(),
          level: 'warn',
          message,
        });
      },
      error: (message: string, error?: Error) => {
        logs.push({
          timestamp: new Date().toISOString(),
          level: 'error',
          message: error ? `${message}: ${error.message}` : message,
        });
      },
      getLogs: () => logs,
    };

    // Create execution context
    const context: JobExecutionContext = {
      job,
      workerId,
      logger,
    };

    // Mark job as running
    this.updateJobStatus(job.id, 'running');
    job.workerId = workerId;

    const startTime = Date.now();

    try {
      const result = await handler(context);

      // Update job status based on result
      if (result.status === 'success') {
        this.updateJobStatus(job.id, 'completed');
      } else {
        this.updateJobStatus(job.id, 'failed');
      }

      return {
        ...result,
        executionTimeMs: Date.now() - startTime,
        logs,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      logger.error('Job execution failed', err);
      this.failJob(job.id, err);

      return {
        jobId: job.id,
        status: 'failure',
        error: {
          message: err.message,
          stack: err.stack,
        },
        executionTimeMs: Date.now() - startTime,
        logs,
      };
    }
  }

  /**
   * Get queue statistics
   */
  getStats(): QueueStats {
    const jobs = Array.from(this.jobs.values());

    return {
      queued: jobs.filter((j) => j.status === 'queued').length,
      running: jobs.filter((j) => j.status === 'running').length,
      completed: jobs.filter((j) => j.status === 'completed').length,
      failed: jobs.filter((j) => j.status === 'failed').length,
      retrying: jobs.filter((j) => j.status === 'retrying').length,
    };
  }

  /**
   * Get all jobs (for debugging/admin)
   */
  getAllJobs(): PlaybookStepJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Clean up old completed/failed jobs
   */
  cleanup(maxAgeMs: number = 3600000): number {
    const cutoff = Date.now() - maxAgeMs;
    let removed = 0;

    for (const [id, job] of this.jobs.entries()) {
      if (
        (job.status === 'completed' || job.status === 'failed' || job.status === 'canceled') &&
        job.completedAt &&
        new Date(job.completedAt).getTime() < cutoff
      ) {
        this.jobs.delete(id);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Start the queue (for polling-based execution)
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log('[Queue] Started');
  }

  /**
   * Stop the queue
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;

    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    console.log('[Queue] Stopped');
  }

  /**
   * Check if queue is running
   */
  isActive(): boolean {
    return this.isRunning;
  }
}
