/**
 * Playbook Execution Engine V2 (Sprint S18)
 * Async execution engine with job queue and parallel step execution
 * Enhanced with event streaming (Sprint S21)
 */

import type {
  PlaybookRun,
  PlaybookStepRun,
  PlaybookStep,
  ExecutionState,
  WorkerInfo,
} from '@pravado/types';
import { SupabaseClient } from '@supabase/supabase-js';

import { BillingService } from './billingService';
import { stepHandlers } from './stepHandlers';
import { executionEventBus } from '../events/eventBus';
import { ExecutionDispatcher } from '../queue/executionDispatcher';
import type {
  PlaybookStepJob,
  JobResult,
  JobExecutionContext,
  QueueConfig,
} from '../queue/jobs';
import { DEFAULT_QUEUE_CONFIG } from '../queue/jobs';
import { JobQueue } from '../queue/queue';
import { WorkerPool } from '../queue/worker';


/**
 * Execution engine configuration
 */
export interface EngineConfig extends Partial<QueueConfig> {
  enableWebhooks?: boolean;
  enableLogging?: boolean;
}

/**
 * Execution options for playbook runs
 */
export interface ExecuteOptions {
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  webhookUrl?: string;
  input?: unknown;
}

/**
 * Execution status response
 */
export interface ExecutionStatus {
  run: PlaybookRun;
  stepRuns: PlaybookStepRun[];
  state: ExecutionState;
  progress: {
    total: number;
    completed: number;
    failed: number;
    pending: number;
  };
}

/**
 * Playbook Execution Engine V2
 * Main orchestrator for async playbook execution
 */
export class PlaybookExecutionEngineV2 {
  private queue: JobQueue;
  private workerPool: WorkerPool;
  private dispatcher: ExecutionDispatcher;
  private config: EngineConfig;

  constructor(
    private supabase: SupabaseClient<any>,
    private billingService: BillingService,
    config: EngineConfig = {}
  ) {
    this.config = { ...DEFAULT_QUEUE_CONFIG, ...config };

    // Initialize queue
    this.queue = new JobQueue(this.config);

    // Initialize worker pool
    this.workerPool = new WorkerPool(this.queue, this.config as QueueConfig);

    // Initialize dispatcher
    this.dispatcher = new ExecutionDispatcher(this.queue, this.supabase);

    // Register job handler
    this.queue.registerHandler('playbook_step', this.handleStepExecution.bind(this));
  }

  /**
   * Start the execution engine
   */
  start(): void {
    this.workerPool.start();
    console.log('[ExecutionEngineV2] Started');
  }

  /**
   * Stop the execution engine
   */
  async stop(): Promise<void> {
    await this.workerPool.stop();
    console.log('[ExecutionEngineV2] Stopped');
  }

  /**
   * Execute a playbook asynchronously
   */
  async executePlaybook(
    playbookId: string,
    orgId: string,
    userId: string,
    options: ExecuteOptions = {}
  ): Promise<string> {
    const { priority = 'medium', webhookUrl, input = {} } = options;

    // Fetch playbook definition
    const { data: playbook, error: playbookError } = await this.supabase
      .from('playbooks')
      .select('*')
      .eq('id', playbookId)
      .eq('org_id', orgId)
      .single();

    if (playbookError || !playbook) {
      throw new Error(`Playbook not found: ${playbookId}`);
    }

    if (playbook.status !== 'ACTIVE') {
      throw new Error(`Playbook is not active: ${playbook.status}`);
    }

    // Fetch playbook steps
    const { data: steps, error: stepsError } = await this.supabase
      .from('playbook_steps')
      .select('*')
      .eq('playbook_id', playbookId)
      .eq('org_id', orgId)
      .order('position', { ascending: true });

    if (stepsError || !steps || steps.length === 0) {
      throw new Error(`No steps found for playbook: ${playbookId}`);
    }

    // Sprint S29: Enforce billing quota before creating playbook run
    await this.billingService.enforceOrgQuotaOrThrow(orgId, {
      playbookRunsToConsume: 1,
    });

    // Create playbook run
    const { data: run, error: runError } = await this.supabase
      .from('playbook_runs')
      .insert({
        playbook_id: playbookId,
        org_id: orgId,
        status: 'PENDING',
        state: 'queued',
        triggered_by: userId,
        input,
        output: null,
        error: null,
        webhook_url: webhookUrl || null,
      })
      .select()
      .single();

    if (runError || !run) {
      throw new Error(`Failed to create playbook run: ${runError?.message}`);
    }

    // Create step runs for all steps
    const stepRunInserts = steps.map((step) => ({
      run_id: run.id,
      playbook_id: playbookId,
      org_id: orgId,
      step_id: step.id,
      step_key: step.key,
      status: 'PENDING',
      state: 'queued',
      input: step.config.input || input,
      output: null,
      error: null,
      attempt: 0,
      max_attempts: 3,
      logs: [],
    }));

    const { error: stepRunsError } = await this.supabase
      .from('playbook_step_runs')
      .insert(stepRunInserts);

    if (stepRunsError) {
      throw new Error(`Failed to create step runs: ${stepRunsError.message}`);
    }

    // Dispatch for execution
    await this.dispatcher.dispatchPlaybookRun(run.id, { priority, webhookUrl });

    // Update run state to running
    await this.supabase
      .from('playbook_runs')
      .update({
        status: 'RUNNING',
        state: 'running',
        started_at: new Date().toISOString(),
      })
      .eq('id', run.id);

    // Update billing usage counters (S28 - best effort, non-blocking)
    this.updateBillingUsage(orgId).catch((error) => {
      console.warn('[ExecutionEngineV2] Failed to update billing usage', { error, orgId });
    });

    return run.id;
  }

