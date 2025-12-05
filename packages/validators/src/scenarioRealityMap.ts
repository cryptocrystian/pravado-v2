/**
 * Scenario Reality Map Validators (Sprint S73)
 * Zod schemas for AI-Driven Multi-Outcome Reality Maps
 */

import { z } from 'zod';

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

/**
 * Reality map status schema
 */
export const realityMapStatusSchema = z.enum([
  'draft',
  'generating',
  'analyzing',
  'completed',
  'failed',
]);

/**
 * Reality map node type schema
 */
export const realityMapNodeTypeSchema = z.enum([
  'root',
  'branch',
  'leaf',
  'terminal',
]);

/**
 * Reality map analysis status schema
 */
export const realityMapAnalysisStatusSchema = z.enum([
  'pending',
  'running',
  'completed',
  'failed',
]);

/**
 * Probability model type schema
 */
export const probabilityModelTypeSchema = z.enum([
  'weighted_average',
  'monte_carlo',
  'bayesian',
  'expert_adjusted',
]);

/**
 * Narrative style schema
 */
export const narrativeStyleSchema = z.enum([
  'executive',
  'detailed',
  'technical',
  'strategic',
]);

/**
 * Path outcome type schema
 */
export const pathOutcomeTypeSchema = z.enum([
  'best_case',
  'worst_case',
  'most_likely',
  'high_risk',
  'high_opportunity',
  'balanced',
]);

/**
 * Edge trigger type schema
 */
export const edgeTriggerTypeSchema = z.enum([
  'simulation_outcome',
  'risk_escalation',
  'opportunity',
  'time_based',
  'external_event',
  'decision_point',
  'condition_met',
]);

/**
 * Comparison type schema
 */
export const comparisonTypeSchema = z.enum([
  'maps',
  'paths',
  'nodes',
]);

/**
 * Audit event type schema
 */
export const realityMapAuditEventTypeSchema = z.enum([
  'map_created',
  'map_updated',
  'generation_started',
  'generation_completed',
  'generation_failed',
  'analysis_started',
  'analysis_completed',
  'node_created',
  'node_updated',
  'path_computed',
  'comparison_created',
  'map_exported',
  'map_shared',
]);

// ============================================================================
// COMPONENT SCHEMAS
// ============================================================================

/**
 * Key driver schema
 */
export const keyDriverSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  impact: z.enum(['high', 'medium', 'low']).optional(),
  direction: z.enum(['positive', 'negative', 'neutral']).optional(),
  source: z.string().max(200).optional(),
  confidence: z.number().min(0).max(1).optional(),
}).passthrough();

/**
 * Risk factor schema
 */
export const riskFactorSchema = z.object({
  id: z.string().optional(),
  category: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  severity: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  likelihood: z.number().min(0).max(1).optional(),
  impact: z.number().min(0).max(100).optional(),
  score: z.number().min(0).max(100).optional(),
  mitigation: z.string().max(2000).nullable().optional(),
  affectedNodes: z.array(z.string()).optional(),
}).passthrough();

/**
 * Opportunity factor schema
 */
export const opportunityFactorSchema = z.object({
  id: z.string().optional(),
  category: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  potential: z.enum(['high', 'medium', 'low']).optional(),
  likelihood: z.number().min(0).max(1).optional(),
  impact: z.number().min(0).max(100).optional(),
  score: z.number().min(0).max(100).optional(),
  actionRequired: z.string().max(2000).nullable().optional(),
  affectedNodes: z.array(z.string()).optional(),
}).passthrough();

/**
 * Decision option schema
 */
export const decisionOptionSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  expectedOutcome: z.string().max(1000).optional(),
  riskLevel: z.enum(['high', 'medium', 'low']).optional(),
  opportunityLevel: z.enum(['high', 'medium', 'low']).optional(),
  childNodeId: z.string().nullable().optional(),
}).passthrough();

/**
 * Decision point schema
 */
