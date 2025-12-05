/**
 * Sprint S59: Governance, Compliance & Audit Intelligence Engine Validators
 * Zod schemas for governance policy, rule, finding, and risk score validation
 */

import { z } from 'zod';
import type { GovernanceRuleCondition } from '@pravado/types';

// ========================================
// Enum Schemas
// ========================================

/**
 * Policy category classification
 */
export const governancePolicyCategorySchema = z.enum([
  'content',
  'crisis',
  'reputation',
  'journalist',
  'legal',
  'data_privacy',
  'media_relations',
  'executive_comms',
  'competitive_intel',
  'brand_safety',
]);

/**
 * Policy scope definition
 */
export const governancePolicyScopeSchema = z.enum([
  'global',
  'brand',
  'campaign',
  'journalist',
  'region',
  'channel',
  'team',
]);

/**
 * Severity levels
 */
export const governanceSeverityLevelSchema = z.enum([
  'low',
  'medium',
  'high',
  'critical',
]);

/**
 * Rule type classification
 */
export const governanceRuleTypeSchema = z.enum([
  'threshold',
  'pattern',
  'blacklist',
  'whitelist',
  'time_window',
  'compound',
  'frequency',
  'sentiment',
  'relationship',
  'approval_required',
]);

/**
 * Target systems
 */
export const governanceTargetSystemSchema = z.enum([
  'media_monitoring',
  'crisis',
  'reputation',
  'outreach',
  'briefings',
  'journalists',
  'press_releases',
  'pitches',
  'media_lists',
  'personas',
  'competitive_intel',
]);

/**
 * Finding status workflow states
 */
export const governanceFindingStatusSchema = z.enum([
  'open',
  'acknowledged',
  'in_progress',
  'resolved',
  'dismissed',
  'escalated',
]);

/**
 * Entity types for risk scoring
 */
export const governanceEntityTypeSchema = z.enum([
  'brand',
  'campaign',
  'journalist',
  'story',
  'channel',
  'outlet',
  'spokesperson',
  'competitor',
  'region',
]);

/**
 * Rule evaluation modes
 */
export const governanceEvaluationModeSchema = z.enum([
  'on_event',
  'scheduled',
  'manual',
]);

/**
 * Score trend indicators
 */
export const governanceScoreTrendSchema = z.enum([
  'improving',
  'stable',
  'worsening',
]);

/**
 * Insight generation method
 */
export const governanceInsightGenerationMethodSchema = z.enum([
  'rule_based',
  'llm_assisted',
  'hybrid',
]);

// ========================================
// Supporting Schemas
// ========================================

/**
 * Rule condition schema - uses z.lazy() with explicit type annotation to handle recursive structure
 */
export const governanceRuleConditionSchema: z.ZodType<GovernanceRuleCondition> = z.lazy(() =>
  z.object({
    field: z.string().optional(),
    operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'contains', 'matches', 'in', 'not_in']).optional(),
    value: z.unknown().optional(),
    threshold: z.number().optional(),
    pattern: z.string().optional(),
    items: z.array(z.string()).optional(),
    timeWindow: z.object({
      duration: z.number().int().min(1),
      unit: z.enum(['minutes', 'hours', 'days']),
    }).optional(),
    conditions: z.array(governanceRuleConditionSchema).optional(),
    logic: z.enum(['and', 'or']).optional(),
  }).passthrough()
);

/**
 * Rule action schema
 */
export const governanceRuleActionSchema = z.object({
  type: z.enum(['create_finding', 'notify', 'block', 'escalate', 'log', 'webhook']),
  severity: governanceSeverityLevelSchema.optional(),
  message: z.string().optional(),
  recipients: z.array(z.string()).optional(),
  webhookUrl: z.string().url().optional(),
  metadata: z.record(z.any()).optional(),
}).passthrough();

/**
 * Affected entity schema
 */
export const governanceAffectedEntitySchema = z.object({
  entityType: governanceEntityTypeSchema,
  entityId: z.string(),
  entityName: z.string().optional(),
  impact: z.enum(['direct', 'indirect']).optional(),
}).passthrough();

/**
 * Recommended action schema
 */
export const governanceRecommendedActionSchema = z.object({
  action: z.string(),
  priority: z.enum(['immediate', 'high', 'medium', 'low']),
  assignee: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  completed: z.boolean().optional(),
}).passthrough();

/**
 * Contributing factor schema
 */
export const governanceContributingFactorSchema = z.object({
  source: z.string(),
  factor: z.string(),
  contribution: z.number().min(0).max(100),
  trend: governanceScoreTrendSchema.optional(),
}).passthrough();

