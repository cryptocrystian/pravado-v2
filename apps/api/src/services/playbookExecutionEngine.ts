/**
 * Playbook Execution Engine (Sprint S7)
 * Core runtime for executing AI playbooks step-by-step
 */

import type {
  PlaybookRun,
  PlaybookStepRun,
  PlaybookStep,
  PlaybookRunWithStepsDTO,
  PlaybookDefinitionDTO,
  StepExecutionContext,
} from '@pravado/types';
import type { SupabaseClient } from '@supabase/supabase-js';

import { PlaybookService } from './playbookService';

export class PlaybookExecutionEngine {
  private playbookService: PlaybookService;

  constructor(private supabase: SupabaseClient) {
    this.playbookService = new PlaybookService(supabase);
  }

  /**
   * Start a new playbook run
   * Creates the run record and transitions to RUNNING
   */
  async startPlaybookRun(
    orgId: string,
    playbookId: string,
    input: unknown,
    userId?: string
  ): Promise<PlaybookRunWithStepsDTO> {
    // Load playbook definition
    const definition = await this.playbookService.getPlaybookById(orgId, playbookId);
    if (!definition) {
      throw new Error('Playbook not found');
    }

    // Create run record with PENDING status
    const { data: run, error: runError } = await this.supabase
      .from('playbook_runs')
      .insert({
        playbook_id: playbookId,
        org_id: orgId,
        status: 'PENDING',
        triggered_by: userId || null,
        input,
      })
      .select()
      .single();

    if (runError || !run) {
      throw new Error(`Failed to create playbook run: ${runError?.message}`);
    }

    // Execute the playbook
    return this.runPlaybook(orgId, run.id);
  }

  /**
   * Execute a playbook run
   * Main execution loop - runs steps in sequence
   */
  async runPlaybook(orgId: string, runId: string): Promise<PlaybookRunWithStepsDTO> {
    // Load run
    const { data: run, error: runError } = await this.supabase
      .from('playbook_runs')
      .select('*')
      .eq('id', runId)
      .eq('org_id', orgId)
      .single();

    if (runError || !run) {
      throw new Error('Playbook run not found');
    }

    // Load playbook definition
    const definition = await this.playbookService.getPlaybookById(orgId, run.playbook_id);
    if (!definition) {
      throw new Error('Playbook not found');
    }

    // Update run to RUNNING
    await this.updateRunStatus(runId, 'RUNNING', { started_at: new Date().toISOString() });

    try {
      // Execute steps
      const stepRuns = await this.executeSteps(orgId, runId, definition, run.input);

      // Mark run as SUCCEEDED
      await this.updateRunStatus(runId, 'SUCCEEDED', {
        completed_at: new Date().toISOString(),
        output: this.collectFinalOutput(stepRuns),
      });

      return this.getRunWithSteps(orgId, runId);
    } catch (error: any) {
      // Mark run as FAILED
      await this.updateRunStatus(runId, 'FAILED', {
        completed_at: new Date().toISOString(),
        error: {
          message: error.message,
          stack: error.stack,
        },
      });

      return this.getRunWithSteps(orgId, runId);
    }
  }

