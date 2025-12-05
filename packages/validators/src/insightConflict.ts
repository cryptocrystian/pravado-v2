/**
 * Insight Conflict Resolution Validators (Sprint S74)
 * Zod schemas for Autonomous Insight Conflict Resolution Engine V1
 */

import { z } from 'zod';

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

export const conflictTypeSchema = z.enum([
  'contradiction',
  'divergence',
  'ambiguity',
  'missing_data',
  'inconsistency',
]);

export const conflictSeveritySchema = z.enum([
  'low',
  'medium',
  'high',
  'critical',
]);

export const conflictStatusSchema = z.enum([
  'detected',
  'analyzing',
  'resolved',
  'dismissed',
]);

export const conflictResolutionTypeSchema = z.enum([
  'ai_consensus',
  'weighted_truth',
  'source_priority',
  'hybrid',
]);

export const conflictEdgeTypeSchema = z.enum([
  'related',
  'caused_by',
  'contradicts',
  'supersedes',
]);

export const conflictItemRoleSchema = z.enum([
  'primary',
  'secondary',
  'context',
]);

export const conflictActorTypeSchema = z.enum([
  'user',
  'system',
  'ai',
]);

// ============================================================================
// NESTED SCHEMAS
// ============================================================================

export const conflictSourceEntitySchema = z.object({
  entityType: z.string().min(1).max(100),
  entityId: z.string().uuid(),
  sourceSystem: z.string().min(1).max(100),
  displayName: z.string().max(255).optional().nullable(),
  url: z.string().url().optional().nullable(),
});

export const recommendedActionSchema = z.object({
  action: z.string().min(1).max(500),
  priority: z.enum(['low', 'medium', 'high']),
  description: z.string().max(1000).optional().nullable(),
  targetSystem: z.string().max(100).optional().nullable(),
  estimatedImpact: z.string().max(255).optional().nullable(),
});

export const sourceWeightSchema = z.object({
  sourceSystem: z.string().min(1).max(100),
  weight: z.number().min(0).max(1),
  rationale: z.string().max(500).optional().nullable(),
});

export const rootCauseSchema = z.object({
  cause: z.string().min(1).max(500),
  confidence: z.number().min(0).max(1),
  sourceSystem: z.string().max(100).optional().nullable(),
  evidence: z.string().max(2000).optional().nullable(),
});

export const relatedConflictSchema = z.object({
  conflictId: z.string().uuid(),
  edgeType: conflictEdgeTypeSchema,
  similarity: z.number().min(0).max(1),
});

export const affectedSystemAnalysisSchema = z.object({
  system: z.string().min(1).max(100),
  impactLevel: z.enum(['low', 'medium', 'high']),
  description: z.string().max(1000),
});

export const vectorSimilaritySchema = z.object({
  itemAId: z.string().uuid(),
  itemBId: z.string().uuid(),
  similarity: z.number().min(-1).max(1),
});

export const causeTimelineEventSchema = z.object({
  timestamp: z.string().datetime(),
  event: z.string().min(1).max(500),
  system: z.string().min(1).max(100),
  significance: z.enum(['low', 'medium', 'high']),
});

// ============================================================================
// ANALYSIS RESULT SCHEMA
// ============================================================================

export const conflictAnalysisResultSchema = z.object({
  conflictId: z.string().uuid(),
  severityScore: z.number().min(0).max(100),
  severityRationale: z.string().max(2000),
  rootCauses: z.array(rootCauseSchema).optional().default([]),
  relatedConflicts: z.array(relatedConflictSchema).optional().default([]),
  suggestedResolutionType: conflictResolutionTypeSchema,
  estimatedResolutionDifficulty: z.enum(['easy', 'moderate', 'difficult']),
  affectedSystemsAnalysis: z.array(affectedSystemAnalysisSchema).optional().default([]),
  vectorSimilarities: z.array(vectorSimilaritySchema).optional().default([]),
});

export const rootCauseAnalysisResultSchema = z.object({
  primaryCause: rootCauseSchema,
  contributingCauses: z.array(rootCauseSchema).optional().default([]),
  timeline: z.array(causeTimelineEventSchema).optional().nullable(),
  recommendations: z.array(z.string().max(500)).optional().default([]),
  confidence: z.number().min(0).max(1),
});

// ============================================================================
// GRAPH SCHEMAS
// ============================================================================