/**
 * Insight recommendation schema
 */
export const governanceInsightRecommendationSchema = z.object({
  title: z.string(),
  description: z.string(),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  category: z.string().optional(),
  estimatedImpact: z.string().optional(),
}).passthrough();

/**
 * Insight action item schema
 */
export const governanceInsightActionItemSchema = z.object({
  action: z.string(),
  assignee: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  status: z.enum(['pending', 'in_progress', 'completed']),
}).passthrough();

/**
 * Top risk item schema
 */
export const governanceInsightTopRiskSchema = z.object({
  entityType: governanceEntityTypeSchema,
  entityId: z.string(),
  entityName: z.string().optional(),
  riskScore: z.number().min(0).max(100),
  riskLevel: governanceSeverityLevelSchema,
  primaryConcern: z.string(),
  trend: governanceScoreTrendSchema.optional(),
}).passthrough();

/**
 * Insight recipient schema
 */
export const governanceInsightRecipientSchema = z.object({
  userId: z.string().uuid().optional(),
  email: z.string().email().optional(),
  role: z.string().optional(),
  sentAt: z.coerce.date().optional(),
}).passthrough();

// ========================================
// Entity Schemas
// ========================================

/**
 * Governance policy schema
 */
export const governancePolicySchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  key: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  category: governancePolicyCategorySchema,
  scope: governancePolicyScopeSchema,
  severity: governanceSeverityLevelSchema,
  ruleConfig: z.record(z.any()).default({}),
  isActive: z.boolean(),
  isArchived: z.boolean(),
  ownerUserId: z.string().uuid().optional(),
  department: z.string().max(100).optional(),
  regulatoryReference: z.string().max(255).optional(),
  effectiveDate: z.coerce.date().optional(),
  reviewDate: z.coerce.date().optional(),
  createdBy: z.string().uuid().optional(),
  updatedBy: z.string().uuid().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/**
 * Governance rule schema
 */
export const governanceRuleSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  policyId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  ruleType: governanceRuleTypeSchema,
  targetSystem: governanceTargetSystemSchema,
  condition: governanceRuleConditionSchema,
  action: governanceRuleActionSchema,
  priority: z.number().int().default(100),
  isActive: z.boolean(),
  evaluationMode: governanceEvaluationModeSchema,
  scheduleCron: z.string().max(100).optional(),
  cooldownMinutes: z.number().int().min(0).default(0),
  maxFindingsPerDay: z.number().int().min(0).optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.any()).default({}),
  createdBy: z.string().uuid().optional(),
  updatedBy: z.string().uuid().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/**
 * Governance finding schema
 */
export const governanceFindingSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  policyId: z.string().uuid(),
  ruleId: z.string().uuid(),
  sourceSystem: governanceTargetSystemSchema,
  sourceReferenceId: z.string().max(255),
  sourceReferenceType: z.string().max(100).optional(),
  severity: governanceSeverityLevelSchema,
  status: governanceFindingStatusSchema,
  summary: z.string().max(500),
  details: z.string().optional(),
  impactScore: z.number().int().min(0).max(100).optional(),
  affectedEntities: z.array(governanceAffectedEntitySchema).default([]),
  recommendedActions: z.array(governanceRecommendedActionSchema).default([]),
  mitigationNotes: z.string().optional(),
  assignedTo: z.string().uuid().optional(),
  resolvedBy: z.string().uuid().optional(),
  resolutionNotes: z.string().optional(),
  detectedAt: z.coerce.date(),
  acknowledgedAt: z.coerce.date().optional(),
  resolvedAt: z.coerce.date().optional(),
  dismissedAt: z.coerce.date().optional(),
  metadata: z.record(z.any()).default({}),
  eventSnapshot: z.record(z.any()).default({}),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/**
 * Governance risk score schema
 */
