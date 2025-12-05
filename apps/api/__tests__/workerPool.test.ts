/**
 * Worker Pool Tests (Sprint S18)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JobQueue } from '../src/queue/queue';
import { WorkerPool } from '../src/queue/worker';
import type { PlaybookStepJob } from '../src/queue/jobs';
import { DEFAULT_QUEUE_CONFIG } from '../src/queue/jobs';

describe('WorkerPool', () => {
  let queue: JobQueue;
  let workerPool: WorkerPool;

  beforeEach(() => {
    queue = new JobQueue({
      ...DEFAULT_QUEUE_CONFIG,
      maxConcurrency: 2,
      pollIntervalMs: 50,
    });

    workerPool = new WorkerPool(queue, {
      ...DEFAULT_QUEUE_CONFIG,
      maxConcurrency: 2,
      pollIntervalMs: 50,
    });

    // Register a simple handler
    queue.registerHandler('playbook_step', async (context) => {
      context.logger.info('Processing job');
      await new Promise((resolve) => setTimeout(resolve, 10)); // Simulate work
      return {
        jobId: context.job.id,
        status: 'success',
        output: { success: true },
        executionTimeMs: 0,
      };
    });
  });

  afterEach(async () => {
    await workerPool.stop();
    queue.stop();
  });

  describe('Worker Management', () => {
    it('should initialize correct number of workers', () => {
      const workers = workerPool.getWorkers();
      expect(workers).toHaveLength(2);

      for (const worker of workers) {
        expect(worker.status).toBe('idle');
        expect(worker.jobsProcessed).toBe(0);
      }
    });

    it('should start and stop the worker pool', async () => {
      expect(workerPool.isActive()).toBe(false);

      workerPool.start();
      expect(workerPool.isActive()).toBe(true);

      await workerPool.stop();
      expect(workerPool.isActive()).toBe(false);
    });

    it('should track worker statistics', async () => {
      const job: PlaybookStepJob = {
        id: 'test-job-1',
        type: 'playbook_step',
        priority: 'medium',
        status: 'queued',
        createdAt: new Date().toISOString(),
        attempt: 0,
        maxAttempts: 3,
        payload: {
          runId: 'run-1',
          stepRunId: 'step-run-1',
          stepId: 'step-1',
          stepKey: 'test-step',
          playbookId: 'playbook-1',
          orgId: 'org-1',
          input: {},
          previousOutputs: {},
        },
      };

      await queue.enqueue(job);
      workerPool.start();

      // Wait for job to be processed
      await new Promise((resolve) => setTimeout(resolve, 200));

      const stats = workerPool.getStats();
      expect(stats.totalWorkers).toBe(2);
      expect(stats.totalJobsProcessed).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Job Processing', () => {
    it('should process queued jobs', async () => {
      const jobs: PlaybookStepJob[] = [
        {
          id: 'job-1',
          type: 'playbook_step',
          priority: 'medium',
          status: 'queued',
          createdAt: new Date().toISOString(),
          attempt: 0,
          maxAttempts: 3,
          payload: {
            runId: 'run-1',
            stepRunId: 'step-run-1',
            stepId: 'step-1',
            stepKey: 'test-step-1',
            playbookId: 'playbook-1',
            orgId: 'org-1',
            input: {},
            previousOutputs: {},
          },
        },
        {
          id: 'job-2',
          type: 'playbook_step',
          priority: 'medium',
          status: 'queued',
          createdAt: new Date().toISOString(),
          attempt: 0,
          maxAttempts: 3,
          payload: {
            runId: 'run-1',
            stepRunId: 'step-run-2',
            stepId: 'step-2',
            stepKey: 'test-step-2',
            playbookId: 'playbook-1',
            orgId: 'org-1',
            input: {},
            previousOutputs: {},
          },
        },
      ];

      for (const job of jobs) {
        await queue.enqueue(job);
      }

      workerPool.start();

      // Wait for jobs to be processed
      await new Promise((resolve) => setTimeout(resolve, 300));

      const job1 = queue.getJob('job-1');
      const job2 = queue.getJob('job-2');

      expect(job1?.status).toBe('completed');
      expect(job2?.status).toBe('completed');
    });

    it('should handle concurrent job processing', async () => {
      const jobs: PlaybookStepJob[] = Array.from({ length: 5 }, (_, i) => ({
        id: `job-${i}`,
        type: 'playbook_step' as const,
        priority: 'medium' as const,
        status: 'queued' as const,
        createdAt: new Date().toISOString(),
        attempt: 0,
        maxAttempts: 3,
        payload: {
          runId: 'run-1',
          stepRunId: `step-run-${i}`,
          stepId: `step-${i}`,
          stepKey: `test-step-${i}`,
          playbookId: 'playbook-1',
          orgId: 'org-1',
          input: {},
          previousOutputs: {},
        },
      }));

      for (const job of jobs) {
        await queue.enqueue(job);
      }

      workerPool.start();

      // Wait for all jobs to be processed
      await new Promise((resolve) => setTimeout(resolve, 500));

      const stats = workerPool.getStats();
      expect(stats.totalJobsProcessed).toBe(5);

      // All jobs should be completed
      for (let i = 0; i < 5; i++) {
        const job = queue.getJob(`job-${i}`);
        expect(job?.status).toBe('completed');
      }
    });

    it('should retry failed jobs', async () => {
      let attemptCount = 0;

      queue.registerHandler('playbook_step', async (context) => {
        attemptCount++;
        if (attemptCount < 2) {
          throw new Error('Simulated failure');
        }
        return {
          jobId: context.job.id,
          status: 'success',
          output: { success: true },
          executionTimeMs: 0,
        };
      });

      const job: PlaybookStepJob = {
        id: 'retry-job',
        type: 'playbook_step',
        priority: 'medium',
        status: 'queued',
        createdAt: new Date().toISOString(),
        attempt: 0,
        maxAttempts: 3,
        payload: {
          runId: 'run-1',
          stepRunId: 'step-run-1',
          stepId: 'step-1',
          stepKey: 'test-step',
          playbookId: 'playbook-1',
          orgId: 'org-1',
          input: {},
          previousOutputs: {},
        },
      };

      await queue.enqueue(job);
      workerPool.start();

      // Wait for retries (retryDelayMs is 1000ms, so need to wait at least that long)
      await new Promise((resolve) => setTimeout(resolve, 1200));

      expect(attemptCount).toBeGreaterThanOrEqual(2);

      const retrieved = queue.getJob('retry-job');
      expect(retrieved?.status).toBe('completed');
    });
  });

  describe('Worker Statistics', () => {
    it('should provide accurate pool statistics', async () => {
      const job: PlaybookStepJob = {
        id: 'stats-job',
        type: 'playbook_step',
        priority: 'medium',
        status: 'queued',
        createdAt: new Date().toISOString(),
        attempt: 0,
        maxAttempts: 3,
        payload: {
          runId: 'run-1',
          stepRunId: 'step-run-1',
          stepId: 'step-1',
          stepKey: 'test-step',
          playbookId: 'playbook-1',
          orgId: 'org-1',
          input: {},
          previousOutputs: {},
        },
      };

      await queue.enqueue(job);

      const statsBefore = workerPool.getStats();
      expect(statsBefore.idleWorkers).toBe(2);
      expect(statsBefore.busyWorkers).toBe(0);

      workerPool.start();

      // Wait a bit for processing
      await new Promise((resolve) => setTimeout(resolve, 200));

      const statsAfter = workerPool.getStats();
      expect(statsAfter.totalJobsProcessed).toBeGreaterThanOrEqual(1);
    });
  });
});