  /**
   * Get execution status for a playbook run
   */
  async getExecutionStatus(runId: string): Promise<ExecutionStatus | null> {
    // Fetch run
    const { data: run, error: runError } = await this.supabase
      .from('playbook_runs')
      .select('*')
      .eq('id', runId)
      .single();

    if (runError || !run) {
      return null;
    }

    // Fetch step runs
    const { data: stepRuns, error: stepRunsError } = await this.supabase
      .from('playbook_step_runs')
      .select('*')
      .eq('run_id', runId)
      .order('created_at', { ascending: true });

    if (stepRunsError) {
      throw new Error(`Failed to fetch step runs: ${stepRunsError.message}`);
    }

    const steps = stepRuns || [];
    const total = steps.length;
    const completed = steps.filter((s) => s.state === 'success').length;
    const failed = steps.filter((s) => s.state === 'failed').length;
    const pending = steps.filter((s) =>
      ['queued', 'waiting_for_dependencies', 'running'].includes(s.state || '')
    ).length;

    return {
      run: run as PlaybookRun,
      stepRuns: steps as PlaybookStepRun[],
      state: run.state as ExecutionState,
      progress: {
        total,
        completed,
        failed,
        pending,
      },
    };
  }

  /**
   * Cancel a playbook run
   */
  async cancelExecution(runId: string): Promise<void> {
    await this.dispatcher.cancelPlaybookRun(runId);
  }

  /**
   * Resume a failed or paused execution
   */
  async resumeExecution(runId: string): Promise<void> {
    // Fetch run
    const { data: run, error: runError } = await this.supabase
      .from('playbook_runs')
      .select('*')
      .eq('id', runId)
      .single();

    if (runError || !run) {
      throw new Error(`Playbook run not found: ${runId}`);
    }

    // Reset failed step runs to queued
    const { data: failedSteps, error: failedError } = await this.supabase
      .from('playbook_step_runs')
      .select('*')
      .eq('run_id', runId)
      .eq('state', 'failed');

    if (failedError) {
      throw new Error(`Failed to fetch failed steps: ${failedError.message}`);
    }

    if (!failedSteps || failedSteps.length === 0) {
      // No failed steps to resume
      return;
    }

    // Re-dispatch failed steps
    for (const stepRun of failedSteps) {
      await this.supabase
        .from('playbook_step_runs')
        .update({ state: 'queued', attempt: 0 })
        .eq('id', stepRun.id);

      // Fetch step details
      const { data: step } = await this.supabase
        .from('playbook_steps')
        .select('*')
        .eq('id', stepRun.step_id)
        .single();

      if (step) {
        await this.dispatcher.dispatchStepRun(
          runId,
          stepRun.id,
          step.id,
          step.key,
          run.playbook_id,
          run.org_id,
          stepRun.input,
          {},
          'medium'
        );
      }
    }

    // Update run state
    await this.supabase
      .from('playbook_runs')
      .update({ state: 'running', status: 'RUNNING' })
      .eq('id', runId);
  }