export const conflictGraphNodeDataSchema = z.object({
  conflictType: conflictTypeSchema.optional(),
  severity: conflictSeveritySchema.optional(),
  status: conflictStatusSchema.optional(),
  sourceSystem: z.string().max(100).optional(),
  confidence: z.number().min(0).max(1).optional(),
  resolutionType: conflictResolutionTypeSchema.optional(),
});

export const conflictGraphNodeSchema = z.object({
  id: z.string(),
  type: z.enum(['conflict', 'item', 'source', 'resolution']),
  label: z.string().max(255),
  data: conflictGraphNodeDataSchema,
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),
  size: z.number().min(1).optional(),
  color: z.string().max(50).optional(),
});

export const conflictGraphEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  type: z.union([
    conflictEdgeTypeSchema,
    z.literal('contains'),
    z.literal('resolved_by'),
  ]),
  label: z.string().max(255).optional().nullable(),
  weight: z.number().min(0).optional(),
  color: z.string().max(50).optional(),
});

export const conflictGraphMetadataSchema = z.object({
  totalNodes: z.number().int().min(0),
  totalEdges: z.number().int().min(0),
  conflictCount: z.number().int().min(0),
  itemCount: z.number().int().min(0),
  resolutionCount: z.number().int().min(0),
  generatedAt: z.string().datetime(),
});

export const conflictGraphDataSchema = z.object({
  nodes: z.array(conflictGraphNodeSchema),
  edges: z.array(conflictGraphEdgeSchema),
  metadata: conflictGraphMetadataSchema,
});

// ============================================================================
// ENTITY SCHEMAS
// ============================================================================

export const insightConflictItemSchema = z.object({
  id: z.string().uuid(),
  conflictId: z.string().uuid(),
  entityType: z.string().min(1).max(100),
  entityId: z.string().uuid(),
  rawInsight: z.string().min(1),
  processedInsight: z.string().optional().nullable(),
  vector: z.array(z.number()).optional().nullable(),
  sourceSystem: z.string().min(1).max(100),
  sourceTimestamp: z.string().datetime().optional().nullable(),
  confidenceScore: z.number().min(0).max(1).optional().nullable(),
  itemRole: conflictItemRoleSchema.optional().nullable(),
  createdAt: z.string().datetime(),
});

export const insightConflictResolutionSchema = z.object({
  id: z.string().uuid(),
  conflictId: z.string().uuid(),
  resolutionType: conflictResolutionTypeSchema,
  resolvedSummary: z.string().min(1),
  consensusNarrative: z.string().optional().nullable(),
  recommendedActions: z.array(recommendedActionSchema).optional().default([]),
  resolutionConfidence: z.number().min(0).max(1).optional().nullable(),
  resolutionRationale: z.string().optional().nullable(),
  sourceWeights: z.array(sourceWeightSchema).optional().nullable(),
  priorityOrder: z.array(z.string()).optional().nullable(),
  aiModelUsed: z.string().max(100).optional().nullable(),
  aiPromptTokens: z.number().int().min(0).optional().nullable(),
  aiCompletionTokens: z.number().int().min(0).optional().nullable(),
  humanReviewed: z.boolean(),
  reviewedBy: z.string().uuid().optional().nullable(),
  reviewedAt: z.string().datetime().optional().nullable(),
  reviewNotes: z.string().max(2000).optional().nullable(),
  isAccepted: z.boolean(),
  acceptedAt: z.string().datetime().optional().nullable(),
  acceptedBy: z.string().uuid().optional().nullable(),
  createdAt: z.string().datetime(),
});

export const insightConflictAuditLogSchema = z.object({
  id: z.string().uuid(),
  conflictId: z.string().uuid(),
  eventType: z.string().min(1).max(100),
  actorId: z.string().uuid().optional().nullable(),
  actorType: conflictActorTypeSchema,
  eventDetails: z.record(z.unknown()).optional().default({}),
  previousState: z.record(z.unknown()).optional().nullable(),
  newState: z.record(z.unknown()).optional().nullable(),
  ipAddress: z.string().max(45).optional().nullable(),
  userAgent: z.string().max(500).optional().nullable(),
  createdAt: z.string().datetime(),
});

