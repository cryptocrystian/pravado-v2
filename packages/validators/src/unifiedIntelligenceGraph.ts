/**
 * Unified Intelligence Graph Validators (Sprint S66)
 * Global Insight Fabric & Unified Intelligence Graph V1
 * Zod schemas for API validation
 */

import { z } from 'zod';

// ============================================================================
// ENUMS
// ============================================================================

export const nodeTypeEnum = z.enum([
  'organization',
  'user',
  'team',
  'press_release',
  'media_coverage',
  'journalist',
  'publication',
  'media_list',
  'pitch',
  'outreach_campaign',
  'media_mention',
  'media_alert',
  'sentiment_signal',
  'performance_metric',
  'kpi_indicator',
  'trend_signal',
  'competitor',
  'competitive_insight',
  'market_trend',
  'crisis_event',
  'crisis_response',
  'risk_factor',
  'risk_assessment',
  'escalation',
  'brand_signal',
  'brand_mention',
  'reputation_score',
  'compliance_item',
  'governance_policy',
  'audit_finding',
  'executive_digest',
  'board_report',
  'investor_update',
  'command_center_alert',
  'strategic_report',
  'strategic_insight',
  'strategic_recommendation',
  'audience_persona',
  'audience_segment',
  'content_brief',
  'content_piece',
  'narrative',
  'cluster',
  'topic',
  'theme',
  'event',
  'custom',
]);

export const edgeTypeEnum = z.enum([
  'parent_of',
  'child_of',
  'belongs_to',
  'contains',
  'caused_by',
  'leads_to',
  'triggers',
  'mitigates',
  'escalates_to',
  'precedes',
  'follows',
  'concurrent_with',
  'during',
  'similar_to',
  'related_to',
  'contrasts_with',
  'complements',
  'authored_by',
  'mentions',
  'references',
  'cites',
  'covers',
  'influences',
  'impacts',
  'derives_from',
  'contributes_to',
  'associated_with',
  'linked_to',
  'correlates_with',
  'positive_sentiment_toward',
  'negative_sentiment_toward',
  'neutral_sentiment_toward',
  'supports_strategy',
  'threatens_strategy',
  'opportunity_for',
  'risk_to',
  'custom',
]);

export const embeddingProviderEnum = z.enum([
  'openai_ada_002',
  'openai_3_small',
  'openai_3_large',
  'cohere_embed_v3',
  'anthropic',
  'custom',
]);

export const graphSnapshotStatusEnum = z.enum([
  'pending',
  'generating',
  'complete',
  'failed',
  'archived',
]);

export const graphEventTypeEnum = z.enum([
  'node_created',
  'node_updated',
  'node_deleted',
  'node_merged',
  'edge_created',
  'edge_updated',
  'edge_deleted',
  'embedding_generated',
  'embedding_updated',
  'snapshot_created',
  'snapshot_regenerated',
  'query_executed',
  'traversal_executed',
  'metrics_computed',
  'reasoning_executed',
]);

export const traversalDirectionEnum = z.enum(['outgoing', 'incoming', 'both']);

export const queryOperatorEnum = z.enum([
  'equals',
  'not_equals',
  'contains',
  'starts_with',
  'ends_with',
  'greater_than',
  'less_than',
  'in',
  'not_in',
  'exists',
  'not_exists',
]);

export const centralityTypeEnum = z.enum([
  'degree',
  'betweenness',
  'closeness',
  'pagerank',
  'eigenvector',
]);

// ============================================================================
// NODE SCHEMAS
// ============================================================================

export const createNodeSchema = z.object({
  nodeType: nodeTypeEnum,
  label: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  externalId: z.string().max(255).optional(),
  sourceSystem: z.string().max(100).optional(),
  sourceTable: z.string().max(100).optional(),
  propertiesJson: z.record(z.unknown()).optional(),
  tags: z.array(z.string().max(100)).max(50).optional(),
  categories: z.array(z.string().max(100)).max(20).optional(),
  validFrom: z.string().datetime().optional(),
  validTo: z.string().datetime().optional(),
  confidenceScore: z.number().min(0).max(1).optional(),
});

