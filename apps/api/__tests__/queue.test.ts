/**
 * Job Queue Tests (Sprint S18)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { JobQueue } from '../src/queue/queue';
import type { PlaybookStepJob, JobResult } from '../src/queue/jobs';

describe('JobQueue', () => {
  let queue: JobQueue;

  beforeEach(() => {
    queue = new JobQueue({
      maxConcurrency: 2,
      defaultMaxAttempts: 3,
      retryDelayMs: 100,
      retryBackoffMultiplier: 2,
      maxRetryDelayMs: 1000,
      pollIntervalMs: 100,
      staleJobTimeoutMs: 5000,
    });
  });

  describe('Job Management', () => {
    it('should enqueue a job', async () => {
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

      const retrieved = queue.getJob('test-job-1');
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('test-job-1');
      expect(retrieved?.status).toBe('queued');
    });

    it('should get next job by priority', async () => {
      const lowPriorityJob: PlaybookStepJob = {
        id: 'low-job',
        type: 'playbook_step',
        priority: 'low',
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

      const highPriorityJob: PlaybookStepJob = {
        ...lowPriorityJob,
        id: 'high-job',
        priority: 'high',
      };

      await queue.enqueue(lowPriorityJob);
      await queue.enqueue(highPriorityJob);

      const next = queue.getNextJob();
      expect(next?.id).toBe('high-job');
    });

    it('should update job status', async () => {
      const job: PlaybookStepJob = {
        id: 'test-job',
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
      queue.updateJobStatus('test-job', 'running');

      const retrieved = queue.getJob('test-job');
      expect(retrieved?.status).toBe('running');
      expect(retrieved?.startedAt).toBeDefined();
    });

    it('should fail a job with error', async () => {
      const job: PlaybookStepJob = {
        id: 'test-job',
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
      queue.failJob('test-job', new Error('Test error'));

      const retrieved = queue.getJob('test-job');
      expect(retrieved?.status).toBe('failed');
      expect(retrieved?.error).toBeDefined();
      expect(retrieved?.error?.message).toBe('Test error');
    });

    it('should retry a failed job', async () => {
      const job: PlaybookStepJob = {
        id: 'test-job',
        type: 'playbook_step',
        priority: 'medium',
        status: 'failed',
        createdAt: new Date().toISOString(),
        attempt: 1,
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
      const retried = await queue.retryJob('test-job');

      expect(retried).toBe(true);

      const retrieved = queue.getJob('test-job');
      expect(retrieved?.attempt).toBe(2);
      expect(retrieved?.status).toBe('retrying');
      expect(retrieved?.scheduledAt).toBeDefined();
    });

    it('should not retry beyond max attempts', async () => {
      const job: PlaybookStepJob = {
        id: 'test-job',
        type: 'playbook_step',
        priority: 'medium',
        status: 'failed',
        createdAt: new Date().toISOString(),
        attempt: 3,
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
      const retried = await queue.retryJob('test-job');

      expect(retried).toBe(false);
    });

    it('should cancel a queued job', async () => {
      const job: PlaybookStepJob = {
        id: 'test-job',
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
      const cancelled = queue.cancelJob('test-job');

      expect(cancelled).toBe(true);

      const retrieved = queue.getJob('test-job');
      expect(retrieved?.status).toBe('canceled');
    });
  });

  describe('Job Execution', () => {
    it('should execute a job with handler', async () => {
      const job: PlaybookStepJob = {
        id: 'test-job',
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
          input: { test: 'data' },
          previousOutputs: {},
        },
      };

      queue.registerHandler('playbook_step', async (context) => {
        context.logger.info('Executing test job');
        return {
          jobId: context.job.id,
          status: 'success',
          output: { result: 'success' },
          executionTimeMs: 0,
        };
      });

      await queue.enqueue(job);
      const result = await queue.executeJob(job, 'worker-1');

      expect(result.status).toBe('success');
      expect(result.output).toEqual({ result: 'success' });
      expect(result.logs).toBeDefined();
    });

    it('should handle job execution errors', async () => {
      const job: PlaybookStepJob = {
        id: 'test-job',
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

      queue.registerHandler('playbook_step', async () => {
        throw new Error('Execution failed');
      });

      await queue.enqueue(job);
      const result = await queue.executeJob(job, 'worker-1');

      expect(result.status).toBe('failure');
      expect(result.error?.message).toBe('Execution failed');

      const retrieved = queue.getJob('test-job');
      expect(retrieved?.status).toBe('failed');
    });
  });

  describe('Queue Statistics', () => {
    it('should return correct queue stats', async () => {
      const jobs: PlaybookStepJob[] = [
        {
          id: 'queued-1',
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
        },
        {
          id: 'running-1',
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

      queue.updateJobStatus('running-1', 'running');
      queue.updateJobStatus('queued-1', 'completed');

      const stats = queue.getStats();

      expect(stats.queued).toBe(0);
      expect(stats.running).toBe(1);
      expect(stats.completed).toBe(1);
    });
  });

  describe('Queue Lifecycle', () => {
    it('should start and stop the queue', () => {
      expect(queue.isActive()).toBe(false);

      queue.start();
      expect(queue.isActive()).toBe(true);

      queue.stop();
      expect(queue.isActive()).toBe(false);
    });
  });
});