export const insightConflictClusterSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional().nullable(),
  primaryConflictType: conflictTypeSchema.optional().nullable(),
  averageSeverity: conflictSeveritySchema.optional().nullable(),
  conflictCount: z.number().int().min(0),
  centroidVector: z.array(z.number()).optional().nullable(),
  isAutoGenerated: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const insightConflictSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  conflictType: conflictTypeSchema,
  severity: conflictSeveritySchema,
  status: conflictStatusSchema,
  title: z.string().min(1).max(255),
  conflictSummary: z.string().optional().nullable(),
  sourceEntities: z.array(conflictSourceEntitySchema).optional().default([]),
  affectedSystems: z.array(z.string()).optional().default([]),
  analysisStartedAt: z.string().datetime().optional().nullable(),
  analysisCompletedAt: z.string().datetime().optional().nullable(),
  analysisResult: conflictAnalysisResultSchema.optional().nullable(),
  resolvedAt: z.string().datetime().optional().nullable(),
  resolvedBy: z.string().uuid().optional().nullable(),
  conflictGraph: conflictGraphDataSchema.optional().nullable(),
  clusterId: z.string().uuid().optional().nullable(),
  clusterSimilarity: z.number().min(0).max(1).optional().nullable(),
  rootCauseAnalysis: rootCauseAnalysisResultSchema.optional().nullable(),
  linkedRealityMapId: z.string().uuid().optional().nullable(),
  linkedNodeIds: z.array(z.string()).optional().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string().uuid().optional().nullable(),
  items: z.array(insightConflictItemSchema).optional(),
  resolutions: z.array(insightConflictResolutionSchema).optional(),
  cluster: insightConflictClusterSchema.optional().nullable(),
});

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

export const createConflictItemInputSchema = z.object({
  entityType: z.string().min(1).max(100),
  entityId: z.string().uuid(),
  rawInsight: z.string().min(1).max(10000),
  processedInsight: z.string().max(10000).optional().nullable(),
  sourceSystem: z.string().min(1).max(100),
  sourceTimestamp: z.string().datetime().optional().nullable(),
  confidenceScore: z.number().min(0).max(1).optional().nullable(),
  itemRole: conflictItemRoleSchema.optional().nullable(),
});

export const createConflictSchema = z.object({
  conflictType: conflictTypeSchema,
  title: z.string().min(1).max(255),
  conflictSummary: z.string().max(5000).optional().nullable(),
  severity: conflictSeveritySchema.optional().nullable(),
  sourceEntities: z.array(conflictSourceEntitySchema).optional().nullable(),
  affectedSystems: z.array(z.string().max(100)).optional().nullable(),
  items: z.array(createConflictItemInputSchema).optional().nullable(),
});

export const updateConflictSchema = z.object({
  title: z.string().min(1).max(255).optional().nullable(),
  conflictSummary: z.string().max(5000).optional().nullable(),
  severity: conflictSeveritySchema.optional().nullable(),
  status: conflictStatusSchema.optional().nullable(),
  affectedSystems: z.array(z.string().max(100)).optional().nullable(),
  clusterId: z.string().uuid().optional().nullable(),
  linkedRealityMapId: z.string().uuid().optional().nullable(),
  linkedNodeIds: z.array(z.string()).optional().nullable(),
});

export const analyzeConflictSchema = z.object({
  includeRelatedConflicts: z.boolean().optional().nullable(),
  includeVectorAnalysis: z.boolean().optional().nullable(),
  includeRootCauseAnalysis: z.boolean().optional().nullable(),
  maxRelatedConflicts: z.number().int().min(1).max(50).optional().nullable(),
});

export const resolveConflictSchema = z.object({
  resolutionType: conflictResolutionTypeSchema,
  sourceWeights: z.array(sourceWeightSchema).optional().nullable(),
  priorityOrder: z.array(z.string().max(100)).optional().nullable(),
  customPrompt: z.string().max(2000).optional().nullable(),
  autoAccept: z.boolean().optional().nullable(),
});

export const reviewResolutionSchema = z.object({
  isAccepted: z.boolean(),
  reviewNotes: z.string().max(2000).optional().nullable(),
});

export const createClusterSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional().nullable(),
  conflictIds: z.array(z.string().uuid()).optional().nullable(),
});

export const createGraphEdgeSchema = z.object({
  sourceConflictId: z.string().uuid(),
  targetConflictId: z.string().uuid(),
  edgeType: conflictEdgeTypeSchema,
  edgeWeight: z.number().min(0).max(1).optional().nullable(),
  edgeLabel: z.string().max(255).optional().nullable(),
});

// ============================================================================
// QUERY SCHEMAS
// ============================================================================

