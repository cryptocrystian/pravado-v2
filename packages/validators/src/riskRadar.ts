/**
 * Sprint S60: Executive Risk Radar & Predictive Crisis Forecasting Engine Validators
 * Zod schemas for risk radar snapshots, indicators, forecasts, drivers, and notes
 */

import { z } from 'zod';

// ========================================
// Enum Schemas
// ========================================

/**
 * Risk level classification
 */
export const riskRadarLevelSchema = z.enum([
  'low',
  'medium',
  'high',
  'critical',
]);

/**
 * Indicator type classification
 */
export const riskRadarIndicatorTypeSchema = z.enum([
  'sentiment',
  'velocity',
  'alerts',
  'competitive',
  'governance',
  'persona',
  'media_coverage',
  'crisis_history',
  'reputation',
]);

/**
 * Forecast time horizon
 */
export const riskRadarForecastHorizonSchema = z.enum([
  '24h',
  '72h',
  '7d',
  '14d',
  '30d',
]);

/**
 * Driver category classification
 */
export const riskRadarDriverCategorySchema = z.enum([
  'sentiment_shift',
  'velocity_spike',
  'competitive_pressure',
  'governance_violation',
  'media_surge',
  'crisis_pattern',
  'persona_sensitivity',
  'external_event',
  'reputation_decline',
]);

/**
 * Note type classification
 */
export const riskRadarNoteTypeSchema = z.enum([
  'observation',
  'action_taken',
  'escalation',
  'resolution',
  'context',
  'executive_comment',
]);

/**
 * Trend direction
 */
export const riskRadarTrendDirectionSchema = z.enum([
  'improving',
  'stable',
  'worsening',
  'volatile',
]);

// ========================================
// Supporting Schemas
// ========================================

/**
 * Signal source schema
 */
export const riskRadarSignalSourceSchema = z.object({
  system: z.string(),
  metric: z.string(),
  value: z.number(),
  normalizedValue: z.number().optional(),
  timestamp: z.coerce.date(),
  metadata: z.record(z.any()).optional(),
}).passthrough();

/**
 * Signal matrix schema
 */
export const riskRadarSignalMatrixSchema = z.object({
  // Media monitoring (S40-S43)
  mediaVolume: z.number().optional(),
  mediaSentiment: z.number().optional(),
  mediaReach: z.number().optional(),
  alertCount: z.number().optional(),
  alertSeverity: z.number().optional(),

  // Crisis (S55)
  activeCrisisCount: z.number().optional(),
  crisisSeverity: z.number().optional(),
  escalationCount: z.number().optional(),

  // Brand reputation (S56-S57)
  reputationScore: z.number().optional(),
  reputationTrend: z.number().optional(),
  sentimentShift: z.number().optional(),

  // Competitive intelligence (S53)
  competitivePressure: z.number().optional(),
  marketShareChange: z.number().optional(),
  competitorMentions: z.number().optional(),

  // Governance (S59)
  openFindings: z.number().optional(),
  findingSeverity: z.number().optional(),
  complianceScore: z.number().optional(),

  // Persona insights (S51)
  personaSensitivity: z.number().optional(),
  audienceRisk: z.number().optional(),

  // Media performance (S52)
  performanceScore: z.number().optional(),
  coverageQuality: z.number().optional(),

  // Raw signals
  rawSignals: z.array(riskRadarSignalSourceSchema).optional(),
}).passthrough();

/**
 * Key concern schema
 */
export const riskRadarConcernSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  severity: riskRadarLevelSchema,
  source: z.string(),
  relatedDriverIds: z.array(z.string()).optional(),
  timestamp: z.coerce.date(),
}).passthrough();

/**
 * Emerging risk schema
 */
export const riskRadarEmergingRiskSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  probability: z.number().min(0).max(1),
  potentialImpact: riskRadarLevelSchema,
  firstDetected: z.coerce.date(),
  velocity: z.number(),
  indicators: z.array(z.string()),
}).passthrough();

/**
 * Positive factor schema
 */
export const riskRadarPositiveFactorSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  impact: z.number(),
  source: z.string(),
}).passthrough();

/**
 * Projection point schema
 */