export const governanceRiskScoreSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  entityType: governanceEntityTypeSchema,
  entityId: z.string().max(255),
  entityName: z.string().max(255).optional(),
  overallScore: z.number().int().min(0).max(100),
  riskLevel: governanceSeverityLevelSchema,
  contentRisk: z.number().int().min(0).max(100).optional(),
  reputationRisk: z.number().int().min(0).max(100).optional(),
  crisisRisk: z.number().int().min(0).max(100).optional(),
  legalRisk: z.number().int().min(0).max(100).optional(),
  relationshipRisk: z.number().int().min(0).max(100).optional(),
  competitiveRisk: z.number().int().min(0).max(100).optional(),
  previousScore: z.number().int().min(0).max(100).optional(),
  scoreTrend: governanceScoreTrendSchema.optional(),
  trendPeriodDays: z.number().int().min(1).default(30),
  breakdown: z.record(z.any()).default({}),
  contributingFactors: z.array(governanceContributingFactorSchema).default([]),
  activeFindingsCount: z.number().int().min(0).default(0),
  linkedFindingIds: z.array(z.string().uuid()).default([]),
  computedAt: z.coerce.date(),
  computationMethod: z.string().max(50).default('weighted_average'),
  confidenceScore: z.number().min(0).max(1).optional(),
  validUntil: z.coerce.date().optional(),
  isStale: z.boolean().default(false),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/**
 * Governance audit insight schema
 */
export const governanceAuditInsightSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  timeWindowStart: z.coerce.date(),
  timeWindowEnd: z.coerce.date(),
  insightType: z.string().max(100).default('periodic_review'),
  scope: governancePolicyScopeSchema,
  title: z.string().max(255),
  summary: z.string(),
  executiveSummary: z.string().optional(),
  detailedAnalysis: z.string().optional(),
  recommendations: z.array(governanceInsightRecommendationSchema).default([]),
  actionItems: z.array(governanceInsightActionItemSchema).default([]),
  topRisks: z.array(governanceInsightTopRiskSchema).default([]),
  riskDistribution: z.record(z.number()).default({}),
  metricsSnapshot: z.record(z.any()).default({}),
  trendAnalysis: z.record(z.any()).default({}),
  linkedFindings: z.array(z.string().uuid()).default([]),
  findingsCount: z.number().int().min(0).default(0),
  resolvedFindingsCount: z.number().int().min(0).default(0),
  generatedBy: governanceInsightGenerationMethodSchema,
  llmModel: z.string().max(100).optional(),
  generationPrompt: z.string().optional(),
  tokensUsed: z.number().int().min(0).optional(),
  recipients: z.array(governanceInsightRecipientSchema).default([]),
  distributedAt: z.coerce.date().optional(),
  createdBy: z.string().uuid().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/**
 * Governance policy version schema
 */
export const governancePolicyVersionSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  policyId: z.string().uuid(),
  versionNumber: z.number().int().min(1),
  policySnapshot: z.record(z.any()),
  changeSummary: z.string().optional(),
  changedFields: z.array(z.string()).default([]),
  createdBy: z.string().uuid().optional(),
  createdAt: z.coerce.date(),
});

// ========================================
// Input Schemas (Create/Update)
// ========================================

/**
 * Create policy input schema
 */
export const createGovernancePolicyInputSchema = z.object({
  key: z.string().min(1).max(100).regex(/^[a-z0-9_]+$/, 'Key must be lowercase alphanumeric with underscores'),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  category: governancePolicyCategorySchema,
  scope: governancePolicyScopeSchema.optional().default('global'),
  severity: governanceSeverityLevelSchema.optional().default('medium'),
  ruleConfig: z.record(z.any()).optional().default({}),
  isActive: z.boolean().optional().default(true),
  ownerUserId: z.string().uuid().optional(),
  department: z.string().max(100).optional(),
  regulatoryReference: z.string().max(255).optional(),
  effectiveDate: z.coerce.date().optional(),
  reviewDate: z.coerce.date().optional(),
});

/**
 * Update policy input schema
 */
export const updateGovernancePolicyInputSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  category: governancePolicyCategorySchema.optional(),
  scope: governancePolicyScopeSchema.optional(),
  severity: governanceSeverityLevelSchema.optional(),
  ruleConfig: z.record(z.any()).optional(),
  isActive: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  ownerUserId: z.string().uuid().nullable().optional(),
  department: z.string().max(100).nullable().optional(),
  regulatoryReference: z.string().max(255).nullable().optional(),
  effectiveDate: z.coerce.date().nullable().optional(),
  reviewDate: z.coerce.date().nullable().optional(),
});

/**
 * Create rule input schema
 */
export const createGovernanceRuleInputSchema = z.object({
  policyId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  ruleType: governanceRuleTypeSchema,
  targetSystem: governanceTargetSystemSchema,
  condition: governanceRuleConditionSchema,
  action: governanceRuleActionSchema,
  priority: z.number().int().min(0).max(1000).optional().default(100),
  isActive: z.boolean().optional().default(true),
  evaluationMode: governanceEvaluationModeSchema.optional().default('on_event'),
  scheduleCron: z.string().max(100).optional(),
  cooldownMinutes: z.number().int().min(0).optional().default(0),
  maxFindingsPerDay: z.number().int().min(0).optional(),
  tags: z.array(z.string()).optional().default([]),
  metadata: z.record(z.any()).optional().default({}),
});