export const listConflictsSchema = z.object({
  search: z.string().max(255).optional().nullable(),
  conflictType: conflictTypeSchema.optional().nullable(),
  severity: conflictSeveritySchema.optional().nullable(),
  status: conflictStatusSchema.optional().nullable(),
  affectedSystem: z.string().max(100).optional().nullable(),
  clusterId: z.string().uuid().optional().nullable(),
  hasResolution: z.boolean().optional().nullable(),
  fromDate: z.string().datetime().optional().nullable(),
  toDate: z.string().datetime().optional().nullable(),
  sortBy: z.enum(['created_at', 'updated_at', 'severity', 'status']).optional().nullable(),
  sortOrder: z.enum(['asc', 'desc']).optional().nullable(),
  limit: z.number().int().min(1).max(100).optional().nullable(),
  offset: z.number().int().min(0).optional().nullable(),
});

export const getConflictSchema = z.object({
  conflictId: z.string().uuid(),
  includeItems: z.boolean().optional().nullable(),
  includeResolutions: z.boolean().optional().nullable(),
  includeRelated: z.boolean().optional().nullable(),
});

export const listConflictItemsSchema = z.object({
  conflictId: z.string().uuid(),
  sourceSystem: z.string().max(100).optional().nullable(),
  itemRole: conflictItemRoleSchema.optional().nullable(),
  limit: z.number().int().min(1).max(100).optional().nullable(),
  offset: z.number().int().min(0).optional().nullable(),
});

export const listResolutionsSchema = z.object({
  conflictId: z.string().uuid(),
  resolutionType: conflictResolutionTypeSchema.optional().nullable(),
  isAccepted: z.boolean().optional().nullable(),
  limit: z.number().int().min(1).max(100).optional().nullable(),
  offset: z.number().int().min(0).optional().nullable(),
});

export const listAuditLogSchema = z.object({
  conflictId: z.string().uuid(),
  eventType: z.string().max(100).optional().nullable(),
  actorId: z.string().uuid().optional().nullable(),
  fromDate: z.string().datetime().optional().nullable(),
  toDate: z.string().datetime().optional().nullable(),
  limit: z.number().int().min(1).max(100).optional().nullable(),
  offset: z.number().int().min(0).optional().nullable(),
});

export const listClustersSchema = z.object({
  isActive: z.boolean().optional().nullable(),
  primaryConflictType: conflictTypeSchema.optional().nullable(),
  limit: z.number().int().min(1).max(100).optional().nullable(),
  offset: z.number().int().min(0).optional().nullable(),
});

// ============================================================================
// DETECTION SCHEMAS
// ============================================================================

export const detectionConfigSchema = z.object({
  enableContradictionDetection: z.boolean().optional().nullable(),
  enableDivergenceDetection: z.boolean().optional().nullable(),
  enableAmbiguityDetection: z.boolean().optional().nullable(),
  enableMissingDataDetection: z.boolean().optional().nullable(),
  enableInconsistencyDetection: z.boolean().optional().nullable(),
  contradictionThreshold: z.number().min(0).max(1).optional().nullable(),
  divergenceThreshold: z.number().min(0).max(1).optional().nullable(),
  ambiguityThreshold: z.number().min(0).max(1).optional().nullable(),
  minConfidenceScore: z.number().min(0).max(1).optional().nullable(),
  maxBatchSize: z.number().int().min(1).max(1000).optional().nullable(),
});

export const runDetectionSchema = z.object({
  config: detectionConfigSchema.optional().nullable(),
  targetSystems: z.array(z.string().max(100)).optional().nullable(),
  timeRange: z.object({
    from: z.string().datetime(),
    to: z.string().datetime(),
  }).optional().nullable(),
});

// ============================================================================
// BATCH OPERATION SCHEMAS
// ============================================================================

export const batchAnalyzeSchema = z.object({
  conflictIds: z.array(z.string().uuid()).min(1).max(50),
  options: analyzeConflictSchema.optional().nullable(),
});

export const batchResolveSchema = z.object({
  conflictIds: z.array(z.string().uuid()).min(1).max(50),
  resolutionType: conflictResolutionTypeSchema,
  options: z.object({
    sourceWeights: z.array(sourceWeightSchema).optional().nullable(),
    priorityOrder: z.array(z.string().max(100)).optional().nullable(),
    customPrompt: z.string().max(2000).optional().nullable(),
    autoAccept: z.boolean().optional().nullable(),
  }).optional().nullable(),
});

export const batchDismissSchema = z.object({
  conflictIds: z.array(z.string().uuid()).min(1).max(100),
  reason: z.string().max(1000).optional().nullable(),
});

// ============================================================================
// EXPORT SCHEMAS
// ============================================================================

export const conflictExportFormatSchema = z.enum(['json', 'csv', 'pdf']);