export const riskRadarProjectionPointSchema = z.object({
  timestamp: z.coerce.date(),
  value: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1),
  lowerBound: z.number().optional(),
  upperBound: z.number().optional(),
}).passthrough();

/**
 * Forecast assumption schema
 */
export const riskRadarForecastAssumptionSchema = z.object({
  assumption: z.string(),
  confidence: z.number().min(0).max(1),
  impact: z.enum(['low', 'medium', 'high']),
}).passthrough();

/**
 * Recommended action schema
 */
export const riskRadarRecommendedActionSchema = z.object({
  action: z.string(),
  priority: z.enum(['immediate', 'high', 'medium', 'low']),
  owner: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  rationale: z.string().optional(),
}).passthrough();

/**
 * Watch item schema
 */
export const riskRadarWatchItemSchema = z.object({
  item: z.string(),
  reason: z.string(),
  threshold: z.number().optional(),
  currentValue: z.number().optional(),
}).passthrough();

/**
 * Affected entity schema
 */
export const riskRadarAffectedEntitySchema = z.object({
  entityType: z.string(),
  entityId: z.string(),
  entityName: z.string().optional(),
  impact: riskRadarLevelSchema,
}).passthrough();

// ========================================
// Entity Schemas
// ========================================

/**
 * Snapshot schema
 */
export const riskRadarSnapshotSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  snapshotDate: z.coerce.date(),
  title: z.string().optional(),
  description: z.string().optional(),
  overallRiskIndex: z.number().min(0).max(100),
  riskLevel: riskRadarLevelSchema,
  confidenceScore: z.number().min(0).max(1).optional(),
  sentimentScore: z.number().min(0).max(100).optional(),
  velocityScore: z.number().min(0).max(100).optional(),
  alertScore: z.number().min(0).max(100).optional(),
  competitiveScore: z.number().min(0).max(100).optional(),
  governanceScore: z.number().min(0).max(100).optional(),
  personaScore: z.number().min(0).max(100).optional(),
  signalMatrix: riskRadarSignalMatrixSchema,
  keyConcerns: z.array(riskRadarConcernSchema),
  emergingRisks: z.array(riskRadarEmergingRiskSchema),
  positiveFactors: z.array(riskRadarPositiveFactorSchema),
  isActive: z.boolean(),
  isArchived: z.boolean(),
  computationMethod: z.string(),
  modelVersion: z.string().optional(),
  computationDurationMs: z.number().int().optional(),
  createdBy: z.string().uuid().optional(),
  updatedBy: z.string().uuid().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/**
 * Indicator schema
 */
export const riskRadarIndicatorSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  snapshotId: z.string().uuid(),
  indicatorType: riskRadarIndicatorTypeSchema,
  name: z.string(),
  description: z.string().optional(),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  normalizedScore: z.number().min(0).max(100).optional(),
  previousScore: z.number().optional(),
  scoreDelta: z.number().optional(),
  trendDirection: riskRadarTrendDirectionSchema.optional(),
  velocity: z.number().optional(),
  sourceSystem: z.string(),
  sourceReferenceId: z.string().optional(),
  sourceData: z.record(z.any()),
  measurementStart: z.coerce.date().optional(),
  measurementEnd: z.coerce.date().optional(),
  metadata: z.record(z.any()),
  tags: z.array(z.string()),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/**
 * Forecast schema
 */
export const riskRadarForecastSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  snapshotId: z.string().uuid(),
  horizon: riskRadarForecastHorizonSchema,
  forecastDate: z.coerce.date(),
  targetDate: z.coerce.date(),
  predictedRiskIndex: z.number().min(0).max(100),
  predictedRiskLevel: riskRadarLevelSchema,
  confidenceIntervalLow: z.number().optional(),
  confidenceIntervalHigh: z.number().optional(),
  probabilityOfCrisis: z.number().min(0).max(1).optional(),
  projectionCurve: z.array(riskRadarProjectionPointSchema),
  executiveSummary: z.string().optional(),
  detailedAnalysis: z.string().optional(),
  keyAssumptions: z.array(riskRadarForecastAssumptionSchema),
  recommendedActions: z.array(riskRadarRecommendedActionSchema),
  watchItems: z.array(riskRadarWatchItemSchema),
  modelName: z.string().optional(),
  modelVersion: z.string().optional(),
  llmModel: z.string().optional(),
  tokensUsed: z.number().int().optional(),
  generationDurationMs: z.number().int().optional(),
  isCurrent: z.boolean(),
  supersededBy: z.string().uuid().optional(),
  accuracyScore: z.number().min(0).max(1).optional(),
  createdBy: z.string().uuid().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/**
 * Driver schema
 */
