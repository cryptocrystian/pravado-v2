/**
 * Playbook Execution Engine (Sprint S7 + S9 + S10 + S11)
 * Core runtime for executing AI playbooks step-by-step
 * S9: Added multi-agent collaboration and escalation support
 * S10: Added memory system integration (semantic + episodic memory)
 * S11: Added personality system integration
 */

import type {
  PlaybookRun,
  PlaybookStepRun,
  PlaybookStep,
  PlaybookRunWithStepsDTO,
  PlaybookDefinitionDTO,
  StepExecutionContext,
  CollaborationContext,
} from '@pravado/types';
import { LlmRouter, createLogger } from '@pravado/utils'; // S16
import type { SupabaseClient } from '@supabase/supabase-js';

import { CollaborationCoordinator } from './collaborationCoordinator';
// import { ContextAssembler } from './memory/contextAssembler'; // S10: Reserved for future agent handler integration
import { MemoryStore } from './memory/memoryStore';
import { PersonalityStore } from './personality/personalityStore'; // S11
import { PlaybookService } from './playbookService';

const logger = createLogger('playbook-execution-engine');

export class PlaybookExecutionEngine {
  private playbookService: PlaybookService;
  // private contextAssembler: ContextAssembler; // S10 (reserved for future agent handler integration)
  private memoryStore: MemoryStore; // S10
  private personalityStore: PersonalityStore; // S11
  private llmRouter: LlmRouter | null = null; // S16

  constructor(
    private supabase: SupabaseClient,
    llmRouter?: LlmRouter
  ) {
    this.playbookService = new PlaybookService(supabase);
    // this.contextAssembler = new ContextAssembler(supabase, { debugMode: false }); // S10
    this.memoryStore = new MemoryStore(supabase, { debugMode: false }); // S10
    this.personalityStore = new PersonalityStore(supabase, { debugMode: false }); // S11
    this.llmRouter = llmRouter || null; // S16
  }