export const conflictExportConfigSchema = z.object({
  format: conflictExportFormatSchema,
  includeItems: z.boolean().optional().nullable(),
  includeResolutions: z.boolean().optional().nullable(),
  includeAuditLog: z.boolean().optional().nullable(),
  dateRange: z.object({
    from: z.string().datetime(),
    to: z.string().datetime(),
  }).optional().nullable(),
});

// ============================================================================
// STATISTICS SCHEMAS
// ============================================================================

export const conflictStatsSchema = z.object({
  totalConflicts: z.number().int().min(0),
  detectedCount: z.number().int().min(0),
  analyzingCount: z.number().int().min(0),
  resolvedCount: z.number().int().min(0),
  dismissedCount: z.number().int().min(0),
  criticalCount: z.number().int().min(0),
  highCount: z.number().int().min(0),
  mediumCount: z.number().int().min(0),
  lowCount: z.number().int().min(0),
  contradictionCount: z.number().int().min(0),
  divergenceCount: z.number().int().min(0),
  ambiguityCount: z.number().int().min(0),
  missingDataCount: z.number().int().min(0),
  inconsistencyCount: z.number().int().min(0),
  averageResolutionTime: z.number().min(0).optional().nullable(),
  resolutionRate: z.number().min(0).max(1).optional().nullable(),
  clusterCount: z.number().int().min(0),
});

export const conflictTrendPointSchema = z.object({
  date: z.string(),
  detected: z.number().int().min(0),
  resolved: z.number().int().min(0),
  dismissed: z.number().int().min(0),
});

export const conflictTrendsSchema = z.object({
  daily: z.array(conflictTrendPointSchema),
  weekly: z.array(conflictTrendPointSchema),
  monthly: z.array(conflictTrendPointSchema),
});

// ============================================================================
// RESPONSE SCHEMAS
// ============================================================================

export const listConflictsResponseSchema = z.object({
  conflicts: z.array(insightConflictSchema),
  total: z.number().int().min(0),
  hasMore: z.boolean(),
});

export const getConflictResponseSchema = z.object({
  conflict: insightConflictSchema,
  items: z.array(insightConflictItemSchema),
  resolutions: z.array(insightConflictResolutionSchema),
  relatedConflicts: z.array(insightConflictSchema),
});

export const createConflictResponseSchema = z.object({
  conflict: insightConflictSchema,
});

export const updateConflictResponseSchema = z.object({
  conflict: insightConflictSchema,
});

export const analyzeConflictResponseSchema = z.object({
  conflict: insightConflictSchema,
  analysis: conflictAnalysisResultSchema,
});

export const resolveConflictResponseSchema = z.object({
  conflict: insightConflictSchema,
  resolution: insightConflictResolutionSchema,
});

export const getConflictGraphResponseSchema = z.object({
  graph: conflictGraphDataSchema,
});

export const getConflictStatsResponseSchema = z.object({
  stats: conflictStatsSchema,
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CreateConflictInput = z.infer<typeof createConflictSchema>;
export type UpdateConflictInput = z.infer<typeof updateConflictSchema>;
export type AnalyzeConflictInput = z.infer<typeof analyzeConflictSchema>;
export type ResolveConflictInput = z.infer<typeof resolveConflictSchema>;
export type ReviewResolutionInput = z.infer<typeof reviewResolutionSchema>;
export type CreateClusterInput = z.infer<typeof createClusterSchema>;
export type CreateGraphEdgeInput = z.infer<typeof createGraphEdgeSchema>;
export type ListConflictsQuery = z.infer<typeof listConflictsSchema>;
export type GetConflictQuery = z.infer<typeof getConflictSchema>;
export type ListConflictItemsQuery = z.infer<typeof listConflictItemsSchema>;
export type ListResolutionsQuery = z.infer<typeof listResolutionsSchema>;
export type ListAuditLogQuery = z.infer<typeof listAuditLogSchema>;
export type ListClustersQuery = z.infer<typeof listClustersSchema>;
export type DetectionConfig = z.infer<typeof detectionConfigSchema>;
export type RunDetectionInput = z.infer<typeof runDetectionSchema>;
export type BatchAnalyzeInput = z.infer<typeof batchAnalyzeSchema>;
export type BatchResolveInput = z.infer<typeof batchResolveSchema>;
export type BatchDismissInput = z.infer<typeof batchDismissSchema>;
export type ConflictExportConfig = z.infer<typeof conflictExportConfigSchema>;