export const decisionPointSchema = z.object({
  nodeId: z.string(),
  description: z.string().max(2000).optional(),
  options: z.array(decisionOptionSchema).optional(),
  recommendedOption: z.string().nullable().optional(),
  urgency: z.enum(['immediate', 'short_term', 'long_term']).optional(),
  stakeholders: z.array(z.string()).optional(),
}).passthrough();

/**
 * Mitigation strategy schema
 */
export const mitigationStrategySchema = z.object({
  id: z.string().optional(),
  riskId: z.string().optional(),
  strategy: z.string().min(1).max(2000),
  effectiveness: z.enum(['high', 'medium', 'low']).optional(),
  cost: z.enum(['high', 'medium', 'low']).optional(),
  timeframe: z.string().max(100).optional(),
  owner: z.string().max(200).nullable().optional(),
}).passthrough();

/**
 * Action recommendation schema
 */
export const actionRecommendationSchema = z.object({
  id: z.string().optional(),
  action: z.string().min(1).max(2000),
  priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  category: z.string().max(100).optional(),
  expectedImpact: z.string().max(1000).optional(),
  timeframe: z.string().max(100).optional(),
  resources: z.array(z.string()).optional(),
  dependencies: z.array(z.string()).optional(),
}).passthrough();

/**
 * Node snapshot schema
 */
export const nodeSnapshotSchema = z.object({
  simulationState: z.record(z.unknown()).optional(),
  riskRadarState: z.record(z.unknown()).optional(),
  reputationState: z.record(z.unknown()).optional(),
  marketConditions: z.record(z.unknown()).optional(),
  stakeholderSentiment: z.record(z.unknown()).optional(),
  mediaLandscape: z.record(z.unknown()).optional(),
  competitorActivity: z.record(z.unknown()).optional(),
  customData: z.record(z.unknown()).optional(),
}).passthrough();

/**
 * Edge trigger schema
 */
export const edgeTriggerSchema = z.object({
  type: edgeTriggerTypeSchema,
  condition: z.string().max(1000).optional(),
  sourceData: z.record(z.unknown()).optional(),
  threshold: z.number().optional(),
  operator: z.enum(['>', '>=', '<', '<=', '==', '!=']).optional(),
  value: z.unknown().optional(),
}).passthrough();

// ============================================================================
// PARAMETERS SCHEMAS
// ============================================================================

/**
 * Reality map parameters schema
 */
export const realityMapParametersSchema = z.object({
  maxDepth: z.number().int().min(1).max(10).optional().default(5),
  branchingFactor: z.number().int().min(1).max(10).optional().default(3),
  minProbability: z.number().min(0).max(1).optional().default(0.05),
  includeRiskAnalysis: z.boolean().optional().default(true),
  includeOpportunityAnalysis: z.boolean().optional().default(true),
  narrativeStyle: narrativeStyleSchema.optional().default('executive'),
  probabilityModel: probabilityModelTypeSchema.optional().default('weighted_average'),
  simulationIds: z.array(z.string().uuid()).optional(),
  suiteRunIds: z.array(z.string().uuid()).optional(),
  customWeights: z.record(z.number()).optional(),
  contextualFactors: z.array(z.string()).optional(),
  timeHorizon: z.string().max(100).optional(),
  focusAreas: z.array(z.string()).optional(),
}).passthrough();

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

/**
 * Create reality map schema
 */
export const createRealityMapSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  suiteId: z.string().uuid().optional(),
  parameters: realityMapParametersSchema.optional(),
});

/**
 * Update reality map schema
 */
export const updateRealityMapSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).optional(),
  parameters: realityMapParametersSchema.partial().optional(),
});

/**
 * Generate reality map schema
 */
export const generateRealityMapSchema = z.object({
  parameters: realityMapParametersSchema.partial().optional(),
  sourceType: z.enum(['suite', 'simulations', 'manual']).optional(),
  simulationIds: z.array(z.string().uuid()).optional(),
  suiteRunIds: z.array(z.string().uuid()).optional(),
  seedData: z.record(z.unknown()).optional(),
  regenerate: z.boolean().optional().default(false),
});

/**
 * Create node schema
 */
