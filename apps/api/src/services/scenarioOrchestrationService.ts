/**
 * Scenario Orchestration Service (Sprint S72)
 *
 * Multi-scenario orchestration engine for combined crisis/investor/strategic
 * scenario suites. Extends S71 AI Scenario Simulation Engine with suite-level
 * orchestration, conditional triggers, and branching outcomes.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { createLogger, routeLLM } from '@pravado/utils';
import type {
  ScenarioSuite,
  ScenarioSuiteItem,
  ScenarioSuiteRun,
  ScenarioSuiteRunItem,
  ScenarioSuiteAuditEvent,
  ScenarioSuiteStatus,
  ScenarioSuiteRunStatus,
  ScenarioSuiteItemStatus,
  TriggerConditionType,
  TriggerCondition,
  ScenarioSuiteConfig,
  SuiteItemExecutionConfig,
  CreateScenarioSuiteInput,
  UpdateScenarioSuiteInput,
  CreateSuiteItemInput,
  UpdateSuiteItemInput,
  ListScenarioSuitesQuery,
  ListScenarioSuitesResponse,
  ListSuiteRunsQuery,
  ListSuiteRunsResponse,
  GetScenarioSuiteResponse,
  GetScenarioSuiteRunResponse,
  StartScenarioSuiteRunInput,
  StartScenarioSuiteRunResponse,
  AdvanceSuiteRunInput,
  AdvanceSuiteRunResponse,
  AbortSuiteRunInput,
  AbortSuiteRunResponse,
  ListSuiteRunItemsResponse,
  CreateScenarioSuiteResponse,
  UpdateScenarioSuiteResponse,
  ArchiveScenarioSuiteResponse,
  SuiteRunMetrics,
  GetSuiteRunMetricsResponse,
  ScenarioSuiteStats,
  GetScenarioSuiteStatsResponse,
  SuiteRiskMap,
  GenerateSuiteRiskMapResponse,
  GenerateSuiteNarrativeResponse,
  ListSuiteAuditEventsResponse,
  AIScenarioRiskLevel,
  RiskMapNode,
  RiskMapEdge,
} from '@pravado/types';

import * as aiSimulationService from './aiScenarioSimulationService';

const logger = createLogger('scenarioOrchestrationService');

// ============================================================================
// SERVICE CONTEXT
// ============================================================================

export interface ScenarioOrchestrationContext {
  supabase: SupabaseClient;
  orgId: string;
  userId: string;
}

// ============================================================================
// HELPER FUNCTIONS - ROW MAPPERS
// ============================================================================

function mapRowToSuite(row: Record<string, unknown>): ScenarioSuite {
  return {
    id: row.id as string,
    orgId: row.org_id as string,
    name: row.name as string,
    description: row.description as string | null,
    status: row.status as ScenarioSuiteStatus,
    config: (row.config || {}) as ScenarioSuiteConfig,
    metadata: (row.metadata || {}) as Record<string, unknown>,
    createdBy: row.created_by as string | null,
    updatedBy: row.updated_by as string | null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    archivedAt: row.archived_at ? new Date(row.archived_at as string) : null,
  };
}

function mapRowToSuiteItem(row: Record<string, unknown>): ScenarioSuiteItem {
  return {
    id: row.id as string,
    suiteId: row.suite_id as string,
    simulationId: row.simulation_id as string,
    orderIndex: row.order_index as number,
    dependsOnItemId: row.depends_on_item_id as string | null,
    triggerConditionType: row.trigger_condition_type as TriggerConditionType,
    triggerCondition: (row.trigger_condition || { type: 'always' }) as TriggerCondition,
    executionConfig: row.execution_config as SuiteItemExecutionConfig | undefined,
    label: row.label as string | null,
    notes: row.notes as string | null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

function mapRowToSuiteRun(row: Record<string, unknown>): ScenarioSuiteRun {
  return {
    id: row.id as string,
    orgId: row.org_id as string,
    suiteId: row.suite_id as string,
    runNumber: row.run_number as number,
    runLabel: row.run_label as string | null,
    status: row.status as ScenarioSuiteRunStatus,
    totalItems: row.total_items as number,
    completedItems: row.completed_items as number,
    failedItems: row.failed_items as number,
    skippedItems: row.skipped_items as number,
    currentItemIndex: row.current_item_index as number,
    aggregateRiskLevel: row.aggregate_risk_level as AIScenarioRiskLevel | null,
    totalTokensUsed: row.total_tokens_used as number,
    totalStepsExecuted: row.total_steps_executed as number,
    seedContext: row.seed_context as Record<string, unknown> | undefined,
    suiteNarrative: row.suite_narrative as string | null,
    riskMap: row.risk_map as Record<string, unknown> | undefined,
    summary: row.summary as Record<string, unknown> | undefined,
    startedAt: new Date(row.started_at as string),
    completedAt: row.completed_at ? new Date(row.completed_at as string) : null,
    startedBy: row.started_by as string | null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

function mapRowToSuiteRunItem(row: Record<string, unknown>): ScenarioSuiteRunItem {
  return {
    id: row.id as string,
    orgId: row.org_id as string,
    suiteRunId: row.suite_run_id as string,
    suiteItemId: row.suite_item_id as string,
    simulationRunId: row.simulation_run_id as string | null,
    orderIndex: row.order_index as number,
    status: row.status as ScenarioSuiteItemStatus,
    conditionEvaluated: row.condition_evaluated as boolean,
    conditionResult: row.condition_result as boolean | null,
    conditionDetails: row.condition_details as Record<string, unknown> | undefined,
    tokensUsed: row.tokens_used as number | null,
    stepsExecuted: row.steps_executed as number | null,
    durationMs: row.duration_ms as number | null,
    riskLevel: row.risk_level as AIScenarioRiskLevel | null,
    outcomeSummary: row.outcome_summary as Record<string, unknown> | undefined,
    keyFindings: (row.key_findings || []) as unknown[],
    errorMessage: row.error_message as string | null,
    errorDetails: row.error_details as Record<string, unknown> | undefined,
    startedAt: row.started_at ? new Date(row.started_at as string) : null,
    completedAt: row.completed_at ? new Date(row.completed_at as string) : null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

function mapRowToAuditEvent(row: Record<string, unknown>): ScenarioSuiteAuditEvent {
  return {
    id: row.id as string,
    orgId: row.org_id as string,
    suiteId: row.suite_id as string | null,
    suiteRunId: row.suite_run_id as string | null,
    suiteRunItemId: row.suite_run_item_id as string | null,
    eventType: row.event_type as string,
    details: (row.details || {}) as Record<string, unknown>,
    userId: row.user_id as string | null,
    createdAt: new Date(row.created_at as string),
  };
}

// ============================================================================
// SUITE CRUD OPERATIONS
// ============================================================================

/**
 * Create a new scenario suite
 */