  /**
   * Execute all steps in sequence
   */
  private async executeSteps(
    orgId: string,
    runId: string,
    definition: PlaybookDefinitionDTO,
    initialInput: unknown
  ): Promise<PlaybookStepRun[]> {
    const { playbook, steps } = definition;
    const stepRuns: PlaybookStepRun[] = [];
    const previousOutputs: Record<string, unknown> = {};

    // Sort steps by position
    const sortedSteps = [...steps].sort((a, b) => a.position - b.position);

    // Starting step is the first one (position 0)
    let currentStep: PlaybookStep | null = sortedSteps[0] || null;
    let stepInput: unknown = initialInput;

    while (currentStep) {
      // Execute step
      const stepRun = await this.executeStep(
        orgId,
        runId,
        playbook.id,
        currentStep,
        stepInput,
        previousOutputs
      );

      stepRuns.push(stepRun);

      // Check step status
      if (stepRun.status === 'FAILED') {
        throw new Error(`Step "${currentStep.key}" failed: ${JSON.stringify(stepRun.error)}`);
      }

      if (stepRun.status === 'SKIPPED') {
        // If skipped, stop execution
        break;
      }

      // Store output for future steps
      previousOutputs[currentStep.key] = stepRun.output;

      // Determine next step
      const nextStepKey = await this.determineNextStep(currentStep, stepRun.output);

      if (!nextStepKey) {
        // No more steps
        break;
      }

      // Find next step
      currentStep = sortedSteps.find((s) => s.key === nextStepKey) || null;

      if (!currentStep) {
        throw new Error(`Next step "${nextStepKey}" not found`);
      }

      // Next step input is previous step output (can be overridden by step config)
      stepInput = stepRun.output;
    }

    return stepRuns;
  }

  /**
   * Execute a single step
   */
  private async executeStep(
    orgId: string,
    runId: string,
    playbookId: string,
    step: PlaybookStep,
    input: unknown,
    previousOutputs: Record<string, unknown>
  ): Promise<PlaybookStepRun> {
    // Create step run record
    const { data: stepRun, error: stepRunError } = await this.supabase
      .from('playbook_step_runs')
      .insert({
        run_id: runId,
        playbook_id: playbookId,
        org_id: orgId,
        step_id: step.id,
        step_key: step.key,
        status: 'PENDING',
        input,
      })
      .select()
      .single();

    if (stepRunError || !stepRun) {
      throw new Error(`Failed to create step run: ${stepRunError?.message}`);
    }

    // Update to RUNNING
    await this.updateStepRunStatus(stepRun.id, 'RUNNING', {
      started_at: new Date().toISOString(),
    });

    try {
      // Execute based on step type
      const context: StepExecutionContext = {
        orgId,
        runId,
        stepRun: this.mapStepRunFromDb(stepRun),
        step,
        input,
        previousOutputs,
      };

      const output = await this.executeStepByType(context);

      // Update to SUCCEEDED
      await this.updateStepRunStatus(stepRun.id, 'SUCCEEDED', {
        completed_at: new Date().toISOString(),
        output,
      });

      // Fetch and return updated step run
      const { data: updatedStepRun } = await this.supabase
        .from('playbook_step_runs')
        .select('*')
        .eq('id', stepRun.id)
        .single();

      return this.mapStepRunFromDb(updatedStepRun);
    } catch (error: any) {
      // Update to FAILED
      await this.updateStepRunStatus(stepRun.id, 'FAILED', {
        completed_at: new Date().toISOString(),
        error: {
          message: error.message,
          stack: error.stack,
        },
      });

      // Fetch and return updated step run
      const { data: updatedStepRun } = await this.supabase
        .from('playbook_step_runs')
        .select('*')
        .eq('id', stepRun.id)
        .single();

      return this.mapStepRunFromDb(updatedStepRun);
    }
  }

