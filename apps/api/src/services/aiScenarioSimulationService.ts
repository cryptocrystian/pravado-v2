/**
 * AI Scenario Simulation Service (Sprint S71)
 *
 * Autonomous multi-agent simulation engine for crisis, investor,
 * and strategic scenario planning. Orchestrates multi-role dialogues,
 * computes metrics, and generates outcomes.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { routeLLM } from '@pravado/utils';
import type {
  AIScenarioSimulation,
  AIScenarioRun,
  AIScenarioAgent,
  AIScenarioTurn,
  AIScenarioMetric,
  AIScenarioOutcome,
  AIScenarioAuditLogEntry,
  AISimulationMode,
  AISimulationStatus,
  AIRunStatus,
  AIAgentRoleType,
  AIScenarioChannelType,
  AIScenarioObjectiveType,
  AIScenarioRiskLevel,
  AIScenarioOutcomeType,
  AISimulationConfig,
  AIAgentConfig,
  AIAgentPersonaRef,
  AIContextSnapshot,
  AIScenarioSeedSource,
  AIScenarioRunSummary,
  AIScenarioRecommendedAction,
  AIScenarioTurnMetadata,
  CreateAISimulationInput,
  UpdateAISimulationInput,
  ListAISimulationsQuery,
  ListAISimulationsResponse,
  StartSimulationRunInput,
  AISimulationRunDetailResponse,
  StepRunInput,
  PostAgentFeedbackInput,
  PostAgentFeedbackResponse,
  ListRunTurnsQuery,
  ListRunTurnsResponse,
  ListRunMetricsQuery,
  ListRunMetricsResponse,
  ListRunOutcomesQuery,
  ListRunOutcomesResponse,
  ListSimulationRunsQuery,
  ListSimulationRunsResponse,
  ArchiveSimulationResponse,
  RunUntilConvergedInput,
  RunUntilConvergedResponse,
  ComputeRunMetricsInput,
  SummarizeOutcomesInput,
  SummarizeOutcomesResponse,
  AIScenarioSimulationStats,
  AIAgentDefinitionInput,
} from '@pravado/types';
import { AI_AGENT_PRESETS } from '@pravado/types';

// ============================================================================
// SERVICE CONTEXT
// ============================================================================

export interface AIScenarioSimulationContext {
  supabase: SupabaseClient;
  orgId: string;
  userId: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mapRowToSimulation(row: Record<string, unknown>): AIScenarioSimulation {
  return {
    id: row.id as string,
    orgId: row.org_id as string,
    name: row.name as string,
    description: row.description as string | undefined,
    linkedPlaybookId: row.linked_playbook_id as string | undefined,
    simulationMode: row.simulation_mode as AISimulationMode,
    objectiveType: row.objective_type as AIScenarioObjectiveType,
    status: row.status as AISimulationStatus,
    config: (row.config || {}) as AISimulationConfig,
    createdBy: row.created_by as string | undefined,
    updatedBy: row.updated_by as string | undefined,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    deletedAt: row.deleted_at ? new Date(row.deleted_at as string) : undefined,
    runCount: row.run_count as number | undefined,
    lastRunAt: row.last_run_at ? new Date(row.last_run_at as string) : undefined,
    lastRunStatus: row.last_run_status as AIRunStatus | undefined,
    linkedPlaybookName: row.linked_playbook_name as string | undefined,
  };
}

function mapRowToRun(row: Record<string, unknown>): AIScenarioRun {
  return {
    id: row.id as string,
    orgId: row.org_id as string,
    simulationId: row.simulation_id as string,
    runLabel: row.run_label as string | undefined,
    runNumber: row.run_number as number,
    seedContext: (row.seed_context || {}) as AIContextSnapshot,
    status: row.status as AIRunStatus,
    stepCount: row.step_count as number,
    maxSteps: row.max_steps as number,
    currentStep: row.current_step as number,
    riskLevel: row.risk_level as AIScenarioRiskLevel | undefined,
    summary: row.summary as AIScenarioRunSummary | undefined,
    errorMessage: row.error_message as string | undefined,
    errorDetails: row.error_details as Record<string, unknown> | undefined,
    startedAt: row.started_at ? new Date(row.started_at as string) : undefined,
    completedAt: row.completed_at ? new Date(row.completed_at as string) : undefined,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    agentCount: row.agent_count as number | undefined,
    turnCount: row.turn_count as number | undefined,
    simulationName: row.simulation_name as string | undefined,
  };
}

function mapRowToAgent(row: Record<string, unknown>): AIScenarioAgent {
  return {
    id: row.id as string,
    orgId: row.org_id as string,
    simulationId: row.simulation_id as string,
    runId: row.run_id as string | undefined,
    agentKey: row.agent_key as string,
    displayName: row.display_name as string,
    roleType: row.role_type as AIAgentRoleType,
    personaRef: row.persona_ref as AIAgentPersonaRef | undefined,
    config: (row.config || {}) as AIAgentConfig,
    isActive: row.is_active as boolean,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    turnCount: row.turn_count as number | undefined,
  };
}

function mapRowToTurn(row: Record<string, unknown>): AIScenarioTurn {
  return {
    id: row.id as string,
    orgId: row.org_id as string,
    runId: row.run_id as string,
    stepIndex: row.step_index as number,
    turnOrder: row.turn_order as number,
    speakerAgentId: row.speaker_agent_id as string,
    targetAgentId: row.target_agent_id as string | undefined,
    channel: row.channel as AIScenarioChannelType,
    content: row.content as string,
    metadata: row.metadata as AIScenarioTurnMetadata | undefined,
    createdAt: new Date(row.created_at as string),
  };
}

function mapRowToMetric(row: Record<string, unknown>): AIScenarioMetric {
  return {
    id: row.id as string,
    orgId: row.org_id as string,
    runId: row.run_id as string,
    metricKey: row.metric_key as string,
    metricLabel: row.metric_label as string,
    metricCategory: row.metric_category as string | undefined,
    valueNumeric: row.value_numeric ? parseFloat(row.value_numeric as string) : undefined,
    valueJson: row.value_json as Record<string, unknown> | undefined,
    stepIndex: row.step_index as number | undefined,
    computedAt: new Date(row.computed_at as string),
  };
}

function mapRowToOutcome(row: Record<string, unknown>): AIScenarioOutcome {
  return {
    id: row.id as string,
    orgId: row.org_id as string,
    runId: row.run_id as string,
    outcomeType: row.outcome_type as AIScenarioOutcomeType,
    riskLevel: row.risk_level as AIScenarioRiskLevel,
    title: row.title as string,
    description: row.description as string | undefined,
    recommendedActions: row.recommended_actions as AIScenarioRecommendedAction[] | undefined,
    linkedPlaybookStepIds: row.linked_playbook_step_ids as string[] | undefined,
    confidenceScore: row.confidence_score ? parseFloat(row.confidence_score as string) : undefined,
    createdAt: new Date(row.created_at as string),
  };
}

function mapRowToAuditLog(row: Record<string, unknown>): AIScenarioAuditLogEntry {
  return {
    id: row.id as string,
    orgId: row.org_id as string,
    simulationId: row.simulation_id as string | undefined,
    runId: row.run_id as string | undefined,
    eventType: row.event_type as string,
    actorId: row.actor_id as string | undefined,
    details: row.details as AIScenarioAuditLogEntry['details'],
    createdAt: new Date(row.created_at as string),
  };
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

async function logAuditEvent(
  ctx: AIScenarioSimulationContext,
  eventType: string,
  details: Record<string, unknown>,
  simulationId?: string,
  runId?: string
): Promise<void> {
  try {
    await ctx.supabase.from('ai_scenario_audit_log').insert({
      org_id: ctx.orgId,
      simulation_id: simulationId || null,
      run_id: runId || null,
      event_type: eventType,
      actor_id: ctx.userId,
      details,
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

// ============================================================================
// SIMULATION CRUD
// ============================================================================

export async function createSimulation(
  ctx: AIScenarioSimulationContext,
  input: CreateAISimulationInput
): Promise<AIScenarioSimulation> {
  const { data, error } = await ctx.supabase
    .from('ai_scenario_simulations')
    .insert({
      org_id: ctx.orgId,
      name: input.name,
      description: input.description || null,
      linked_playbook_id: input.linkedPlaybookId || null,
      simulation_mode: input.simulationMode || 'single_run',
      objective_type: input.objectiveType || 'custom',
      status: 'draft',
      config: input.config || {},
      created_by: ctx.userId,
      updated_by: ctx.userId,
    })
    .select('*')
    .single();

  if (error) throw new Error(`Failed to create simulation: ${error.message}`);

  const simulation = mapRowToSimulation(data);

  await logAuditEvent(ctx, 'simulation_created', {
    description: `Created simulation: ${simulation.name}`,
    simulationName: simulation.name,
    objectiveType: simulation.objectiveType,
    simulationMode: simulation.simulationMode,
  }, simulation.id);

  return simulation;
}

export async function updateSimulation(
  ctx: AIScenarioSimulationContext,
  simulationId: string,
  input: UpdateAISimulationInput
): Promise<AIScenarioSimulation> {
  // Get current state for audit
  const { data: before } = await ctx.supabase
    .from('ai_scenario_simulations')
    .select('*')
    .eq('id', simulationId)
    .eq('org_id', ctx.orgId)
    .single();

  if (!before) throw new Error('Simulation not found');

  const updateData: Record<string, unknown> = {
    updated_by: ctx.userId,
    updated_at: new Date().toISOString(),
  };

  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.linkedPlaybookId !== undefined) updateData.linked_playbook_id = input.linkedPlaybookId;
  if (input.simulationMode !== undefined) updateData.simulation_mode = input.simulationMode;
  if (input.objectiveType !== undefined) updateData.objective_type = input.objectiveType;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.config !== undefined) updateData.config = input.config;

  const { data, error } = await ctx.supabase
    .from('ai_scenario_simulations')
    .update(updateData)
    .eq('id', simulationId)
    .eq('org_id', ctx.orgId)
    .select('*')
    .single();

  if (error) throw new Error(`Failed to update simulation: ${error.message}`);

  const simulation = mapRowToSimulation(data);

  await logAuditEvent(ctx, 'simulation_updated', {
    description: `Updated simulation: ${simulation.name}`,
    before: { status: before.status, name: before.name },
    after: { status: simulation.status, name: simulation.name },
  }, simulation.id);

  return simulation;
}

export async function getSimulationById(
  ctx: AIScenarioSimulationContext,
  simulationId: string
): Promise<AIScenarioSimulation | null> {
  const { data, error } = await ctx.supabase
    .from('ai_scenario_simulations')
    .select('*')
    .eq('id', simulationId)
    .eq('org_id', ctx.orgId)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to get simulation: ${error.message}`);
  }

  return mapRowToSimulation(data);
}

export async function listSimulations(
  ctx: AIScenarioSimulationContext,
  query: ListAISimulationsQuery
): Promise<ListAISimulationsResponse> {
  let dbQuery = ctx.supabase
    .from('ai_scenario_simulations')
    .select('*', { count: 'exact' })
    .eq('org_id', ctx.orgId)
    .is('deleted_at', null);

  if (query.search) {
    dbQuery = dbQuery.or(`name.ilike.%${query.search}%,description.ilike.%${query.search}%`);
  }
  if (query.status) {
    dbQuery = dbQuery.eq('status', query.status);
  }
  if (query.objectiveType) {
    dbQuery = dbQuery.eq('objective_type', query.objectiveType);
  }
  if (query.simulationMode) {
    dbQuery = dbQuery.eq('simulation_mode', query.simulationMode);
  }
  if (query.linkedPlaybookId) {
    dbQuery = dbQuery.eq('linked_playbook_id', query.linkedPlaybookId);
  }

  const sortColumn = query.sortBy === 'name' ? 'name' :
    query.sortBy === 'status' ? 'status' :
    query.sortBy === 'created_at' ? 'created_at' : 'updated_at';
  const ascending = query.sortOrder === 'asc';

  dbQuery = dbQuery.order(sortColumn, { ascending });

  const limit = query.limit || 50;
  const offset = query.offset || 0;
  dbQuery = dbQuery.range(offset, offset + limit - 1);

  const { data, error, count } = await dbQuery;

  if (error) throw new Error(`Failed to list simulations: ${error.message}`);

  return {
    simulations: (data || []).map(mapRowToSimulation),
    total: count || 0,
    limit,
    offset,
  };
}

export async function archiveSimulation(
  ctx: AIScenarioSimulationContext,
  simulationId: string,
  reason?: string
): Promise<ArchiveSimulationResponse> {
  const { data, error } = await ctx.supabase
    .from('ai_scenario_simulations')
    .update({
      status: 'archived',
      deleted_at: new Date().toISOString(),
      updated_by: ctx.userId,
    })
    .eq('id', simulationId)
    .eq('org_id', ctx.orgId)
    .select('*')
    .single();

  if (error) throw new Error(`Failed to archive simulation: ${error.message}`);

  const simulation = mapRowToSimulation(data);

  await logAuditEvent(ctx, 'simulation_archived', {
    description: `Archived simulation: ${simulation.name}`,
    reason,
  }, simulation.id);

  return { success: true, simulation };
}

export async function deleteSimulation(
  ctx: AIScenarioSimulationContext,
  simulationId: string
): Promise<void> {
  const { error } = await ctx.supabase
    .from('ai_scenario_simulations')
    .delete()
    .eq('id', simulationId)
    .eq('org_id', ctx.orgId);

  if (error) throw new Error(`Failed to delete simulation: ${error.message}`);

  await logAuditEvent(ctx, 'simulation_deleted', {
    description: 'Permanently deleted simulation',
  }, simulationId);
}

// ============================================================================
// RUN MANAGEMENT
// ============================================================================

export async function startRun(
  ctx: AIScenarioSimulationContext,
  simulationId: string,
  input: StartSimulationRunInput
): Promise<AIScenarioRun> {
  // Get simulation
  const simulation = await getSimulationById(ctx, simulationId);
  if (!simulation) throw new Error('Simulation not found');

  // Get next run number
  const { count } = await ctx.supabase
    .from('ai_scenario_runs')
    .select('*', { count: 'exact', head: true })
    .eq('simulation_id', simulationId)
    .eq('org_id', ctx.orgId);

  const runNumber = (count || 0) + 1;

  // Build context snapshot
  const seedContext = await buildContextSnapshot(ctx, input.seedSources, input.customContext);

  // Create run
  const { data: runData, error: runError } = await ctx.supabase
    .from('ai_scenario_runs')
    .insert({
      org_id: ctx.orgId,
      simulation_id: simulationId,
      run_label: input.runLabel || `Run ${runNumber}`,
      run_number: runNumber,
      seed_context: seedContext,
      status: 'starting',
      step_count: 0,
      max_steps: input.maxSteps || simulation.config.maxStepsPerRun || 20,
      current_step: 0,
      risk_level: 'low',
    })
    .select('*')
    .single();

  if (runError) throw new Error(`Failed to create run: ${runError.message}`);

  const run = mapRowToRun(runData);

  // Create agents
  const agentDefs = input.agents || getDefaultAgents(simulation.objectiveType);
  for (const agentDef of agentDefs) {
    await ctx.supabase.from('ai_scenario_agents').insert({
      org_id: ctx.orgId,
      simulation_id: simulationId,
      run_id: run.id,
      agent_key: agentDef.agentKey,
      display_name: agentDef.displayName,
      role_type: agentDef.roleType,
      persona_ref: agentDef.personaRef || {},
      config: agentDef.config || {},
      is_active: agentDef.isActive !== false,
    });
  }

  // Update simulation status
  await ctx.supabase
    .from('ai_scenario_simulations')
    .update({ status: 'running', updated_by: ctx.userId })
    .eq('id', simulationId);

  await logAuditEvent(ctx, 'run_started', {
    description: `Started run ${runNumber} for simulation`,
    runLabel: run.runLabel,
    maxSteps: run.maxSteps,
    agentCount: agentDefs.length,
  }, simulationId, run.id);

  // Start immediately if requested
  if (input.startImmediately) {
    return await runOneStep(ctx, run.id);
  }

  return run;
}

export async function getRunById(
  ctx: AIScenarioSimulationContext,
  runId: string
): Promise<AIScenarioRun | null> {
  const { data, error } = await ctx.supabase
    .from('ai_scenario_runs')
    .select('*')
    .eq('id', runId)
    .eq('org_id', ctx.orgId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to get run: ${error.message}`);
  }

  return mapRowToRun(data);
}

export async function getRunDetail(
  ctx: AIScenarioSimulationContext,
  runId: string
): Promise<AISimulationRunDetailResponse | null> {
  const run = await getRunById(ctx, runId);
  if (!run) return null;

  const [agentsResult, turnsResult, metricsResult, outcomesResult] = await Promise.all([
    ctx.supabase
      .from('ai_scenario_agents')
      .select('*')
      .eq('run_id', runId)
      .eq('org_id', ctx.orgId)
      .eq('is_active', true),
    ctx.supabase
      .from('ai_scenario_turns')
      .select('*')
      .eq('run_id', runId)
      .eq('org_id', ctx.orgId)
      .order('step_index', { ascending: false })
      .order('turn_order', { ascending: true })
      .limit(20),
    ctx.supabase
      .from('ai_scenario_metrics')
      .select('*')
      .eq('run_id', runId)
      .eq('org_id', ctx.orgId)
      .order('computed_at', { ascending: false })
      .limit(50),
    ctx.supabase
      .from('ai_scenario_outcomes')
      .select('*')
      .eq('run_id', runId)
      .eq('org_id', ctx.orgId)
      .order('created_at', { ascending: false }),
  ]);

  return {
    run,
    agents: (agentsResult.data || []).map(mapRowToAgent),
    recentTurns: (turnsResult.data || []).map(mapRowToTurn),
    metrics: (metricsResult.data || []).map(mapRowToMetric),
    outcomes: (outcomesResult.data || []).map(mapRowToOutcome),
  };
}

export async function listRunsForSimulation(
  ctx: AIScenarioSimulationContext,
  simulationId: string,
  query: ListSimulationRunsQuery
): Promise<ListSimulationRunsResponse> {
  let dbQuery = ctx.supabase
    .from('ai_scenario_runs')
    .select('*', { count: 'exact' })
    .eq('simulation_id', simulationId)
    .eq('org_id', ctx.orgId);

  if (query.status) {
    dbQuery = dbQuery.eq('status', query.status);
  }
  if (query.riskLevel) {
    dbQuery = dbQuery.eq('risk_level', query.riskLevel);
  }

  const sortColumn = query.sortBy === 'run_number' ? 'run_number' :
    query.sortBy === 'started_at' ? 'started_at' :
    query.sortBy === 'status' ? 'status' : 'created_at';
  const ascending = query.sortOrder === 'asc';

  dbQuery = dbQuery.order(sortColumn, { ascending });

  const limit = query.limit || 20;
  const offset = query.offset || 0;
  dbQuery = dbQuery.range(offset, offset + limit - 1);

  const { data, error, count } = await dbQuery;

  if (error) throw new Error(`Failed to list runs: ${error.message}`);

  return {
    runs: (data || []).map(mapRowToRun),
    total: count || 0,
    limit,
    offset,
  };
}

export async function abortRun(
  ctx: AIScenarioSimulationContext,
  runId: string
): Promise<AIScenarioRun> {
  const { data, error } = await ctx.supabase
    .from('ai_scenario_runs')
    .update({
      status: 'aborted',
      completed_at: new Date().toISOString(),
    })
    .eq('id', runId)
    .eq('org_id', ctx.orgId)
    .select('*')
    .single();

  if (error) throw new Error(`Failed to abort run: ${error.message}`);

  const run = mapRowToRun(data);

  await logAuditEvent(ctx, 'run_aborted', {
    description: 'Run aborted by user',
    stepCount: run.stepCount,
  }, run.simulationId, run.id);

  return run;
}

// ============================================================================
// MULTI-AGENT LOOP
// ============================================================================

export async function runOneStep(
  ctx: AIScenarioSimulationContext,
  runId: string,
  input?: StepRunInput
): Promise<AIScenarioRun> {
  const run = await getRunById(ctx, runId);
  if (!run) throw new Error('Run not found');

  if (run.status === 'completed' || run.status === 'failed' || run.status === 'aborted') {
    throw new Error(`Run is already ${run.status}`);
  }

  // Update status to in_progress if starting
  if (run.status === 'starting') {
    await ctx.supabase
      .from('ai_scenario_runs')
      .update({ status: 'in_progress', started_at: new Date().toISOString() })
      .eq('id', runId);
  }

  // Check if max steps reached
  if (run.currentStep >= run.maxSteps) {
    return await completeRun(ctx, runId);
  }

  // Get agents
  const { data: agents } = await ctx.supabase
    .from('ai_scenario_agents')
    .select('*')
    .eq('run_id', runId)
    .eq('org_id', ctx.orgId)
    .eq('is_active', true);

  if (!agents || agents.length === 0) {
    throw new Error('No active agents in run');
  }

  // Select next agent
  const agentList = agents.map(mapRowToAgent);
  let selectedAgent: AIScenarioAgent;

  if (input?.agentId) {
    const found = agentList.find(a => a.id === input.agentId);
    if (!found) throw new Error('Specified agent not found');
    selectedAgent = found;
  } else if (input?.skipAgent) {
    // Skip to next agent in rotation
    const nextIndex = run.currentStep % agentList.length;
    selectedAgent = agentList[(nextIndex + 1) % agentList.length];
  } else {
    // Round-robin agent selection
    const nextIndex = run.currentStep % agentList.length;
    selectedAgent = agentList[nextIndex];
  }

  // Get simulation for context
  const simulation = await getSimulationById(ctx, run.simulationId);
  if (!simulation) throw new Error('Simulation not found');

  // Get recent turns for context
  const { data: recentTurnsData } = await ctx.supabase
    .from('ai_scenario_turns')
    .select('*')
    .eq('run_id', runId)
    .eq('org_id', ctx.orgId)
    .order('step_index', { ascending: false })
    .order('turn_order', { ascending: true })
    .limit(10);

  const recentTurns = (recentTurnsData || []).map(mapRowToTurn);

  // Generate agent response
  const startTime = Date.now();
  const turnContent = await generateAgentTurn(
    ctx,
    selectedAgent,
    simulation,
    run,
    recentTurns,
    input?.userGuidance
  );
  const generationTimeMs = Date.now() - startTime;

  // Determine channel based on agent role
  const channel = selectChannelForAgent(selectedAgent.roleType);

  // Create turn
  const { error: turnError } = await ctx.supabase
    .from('ai_scenario_turns')
    .insert({
      org_id: ctx.orgId,
      run_id: runId,
      step_index: run.currentStep + 1,
      turn_order: 0,
      speaker_agent_id: selectedAgent.id,
      target_agent_id: null,
      channel,
      content: turnContent.content,
      metadata: {
        llmModel: turnContent.model,
        tokenCount: turnContent.totalTokens,
        promptTokens: turnContent.promptTokens,
        completionTokens: turnContent.completionTokens,
        generationTimeMs,
        keyTopics: turnContent.keyTopics,
        sentimentScore: turnContent.sentiment,
      },
    })
    .select('*')
    .single();

  if (turnError) throw new Error(`Failed to create turn: ${turnError.message}`);

  // Update run step count
  const newStep = run.currentStep + 1;
  const isComplete = newStep >= run.maxSteps;

  const { data: updatedRunData } = await ctx.supabase
    .from('ai_scenario_runs')
    .update({
      current_step: newStep,
      step_count: newStep,
      status: isComplete ? 'completed' : 'in_progress',
      completed_at: isComplete ? new Date().toISOString() : null,
    })
    .eq('id', runId)
    .select('*')
    .single();

  await logAuditEvent(ctx, 'agent_step', {
    description: `Agent ${selectedAgent.displayName} took turn`,
    agentKey: selectedAgent.agentKey,
    stepIndex: newStep,
    channel,
    llmModel: turnContent.model,
    tokenUsage: {
      prompt: turnContent.promptTokens || 0,
      completion: turnContent.completionTokens || 0,
    },
    durationMs: generationTimeMs,
  }, run.simulationId, runId);

  // Compute metrics after each step
  await computeStepMetrics(ctx, runId, newStep);

  return mapRowToRun(updatedRunData!);
}

export async function runUntilConverged(
  ctx: AIScenarioSimulationContext,
  runId: string,
  input?: RunUntilConvergedInput
): Promise<RunUntilConvergedResponse> {
  let run = await getRunById(ctx, runId);
  if (!run) throw new Error('Run not found');

  const maxSteps = input?.maxSteps || run.maxSteps;
  let stepsExecuted = 0;
  let converged = false;
  let convergenceReason: string | undefined;

  while (run.currentStep < maxSteps && !converged) {
    run = await runOneStep(ctx, runId);
    stepsExecuted++;

    // Check convergence criteria
    if (input?.pauseOnHighRisk && (run.riskLevel === 'high' || run.riskLevel === 'critical')) {
      converged = true;
      convergenceReason = `Paused due to ${run.riskLevel} risk level`;
    }

    // Check if run completed
    if (run.status === 'completed') {
      converged = true;
      convergenceReason = 'Max steps reached';
    }
  }

  return {
    run,
    stepsExecuted,
    converged,
    convergenceReason,
    finalRiskLevel: run.riskLevel || 'low',
  };
}

export async function postAgentFeedback(
  ctx: AIScenarioSimulationContext,
  runId: string,
  input: PostAgentFeedbackInput
): Promise<PostAgentFeedbackResponse> {
  const run = await getRunById(ctx, runId);
  if (!run) throw new Error('Run not found');

  // Get agents to update
  let agentsToUpdate: string[] = [];

  if (input.targetAgentId) {
    agentsToUpdate = [input.targetAgentId];
  } else {
    const { data: agents } = await ctx.supabase
      .from('ai_scenario_agents')
      .select('id')
      .eq('run_id', runId)
      .eq('org_id', ctx.orgId)
      .eq('is_active', true);
    agentsToUpdate = (agents || []).map(a => a.id);
  }

  // Update agent configs with feedback
  for (const agentId of agentsToUpdate) {
    const { data: agent } = await ctx.supabase
      .from('ai_scenario_agents')
      .select('config')
      .eq('id', agentId)
      .single();

    if (agent) {
      const currentConfig = (agent.config || {}) as AIAgentConfig;
      const updatedConstraints = [...(currentConfig.constraints || [])];

      if (input.feedbackType === 'constraint') {
        updatedConstraints.push(input.content);
      }

      const customInstructions = input.feedbackType === 'guidance'
        ? `${currentConfig.customInstructions || ''}\n${input.content}`.trim()
        : currentConfig.customInstructions;

      await ctx.supabase
        .from('ai_scenario_agents')
        .update({
          config: {
            ...currentConfig,
            constraints: updatedConstraints,
            customInstructions,
          },
        })
        .eq('id', agentId);
    }
  }

  await logAuditEvent(ctx, 'agent_feedback', {
    description: `User provided ${input.feedbackType} feedback`,
    feedbackType: input.feedbackType,
    targetAgentId: input.targetAgentId,
    appliedTo: agentsToUpdate,
  }, run.simulationId, runId);

  return {
    success: true,
    appliedTo: agentsToUpdate,
    message: `Feedback applied to ${agentsToUpdate.length} agent(s)`,
  };
}

// ============================================================================
// OBSERVABILITY
// ============================================================================

export async function listRunTurns(
  ctx: AIScenarioSimulationContext,
  runId: string,
  query: ListRunTurnsQuery
): Promise<ListRunTurnsResponse> {
  let dbQuery = ctx.supabase
    .from('ai_scenario_turns')
    .select('*', { count: 'exact' })
    .eq('run_id', runId)
    .eq('org_id', ctx.orgId);

  if (query.speakerAgentId) {
    dbQuery = dbQuery.eq('speaker_agent_id', query.speakerAgentId);
  }
  if (query.channel) {
    dbQuery = dbQuery.eq('channel', query.channel);
  }
  if (query.stepIndex !== undefined) {
    dbQuery = dbQuery.eq('step_index', query.stepIndex);
  }

  const ascending = query.sortOrder !== 'desc';
  dbQuery = dbQuery.order('step_index', { ascending });
  dbQuery = dbQuery.order('turn_order', { ascending: true });

  const limit = query.limit || 50;
  const offset = query.offset || 0;
  dbQuery = dbQuery.range(offset, offset + limit - 1);

  const { data, error, count } = await dbQuery;

  if (error) throw new Error(`Failed to list turns: ${error.message}`);

  return {
    turns: (data || []).map(mapRowToTurn),
    total: count || 0,
    limit,
    offset,
  };
}

export async function listRunMetrics(
  ctx: AIScenarioSimulationContext,
  runId: string,
  query: ListRunMetricsQuery
): Promise<ListRunMetricsResponse> {
  let dbQuery = ctx.supabase
    .from('ai_scenario_metrics')
    .select('*', { count: 'exact' })
    .eq('run_id', runId)
    .eq('org_id', ctx.orgId);

  if (query.metricKey) {
    dbQuery = dbQuery.eq('metric_key', query.metricKey);
  }
  if (query.metricCategory) {
    dbQuery = dbQuery.eq('metric_category', query.metricCategory);
  }
  if (query.stepIndex !== undefined) {
    dbQuery = dbQuery.eq('step_index', query.stepIndex);
  }

  const ascending = query.sortOrder !== 'desc';
  dbQuery = dbQuery.order('computed_at', { ascending });

  const limit = query.limit || 100;
  const offset = query.offset || 0;
  dbQuery = dbQuery.range(offset, offset + limit - 1);

  const { data, error, count } = await dbQuery;

  if (error) throw new Error(`Failed to list metrics: ${error.message}`);

  return {
    metrics: (data || []).map(mapRowToMetric),
    total: count || 0,
    limit,
    offset,
  };
}

export async function listRunOutcomes(
  ctx: AIScenarioSimulationContext,
  runId: string,
  query: ListRunOutcomesQuery
): Promise<ListRunOutcomesResponse> {
  let dbQuery = ctx.supabase
    .from('ai_scenario_outcomes')
    .select('*', { count: 'exact' })
    .eq('run_id', runId)
    .eq('org_id', ctx.orgId);

  if (query.outcomeType) {
    dbQuery = dbQuery.eq('outcome_type', query.outcomeType);
  }
  if (query.riskLevel) {
    dbQuery = dbQuery.eq('risk_level', query.riskLevel);
  }

  const ascending = query.sortOrder !== 'desc';
  dbQuery = dbQuery.order('created_at', { ascending });

  const limit = query.limit || 50;
  const offset = query.offset || 0;
  dbQuery = dbQuery.range(offset, offset + limit - 1);

  const { data, error, count } = await dbQuery;

  if (error) throw new Error(`Failed to list outcomes: ${error.message}`);

  return {
    outcomes: (data || []).map(mapRowToOutcome),
    total: count || 0,
    limit,
    offset,
  };
}

// ============================================================================
// METRICS & OUTCOMES
// ============================================================================

async function computeStepMetrics(
  ctx: AIScenarioSimulationContext,
  runId: string,
  stepIndex: number
): Promise<void> {
  // Get recent turns for this step
  const { data: turns } = await ctx.supabase
    .from('ai_scenario_turns')
    .select('*')
    .eq('run_id', runId)
    .eq('org_id', ctx.orgId)
    .lte('step_index', stepIndex);

  if (!turns || turns.length === 0) return;

  // Compute aggregate sentiment
  const sentiments = turns
    .map(t => (t.metadata as AIScenarioTurnMetadata)?.sentimentScore)
    .filter((s): s is number => s !== undefined);

  const avgSentiment = sentiments.length > 0
    ? sentiments.reduce((a, b) => a + b, 0) / sentiments.length
    : 0;

  // Compute risk level based on sentiment
  let riskLevel: AIScenarioRiskLevel = 'low';
  if (avgSentiment < -0.5) riskLevel = 'critical';
  else if (avgSentiment < -0.2) riskLevel = 'high';
  else if (avgSentiment < 0.1) riskLevel = 'medium';

  // Insert metrics
  const metricsToInsert = [
    {
      org_id: ctx.orgId,
      run_id: runId,
      metric_key: 'sentiment_avg',
      metric_label: 'Average Sentiment',
      metric_category: 'sentiment',
      value_numeric: avgSentiment,
      step_index: stepIndex,
    },
    {
      org_id: ctx.orgId,
      run_id: runId,
      metric_key: 'risk_level',
      metric_label: 'Risk Level',
      metric_category: 'risk',
      value_json: { level: riskLevel, stepIndex },
      step_index: stepIndex,
    },
  ];

  await ctx.supabase.from('ai_scenario_metrics').insert(metricsToInsert);

  // Update run risk level
  await ctx.supabase
    .from('ai_scenario_runs')
    .update({ risk_level: riskLevel })
    .eq('id', runId);
}

export async function computeRunMetrics(
  ctx: AIScenarioSimulationContext,
  runId: string,
  _input?: ComputeRunMetricsInput
): Promise<AIScenarioMetric[]> {
  const run = await getRunById(ctx, runId);
  if (!run) throw new Error('Run not found');

  // Get all turns
  const { data: turns } = await ctx.supabase
    .from('ai_scenario_turns')
    .select('*')
    .eq('run_id', runId)
    .eq('org_id', ctx.orgId);

  if (!turns || turns.length === 0) return [];

  // Compute various metrics
  const metrics: Partial<AIScenarioMetric>[] = [];

  // Total turns
  metrics.push({
    metricKey: 'total_turns',
    metricLabel: 'Total Turns',
    metricCategory: 'activity',
    valueNumeric: turns.length,
  });

  // Sentiment progression
  const sentiments = turns
    .map(t => (t.metadata as AIScenarioTurnMetadata)?.sentimentScore)
    .filter((s): s is number => s !== undefined);

  if (sentiments.length > 0) {
    metrics.push({
      metricKey: 'final_sentiment',
      metricLabel: 'Final Sentiment',
      metricCategory: 'sentiment',
      valueNumeric: sentiments[sentiments.length - 1],
    });
  }

  // Insert computed metrics
  const metricsToInsert = metrics.map(m => ({
    org_id: ctx.orgId,
    run_id: runId,
    metric_key: m.metricKey,
    metric_label: m.metricLabel,
    metric_category: m.metricCategory,
    value_numeric: m.valueNumeric,
    value_json: m.valueJson,
  }));

  const { data: insertedMetrics } = await ctx.supabase
    .from('ai_scenario_metrics')
    .insert(metricsToInsert)
    .select('*');

  return (insertedMetrics || []).map(mapRowToMetric);
}

export async function summarizeOutcomes(
  ctx: AIScenarioSimulationContext,
  runId: string,
  input?: SummarizeOutcomesInput
): Promise<SummarizeOutcomesResponse> {
  const run = await getRunById(ctx, runId);
  if (!run) throw new Error('Run not found');

  // Get simulation
  const simulation = await getSimulationById(ctx, run.simulationId);
  if (!simulation) throw new Error('Simulation not found');

  // Get all turns
  const { data: turns } = await ctx.supabase
    .from('ai_scenario_turns')
    .select('*')
    .eq('run_id', runId)
    .eq('org_id', ctx.orgId)
    .order('step_index', { ascending: true });

  // Generate outcome using LLM
  const outcomeResult = await generateOutcomeSummary(
    ctx,
    simulation,
    run,
    (turns || []).map(mapRowToTurn),
    input
  );

  // Insert outcomes
  const outcomesToInsert = outcomeResult.outcomes.map(o => ({
    org_id: ctx.orgId,
    run_id: runId,
    outcome_type: o.outcomeType,
    risk_level: o.riskLevel,
    title: o.title,
    description: o.description,
    recommended_actions: o.recommendedActions || [],
    confidence_score: o.confidenceScore,
  }));

  const { data: insertedOutcomes } = await ctx.supabase
    .from('ai_scenario_outcomes')
    .insert(outcomesToInsert)
    .select('*');

  // Update run summary
  await ctx.supabase
    .from('ai_scenario_runs')
    .update({
      summary: {
        keyInsights: outcomeResult.keyInsights,
        overallAssessment: outcomeResult.narrativeSummary,
      },
    })
    .eq('id', runId);

  return {
    outcomes: (insertedOutcomes || []).map(mapRowToOutcome),
    narrativeSummary: outcomeResult.narrativeSummary,
    overallRiskLevel: outcomeResult.overallRiskLevel,
    topRecommendations: outcomeResult.topRecommendations,
  };
}

// ============================================================================
// STATISTICS
// ============================================================================

export async function getSimulationStats(
  ctx: AIScenarioSimulationContext
): Promise<AIScenarioSimulationStats> {
  // Get simulations by status
  const { data: simulations } = await ctx.supabase
    .from('ai_scenario_simulations')
    .select('status, objective_type, simulation_mode')
    .eq('org_id', ctx.orgId)
    .is('deleted_at', null);

  const byStatus: Record<AISimulationStatus, number> = {
    draft: 0, configured: 0, running: 0, paused: 0,
    completed: 0, failed: 0, archived: 0,
  };
  const byObjective: Record<AIScenarioObjectiveType, number> = {
    crisis_comms: 0, investor_relations: 0, reputation: 0, go_to_market: 0,
    regulatory: 0, competitive: 0, earnings: 0, leadership_change: 0,
    m_and_a: 0, custom: 0,
  };
  const byMode: Record<AISimulationMode, number> = {
    single_run: 0, multi_run: 0, what_if: 0,
  };

  for (const sim of simulations || []) {
    byStatus[sim.status as AISimulationStatus]++;
    byObjective[sim.objective_type as AIScenarioObjectiveType]++;
    byMode[sim.simulation_mode as AISimulationMode]++;
  }

  // Get run stats
  const { data: runs } = await ctx.supabase
    .from('ai_scenario_runs')
    .select('status, step_count, risk_level')
    .eq('org_id', ctx.orgId);

  const totalRuns = runs?.length || 0;
  const completedRuns = runs?.filter(r => r.status === 'completed').length || 0;
  const totalSteps = runs?.reduce((sum, r) => sum + (r.step_count || 0), 0) || 0;
  const avgSteps = totalRuns > 0 ? totalSteps / totalRuns : 0;

  const riskDistribution: Record<AIScenarioRiskLevel, number> = {
    low: 0, medium: 0, high: 0, critical: 0,
  };

  for (const run of runs || []) {
    if (run.risk_level) {
      riskDistribution[run.risk_level as AIScenarioRiskLevel]++;
    }
  }

  return {
    totalSimulations: simulations?.length || 0,
    byStatus,
    byObjective,
    byMode,
    totalRuns,
    completedRuns,
    averageStepsPerRun: Math.round(avgSteps * 10) / 10,
    riskDistribution,
  };
}

// ============================================================================
// HELPER FUNCTIONS - CONTEXT BUILDING
// ============================================================================

async function buildContextSnapshot(
  _ctx: AIScenarioSimulationContext,
  _seedSources?: AIScenarioSeedSource[],
  customContext?: Partial<AIContextSnapshot>
): Promise<AIContextSnapshot> {
  const snapshot: AIContextSnapshot = {
    capturedAt: new Date(),
    ...customContext,
  };

  // TODO: In production, pull from actual intelligence systems:
  // - Risk Radar (S60)
  // - Unified Intelligence Graph (S66)
  // - Strategic Intelligence (S65)
  // - Unified Narratives (S70)

  // For now, return basic context
  if (!snapshot.riskRadarSnapshot) {
    snapshot.riskRadarSnapshot = {
      overallRiskScore: 0.3,
      topRisks: [],
      trendDirection: 'stable',
    };
  }

  return snapshot;
}

function getDefaultAgents(objectiveType: AIScenarioObjectiveType): AIAgentDefinitionInput[] {
  // Get presets suitable for this objective
  const suitablePresets = AI_AGENT_PRESETS.filter(
    p => p.suitableFor.includes(objectiveType)
  );

  if (suitablePresets.length === 0) {
    // Default minimal set
    return [
      {
        agentKey: 'ceo',
        displayName: 'CEO',
        roleType: 'internal_exec',
        config: { style: 'strategic', tone: 'confident' },
        isActive: true,
      },
      {
        agentKey: 'narrator',
        displayName: 'Scenario Narrator',
        roleType: 'system',
        config: { style: 'objective', tone: 'neutral' },
        isActive: true,
      },
    ];
  }

  // Return up to 5 suitable agents
  return suitablePresets.slice(0, 5).map(p => ({
    agentKey: p.agentKey,
    displayName: p.displayName,
    roleType: p.roleType,
    config: p.defaultConfig,
    isActive: true,
  }));
}

function selectChannelForAgent(roleType: AIAgentRoleType): AIScenarioChannelType {
  switch (roleType) {
    case 'journalist':
      return 'press';
    case 'investor':
      return 'investor_call';
    case 'regulator':
      return 'public_statement';
    case 'customer':
      return 'email';
    case 'employee':
      return 'internal_meeting';
    case 'internal_exec':
      return 'board';
    case 'market_analyst':
      return 'analyst_report';
    case 'system':
      return 'internal_meeting';
    case 'critic':
      return 'internal_meeting';
    default:
      return 'internal_meeting';
  }
}

// ============================================================================
// LLM GENERATION
// ============================================================================

interface TurnGenerationResult {
  content: string;
  model: string;
  totalTokens: number;
  promptTokens?: number;
  completionTokens?: number;
  keyTopics?: string[];
  sentiment?: number;
}

async function generateAgentTurn(
  _ctx: AIScenarioSimulationContext,
  agent: AIScenarioAgent,
  simulation: AIScenarioSimulation,
  run: AIScenarioRun,
  recentTurns: AIScenarioTurn[],
  userGuidance?: string
): Promise<TurnGenerationResult> {
  const systemPrompt = buildAgentSystemPrompt(agent, simulation);
  const userPrompt = buildAgentUserPrompt(agent, simulation, run, recentTurns, userGuidance);

  try {
    const response = await routeLLM({
      systemPrompt,
      userPrompt,
      temperature: simulation.config.temperature || 0.7,
      maxTokens: 1000,
    });

    const content = response.content || 'No response generated.';

    // Simple sentiment analysis (placeholder)
    const sentiment = analyzeSentiment(content);

    return {
      content,
      model: response.model || 'unknown',
      totalTokens: response.usage?.totalTokens || 0,
      promptTokens: response.usage?.promptTokens,
      completionTokens: response.usage?.completionTokens,
      sentiment,
    };
  } catch (error) {
    console.error('LLM generation error:', error);
    return {
      content: `[${agent.displayName} is considering their response...]`,
      model: 'fallback',
      totalTokens: 0,
      sentiment: 0,
    };
  }
}

function buildAgentSystemPrompt(
  agent: AIScenarioAgent,
  simulation: AIScenarioSimulation
): string {
  const roleDescriptions: Record<AIAgentRoleType, string> = {
    internal_exec: 'You are a senior executive at the company.',
    journalist: 'You are an investigative journalist covering this company.',
    investor: 'You are a shareholder or potential investor in this company.',
    customer: 'You are a customer or client of this company.',
    employee: 'You are an employee at this company.',
    regulator: 'You are a regulatory official overseeing this industry.',
    market_analyst: 'You are a financial analyst covering this company.',
    system: 'You are a neutral narrator providing context and transitions.',
    critic: 'You are an internal devil\'s advocate challenging assumptions.',
  };

  let prompt = `You are playing the role of "${agent.displayName}" in a scenario simulation.

${roleDescriptions[agent.roleType]}

Simulation Context:
- Objective: ${simulation.objectiveType.replace(/_/g, ' ')}
- Scenario: ${simulation.description || simulation.name}

Your Character:
- Role: ${agent.displayName}
- Style: ${agent.config.style || 'professional'}
- Tone: ${agent.config.tone || 'neutral'}`;

  if (agent.config.priorities?.length) {
    prompt += `\n- Priorities: ${agent.config.priorities.join(', ')}`;
  }

  if (agent.config.constraints?.length) {
    prompt += `\n- Constraints: ${agent.config.constraints.join(', ')}`;
  }

  if (agent.config.customInstructions) {
    prompt += `\n- Special Instructions: ${agent.config.customInstructions}`;
  }

  prompt += `

Stay in character. Respond naturally as this person would in this scenario.
Keep responses concise but substantive (2-4 paragraphs).`;

  return prompt;
}

function buildAgentUserPrompt(
  agent: AIScenarioAgent,
  _simulation: AIScenarioSimulation,
  run: AIScenarioRun,
  recentTurns: AIScenarioTurn[],
  userGuidance?: string
): string {
  let prompt = '';

  if (recentTurns.length > 0) {
    prompt += 'Recent conversation:\n\n';
    for (const turn of recentTurns.slice(-5)) {
      prompt += `[Step ${turn.stepIndex}] ${turn.content}\n\n`;
    }
    prompt += '---\n\n';
  }

  prompt += `Current step: ${run.currentStep + 1} of ${run.maxSteps}\n`;

  if (userGuidance) {
    prompt += `\nUser guidance for this turn: ${userGuidance}\n`;
  }

  prompt += `\nNow respond as ${agent.displayName}. What do you say or do next?`;

  return prompt;
}

function analyzeSentiment(content: string): number {
  // Simple keyword-based sentiment (placeholder for real NLP)
  const positive = ['success', 'confident', 'opportunity', 'growth', 'strong', 'excellent'];
  const negative = ['concern', 'risk', 'problem', 'crisis', 'threat', 'decline', 'worried'];

  const lowerContent = content.toLowerCase();
  let score = 0;

  for (const word of positive) {
    if (lowerContent.includes(word)) score += 0.1;
  }
  for (const word of negative) {
    if (lowerContent.includes(word)) score -= 0.1;
  }

  return Math.max(-1, Math.min(1, score));
}

interface OutcomeSummaryResult {
  outcomes: Array<{
    outcomeType: AIScenarioOutcomeType;
    riskLevel: AIScenarioRiskLevel;
    title: string;
    description: string;
    recommendedActions?: AIScenarioRecommendedAction[];
    confidenceScore?: number;
  }>;
  narrativeSummary?: string;
  keyInsights: string[];
  overallRiskLevel: AIScenarioRiskLevel;
  topRecommendations: AIScenarioRecommendedAction[];
}

async function generateOutcomeSummary(
  _ctx: AIScenarioSimulationContext,
  simulation: AIScenarioSimulation,
  run: AIScenarioRun,
  turns: AIScenarioTurn[],
  _input?: SummarizeOutcomesInput
): Promise<OutcomeSummaryResult> {
  const systemPrompt = `You are an expert strategic analyst. Analyze the following scenario simulation and provide:
1. Key outcomes (risks and opportunities)
2. Overall risk assessment
3. Recommended actions

Format your response as JSON with the following structure:
{
  "outcomes": [
    { "type": "risk|opportunity|neutral", "riskLevel": "low|medium|high|critical", "title": "...", "description": "..." }
  ],
  "overallRiskLevel": "low|medium|high|critical",
  "keyInsights": ["..."],
  "recommendations": [
    { "action": "...", "priority": "high|medium|low", "rationale": "..." }
  ],
  "narrativeSummary": "..."
}`;

  const turnSummary = turns.slice(-10).map(t =>
    `[Step ${t.stepIndex}]: ${t.content.substring(0, 200)}...`
  ).join('\n\n');

  const userPrompt = `Simulation: ${simulation.name}
Objective: ${simulation.objectiveType}

Transcript (last 10 turns):
${turnSummary}

Analyze this scenario and provide outcomes and recommendations.`;

  try {
    const response = await routeLLM({
      systemPrompt,
      userPrompt,
      temperature: 0.3,
      maxTokens: 2000,
      responseFormat: 'json',
    });

    const parsed = JSON.parse(response.content || '{}');

    return {
      outcomes: (parsed.outcomes || []).map((o: Record<string, unknown>) => ({
        outcomeType: (o.type as AIScenarioOutcomeType) || 'neutral',
        riskLevel: (o.riskLevel as AIScenarioRiskLevel) || 'medium',
        title: (o.title as string) || 'Outcome',
        description: (o.description as string) || '',
        confidenceScore: 0.7,
      })),
      narrativeSummary: parsed.narrativeSummary,
      keyInsights: parsed.keyInsights || [],
      overallRiskLevel: parsed.overallRiskLevel || 'medium',
      topRecommendations: (parsed.recommendations || []).map((r: Record<string, unknown>) => ({
        action: (r.action as string) || '',
        priority: (r.priority as 'high' | 'medium' | 'low') || 'medium',
        rationale: r.rationale as string,
      })),
    };
  } catch (error) {
    console.error('Outcome generation error:', error);
    return {
      outcomes: [{
        outcomeType: 'neutral',
        riskLevel: run.riskLevel || 'medium',
        title: 'Simulation Completed',
        description: 'The simulation has completed. Review the transcript for details.',
        confidenceScore: 0.5,
      }],
      keyInsights: ['Review transcript for detailed analysis'],
      overallRiskLevel: run.riskLevel || 'medium',
      topRecommendations: [],
    };
  }
}

async function completeRun(
  ctx: AIScenarioSimulationContext,
  runId: string
): Promise<AIScenarioRun> {
  // Compute final metrics
  await computeRunMetrics(ctx, runId);

  // Generate outcomes
  await summarizeOutcomes(ctx, runId);

  // Update run status
  const { data, error } = await ctx.supabase
    .from('ai_scenario_runs')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', runId)
    .select('*')
    .single();

  if (error) throw new Error(`Failed to complete run: ${error.message}`);

  const run = mapRowToRun(data);

  // Update simulation status
  await ctx.supabase
    .from('ai_scenario_simulations')
    .update({ status: 'completed' })
    .eq('id', run.simulationId);

  await logAuditEvent(ctx, 'run_completed', {
    description: 'Run completed successfully',
    totalSteps: run.stepCount,
    finalRiskLevel: run.riskLevel,
  }, run.simulationId, run.id);

  return run;
}

// ============================================================================
// AUDIT LOG LISTING
// ============================================================================

export async function listAuditLogs(
  ctx: AIScenarioSimulationContext,
  query: {
    simulationId?: string;
    runId?: string;
    eventType?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ logs: AIScenarioAuditLogEntry[]; total: number }> {
  let dbQuery = ctx.supabase
    .from('ai_scenario_audit_log')
    .select('*', { count: 'exact' })
    .eq('org_id', ctx.orgId);

  if (query.simulationId) {
    dbQuery = dbQuery.eq('simulation_id', query.simulationId);
  }
  if (query.runId) {
    dbQuery = dbQuery.eq('run_id', query.runId);
  }
  if (query.eventType) {
    dbQuery = dbQuery.eq('event_type', query.eventType);
  }

  dbQuery = dbQuery.order('created_at', { ascending: false });

  const limit = query.limit || 100;
  const offset = query.offset || 0;
  dbQuery = dbQuery.range(offset, offset + limit - 1);

  const { data, error, count } = await dbQuery;

  if (error) throw new Error(`Failed to list audit logs: ${error.message}`);

  return {
    logs: (data || []).map(mapRowToAuditLog),
    total: count || 0,
  };
}
