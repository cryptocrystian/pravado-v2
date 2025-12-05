/**
 * Scenario Simulation & Autonomous Playbook Orchestration Validators (Sprint S67)
 * Zod schemas for scenario playbook operations
 */

import { z } from 'zod';

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

export const scenarioTypeEnum = z.enum([
  'crisis_sim',
  'campaign_sim',
  'reputation_sim',
  'strategic_sim',
  'outreach_sim',
  'competitive_sim',
  'custom',
]);

export const scenarioPlaybookStatusEnum = z.enum([
  'draft',
  'active',
  'archived',
  'deprecated',
]);

export const scenarioTriggerTypeEnum = z.enum([
  'manual',
  'signal_based',
  'scheduled',
  'threshold_based',
  'event_driven',
]);

export const scenarioStepActionTypeEnum = z.enum([
  'outreach',
  'crisis_response',
  'governance',
  'report_generation',
  'media_alert',
  'reputation_action',
  'competitive_analysis',
  'stakeholder_notify',
  'content_publish',
  'escalation',
  'approval_gate',
  'wait',
  'conditional',
  'custom',
]);

export const scenarioRunStatusEnum = z.enum([
  'pending',
  'initializing',
  'running',
  'paused',
  'awaiting_approval',
  'completed',
  'failed',
  'cancelled',
]);

export const scenarioStepStatusEnum = z.enum([
  'pending',
  'ready',
  'approved',
  'executing',
  'executed',
  'skipped',
  'failed',
  'cancelled',
]);

export const scenarioRiskLevelEnum = z.enum([
  'low',
  'medium',
  'high',
  'critical',
]);

export const scenarioEventTypeEnum = z.enum([
  'playbook_created',
  'playbook_updated',
  'playbook_archived',
  'playbook_activated',
  'scenario_created',
  'scenario_updated',
  'scenario_simulated',
  'run_started',
  'run_paused',
  'run_resumed',
  'run_completed',
  'run_failed',
  'run_cancelled',
  'step_ready',
  'step_approved',
  'step_executed',
  'step_skipped',
  'step_failed',
]);

// ============================================================================
// SUPPORT SCHEMAS
// ============================================================================

export const scenarioParametersSchema = z.object({
  crisisSeverity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  crisisType: z.string().optional(),
  crisisSource: z.string().optional(),
  sentimentChange: z.number().min(-100).max(100).optional(),
  sentimentTarget: z.enum(['brand', 'product', 'leadership', 'all']).optional(),
  coverageChange: z.number().optional(),
  mediaOutletTier: z.enum(['tier1', 'tier2', 'tier3', 'all']).optional(),
  outreachMultiplier: z.number().min(0).optional(),
  targetJournalistTier: z.enum(['a', 'b', 'c', 'all']).optional(),
  competitorAction: z.string().optional(),
  competitorIntensity: z.enum(['low', 'medium', 'high']).optional(),
  impactStartDay: z.number().int().min(0).optional(),
  impactDurationDays: z.number().int().min(1).optional(),
  customInputs: z.record(z.unknown()).optional(),
});

export const scenarioConstraintsSchema = z.object({
  maxBudget: z.number().min(0).optional(),
  maxTimeHours: z.number().min(0).optional(),
  requiredApprovals: z.array(z.string()).optional(),
  excludedActions: z.array(scenarioStepActionTypeEnum).optional(),
  priorityMetrics: z.array(z.string()).optional(),
  riskTolerance: scenarioRiskLevelEnum.optional(),
});

export const signalConditionsSchema = z.object({
  type: z.string().optional(),
  source: z.string().optional(),
  threshold: z.number().optional(),
  operator: z.enum(['gt', 'gte', 'lt', 'lte', 'eq', 'neq']).optional(),
  value: z.unknown().optional(),
});

// ============================================================================
// PLAYBOOK SCHEMAS
// ============================================================================

