/**
 * Scenario Orchestration Engine Validators (Sprint S72)
 *
 * Zod schemas for validating scenario orchestration requests and data.
 */

import { z } from 'zod';
import { aiScenarioRiskLevelSchema } from './aiScenarioSimulation';

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

export const scenarioSuiteStatusSchema = z.enum([
  'draft',
  'configured',
  'running',
  'completed',
  'failed',
  'archived',
]);

export const scenarioSuiteRunStatusSchema = z.enum([
  'starting',
  'in_progress',
  'completed',
  'failed',
  'aborted',
]);

export const scenarioSuiteItemStatusSchema = z.enum([
  'pending',
  'condition_met',
  'condition_unmet',
  'running',
  'completed',
  'failed',
  'skipped',
]);

export const triggerConditionTypeSchema = z.enum([
  'always',
  'risk_threshold',
  'sentiment_shift',
  'keyword_match',
  'agent_response',
  'outcome_match',
  'custom_expression',
]);

// ============================================================================
// TRIGGER CONDITION SCHEMAS
// ============================================================================

export const baseTriggerConditionSchema = z.object({
  sourceItemId: z.string().uuid().optional(),
});

export const riskThresholdConditionSchema = baseTriggerConditionSchema.extend({
  type: z.literal('risk_threshold'),
  minRiskLevel: aiScenarioRiskLevelSchema,
  comparison: z.enum(['gte', 'gt', 'eq', 'lte', 'lt']).optional().default('gte'),
});

export const sentimentShiftConditionSchema = baseTriggerConditionSchema.extend({
  type: z.literal('sentiment_shift'),
  direction: z.enum(['positive', 'negative', 'any']),
  magnitude: z.number().min(0).max(1).optional(),
});

export const keywordMatchConditionSchema = baseTriggerConditionSchema.extend({
  type: z.literal('keyword_match'),
  keywords: z.array(z.string().min(1).max(100)).min(1).max(50),
  matchMode: z.enum(['any', 'all']).optional().default('any'),
  caseSensitive: z.boolean().optional().default(false),
});

export const agentResponseConditionSchema = baseTriggerConditionSchema.extend({
  type: z.literal('agent_response'),
  agentRoleType: z.string().optional(),
  containsKeywords: z.array(z.string()).optional(),
  sentimentThreshold: z.number().min(-1).max(1).optional(),
});

export const outcomeMatchConditionSchema = baseTriggerConditionSchema.extend({
  type: z.literal('outcome_match'),
  outcomeType: z.enum(['risk', 'opportunity', 'neutral']),
  minSeverity: aiScenarioRiskLevelSchema.optional(),
});

export const customExpressionConditionSchema = baseTriggerConditionSchema.extend({
  type: z.literal('custom_expression'),
  expression: z.string().min(1).max(500),
  variables: z.record(z.unknown()).optional(),
});

export const alwaysConditionSchema = z.object({
  type: z.literal('always'),
});

export const triggerConditionSchema = z.discriminatedUnion('type', [
  alwaysConditionSchema,
  riskThresholdConditionSchema,
  sentimentShiftConditionSchema,
  keywordMatchConditionSchema,
  agentResponseConditionSchema,
  outcomeMatchConditionSchema,
  customExpressionConditionSchema,
]);

// Flexible condition schema for loose validation
export const flexibleTriggerConditionSchema = z.union([
  triggerConditionSchema,
  z.record(z.unknown()),
]);

// ============================================================================
// CONFIG SCHEMAS
// ============================================================================

export const suiteRetryPolicySchema = z.object({
  maxRetries: z.number().int().min(0).max(5).optional().default(2),
  backoffMs: z.number().int().min(100).max(60000).optional().default(5000),
});

export const suiteNotificationSettingsSchema = z.object({
  onComplete: z.boolean().optional().default(false),
  onFailure: z.boolean().optional().default(true),
  onRiskThreshold: aiScenarioRiskLevelSchema.optional(),
});

export const scenarioSuiteConfigSchema = z.object({
  maxConcurrentSimulations: z.number().int().min(1).max(5).optional().default(1),
  stopOnFailure: z.boolean().optional().default(true),
  narrativeEnabled: z.boolean().optional().default(true),
  riskMapEnabled: z.boolean().optional().default(true),
  timeoutSeconds: z.number().int().min(60).max(7200).optional().default(3600),
  retryPolicy: suiteRetryPolicySchema.optional(),
  notificationSettings: suiteNotificationSettingsSchema.optional(),
});

