/**
 * Execution Dispatcher (Sprint S18)
 * Orchestrates playbook execution by dispatching steps to the job queue
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import type { PlaybookStepJob, JobPriority } from './jobs';
import type { JobQueue } from './queue';

/**
 * Dispatch options for playbook execution
 */
export interface DispatchOptions {
  priority?: JobPriority;
  webhookUrl?: string;
}

/**
 * Execution dispatcher manages dispatching playbook steps to the queue
 */
export class ExecutionDispatcher {
  constructor(
    private queue: JobQueue,
    private supabase: SupabaseClient<any>
  ) {}

  /**
   * Dispatch a playbook run for execution
   * Creates step run jobs and enqueues them
   */
  async dispatchPlaybookRun(
    runId: string,
    options: DispatchOptions = {}
  ): Promise<void> {
    const { priority = 'medium', webhookUrl } = options;

    // Fetch the playbook run
    const { data: run, error: runError } = await this.supabase
      .from('playbook_runs')
      .select('*')
      .eq('id', runId)
      .single();

    if (runError || !run) {
      throw new Error(`Playbook run not found: ${runId}`);
    }

    // Fetch the playbook steps
    const { data: steps, error: stepsError } = await this.supabase
      .from('playbook_steps')
      .select('*')
      .eq('playbook_id', run.playbook_id)
      .order('position', { ascending: true });

    if (stepsError || !steps || steps.length === 0) {
      throw new Error(`No steps found for playbook: ${run.playbook_id}`);
    }

    // Fetch step runs for this execution
    const { data: stepRuns, error: stepRunsError } = await this.supabase
      .from('playbook_step_runs')
      .select('*')
      .eq('run_id', runId);

    if (stepRunsError) {
      throw new Error(`Failed to fetch step runs: ${stepRunsError.message}`);
    }

    // Create a map of step runs by step_id
    const stepRunMap = new Map(
      (stepRuns || []).map((sr) => [sr.step_id, sr])
    );

    // Build dependency graph
    const stepDependencies = this.buildDependencyGraph(steps);

    // Dispatch initial steps (those with no dependencies)
    const initialSteps = steps.filter((step) => {
      const deps = stepDependencies.get(step.id) || [];
      return deps.length === 0;
    });

    for (const step of initialSteps) {
      const stepRun = stepRunMap.get(step.id);
      if (!stepRun) continue;

      await this.dispatchStepRun(
        runId,
        stepRun.id,
        step.id,
        step.key,
        run.playbook_id,
        run.org_id,
        stepRun.input,
        {},
        priority,
        webhookUrl
      );
    }
  }

  /**
   * Dispatch a single step run to the queue
   */
  async dispatchStepRun(
    runId: string,
    stepRunId: string,
    stepId: string,
    stepKey: string,
    playbookId: string,
    orgId: string,
    input: unknown,
    previousOutputs: Record<string, unknown>,
    priority: JobPriority = 'medium',
    webhookUrl?: string
  ): Promise<void> {
    const job: PlaybookStepJob = {
      id: `job-${stepRunId}`,
      type: 'playbook_step',
      priority,
      status: 'queued',
      createdAt: new Date().toISOString(),
      attempt: 0,
      maxAttempts: 3,
      payload: {
        runId,
        stepRunId,
        stepId,
        stepKey,
        playbookId,
        orgId,
        input,
        previousOutputs,
        webhookUrl,
      },
    };

    await this.queue.enqueue(job);

    // Update step run state to 'queued'
    await this.supabase
      .from('playbook_step_runs')
      .update({ state: 'queued' })
      .eq('id', stepRunId);
  }

