/**
 * Scenario Simulation & Autonomous Playbook Orchestration Service (Sprint S67)
 * Backend service for scenario-based playbook simulation, orchestration, and execution
 */

import { SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import {
  ScenarioType,
  ScenarioPlaybookStatus,
  ScenarioTriggerType,
  ScenarioStepActionType,
  ScenarioRunStatus,
  ScenarioStepStatus,
  ScenarioRiskLevel,
  ScenarioEventType,
  ScenarioPlaybook,
  ScenarioPlaybookStep,
  Scenario,
  ScenarioRun,
  ScenarioRunStep,
  ScenarioAuditLogEntry,
  ScenarioParameters,
  ScenarioConstraints,
  ScenarioInitialState,
  ScenarioActionContext,
  ScenarioStepOutcome,
  ScenarioResultSummary,
  ScenarioRecommendation,
  ProjectedMetrics,
  SimulatedImpact,
  SimulationResult,
  CreateScenarioPlaybookInput,
  UpdateScenarioPlaybookInput,
  CreatePlaybookStepInput,
  UpdatePlaybookStepInput,
  ScenarioListPlaybooksQuery,
  ScenarioListPlaybooksResponse,
  PlaybookWithSteps,
  CreateScenarioInput,
  UpdateScenarioInput,
  ListScenariosQuery,
  ListScenariosResponse,
  ScenarioWithPlaybook,
  SimulateScenarioInput,
  StartScenarioRunInput,
  ListScenarioRunsQuery,
  ListScenarioRunsResponse,
  ApproveScenarioStepInput,
  CancelScenarioRunInput,
  ListScenarioAuditLogsQuery,
  ListScenarioAuditLogsResponse,
  RunWithDetails,
} from '@pravado/types';

// ============================================================================
// TYPES
// ============================================================================

export interface ServiceContext {
  supabase: SupabaseClient;
  orgId: string;
  userId: string;
}

interface DbPlaybook {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  category: string | null;
  status: string;
  trigger_type: string;
  target_systems: string[];
  risk_level: string;
  tags: string[];
  metadata: Record<string, unknown>;
  version: number;
  parent_playbook_id: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

interface DbPlaybookStep {
  id: string;
  org_id: string;
  playbook_id: string;
  step_index: number;
  name: string;
  description: string | null;
  action_type: string;
  action_payload: Record<string, unknown>;
  requires_approval: boolean;
  approval_roles: string[];
  wait_for_signals: boolean;
  signal_conditions: Record<string, unknown>;
  wait_duration_minutes: number | null;
  timeout_minutes: number | null;
  condition_expression: string | null;
  skip_on_failure: boolean;
  depends_on_steps: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface DbScenario {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  scenario_type: string;
  horizon_days: number;
  status: string;
  parameters: Record<string, unknown>;
  initial_state: Record<string, unknown>;
  default_playbook_id: string | null;
  constraints: Record<string, unknown>;
  tags: string[];
  metadata: Record<string, unknown>;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

interface DbScenarioRun {
  id: string;
  org_id: string;
  scenario_id: string;
  playbook_id: string | null;
  status: string;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  initial_state: Record<string, unknown>;
  current_state: Record<string, unknown>;
  result_summary: Record<string, unknown>;
  risk_score: number | null;
  opportunity_score: number | null;
  confidence_score: number | null;
  projected_metrics: Record<string, unknown>;
  narrative_summary: string | null;
  recommendations: unknown[];
  error_message: string | null;
  retry_count: number;
  started_by: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface DbScenarioRunStep {
  id: string;
  org_id: string;
  scenario_run_id: string;
  playbook_step_id: string;
  step_index: number;
  status: string;
  scheduled_at: string | null;
  ready_at: string | null;
  approved_at: string | null;
  executed_at: string | null;
  approved_by: string | null;
  approval_notes: string | null;
  execution_context: Record<string, unknown>;
  outcome: Record<string, unknown>;
  simulated_impact: Record<string, unknown>;
  error_message: string | null;
  retry_count: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface DbScenarioAuditLog {
  id: string;
  org_id: string;
  scenario_id: string | null;
  scenario_run_id: string | null;
  playbook_id: string | null;
  step_id: string | null;
  event_type: string;
  event_payload: Record<string, unknown>;
  actor_id: string | null;
  actor_email: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// ============================================================================
// MAPPERS
// ============================================================================

function mapDbPlaybook(row: DbPlaybook): ScenarioPlaybook {
  return {
    id: row.id,
    orgId: row.org_id,
    name: row.name,
    description: row.description,
    category: row.category,
    status: row.status as ScenarioPlaybookStatus,
    triggerType: row.trigger_type as ScenarioTriggerType,
    targetSystems: row.target_systems || [],
    riskLevel: row.risk_level as ScenarioRiskLevel,
    tags: row.tags || [],
    metadata: row.metadata || {},
    version: row.version,
    parentPlaybookId: row.parent_playbook_id,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDbPlaybookStep(row: DbPlaybookStep): ScenarioPlaybookStep {
  return {
    id: row.id,
    orgId: row.org_id,
    playbookId: row.playbook_id,
    stepIndex: row.step_index,
    name: row.name,
    description: row.description,
    actionType: row.action_type as ScenarioStepActionType,
    actionPayload: row.action_payload || {},
    requiresApproval: row.requires_approval,
    approvalRoles: row.approval_roles || [],
    waitForSignals: row.wait_for_signals,
    signalConditions: row.signal_conditions || {},
    waitDurationMinutes: row.wait_duration_minutes,
    timeoutMinutes: row.timeout_minutes,
    conditionExpression: row.condition_expression,
    skipOnFailure: row.skip_on_failure,
    dependsOnSteps: row.depends_on_steps || [],
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDbScenario(row: DbScenario): Scenario {
  return {
    id: row.id,
    orgId: row.org_id,
    name: row.name,
    description: row.description,
    scenarioType: row.scenario_type as ScenarioType,
    horizonDays: row.horizon_days,
    status: row.status as ScenarioRunStatus,
    parameters: row.parameters as ScenarioParameters,
    initialState: row.initial_state as ScenarioInitialState,
    defaultPlaybookId: row.default_playbook_id,
    constraints: row.constraints as ScenarioConstraints,
    tags: row.tags || [],
    metadata: row.metadata || {},
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDbScenarioRun(row: DbScenarioRun): ScenarioRun {
  return {
    id: row.id,
    orgId: row.org_id,
    scenarioId: row.scenario_id,
    playbookId: row.playbook_id,
    status: row.status as ScenarioRunStatus,
    scheduledAt: row.scheduled_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    initialState: row.initial_state as ScenarioInitialState,
    currentState: (row.current_state || {}) as Record<string, unknown>,
    resultSummary: (row.result_summary || {
      overallSuccess: false,
      stepsCompleted: 0,
      stepsTotal: 0,
      stepsFailed: 0,
      stepsSkipped: 0,
    }) as unknown as ScenarioResultSummary,
    riskScore: row.risk_score,
    opportunityScore: row.opportunity_score,
    confidenceScore: row.confidence_score,
    projectedMetrics: (row.projected_metrics || { days: [], metrics: {} }) as unknown as ProjectedMetrics,
    narrativeSummary: row.narrative_summary,
    recommendations: (row.recommendations || []) as ScenarioRecommendation[],
    errorMessage: row.error_message,
    retryCount: row.retry_count,
    startedBy: row.started_by,
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDbScenarioRunStep(row: DbScenarioRunStep): ScenarioRunStep {
  return {
    id: row.id,
    orgId: row.org_id,
    scenarioRunId: row.scenario_run_id,
    playbookStepId: row.playbook_step_id,
    stepIndex: row.step_index,
    status: row.status as ScenarioStepStatus,
    scheduledAt: row.scheduled_at,
    readyAt: row.ready_at,
    approvedAt: row.approved_at,
    executedAt: row.executed_at,
    approvedBy: row.approved_by,
    approvalNotes: row.approval_notes,
    executionContext: (row.execution_context || {}) as ScenarioActionContext,
    outcome: (row.outcome || { success: false, actionTaken: '' }) as unknown as ScenarioStepOutcome,
    simulatedImpact: (row.simulated_impact || {}) as SimulatedImpact,
    errorMessage: row.error_message,
    retryCount: row.retry_count,
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDbScenarioAuditLog(row: DbScenarioAuditLog): ScenarioAuditLogEntry {
  return {
    id: row.id,
    orgId: row.org_id,
    scenarioId: row.scenario_id,
    scenarioRunId: row.scenario_run_id,
    playbookId: row.playbook_id,
    stepId: row.step_id,
    eventType: row.event_type as ScenarioEventType,
    eventPayload: row.event_payload || {},
    actorId: row.actor_id,
    actorEmail: row.actor_email,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    createdAt: row.created_at,
  };
}

// ============================================================================
// OPENAI CLIENT
// ============================================================================

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  return new OpenAI({ apiKey });
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

async function logAuditEvent(
  ctx: ServiceContext,
  eventType: ScenarioEventType,
  options: {
    scenarioId?: string;
    scenarioRunId?: string;
    playbookId?: string;
    stepId?: string;
    payload?: Record<string, unknown>;
    email?: string;
  }
): Promise<void> {
  try {
    await ctx.supabase.from('scenario_audit_log').insert({
      org_id: ctx.orgId,
      event_type: eventType,
      scenario_id: options.scenarioId,
      scenario_run_id: options.scenarioRunId,
      playbook_id: options.playbookId,
      step_id: options.stepId,
      event_payload: options.payload || {},
      actor_id: ctx.userId,
      actor_email: options.email,
    });
  } catch (error) {
    console.error('Failed to log scenario audit event:', error);
  }
}

// ============================================================================
// PLAYBOOK OPERATIONS
// ============================================================================

export async function createPlaybook(
  ctx: ServiceContext,
  input: CreateScenarioPlaybookInput
): Promise<PlaybookWithSteps> {
  // Create playbook
  const { data: playbook, error } = await ctx.supabase
    .from('scenario_playbooks')
    .insert({
      org_id: ctx.orgId,
      name: input.name,
      description: input.description,
      category: input.category,
      trigger_type: input.triggerType || ScenarioTriggerType.MANUAL,
      target_systems: input.targetSystems || [],
      risk_level: input.riskLevel || ScenarioRiskLevel.MEDIUM,
      tags: input.tags || [],
      metadata: input.metadata || {},
      created_by: ctx.userId,
      updated_by: ctx.userId,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create playbook: ${error.message}`);

  const mappedPlaybook = mapDbPlaybook(playbook);
  let steps: ScenarioPlaybookStep[] = [];

  // Create steps if provided
  if (input.steps && input.steps.length > 0) {
    const stepInserts = input.steps.map((step, index) => ({
      org_id: ctx.orgId,
      playbook_id: playbook.id,
      step_index: index,
      name: step.name,
      description: step.description,
      action_type: step.actionType,
      action_payload: step.actionPayload || {},
      requires_approval: step.requiresApproval ?? false,
      approval_roles: step.approvalRoles || [],
      wait_for_signals: step.waitForSignals ?? false,
      signal_conditions: step.signalConditions || {},
      wait_duration_minutes: step.waitDurationMinutes,
      timeout_minutes: step.timeoutMinutes,
      condition_expression: step.conditionExpression,
      skip_on_failure: step.skipOnFailure ?? false,
      depends_on_steps: step.dependsOnSteps || [],
      metadata: step.metadata || {},
    }));

    const { data: stepsData, error: stepsError } = await ctx.supabase
      .from('scenario_playbook_steps')
      .insert(stepInserts)
      .select();

    if (stepsError) throw new Error(`Failed to create playbook steps: ${stepsError.message}`);

    steps = (stepsData || []).map(mapDbPlaybookStep);
  }

  await logAuditEvent(ctx, ScenarioEventType.PLAYBOOK_CREATED, {
    playbookId: playbook.id,
    payload: { name: input.name, stepsCount: steps.length },
  });

  return {
    ...mappedPlaybook,
    steps,
  };
}

export async function getPlaybook(
  ctx: ServiceContext,
  playbookId: string
): Promise<ScenarioPlaybook | null> {
  const { data, error } = await ctx.supabase
    .from('scenario_playbooks')
    .select('*')
    .eq('id', playbookId)
    .eq('org_id', ctx.orgId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to get playbook: ${error.message}`);
  }

  return mapDbPlaybook(data);
}

export async function getPlaybookWithSteps(
  ctx: ServiceContext,
  playbookId: string
): Promise<PlaybookWithSteps | null> {
  const playbook = await getPlaybook(ctx, playbookId);
  if (!playbook) return null;

  const { data: stepsData } = await ctx.supabase
    .from('scenario_playbook_steps')
    .select('*')
    .eq('playbook_id', playbookId)
    .eq('org_id', ctx.orgId)
    .order('step_index', { ascending: true });

  return {
    ...playbook,
    steps: (stepsData || []).map(mapDbPlaybookStep),
  };
}

export async function updatePlaybook(
  ctx: ServiceContext,
  playbookId: string,
  input: UpdateScenarioPlaybookInput
): Promise<ScenarioPlaybook> {
  const updateData: Record<string, unknown> = {
    updated_by: ctx.userId,
  };

  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.category !== undefined) updateData.category = input.category;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.triggerType !== undefined) updateData.trigger_type = input.triggerType;
  if (input.targetSystems !== undefined) updateData.target_systems = input.targetSystems;
  if (input.riskLevel !== undefined) updateData.risk_level = input.riskLevel;
  if (input.tags !== undefined) updateData.tags = input.tags;
  if (input.metadata !== undefined) updateData.metadata = input.metadata;

  const { data, error } = await ctx.supabase
    .from('scenario_playbooks')
    .update(updateData)
    .eq('id', playbookId)
    .eq('org_id', ctx.orgId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update playbook: ${error.message}`);

  await logAuditEvent(ctx, ScenarioEventType.PLAYBOOK_UPDATED, {
    playbookId,
    payload: input as Record<string, unknown>,
  });

  return mapDbPlaybook(data);
}

export async function deletePlaybook(ctx: ServiceContext, playbookId: string): Promise<void> {
  const { error } = await ctx.supabase
    .from('scenario_playbooks')
    .delete()
    .eq('id', playbookId)
    .eq('org_id', ctx.orgId);

  if (error) throw new Error(`Failed to delete playbook: ${error.message}`);

  await logAuditEvent(ctx, ScenarioEventType.PLAYBOOK_ARCHIVED, {
    playbookId,
  });
}

export async function listPlaybooks(
  ctx: ServiceContext,
  input: ScenarioListPlaybooksQuery
): Promise<ScenarioListPlaybooksResponse> {
  let query = ctx.supabase.from('scenario_playbooks').select('*', { count: 'exact' });

  query = query.eq('org_id', ctx.orgId);

  if (input.status) {
    query = query.eq('status', input.status);
  }
  if (input.triggerType) {
    query = query.eq('trigger_type', input.triggerType);
  }
  if (input.riskLevel) {
    query = query.eq('risk_level', input.riskLevel);
  }
  if (input.category) {
    query = query.eq('category', input.category);
  }
  if (input.search) {
    query = query.or(`name.ilike.%${input.search}%,description.ilike.%${input.search}%`);
  }
  if (input.tags && input.tags.length > 0) {
    query = query.overlaps('tags', input.tags);
  }

  const sortColumn =
    input.sortBy === 'name'
      ? 'name'
      : input.sortBy === 'risk_level'
        ? 'risk_level'
        : input.sortBy === 'updated_at'
          ? 'updated_at'
          : 'created_at';

  query = query
    .order(sortColumn, { ascending: input.sortOrder === 'asc' })
    .range(input.offset || 0, (input.offset || 0) + (input.limit || 20) - 1);

  const { data, error, count } = await query;

  if (error) throw new Error(`Failed to list playbooks: ${error.message}`);

  return {
    playbooks: (data || []).map(mapDbPlaybook),
    total: count || 0,
    limit: input.limit || 20,
    offset: input.offset || 0,
  };
}

export async function activatePlaybook(
  ctx: ServiceContext,
  playbookId: string
): Promise<ScenarioPlaybook> {
  const result = await updatePlaybook(ctx, playbookId, {
    status: ScenarioPlaybookStatus.ACTIVE,
  });

  await logAuditEvent(ctx, ScenarioEventType.PLAYBOOK_ACTIVATED, {
    playbookId,
  });

  return result;
}

export async function archivePlaybook(
  ctx: ServiceContext,
  playbookId: string
): Promise<ScenarioPlaybook> {
  return updatePlaybook(ctx, playbookId, {
    status: ScenarioPlaybookStatus.ARCHIVED,
  });
}

// ============================================================================
// PLAYBOOK STEP OPERATIONS
// ============================================================================

export async function addPlaybookStep(
  ctx: ServiceContext,
  playbookId: string,
  input: CreatePlaybookStepInput,
  insertAtIndex?: number
): Promise<ScenarioPlaybookStep> {
  // Get current max step index
  const { data: existingSteps } = await ctx.supabase
    .from('scenario_playbook_steps')
    .select('step_index')
    .eq('playbook_id', playbookId)
    .eq('org_id', ctx.orgId)
    .order('step_index', { ascending: false })
    .limit(1);

  const maxIndex = existingSteps?.[0]?.step_index ?? -1;
  const targetIndex = insertAtIndex !== undefined ? insertAtIndex : maxIndex + 1;

  // If inserting in the middle, shift existing steps
  if (insertAtIndex !== undefined && insertAtIndex <= maxIndex) {
    await ctx.supabase.rpc('increment_step_indices', {
      p_playbook_id: playbookId,
      p_from_index: insertAtIndex,
    });
  }

  const { data, error } = await ctx.supabase
    .from('scenario_playbook_steps')
    .insert({
      org_id: ctx.orgId,
      playbook_id: playbookId,
      step_index: targetIndex,
      name: input.name,
      description: input.description,
      action_type: input.actionType,
      action_payload: input.actionPayload || {},
      requires_approval: input.requiresApproval ?? false,
      approval_roles: input.approvalRoles || [],
      wait_for_signals: input.waitForSignals ?? false,
      signal_conditions: input.signalConditions || {},
      wait_duration_minutes: input.waitDurationMinutes,
      timeout_minutes: input.timeoutMinutes,
      condition_expression: input.conditionExpression,
      skip_on_failure: input.skipOnFailure ?? false,
      depends_on_steps: input.dependsOnSteps || [],
      metadata: input.metadata || {},
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to add playbook step: ${error.message}`);

  return mapDbPlaybookStep(data);
}

export async function updatePlaybookStep(
  ctx: ServiceContext,
  stepId: string,
  input: UpdatePlaybookStepInput
): Promise<ScenarioPlaybookStep> {
  const updateData: Record<string, unknown> = {};

  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.actionType !== undefined) updateData.action_type = input.actionType;
  if (input.actionPayload !== undefined) updateData.action_payload = input.actionPayload;
  if (input.requiresApproval !== undefined) updateData.requires_approval = input.requiresApproval;
  if (input.approvalRoles !== undefined) updateData.approval_roles = input.approvalRoles;
  if (input.waitForSignals !== undefined) updateData.wait_for_signals = input.waitForSignals;
  if (input.signalConditions !== undefined) updateData.signal_conditions = input.signalConditions;
  if (input.waitDurationMinutes !== undefined)
    updateData.wait_duration_minutes = input.waitDurationMinutes;
  if (input.timeoutMinutes !== undefined) updateData.timeout_minutes = input.timeoutMinutes;
  if (input.conditionExpression !== undefined)
    updateData.condition_expression = input.conditionExpression;
  if (input.skipOnFailure !== undefined) updateData.skip_on_failure = input.skipOnFailure;
  if (input.dependsOnSteps !== undefined) updateData.depends_on_steps = input.dependsOnSteps;
  if (input.metadata !== undefined) updateData.metadata = input.metadata;

  const { data, error } = await ctx.supabase
    .from('scenario_playbook_steps')
    .update(updateData)
    .eq('id', stepId)
    .eq('org_id', ctx.orgId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update playbook step: ${error.message}`);

  return mapDbPlaybookStep(data);
}

export async function deletePlaybookStep(ctx: ServiceContext, stepId: string): Promise<void> {
  const { error } = await ctx.supabase
    .from('scenario_playbook_steps')
    .delete()
    .eq('id', stepId)
    .eq('org_id', ctx.orgId);

  if (error) throw new Error(`Failed to delete playbook step: ${error.message}`);
}

export async function reorderPlaybookSteps(
  ctx: ServiceContext,
  playbookId: string,
  stepOrder: string[]
): Promise<ScenarioPlaybookStep[]> {
  // Update each step with its new index
  for (let i = 0; i < stepOrder.length; i++) {
    await ctx.supabase
      .from('scenario_playbook_steps')
      .update({ step_index: i })
      .eq('id', stepOrder[i])
      .eq('playbook_id', playbookId)
      .eq('org_id', ctx.orgId);
  }

  // Fetch updated steps
  const { data } = await ctx.supabase
    .from('scenario_playbook_steps')
    .select('*')
    .eq('playbook_id', playbookId)
    .eq('org_id', ctx.orgId)
    .order('step_index', { ascending: true });

  return (data || []).map(mapDbPlaybookStep);
}

// ============================================================================
// SCENARIO OPERATIONS
// ============================================================================

export async function createScenario(
  ctx: ServiceContext,
  input: CreateScenarioInput
): Promise<Scenario> {
  // Capture initial state from unified graph if available
  const initialState = await captureInitialState(ctx);

  const { data, error } = await ctx.supabase
    .from('scenarios')
    .insert({
      org_id: ctx.orgId,
      name: input.name,
      description: input.description,
      scenario_type: input.scenarioType,
      horizon_days: input.horizonDays || 30,
      parameters: input.parameters || {},
      initial_state: initialState,
      default_playbook_id: input.defaultPlaybookId,
      constraints: input.constraints || {},
      tags: input.tags || [],
      metadata: input.metadata || {},
      created_by: ctx.userId,
      updated_by: ctx.userId,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create scenario: ${error.message}`);

  await logAuditEvent(ctx, ScenarioEventType.SCENARIO_CREATED, {
    scenarioId: data.id,
    payload: { name: input.name, type: input.scenarioType },
  });

  return mapDbScenario(data);
}

export async function getScenario(
  ctx: ServiceContext,
  scenarioId: string
): Promise<Scenario | null> {
  const { data, error } = await ctx.supabase
    .from('scenarios')
    .select('*')
    .eq('id', scenarioId)
    .eq('org_id', ctx.orgId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to get scenario: ${error.message}`);
  }

  return mapDbScenario(data);
}

export async function getScenarioWithPlaybook(
  ctx: ServiceContext,
  scenarioId: string
): Promise<ScenarioWithPlaybook | null> {
  const scenario = await getScenario(ctx, scenarioId);
  if (!scenario) return null;

  let defaultPlaybook: ScenarioPlaybook | null = null;
  if (scenario.defaultPlaybookId) {
    const playbook = await getPlaybookWithSteps(ctx, scenario.defaultPlaybookId);
    if (playbook) {
      defaultPlaybook = playbook;
    }
  }

  return {
    ...scenario,
    defaultPlaybook,
  };
}

export async function updateScenario(
  ctx: ServiceContext,
  scenarioId: string,
  input: UpdateScenarioInput
): Promise<Scenario> {
  const updateData: Record<string, unknown> = {
    updated_by: ctx.userId,
  };

  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.scenarioType !== undefined) updateData.scenario_type = input.scenarioType;
  if (input.horizonDays !== undefined) updateData.horizon_days = input.horizonDays;
  if (input.parameters !== undefined) updateData.parameters = input.parameters;
  if (input.constraints !== undefined) updateData.constraints = input.constraints;
  if (input.defaultPlaybookId !== undefined)
    updateData.default_playbook_id = input.defaultPlaybookId;
  if (input.tags !== undefined) updateData.tags = input.tags;
  if (input.metadata !== undefined) updateData.metadata = input.metadata;

  const { data, error } = await ctx.supabase
    .from('scenarios')
    .update(updateData)
    .eq('id', scenarioId)
    .eq('org_id', ctx.orgId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update scenario: ${error.message}`);

  await logAuditEvent(ctx, ScenarioEventType.SCENARIO_UPDATED, {
    scenarioId,
    payload: input as Record<string, unknown>,
  });

  return mapDbScenario(data);
}

export async function deleteScenario(ctx: ServiceContext, scenarioId: string): Promise<void> {
  const { error } = await ctx.supabase
    .from('scenarios')
    .delete()
    .eq('id', scenarioId)
    .eq('org_id', ctx.orgId);

  if (error) throw new Error(`Failed to delete scenario: ${error.message}`);
}

export async function listScenarios(
  ctx: ServiceContext,
  input: ListScenariosQuery
): Promise<ListScenariosResponse> {
  let query = ctx.supabase.from('scenarios').select('*', { count: 'exact' });

  query = query.eq('org_id', ctx.orgId);

  if (input.scenarioType) {
    query = query.eq('scenario_type', input.scenarioType);
  }
  if (input.status) {
    query = query.eq('status', input.status);
  }
  if (input.search) {
    query = query.or(`name.ilike.%${input.search}%,description.ilike.%${input.search}%`);
  }
  if (input.tags && input.tags.length > 0) {
    query = query.overlaps('tags', input.tags);
  }
  if (input.playbookId) {
    query = query.eq('default_playbook_id', input.playbookId);
  }

  const sortColumn =
    input.sortBy === 'name'
      ? 'name'
      : input.sortBy === 'horizon_days'
        ? 'horizon_days'
        : input.sortBy === 'updated_at'
          ? 'updated_at'
          : 'created_at';

  query = query
    .order(sortColumn, { ascending: input.sortOrder === 'asc' })
    .range(input.offset || 0, (input.offset || 0) + (input.limit || 20) - 1);

  const { data, error, count } = await query;

  if (error) throw new Error(`Failed to list scenarios: ${error.message}`);

  return {
    scenarios: (data || []).map(mapDbScenario),
    total: count || 0,
    limit: input.limit || 20,
    offset: input.offset || 0,
  };
}

// ============================================================================
// SIMULATION
// ============================================================================

async function captureInitialState(ctx: ServiceContext): Promise<ScenarioInitialState> {
  // Try to get graph context from S66 unified intelligence graph
  try {
    const { data: graphStats } = await ctx.supabase.rpc('get_graph_summary', {
      p_org_id: ctx.orgId,
    });

    // Get recent metrics from various sources
    const { data: reputationData } = await ctx.supabase
      .from('brand_reputation_scores')
      .select('overall_score, sentiment_score')
      .eq('org_id', ctx.orgId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const { data: mediaData } = await ctx.supabase
      .from('media_performance_metrics')
      .select('*')
      .eq('org_id', ctx.orgId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return {
      graphContext: graphStats || {},
      metricsSnapshot: {
        sentimentScore: reputationData?.sentiment_score || 0,
        reputationScore: reputationData?.overall_score || 0,
        coverageVolume: mediaData?.total_coverage || 0,
        engagementRate: mediaData?.engagement_rate || 0,
      },
      capturedAt: new Date().toISOString(),
    };
  } catch {
    // Return empty state if graph/metrics not available
    return {
      graphContext: {},
      metricsSnapshot: {},
      capturedAt: new Date().toISOString(),
    };
  }
}

export async function simulateScenario(
  ctx: ServiceContext,
  input: SimulateScenarioInput
): Promise<SimulationResult> {
  const scenario = await getScenario(ctx, input.scenarioId);
  if (!scenario) throw new Error('Scenario not found');

  const playbookId = input.playbookId || scenario.defaultPlaybookId;
  let playbook: PlaybookWithSteps | null = null;

  if (playbookId) {
    playbook = await getPlaybookWithSteps(ctx, playbookId);
  }

  // Merge parameters
  const parameters = {
    ...scenario.parameters,
    ...input.overrideParameters,
  };

  // Capture current state for simulation
  const initialState = input.includeGraphContext !== false ? await captureInitialState(ctx) : {};

  // Build simulation context
  const simulationContext = buildSimulationContext(scenario, parameters, initialState);

  // Run LLM-powered simulation
  const openai = getOpenAIClient();

  const prompt = buildSimulationPrompt(scenario, playbook, parameters, simulationContext);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response from LLM');

    const result = JSON.parse(content);

    // Build projected metrics timeline
    const projectedMetrics = buildProjectedMetrics(
      scenario.horizonDays,
      parameters,
      result.metricImpacts || {}
    );

    // Log simulation
    await logAuditEvent(ctx, ScenarioEventType.SCENARIO_SIMULATED, {
      scenarioId: scenario.id,
      playbookId: playbookId || undefined,
      payload: {
        parameters,
        riskScore: result.riskScore,
        opportunityScore: result.opportunityScore,
      },
    });

    return {
      scenarioId: scenario.id,
      playbookId,
      simulationId: `sim_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      initialState: scenario.initialState || {},
      simulatedImpact: {
        riskScoreChange: result.riskScore ? result.riskScore - 50 : 0,
        reputationScoreChange: result.opportunityScore ? result.opportunityScore - 50 : 0,
      },
      riskScore: result.riskScore || 0,
      opportunityScore: result.opportunityScore || 0,
      confidenceScore: result.confidenceScore || 0.7,
      projectedMetrics,
      narrativeSummary: result.narrativeSummary || '',
      recommendations: result.recommendations || [],
      stepPreviews: playbook
        ? buildStepPreviews(playbook.steps, result.stepOutcomes || [])
        : [],
      simulatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Simulation failed:', error);
    throw new Error(`Simulation failed: ${error}`);
  }
}

function buildSimulationContext(
  scenario: Scenario,
  parameters: ScenarioParameters,
  initialState: ScenarioInitialState
): Record<string, unknown> {
  return {
    scenarioType: scenario.scenarioType,
    horizonDays: scenario.horizonDays,
    parameters,
    initialState,
    constraints: scenario.constraints,
  };
}

function buildSimulationPrompt(
  scenario: Scenario,
  playbook: PlaybookWithSteps | null,
  parameters: ScenarioParameters,
  context: Record<string, unknown>
): string {
  const playbookSection = playbook
    ? `
Playbook: ${playbook.name}
Steps:
${playbook.steps.map((s, i) => `${i + 1}. ${s.name} (${s.actionType}): ${s.description || 'No description'}`).join('\n')}
`
    : 'No playbook assigned.';

  return `You are a strategic PR and communications simulation engine. Analyze the following scenario and provide a detailed simulation result.

Scenario: ${scenario.name}
Type: ${scenario.scenarioType}
Description: ${scenario.description || 'No description'}
Simulation Horizon: ${scenario.horizonDays} days

Parameters:
${JSON.stringify(parameters, null, 2)}

Initial State:
${JSON.stringify(context, null, 2)}

${playbookSection}

Constraints:
${JSON.stringify(scenario.constraints, null, 2)}

Provide a JSON response with:
{
  "riskScore": <0-100 number>,
  "opportunityScore": <0-100 number>,
  "confidenceScore": <0-1 number>,
  "narrativeSummary": "<2-3 paragraph narrative of projected outcomes>",
  "metricImpacts": {
    "sentimentChange": <-100 to 100>,
    "coverageChange": <percentage change>,
    "reputationChange": <-100 to 100>,
    "engagementChange": <percentage change>
  },
  "recommendations": [
    {
      "priority": "high|medium|low",
      "action": "<recommended action>",
      "rationale": "<why this is recommended>",
      "expectedImpact": "<expected outcome>"
    }
  ],
  "stepOutcomes": [
    {
      "stepIndex": <number>,
      "predictedOutcome": "<what would likely happen>",
      "riskLevel": "low|medium|high|critical",
      "estimatedImpact": "<metrics impact description>"
    }
  ]
}`;
}

function buildProjectedMetrics(
  horizonDays: number,
  _parameters: ScenarioParameters,
  metricImpacts: Record<string, number>
): ProjectedMetrics {
  const timeline: ProjectedMetrics['timeline'] = [];
  const intervalDays = Math.max(1, Math.floor(horizonDays / 10));

  for (let day = 0; day <= horizonDays; day += intervalDays) {
    const progress = day / horizonDays;
    const sentimentDelta = (metricImpacts.sentimentChange || 0) * progress;
    const coverageDelta = (metricImpacts.coverageChange || 0) * progress;

    timeline.push({
      day,
      sentimentProjected: Math.max(-100, Math.min(100, sentimentDelta)),
      coverageProjected: coverageDelta,
      riskLevel:
        sentimentDelta < -20
          ? ScenarioRiskLevel.HIGH
          : sentimentDelta < -10
            ? ScenarioRiskLevel.MEDIUM
            : ScenarioRiskLevel.LOW,
    });
  }

  return {
    days: timeline.map(t => t.day),
    metrics: {
      sentimentScore: timeline.map(t => t.sentimentProjected),
      coverageVolume: timeline.map(t => t.coverageProjected),
    },
    horizonDays,
    timeline,
  };
}

function buildStepPreviews(
  steps: ScenarioPlaybookStep[],
  stepOutcomes: Array<{
    stepIndex: number;
    predictedOutcome: string;
    riskLevel: string;
    estimatedImpact: string;
  }>
): SimulationResult['stepPreviews'] {
  return steps.map((step, index) => {
    const outcome = stepOutcomes.find((o) => o.stepIndex === index);
    return {
      stepId: step.id,
      stepName: step.name,
      actionType: step.actionType,
      predictedOutcome: outcome?.predictedOutcome || 'Outcome not predicted',
      riskLevel: (outcome?.riskLevel as ScenarioRiskLevel) || ScenarioRiskLevel.LOW,
      estimatedImpact: outcome?.estimatedImpact || 'Impact not estimated',
    };
  });
}

// ============================================================================
// RUN OPERATIONS
// ============================================================================

export async function startScenarioRun(
  ctx: ServiceContext,
  input: StartScenarioRunInput
): Promise<RunWithDetails> {
  const scenario = await getScenario(ctx, input.scenarioId);
  if (!scenario) throw new Error('Scenario not found');

  const playbookId = input.playbookId || scenario.defaultPlaybookId;
  if (!playbookId) throw new Error('No playbook specified for this run');

  const playbook = await getPlaybookWithSteps(ctx, playbookId);
  if (!playbook) throw new Error('Playbook not found');

  // Merge parameters
  const parameters = {
    ...scenario.parameters,
    ...input.overrideParameters,
  };

  // Capture initial state
  const initialState = await captureInitialState(ctx);

  // Create the run
  const { data: runData, error: runError } = await ctx.supabase
    .from('scenario_runs')
    .insert({
      org_id: ctx.orgId,
      scenario_id: input.scenarioId,
      playbook_id: playbookId,
      status: input.scheduledAt ? ScenarioRunStatus.PENDING : ScenarioRunStatus.INITIALIZING,
      scheduled_at: input.scheduledAt,
      started_at: input.scheduledAt ? null : new Date().toISOString(),
      initial_state: initialState,
      current_state: initialState,
      started_by: ctx.userId,
      metadata: input.metadata || {},
    })
    .select()
    .single();

  if (runError) throw new Error(`Failed to create scenario run: ${runError.message}`);

  // Create run steps from playbook steps
  const stepInserts = playbook.steps.map((step) => ({
    org_id: ctx.orgId,
    scenario_run_id: runData.id,
    playbook_step_id: step.id,
    step_index: step.stepIndex,
    status: ScenarioStepStatus.PENDING,
    execution_context: { parameters },
    metadata: {},
  }));

  const { data: stepsData, error: stepsError } = await ctx.supabase
    .from('scenario_run_steps')
    .insert(stepInserts)
    .select();

  if (stepsError) throw new Error(`Failed to create run steps: ${stepsError.message}`);

  await logAuditEvent(ctx, ScenarioEventType.RUN_STARTED, {
    scenarioId: input.scenarioId,
    scenarioRunId: runData.id,
    playbookId,
    payload: { stepsCount: playbook.steps.length, scheduled: !!input.scheduledAt },
  });

  // If not scheduled, begin execution
  if (!input.scheduledAt) {
    await advanceRun(ctx, runData.id);
  }

  return {
    ...mapDbScenarioRun(runData),
    scenario,
    playbook,
    steps: (stepsData || []).map(mapDbScenarioRunStep),
    playbookSteps: playbook.steps,
  };
}

export async function getScenarioRun(
  ctx: ServiceContext,
  runId: string
): Promise<ScenarioRun | null> {
  const { data, error } = await ctx.supabase
    .from('scenario_runs')
    .select('*')
    .eq('id', runId)
    .eq('org_id', ctx.orgId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to get scenario run: ${error.message}`);
  }

  return mapDbScenarioRun(data);
}

export async function getRunWithDetails(
  ctx: ServiceContext,
  runId: string
): Promise<RunWithDetails | null> {
  const run = await getScenarioRun(ctx, runId);
  if (!run) return null;

  const scenario = await getScenario(ctx, run.scenarioId);
  if (!scenario) return null; // Can't return details without scenario

  const playbook = run.playbookId ? await getPlaybookWithSteps(ctx, run.playbookId) : null;

  const { data: stepsData } = await ctx.supabase
    .from('scenario_run_steps')
    .select('*')
    .eq('scenario_run_id', runId)
    .eq('org_id', ctx.orgId)
    .order('step_index', { ascending: true });

  return {
    ...run,
    scenario,
    playbook,
    steps: (stepsData || []).map(mapDbScenarioRunStep),
    playbookSteps: playbook?.steps || [],
  };
}

export async function listScenarioRuns(
  ctx: ServiceContext,
  input: ListScenarioRunsQuery
): Promise<ListScenarioRunsResponse> {
  let query = ctx.supabase.from('scenario_runs').select('*', { count: 'exact' });

  query = query.eq('org_id', ctx.orgId);

  if (input.scenarioId) {
    query = query.eq('scenario_id', input.scenarioId);
  }
  if (input.playbookId) {
    query = query.eq('playbook_id', input.playbookId);
  }
  if (input.status) {
    query = query.eq('status', input.status);
  }
  if (input.startedAfter) {
    query = query.gte('started_at', input.startedAfter);
  }
  if (input.startedBefore) {
    query = query.lte('started_at', input.startedBefore);
  }

  const sortColumn =
    input.sortBy === 'completed_at'
      ? 'completed_at'
      : input.sortBy === 'risk_score'
        ? 'risk_score'
        : input.sortBy === 'opportunity_score'
          ? 'opportunity_score'
          : 'started_at';

  query = query
    .order(sortColumn, { ascending: input.sortOrder === 'asc', nullsFirst: false })
    .range(input.offset || 0, (input.offset || 0) + (input.limit || 20) - 1);

  const { data, error, count } = await query;

  if (error) throw new Error(`Failed to list scenario runs: ${error.message}`);

  return {
    runs: (data || []).map(mapDbScenarioRun),
    total: count || 0,
    limit: input.limit || 20,
    offset: input.offset || 0,
  };
}

export async function pauseScenarioRun(ctx: ServiceContext, runId: string): Promise<ScenarioRun> {
  const { data, error } = await ctx.supabase
    .from('scenario_runs')
    .update({ status: ScenarioRunStatus.PAUSED })
    .eq('id', runId)
    .eq('org_id', ctx.orgId)
    .select()
    .single();

  if (error) throw new Error(`Failed to pause run: ${error.message}`);

  await logAuditEvent(ctx, ScenarioEventType.RUN_PAUSED, {
    scenarioRunId: runId,
  });

  return mapDbScenarioRun(data);
}

export async function resumeScenarioRun(ctx: ServiceContext, runId: string): Promise<ScenarioRun> {
  const { data, error } = await ctx.supabase
    .from('scenario_runs')
    .update({ status: ScenarioRunStatus.RUNNING })
    .eq('id', runId)
    .eq('org_id', ctx.orgId)
    .select()
    .single();

  if (error) throw new Error(`Failed to resume run: ${error.message}`);

  await logAuditEvent(ctx, ScenarioEventType.RUN_RESUMED, {
    scenarioRunId: runId,
  });

  // Continue execution
  await advanceRun(ctx, runId);

  return mapDbScenarioRun(data);
}

export async function cancelScenarioRun(
  ctx: ServiceContext,
  input: CancelScenarioRunInput
): Promise<ScenarioRun> {
  const { data, error } = await ctx.supabase
    .from('scenario_runs')
    .update({
      status: ScenarioRunStatus.CANCELLED,
      completed_at: new Date().toISOString(),
      error_message: input.reason,
    })
    .eq('id', input.runId)
    .eq('org_id', ctx.orgId)
    .select()
    .single();

  if (error) throw new Error(`Failed to cancel run: ${error.message}`);

  // Cancel all pending steps
  await ctx.supabase
    .from('scenario_run_steps')
    .update({ status: ScenarioStepStatus.CANCELLED })
    .eq('scenario_run_id', input.runId)
    .eq('org_id', ctx.orgId)
    .in('status', [ScenarioStepStatus.PENDING, ScenarioStepStatus.READY]);

  await logAuditEvent(ctx, ScenarioEventType.RUN_CANCELLED, {
    scenarioRunId: input.runId,
    payload: { reason: input.reason },
  });

  return mapDbScenarioRun(data);
}

// ============================================================================
// STEP EXECUTION & APPROVAL
// ============================================================================

async function advanceRun(ctx: ServiceContext, runId: string): Promise<void> {
  const run = await getScenarioRun(ctx, runId);
  if (!run || run.status !== ScenarioRunStatus.RUNNING && run.status !== ScenarioRunStatus.INITIALIZING) {
    return;
  }

  // Update status to running if initializing
  if (run.status === ScenarioRunStatus.INITIALIZING) {
    await ctx.supabase
      .from('scenario_runs')
      .update({ status: ScenarioRunStatus.RUNNING })
      .eq('id', runId);
  }

  // Get all steps for this run
  const { data: stepsData } = await ctx.supabase
    .from('scenario_run_steps')
    .select('*, scenario_playbook_steps(*)')
    .eq('scenario_run_id', runId)
    .eq('org_id', ctx.orgId)
    .order('step_index', { ascending: true });

  const steps = stepsData || [];
  const executedStepIds = new Set(
    steps.filter((s) => s.status === ScenarioStepStatus.EXECUTED).map((s) => s.playbook_step_id)
  );

  // Find next step(s) that can be executed
  for (const step of steps) {
    if (step.status !== ScenarioStepStatus.PENDING) continue;

    const playbookStep = step.scenario_playbook_steps;
    if (!playbookStep) continue;

    // Check dependencies
    const deps = playbookStep.depends_on_steps || [];
    const allDepsExecuted = deps.every((depId: string) => executedStepIds.has(depId));
    if (!allDepsExecuted) continue;

    // Check condition expression if present
    if (playbookStep.condition_expression) {
      const conditionMet = evaluateCondition(playbookStep.condition_expression, run.currentState);
      if (!conditionMet) {
        // Skip this step
        await ctx.supabase
          .from('scenario_run_steps')
          .update({ status: ScenarioStepStatus.SKIPPED })
          .eq('id', step.id);

        await logAuditEvent(ctx, ScenarioEventType.STEP_SKIPPED, {
          scenarioRunId: runId,
          stepId: step.id,
          payload: { reason: 'condition_not_met' },
        });

        continue;
      }
    }

    // Mark step as ready
    await ctx.supabase
      .from('scenario_run_steps')
      .update({
        status: ScenarioStepStatus.READY,
        ready_at: new Date().toISOString(),
      })
      .eq('id', step.id);

    await logAuditEvent(ctx, ScenarioEventType.STEP_READY, {
      scenarioRunId: runId,
      stepId: step.id,
    });

    // If requires approval, update run status and wait
    if (playbookStep.requires_approval) {
      await ctx.supabase
        .from('scenario_runs')
        .update({ status: ScenarioRunStatus.AWAITING_APPROVAL })
        .eq('id', runId);
      return;
    }

    // Otherwise, execute immediately
    await executeStep(ctx, runId, step.id);
  }

  // Check if all steps are done
  const { data: remainingSteps } = await ctx.supabase
    .from('scenario_run_steps')
    .select('id')
    .eq('scenario_run_id', runId)
    .eq('org_id', ctx.orgId)
    .in('status', [ScenarioStepStatus.PENDING, ScenarioStepStatus.READY, ScenarioStepStatus.EXECUTING]);

  if (!remainingSteps || remainingSteps.length === 0) {
    await completeRun(ctx, runId);
  }
}

function evaluateCondition(expression: string, state: ScenarioInitialState): boolean {
  // Simple condition evaluator
  // In production, use a proper expression parser
  try {
    // Very basic: check if expression references state properties
    if (expression.includes('sentimentScore')) {
      const threshold = parseFloat(expression.match(/[<>=]+\s*(-?\d+\.?\d*)/)?.[1] || '0');
      const value = (state.metricsSnapshot?.sentimentScore as number) || 0;
      if (expression.includes('>=')) return value >= threshold;
      if (expression.includes('<=')) return value <= threshold;
      if (expression.includes('>')) return value > threshold;
      if (expression.includes('<')) return value < threshold;
      return value === threshold;
    }
    return true; // Default to true if we can't evaluate
  } catch {
    return true;
  }
}

async function executeStep(ctx: ServiceContext, runId: string, stepId: string): Promise<void> {
  // Get step with playbook step details
  const { data: stepData } = await ctx.supabase
    .from('scenario_run_steps')
    .select('*, scenario_playbook_steps(*)')
    .eq('id', stepId)
    .eq('org_id', ctx.orgId)
    .single();

  if (!stepData) return;

  const playbookStep = stepData.scenario_playbook_steps;

  // Mark as executing
  await ctx.supabase
    .from('scenario_run_steps')
    .update({ status: ScenarioStepStatus.EXECUTING })
    .eq('id', stepId);

  try {
    // Simulate step execution based on action type
    const outcome = await simulateStepExecution(ctx, playbookStep, stepData.execution_context);

    // Mark as executed
    await ctx.supabase
      .from('scenario_run_steps')
      .update({
        status: ScenarioStepStatus.EXECUTED,
        executed_at: new Date().toISOString(),
        outcome,
        simulated_impact: outcome.simulatedImpact || {},
      })
      .eq('id', stepId);

    await logAuditEvent(ctx, ScenarioEventType.STEP_EXECUTED, {
      scenarioRunId: runId,
      stepId,
      payload: { actionType: playbookStep.action_type },
    });

    // Continue advancing the run
    await advanceRun(ctx, runId);
  } catch (error) {
    const errorMessage = String(error);

    if (playbookStep.skip_on_failure) {
      await ctx.supabase
        .from('scenario_run_steps')
        .update({
          status: ScenarioStepStatus.SKIPPED,
          error_message: errorMessage,
        })
        .eq('id', stepId);

      await logAuditEvent(ctx, ScenarioEventType.STEP_SKIPPED, {
        scenarioRunId: runId,
        stepId,
        payload: { reason: 'execution_failed', error: errorMessage },
      });

      await advanceRun(ctx, runId);
    } else {
      await ctx.supabase
        .from('scenario_run_steps')
        .update({
          status: ScenarioStepStatus.FAILED,
          error_message: errorMessage,
        })
        .eq('id', stepId);

      await logAuditEvent(ctx, ScenarioEventType.STEP_FAILED, {
        scenarioRunId: runId,
        stepId,
        payload: { error: errorMessage },
      });

      // Fail the run
      await ctx.supabase
        .from('scenario_runs')
        .update({
          status: ScenarioRunStatus.FAILED,
          completed_at: new Date().toISOString(),
          error_message: `Step "${playbookStep.name}" failed: ${errorMessage}`,
        })
        .eq('id', runId);

      await logAuditEvent(ctx, ScenarioEventType.RUN_FAILED, {
        scenarioRunId: runId,
        payload: { failedStepId: stepId, error: errorMessage },
      });
    }
  }
}

async function simulateStepExecution(
  _ctx: ServiceContext,
  playbookStep: DbPlaybookStep,
  executionContext: Record<string, unknown>
): Promise<Record<string, unknown>> {
  // Use LLM to simulate the step outcome
  const openai = getOpenAIClient();

  const prompt = `Simulate the execution of this PR/communications action step:

Step: ${playbookStep.name}
Action Type: ${playbookStep.action_type}
Description: ${playbookStep.description || 'No description'}
Action Payload: ${JSON.stringify(playbookStep.action_payload, null, 2)}
Execution Context: ${JSON.stringify(executionContext, null, 2)}

Provide a JSON response with:
{
  "success": true/false,
  "outcome": "<description of what happened>",
  "simulatedImpact": {
    "sentimentDelta": <-10 to 10>,
    "coverageDelta": <percentage change>,
    "engagementDelta": <percentage change>
  },
  "notes": ["any relevant observations"]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response from LLM');

    return JSON.parse(content);
  } catch (error) {
    console.error('Step simulation failed:', error);
    return {
      success: true,
      outcome: 'Step executed (simulation unavailable)',
      simulatedImpact: {},
      notes: ['LLM simulation failed, using default outcome'],
    };
  }
}

async function completeRun(ctx: ServiceContext, runId: string): Promise<void> {
  // Get all executed steps and aggregate results
  const { data: stepsData } = await ctx.supabase
    .from('scenario_run_steps')
    .select('*')
    .eq('scenario_run_id', runId)
    .eq('org_id', ctx.orgId);

  const steps = stepsData || [];
  const executedSteps = steps.filter((s) => s.status === ScenarioStepStatus.EXECUTED);
  const failedSteps = steps.filter((s) => s.status === ScenarioStepStatus.FAILED);

  // Aggregate simulated impacts
  let totalSentimentDelta = 0;
  let totalCoverageDelta = 0;

  for (const step of executedSteps) {
    const impact = step.simulated_impact as SimulatedImpact;
    totalSentimentDelta += impact?.sentimentDelta || 0;
    totalCoverageDelta += impact?.coverageDelta || 0;
  }

  // Calculate scores
  const riskScore = failedSteps.length > 0 ? 50 + failedSteps.length * 10 : Math.max(0, -totalSentimentDelta * 2);
  const opportunityScore = Math.max(0, totalSentimentDelta * 2 + totalCoverageDelta);

  // Generate narrative summary
  const openai = getOpenAIClient();
  let narrativeSummary = '';
  let recommendations: unknown[] = [];

  try {
    const summaryPrompt = `Summarize the results of this scenario run:

Executed steps: ${executedSteps.length}
Failed steps: ${failedSteps.length}
Total sentiment impact: ${totalSentimentDelta}
Total coverage impact: ${totalCoverageDelta}%

Step outcomes:
${executedSteps.map((s) => `- ${JSON.stringify(s.outcome)}`).join('\n')}

Provide a JSON response with:
{
  "narrativeSummary": "<2-3 sentence summary>",
  "recommendations": [
    {"priority": "high|medium|low", "action": "<action>", "rationale": "<why>"}
  ]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: summaryPrompt }],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      const result = JSON.parse(content);
      narrativeSummary = result.narrativeSummary || '';
      recommendations = result.recommendations || [];
    }
  } catch (error) {
    console.error('Failed to generate run summary:', error);
    narrativeSummary = `Completed ${executedSteps.length} steps with ${failedSteps.length} failures.`;
  }

  // Update run with final results
  await ctx.supabase
    .from('scenario_runs')
    .update({
      status: ScenarioRunStatus.COMPLETED,
      completed_at: new Date().toISOString(),
      risk_score: riskScore,
      opportunity_score: opportunityScore,
      confidence_score: 0.8,
      narrative_summary: narrativeSummary,
      recommendations,
      result_summary: {
        executedSteps: executedSteps.length,
        failedSteps: failedSteps.length,
        skippedSteps: steps.filter((s) => s.status === ScenarioStepStatus.SKIPPED).length,
        totalSentimentDelta,
        totalCoverageDelta,
      },
    })
    .eq('id', runId);

  await logAuditEvent(ctx, ScenarioEventType.RUN_COMPLETED, {
    scenarioRunId: runId,
    payload: {
      riskScore,
      opportunityScore,
      executedSteps: executedSteps.length,
    },
  });
}

export async function approveScenarioStep(
  ctx: ServiceContext,
  input: ApproveScenarioStepInput
): Promise<ScenarioRunStep> {
  const { data: stepData, error: stepError } = await ctx.supabase
    .from('scenario_run_steps')
    .select('*, scenario_runs(*)')
    .eq('id', input.stepId)
    .eq('org_id', ctx.orgId)
    .single();

  if (stepError) throw new Error(`Failed to get step: ${stepError.message}`);
  if (stepData.status !== ScenarioStepStatus.READY) {
    throw new Error('Step is not ready for approval');
  }

  const runId = stepData.scenario_run_id;

  if (input.approved) {
    // Approve and execute
    await ctx.supabase
      .from('scenario_run_steps')
      .update({
        status: ScenarioStepStatus.APPROVED,
        approved_at: new Date().toISOString(),
        approved_by: ctx.userId,
        approval_notes: input.notes,
      })
      .eq('id', input.stepId);

    await logAuditEvent(ctx, ScenarioEventType.STEP_APPROVED, {
      scenarioRunId: runId,
      stepId: input.stepId,
      payload: { notes: input.notes },
    });

    // Update run status back to running
    await ctx.supabase
      .from('scenario_runs')
      .update({ status: ScenarioRunStatus.RUNNING })
      .eq('id', runId);

    // Execute the step
    await executeStep(ctx, runId, input.stepId);
  } else {
    // Skip the step
    await ctx.supabase
      .from('scenario_run_steps')
      .update({
        status: ScenarioStepStatus.SKIPPED,
        approved_at: new Date().toISOString(),
        approved_by: ctx.userId,
        approval_notes: input.notes,
      })
      .eq('id', input.stepId);

    await logAuditEvent(ctx, ScenarioEventType.STEP_SKIPPED, {
      scenarioRunId: runId,
      stepId: input.stepId,
      payload: { reason: 'rejected', notes: input.notes },
    });

    // Update run status back to running
    await ctx.supabase
      .from('scenario_runs')
      .update({ status: ScenarioRunStatus.RUNNING })
      .eq('id', runId);

    // Continue advancing the run
    await advanceRun(ctx, runId);
  }

  // Fetch updated step
  const { data: updatedStep } = await ctx.supabase
    .from('scenario_run_steps')
    .select('*')
    .eq('id', input.stepId)
    .single();

  return mapDbScenarioRunStep(updatedStep);
}

// ============================================================================
// AUDIT LOG OPERATIONS
// ============================================================================

export async function listScenarioAuditLogs(
  ctx: ServiceContext,
  input: ListScenarioAuditLogsQuery
): Promise<ListScenarioAuditLogsResponse> {
  let query = ctx.supabase.from('scenario_audit_log').select('*', { count: 'exact' });

  query = query.eq('org_id', ctx.orgId);

  if (input.scenarioId) {
    query = query.eq('scenario_id', input.scenarioId);
  }
  if (input.scenarioRunId) {
    query = query.eq('scenario_run_id', input.scenarioRunId);
  }
  if (input.playbookId) {
    query = query.eq('playbook_id', input.playbookId);
  }
  if (input.eventType) {
    query = query.eq('event_type', input.eventType);
  }
  if (input.actorId) {
    query = query.eq('actor_id', input.actorId);
  }
  if (input.startDate) {
    query = query.gte('created_at', input.startDate);
  }
  if (input.endDate) {
    query = query.lte('created_at', input.endDate);
  }

  query = query
    .order('created_at', { ascending: false })
    .range(input.offset || 0, (input.offset || 0) + (input.limit || 50) - 1);

  const { data, error, count } = await query;

  if (error) throw new Error(`Failed to list audit logs: ${error.message}`);

  return {
    logs: (data || []).map(mapDbScenarioAuditLog),
    total: count || 0,
    limit: input.limit || 50,
    offset: input.offset || 0,
  };
}

// ============================================================================
// STATS
// ============================================================================

export async function getScenarioPlaybookStats(ctx: ServiceContext): Promise<{
  totalPlaybooks: number;
  activePlaybooks: number;
  totalScenarios: number;
  totalRuns: number;
  completedRuns: number;
  averageRiskScore: number;
  recentRuns: ScenarioRun[];
}> {
  const [
    { count: totalPlaybooks },
    { count: activePlaybooks },
    { count: totalScenarios },
    { count: totalRuns },
    { count: completedRuns },
    { data: scoreData },
    { data: recentRunsData },
  ] = await Promise.all([
    ctx.supabase
      .from('scenario_playbooks')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', ctx.orgId),
    ctx.supabase
      .from('scenario_playbooks')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', ctx.orgId)
      .eq('status', ScenarioPlaybookStatus.ACTIVE),
    ctx.supabase
      .from('scenarios')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', ctx.orgId),
    ctx.supabase
      .from('scenario_runs')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', ctx.orgId),
    ctx.supabase
      .from('scenario_runs')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', ctx.orgId)
      .eq('status', ScenarioRunStatus.COMPLETED),
    ctx.supabase
      .from('scenario_runs')
      .select('risk_score')
      .eq('org_id', ctx.orgId)
      .eq('status', ScenarioRunStatus.COMPLETED)
      .not('risk_score', 'is', null),
    ctx.supabase
      .from('scenario_runs')
      .select('*')
      .eq('org_id', ctx.orgId)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const scores = (scoreData || []).map((r) => r.risk_score as number);
  const avgRiskScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

  return {
    totalPlaybooks: totalPlaybooks || 0,
    activePlaybooks: activePlaybooks || 0,
    totalScenarios: totalScenarios || 0,
    totalRuns: totalRuns || 0,
    completedRuns: completedRuns || 0,
    averageRiskScore: avgRiskScore,
    recentRuns: (recentRunsData || []).map(mapDbScenarioRun),
  };
}