  /**
   * Handle step execution (job handler)
   */
  private async handleStepExecution(
    context: JobExecutionContext
  ): Promise<JobResult> {
    const { job, workerId, logger } = context;
    const { payload } = job as PlaybookStepJob;
    const {
      runId,
      stepRunId,
      stepId,
      stepKey,
      orgId,
      input,
      previousOutputs,
      webhookUrl,
    } = payload;

    logger.info(`Starting execution of step ${stepKey}`);

    try {
      // Update step run state to running
      const workerInfo: WorkerInfo = {
        workerId,
        startedAt: new Date().toISOString(),
      };

      const startedAt = new Date().toISOString();
      await this.supabase
        .from('playbook_step_runs')
        .update({
          state: 'running',
          status: 'RUNNING',
          started_at: startedAt,
          worker_info: workerInfo as any,
        })
        .eq('id', stepRunId);

      // Publish step.updated event (S21)
      executionEventBus.publish({
        type: 'step.updated',
        runId,
        stepKey,
        timestamp: startedAt,
        payload: {
          status: 'RUNNING',
          startedAt,
        },
      });

      // Fetch step details
      const { data: step, error: stepError } = await this.supabase
        .from('playbook_steps')
        .select('*')
        .eq('id', stepId)
        .single();

      if (stepError || !step) {
        throw new Error(`Step not found: ${stepId}`);
      }

      // Get the appropriate step handler
      const handler = stepHandlers[step.type as keyof typeof stepHandlers];
      if (!handler) {
        throw new Error(`No handler found for step type: ${step.type}`);
      }

      // Execute the step
      logger.info(`Executing ${step.type} step with handler`);

      const output = await handler.execute({
        orgId,
        runId,
        stepRun: { id: stepRunId, step_key: stepKey } as unknown as PlaybookStepRun,
        step: step as unknown as PlaybookStep,
        input,
        previousOutputs,
      });

      logger.info(`Step execution completed successfully`);

      // Update step run with success
      workerInfo.finishedAt = new Date().toISOString();

      const logs = logger.getLogs().map((log) => log.message);
      const completedAt = new Date().toISOString();

      await this.supabase
        .from('playbook_step_runs')
        .update({
          state: 'success',
          status: 'SUCCEEDED',
          output,
          completed_at: completedAt,
          worker_info: workerInfo as any,
          logs,
        })
        .eq('id', stepRunId);

      // Publish step.completed event (S21)
      executionEventBus.publish({
        type: 'step.completed',
        runId,
        stepKey,
        timestamp: completedAt,
        payload: {
          status: 'SUCCESS',
          completedAt,
          result: output,
        },
      });

      // Dispatch dependent steps
      await this.dispatcher.dispatchDependentSteps(runId, stepKey, output);

      // Check if playbook run is complete
      await this.checkAndCompleteRun(runId);

      // Send webhook if configured
      if (webhookUrl && this.config.enableWebhooks) {
        await this.sendWebhook(webhookUrl, {
          type: 'step.completed',
          runId,
          stepKey,
          output,
        });
      }

      return {
        jobId: job.id,
        status: 'success',
        output,
        executionTimeMs: 0, // Will be set by queue
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Step execution failed', err);

      // Update step run with failure
      const workerInfo: WorkerInfo = {
        workerId,
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
      };

      const logs = logger.getLogs().map((log) => log.message);
      const failedAt = new Date().toISOString();

      await this.supabase
        .from('playbook_step_runs')
        .update({
          state: 'failed',
          status: 'FAILED',
          error: { message: err.message, stack: err.stack } as any,
          completed_at: failedAt,
          worker_info: workerInfo as any,
          logs,
        })
        .eq('id', stepRunId);

      // Publish step.failed event (S21)
      executionEventBus.publish({
        type: 'step.failed',
        runId,
        stepKey,
        timestamp: failedAt,
        payload: {
          status: 'FAILED',
          error: err.message,
          failedAt,
          attempt: 1,
          willRetry: false,
        },
      });

      // Check if playbook run should be marked as failed
      await this.checkAndFailRun(runId);

      // Send webhook if configured
      if (webhookUrl && this.config.enableWebhooks) {
        await this.sendWebhook(webhookUrl, {
          type: 'step.failed',
          runId,
          stepKey,
          error: { message: err.message },
        });
      }

      return {
        jobId: job.id,
        status: 'failure',
        error: {
          message: err.message,
          stack: err.stack,
        },
        executionTimeMs: 0, // Will be set by queue
      };
    }
  }

  /**
   * Check if playbook run is complete and update status
   */
  private async checkAndCompleteRun(runId: string): Promise<void> {
    const { data: stepRuns, error } = await this.supabase
      .from('playbook_step_runs')
      .select('state')
      .eq('run_id', runId);

    if (error || !stepRuns) {
      return;
    }

    const allCompleted = stepRuns.every((sr) =>
      ['success', 'failed', 'skipped', 'canceled'].includes(sr.state || '')
    );

    const anyFailed = stepRuns.some((sr) => sr.state === 'failed');

    if (allCompleted) {
      if (anyFailed) {
        // Some steps failed
        await this.supabase
          .from('playbook_runs')
          .update({
            state: 'failed',
            status: 'FAILED',
            completed_at: new Date().toISOString(),
          })
          .eq('id', runId);
      } else {
        // All steps succeeded
        const completedAt = new Date().toISOString();
        await this.supabase
          .from('playbook_runs')
          .update({
            state: 'success',
            status: 'SUCCEEDED',
            completed_at: completedAt,
          })
          .eq('id', runId);

        // Publish run.completed event (S21)
        const successCount = stepRuns.filter((sr) => sr.state === 'success').length;
        executionEventBus.publish({
          type: 'run.completed',
          runId,
          timestamp: completedAt,
          payload: {
            status: 'COMPLETED',
            completedAt,
            totalSteps: stepRuns.length,
            successfulSteps: successCount,
          },
        });

        // Send completion webhook
        const { data: run } = await this.supabase
          .from('playbook_runs')
          .select('webhook_url, output')
          .eq('id', runId)
          .single();

        if (run?.webhook_url && this.config.enableWebhooks) {
          await this.sendWebhook(run.webhook_url, {
            type: 'run.completed',
            runId,
            output: run.output,
          });
        }
      }
    }
  }

  /**
   * Check if playbook run should be marked as failed
   */
  private async checkAndFailRun(runId: string): Promise<void> {
    const { data: stepRuns, error } = await this.supabase
      .from('playbook_step_runs')
      .select('state')
      .eq('run_id', runId);

    if (error || !stepRuns) {
      return;
    }

    // If any critical step failed and has no more retries, fail the run
    const criticalFailures = stepRuns.filter(
      (sr) => sr.state === 'failed'
    ).length;

    if (criticalFailures > 0) {
      // Check if there are any pending steps
      const hasPendingSteps = stepRuns.some((sr) =>
        ['queued', 'running', 'waiting_for_dependencies'].includes(sr.state || '')
      );

      if (!hasPendingSteps) {
        // No pending steps, mark as failed
        const failedAt = new Date().toISOString();
        await this.supabase
          .from('playbook_runs')
          .update({
            state: 'failed',
            status: 'FAILED',
            completed_at: failedAt,
            error: { message: 'One or more steps failed' } as any,
          })
          .eq('id', runId);

        // Publish run.failed event (S21)
        executionEventBus.publish({
          type: 'run.failed',
          runId,
          timestamp: failedAt,
          payload: {
            status: 'FAILED',
            error: 'One or more steps failed',
            failedAt,
          },
        });

        // Send failure webhook
        const { data: run } = await this.supabase
          .from('playbook_runs')
          .select('webhook_url')
          .eq('id', runId)
          .single();

        if (run?.webhook_url && this.config.enableWebhooks) {
          await this.sendWebhook(run.webhook_url, {
            type: 'run.failed',
            runId,
            error: { message: 'One or more steps failed' },
          });
        }
      }
    }
  }

  /**
   * Send webhook notification
   */
  private async sendWebhook(url: string, payload: unknown): Promise<void> {
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('[ExecutionEngineV2] Webhook failed:', error);
      // Don't throw - webhook failures shouldn't fail execution
    }
  }