export const createPlaybookStepSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  actionType: scenarioStepActionTypeEnum,
  actionPayload: z.record(z.unknown()).optional().default({}),
  requiresApproval: z.boolean().optional().default(false),
  approvalRoles: z.array(z.string()).optional().default([]),
  waitForSignals: z.boolean().optional().default(false),
  signalConditions: z.record(z.unknown()).optional().default({}),
  waitDurationMinutes: z.number().int().min(1).optional(),
  timeoutMinutes: z.number().int().min(1).optional(),
  conditionExpression: z.string().max(1000).optional(),
  skipOnFailure: z.boolean().optional().default(false),
  dependsOnSteps: z.array(z.string().uuid()).optional().default([]),
  metadata: z.record(z.unknown()).optional().default({}),
});

export const createScenarioPlaybookSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  category: z.string().max(100).optional(),
  triggerType: scenarioTriggerTypeEnum.optional().default('manual'),
  targetSystems: z.array(z.string()).optional().default([]),
  riskLevel: scenarioRiskLevelEnum.optional().default('medium'),
  tags: z.array(z.string()).optional().default([]),
  metadata: z.record(z.unknown()).optional().default({}),
  steps: z.array(createPlaybookStepSchema).optional().default([]),
});

export const updateScenarioPlaybookSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).nullable().optional(),
  category: z.string().max(100).nullable().optional(),
  status: scenarioPlaybookStatusEnum.optional(),
  triggerType: scenarioTriggerTypeEnum.optional(),
  targetSystems: z.array(z.string()).optional(),
  riskLevel: scenarioRiskLevelEnum.optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updatePlaybookStepSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).nullable().optional(),
  actionType: scenarioStepActionTypeEnum.optional(),
  actionPayload: z.record(z.unknown()).optional(),
  requiresApproval: z.boolean().optional(),
  approvalRoles: z.array(z.string()).optional(),
  waitForSignals: z.boolean().optional(),
  signalConditions: z.record(z.unknown()).optional(),
  waitDurationMinutes: z.number().int().min(1).nullable().optional(),
  timeoutMinutes: z.number().int().min(1).nullable().optional(),
  conditionExpression: z.string().max(1000).nullable().optional(),
  skipOnFailure: z.boolean().optional(),
  dependsOnSteps: z.array(z.string().uuid()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const listPlaybooksSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
  status: scenarioPlaybookStatusEnum.optional(),
  triggerType: scenarioTriggerTypeEnum.optional(),
  riskLevel: scenarioRiskLevelEnum.optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  tags: z.union([z.string(), z.array(z.string())]).transform(v =>
    Array.isArray(v) ? v : v ? [v] : undefined
  ).optional(),
  sortBy: z.enum(['name', 'created_at', 'updated_at', 'risk_level']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const addPlaybookStepSchema = z.object({
  playbookId: z.string().uuid(),
  step: createPlaybookStepSchema,
  insertAtIndex: z.number().int().min(0).optional(),
});

export const reorderPlaybookStepsSchema = z.object({
  playbookId: z.string().uuid(),
  stepOrder: z.array(z.string().uuid()),
});

// ============================================================================
// SCENARIO SCHEMAS
// ============================================================================

export const createScenarioSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  scenarioType: scenarioTypeEnum,
  horizonDays: z.number().int().min(1).max(365).optional().default(30),
  parameters: scenarioParametersSchema.optional().default({}),
  constraints: scenarioConstraintsSchema.optional().default({}),
  defaultPlaybookId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional().default([]),
  metadata: z.record(z.unknown()).optional().default({}),
});

