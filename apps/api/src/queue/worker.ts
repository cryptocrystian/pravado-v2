/**
 * Worker Pool Implementation (Sprint S18)
 * Manages concurrent job execution with configurable worker count
 */

import type { PlaybookStepJob, QueueConfig } from './jobs';
import type { JobQueue } from './queue';

/**
 * Worker status
 */
export type WorkerStatus = 'idle' | 'busy' | 'stopped';

/**
 * Worker information
 */
export interface Worker {
  id: string;
  status: WorkerStatus;
  currentJobId: string | null;
  jobsProcessed: number;
  startedAt: string;
  lastJobCompletedAt: string | null;
}

/**
 * Worker pool statistics
 */
export interface WorkerPoolStats {
  totalWorkers: number;
  idleWorkers: number;
  busyWorkers: number;
  totalJobsProcessed: number;
}

/**
 * Worker pool manages a pool of workers processing jobs from the queue
 */
export class WorkerPool {
  private workers: Map<string, Worker> = new Map();
  private queue: JobQueue;
  private config: QueueConfig;
  private pollInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private processingPromises: Map<string, Promise<void>> = new Map();

  constructor(queue: JobQueue, config: QueueConfig) {
    this.queue = queue;
    this.config = config;
    this.initializeWorkers();
  }

  /**
   * Initialize worker instances
   */
  private initializeWorkers(): void {
    for (let i = 0; i < this.config.maxConcurrency; i++) {
      const workerId = `worker-${i + 1}`;
      this.workers.set(workerId, {
        id: workerId,
        status: 'idle',
        currentJobId: null,
        jobsProcessed: 0,
        startedAt: new Date().toISOString(),
        lastJobCompletedAt: null,
      });
    }
  }

  /**
   * Start the worker pool
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.queue.start();

    // Start polling for jobs
    this.pollInterval = setInterval(() => {
      this.processNextJobs();
    }, this.config.pollIntervalMs);

    console.log(`[WorkerPool] Started with ${this.config.maxConcurrency} workers`);
  }

  /**
   * Stop the worker pool
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;

    this.isRunning = false;
    this.queue.stop();

    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    // Wait for all running jobs to complete
    await Promise.all(Array.from(this.processingPromises.values()));

    console.log('[WorkerPool] Stopped');
  }

  /**
   * Process next available jobs
   */
  private processNextJobs(): void {
    if (!this.isRunning) return;

    // Get all idle workers
    const idleWorkers = Array.from(this.workers.values()).filter(
      (w) => w.status === 'idle'
    );

    if (idleWorkers.length === 0) {
      return;
    }

    // Assign jobs to idle workers
    for (const worker of idleWorkers) {
      const job = this.queue.getNextJob();
      if (!job) {
        break; // No more jobs to process
      }

      // Assign job to worker
      this.assignJobToWorker(worker.id, job);
    }
  }

  /**
   * Assign a job to a specific worker
   */
  private assignJobToWorker(workerId: string, job: PlaybookStepJob): void {
    const worker = this.workers.get(workerId);
    if (!worker || worker.status !== 'idle') {
      return;
    }

    worker.status = 'busy';
    worker.currentJobId = job.id;

    const processingPromise = this.executeJobWithWorker(workerId, job)
      .finally(() => {
        // Clean up promise reference
        this.processingPromises.delete(workerId);
      });

    this.processingPromises.set(workerId, processingPromise);
  }

  /**
   * Execute a job with a worker
   */
  private async executeJobWithWorker(
    workerId: string,
    job: PlaybookStepJob
  ): Promise<void> {
    const worker = this.workers.get(workerId);
    if (!worker) return;

    try {
      console.log(`[Worker ${workerId}] Processing job ${job.id}`);

      const result = await this.queue.executeJob(job, workerId);

      console.log(
        `[Worker ${workerId}] Job ${job.id} ${result.status} in ${result.executionTimeMs}ms`
      );

      // Handle retry logic
      if (result.status === 'failure' && job.attempt < job.maxAttempts) {
        const retried = await this.queue.retryJob(job.id);
        if (retried) {
          // retryJob() already incremented job.attempt, so no need to add 1
          console.log(
            `[Worker ${workerId}] Job ${job.id} scheduled for retry (attempt ${job.attempt}/${job.maxAttempts})`
          );
        }
      }

      worker.jobsProcessed += 1;
      worker.lastJobCompletedAt = new Date().toISOString();
    } catch (error) {
      console.error(`[Worker ${workerId}] Error processing job ${job.id}:`, error);

      // Mark job as failed if not already
      if (job.status !== 'failed') {
        this.queue.failJob(job.id, error instanceof Error ? error : new Error(String(error)));
      }
    } finally {
      // Mark worker as idle
      worker.status = 'idle';
      worker.currentJobId = null;
    }
  }

  /**
   * Get worker by ID
   */
  getWorker(workerId: string): Worker | undefined {
    return this.workers.get(workerId);
  }

  /**
   * Get all workers
   */
  getWorkers(): Worker[] {
    return Array.from(this.workers.values());
  }

  /**
   * Get pool statistics
   */
  getStats(): WorkerPoolStats {
    const workers = Array.from(this.workers.values());

    return {
      totalWorkers: workers.length,
      idleWorkers: workers.filter((w) => w.status === 'idle').length,
      busyWorkers: workers.filter((w) => w.status === 'busy').length,
      totalJobsProcessed: workers.reduce((sum, w) => sum + w.jobsProcessed, 0),
    };
  }

  /**
   * Check if pool is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Manually trigger job processing (useful for testing)
   */
  async processJobs(): Promise<void> {
    this.processNextJobs();
  }
}