export async function createSuite(
  ctx: ScenarioOrchestrationContext,
  input: CreateScenarioSuiteInput
): Promise<CreateScenarioSuiteResponse> {
  logger.info('Creating scenario suite', { orgId: ctx.orgId, name: input.name });

  const { data: suiteData, error: suiteError } = await ctx.supabase
    .from('scenario_suites')
    .insert({
      org_id: ctx.orgId,
      name: input.name,
      description: input.description || null,
      status: 'draft',
      config: input.config || {},
      metadata: input.metadata || {},
      created_by: ctx.userId,
      updated_by: ctx.userId,
    })
    .select()
    .single();

  if (suiteError || !suiteData) {
    logger.error('Failed to create suite', { error: suiteError });
    throw new Error('Failed to create scenario suite');
  }

  const suite = mapRowToSuite(suiteData);

  // Create suite items if provided
  const items: ScenarioSuiteItem[] = [];
  if (input.items && input.items.length > 0) {
    for (let i = 0; i < input.items.length; i++) {
      const itemInput = input.items[i];
      const item = await addSuiteItem(ctx, suite.id, {
        ...itemInput,
        orderIndex: itemInput.orderIndex ?? i,
      });
      items.push(item);
    }
  }

  // Write audit log
  await writeAuditEvent(ctx, {
    suiteId: suite.id,
    eventType: 'suite_created',
    details: { name: suite.name, itemCount: items.length },
  });

  return { success: true, suite, items };
}

/**
 * Get suite by ID with items
 */
export async function getSuite(
  ctx: ScenarioOrchestrationContext,
  suiteId: string
): Promise<GetScenarioSuiteResponse> {
  const { data: suiteData, error: suiteError } = await ctx.supabase
    .from('scenario_suites')
    .select('*')
    .eq('id', suiteId)
    .eq('org_id', ctx.orgId)
    .single();

  if (suiteError || !suiteData) {
    throw new Error('Suite not found');
  }

  const suite = mapRowToSuite(suiteData);

  // Get items
  const { data: itemsData } = await ctx.supabase
    .from('scenario_suite_items')
    .select('*')
    .eq('suite_id', suiteId)
    .order('order_index', { ascending: true });

  const items = (itemsData || []).map(mapRowToSuiteItem);

  return { success: true, suite, items };
}

/**
 * List suites with pagination and filtering
 */
export async function listSuites(
  ctx: ScenarioOrchestrationContext,
  query: ListScenarioSuitesQuery
): Promise<ListScenarioSuitesResponse> {
  let dbQuery = ctx.supabase
    .from('scenario_suites')
    .select('*', { count: 'exact' })
    .eq('org_id', ctx.orgId);

  if (!query.includeArchived) {
    dbQuery = dbQuery.is('archived_at', null);
  }

  if (query.status) {
    dbQuery = dbQuery.eq('status', query.status);
  }

  if (query.search) {
    dbQuery = dbQuery.ilike('name', `%${query.search}%`);
  }

  const sortColumn = query.sortBy || 'created_at';
  const ascending = query.sortOrder === 'asc';
  dbQuery = dbQuery.order(sortColumn, { ascending });

  dbQuery = dbQuery.range(
    query.offset || 0,
    (query.offset || 0) + (query.limit || 20) - 1
  );

  const { data, error, count } = await dbQuery;

  if (error) {
    logger.error('Failed to list suites', { error });
    throw new Error('Failed to list suites');
  }

  const suites = (data || []).map(mapRowToSuite);

  return {
    success: true,
    suites,
    total: count || 0,
  };
}

/**
 * Update a suite
 */
export async function updateSuite(
  ctx: ScenarioOrchestrationContext,
  suiteId: string,
  input: UpdateScenarioSuiteInput
): Promise<UpdateScenarioSuiteResponse> {
  const updateData: Record<string, unknown> = {
    updated_by: ctx.userId,
  };

  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.config !== undefined) updateData.config = input.config;
  if (input.metadata !== undefined) updateData.metadata = input.metadata;

  const { data, error } = await ctx.supabase
    .from('scenario_suites')
    .update(updateData)
    .eq('id', suiteId)
    .eq('org_id', ctx.orgId)
    .select()
    .single();

  if (error || !data) {
    throw new Error('Failed to update suite');
  }

  const suite = mapRowToSuite(data);

  await writeAuditEvent(ctx, {
    suiteId,
    eventType: 'suite_updated',
    details: { updates: Object.keys(updateData) },
  });

  return { success: true, suite };
}

/**
 * Archive a suite
 */
export async function archiveSuite(
  ctx: ScenarioOrchestrationContext,
  suiteId: string,
  reason?: string
): Promise<ArchiveScenarioSuiteResponse> {
  const { data, error } = await ctx.supabase
    .from('scenario_suites')
    .update({
      status: 'archived',
      archived_at: new Date().toISOString(),
      updated_by: ctx.userId,
    })
    .eq('id', suiteId)
    .eq('org_id', ctx.orgId)
    .select()
    .single();

  if (error || !data) {
    throw new Error('Failed to archive suite');
  }

  const suite = mapRowToSuite(data);

  await writeAuditEvent(ctx, {
    suiteId,
    eventType: 'suite_archived',
    details: { reason },
  });

  return { success: true, suite };
}

// ============================================================================
// SUITE ITEM MANAGEMENT
// ============================================================================

/**
 * Add an item to a suite
 */