/**
 * Update rule input schema
 */
export const updateGovernanceRuleInputSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  ruleType: governanceRuleTypeSchema.optional(),
  targetSystem: governanceTargetSystemSchema.optional(),
  condition: governanceRuleConditionSchema.optional(),
  action: governanceRuleActionSchema.optional(),
  priority: z.number().int().min(0).max(1000).optional(),
  isActive: z.boolean().optional(),
  evaluationMode: governanceEvaluationModeSchema.optional(),
  scheduleCron: z.string().max(100).nullable().optional(),
  cooldownMinutes: z.number().int().min(0).optional(),
  maxFindingsPerDay: z.number().int().min(0).nullable().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Create finding input schema
 */
export const createGovernanceFindingInputSchema = z.object({
  policyId: z.string().uuid(),
  ruleId: z.string().uuid(),
  sourceSystem: governanceTargetSystemSchema,
  sourceReferenceId: z.string().max(255),
  sourceReferenceType: z.string().max(100).optional(),
  severity: governanceSeverityLevelSchema,
  summary: z.string().max(500),
  details: z.string().optional(),
  impactScore: z.number().int().min(0).max(100).optional(),
  affectedEntities: z.array(governanceAffectedEntitySchema).optional().default([]),
  recommendedActions: z.array(governanceRecommendedActionSchema).optional().default([]),
  metadata: z.record(z.any()).optional().default({}),
  eventSnapshot: z.record(z.any()).optional().default({}),
});

/**
 * Update finding input schema
 */
export const updateGovernanceFindingInputSchema = z.object({
  status: governanceFindingStatusSchema.optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  mitigationNotes: z.string().nullable().optional(),
  resolutionNotes: z.string().nullable().optional(),
  recommendedActions: z.array(governanceRecommendedActionSchema).optional(),
});

/**
 * Upsert risk score input schema
 */
export const upsertGovernanceRiskScoreInputSchema = z.object({
  entityType: governanceEntityTypeSchema,
  entityId: z.string().max(255),
  entityName: z.string().max(255).optional(),
  overallScore: z.number().int().min(0).max(100),
  riskLevel: governanceSeverityLevelSchema,
  contentRisk: z.number().int().min(0).max(100).optional(),
  reputationRisk: z.number().int().min(0).max(100).optional(),
  crisisRisk: z.number().int().min(0).max(100).optional(),
  legalRisk: z.number().int().min(0).max(100).optional(),
  relationshipRisk: z.number().int().min(0).max(100).optional(),
  competitiveRisk: z.number().int().min(0).max(100).optional(),
  breakdown: z.record(z.any()).optional().default({}),
  contributingFactors: z.array(governanceContributingFactorSchema).optional().default([]),
  linkedFindingIds: z.array(z.string().uuid()).optional().default([]),
  computationMethod: z.string().max(50).optional().default('weighted_average'),
  confidenceScore: z.number().min(0).max(1).optional(),
  validUntil: z.coerce.date().optional(),
});

/**
 * Create audit insight input schema
 */
export const createGovernanceAuditInsightInputSchema = z.object({
  timeWindowStart: z.coerce.date(),
  timeWindowEnd: z.coerce.date(),
  insightType: z.string().max(100).optional().default('periodic_review'),
  scope: governancePolicyScopeSchema.optional().default('global'),
  title: z.string().max(255),
  summary: z.string(),
  executiveSummary: z.string().optional(),
  detailedAnalysis: z.string().optional(),
  recommendations: z.array(governanceInsightRecommendationSchema).optional().default([]),
  actionItems: z.array(governanceInsightActionItemSchema).optional().default([]),
  topRisks: z.array(governanceInsightTopRiskSchema).optional().default([]),
  riskDistribution: z.record(z.number()).optional().default({}),
  metricsSnapshot: z.record(z.any()).optional().default({}),
  trendAnalysis: z.record(z.any()).optional().default({}),
  linkedFindings: z.array(z.string().uuid()).optional().default([]),
  generatedBy: governanceInsightGenerationMethodSchema.optional().default('rule_based'),
  llmModel: z.string().max(100).optional(),
  generationPrompt: z.string().optional(),
  tokensUsed: z.number().int().min(0).optional(),
});

// ========================================
// Query Schemas
// ========================================