  /**
   * Get queue statistics
   */
  getQueueStats() {
    return this.queue.getStats();
  }

  /**
   * Get worker pool statistics
   */
  getWorkerStats() {
    return this.workerPool.getStats();
  }

  /**
   * Update billing usage counters (S28 - best effort)
   */
  private async updateBillingUsage(orgId: string): Promise<void> {
    try {
      // Calculate current billing period (first day of month to first day of next month)
      const now = new Date();
      const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

      // Fetch existing usage record for current period
      const { data: existingUsage } = await this.supabase
        .from('org_billing_usage_monthly')
        .select('*')
        .eq('org_id', orgId)
        .eq('period_start', periodStart.toISOString())
        .eq('period_end', periodEnd.toISOString())
        .single();

      if (existingUsage) {
        // Update existing record
        await this.supabase
          .from('org_billing_usage_monthly')
          .update({
            playbook_runs: existingUsage.playbook_runs + 1,
            last_calculated_at: new Date().toISOString(),
          })
          .eq('id', existingUsage.id);
      } else {
        // Create new usage record
        await this.supabase.from('org_billing_usage_monthly').insert({
          org_id: orgId,
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          tokens_used: 0,
          playbook_runs: 1,
          seats: 0,
          last_calculated_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      // Best effort - don't fail the execution if billing update fails
      console.warn('[ExecutionEngineV2] Failed to update billing usage', { error, orgId });
    }
  }
}