export const riskRadarDriverSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  snapshotId: z.string().uuid(),
  category: riskRadarDriverCategorySchema,
  name: z.string(),
  description: z.string().optional(),
  impactScore: z.number().min(0).max(100),
  contributionPercentage: z.number().min(0).max(100).optional(),
  urgency: riskRadarLevelSchema,
  sourceSystem: z.string().optional(),
  sourceReferenceId: z.string().optional(),
  sourceData: z.record(z.any()),
  isEmerging: z.boolean(),
  isTurningPoint: z.boolean(),
  firstDetectedAt: z.coerce.date().optional(),
  trendVelocity: z.number().optional(),
  affectedEntities: z.array(riskRadarAffectedEntitySchema),
  relatedIndicatorIds: z.array(z.string().uuid()),
  metadata: z.record(z.any()),
  tags: z.array(z.string()),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/**
 * Note schema
 */
export const riskRadarNoteSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  snapshotId: z.string().uuid(),
  noteType: riskRadarNoteTypeSchema,
  title: z.string().optional(),
  content: z.string(),
  relatedIndicatorId: z.string().uuid().optional(),
  relatedDriverId: z.string().uuid().optional(),
  relatedForecastId: z.string().uuid().optional(),
  isExecutiveVisible: z.boolean(),
  isPinned: z.boolean(),
  metadata: z.record(z.any()),
  tags: z.array(z.string()),
  createdBy: z.string().uuid(),
  updatedBy: z.string().uuid().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// ========================================
// Input Schemas (Create/Update)
// ========================================

/**
 * Create snapshot input schema
 */
export const createRiskRadarSnapshotInputSchema = z.object({
  title: z.string().max(255).optional(),
  description: z.string().optional(),
  signalMatrix: riskRadarSignalMatrixSchema.optional(),
  computationMethod: z.string().max(50).optional().default('weighted_aggregate'),
});

/**
 * Update snapshot input schema
 */
export const updateRiskRadarSnapshotInputSchema = z.object({
  title: z.string().max(255).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});

/**
 * Create indicator input schema
 */
export const createRiskRadarIndicatorInputSchema = z.object({
  indicatorType: riskRadarIndicatorTypeSchema,
  name: z.string().max(255),
  description: z.string().optional(),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1).optional().default(1.0),
  sourceSystem: z.string().max(100),
  sourceReferenceId: z.string().max(255).optional(),
  sourceData: z.record(z.any()).optional().default({}),
  measurementStart: z.coerce.date().optional(),
  measurementEnd: z.coerce.date().optional(),
  tags: z.array(z.string()).optional().default([]),
});

/**
 * Create forecast input schema
 */
export const createRiskRadarForecastInputSchema = z.object({
  horizon: riskRadarForecastHorizonSchema,
  useLlm: z.boolean().optional().default(false),
  llmModel: z.string().max(100).optional(),
  customPrompt: z.string().optional(),
});

/**
 * Regenerate forecast input schema
 */
export const regenerateRiskRadarForecastInputSchema = z.object({
  useLlm: z.boolean().optional().default(true),
  llmModel: z.string().max(100).optional(),
  customPrompt: z.string().optional(),
  includeDetailedAnalysis: z.boolean().optional().default(true),
});

/**
 * Create driver input schema
 */