  /**
   * Execute step based on type
   */
  private async executeStepByType(context: StepExecutionContext): Promise<unknown> {
    const { step } = context;

    switch (step.type) {
      case 'AGENT':
        return this.executeAgentStep(context);
      case 'DATA':
        return this.executeDataStep(context);
      case 'BRANCH':
        return this.executeBranchStep(context);
      case 'API':
        return this.executeApiStep(context);
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  /**
   * Execute AGENT step (LLM call)
   */
  private async executeAgentStep(context: StepExecutionContext): Promise<unknown> {
    const { step, input } = context;
    const config = step.config as {
      agentId: string;
      prompt?: string;
      model?: string;
      temperature?: number;
      maxTokens?: number;
      systemMessage?: string;
    };

    // For S7, we'll stub the LLM call
    // In future sprints, this will use the actual LLM router
    const prompt = config.prompt || JSON.stringify(input);
    const model = config.model || 'gpt-4';
    const temperature = config.temperature || 0.7;

    // Stub: Return a placeholder response
    const output = {
      agent: config.agentId,
      model,
      temperature,
      prompt,
      response: `[Stub] This is a simulated response from ${config.agentId}. Input was: ${JSON.stringify(input)}`,
      metadata: {
        executedAt: new Date().toISOString(),
        stubbed: true,
      },
    };

    return output;
  }

  /**
   * Execute DATA step (transformations)
   */
  private async executeDataStep(context: StepExecutionContext): Promise<unknown> {
    const { step, input, previousOutputs } = context;
    const config = step.config as {
      operation: 'pluck' | 'map' | 'merge' | 'filter' | 'transform';
      sourceKey?: string;
      fields?: string[];
      mapping?: Record<string, unknown>;
    };

    // Get source data
    const sourceData = config.sourceKey ? previousOutputs[config.sourceKey] : input;

    switch (config.operation) {
      case 'pluck':
        if (!config.fields || config.fields.length === 0) {
          throw new Error('DATA step with operation "pluck" requires "fields" in config');
        }
        if (typeof sourceData === 'object' && sourceData !== null) {
          const result: Record<string, unknown> = {};
          for (const field of config.fields) {
            result[field] = (sourceData as any)[field];
          }
          return result;
        }
        throw new Error('Cannot pluck from non-object data');

      case 'map':
        if (!config.mapping) {
          throw new Error('DATA step with operation "map" requires "mapping" in config');
        }
        // Simple mapping: replace keys
        if (typeof sourceData === 'object' && sourceData !== null) {
          const result: Record<string, unknown> = {};
          const sourceObj = sourceData as Record<string, unknown>;
          const mapping = config.mapping as Record<string, string>;
          for (const [key, sourceKey] of Object.entries(mapping)) {
            result[key] = sourceObj[sourceKey];
          }
          return result;
        }
        throw new Error('Cannot map non-object data');

      case 'merge':
        // Merge input with previous outputs
        if (typeof sourceData === 'object' && sourceData !== null) {
          if (typeof input === 'object' && input !== null) {
            return {
              ...sourceData,
              ...input,
            };
          }
          return sourceData;
        }
        return input;

      case 'transform':
        // For S7, just pass through
        return sourceData;

      default:
        throw new Error(`Unknown DATA operation: ${config.operation}`);
    }
  }

  /**
   * Execute BRANCH step (conditional logic)
   */
  private async executeBranchStep(context: StepExecutionContext): Promise<unknown> {
    const { step, previousOutputs } = context;
    const config = step.config as {
      sourceKey: string;
      conditions: Array<{
        operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'exists';
        value?: unknown;
        nextStepKey: string;
      }>;
      defaultStepKey?: string;
    };

    const sourceValue = previousOutputs[config.sourceKey];

    // Evaluate conditions
    for (const condition of config.conditions) {
      let matches = false;

      switch (condition.operator) {
        case 'equals':
          matches = sourceValue === condition.value;
          break;
        case 'notEquals':
          matches = sourceValue !== condition.value;
          break;
        case 'contains':
          if (typeof sourceValue === 'string') {
            matches = sourceValue.includes(String(condition.value));
          } else if (Array.isArray(sourceValue)) {
            matches = sourceValue.includes(condition.value);
          }
          break;
        case 'greaterThan':
          matches = Number(sourceValue) > Number(condition.value);
          break;
        case 'lessThan':
          matches = Number(sourceValue) < Number(condition.value);
          break;
        case 'exists':
          matches = sourceValue !== null && sourceValue !== undefined;
          break;
      }

      if (matches) {
        return {
          matched: true,
          condition: condition.operator,
          nextStepKey: condition.nextStepKey,
        };
      }
    }

    // No condition matched
    if (config.defaultStepKey) {
      return {
        matched: false,
        nextStepKey: config.defaultStepKey,
      };
    }

    throw new Error('No branch condition matched and no default step provided');
  }

  /**
   * Execute API step (external API call)
   */
  private async executeApiStep(context: StepExecutionContext): Promise<unknown> {
    const { step, input } = context;
    const config = step.config as {
      method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      url: string;
      headers?: Record<string, string>;
      body?: unknown;
      timeout?: number;
    };

    // For S7, stub the API call
    const output = {
      method: config.method,
      url: config.url,
      headers: config.headers,
      body: config.body || input,
      response: {
        status: 200,
        data: '[Stub] Simulated API response',
        stubbed: true,
      },
      metadata: {
        executedAt: new Date().toISOString(),
      },
    };

    return output;
  }

  /**
   * Determine next step key based on current step and output
   */
  private async determineNextStep(
    currentStep: PlaybookStep,
    stepOutput: unknown
  ): Promise<string | null> {
    // For BRANCH steps, the output contains the nextStepKey
    if (currentStep.type === 'BRANCH' && stepOutput) {
      const branchOutput = stepOutput as { nextStepKey?: string };
      if (branchOutput.nextStepKey) {
        return branchOutput.nextStepKey;
      }
    }

    // For other steps, use nextStepKey from step definition
    return currentStep.nextStepKey;
  }

  /**
   * Collect final output from all step runs
   */
  private collectFinalOutput(stepRuns: PlaybookStepRun[]): unknown {
    // For S7, return outputs of all steps
    const outputs: Record<string, unknown> = {};
    for (const stepRun of stepRuns) {
      outputs[stepRun.stepKey] = stepRun.output;
    }
    return outputs;
  }

  /**
   * Get run with all step runs
   */
  private async getRunWithSteps(orgId: string, runId: string): Promise<PlaybookRunWithStepsDTO> {
    const { data: run, error: runError } = await this.supabase
      .from('playbook_runs')
      .select('*')
      .eq('id', runId)
      .eq('org_id', orgId)
      .single();

    if (runError || !run) {
      throw new Error('Playbook run not found');
    }

    const { data: stepRuns, error: stepRunsError } = await this.supabase
      .from('playbook_step_runs')
      .select('*')
      .eq('run_id', runId)
      .eq('org_id', orgId)
      .order('created_at', { ascending: true });

    if (stepRunsError) {
      throw new Error(`Failed to fetch step runs: ${stepRunsError.message}`);
    }

    return {
      run: this.mapRunFromDb(run),
      steps: (stepRuns || []).map(this.mapStepRunFromDb),
    };
  }

  /**
   * Update run status
   */
  private async updateRunStatus(
    runId: string,
    status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED',
    updates: Record<string, unknown> = {}
  ): Promise<void> {
    await this.supabase
      .from('playbook_runs')
      .update({
        status,
        ...updates,
      })
      .eq('id', runId);
  }

  /**
   * Update step run status
   */
  private async updateStepRunStatus(
    stepRunId: string,
    status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'SKIPPED',
    updates: Record<string, unknown> = {}
  ): Promise<void> {
    await this.supabase
      .from('playbook_step_runs')
      .update({
        status,
        ...updates,
      })
      .eq('id', stepRunId);
  }

  /**
   * Map database row to PlaybookRun
   */
  private mapRunFromDb(row: any): PlaybookRun {
    return {
      id: row.id,
      playbookId: row.playbook_id,
      orgId: row.org_id,
      status: row.status,
      triggeredBy: row.triggered_by,
      input: row.input,
      output: row.output,
      error: row.error,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Map database row to PlaybookStepRun
   */
  private mapStepRunFromDb(row: any): PlaybookStepRun {
    return {
      id: row.id,
      runId: row.run_id,
      playbookId: row.playbook_id,
      orgId: row.org_id,
      stepId: row.step_id,
      stepKey: row.step_key,
      status: row.status,
      input: row.input,
      output: row.output,
      error: row.error,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