export async function addSuiteItem(
  ctx: ScenarioOrchestrationContext,
  suiteId: string,
  input: CreateSuiteItemInput
): Promise<ScenarioSuiteItem> {
  // Verify simulation exists
  const { data: simData, error: simError } = await ctx.supabase
    .from('ai_scenario_simulations')
    .select('id')
    .eq('id', input.simulationId)
    .eq('org_id', ctx.orgId)
    .single();

  if (simError || !simData) {
    throw new Error('Simulation not found');
  }

  const { data, error } = await ctx.supabase
    .from('scenario_suite_items')
    .insert({
      suite_id: suiteId,
      simulation_id: input.simulationId,
      order_index: input.orderIndex ?? 0,
      depends_on_item_id: input.dependsOnItemId || null,
      trigger_condition_type: input.triggerConditionType || 'always',
      trigger_condition: input.triggerCondition || { type: 'always' },
      execution_config: input.executionConfig || {},
      label: input.label || null,
      notes: input.notes || null,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error('Failed to add suite item');
  }

  await writeAuditEvent(ctx, {
    suiteId,
    eventType: 'item_added',
    details: { itemId: data.id, simulationId: input.simulationId },
  });

  return mapRowToSuiteItem(data);
}

/**
 * Update a suite item
 */
export async function updateSuiteItem(
  ctx: ScenarioOrchestrationContext,
  itemId: string,
  input: UpdateSuiteItemInput
): Promise<ScenarioSuiteItem> {
  const updateData: Record<string, unknown> = {};

  if (input.orderIndex !== undefined) updateData.order_index = input.orderIndex;
  if (input.dependsOnItemId !== undefined) updateData.depends_on_item_id = input.dependsOnItemId;
  if (input.triggerConditionType !== undefined) updateData.trigger_condition_type = input.triggerConditionType;
  if (input.triggerCondition !== undefined) updateData.trigger_condition = input.triggerCondition;
  if (input.executionConfig !== undefined) updateData.execution_config = input.executionConfig;
  if (input.label !== undefined) updateData.label = input.label;
  if (input.notes !== undefined) updateData.notes = input.notes;

  const { data, error } = await ctx.supabase
    .from('scenario_suite_items')
    .update(updateData)
    .eq('id', itemId)
    .select()
    .single();

  if (error || !data) {
    throw new Error('Failed to update suite item');
  }

  return mapRowToSuiteItem(data);
}

/**
 * Remove a suite item
 */
export async function removeSuiteItem(
  ctx: ScenarioOrchestrationContext,
  itemId: string
): Promise<{ success: boolean }> {
  // Get item to find suite
  const { data: itemData } = await ctx.supabase
    .from('scenario_suite_items')
    .select('suite_id')
    .eq('id', itemId)
    .single();

  const { error } = await ctx.supabase
    .from('scenario_suite_items')
    .delete()
    .eq('id', itemId);

  if (error) {
    throw new Error('Failed to remove suite item');
  }

  if (itemData) {
    await writeAuditEvent(ctx, {
      suiteId: itemData.suite_id,
      eventType: 'item_removed',
      details: { itemId },
    });
  }

  return { success: true };
}

// ============================================================================
// SUITE EXECUTION
// ============================================================================

/**
 * Start a new suite run
 */
export async function startSuiteRun(
  ctx: ScenarioOrchestrationContext,
  suiteId: string,
  input: StartScenarioSuiteRunInput
): Promise<StartScenarioSuiteRunResponse> {
  logger.info('Starting suite run', { orgId: ctx.orgId, suiteId });

  // Get suite with items
  const suiteResponse = await getSuite(ctx, suiteId);
  const { suite, items } = suiteResponse;

  if (suite.status === 'archived') {
    throw new Error('Cannot run archived suite');
  }

  // Get run count for run number
  const { count } = await ctx.supabase
    .from('scenario_suite_runs')
    .select('*', { count: 'exact', head: true })
    .eq('suite_id', suiteId);

  const runNumber = (count || 0) + 1;

  // Create suite run
  const { data: runData, error: runError } = await ctx.supabase
    .from('scenario_suite_runs')
    .insert({
      org_id: ctx.orgId,
      suite_id: suiteId,
      run_number: runNumber,
      run_label: input.runLabel || `Run ${runNumber}`,
      status: 'starting',
      total_items: items.length,
      completed_items: 0,
      failed_items: 0,
      skipped_items: 0,
      current_item_index: 0,
      seed_context: input.seedContext || {},
      started_by: ctx.userId,
    })
    .select()
    .single();

  if (runError || !runData) {
    throw new Error('Failed to create suite run');
  }

  const run = mapRowToSuiteRun(runData);

  // Create run items for each suite item
  const runItems: ScenarioSuiteRunItem[] = [];
  for (const item of items) {
    const { data: runItemData, error: runItemError } = await ctx.supabase
      .from('scenario_suite_run_items')
      .insert({
        org_id: ctx.orgId,
        suite_run_id: run.id,
        suite_item_id: item.id,
        order_index: item.orderIndex,
        status: 'pending',
        condition_evaluated: false,
      })
      .select()
      .single();

    if (!runItemError && runItemData) {
      runItems.push(mapRowToSuiteRunItem(runItemData));
    }
  }

  // Update suite status
  await ctx.supabase
    .from('scenario_suites')
    .update({ status: 'running' })
    .eq('id', suiteId);

  await writeAuditEvent(ctx, {
    suiteId,
    suiteRunId: run.id,
    eventType: 'run_started',
    details: { runNumber, itemCount: items.length },
  });

  // If startImmediately, advance the first item
  if (input.startImmediately && runItems.length > 0) {
    await advanceSuiteRun(ctx, run.id, { maxItems: 1 });
  }

  return { success: true, run, items: runItems };
}

/**
 * Advance a suite run by executing the next item(s)
 */
export async function advanceSuiteRun(
  ctx: ScenarioOrchestrationContext,
  runId: string,
  input: AdvanceSuiteRunInput
): Promise<AdvanceSuiteRunResponse> {
  logger.info('Advancing suite run', { runId, maxItems: input.maxItems });

  // Get current run
  const { data: runData, error: runError } = await ctx.supabase
    .from('scenario_suite_runs')
    .select('*')
    .eq('id', runId)
    .eq('org_id', ctx.orgId)
    .single();

  if (runError || !runData) {
    throw new Error('Run not found');
  }

  let run = mapRowToSuiteRun(runData);

  if (run.status === 'completed' || run.status === 'failed' || run.status === 'aborted') {
    throw new Error('Run is already finished');
  }

  // Update status to in_progress
  if (run.status === 'starting') {
    await ctx.supabase
      .from('scenario_suite_runs')
      .update({ status: 'in_progress' })
      .eq('id', runId);
    run.status = 'in_progress';
  }

  // Get pending run items ordered by index
  const { data: pendingItems } = await ctx.supabase
    .from('scenario_suite_run_items')
    .select('*, scenario_suite_items(*)')
    .eq('suite_run_id', runId)
    .eq('status', 'pending')
    .order('order_index', { ascending: true })
    .limit(input.maxItems || 1);

  if (!pendingItems || pendingItems.length === 0) {
    // No more items to process - finalize
    await finalizeSuiteRun(ctx, runId);
    const finalRun = await getSuiteRunById(ctx, runId);
    return {
      success: true,
      run: finalRun,
      advancedItems: [],
      nextItem: null,
      isComplete: true,
    };
  }

  const advancedItems: ScenarioSuiteRunItem[] = [];

  for (const itemData of pendingItems) {
    const suiteItem = mapRowToSuiteItem(itemData.scenario_suite_items);
    const runItem = mapRowToSuiteRunItem(itemData);

    // Evaluate condition
    let conditionMet = true;
    const conditionDetails: Record<string, unknown> = {};

    if (!input.skipConditionCheck && suiteItem.triggerConditionType !== 'always') {
      const evalResult = await evaluateCondition(
        ctx,
        runId,
        suiteItem.triggerConditionType,
        suiteItem.triggerCondition
      );
      conditionMet = evalResult.met;
      Object.assign(conditionDetails, evalResult.details);

      await writeAuditEvent(ctx, {
        suiteId: run.suiteId,
        suiteRunId: runId,
        suiteRunItemId: runItem.id,
        eventType: 'item_condition_evaluated',
        details: { conditionMet, conditionDetails },
      });
    }

    // Update condition evaluation
    await ctx.supabase
      .from('scenario_suite_run_items')
      .update({
        condition_evaluated: true,
        condition_result: conditionMet,
        condition_details: conditionDetails,
        status: conditionMet ? 'condition_met' : 'condition_unmet',
      })
      .eq('id', runItem.id);

    if (!conditionMet) {
      // Skip this item
      await ctx.supabase
        .from('scenario_suite_run_items')
        .update({ status: 'skipped' })
        .eq('id', runItem.id);

      await ctx.supabase
        .from('scenario_suite_runs')
        .update({
          skipped_items: run.skippedItems + 1,
          current_item_index: run.currentItemIndex + 1,
        })
        .eq('id', runId);

      await writeAuditEvent(ctx, {
        suiteId: run.suiteId,
        suiteRunId: runId,
        suiteRunItemId: runItem.id,
        eventType: 'item_skipped',
        details: { reason: 'condition_unmet' },
      });

      run.skippedItems++;
      run.currentItemIndex++;
      continue;
    }

    // Execute simulation
    try {
      await ctx.supabase
        .from('scenario_suite_run_items')
        .update({ status: 'running', started_at: new Date().toISOString() })
        .eq('id', runItem.id);

      await writeAuditEvent(ctx, {
        suiteId: run.suiteId,
        suiteRunId: runId,
        suiteRunItemId: runItem.id,
        eventType: 'item_started',
        details: {},
      });

      const startTime = Date.now();

      // Get simulation context for S71 service
      const simContext: aiSimulationService.AIScenarioSimulationContext = {
        supabase: ctx.supabase as aiSimulationService.AIScenarioSimulationContext['supabase'],
        orgId: ctx.orgId,
        userId: ctx.userId,
      };

      // Start simulation run
      const simRunResult = await aiSimulationService.startRun(
        simContext,
        suiteItem.simulationId,
        {
          runLabel: `Suite ${run.runLabel} - ${suiteItem.label || 'Item ' + suiteItem.orderIndex}`,
          maxSteps: suiteItem.executionConfig?.maxStepsOverride,
          customContext: {
            ...(run.seedContext || {}),
            ...(suiteItem.executionConfig?.seedContextOverride || {}),
          },
        }
      );

      // Run simulation to completion
      const completedRun = await aiSimulationService.runUntilConverged(
        simContext,
        simRunResult.id,
        { maxSteps: suiteItem.executionConfig?.maxStepsOverride || 20 }
      );

      const durationMs = Date.now() - startTime;

      // Update run item with results
      const runTokensUsed = (completedRun.run as unknown as { tokensUsed?: number }).tokensUsed || 0;
      await ctx.supabase
        .from('scenario_suite_run_items')
        .update({
          status: 'completed',
          simulation_run_id: simRunResult.id,
          tokens_used: runTokensUsed,
          steps_executed: completedRun.run.currentStep,
          duration_ms: durationMs,
          risk_level: completedRun.run.riskLevel,
          outcome_summary: {},
          completed_at: new Date().toISOString(),
        })
        .eq('id', runItem.id);

      // Update run totals
      await ctx.supabase
        .from('scenario_suite_runs')
        .update({
          completed_items: run.completedItems + 1,
          current_item_index: run.currentItemIndex + 1,
          total_tokens_used: run.totalTokensUsed + runTokensUsed,
          total_steps_executed: run.totalStepsExecuted + completedRun.run.currentStep,
        })
        .eq('id', runId);

      await writeAuditEvent(ctx, {
        suiteId: run.suiteId,
        suiteRunId: runId,
        suiteRunItemId: runItem.id,
        eventType: 'item_completed',
        details: {
          simulationRunId: simRunResult.id,
          tokensUsed: runTokensUsed,
          stepsExecuted: completedRun.run.currentStep,
          riskLevel: completedRun.run.riskLevel,
        },
      });

      run.completedItems++;
      run.currentItemIndex++;
      run.totalTokensUsed += runTokensUsed;
      run.totalStepsExecuted += completedRun.run.currentStep;

      // Refresh run item data
      const { data: updatedItem } = await ctx.supabase
        .from('scenario_suite_run_items')
        .select('*')
        .eq('id', runItem.id)
        .single();

      if (updatedItem) {
        advancedItems.push(mapRowToSuiteRunItem(updatedItem));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Item execution failed', { error: err, runItemId: runItem.id });

      await ctx.supabase
        .from('scenario_suite_run_items')
        .update({
          status: 'failed',
          error_message: errorMessage,
          completed_at: new Date().toISOString(),
        })
        .eq('id', runItem.id);

      await ctx.supabase
        .from('scenario_suite_runs')
        .update({
          failed_items: run.failedItems + 1,
          current_item_index: run.currentItemIndex + 1,
        })
        .eq('id', runId);

      await writeAuditEvent(ctx, {
        suiteId: run.suiteId,
        suiteRunId: runId,
        suiteRunItemId: runItem.id,
        eventType: 'item_failed',
        details: { error: errorMessage },
      });

      run.failedItems++;
      run.currentItemIndex++;

      // Check stop on failure
      const suiteResponse = await getSuite(ctx, run.suiteId);
      if (suiteResponse.suite.config.stopOnFailure) {
        await finalizeSuiteRun(ctx, runId, 'failed');
        const finalRun = await getSuiteRunById(ctx, runId);
        return {
          success: true,
          run: finalRun,
          advancedItems,
          nextItem: null,
          isComplete: true,
        };
      }
    }
  }

  // Get next pending item
  const { data: nextItems } = await ctx.supabase
    .from('scenario_suite_run_items')
    .select('*')
    .eq('suite_run_id', runId)
    .eq('status', 'pending')
    .order('order_index', { ascending: true })
    .limit(1);

  const nextItem = nextItems && nextItems.length > 0 ? mapRowToSuiteRunItem(nextItems[0]) : null;

  // Check if complete
  if (!nextItem) {
    await finalizeSuiteRun(ctx, runId);
  }

  const finalRun = await getSuiteRunById(ctx, runId);

  return {
    success: true,
    run: finalRun,
    advancedItems,
    nextItem,
    isComplete: !nextItem,
  };
}

/**
 * Abort a suite run
 */
export async function abortSuiteRun(
  ctx: ScenarioOrchestrationContext,
  runId: string,
  input: AbortSuiteRunInput
): Promise<AbortSuiteRunResponse> {
  const { data: runData, error: runError } = await ctx.supabase
    .from('scenario_suite_runs')
    .select('*')
    .eq('id', runId)
    .eq('org_id', ctx.orgId)
    .single();

  if (runError || !runData) {
    throw new Error('Run not found');
  }

  const run = mapRowToSuiteRun(runData);

  if (run.status === 'completed' || run.status === 'failed' || run.status === 'aborted') {
    throw new Error('Run is already finished');
  }

  // Abort all running items
  await ctx.supabase
    .from('scenario_suite_run_items')
    .update({ status: 'skipped' })
    .eq('suite_run_id', runId)
    .in('status', ['pending', 'running', 'condition_met']);

  // Update run status
  const { data: updatedRun, error: updateError } = await ctx.supabase
    .from('scenario_suite_runs')
    .update({
      status: 'aborted',
      completed_at: new Date().toISOString(),
    })
    .eq('id', runId)
    .select()
    .single();

  if (updateError || !updatedRun) {
    throw new Error('Failed to abort run');
  }

  // Update suite status
  await ctx.supabase
    .from('scenario_suites')
    .update({ status: 'configured' })
    .eq('id', run.suiteId);

  await writeAuditEvent(ctx, {
    suiteId: run.suiteId,
    suiteRunId: runId,
    eventType: 'run_aborted',
    details: { reason: input.reason },
  });

  return { success: true, run: mapRowToSuiteRun(updatedRun) };
}

/**
 * Finalize a suite run
 */
async function finalizeSuiteRun(
  ctx: ScenarioOrchestrationContext,
  runId: string,
  status?: 'completed' | 'failed'
): Promise<void> {
  const { data: runData } = await ctx.supabase
    .from('scenario_suite_runs')
    .select('*')
    .eq('id', runId)
    .single();

  if (!runData) return;

  const run = mapRowToSuiteRun(runData);

  // Determine final status
  let finalStatus: ScenarioSuiteRunStatus = status || 'completed';
  if (!status && run.failedItems > 0) {
    finalStatus = 'failed';
  }

  // Compute aggregate risk level
  const { data: itemsData } = await ctx.supabase
    .from('scenario_suite_run_items')
    .select('risk_level')
    .eq('suite_run_id', runId)
    .not('risk_level', 'is', null);

  const riskLevels = (itemsData || [])
    .map((i) => i.risk_level as AIScenarioRiskLevel)
    .filter(Boolean);

  const aggregateRisk = computeAggregateRisk(riskLevels);

  // Generate narrative if enabled
  const suiteResponse = await getSuite(ctx, run.suiteId);
  let narrative: string | null = null;
  let riskMap: Record<string, unknown> = {};

  if (suiteResponse.suite.config.narrativeEnabled) {
    try {
      const narrativeResult = await generateSuiteNarrative(ctx, { runId, format: 'summary' });
      narrative = narrativeResult.narrative;
    } catch (err) {
      logger.warn('Failed to generate narrative', { error: err });
    }
  }

  if (suiteResponse.suite.config.riskMapEnabled) {
    try {
      const riskMapResult = await generateSuiteRiskMap(ctx, { runId });
      riskMap = riskMapResult.riskMap as unknown as Record<string, unknown>;
    } catch (err) {
      logger.warn('Failed to generate risk map', { error: err });
    }
  }

  // Update run
  await ctx.supabase
    .from('scenario_suite_runs')
    .update({
      status: finalStatus,
      aggregate_risk_level: aggregateRisk,
      suite_narrative: narrative,
      risk_map: riskMap,
      completed_at: new Date().toISOString(),
    })
    .eq('id', runId);

  // Update suite status
  await ctx.supabase
    .from('scenario_suites')
    .update({ status: finalStatus === 'completed' ? 'completed' : 'failed' })
    .eq('id', run.suiteId);

  await writeAuditEvent(ctx, {
    suiteId: run.suiteId,
    suiteRunId: runId,
    eventType: finalStatus === 'completed' ? 'run_completed' : 'run_failed',
    details: {
      completedItems: run.completedItems,
      failedItems: run.failedItems,
      skippedItems: run.skippedItems,
      aggregateRiskLevel: aggregateRisk,
    },
  });
}

// ============================================================================
// CONDITION EVALUATION
// ============================================================================

interface ConditionEvalResult {
  met: boolean;
  details: Record<string, unknown>;
}

/**
 * Evaluate a trigger condition
 */
async function evaluateCondition(
  ctx: ScenarioOrchestrationContext,
  runId: string,
  conditionType: TriggerConditionType,
  condition: TriggerCondition | Record<string, unknown>
): Promise<ConditionEvalResult> {
  logger.debug('Evaluating condition', { runId, conditionType });

  if (conditionType === 'always') {
    return { met: true, details: { type: 'always' } };
  }

  const cond = condition as Record<string, unknown>;
  const sourceItemId = cond.sourceItemId as string | undefined;

  // Get source item result if specified
  let sourceItem: ScenarioSuiteRunItem | null = null;
  if (sourceItemId) {
    const { data } = await ctx.supabase
      .from('scenario_suite_run_items')
      .select('*')
      .eq('suite_run_id', runId)
      .eq('suite_item_id', sourceItemId)
      .single();

    if (data) {
      sourceItem = mapRowToSuiteRunItem(data);
    }
  } else {
    // Get most recent completed item
    const { data } = await ctx.supabase
      .from('scenario_suite_run_items')
      .select('*')
      .eq('suite_run_id', runId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      sourceItem = mapRowToSuiteRunItem(data);
    }
  }

  if (!sourceItem) {
    return { met: true, details: { reason: 'no_source_item', defaultTrue: true } };
  }

  switch (conditionType) {
    case 'risk_threshold': {
      const minRisk = cond.minRiskLevel as AIScenarioRiskLevel;
      const comparison = (cond.comparison || 'gte') as string;
      const itemRisk = sourceItem.riskLevel;

      if (!itemRisk) {
        return { met: false, details: { reason: 'no_risk_level', itemRisk: null } };
      }

      const riskOrder: Record<AIScenarioRiskLevel, number> = {
        low: 1,
        medium: 2,
        high: 3,
        critical: 4,
      };

      const itemValue = riskOrder[itemRisk];
      const thresholdValue = riskOrder[minRisk];

      let met = false;
      switch (comparison) {
        case 'gte':
          met = itemValue >= thresholdValue;
          break;
        case 'gt':
          met = itemValue > thresholdValue;
          break;
        case 'eq':
          met = itemValue === thresholdValue;
          break;
        case 'lte':
          met = itemValue <= thresholdValue;
          break;
        case 'lt':
          met = itemValue < thresholdValue;
          break;
      }

      return {
        met,
        details: {
          type: 'risk_threshold',
          itemRiskLevel: itemRisk,
          threshold: minRisk,
          comparison,
        },
      };
    }

    case 'keyword_match': {
      const keywords = (cond.keywords || []) as string[];
      const matchMode = (cond.matchMode || 'any') as string;
      const caseSensitive = cond.caseSensitive as boolean || false;

      // Get simulation run turns
      if (!sourceItem.simulationRunId) {
        return { met: false, details: { reason: 'no_simulation_run' } };
      }

      const { data: turns } = await ctx.supabase
        .from('ai_scenario_turns')
        .select('content')
        .eq('run_id', sourceItem.simulationRunId);

      if (!turns || turns.length === 0) {
        return { met: false, details: { reason: 'no_turns' } };
      }

      const allContent = turns.map((t) => t.content).join(' ');
      const searchContent = caseSensitive ? allContent : allContent.toLowerCase();
      const searchKeywords = caseSensitive
        ? keywords
        : keywords.map((k) => k.toLowerCase());

      let met = false;
      const matchedKeywords: string[] = [];

      if (matchMode === 'all') {
        met = searchKeywords.every((k) => {
          const found = searchContent.includes(k);
          if (found) matchedKeywords.push(k);
          return found;
        });
      } else {
        met = searchKeywords.some((k) => {
          const found = searchContent.includes(k);
          if (found) matchedKeywords.push(k);
          return found;
        });
      }

      return {
        met,
        details: {
          type: 'keyword_match',
          keywords,
          matchMode,
          matchedKeywords,
        },
      };
    }

    case 'outcome_match': {
      const outcomeType = cond.outcomeType as string;
      const minSeverity = cond.minSeverity as AIScenarioRiskLevel | undefined;

      const summary = sourceItem.outcomeSummary || {};
      const outcomes = (summary.outcomes || []) as { type: string; severity?: string }[];

      const matchingOutcomes = outcomes.filter((o) => o.type === outcomeType);

      if (matchingOutcomes.length === 0) {
        return { met: false, details: { type: 'outcome_match', found: false } };
      }

      if (minSeverity) {
        const riskOrder: Record<string, number> = {
          low: 1,
          medium: 2,
          high: 3,
          critical: 4,
        };
        const hasMinSeverity = matchingOutcomes.some(
          (o) => o.severity && riskOrder[o.severity] >= riskOrder[minSeverity]
        );
        return {
          met: hasMinSeverity,
          details: { type: 'outcome_match', matchingOutcomes, minSeverity },
        };
      }

      return {
        met: true,
        details: { type: 'outcome_match', matchingOutcomes },
      };
    }

    case 'sentiment_shift':
    case 'agent_response':
    case 'custom_expression':
      // These would require more complex evaluation - default to true for now
      return {
        met: true,
        details: { type: conditionType, defaultTrue: true, note: 'Complex evaluation not implemented' },
      };

    default:
      return { met: true, details: { type: 'unknown', defaultTrue: true } };
  }
}

// ============================================================================
// QUERY OPERATIONS
// ============================================================================

/**
 * Get suite run by ID
 */
async function getSuiteRunById(
  ctx: ScenarioOrchestrationContext,
  runId: string
): Promise<ScenarioSuiteRun> {
  const { data, error } = await ctx.supabase
    .from('scenario_suite_runs')
    .select('*')
    .eq('id', runId)
    .eq('org_id', ctx.orgId)
    .single();

  if (error || !data) {
    throw new Error('Run not found');
  }

  return mapRowToSuiteRun(data);
}

/**
 * Get suite run with items
 */
export async function getSuiteRun(
  ctx: ScenarioOrchestrationContext,
  runId: string
): Promise<GetScenarioSuiteRunResponse> {
  const run = await getSuiteRunById(ctx, runId);

  const { data: itemsData } = await ctx.supabase
    .from('scenario_suite_run_items')
    .select('*')
    .eq('suite_run_id', runId)
    .order('order_index', { ascending: true });

  const items = (itemsData || []).map(mapRowToSuiteRunItem);

  return { success: true, run, items };
}

/**
 * List suite runs
 */
export async function listSuiteRuns(
  ctx: ScenarioOrchestrationContext,
  suiteId: string,
  query: ListSuiteRunsQuery
): Promise<ListSuiteRunsResponse> {
  let dbQuery = ctx.supabase
    .from('scenario_suite_runs')
    .select('*', { count: 'exact' })
    .eq('suite_id', suiteId)
    .eq('org_id', ctx.orgId);

  if (query.status) {
    dbQuery = dbQuery.eq('status', query.status);
  }

  dbQuery = dbQuery.order('started_at', { ascending: query.sortOrder === 'asc' });
  dbQuery = dbQuery.range(query.offset || 0, (query.offset || 0) + (query.limit || 20) - 1);

  const { data, error, count } = await dbQuery;

  if (error) {
    throw new Error('Failed to list runs');
  }

  return {
    success: true,
    runs: (data || []).map(mapRowToSuiteRun),
    total: count || 0,
  };
}

/**
 * List suite run items
 */
export async function listSuiteRunItems(
  ctx: ScenarioOrchestrationContext,
  runId: string
): Promise<ListSuiteRunItemsResponse> {
  const { data, error, count } = await ctx.supabase
    .from('scenario_suite_run_items')
    .select('*', { count: 'exact' })
    .eq('suite_run_id', runId)
    .eq('org_id', ctx.orgId)
    .order('order_index', { ascending: true });

  if (error) {
    throw new Error('Failed to list run items');
  }

  return {
    success: true,
    items: (data || []).map(mapRowToSuiteRunItem),
    total: count || 0,
  };
}

// ============================================================================
// NARRATIVE & RISK MAP GENERATION
// ============================================================================

/**
 * Generate suite narrative
 */
export async function generateSuiteNarrative(
  ctx: ScenarioOrchestrationContext,
  input: { runId: string; format?: string; includeRecommendations?: boolean }
): Promise<GenerateSuiteNarrativeResponse> {
  const runResponse = await getSuiteRun(ctx, input.runId);
  const { run, items } = runResponse;

  // Build context from items
  const itemSummaries = items
    .filter((i) => i.status === 'completed')
    .map((i) => ({
      order: i.orderIndex,
      status: i.status,
      riskLevel: i.riskLevel,
      summary: i.outcomeSummary,
    }));

  const systemPrompt = `You are an expert PR and communications strategist analyzing a multi-scenario simulation suite.
Generate a ${input.format || 'summary'} narrative that explains:
1. What happened across all scenarios
2. Key themes and patterns
3. Critical risk factors identified
4. Opportunities discovered
${input.includeRecommendations ? '5. Specific recommendations for action' : ''}

Be concise, professional, and actionable.`;

  const userPrompt = `Analyze this scenario suite run:

Suite Run: ${run.runLabel || 'Run ' + run.runNumber}
Status: ${run.status}
Items Completed: ${run.completedItems}/${run.totalItems}
Aggregate Risk: ${run.aggregateRiskLevel || 'Not assessed'}

Item Results:
${JSON.stringify(itemSummaries, null, 2)}

Generate a ${input.format || 'summary'} narrative.`;

  const response = await routeLLM({
    systemPrompt,
    userPrompt,
    temperature: 0.7,
    maxTokens: 1500,
  });

  const narrative = response.content;
  const tokensUsed = response.usage?.totalTokens || 0;

  // Update run with narrative
  await ctx.supabase
    .from('scenario_suite_runs')
    .update({ suite_narrative: narrative })
    .eq('id', input.runId);

  await writeAuditEvent(ctx, {
    suiteId: run.suiteId,
    suiteRunId: input.runId,
    eventType: 'narrative_generated',
    details: { format: input.format, tokensUsed },
  });

  return {
    success: true,
    narrative,
    metadata: {
      generatedAt: new Date().toISOString(),
      format: input.format || 'summary',
      tokensUsed,
    },
  };
}

/**
 * Generate suite risk map
 */
export async function generateSuiteRiskMap(
  ctx: ScenarioOrchestrationContext,
  input: { runId: string; includeOpportunities?: boolean; includeMitigations?: boolean }
): Promise<GenerateSuiteRiskMapResponse> {
  const runResponse = await getSuiteRun(ctx, input.runId);
  const { run, items } = runResponse;

  // Get suite items for simulation names
  const suiteResponse = await getSuite(ctx, run.suiteId);

  // Build nodes and edges
  const nodes: RiskMapNode[] = [];
  const edges: RiskMapEdge[] = [];

  for (const item of items) {
    const suiteItem = suiteResponse.items.find((si) => si.id === item.suiteItemId);

    // Add simulation node
    nodes.push({
      id: item.id,
      label: suiteItem?.label || `Simulation ${item.orderIndex + 1}`,
      type: 'simulation',
      riskLevel: item.riskLevel || undefined,
      details: { status: item.status, tokensUsed: item.tokensUsed },
    });

    // Add outcome nodes
    if (item.outcomeSummary) {
      const outcomes = (item.outcomeSummary.outcomes || []) as {
        type: string;
        description: string;
        severity?: string;
      }[];

      outcomes.forEach((outcome, idx) => {
        const outcomeId = `${item.id}-outcome-${idx}`;
        nodes.push({
          id: outcomeId,
          label: outcome.description?.substring(0, 50) || 'Outcome',
          type: outcome.type === 'risk' ? 'risk' : outcome.type === 'opportunity' ? 'opportunity' : 'outcome',
          riskLevel: outcome.severity as AIScenarioRiskLevel | undefined,
        });

        edges.push({
          source: item.id,
          target: outcomeId,
          conditionMet: item.conditionResult || false,
        });
      });
    }

    // Add edges between simulations based on conditions
    if (item.orderIndex > 0) {
      const prevItem = items.find((i) => i.orderIndex === item.orderIndex - 1);
      if (prevItem) {
        edges.push({
          source: prevItem.id,
          target: item.id,
          label: item.conditionResult ? 'triggered' : 'skipped',
          conditionMet: item.conditionResult || false,
        });
      }
    }
  }

  // Collect risk factors and opportunities
  const riskFactors: SuiteRiskMap['riskFactors'] = [];
  const opportunities: SuiteRiskMap['opportunities'] = [];

  for (const item of items.filter((i) => i.outcomeSummary)) {
    const outcomes = (item.outcomeSummary!.outcomes || []) as {
      type: string;
      description: string;
      severity?: string;
      mitigations?: string[];
      impact?: string;
    }[];

    outcomes.forEach((outcome) => {
      if (outcome.type === 'risk') {
        riskFactors.push({
          factor: outcome.description,
          severity: (outcome.severity || 'medium') as AIScenarioRiskLevel,
          source: `Item ${item.orderIndex + 1}`,
          mitigations: input.includeMitigations ? outcome.mitigations : undefined,
        });
      } else if (outcome.type === 'opportunity' && input.includeOpportunities) {
        opportunities.push({
          opportunity: outcome.description,
          impact: (outcome.impact || 'medium') as 'low' | 'medium' | 'high',
          source: `Item ${item.orderIndex + 1}`,
        });
      }
    });
  }

  const riskMap: SuiteRiskMap = {
    runId: input.runId,
    suiteId: run.suiteId,
    nodes,
    edges,
    aggregateRiskLevel: run.aggregateRiskLevel || 'low',
    riskFactors,
    opportunities,
    generatedAt: new Date().toISOString(),
  };

  // Update run with risk map
  await ctx.supabase
    .from('scenario_suite_runs')
    .update({ risk_map: riskMap })
    .eq('id', input.runId);

  await writeAuditEvent(ctx, {
    suiteId: run.suiteId,
    suiteRunId: input.runId,
    eventType: 'risk_map_generated',
    details: { nodeCount: nodes.length, edgeCount: edges.length },
  });

  return { success: true, riskMap };
}

// ============================================================================
// METRICS & STATISTICS
// ============================================================================

/**
 * Get suite run metrics
 */
export async function getSuiteRunMetrics(
  ctx: ScenarioOrchestrationContext,
  runId: string
): Promise<GetSuiteRunMetricsResponse> {
  const runResponse = await getSuiteRun(ctx, runId);
  const { run, items } = runResponse;

  const riskDistribution: Record<AIScenarioRiskLevel, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };

  const conditionEvaluations: Map<
    TriggerConditionType,
    { evaluations: number; metCount: number; unmetCount: number }
  > = new Map();

  let totalDurationMs = 0;
  const itemMetrics: SuiteRunMetrics['itemMetrics'] = [];

  for (const item of items) {
    if (item.riskLevel) {
      riskDistribution[item.riskLevel]++;
    }

    if (item.durationMs) {
      totalDurationMs += item.durationMs;
    }

    // Get suite item for condition type
    const { data: suiteItem } = await ctx.supabase
      .from('scenario_suite_items')
      .select('trigger_condition_type, simulation_id')
      .eq('id', item.suiteItemId)
      .single();

    if (suiteItem) {
      const condType = suiteItem.trigger_condition_type as TriggerConditionType;
      const existing = conditionEvaluations.get(condType) || {
        evaluations: 0,
        metCount: 0,
        unmetCount: 0,
      };
      existing.evaluations++;
      if (item.conditionResult === true) existing.metCount++;
      if (item.conditionResult === false) existing.unmetCount++;
      conditionEvaluations.set(condType, existing);

      // Get simulation name
      const { data: sim } = await ctx.supabase
        .from('ai_scenario_simulations')
        .select('name')
        .eq('id', suiteItem.simulation_id)
        .single();

      itemMetrics.push({
        itemId: item.id,
        simulationName: sim?.name || 'Unknown',
        status: item.status,
        tokensUsed: item.tokensUsed || 0,
        stepsExecuted: item.stepsExecuted || 0,
        durationMs: item.durationMs || 0,
        riskLevel: item.riskLevel || undefined,
      });
    }
  }

  const metrics: SuiteRunMetrics = {
    runId,
    suiteId: run.suiteId,
    totalItems: run.totalItems,
    completedItems: run.completedItems,
    failedItems: run.failedItems,
    skippedItems: run.skippedItems,
    conditionMetItems: items.filter((i) => i.conditionResult === true).length,
    conditionUnmetItems: items.filter((i) => i.conditionResult === false).length,
    totalTokensUsed: run.totalTokensUsed,
    totalStepsExecuted: run.totalStepsExecuted,
    totalDurationMs,
    averageItemDurationMs:
      run.completedItems > 0 ? totalDurationMs / run.completedItems : 0,
    aggregateRiskLevel: run.aggregateRiskLevel || 'low',
    riskLevelDistribution: riskDistribution,
    conditionEvaluations: Array.from(conditionEvaluations.entries()).map(
      ([type, data]) => ({ type, ...data })
    ),
    itemMetrics,
  };

  return { success: true, metrics };
}

/**
 * Get scenario suite statistics
 */
export async function getSuiteStats(
  ctx: ScenarioOrchestrationContext
): Promise<GetScenarioSuiteStatsResponse> {
  // Get all suites
  const { data: suites } = await ctx.supabase
    .from('scenario_suites')
    .select('status')
    .eq('org_id', ctx.orgId)
    .is('archived_at', null);

  // Get all runs
  const { data: runs } = await ctx.supabase
    .from('scenario_suite_runs')
    .select('status, aggregate_risk_level, total_items, completed_at, started_at')
    .eq('org_id', ctx.orgId);

  // Get item condition types
  const { data: items } = await ctx.supabase
    .from('scenario_suite_items')
    .select('trigger_condition_type')
    .in(
      'suite_id',
      (suites || []).map((s) => s)
    );

  const byStatus: Record<ScenarioSuiteStatus, number> = {
    draft: 0,
    configured: 0,
    running: 0,
    completed: 0,
    failed: 0,
    archived: 0,
  };

  (suites || []).forEach((s) => {
    byStatus[s.status as ScenarioSuiteStatus]++;
  });

  const runsByStatus: Record<ScenarioSuiteRunStatus, number> = {
    starting: 0,
    in_progress: 0,
    running: 0,
    paused: 0,
    completed: 0,
    failed: 0,
    aborted: 0,
  };

  const riskDistribution: Record<AIScenarioRiskLevel, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };

  let totalDurationMs = 0;
  let completedRuns = 0;

  (runs || []).forEach((r) => {
    runsByStatus[r.status as ScenarioSuiteRunStatus]++;
    if (r.aggregate_risk_level) {
      riskDistribution[r.aggregate_risk_level as AIScenarioRiskLevel]++;
    }
    if (r.completed_at && r.started_at) {
      totalDurationMs +=
        new Date(r.completed_at).getTime() - new Date(r.started_at).getTime();
      completedRuns++;
    }
  });

  // Count condition types
  const conditionCounts: Record<string, number> = {};
  (items || []).forEach((i) => {
    const type = i.trigger_condition_type;
    conditionCounts[type] = (conditionCounts[type] || 0) + 1;
  });

  const mostUsedConditionType = (Object.entries(conditionCounts).sort(
    ([, a], [, b]) => b - a
  )[0]?.[0] || 'always') as TriggerConditionType;

  // Calculate averages
  const totalSuites = suites?.length || 0;
  const totalItems = items?.length || 0;

  const stats: ScenarioSuiteStats = {
    totalSuites,
    byStatus,
    totalRuns: runs?.length || 0,
    runsByStatus,
    averageItemsPerSuite: totalSuites > 0 ? totalItems / totalSuites : 0,
    averageRunDurationMs: completedRuns > 0 ? totalDurationMs / completedRuns : 0,
    mostUsedConditionType,
    riskDistribution,
  };

  return { success: true, stats };
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

/**
 * Write audit event
 */
async function writeAuditEvent(
  ctx: ScenarioOrchestrationContext,
  event: {
    suiteId?: string;
    suiteRunId?: string;
    suiteRunItemId?: string;
    eventType: string;
    details: Record<string, unknown>;
  }
): Promise<void> {
  try {
    await ctx.supabase.from('scenario_suite_audit_log').insert({
      org_id: ctx.orgId,
      suite_id: event.suiteId,
      suite_run_id: event.suiteRunId,
      suite_run_item_id: event.suiteRunItemId,
      event_type: event.eventType,
      details: event.details,
      user_id: ctx.userId,
    });
  } catch (err) {
    logger.warn('Failed to write audit event', { error: err, event });
  }
}

/**
 * List audit events
 */
export async function listAuditEvents(
  ctx: ScenarioOrchestrationContext,
  query: {
    suiteId?: string;
    suiteRunId?: string;
    eventType?: string;
    limit?: number;
    offset?: number;
    sortOrder?: 'asc' | 'desc';
  }
): Promise<ListSuiteAuditEventsResponse> {
  let dbQuery = ctx.supabase
    .from('scenario_suite_audit_log')
    .select('*', { count: 'exact' })
    .eq('org_id', ctx.orgId);

  if (query.suiteId) dbQuery = dbQuery.eq('suite_id', query.suiteId);
  if (query.suiteRunId) dbQuery = dbQuery.eq('suite_run_id', query.suiteRunId);
  if (query.eventType) dbQuery = dbQuery.eq('event_type', query.eventType);

  dbQuery = dbQuery.order('created_at', { ascending: query.sortOrder === 'asc' });
  dbQuery = dbQuery.range(query.offset || 0, (query.offset || 0) + (query.limit || 50) - 1);

  const { data, error, count } = await dbQuery;

  if (error) {
    throw new Error('Failed to list audit events');
  }

  return {
    success: true,
    events: (data || []).map(mapRowToAuditEvent),
    total: count || 0,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Compute aggregate risk level from array of risk levels
 */
function computeAggregateRisk(levels: AIScenarioRiskLevel[]): AIScenarioRiskLevel {
  if (levels.length === 0) return 'low';

  const riskOrder: Record<AIScenarioRiskLevel, number> = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
  };

  const maxLevel = levels.reduce((max, level) => {
    return riskOrder[level] > riskOrder[max] ? level : max;
  }, 'low' as AIScenarioRiskLevel);

  return maxLevel;
}