export const createRealityMapNodeSchema = z.object({
  parentNodeId: z.string().uuid().optional(),
  label: z.string().max(255).optional(),
  nodeType: realityMapNodeTypeSchema.optional(),
  probability: z.number().min(0).max(1).optional(),
  riskScore: z.number().int().min(0).max(100).optional(),
  opportunityScore: z.number().int().min(0).max(100).optional(),
  aiSummary: z.string().max(10000).optional(),
  keyDrivers: z.array(keyDriverSchema).optional(),
  snapshot: nodeSnapshotSchema.optional(),
});

/**
 * Update node schema
 */
export const updateRealityMapNodeSchema = z.object({
  label: z.string().max(255).optional(),
  probability: z.number().min(0).max(1).optional(),
  riskScore: z.number().int().min(0).max(100).optional(),
  opportunityScore: z.number().int().min(0).max(100).optional(),
  aiSummary: z.string().max(10000).optional(),
  narrativeDelta: z.string().max(5000).optional(),
  keyDrivers: z.array(keyDriverSchema).optional(),
});

/**
 * Create edge schema
 */
export const createRealityMapEdgeSchema = z.object({
  parentNodeId: z.string().uuid(),
  childNodeId: z.string().uuid(),
  trigger: edgeTriggerSchema.optional(),
  triggerType: edgeTriggerTypeSchema.optional(),
  transitionProbability: z.number().min(0).max(1).optional(),
  label: z.string().max(255).optional(),
  description: z.string().max(2000).optional(),
});

/**
 * Analysis options schema
 */
export const analysisOptionsSchema = z.object({
  includeContradictions: z.boolean().optional().default(true),
  includeCorrelations: z.boolean().optional().default(true),
  includePathComparisons: z.boolean().optional().default(true),
  narrativeDepth: z.enum(['summary', 'detailed', 'comprehensive']).optional().default('summary'),
  focusPaths: z.array(z.string().uuid()).optional(),
  customPrompt: z.string().max(2000).optional(),
});

/**
 * Create comparison schema
 */
export const createComparisonSchema = z.object({
  realityMapIds: z.array(z.string().uuid()).optional(),
  pathIds: z.array(z.string().uuid()).optional(),
  comparisonType: comparisonTypeSchema,
  includeNarrative: z.boolean().optional().default(true),
  includeRiskComparison: z.boolean().optional().default(true),
  includeOpportunityComparison: z.boolean().optional().default(true),
}).refine(
  (data) => (data.realityMapIds && data.realityMapIds.length > 0) || (data.pathIds && data.pathIds.length > 0),
  { message: 'Either realityMapIds or pathIds must be provided' }
);

// ============================================================================
// QUERY SCHEMAS
// ============================================================================

/**
 * List reality maps query schema
 */