export const createRiskRadarDriverInputSchema = z.object({
  category: riskRadarDriverCategorySchema,
  name: z.string().max(255),
  description: z.string().optional(),
  impactScore: z.number().min(0).max(100),
  contributionPercentage: z.number().min(0).max(100).optional(),
  urgency: riskRadarLevelSchema.optional().default('medium'),
  sourceSystem: z.string().max(100).optional(),
  sourceReferenceId: z.string().max(255).optional(),
  sourceData: z.record(z.any()).optional().default({}),
  isEmerging: z.boolean().optional().default(false),
  isTurningPoint: z.boolean().optional().default(false),
  affectedEntities: z.array(riskRadarAffectedEntitySchema).optional().default([]),
  relatedIndicatorIds: z.array(z.string().uuid()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
});

/**
 * Create note input schema
 */
export const createRiskRadarNoteInputSchema = z.object({
  noteType: riskRadarNoteTypeSchema.optional().default('observation'),
  title: z.string().max(255).optional(),
  content: z.string().min(1),
  relatedIndicatorId: z.string().uuid().optional(),
  relatedDriverId: z.string().uuid().optional(),
  relatedForecastId: z.string().uuid().optional(),
  isExecutiveVisible: z.boolean().optional().default(true),
  isPinned: z.boolean().optional().default(false),
  tags: z.array(z.string()).optional().default([]),
});

/**
 * Update note input schema
 */
export const updateRiskRadarNoteInputSchema = z.object({
  title: z.string().max(255).optional(),
  content: z.string().min(1).optional(),
  isExecutiveVisible: z.boolean().optional(),
  isPinned: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

// ========================================
// Query Schemas
// ========================================

/**
 * Snapshots query schema
 */
export const riskRadarSnapshotsQuerySchema = z.object({
  riskLevel: z.union([riskRadarLevelSchema, z.array(riskRadarLevelSchema)]).optional(),
  isActive: z.coerce.boolean().optional(),
  isArchived: z.coerce.boolean().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  minRiskIndex: z.coerce.number().min(0).max(100).optional(),
  maxRiskIndex: z.coerce.number().min(0).max(100).optional(),
  sortBy: z.enum(['snapshot_date', 'overall_risk_index', 'created_at']).optional().default('snapshot_date'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

/**
 * Indicators query schema
 */
export const riskRadarIndicatorsQuerySchema = z.object({
  indicatorType: z.union([riskRadarIndicatorTypeSchema, z.array(riskRadarIndicatorTypeSchema)]).optional(),
  sourceSystem: z.string().optional(),
  minScore: z.coerce.number().min(0).max(100).optional(),
  maxScore: z.coerce.number().min(0).max(100).optional(),
  trendDirection: riskRadarTrendDirectionSchema.optional(),
  sortBy: z.enum(['score', 'created_at', 'indicator_type']).optional().default('score'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

/**
 * Forecasts query schema
 */
export const riskRadarForecastsQuerySchema = z.object({
  horizon: z.union([riskRadarForecastHorizonSchema, z.array(riskRadarForecastHorizonSchema)]).optional(),
  isCurrent: z.coerce.boolean().optional(),
  minProbability: z.coerce.number().min(0).max(1).optional(),
  maxProbability: z.coerce.number().min(0).max(1).optional(),
  sortBy: z.enum(['forecast_date', 'predicted_risk_index', 'probability_of_crisis']).optional().default('forecast_date'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

/**
 * Drivers query schema
 */
export const riskRadarDriversQuerySchema = z.object({
  category: z.union([riskRadarDriverCategorySchema, z.array(riskRadarDriverCategorySchema)]).optional(),
  urgency: z.union([riskRadarLevelSchema, z.array(riskRadarLevelSchema)]).optional(),
  isEmerging: z.coerce.boolean().optional(),
  isTurningPoint: z.coerce.boolean().optional(),
  minImpactScore: z.coerce.number().min(0).max(100).optional(),
  sortBy: z.enum(['impact_score', 'contribution_percentage', 'created_at']).optional().default('impact_score'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

/**
 * Notes query schema
 */
export const riskRadarNotesQuerySchema = z.object({
  noteType: z.union([riskRadarNoteTypeSchema, z.array(riskRadarNoteTypeSchema)]).optional(),
  isExecutiveVisible: z.coerce.boolean().optional(),
  isPinned: z.coerce.boolean().optional(),
  createdBy: z.string().uuid().optional(),
  sortBy: z.enum(['created_at', 'note_type']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

/**
 * Dashboard query schema
 */
export const riskRadarDashboardQuerySchema = z.object({
  trendPeriodDays: z.coerce.number().int().min(1).max(365).optional().default(30),
  includeForecasts: z.coerce.boolean().optional().default(true),
  topDriversLimit: z.coerce.number().int().min(1).max(20).optional().default(5),
  recentNotesLimit: z.coerce.number().int().min(1).max(20).optional().default(5),
});

// ========================================
// API Request Schemas
// ========================================

/**
 * Snapshot ID param schema
 */
export const riskRadarSnapshotIdParamSchema = z.object({
  id: z.string().uuid(),
});

/**
 * Forecast ID param schema
 */
export const riskRadarForecastIdParamSchema = z.object({
  forecastId: z.string().uuid(),
});

/**
 * Note ID param schema
 */
export const riskRadarNoteIdParamSchema = z.object({
  noteId: z.string().uuid(),
});

// ========================================
// Type Exports
// ========================================

export type RiskRadarLevelType = z.infer<typeof riskRadarLevelSchema>;
export type RiskRadarIndicatorTypeType = z.infer<typeof riskRadarIndicatorTypeSchema>;
export type RiskRadarForecastHorizonType = z.infer<typeof riskRadarForecastHorizonSchema>;
export type RiskRadarDriverCategoryType = z.infer<typeof riskRadarDriverCategorySchema>;
export type RiskRadarNoteTypeType = z.infer<typeof riskRadarNoteTypeSchema>;
export type RiskRadarTrendDirectionType = z.infer<typeof riskRadarTrendDirectionSchema>;

export type RiskRadarSignalMatrixType = z.infer<typeof riskRadarSignalMatrixSchema>;
export type RiskRadarConcernType = z.infer<typeof riskRadarConcernSchema>;
export type RiskRadarEmergingRiskType = z.infer<typeof riskRadarEmergingRiskSchema>;
export type RiskRadarPositiveFactorType = z.infer<typeof riskRadarPositiveFactorSchema>;

export type RiskRadarSnapshotType = z.infer<typeof riskRadarSnapshotSchema>;
export type RiskRadarIndicatorSchemaType = z.infer<typeof riskRadarIndicatorSchema>;
export type RiskRadarForecastType = z.infer<typeof riskRadarForecastSchema>;
export type RiskRadarDriverType = z.infer<typeof riskRadarDriverSchema>;
export type RiskRadarNoteType = z.infer<typeof riskRadarNoteSchema>;

export type CreateRiskRadarSnapshotInput = z.infer<typeof createRiskRadarSnapshotInputSchema>;
export type UpdateRiskRadarSnapshotInput = z.infer<typeof updateRiskRadarSnapshotInputSchema>;
export type CreateRiskRadarIndicatorInput = z.infer<typeof createRiskRadarIndicatorInputSchema>;
export type CreateRiskRadarForecastInput = z.infer<typeof createRiskRadarForecastInputSchema>;
export type RegenerateRiskRadarForecastInput = z.infer<typeof regenerateRiskRadarForecastInputSchema>;
export type CreateRiskRadarDriverInput = z.infer<typeof createRiskRadarDriverInputSchema>;
export type CreateRiskRadarNoteInput = z.infer<typeof createRiskRadarNoteInputSchema>;
export type UpdateRiskRadarNoteInput = z.infer<typeof updateRiskRadarNoteInputSchema>;

export type RiskRadarSnapshotsQuery = z.infer<typeof riskRadarSnapshotsQuerySchema>;
export type RiskRadarIndicatorsQuery = z.infer<typeof riskRadarIndicatorsQuerySchema>;
export type RiskRadarForecastsQuery = z.infer<typeof riskRadarForecastsQuerySchema>;
export type RiskRadarDriversQuery = z.infer<typeof riskRadarDriversQuerySchema>;
export type RiskRadarNotesQuery = z.infer<typeof riskRadarNotesQuerySchema>;
export type RiskRadarDashboardQuery = z.infer<typeof riskRadarDashboardQuerySchema>;