export const suiteItemExecutionConfigSchema = z.object({
  maxStepsOverride: z.number().int().min(1).max(100).optional(),
  seedContextOverride: z.record(z.unknown()).optional(),
  agentOverrides: z.record(z.unknown()).optional(),
  temperatureOverride: z.number().min(0).max(2).optional(),
});

// ============================================================================
// SUITE CRUD SCHEMAS
// ============================================================================

export const createSuiteItemSchema = z.object({
  simulationId: z.string().uuid(),
  orderIndex: z.number().int().min(0).optional().default(0),
  dependsOnItemId: z.string().uuid().nullable().optional(),
  triggerConditionType: triggerConditionTypeSchema.optional().default('always'),
  triggerCondition: flexibleTriggerConditionSchema.optional().default({ type: 'always' }),
  executionConfig: suiteItemExecutionConfigSchema.optional(),
  label: z.string().max(100).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export const createScenarioSuiteSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  config: scenarioSuiteConfigSchema.optional().default({}),
  metadata: z.record(z.unknown()).optional().default({}),
  items: z.array(createSuiteItemSchema).optional().default([]),
});

export const updateScenarioSuiteSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  status: scenarioSuiteStatusSchema.optional(),
  config: scenarioSuiteConfigSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updateSuiteItemSchema = z.object({
  orderIndex: z.number().int().min(0).optional(),
  dependsOnItemId: z.string().uuid().nullable().optional(),
  triggerConditionType: triggerConditionTypeSchema.optional(),
  triggerCondition: flexibleTriggerConditionSchema.optional(),
  executionConfig: suiteItemExecutionConfigSchema.optional(),
  label: z.string().max(100).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export const addSuiteItemSchema = createSuiteItemSchema.extend({
  suiteId: z.string().uuid(),
});

// ============================================================================
// QUERY SCHEMAS
// ============================================================================

export const listScenarioSuitesSchema = z.object({
  status: scenarioSuiteStatusSchema.optional(),
  search: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
  sortBy: z.enum(['created_at', 'updated_at', 'name']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  includeArchived: z.coerce.boolean().optional().default(false),
});

export const listSuiteRunsSchema = z.object({
  status: scenarioSuiteRunStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const listSuiteRunItemsSchema = z.object({
  status: scenarioSuiteItemStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export const listSuiteAuditEventsSchema = z.object({
  suiteId: z.string().uuid().optional(),
  suiteRunId: z.string().uuid().optional(),
  eventType: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// ============================================================================
// EXECUTION SCHEMAS
// ============================================================================

export const startScenarioSuiteRunSchema = z.object({
  runLabel: z.string().max(200).nullable().optional(),
  seedContext: z.record(z.unknown()).optional().default({}),
  startImmediately: z.boolean().optional().default(false),
});

export const advanceSuiteRunSchema = z.object({
  maxItems: z.number().int().min(1).max(20).optional().default(1),
  skipConditionCheck: z.boolean().optional().default(false),
});

export const abortSuiteRunSchema = z.object({
  reason: z.string().max(500).optional(),
});

// ============================================================================
// NARRATIVE & RISK MAP SCHEMAS
// ============================================================================

export const generateSuiteNarrativeSchema = z.object({
  runId: z.string().uuid(),
  format: z.enum(['summary', 'detailed', 'executive']).optional().default('summary'),
  includeRecommendations: z.boolean().optional().default(true),
});

export const generateSuiteRiskMapSchema = z.object({
  runId: z.string().uuid(),
  includeOpportunities: z.boolean().optional().default(true),
  includeMitigations: z.boolean().optional().default(true),
});

// ============================================================================
// METRICS SCHEMAS
// ============================================================================

export const suiteRunMetricsSchema = z.object({
  runId: z.string().uuid(),
  suiteId: z.string().uuid(),
  totalItems: z.number().int().min(0),
  completedItems: z.number().int().min(0),
  failedItems: z.number().int().min(0),
  skippedItems: z.number().int().min(0),
  conditionMetItems: z.number().int().min(0),
  conditionUnmetItems: z.number().int().min(0),
  totalTokensUsed: z.number().int().min(0),
  totalStepsExecuted: z.number().int().min(0),
  totalDurationMs: z.number().int().min(0),
  averageItemDurationMs: z.number().min(0),
  aggregateRiskLevel: aiScenarioRiskLevelSchema,
  riskLevelDistribution: z.record(aiScenarioRiskLevelSchema, z.number().int().min(0)),
  conditionEvaluations: z.array(z.object({
    type: triggerConditionTypeSchema,
    evaluations: z.number().int().min(0),
    metCount: z.number().int().min(0),
    unmetCount: z.number().int().min(0),
  })),
  itemMetrics: z.array(z.object({
    itemId: z.string().uuid(),
    simulationName: z.string(),
    status: scenarioSuiteItemStatusSchema,
    tokensUsed: z.number().int().min(0),
    stepsExecuted: z.number().int().min(0),
    durationMs: z.number().int().min(0),
    riskLevel: aiScenarioRiskLevelSchema.optional(),
  })),
});

export const scenarioSuiteStatsSchema = z.object({
  totalSuites: z.number().int().min(0),
  byStatus: z.record(scenarioSuiteStatusSchema, z.number().int().min(0)),
  totalRuns: z.number().int().min(0),
  runsByStatus: z.record(scenarioSuiteRunStatusSchema, z.number().int().min(0)),
  averageItemsPerSuite: z.number().min(0),
  averageRunDurationMs: z.number().min(0),
  mostUsedConditionType: triggerConditionTypeSchema,
  riskDistribution: z.record(aiScenarioRiskLevelSchema, z.number().int().min(0)),
});

// ============================================================================
// RISK MAP SCHEMAS
// ============================================================================

export const riskMapNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(['simulation', 'outcome', 'risk', 'opportunity']),
  riskLevel: aiScenarioRiskLevelSchema.optional(),
  details: z.record(z.unknown()).optional(),
});

export const riskMapEdgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  label: z.string().optional(),
  weight: z.number().optional(),
  conditionMet: z.boolean().optional(),
});

export const suiteRiskMapSchema = z.object({
  runId: z.string().uuid(),
  suiteId: z.string().uuid(),
  nodes: z.array(riskMapNodeSchema),
  edges: z.array(riskMapEdgeSchema),
  aggregateRiskLevel: aiScenarioRiskLevelSchema,
  riskFactors: z.array(z.object({
    factor: z.string(),
    severity: aiScenarioRiskLevelSchema,
    source: z.string(),
    mitigations: z.array(z.string()).optional(),
  })),
  opportunities: z.array(z.object({
    opportunity: z.string(),
    impact: z.enum(['low', 'medium', 'high']),
    source: z.string(),
  })),
  generatedAt: z.string(),
});

// ============================================================================
// UUID PARAMS SCHEMA
// ============================================================================

export const suiteIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const suiteRunIdParamSchema = z.object({
  runId: z.string().uuid(),
});

export const suiteItemIdParamSchema = z.object({
  itemId: z.string().uuid(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CreateScenarioSuiteInput = z.infer<typeof createScenarioSuiteSchema>;
export type UpdateScenarioSuiteInput = z.infer<typeof updateScenarioSuiteSchema>;
export type CreateSuiteItemInput = z.infer<typeof createSuiteItemSchema>;
export type UpdateSuiteItemInput = z.infer<typeof updateSuiteItemSchema>;
export type AddSuiteItemInput = z.infer<typeof addSuiteItemSchema>;
export type ListScenarioSuitesQuery = z.infer<typeof listScenarioSuitesSchema>;
export type ListSuiteRunsQuery = z.infer<typeof listSuiteRunsSchema>;
export type ListSuiteRunItemsQuery = z.infer<typeof listSuiteRunItemsSchema>;
export type ListSuiteAuditEventsQuery = z.infer<typeof listSuiteAuditEventsSchema>;
export type StartScenarioSuiteRunInput = z.infer<typeof startScenarioSuiteRunSchema>;
export type AdvanceSuiteRunInput = z.infer<typeof advanceSuiteRunSchema>;
export type AbortSuiteRunInput = z.infer<typeof abortSuiteRunSchema>;
export type GenerateSuiteNarrativeInput = z.infer<typeof generateSuiteNarrativeSchema>;
export type GenerateSuiteRiskMapInput = z.infer<typeof generateSuiteRiskMapSchema>;
export type ScenarioSuiteConfig = z.infer<typeof scenarioSuiteConfigSchema>;
export type SuiteItemExecutionConfig = z.infer<typeof suiteItemExecutionConfigSchema>;
export type TriggerCondition = z.infer<typeof triggerConditionSchema>;
export type SuiteRunMetrics = z.infer<typeof suiteRunMetricsSchema>;
export type ScenarioSuiteStats = z.infer<typeof scenarioSuiteStatsSchema>;
export type SuiteRiskMap = z.infer<typeof suiteRiskMapSchema>;