export const listRealityMapsQuerySchema = z.object({
  search: z.string().max(200).optional(),
  status: realityMapStatusSchema.optional(),
  suiteId: z.string().uuid().optional(),
  sortBy: z.enum(['created_at', 'updated_at', 'name', 'total_nodes']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

/**
 * List nodes query schema
 */
export const listRealityMapNodesQuerySchema = z.object({
  depth: z.coerce.number().int().min(0).max(20).optional(),
  nodeType: realityMapNodeTypeSchema.optional(),
  minProbability: z.coerce.number().min(0).max(1).optional(),
  minRiskScore: z.coerce.number().int().min(0).max(100).optional(),
  minOpportunityScore: z.coerce.number().int().min(0).max(100).optional(),
  parentNodeId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional().default(100),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

/**
 * List paths query schema
 */
export const listRealityMapPathsQuerySchema = z.object({
  outcomeType: pathOutcomeTypeSchema.optional(),
  minProbability: z.coerce.number().min(0).max(1).optional(),
  maxRiskScore: z.coerce.number().int().min(0).max(100).optional(),
  minOpportunityScore: z.coerce.number().int().min(0).max(100).optional(),
  sortBy: z.enum(['probability', 'risk', 'opportunity']).optional().default('probability'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

/**
 * List audit log query schema
 */
export const listRealityMapAuditQuerySchema = z.object({
  eventType: realityMapAuditEventTypeSchema.optional(),
  nodeId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

/**
 * Get graph query schema
 */
export const getRealityMapGraphQuerySchema = z.object({
  includePositions: z.coerce.boolean().optional().default(true),
  maxNodes: z.coerce.number().int().min(1).max(1000).optional(),
  depthLimit: z.coerce.number().int().min(1).max(20).optional(),
  probabilityThreshold: z.coerce.number().min(0).max(1).optional(),
});

/**
 * Get analysis query schema
 */
export const getRealityMapAnalysisQuerySchema = z.object({
  includeContradictions: z.coerce.boolean().optional().default(true),
  includeCorrelations: z.coerce.boolean().optional().default(true),
  includePathComparisons: z.coerce.boolean().optional().default(true),
  narrativeDepth: z.enum(['summary', 'detailed', 'comprehensive']).optional().default('summary'),
});

// ============================================================================
// ENTITY SCHEMAS (for validation of returned data)
// ============================================================================

/**
 * Reality map entity schema
 */
export const realityMapSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  suiteId: z.string().uuid().nullable(),
  name: z.string(),
  description: z.string().nullable(),
  status: realityMapStatusSchema,
  parameters: realityMapParametersSchema,
  generationStartedAt: z.string().nullable(),
  generationCompletedAt: z.string().nullable(),
  totalNodes: z.number().int(),
  totalEdges: z.number().int(),
  totalPaths: z.number().int(),
  maxDepthReached: z.number().int(),
  analysisStatus: realityMapAnalysisStatusSchema,
  executiveSummary: z.string().nullable(),
  topRisks: z.array(riskFactorSchema).nullable(),
  topOpportunities: z.array(opportunityFactorSchema).nullable(),
  keyDecisionPoints: z.array(decisionPointSchema).nullable(),
  errorMessage: z.string().nullable(),
  errorDetails: z.record(z.unknown()).nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: z.string().uuid().nullable(),
}).passthrough();

/**
 * Reality map node entity schema
 */
export const realityMapNodeSchema = z.object({
  id: z.string().uuid(),
  realityMapId: z.string().uuid(),
  parentNodeId: z.string().uuid().nullable(),
  nodeType: realityMapNodeTypeSchema,
  depth: z.number().int(),
  pathIndex: z.string().nullable(),
  label: z.string().nullable(),
  probability: z.number(),
  cumulativeProbability: z.number(),
  riskScore: z.number().int(),
  opportunityScore: z.number().int(),
  confidenceScore: z.number(),
  aiSummary: z.string().nullable(),
  narrativeDelta: z.string().nullable(),
  keyDrivers: z.array(keyDriverSchema),
  expectedTimeline: z.string().nullable(),
  simulationId: z.string().uuid().nullable(),
  simulationRunId: z.string().uuid().nullable(),
  suiteItemId: z.string().uuid().nullable(),
  snapshot: nodeSnapshotSchema,
  riskFactors: z.array(riskFactorSchema),
  opportunityFactors: z.array(opportunityFactorSchema),
  mitigationStrategies: z.array(mitigationStrategySchema),
  actionRecommendations: z.array(actionRecommendationSchema),
  generationOrder: z.number().int().nullable(),
  processingTimeMs: z.number().int().nullable(),
  tokensUsed: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
}).passthrough();

/**
 * Reality map edge entity schema
 */
export const realityMapEdgeSchema = z.object({
  id: z.string().uuid(),
  realityMapId: z.string().uuid(),
  parentNodeId: z.string().uuid(),
  childNodeId: z.string().uuid(),
  trigger: edgeTriggerSchema,
  triggerType: edgeTriggerTypeSchema.nullable(),
  transitionProbability: z.number(),
  label: z.string().nullable(),
  description: z.string().nullable(),
  weight: z.number(),
  createdAt: z.string(),
}).passthrough();

/**
 * Reality map path entity schema
 */
export const realityMapPathSchema = z.object({
  id: z.string().uuid(),
  realityMapId: z.string().uuid(),
  pathNodes: z.array(z.string().uuid()),
  pathIndex: z.string().nullable(),
  depth: z.number().int(),
  totalProbability: z.number(),
  avgRiskScore: z.number(),
  avgOpportunityScore: z.number(),
  maxRiskScore: z.number().int(),
  maxOpportunityScore: z.number().int(),
  pathSummary: z.string().nullable(),
  pathTitle: z.string().nullable(),
  outcomeType: pathOutcomeTypeSchema.nullable(),
  comparisonMetrics: z.object({
    probabilityDelta: z.number(),
    riskDelta: z.number(),
    opportunityDelta: z.number(),
    commonNodes: z.array(z.string()),
    divergencePoint: z.string().nullable(),
    narrativeComparison: z.string().nullable(),
  }).nullable(),
  createdAt: z.string(),
}).passthrough();

/**
 * Reality map audit log entry schema
 */
export const realityMapAuditLogSchema = z.object({
  id: z.string().uuid(),
  realityMapId: z.string().uuid(),
  nodeId: z.string().uuid().nullable(),
  eventType: realityMapAuditEventTypeSchema,
  actorId: z.string().uuid().nullable(),
  details: z.record(z.unknown()),
  createdAt: z.string(),
}).passthrough();

// ============================================================================
// GRAPH SCHEMAS
// ============================================================================

/**
 * Graph node schema
 */
export const graphNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: realityMapNodeTypeSchema,
  depth: z.number().int(),
  probability: z.number(),
  cumulativeProbability: z.number(),
  riskScore: z.number().int(),
  opportunityScore: z.number().int(),
  summary: z.string().nullable(),
  parentId: z.string().nullable(),
  childIds: z.array(z.string()),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),
  color: z.string().optional(),
  size: z.number().optional(),
}).passthrough();

/**
 * Graph edge schema
 */
export const graphEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  label: z.string().nullable(),
  probability: z.number(),
  triggerType: edgeTriggerTypeSchema.nullable(),
  weight: z.number(),
  color: z.string().optional(),
  animated: z.boolean().optional(),
}).passthrough();

/**
 * Graph metadata schema
 */
export const graphMetadataSchema = z.object({
  totalNodes: z.number().int(),
  totalEdges: z.number().int(),
  totalPaths: z.number().int(),
  maxDepth: z.number().int(),
  rootNodeId: z.string().nullable(),
  leafNodeIds: z.array(z.string()),
  mostLikelyPathId: z.string().nullable(),
  highestRiskPathId: z.string().nullable(),
  highestOpportunityPathId: z.string().nullable(),
  generationTime: z.number().nullable(),
}).passthrough();

/**
 * Reality map graph data schema
 */
export const realityMapGraphDataSchema = z.object({
  nodes: z.array(graphNodeSchema),
  edges: z.array(graphEdgeSchema),
  paths: z.array(realityMapPathSchema),
  metadata: graphMetadataSchema,
}).passthrough();

// ============================================================================
// ANALYSIS SCHEMAS
// ============================================================================

/**
 * Probability distribution schema
 */
export const probabilityDistributionSchema = z.object({
  pathId: z.string(),
  probability: z.number(),
  cumulativeProbability: z.number(),
  percentile: z.number(),
  outcomeType: pathOutcomeTypeSchema,
}).passthrough();

/**
 * Path summary schema
 */
export const realityPathSummarySchema = z.object({
  pathId: z.string(),
  title: z.string(),
  description: z.string(),
  probability: z.number(),
  riskLevel: z.enum(['critical', 'high', 'medium', 'low']),
  opportunityLevel: z.enum(['high', 'medium', 'low']),
  nodeCount: z.number().int(),
  keyEvents: z.array(z.string()),
  finalOutcome: z.string(),
  recommendedActions: z.array(z.string()),
}).passthrough();

/**
 * Detected contradiction schema
 */
export const detectedContradictionSchema = z.object({
  id: z.string(),
  type: z.enum(['logical', 'probabilistic', 'temporal', 'causal']),
  description: z.string(),
  affectedNodes: z.array(z.string()),
  severity: z.enum(['high', 'medium', 'low']),
  resolution: z.string().nullable(),
}).passthrough();

/**
 * Detected correlation schema
 */
export const detectedCorrelationSchema = z.object({
  id: z.string(),
  type: z.enum(['positive', 'negative']),
  strength: z.number(),
  factor1: z.string(),
  factor2: z.string(),
  description: z.string(),
  affectedPaths: z.array(z.string()),
  confidence: z.number(),
}).passthrough();

/**
 * Timeline projection schema
 */
export const timelineProjectionSchema = z.object({
  timestamp: z.string(),
  label: z.string(),
  probabilityRange: z.object({
    min: z.number(),
    max: z.number(),
  }),
  riskRange: z.object({
    min: z.number(),
    max: z.number(),
  }),
  keyEvents: z.array(z.string()),
}).passthrough();

/**
 * Outcome universe schema
 */
export const outcomeUniverseSchema = z.object({
  totalRealities: z.number().int(),
  totalBranchingNodes: z.number().int(),
  probabilityWeightedOutcomes: z.array(probabilityDistributionSchema),
  executiveSummary: z.string(),
  bestCaseScenario: realityPathSummarySchema.nullable(),
  worstCaseScenario: realityPathSummarySchema.nullable(),
  mostLikelyScenario: realityPathSummarySchema.nullable(),
  riskHeatmap: z.record(z.number()),
  opportunityHeatmap: z.record(z.number()),
  timelineProjection: z.array(timelineProjectionSchema),
}).passthrough();

/**
 * Path comparison result schema
 */
export const pathComparisonResultSchema = z.object({
  path1Id: z.string(),
  path2Id: z.string(),
  similarities: z.array(z.string()),
  differences: z.array(z.string()),
  probabilityDelta: z.number(),
  riskDelta: z.number(),
  opportunityDelta: z.number(),
  recommendation: z.string(),
}).passthrough();

/**
 * Narrative delta result schema
 */
export const narrativeDeltaResultSchema = z.object({
  overallDelta: z.string(),
  nodeDeltas: z.record(z.string()),
  emergingThemes: z.array(z.string()),
  fadingThemes: z.array(z.string()),
  pivotPoints: z.array(z.string()),
}).passthrough();

/**
 * Full analysis response schema
 */
export const realityMapAnalysisResponseSchema = z.object({
  mapId: z.string(),
  analysisTimestamp: z.string(),
  outcomeUniverse: outcomeUniverseSchema,
  pathComparisons: z.array(pathComparisonResultSchema),
  narrativeDelta: narrativeDeltaResultSchema,
  contradictions: z.array(detectedContradictionSchema),
  correlations: z.array(detectedCorrelationSchema),
  recommendations: z.array(actionRecommendationSchema),
  confidence: z.number(),
}).passthrough();

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CreateRealityMapInput = z.infer<typeof createRealityMapSchema>;
export type UpdateRealityMapInput = z.infer<typeof updateRealityMapSchema>;
export type GenerateRealityMapInput = z.infer<typeof generateRealityMapSchema>;
export type CreateRealityMapNodeInput = z.infer<typeof createRealityMapNodeSchema>;
export type UpdateRealityMapNodeInput = z.infer<typeof updateRealityMapNodeSchema>;
export type CreateRealityMapEdgeInput = z.infer<typeof createRealityMapEdgeSchema>;
export type AnalysisOptionsInput = z.infer<typeof analysisOptionsSchema>;
export type CreateComparisonInput = z.infer<typeof createComparisonSchema>;
export type ListRealityMapsQuery = z.infer<typeof listRealityMapsQuerySchema>;
export type ListRealityMapNodesQuery = z.infer<typeof listRealityMapNodesQuerySchema>;
export type ListRealityMapPathsQuery = z.infer<typeof listRealityMapPathsQuerySchema>;
export type ListRealityMapAuditQuery = z.infer<typeof listRealityMapAuditQuerySchema>;
export type GetRealityMapGraphQuery = z.infer<typeof getRealityMapGraphQuerySchema>;
export type GetRealityMapAnalysisQuery = z.infer<typeof getRealityMapAnalysisQuerySchema>;