export const updateNodeSchema = z.object({
  label: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).optional().nullable(),
  propertiesJson: z.record(z.unknown()).optional(),
  tags: z.array(z.string().max(100)).max(50).optional(),
  categories: z.array(z.string().max(100)).max(20).optional(),
  validFrom: z.string().datetime().optional().nullable(),
  validTo: z.string().datetime().optional().nullable(),
  confidenceScore: z.number().min(0).max(1).optional().nullable(),
  isActive: z.boolean().optional(),
});

export const listNodesSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  nodeTypes: z.array(nodeTypeEnum).optional(),
  tags: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  search: z.string().max(500).optional(),
  sourceSystem: z.string().max(100).optional(),
  isActive: z.coerce.boolean().optional(),
  sortBy: z
    .enum(['created_at', 'updated_at', 'label', 'degree_centrality', 'pagerank_score'])
    .default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  clusterId: z.string().uuid().optional(),
  communityId: z.string().max(100).optional(),
});

// ============================================================================
// EDGE SCHEMAS
// ============================================================================

export const createEdgeSchema = z.object({
  sourceNodeId: z.string().uuid(),
  targetNodeId: z.string().uuid(),
  edgeType: edgeTypeEnum,
  label: z.string().max(500).optional(),
  description: z.string().max(5000).optional(),
  propertiesJson: z.record(z.unknown()).optional(),
  weight: z.number().min(0).max(1000).default(1.0),
  isBidirectional: z.boolean().default(false),
  validFrom: z.string().datetime().optional(),
  validTo: z.string().datetime().optional(),
  sourceSystem: z.string().max(100).optional(),
  inferenceMethod: z.string().max(100).optional(),
  confidenceScore: z.number().min(0).max(1).optional(),
});

export const updateEdgeSchema = z.object({
  label: z.string().max(500).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  propertiesJson: z.record(z.unknown()).optional(),
  weight: z.number().min(0).max(1000).optional(),
  isBidirectional: z.boolean().optional(),
  validFrom: z.string().datetime().optional().nullable(),
  validTo: z.string().datetime().optional().nullable(),
  confidenceScore: z.number().min(0).max(1).optional().nullable(),
  isActive: z.boolean().optional(),
});