/**
 * Policies query schema
 */
export const governancePoliciesQuerySchema = z.object({
  category: z.union([governancePolicyCategorySchema, z.array(governancePolicyCategorySchema)]).optional(),
  scope: z.union([governancePolicyScopeSchema, z.array(governancePolicyScopeSchema)]).optional(),
  severity: z.union([governanceSeverityLevelSchema, z.array(governanceSeverityLevelSchema)]).optional(),
  isActive: z.coerce.boolean().optional(),
  isArchived: z.coerce.boolean().optional(),
  ownerUserId: z.string().uuid().optional(),
  department: z.string().optional(),
  searchQuery: z.string().max(200).optional(),
  sortBy: z.enum(['created_at', 'updated_at', 'name', 'severity']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

/**
 * Rules query schema
 */
export const governanceRulesQuerySchema = z.object({
  policyId: z.string().uuid().optional(),
  ruleType: z.union([governanceRuleTypeSchema, z.array(governanceRuleTypeSchema)]).optional(),
  targetSystem: z.union([governanceTargetSystemSchema, z.array(governanceTargetSystemSchema)]).optional(),
  isActive: z.coerce.boolean().optional(),
  evaluationMode: governanceEvaluationModeSchema.optional(),
  tags: z.array(z.string()).optional(),
  searchQuery: z.string().max(200).optional(),
  sortBy: z.enum(['created_at', 'updated_at', 'name', 'priority']).optional().default('priority'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

/**
 * Findings query schema
 */
export const governanceFindingsQuerySchema = z.object({
  policyId: z.string().uuid().optional(),
  ruleId: z.string().uuid().optional(),
  sourceSystem: z.union([governanceTargetSystemSchema, z.array(governanceTargetSystemSchema)]).optional(),
  severity: z.union([governanceSeverityLevelSchema, z.array(governanceSeverityLevelSchema)]).optional(),
  status: z.union([governanceFindingStatusSchema, z.array(governanceFindingStatusSchema)]).optional(),
  assignedTo: z.string().uuid().optional(),
  detectedAfter: z.coerce.date().optional(),
  detectedBefore: z.coerce.date().optional(),
  searchQuery: z.string().max(200).optional(),
  sortBy: z.enum(['detected_at', 'severity', 'status', 'impact_score']).optional().default('detected_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

/**
 * Risk scores query schema
 */
export const governanceRiskScoresQuerySchema = z.object({
  entityType: z.union([governanceEntityTypeSchema, z.array(governanceEntityTypeSchema)]).optional(),
  riskLevel: z.union([governanceSeverityLevelSchema, z.array(governanceSeverityLevelSchema)]).optional(),
  minOverallScore: z.coerce.number().int().min(0).max(100).optional(),
  maxOverallScore: z.coerce.number().int().min(0).max(100).optional(),
  scoreTrend: governanceScoreTrendSchema.optional(),
  isStale: z.coerce.boolean().optional(),
  sortBy: z.enum(['overall_score', 'computed_at', 'entity_name']).optional().default('overall_score'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

/**
 * Audit insights query schema
 */
export const governanceAuditInsightsQuerySchema = z.object({
  insightType: z.string().optional(),
  scope: z.union([governancePolicyScopeSchema, z.array(governancePolicyScopeSchema)]).optional(),
  timeWindowStart: z.coerce.date().optional(),
  timeWindowEnd: z.coerce.date().optional(),
  generatedBy: governanceInsightGenerationMethodSchema.optional(),
  sortBy: z.enum(['created_at', 'time_window_start', 'title']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

// ========================================
// API Request Schemas
// ========================================

/**
 * Policy ID param schema
 */
export const governancePolicyIdParamSchema = z.object({
  id: z.string().uuid(),
});

/**
 * Rule ID param schema
 */
export const governanceRuleIdParamSchema = z.object({
  id: z.string().uuid(),
});

/**
 * Finding ID param schema
 */
export const governanceFindingIdParamSchema = z.object({
  id: z.string().uuid(),
});

/**
 * Risk score ID param schema
 */
export const governanceRiskScoreIdParamSchema = z.object({
  id: z.string().uuid(),
});

/**
 * Insight ID param schema
 */
export const governanceInsightIdParamSchema = z.object({
  id: z.string().uuid(),
});

/**
 * Acknowledge finding request schema
 */
export const acknowledgeFindingRequestSchema = z.object({
  notes: z.string().optional(),
});

/**
 * Resolve finding request schema
 */
export const resolveFindingRequestSchema = z.object({
  resolutionNotes: z.string().min(1),
});

/**
 * Dismiss finding request schema
 */
export const dismissFindingRequestSchema = z.object({
  reason: z.string().min(1),
});

/**
 * Escalate finding request schema
 */
export const escalateFindingRequestSchema = z.object({
  escalateTo: z.string().min(1),
  notes: z.string().optional(),
});

/**
 * Generate insight request schema
 */
export const generateGovernanceInsightRequestSchema = z.object({
  timeWindowStart: z.coerce.date(),
  timeWindowEnd: z.coerce.date(),
  scope: governancePolicyScopeSchema.optional().default('global'),
  insightType: z.string().max(100).optional().default('periodic_review'),
  useLlm: z.boolean().optional().default(false),
  llmModel: z.string().max(100).optional(),
});

/**
 * Distribute insight request schema
 */
export const distributeGovernanceInsightRequestSchema = z.object({
  insightId: z.string().uuid(),
  recipients: z.array(governanceInsightRecipientSchema).min(1),
});

/**
 * Recalculate risk score request schema
 */
export const recalculateRiskScoreRequestSchema = z.object({
  entityType: governanceEntityTypeSchema,
  entityId: z.string().max(255),
  force: z.boolean().optional().default(false),
});

/**
 * Bulk recalculate risk scores request schema
 */
export const bulkRecalculateRiskScoresRequestSchema = z.object({
  entityType: governanceEntityTypeSchema.optional(),
  staleOnly: z.boolean().optional().default(true),
});

// ========================================
// Rule Evaluation Schemas
// ========================================

/**
 * Evaluation context schema
 */
export const governanceEvaluationContextSchema = z.object({
  sourceSystem: governanceTargetSystemSchema,
  eventType: z.string(),
  eventId: z.string(),
  eventData: z.record(z.any()),
  timestamp: z.coerce.date(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Evaluation result schema
 */
export const governanceEvaluationResultSchema = z.object({
  ruleId: z.string().uuid(),
  triggered: z.boolean(),
  conditionsMet: z.boolean(),
  findingCreated: z.string().uuid().optional(),
  actionsTaken: z.array(z.string()),
  evaluationDuration: z.number().int().min(0),
  error: z.string().optional(),
});

/**
 * Batch evaluation request schema
 */
export const batchEvaluationRequestSchema = z.object({
  context: governanceEvaluationContextSchema,
  ruleIds: z.array(z.string().uuid()).optional(), // If not provided, evaluate all applicable rules
});

/**
 * Batch evaluation response schema
 */
export const batchEvaluationResponseSchema = z.object({
  context: governanceEvaluationContextSchema,
  results: z.array(governanceEvaluationResultSchema),
  totalRulesEvaluated: z.number().int().min(0),
  findingsCreated: z.number().int().min(0),
  duration: z.number().int().min(0),
});

// ========================================
// Database Record Schemas (snake_case)
// ========================================

/**
 * Policy database record schema
 */
export const governancePolicyRecordSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  key: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  category: governancePolicyCategorySchema,
  scope: governancePolicyScopeSchema,
  severity: governanceSeverityLevelSchema,
  rule_config: z.record(z.any()),
  is_active: z.boolean(),
  is_archived: z.boolean(),
  owner_user_id: z.string().uuid().nullable(),
  department: z.string().nullable(),
  regulatory_reference: z.string().nullable(),
  effective_date: z.string().nullable(),
  review_date: z.string().nullable(),
  created_by: z.string().uuid().nullable(),
  updated_by: z.string().uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

/**
 * Rule database record schema
 */
export const governanceRuleRecordSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  policy_id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  rule_type: governanceRuleTypeSchema,
  target_system: governanceTargetSystemSchema,
  condition: z.record(z.any()),
  action: z.record(z.any()),
  priority: z.number().int(),
  is_active: z.boolean(),
  evaluation_mode: z.string().nullable(),
  schedule_cron: z.string().nullable(),
  cooldown_minutes: z.number().int().nullable(),
  max_findings_per_day: z.number().int().nullable(),
  tags: z.array(z.string()).nullable(),
  metadata: z.record(z.any()).nullable(),
  created_by: z.string().uuid().nullable(),
  updated_by: z.string().uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

/**
 * Finding database record schema
 */
export const governanceFindingRecordSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  policy_id: z.string().uuid(),
  rule_id: z.string().uuid(),
  source_system: governanceTargetSystemSchema,
  source_reference_id: z.string(),
  source_reference_type: z.string().nullable(),
  severity: governanceSeverityLevelSchema,
  status: governanceFindingStatusSchema,
  summary: z.string(),
  details: z.string().nullable(),
  impact_score: z.number().int().nullable(),
  affected_entities: z.array(z.any()),
  recommended_actions: z.array(z.any()),
  mitigation_notes: z.string().nullable(),
  assigned_to: z.string().uuid().nullable(),
  resolved_by: z.string().uuid().nullable(),
  resolution_notes: z.string().nullable(),
  detected_at: z.string(),
  acknowledged_at: z.string().nullable(),
  resolved_at: z.string().nullable(),
  dismissed_at: z.string().nullable(),
  metadata: z.record(z.any()),
  event_snapshot: z.record(z.any()),
  created_at: z.string(),
  updated_at: z.string(),
});

/**
 * Risk score database record schema
 */
export const governanceRiskScoreRecordSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  entity_type: governanceEntityTypeSchema,
  entity_id: z.string(),
  entity_name: z.string().nullable(),
  overall_score: z.number().int(),
  risk_level: governanceSeverityLevelSchema,
  content_risk: z.number().int().nullable(),
  reputation_risk: z.number().int().nullable(),
  crisis_risk: z.number().int().nullable(),
  legal_risk: z.number().int().nullable(),
  relationship_risk: z.number().int().nullable(),
  competitive_risk: z.number().int().nullable(),
  previous_score: z.number().int().nullable(),
  score_trend: z.string().nullable(),
  trend_period_days: z.number().int().nullable(),
  breakdown: z.record(z.any()),
  contributing_factors: z.array(z.any()),
  active_findings_count: z.number().int().nullable(),
  linked_finding_ids: z.array(z.string().uuid()).nullable(),
  computed_at: z.string(),
  computation_method: z.string().nullable(),
  confidence_score: z.number().nullable(),
  valid_until: z.string().nullable(),
  is_stale: z.boolean().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

/**
 * Audit insight database record schema
 */
export const governanceAuditInsightRecordSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  time_window_start: z.string(),
  time_window_end: z.string(),
  insight_type: z.string().nullable(),
  scope: governancePolicyScopeSchema.nullable(),
  title: z.string(),
  summary: z.string(),
  executive_summary: z.string().nullable(),
  detailed_analysis: z.string().nullable(),
  recommendations: z.array(z.any()),
  action_items: z.array(z.any()),
  top_risks: z.array(z.any()),
  risk_distribution: z.record(z.any()),
  metrics_snapshot: z.record(z.any()),
  trend_analysis: z.record(z.any()),
  linked_findings: z.array(z.string().uuid()).nullable(),
  findings_count: z.number().int().nullable(),
  resolved_findings_count: z.number().int().nullable(),
  generated_by: z.string(),
  llm_model: z.string().nullable(),
  generation_prompt: z.string().nullable(),
  tokens_used: z.number().int().nullable(),
  recipients: z.array(z.any()),
  distributed_at: z.string().nullable(),
  created_by: z.string().uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

/**
 * Policy version database record schema
 */
export const governancePolicyVersionRecordSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  policy_id: z.string().uuid(),
  version_number: z.number().int(),
  policy_snapshot: z.record(z.any()),
  change_summary: z.string().nullable(),
  changed_fields: z.array(z.string()).nullable(),
  created_by: z.string().uuid().nullable(),
  created_at: z.string(),
});

// ========================================
// Type Exports
// ========================================

export type GovernancePolicyCategoryType = z.infer<typeof governancePolicyCategorySchema>;
export type GovernancePolicyScopeType = z.infer<typeof governancePolicyScopeSchema>;
export type GovernanceSeverityLevelType = z.infer<typeof governanceSeverityLevelSchema>;
export type GovernanceRuleTypeType = z.infer<typeof governanceRuleTypeSchema>;
export type GovernanceTargetSystemType = z.infer<typeof governanceTargetSystemSchema>;
export type GovernanceFindingStatusType = z.infer<typeof governanceFindingStatusSchema>;
export type GovernanceEntityTypeType = z.infer<typeof governanceEntityTypeSchema>;
export type GovernanceEvaluationModeType = z.infer<typeof governanceEvaluationModeSchema>;
export type GovernanceScoreTrendType = z.infer<typeof governanceScoreTrendSchema>;
export type GovernanceInsightGenerationMethodType = z.infer<typeof governanceInsightGenerationMethodSchema>;

export type GovernanceRuleConditionType = z.infer<typeof governanceRuleConditionSchema>;
export type GovernanceRuleActionType = z.infer<typeof governanceRuleActionSchema>;
export type GovernanceAffectedEntityType = z.infer<typeof governanceAffectedEntitySchema>;
export type GovernanceRecommendedActionType = z.infer<typeof governanceRecommendedActionSchema>;
export type GovernanceContributingFactorType = z.infer<typeof governanceContributingFactorSchema>;
export type GovernanceInsightRecommendationType = z.infer<typeof governanceInsightRecommendationSchema>;
export type GovernanceInsightActionItemType = z.infer<typeof governanceInsightActionItemSchema>;
export type GovernanceInsightTopRiskType = z.infer<typeof governanceInsightTopRiskSchema>;
export type GovernanceInsightRecipientType = z.infer<typeof governanceInsightRecipientSchema>;

export type GovernancePolicyType = z.infer<typeof governancePolicySchema>;
export type GovernanceRuleSchemaType = z.infer<typeof governanceRuleSchema>;
export type GovernanceFindingType = z.infer<typeof governanceFindingSchema>;
export type GovernanceRiskScoreType = z.infer<typeof governanceRiskScoreSchema>;
export type GovernanceAuditInsightType = z.infer<typeof governanceAuditInsightSchema>;
export type GovernancePolicyVersionType = z.infer<typeof governancePolicyVersionSchema>;

export type CreateGovernancePolicyInput = z.infer<typeof createGovernancePolicyInputSchema>;
export type UpdateGovernancePolicyInput = z.infer<typeof updateGovernancePolicyInputSchema>;
export type CreateGovernanceRuleInput = z.infer<typeof createGovernanceRuleInputSchema>;
export type UpdateGovernanceRuleInput = z.infer<typeof updateGovernanceRuleInputSchema>;
export type CreateGovernanceFindingInput = z.infer<typeof createGovernanceFindingInputSchema>;
export type UpdateGovernanceFindingInput = z.infer<typeof updateGovernanceFindingInputSchema>;
export type UpsertGovernanceRiskScoreInput = z.infer<typeof upsertGovernanceRiskScoreInputSchema>;
export type CreateGovernanceAuditInsightInput = z.infer<typeof createGovernanceAuditInsightInputSchema>;

export type GovernancePoliciesQuery = z.infer<typeof governancePoliciesQuerySchema>;
export type GovernanceRulesQuery = z.infer<typeof governanceRulesQuerySchema>;
export type GovernanceFindingsQuery = z.infer<typeof governanceFindingsQuerySchema>;
export type GovernanceRiskScoresQuery = z.infer<typeof governanceRiskScoresQuerySchema>;
export type GovernanceAuditInsightsQuery = z.infer<typeof governanceAuditInsightsQuerySchema>;

export type GovernanceEvaluationContext = z.infer<typeof governanceEvaluationContextSchema>;
export type GovernanceEvaluationResult = z.infer<typeof governanceEvaluationResultSchema>;
export type BatchEvaluationRequest = z.infer<typeof batchEvaluationRequestSchema>;
export type BatchEvaluationResponse = z.infer<typeof batchEvaluationResponseSchema>;

export type AcknowledgeFindingRequest = z.infer<typeof acknowledgeFindingRequestSchema>;
export type ResolveFindingRequest = z.infer<typeof resolveFindingRequestSchema>;
export type DismissFindingRequest = z.infer<typeof dismissFindingRequestSchema>;
export type EscalateFindingRequest = z.infer<typeof escalateFindingRequestSchema>;
export type GenerateGovernanceInsightRequest = z.infer<typeof generateGovernanceInsightRequestSchema>;
export type DistributeGovernanceInsightRequest = z.infer<typeof distributeGovernanceInsightRequestSchema>;
export type RecalculateRiskScoreRequest = z.infer<typeof recalculateRiskScoreRequestSchema>;
export type BulkRecalculateRiskScoresRequest = z.infer<typeof bulkRecalculateRiskScoresRequestSchema>;

export type GovernancePolicyRecord = z.infer<typeof governancePolicyRecordSchema>;
export type GovernanceRuleRecord = z.infer<typeof governanceRuleRecordSchema>;
export type GovernanceFindingRecord = z.infer<typeof governanceFindingRecordSchema>;
export type GovernanceRiskScoreRecord = z.infer<typeof governanceRiskScoreRecordSchema>;
export type GovernanceAuditInsightRecord = z.infer<typeof governanceAuditInsightRecordSchema>;
export type GovernancePolicyVersionRecord = z.infer<typeof governancePolicyVersionRecordSchema>;