  /**
   * Check and dispatch dependent steps after a step completes
   */
  async dispatchDependentSteps(
    runId: string,
    completedStepKey: string,
    output: unknown
  ): Promise<void> {
    // Fetch the playbook run
    const { data: run, error: runError } = await this.supabase
      .from('playbook_runs')
      .select('*')
      .eq('id', runId)
      .single();

    if (runError || !run) {
      throw new Error(`Playbook run not found: ${runId}`);
    }

    // Fetch all steps for this playbook
    const { data: steps, error: stepsError } = await this.supabase
      .from('playbook_steps')
      .select('*')
      .eq('playbook_id', run.playbook_id);

    if (stepsError || !steps) {
      throw new Error(`Failed to fetch playbook steps`);
    }

    // Build dependency graph
    const stepDependencies = this.buildDependencyGraph(steps);

    // Find steps that depend on the completed step
    const dependentSteps = steps.filter((step) => {
      const deps = stepDependencies.get(step.id) || [];
      return deps.includes(completedStepKey);
    });

    // Fetch all step runs for this execution
    const { data: stepRuns, error: stepRunsError } = await this.supabase
      .from('playbook_step_runs')
      .select('*')
      .eq('run_id', runId);

    if (stepRunsError || !stepRuns) {
      return;
    }

    const stepRunMap = new Map(stepRuns.map((sr) => [sr.step_key, sr]));

    // Collect all completed outputs
    const previousOutputs: Record<string, unknown> = {};
    for (const sr of stepRuns) {
      if (sr.status === 'SUCCEEDED' && sr.output) {
        previousOutputs[sr.step_key] = sr.output;
      }
    }

    // Add the newly completed output
    previousOutputs[completedStepKey] = output;

    // Check each dependent step
    for (const step of dependentSteps) {
      const stepRun = stepRunMap.get(step.key);
      if (!stepRun) continue;

      // Check if all dependencies are satisfied
      const deps = stepDependencies.get(step.id) || [];
      const allDepsCompleted = deps.every((depKey) => {
        const depStepRun = stepRunMap.get(depKey);
        return depStepRun?.status === 'SUCCEEDED';
      });

      if (allDepsCompleted && stepRun.state === 'waiting_for_dependencies') {
        // Dispatch this step
        await this.dispatchStepRun(
          runId,
          stepRun.id,
          step.id,
          step.key,
          run.playbook_id,
          run.org_id,
          stepRun.input,
          previousOutputs,
          'medium'
        );

        // Update state from waiting_for_dependencies to queued
        await this.supabase
          .from('playbook_step_runs')
          .update({ state: 'queued' })
          .eq('id', stepRun.id);
      }
    }
  }

  /**
   * Build dependency graph from steps
   * Returns a map of step_id -> array of dependent step keys
   */
  private buildDependencyGraph(
    steps: Array<{
      id: string;
      key: string;
      next_step_key: string | null;
      config: Record<string, unknown>;
    }>
  ): Map<string, string[]> {
    const dependencies = new Map<string, string[]>();

    for (const step of steps) {
      const stepDeps: string[] = [];

      // Check for explicit dependencies in config
      const config = step.config as any;
      if (config.dependencies && Array.isArray(config.dependencies)) {
        stepDeps.push(...config.dependencies);
      }

      // Check for input references to other steps
      if (config.input && typeof config.input === 'string') {
        const matches = config.input.match(/\{\{steps\.([^}]+)\}\}/g);
        if (matches) {
          for (const match of matches) {
            const stepKey = match.replace(/\{\{steps\.([^}]+)\}\}/, '$1').split('.')[0];
            if (stepKey && !stepDeps.includes(stepKey)) {
              stepDeps.push(stepKey);
            }
          }
        }
      }

      dependencies.set(step.id, stepDeps);
    }

    return dependencies;
  }

  /**
   * Cancel a playbook run and all its queued/running jobs
   */
  async cancelPlaybookRun(runId: string): Promise<void> {
    // Fetch all step runs for this run
    const { data: stepRuns, error } = await this.supabase
      .from('playbook_step_runs')
      .select('id')
      .eq('run_id', runId)
      .in('state', ['queued', 'running', 'waiting_for_dependencies']);

    if (error || !stepRuns) {
      return;
    }

    // Cancel all jobs for these step runs
    for (const stepRun of stepRuns) {
      const jobId = `job-${stepRun.id}`;
      this.queue.cancelJob(jobId);

      // Update step run state
      await this.supabase
        .from('playbook_step_runs')
        .update({ state: 'canceled' })
        .eq('id', stepRun.id);
    }

    // Update run state
    await this.supabase
      .from('playbook_runs')
      .update({ state: 'canceled', completed_at: new Date().toISOString() })
      .eq('id', runId);
  }
}