export const listEdgesSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  edgeTypes: z.array(edgeTypeEnum).optional(),
  sourceNodeId: z.string().uuid().optional(),
  targetNodeId: z.string().uuid().optional(),
  nodeId: z.string().uuid().optional(),
  minWeight: z.coerce.number().min(0).optional(),
  maxWeight: z.coerce.number().min(0).optional(),
  isActive: z.coerce.boolean().optional(),
  isBidirectional: z.coerce.boolean().optional(),
  sortBy: z.enum(['created_at', 'weight']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================================
// MERGE SCHEMAS
// ============================================================================

export const mergeNodesSchema = z.object({
  sourceNodeIds: z.array(z.string().uuid()).min(2).max(10),
  targetNodeId: z.string().uuid().optional(),
  mergeStrategy: z.enum(['keep_first', 'keep_newest', 'merge_properties', 'create_new']),
  newLabel: z.string().min(1).max(500).optional(),
  newDescription: z.string().max(5000).optional(),
  preserveEdges: z.boolean().default(true),
});

// ============================================================================
// QUERY SCHEMAS
// ============================================================================

export const queryFilterSchema = z.object({
  field: z.string().min(1).max(100),
  operator: queryOperatorEnum,
  value: z.unknown(),
});

export const unifiedGraphQuerySchema = z.object({
  // Node filters
  nodeFilters: z.array(queryFilterSchema).max(20).optional(),

  // Edge filters
  edgeFilters: z.array(queryFilterSchema).max(20).optional(),

  // Traversal options
  startNodeId: z.string().uuid().optional(),
  direction: traversalDirectionEnum.optional(),
  maxDepth: z.number().min(1).max(10).default(3),
  nodeTypes: z.array(nodeTypeEnum).optional(),
  edgeTypes: z.array(edgeTypeEnum).optional(),

  // Semantic search
  semanticQuery: z.string().max(1000).optional(),
  semanticThreshold: z.number().min(0).max(1).default(0.7),

  // Aggregation
  groupBy: z.enum(['node_type', 'edge_type', 'cluster_id', 'community_id']).optional(),
  aggregate: z.enum(['count', 'sum', 'avg', 'min', 'max']).optional(),
  aggregateField: z.string().max(100).optional(),

  // Pagination
  limit: z.number().min(1).max(1000).default(100),
  offset: z.number().min(0).default(0),
});

// ============================================================================
// SNAPSHOT SCHEMAS
// ============================================================================

export const generateSnapshotSchema = z.object({
  name: z.string().min(1).max(300),
  description: z.string().max(2000).optional(),
  snapshotType: z.enum(['full', 'incremental', 'metrics_only']).default('full'),
  includeNodes: z.boolean().default(true),
  includeEdges: z.boolean().default(true),
  includeClusters: z.boolean().default(true),
  nodeTypes: z.array(nodeTypeEnum).optional(),
  computeDiff: z.boolean().default(true),
});

export const listSnapshotsSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  status: graphSnapshotStatusEnum.optional(),
  snapshotType: z.string().max(100).optional(),
  sortBy: z.enum(['created_at', 'node_count']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================================
// PATH & TRAVERSAL SCHEMAS
// ============================================================================

export const explainPathSchema = z.object({
  startNodeId: z.string().uuid(),
  endNodeId: z.string().uuid(),
  maxDepth: z.number().min(1).max(10).default(6),
  edgeTypes: z.array(edgeTypeEnum).optional(),
  includeReasoning: z.boolean().default(true),
});

export const traverseGraphSchema = z.object({
  startNodeId: z.string().uuid(),
  direction: traversalDirectionEnum.default('both'),
  maxDepth: z.number().min(1).max(10).default(3),
  nodeTypes: z.array(nodeTypeEnum).optional(),
  edgeTypes: z.array(edgeTypeEnum).optional(),
  limit: z.number().min(1).max(1000).default(100),
});

export const findNeighborsSchema = z.object({
  nodeId: z.string().uuid(),
  direction: traversalDirectionEnum.default('both'),
  edgeTypes: z.array(edgeTypeEnum).optional(),
  limit: z.number().min(1).max(100).default(20),
});

// ============================================================================
// EMBEDDING SCHEMAS
// ============================================================================

export const generateEmbeddingsSchema = z.object({
  nodeIds: z.array(z.string().uuid()).max(100).optional(),
  edgeIds: z.array(z.string().uuid()).max(100).optional(),
  provider: embeddingProviderEnum.default('openai_3_small'),
  forceRegenerate: z.boolean().default(false),
});

export const semanticSearchSchema = z.object({
  query: z.string().min(1).max(1000),
  nodeTypes: z.array(nodeTypeEnum).optional(),
  threshold: z.number().min(0).max(1).default(0.7),
  limit: z.number().min(1).max(100).default(20),
});

// ============================================================================
// METRICS SCHEMAS
// ============================================================================

export const computeMetricsSchema = z.object({
  computeCentrality: z.boolean().default(true),
  computeClusters: z.boolean().default(true),
  computeCommunities: z.boolean().default(false),
  nodeTypes: z.array(nodeTypeEnum).optional(),
  edgeTypes: z.array(edgeTypeEnum).optional(),
});

export const getMetricsSchema = z.object({
  nodeTypes: z.array(nodeTypeEnum).optional(),
  edgeTypes: z.array(edgeTypeEnum).optional(),
  includeTopNodes: z.coerce.boolean().default(true),
  topNodesLimit: z.coerce.number().min(1).max(50).default(10),
});

// ============================================================================
// AUDIT LOG SCHEMAS
// ============================================================================

export const listAuditLogsSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  eventType: graphEventTypeEnum.optional(),
  nodeId: z.string().uuid().optional(),
  edgeId: z.string().uuid().optional(),
  actorId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// ============================================================================
// BULK OPERATION SCHEMAS
// ============================================================================

export const bulkCreateNodesSchema = z.object({
  nodes: z.array(createNodeSchema).min(1).max(100),
});

export const bulkCreateEdgesSchema = z.object({
  edges: z.array(createEdgeSchema).min(1).max(100),
});

export const bulkDeleteNodesSchema = z.object({
  nodeIds: z.array(z.string().uuid()).min(1).max(100),
  deleteEdges: z.boolean().default(true),
});

export const bulkDeleteEdgesSchema = z.object({
  edgeIds: z.array(z.string().uuid()).min(1).max(100),
});

// ============================================================================
// IMPORT/EXPORT SCHEMAS
// ============================================================================

export const importGraphSchema = z.object({
  nodes: z.array(createNodeSchema).optional(),
  edges: z.array(createEdgeSchema).optional(),
  format: z.enum(['json', 'graphml', 'gexf']).default('json'),
  overwriteExisting: z.boolean().default(false),
  validateReferences: z.boolean().default(true),
});

export const exportGraphSchema = z.object({
  format: z.enum(['json', 'graphml', 'gexf', 'cytoscape']).default('json'),
  nodeTypes: z.array(nodeTypeEnum).optional(),
  edgeTypes: z.array(edgeTypeEnum).optional(),
  includeEmbeddings: z.boolean().default(false),
  includeMetrics: z.boolean().default(true),
});

// ============================================================================
// REASONING SCHEMAS
// ============================================================================

export const reasoningQuerySchema = z.object({
  question: z.string().min(10).max(2000),
  contextNodeIds: z.array(z.string().uuid()).max(20).optional(),
  maxDepth: z.number().min(1).max(5).default(3),
  includeExplanation: z.boolean().default(true),
  maxTokens: z.number().min(100).max(4000).default(1000),
});

export const narrativeGenerationSchema = z.object({
  startNodeId: z.string().uuid(),
  endNodeId: z.string().uuid().optional(),
  nodeTypes: z.array(nodeTypeEnum).optional(),
  edgeTypes: z.array(edgeTypeEnum).optional(),
  maxDepth: z.number().min(1).max(5).default(3),
  style: z.enum(['executive', 'technical', 'narrative', 'bullet_points']).default('narrative'),
  maxLength: z.number().min(100).max(5000).default(1000),
});

// ============================================================================
// INFERRED TYPES
// ============================================================================

export type CreateNodeInput = z.infer<typeof createNodeSchema>;
export type UpdateNodeInput = z.infer<typeof updateNodeSchema>;
export type ListNodesInput = z.infer<typeof listNodesSchema>;
export type CreateEdgeInput = z.infer<typeof createEdgeSchema>;
export type UpdateEdgeInput = z.infer<typeof updateEdgeSchema>;
export type ListEdgesInput = z.infer<typeof listEdgesSchema>;
export type MergeNodesInput = z.infer<typeof mergeNodesSchema>;
export type GraphQueryInput = z.infer<typeof unifiedGraphQuerySchema>;
export type GenerateSnapshotInput = z.infer<typeof generateSnapshotSchema>;
export type ListSnapshotsInput = z.infer<typeof listSnapshotsSchema>;
export type ExplainPathInput = z.infer<typeof explainPathSchema>;
export type TraverseGraphInput = z.infer<typeof traverseGraphSchema>;
export type FindNeighborsInput = z.infer<typeof findNeighborsSchema>;
export type GenerateEmbeddingsInput = z.infer<typeof generateEmbeddingsSchema>;
export type SemanticSearchInput = z.infer<typeof semanticSearchSchema>;
export type ComputeMetricsInput = z.infer<typeof computeMetricsSchema>;
export type GetMetricsInput = z.infer<typeof getMetricsSchema>;
export type ListAuditLogsInput = z.infer<typeof listAuditLogsSchema>;
export type BulkCreateNodesInput = z.infer<typeof bulkCreateNodesSchema>;
export type BulkCreateEdgesInput = z.infer<typeof bulkCreateEdgesSchema>;
export type BulkDeleteNodesInput = z.infer<typeof bulkDeleteNodesSchema>;
export type BulkDeleteEdgesInput = z.infer<typeof bulkDeleteEdgesSchema>;
export type ImportGraphInput = z.infer<typeof importGraphSchema>;
export type ExportGraphInput = z.infer<typeof exportGraphSchema>;
export type ReasoningQueryInput = z.infer<typeof reasoningQuerySchema>;
export type NarrativeGenerationInput = z.infer<typeof narrativeGenerationSchema>;