export const updateScenarioSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).nullable().optional(),
  scenarioType: scenarioTypeEnum.optional(),
  horizonDays: z.number().int().min(1).max(365).optional(),
  parameters: scenarioParametersSchema.optional(),
  constraints: scenarioConstraintsSchema.optional(),
  defaultPlaybookId: z.string().uuid().nullable().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const listScenariosSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
  scenarioType: scenarioTypeEnum.optional(),
  status: scenarioRunStatusEnum.optional(),
  search: z.string().optional(),
  tags: z.union([z.string(), z.array(z.string())]).transform(v =>
    Array.isArray(v) ? v : v ? [v] : undefined
  ).optional(),
  playbookId: z.string().uuid().optional(),
  sortBy: z.enum(['name', 'created_at', 'updated_at', 'horizon_days']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// ============================================================================
// SIMULATION SCHEMAS
// ============================================================================

export const simulateScenarioSchema = z.object({
  scenarioId: z.string().uuid(),
  playbookId: z.string().uuid().optional(),
  overrideParameters: scenarioParametersSchema.optional(),
  includeGraphContext: z.boolean().optional().default(true),
  includeMetricsContext: z.boolean().optional().default(true),
  generateNarrative: z.boolean().optional().default(true),
});

// ============================================================================
// RUN SCHEMAS
// ============================================================================

export const startScenarioRunSchema = z.object({
  scenarioId: z.string().uuid(),
  playbookId: z.string().uuid().optional(),
  scheduledAt: z.string().datetime().optional(),
  overrideParameters: scenarioParametersSchema.optional(),
  metadata: z.record(z.unknown()).optional().default({}),
});

export const listScenarioRunsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
  scenarioId: z.string().uuid().optional(),
  playbookId: z.string().uuid().optional(),
  status: scenarioRunStatusEnum.optional(),
  startedAfter: z.string().datetime().optional(),
  startedBefore: z.string().datetime().optional(),
  sortBy: z.enum(['started_at', 'completed_at', 'risk_score', 'opportunity_score']).optional().default('started_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const approveScenarioStepSchema = z.object({
  stepId: z.string().uuid(),
  approved: z.boolean(),
  notes: z.string().max(2000).optional(),
});

export const cancelScenarioRunSchema = z.object({
  runId: z.string().uuid(),
  reason: z.string().max(1000).optional(),
});

// ============================================================================
// AUDIT SCHEMAS
// ============================================================================

export const listScenarioAuditLogsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
  scenarioId: z.string().uuid().optional(),
  scenarioRunId: z.string().uuid().optional(),
  playbookId: z.string().uuid().optional(),
  eventType: scenarioEventTypeEnum.optional(),
  actorId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// ============================================================================
// PARAM SCHEMAS
// ============================================================================

export const playbookIdParamSchema = z.object({
  playbookId: z.string().uuid(),
});

export const scenarioIdParamSchema = z.object({
  scenarioId: z.string().uuid(),
});

export const runIdParamSchema = z.object({
  runId: z.string().uuid(),
});

export const stepIdParamSchema = z.object({
  stepId: z.string().uuid(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CreateScenarioPlaybookInput = z.infer<typeof createScenarioPlaybookSchema>;
export type UpdateScenarioPlaybookInput = z.infer<typeof updateScenarioPlaybookSchema>;
export type CreatePlaybookStepInput = z.infer<typeof createPlaybookStepSchema>;
export type UpdatePlaybookStepInput = z.infer<typeof updatePlaybookStepSchema>;
export type ScenarioListPlaybooksQuery = z.infer<typeof listPlaybooksSchema>;
export type AddPlaybookStepInput = z.infer<typeof addPlaybookStepSchema>;
export type ReorderPlaybookStepsInput = z.infer<typeof reorderPlaybookStepsSchema>;

export type CreateScenarioInput = z.infer<typeof createScenarioSchema>;
export type UpdateScenarioInput = z.infer<typeof updateScenarioSchema>;
export type ListScenariosQuery = z.infer<typeof listScenariosSchema>;

export type SimulateScenarioInput = z.infer<typeof simulateScenarioSchema>;

export type StartScenarioRunInput = z.infer<typeof startScenarioRunSchema>;
export type ListScenarioRunsQuery = z.infer<typeof listScenarioRunsSchema>;
export type ApproveScenarioStepInput = z.infer<typeof approveScenarioStepSchema>;
export type CancelScenarioRunInput = z.infer<typeof cancelScenarioRunSchema>;

export type ListScenarioAuditLogsQuery = z.infer<typeof listScenarioAuditLogsSchema>;

export type ScenarioParameters = z.infer<typeof scenarioParametersSchema>;
export type ScenarioConstraints = z.infer<typeof scenarioConstraintsSchema>;