  /**
   * Start a new playbook run
   * Creates the run record and transitions to RUNNING
   * Sprint S8: Added simulation mode support
   */
  async startPlaybookRun(
    orgId: string,
    playbookId: string,
    input: unknown,
    userId?: string,
    options?: { isSimulation?: boolean }
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
        is_simulation: options?.isSimulation || false,
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
   * S9: Added collaboration coordinator for multi-agent workflows
   * S10: Added memory context assembly
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

    // S9: Initialize collaboration coordinator
    const coordinator = new CollaborationCoordinator({
      initialSharedState: {},
      debugMode: false,
    });

    // S10: Fetch the run object for context assembly
    const { data: runData } = await this.supabase
      .from('playbook_runs')
      .select('*')
      .eq('id', runId)
      .single();

    if (!runData) {
      throw new Error('Run not found');
    }

    const run = this.mapRunFromDb(runData);

    // Sort steps by position
    const sortedSteps = [...steps].sort((a, b) => a.position - b.position);

    // Starting step is the first one (position 0)
    let currentStep: PlaybookStep | null = sortedSteps[0] || null;
    let stepInput: unknown = initialInput;

    while (currentStep) {
      // Execute step with collaboration context
      const stepRun = await this.executeStep(
        orgId,
        runId,
        playbook,
        sortedSteps,
        run,
        currentStep,
        stepInput,
        previousOutputs,
        coordinator // S9: Pass coordinator
      );

      stepRuns.push(stepRun);

      // S9: Persist collaboration context to step run
      await this.persistCollaborationContext(stepRun.id, coordinator.getCollaborationContext());

      // Check step status
      if (stepRun.status === 'FAILED') {
        // S9: Check if human escalation is needed
        if (coordinator.getEscalationLevel() === 'human') {
          throw new Error(
            `Step "${currentStep.key}" requires human intervention: ${JSON.stringify(stepRun.error)}`
          );
        }
        throw new Error(`Step "${currentStep.key}" failed: ${JSON.stringify(stepRun.error)}`);
      }

      if (stepRun.status === 'SKIPPED') {
        // If skipped, stop execution
        break;
      }

      // Store output for future steps
      previousOutputs[currentStep.key] = stepRun.output;

      // S9: Update shared state from step output if provided
      if (stepRun.output && typeof stepRun.output === 'object') {
        const output = stepRun.output as { sharedState?: Record<string, unknown> };
        if (output.sharedState) {
          coordinator.updateSharedState(output.sharedState);
        }
      }

      // S9: Determine next step using coordinator (handles delegation/escalation)
      const nextStepKey = coordinator.determineNextStep(currentStep, stepRun.output);

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
   * S9: Added coordinator parameter for collaboration
   * S10: Added memory context assembly and persistence
   */
  private async executeStep(
    orgId: string,
    runId: string,
    playbook: any, // S10: Full playbook object
    _steps: PlaybookStep[], // S10: All steps for context (reserved for future use)
    _run: PlaybookRun, // S10: Run object for context (reserved for future use)
    step: PlaybookStep,
    input: unknown,
    previousOutputs: Record<string, unknown>,
    _coordinator?: CollaborationCoordinator // S9: Coordinator for collaboration (reserved for future use)
  ): Promise<PlaybookStepRun> {
    // Create step run record
    const { data: stepRun, error: stepRunError } = await this.supabase
      .from('playbook_step_runs')
      .insert({
        run_id: runId,
        playbook_id: playbook.id,
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
      // S10: Assemble context for step execution (reserved for future agent handler integration)
      // Commented out to avoid unused variable warning - will be passed to agent handlers in production
      // const assembledContext = await this.contextAssembler.assembleContextForStep({
      //   orgId, playbook, steps, run, step,
      //   sharedState: coordinator?.getSharedState() || {},
      //   collaborationContext: coordinator?.getCollaborationContext(),
      //   stepInput: input,
      // });

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

      // S10: Save episodic trace after successful execution
      const embedding = await this.generateEmbedding(output);
      await this.memoryStore.saveEpisodicTrace(orgId, runId, step.key, {
        input,
        output,
        stepType: step.type,
        timestamp: new Date().toISOString(),
      }, embedding);

      // S10: Save semantic memory if output indicates it should be captured
      if (output && typeof output === 'object') {
        const outputData = output as any;
        if (outputData.memoryWorthy === true || (step.config as any)?.captureMemory === true) {
          const importance = (outputData.importance as number) || 0.5;
          await this.memoryStore.saveSemanticMemory(
            orgId,
            { stepKey: step.key, output: outputData },
            embedding,
            importance,
            'step',
            null // No TTL for now
          );
        }
      }

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
   * S11: Added personality loading
   * S16: Added LLM router integration
   */
  private async executeAgentStep(context: StepExecutionContext): Promise<unknown> {
    const { step, input, orgId } = context;
    const config = step.config as {
      agentId: string;
      prompt?: string;
      model?: string;
      temperature?: number;
      maxTokens?: number;
      systemMessage?: string;
    };

    // S11: Load personality for this agent
    const personality = await this.personalityStore.getPersonalityForAgent(orgId, config.agentId);

    // S16: Try to use LLM router if available
    if (this.llmRouter) {
      const llmOutput = await this.executeAgentStepWithLLM(context, personality);
      if (llmOutput) {
        return llmOutput;
      }
    }

    // Fallback to stub response
    logger.debug('Using stub agent response as fallback', { agentId: config.agentId });

    const prompt = config.prompt || JSON.stringify(input);
    const model = config.model || 'gpt-4';
    const temperature = config.temperature || 0.7;

    const output = {
      agent: config.agentId,
      model,
      temperature,
      prompt,
      response: `[Stub] This is a simulated response from ${config.agentId}. Input was: ${JSON.stringify(input)}`,
      metadata: {
        executedAt: new Date().toISOString(),
        stubbed: true,
        personality: personality ? {
          id: personality.id,
          slug: personality.slug,
          name: personality.name,
          tone: personality.configuration.tone,
          style: personality.configuration.style,
        } : null,
      },
    };

    return output;
  }

  /**
   * Execute AGENT step with LLM router (S16)
   */
  private async executeAgentStepWithLLM(
    context: StepExecutionContext,
    personality: any
  ): Promise<unknown | null> {
    if (!this.llmRouter) {
      return null;
    }

    const { step, input } = context;
    const config = step.config as {
      agentId: string;
      prompt?: string;
      model?: string;
      temperature?: number;
      maxTokens?: number;
      systemMessage?: string;
    };

    // Build system prompt from personality
    const systemPrompt = this.buildAgentSystemPrompt(config, personality);

    // Build user prompt from input and config
    const userPrompt = config.prompt || JSON.stringify(input, null, 2);

    try {
      const response = await this.llmRouter.generate({
        systemPrompt,
        userPrompt,
        model: config.model,
        temperature: config.temperature || 0.7,
        maxTokens: config.maxTokens,
      });

      logger.info('Generated agent response using LLM', {
        agentId: config.agentId,
        provider: response.provider,
      });

      return {
        agent: config.agentId,
        model: response.model,
        provider: response.provider,
        response: response.completion,
        metadata: {
          executedAt: new Date().toISOString(),
          stubbed: false,
          personality: personality ? {
            id: personality.id,
            slug: personality.slug,
            name: personality.name,
            tone: personality.configuration.tone,
            style: personality.configuration.style,
          } : null,
          usage: response.usage,
        },
      };
    } catch (error) {
      logger.warn('Failed to execute agent step with LLM, will use stub', {
        agentId: config.agentId,
        error,
      });
      return null;
    }
  }

  /**
   * Build system prompt for agent step (S16)
   */
  private buildAgentSystemPrompt(config: any, personality: any): string {
    const baseSystem = config.systemMessage || 'You are a helpful AI assistant.';

    if (!personality) {
      return baseSystem;
    }

    const tone = personality.configuration.tone || 'professional';
    const style = personality.configuration.style || 'clear and concise';
    const domainSpecialty = personality.configuration.domainSpecialty || null;

    let prompt = baseSystem + '\n\n';
    prompt += `Personality and Communication Style:\n`;
    prompt += `- Tone: ${tone}\n`;
    prompt += `- Style: ${style}\n`;

    if (domainSpecialty) {
      prompt += `- Domain Expertise: ${domainSpecialty}\n`;
    }

    if (personality.configuration.constraints) {
      prompt += `\nConstraints:\n`;
      for (const constraint of personality.configuration.constraints) {
        prompt += `- ${constraint}\n`;
      }
    }

    return prompt;
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
   * Persist collaboration context to step run (S9)
   */
  private async persistCollaborationContext(
    stepRunId: string,
    context: CollaborationContext
  ): Promise<void> {
    await this.supabase
      .from('playbook_step_runs')
      .update({
        collaboration_context: context,
        escalation_level: context.escalationLevel,
      })
      .eq('id', stepRunId);
  }

  /**
   * Generate embedding for data (S10)
   * Stub implementation - in production, call OpenAI/Anthropic embeddings API
   */
  private async generateEmbedding(_data: unknown): Promise<number[]> {
    // Stub: In production, call OpenAI embeddings API or similar
    // For now, return a random 1536-dimensional vector
    return new Array(1536).fill(0).map(() => Math.random());
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
      collaborationContext: row.collaboration_context, // S9
      escalationLevel: row.escalation_level, // S9
    };
  }
}
