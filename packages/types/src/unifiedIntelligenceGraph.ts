/**
 * Unified Intelligence Graph Types (Sprint S66)
 * Global Insight Fabric & Unified Intelligence Graph V1
 * Cross-system knowledge graph integrating S38-S65
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Node types representing all entities across the Pravado ecosystem
 */
export enum NodeType {
  // Core entities
  ORGANIZATION = 'organization',
  USER = 'user',
  TEAM = 'team',

  // Media & PR entities (S43-S49)
  PRESS_RELEASE = 'press_release',
  MEDIA_COVERAGE = 'media_coverage',
  JOURNALIST = 'journalist',
  PUBLICATION = 'publication',
  MEDIA_LIST = 'media_list',
  PITCH = 'pitch',
  OUTREACH_CAMPAIGN = 'outreach_campaign',

  // Monitoring & Alerts (S45, S48)
  MEDIA_MENTION = 'media_mention',
  MEDIA_ALERT = 'media_alert',
  SENTIMENT_SIGNAL = 'sentiment_signal',

  // Performance & Analytics (S57)
  PERFORMANCE_METRIC = 'performance_metric',
  KPI_INDICATOR = 'kpi_indicator',
  TREND_SIGNAL = 'trend_signal',

  // Competitive Intelligence (S58)
  COMPETITOR = 'competitor',
  COMPETITIVE_INSIGHT = 'competitive_insight',
  MARKET_TREND = 'market_trend',

  // Crisis & Risk (S59, S62)
  CRISIS_EVENT = 'crisis_event',
  CRISIS_RESPONSE = 'crisis_response',
  RISK_FACTOR = 'risk_factor',
  RISK_ASSESSMENT = 'risk_assessment',
  ESCALATION = 'escalation',

  // Brand (S60)
  BRAND_SIGNAL = 'brand_signal',
  BRAND_MENTION = 'brand_mention',
  REPUTATION_SCORE = 'reputation_score',

  // Governance (S61)
  COMPLIANCE_ITEM = 'compliance_item',
  GOVERNANCE_POLICY = 'governance_policy',
  AUDIT_FINDING = 'audit_finding',

  // Executive (S63, S64)
  EXECUTIVE_DIGEST = 'executive_digest',
  BOARD_REPORT = 'board_report',
  INVESTOR_UPDATE = 'investor_update',
  COMMAND_CENTER_ALERT = 'command_center_alert',

  // Strategic Intelligence (S65)
  STRATEGIC_REPORT = 'strategic_report',
  STRATEGIC_INSIGHT = 'strategic_insight',
  STRATEGIC_RECOMMENDATION = 'strategic_recommendation',

  // Audience & Personas (S56)
  AUDIENCE_PERSONA = 'audience_persona',
  AUDIENCE_SEGMENT = 'audience_segment',

  // Content (S46, S47)
  CONTENT_BRIEF = 'content_brief',
  CONTENT_PIECE = 'content_piece',
  NARRATIVE = 'narrative',

  // Graph-specific
  CLUSTER = 'cluster',
  TOPIC = 'topic',
  THEME = 'theme',
  EVENT = 'event',
  CUSTOM = 'custom',
}

/**
 * Edge types representing relationships between nodes
 */
export enum EdgeType {
  // Hierarchical relationships
  PARENT_OF = 'parent_of',
  CHILD_OF = 'child_of',
  BELONGS_TO = 'belongs_to',
  CONTAINS = 'contains',

  // Causal relationships
  CAUSED_BY = 'caused_by',
  LEADS_TO = 'leads_to',
  TRIGGERS = 'triggers',
  MITIGATES = 'mitigates',
  ESCALATES_TO = 'escalates_to',

  // Temporal relationships
  PRECEDES = 'precedes',
  FOLLOWS = 'follows',
  CONCURRENT_WITH = 'concurrent_with',
  DURING = 'during',

  // Similarity relationships
  SIMILAR_TO = 'similar_to',
  RELATED_TO = 'related_to',
  CONTRASTS_WITH = 'contrasts_with',
  COMPLEMENTS = 'complements',

  // Attribution relationships
  AUTHORED_BY = 'authored_by',
  MENTIONS = 'mentions',
  REFERENCES = 'references',
  CITES = 'cites',
  COVERS = 'covers',

  // Influence relationships
  INFLUENCES = 'influences',
  IMPACTS = 'impacts',
  DERIVES_FROM = 'derives_from',
  CONTRIBUTES_TO = 'contributes_to',

  // Association relationships
  ASSOCIATED_WITH = 'associated_with',
  LINKED_TO = 'linked_to',
  CORRELATES_WITH = 'correlates_with',

  // Sentiment relationships
  POSITIVE_SENTIMENT_TOWARD = 'positive_sentiment_toward',
  NEGATIVE_SENTIMENT_TOWARD = 'negative_sentiment_toward',
  NEUTRAL_SENTIMENT_TOWARD = 'neutral_sentiment_toward',

  // Strategic relationships
  SUPPORTS_STRATEGY = 'supports_strategy',
  THREATENS_STRATEGY = 'threatens_strategy',
  OPPORTUNITY_FOR = 'opportunity_for',
  RISK_TO = 'risk_to',

  // Custom
  CUSTOM = 'custom',
}

/**
 * Embedding providers for vector storage
 */
export enum EmbeddingProvider {
  OPENAI_ADA_002 = 'openai_ada_002',
  OPENAI_3_SMALL = 'openai_3_small',
  OPENAI_3_LARGE = 'openai_3_large',
  COHERE_EMBED_V3 = 'cohere_embed_v3',
  ANTHROPIC = 'anthropic',
  CUSTOM = 'custom',
}

/**
 * Graph snapshot status
 */
export enum GraphSnapshotStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  COMPLETE = 'complete',
  FAILED = 'failed',
  ARCHIVED = 'archived',
}

/**
 * Graph audit event types
 */
export enum GraphEventType {
  NODE_CREATED = 'node_created',
  NODE_UPDATED = 'node_updated',
  NODE_DELETED = 'node_deleted',
  NODE_MERGED = 'node_merged',
  EDGE_CREATED = 'edge_created',
  EDGE_UPDATED = 'edge_updated',
  EDGE_DELETED = 'edge_deleted',
  EMBEDDING_GENERATED = 'embedding_generated',
  EMBEDDING_UPDATED = 'embedding_updated',
  SNAPSHOT_CREATED = 'snapshot_created',
  SNAPSHOT_REGENERATED = 'snapshot_regenerated',
  QUERY_EXECUTED = 'query_executed',
  TRAVERSAL_EXECUTED = 'traversal_executed',
  METRICS_COMPUTED = 'metrics_computed',
  REASONING_EXECUTED = 'reasoning_executed',
}

/**
 * Traversal direction options
 */
export enum TraversalDirection {
  OUTGOING = 'outgoing',
  INCOMING = 'incoming',
  BOTH = 'both',
}

/**
 * Graph query operators
 */
export enum QueryOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  CONTAINS = 'contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  IN = 'in',
  NOT_IN = 'not_in',
  EXISTS = 'exists',
  NOT_EXISTS = 'not_exists',
}

/**
 * Centrality metric types
 */
export enum CentralityType {
  DEGREE = 'degree',
  BETWEENNESS = 'betweenness',
  CLOSENESS = 'closeness',
  PAGERANK = 'pagerank',
  EIGENVECTOR = 'eigenvector',
}

// ============================================================================
// DISPLAY LABELS
// ============================================================================

export const NODE_TYPE_LABELS: Record<NodeType, string> = {
  [NodeType.ORGANIZATION]: 'Organization',
  [NodeType.USER]: 'User',
  [NodeType.TEAM]: 'Team',
  [NodeType.PRESS_RELEASE]: 'Press Release',
  [NodeType.MEDIA_COVERAGE]: 'Media Coverage',
  [NodeType.JOURNALIST]: 'Journalist',
  [NodeType.PUBLICATION]: 'Publication',
  [NodeType.MEDIA_LIST]: 'Media List',
  [NodeType.PITCH]: 'Pitch',
  [NodeType.OUTREACH_CAMPAIGN]: 'Outreach Campaign',
  [NodeType.MEDIA_MENTION]: 'Media Mention',
  [NodeType.MEDIA_ALERT]: 'Media Alert',
  [NodeType.SENTIMENT_SIGNAL]: 'Sentiment Signal',
  [NodeType.PERFORMANCE_METRIC]: 'Performance Metric',
  [NodeType.KPI_INDICATOR]: 'KPI Indicator',
  [NodeType.TREND_SIGNAL]: 'Trend Signal',
  [NodeType.COMPETITOR]: 'Competitor',
  [NodeType.COMPETITIVE_INSIGHT]: 'Competitive Insight',
  [NodeType.MARKET_TREND]: 'Market Trend',
  [NodeType.CRISIS_EVENT]: 'Crisis Event',
  [NodeType.CRISIS_RESPONSE]: 'Crisis Response',
  [NodeType.RISK_FACTOR]: 'Risk Factor',
  [NodeType.RISK_ASSESSMENT]: 'Risk Assessment',
  [NodeType.ESCALATION]: 'Escalation',
  [NodeType.BRAND_SIGNAL]: 'Brand Signal',
  [NodeType.BRAND_MENTION]: 'Brand Mention',
  [NodeType.REPUTATION_SCORE]: 'Reputation Score',
  [NodeType.COMPLIANCE_ITEM]: 'Compliance Item',
  [NodeType.GOVERNANCE_POLICY]: 'Governance Policy',
  [NodeType.AUDIT_FINDING]: 'Audit Finding',
  [NodeType.EXECUTIVE_DIGEST]: 'Executive Digest',
  [NodeType.BOARD_REPORT]: 'Board Report',
  [NodeType.INVESTOR_UPDATE]: 'Investor Update',
  [NodeType.COMMAND_CENTER_ALERT]: 'Command Center Alert',
  [NodeType.STRATEGIC_REPORT]: 'Strategic Report',
  [NodeType.STRATEGIC_INSIGHT]: 'Strategic Insight',
  [NodeType.STRATEGIC_RECOMMENDATION]: 'Strategic Recommendation',
  [NodeType.AUDIENCE_PERSONA]: 'Audience Persona',
  [NodeType.AUDIENCE_SEGMENT]: 'Audience Segment',
  [NodeType.CONTENT_BRIEF]: 'Content Brief',
  [NodeType.CONTENT_PIECE]: 'Content Piece',
  [NodeType.NARRATIVE]: 'Narrative',
  [NodeType.CLUSTER]: 'Cluster',
  [NodeType.TOPIC]: 'Topic',
  [NodeType.THEME]: 'Theme',
  [NodeType.EVENT]: 'Event',
  [NodeType.CUSTOM]: 'Custom',
};

export const EDGE_TYPE_LABELS: Record<EdgeType, string> = {
  [EdgeType.PARENT_OF]: 'Parent Of',
  [EdgeType.CHILD_OF]: 'Child Of',
  [EdgeType.BELONGS_TO]: 'Belongs To',
  [EdgeType.CONTAINS]: 'Contains',
  [EdgeType.CAUSED_BY]: 'Caused By',
  [EdgeType.LEADS_TO]: 'Leads To',
  [EdgeType.TRIGGERS]: 'Triggers',
  [EdgeType.MITIGATES]: 'Mitigates',
  [EdgeType.ESCALATES_TO]: 'Escalates To',
  [EdgeType.PRECEDES]: 'Precedes',
  [EdgeType.FOLLOWS]: 'Follows',
  [EdgeType.CONCURRENT_WITH]: 'Concurrent With',
  [EdgeType.DURING]: 'During',
  [EdgeType.SIMILAR_TO]: 'Similar To',
  [EdgeType.RELATED_TO]: 'Related To',
  [EdgeType.CONTRASTS_WITH]: 'Contrasts With',
  [EdgeType.COMPLEMENTS]: 'Complements',
  [EdgeType.AUTHORED_BY]: 'Authored By',
  [EdgeType.MENTIONS]: 'Mentions',
  [EdgeType.REFERENCES]: 'References',
  [EdgeType.CITES]: 'Cites',
  [EdgeType.COVERS]: 'Covers',
  [EdgeType.INFLUENCES]: 'Influences',
  [EdgeType.IMPACTS]: 'Impacts',
  [EdgeType.DERIVES_FROM]: 'Derives From',
  [EdgeType.CONTRIBUTES_TO]: 'Contributes To',
  [EdgeType.ASSOCIATED_WITH]: 'Associated With',
  [EdgeType.LINKED_TO]: 'Linked To',
  [EdgeType.CORRELATES_WITH]: 'Correlates With',
  [EdgeType.POSITIVE_SENTIMENT_TOWARD]: 'Positive Sentiment',
  [EdgeType.NEGATIVE_SENTIMENT_TOWARD]: 'Negative Sentiment',
  [EdgeType.NEUTRAL_SENTIMENT_TOWARD]: 'Neutral Sentiment',
  [EdgeType.SUPPORTS_STRATEGY]: 'Supports Strategy',
  [EdgeType.THREATENS_STRATEGY]: 'Threatens Strategy',
  [EdgeType.OPPORTUNITY_FOR]: 'Opportunity For',
  [EdgeType.RISK_TO]: 'Risk To',
  [EdgeType.CUSTOM]: 'Custom',
};

export const SNAPSHOT_STATUS_LABELS: Record<GraphSnapshotStatus, string> = {
  [GraphSnapshotStatus.PENDING]: 'Pending',
  [GraphSnapshotStatus.GENERATING]: 'Generating',
  [GraphSnapshotStatus.COMPLETE]: 'Complete',
  [GraphSnapshotStatus.FAILED]: 'Failed',
  [GraphSnapshotStatus.ARCHIVED]: 'Archived',
};

export const EVENT_TYPE_LABELS: Record<GraphEventType, string> = {
  [GraphEventType.NODE_CREATED]: 'Node Created',
  [GraphEventType.NODE_UPDATED]: 'Node Updated',
  [GraphEventType.NODE_DELETED]: 'Node Deleted',
  [GraphEventType.NODE_MERGED]: 'Nodes Merged',
  [GraphEventType.EDGE_CREATED]: 'Edge Created',
  [GraphEventType.EDGE_UPDATED]: 'Edge Updated',
  [GraphEventType.EDGE_DELETED]: 'Edge Deleted',
  [GraphEventType.EMBEDDING_GENERATED]: 'Embedding Generated',
  [GraphEventType.EMBEDDING_UPDATED]: 'Embedding Updated',
  [GraphEventType.SNAPSHOT_CREATED]: 'Snapshot Created',
  [GraphEventType.SNAPSHOT_REGENERATED]: 'Snapshot Regenerated',
  [GraphEventType.QUERY_EXECUTED]: 'Query Executed',
  [GraphEventType.TRAVERSAL_EXECUTED]: 'Traversal Executed',
  [GraphEventType.METRICS_COMPUTED]: 'Metrics Computed',
  [GraphEventType.REASONING_EXECUTED]: 'Reasoning Executed',
};

// ============================================================================
// CORE INTERFACES
// ============================================================================

/**
 * Intelligence Node - a vertex in the knowledge graph
 */
export interface IntelligenceNode {
  id: string;
  orgId: string;

  // Node identity
  nodeType: NodeType;
  externalId?: string | null;
  sourceSystem?: string | null;
  sourceTable?: string | null;

  // Node content
  label: string;
  description?: string | null;
  propertiesJson: Record<string, unknown>;

  // Classification
  tags: string[];
  categories: string[];

  // Temporal bounds
  validFrom?: string | null;
  validTo?: string | null;

  // Graph metrics (computed)
  degreeCentrality?: number | null;
  betweennessCentrality?: number | null;
  closenessCentrality?: number | null;
  pagerankScore?: number | null;
  clusterId?: string | null;
  communityId?: string | null;

  // Status
  isActive: boolean;
  confidenceScore?: number | null;

  // Audit
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  updatedBy?: string | null;
}

/**
 * Intelligence Edge - a relationship between nodes
 */
export interface IntelligenceEdge {
  id: string;
  orgId: string;

  // Edge endpoints
  sourceNodeId: string;
  targetNodeId: string;

  // Edge identity
  edgeType: EdgeType;
  label?: string | null;
  description?: string | null;
  propertiesJson: Record<string, unknown>;

  // Edge weight and directionality
  weight: number;
  isBidirectional: boolean;

  // Temporal bounds
  validFrom?: string | null;
  validTo?: string | null;

  // Provenance
  sourceSystem?: string | null;
  inferenceMethod?: string | null;
  confidenceScore?: number | null;

  // Status
  isActive: boolean;

  // Audit
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
}

/**
 * Node Embedding - vector representation of a node
 */
export interface IntelligenceNodeEmbedding {
  id: string;
  orgId: string;
  nodeId: string;

  // Embedding details
  provider: EmbeddingProvider;
  modelVersion?: string | null;
  embeddingVector?: number[] | null;
  dimensions: number;

  // Context used for embedding
  contextText?: string | null;
  contextHash?: string | null;

  // Metadata
  generatedAt: string;
  expiresAt?: string | null;
  isCurrent: boolean;

  // Audit
  createdAt: string;
}

/**
 * Edge Embedding - vector representation of an edge
 */
export interface IntelligenceEdgeEmbedding {
  id: string;
  orgId: string;
  edgeId: string;

  // Embedding details
  provider: EmbeddingProvider;
  modelVersion?: string | null;
  embeddingVector?: number[] | null;
  dimensions: number;

  // Context used for embedding
  contextText?: string | null;
  contextHash?: string | null;

  // Metadata
  generatedAt: string;
  expiresAt?: string | null;
  isCurrent: boolean;

  // Audit
  createdAt: string;
}

/**
 * Graph Snapshot - point-in-time capture of graph state
 */
export interface IntelligenceGraphSnapshot {
  id: string;
  orgId: string;

  // Snapshot identity
  name: string;
  description?: string | null;
  snapshotType: string;

  // Status
  status: GraphSnapshotStatus;

  // Snapshot data
  nodeCount?: number | null;
  edgeCount?: number | null;
  clusterCount?: number | null;

  // Metrics at snapshot time
  metricsJson: GraphMetrics;

  // Graph structure (serialized)
  nodesJson?: IntelligenceNode[] | null;
  edgesJson?: IntelligenceEdge[] | null;
  clustersJson?: ClusterInfo[] | null;

  // Diff from previous snapshot
  previousSnapshotId?: string | null;
  diffJson?: SnapshotDiff | null;

  // Storage
  storageUrl?: string | null;
  storageSizeBytes?: number | null;

  // Processing
  startedAt?: string | null;
  completedAt?: string | null;
  errorMessage?: string | null;

  // Audit
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
}

/**
 * Graph Audit Log Entry
 */
export interface IntelligenceGraphAuditLog {
  id: string;
  orgId: string;

  // Event details
  eventType: GraphEventType;

  // Entity references
  nodeId?: string | null;
  edgeId?: string | null;
  snapshotId?: string | null;

  // Actor
  actorId?: string | null;
  actorType: string;

  // Change details
  changesJson: Record<string, unknown>;
  metadataJson: Record<string, unknown>;

  // Query/traversal details
  queryJson?: GraphQueryInput | null;
  resultCount?: number | null;
  executionTimeMs?: number | null;

  // Audit
  createdAt: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

// ============================================================================
// COMPOSITE TYPES
// ============================================================================

/**
 * Node with connected edges and neighbors
 */
export interface NodeWithConnections {
  node: IntelligenceNode;
  incomingEdges: IntelligenceEdge[];
  outgoingEdges: IntelligenceEdge[];
  neighbors: IntelligenceNode[];
}

/**
 * Edge with source and target nodes
 */
export interface EdgeWithNodes {
  edge: IntelligenceEdge;
  sourceNode: IntelligenceNode;
  targetNode: IntelligenceNode;
}

/**
 * Cluster information
 */
export interface ClusterInfo {
  clusterId: string;
  name?: string;
  nodeCount: number;
  nodeTypes: NodeType[];
  centralNodeId?: string;
  density?: number;
  avgCentrality?: number;
}

/**
 * Community detection result
 */
export interface CommunityInfo {
  communityId: string;
  nodeIds: string[];
  size: number;
  modularity?: number;
  cohesion?: number;
}

/**
 * Graph metrics aggregate
 */
export interface GraphMetrics {
  // Node counts
  totalNodes: number;
  activeNodes: number;
  nodesByType: Record<string, number>;

  // Edge counts
  totalEdges: number;
  activeEdges: number;
  edgesByType: Record<string, number>;

  // Graph structure
  density?: number;
  avgDegree?: number;
  avgPathLength?: number;
  diameter?: number;
  clusteringCoefficient?: number;

  // Centrality stats
  avgDegreeCentrality?: number;
  avgBetweennessCentrality?: number;
  avgClosenessCentrality?: number;
  avgPagerankScore?: number;

  // Clusters
  clusterCount?: number;
  communityCount?: number;
  largestClusterSize?: number;

  // Top nodes
  topNodesByDegree?: Array<{ nodeId: string; label: string; degree: number }>;
  topNodesByPagerank?: Array<{ nodeId: string; label: string; pagerank: number }>;
  topNodesByBetweenness?: Array<{ nodeId: string; label: string; betweenness: number }>;

  // Computed at
  computedAt: string;
}

/**
 * Snapshot diff between two points in time
 */
export interface SnapshotDiff {
  nodesAdded: number;
  nodesRemoved: number;
  nodesModified: number;
  edgesAdded: number;
  edgesRemoved: number;
  edgesModified: number;
  metricsChanges: Record<string, { before: number; after: number; change: number }>;
  addedNodeIds: string[];
  removedNodeIds: string[];
  addedEdgeIds: string[];
  removedEdgeIds: string[];
}

/**
 * Path between nodes
 */
export interface GraphPath {
  startNodeId: string;
  endNodeId: string;
  path: string[];
  pathLength: number;
  totalWeight: number;
  nodes: IntelligenceNode[];
  edges: IntelligenceEdge[];
}

/**
 * Path explanation with reasoning
 */
export interface PathExplanation {
  path: GraphPath;
  explanation: string;
  reasoning: string[];
  confidence: number;
  keyRelationships: Array<{
    fromLabel: string;
    toLabel: string;
    relationship: string;
    significance: string;
  }>;
}

/**
 * Traversal result
 */
export interface TraversalResult {
  startNode: IntelligenceNode;
  visitedNodes: IntelligenceNode[];
  paths: GraphPath[];
  depth: number;
  totalNodesVisited: number;
}

/**
 * Semantic search result
 */
export interface SemanticSearchResult {
  node: IntelligenceNode;
  similarity: number;
  matchedContext?: string;
}

// ============================================================================
// INPUT DTOs
// ============================================================================

/**
 * Create node input
 */
export interface CreateNodeInput {
  nodeType: NodeType;
  label: string;
  description?: string;
  externalId?: string;
  sourceSystem?: string;
  sourceTable?: string;
  propertiesJson?: Record<string, unknown>;
  tags?: string[];
  categories?: string[];
  validFrom?: string;
  validTo?: string;
  confidenceScore?: number;
}

/**
 * Update node input
 */
export interface UpdateNodeInput {
  label?: string;
  description?: string;
  propertiesJson?: Record<string, unknown>;
  tags?: string[];
  categories?: string[];
  validFrom?: string;
  validTo?: string;
  confidenceScore?: number;
  isActive?: boolean;
}

/**
 * Create edge input
 */
export interface CreateEdgeInput {
  sourceNodeId: string;
  targetNodeId: string;
  edgeType: EdgeType;
  label?: string;
  description?: string;
  propertiesJson?: Record<string, unknown>;
  weight?: number;
  isBidirectional?: boolean;
  validFrom?: string;
  validTo?: string;
  sourceSystem?: string;
  inferenceMethod?: string;
  confidenceScore?: number;
}

/**
 * Update edge input
 */
export interface UpdateEdgeInput {
  label?: string;
  description?: string;
  propertiesJson?: Record<string, unknown>;
  weight?: number;
  isBidirectional?: boolean;
  validFrom?: string;
  validTo?: string;
  confidenceScore?: number;
  isActive?: boolean;
}

/**
 * Merge nodes input
 */
export interface MergeNodesInput {
  sourceNodeIds: string[];
  targetNodeId?: string;
  mergeStrategy: 'keep_first' | 'keep_newest' | 'merge_properties' | 'create_new';
  newLabel?: string;
  newDescription?: string;
  preserveEdges: boolean;
}

/**
 * List nodes query input
 */
export interface ListNodesInput {
  limit?: number;
  offset?: number;
  nodeTypes?: NodeType[];
  tags?: string[];
  categories?: string[];
  search?: string;
  sourceSystem?: string;
  isActive?: boolean;
  sortBy?: 'created_at' | 'updated_at' | 'label' | 'degree_centrality' | 'pagerank_score';
  sortOrder?: 'asc' | 'desc';
  clusterId?: string;
  communityId?: string;
}

/**
 * List edges query input
 */
export interface ListEdgesInput {
  limit?: number;
  offset?: number;
  edgeTypes?: EdgeType[];
  sourceNodeId?: string;
  targetNodeId?: string;
  nodeId?: string;
  minWeight?: number;
  maxWeight?: number;
  isActive?: boolean;
  isBidirectional?: boolean;
  sortBy?: 'created_at' | 'weight';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Graph query input for advanced queries
 */
export interface GraphQueryInput {
  // Node filters
  nodeFilters?: Array<{
    field: string;
    operator: QueryOperator;
    value: unknown;
  }>;

  // Edge filters
  edgeFilters?: Array<{
    field: string;
    operator: QueryOperator;
    value: unknown;
  }>;

  // Traversal options
  startNodeId?: string;
  direction?: TraversalDirection;
  maxDepth?: number;
  nodeTypes?: NodeType[];
  edgeTypes?: EdgeType[];

  // Semantic search
  semanticQuery?: string;
  semanticThreshold?: number;

  // Aggregation
  groupBy?: 'node_type' | 'edge_type' | 'cluster_id' | 'community_id';
  aggregate?: 'count' | 'sum' | 'avg' | 'min' | 'max';
  aggregateField?: string;

  // Pagination
  limit?: number;
  offset?: number;
}

/**
 * Generate snapshot input
 */
export interface GenerateSnapshotInput {
  name: string;
  description?: string;
  snapshotType?: 'full' | 'incremental' | 'metrics_only';
  includeNodes?: boolean;
  includeEdges?: boolean;
  includeClusters?: boolean;
  nodeTypes?: NodeType[];
  computeDiff?: boolean;
}

/**
 * Explain path input
 */
export interface ExplainPathInput {
  startNodeId: string;
  endNodeId: string;
  maxDepth?: number;
  edgeTypes?: EdgeType[];
  includeReasoning?: boolean;
}

/**
 * Generate embeddings input
 */
export interface GenerateEmbeddingsInput {
  nodeIds?: string[];
  edgeIds?: string[];
  provider?: EmbeddingProvider;
  forceRegenerate?: boolean;
}

/**
 * Compute metrics input
 */
export interface ComputeMetricsInput {
  computeCentrality?: boolean;
  computeClusters?: boolean;
  computeCommunities?: boolean;
  nodeTypes?: NodeType[];
  edgeTypes?: EdgeType[];
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

/**
 * List nodes response
 */
export interface ListNodesResponse {
  nodes: IntelligenceNode[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * List edges response
 */
export interface ListEdgesResponse {
  edges: IntelligenceEdge[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Graph query response
 */
export interface GraphQueryResponse {
  nodes: IntelligenceNode[];
  edges: IntelligenceEdge[];
  paths?: GraphPath[];
  aggregations?: Record<string, number>;
  total: number;
  executionTimeMs: number;
}

/**
 * List snapshots response
 */
export interface ListSnapshotsResponse {
  snapshots: IntelligenceGraphSnapshot[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * List audit logs response
 */
export interface ListAuditLogsResponse {
  logs: IntelligenceGraphAuditLog[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Merge nodes response
 */
export interface MergeNodesResponse {
  mergedNode: IntelligenceNode;
  mergedNodeIds: string[];
  edgesPreserved: number;
  edgesRemoved: number;
}

/**
 * Generate embeddings response
 */
export interface GenerateEmbeddingsResponse {
  nodeEmbeddingsGenerated: number;
  edgeEmbeddingsGenerated: number;
  errors: Array<{ id: string; error: string }>;
}

/**
 * Compute metrics response
 */
export interface ComputeMetricsResponse {
  metrics: GraphMetrics;
  nodesUpdated: number;
  clustersIdentified: number;
  communitiesDetected: number;
  executionTimeMs: number;
}

/**
 * Graph statistics summary
 */
export interface GraphStats {
  totalNodes: number;
  totalEdges: number;
  activeNodes: number;
  activeEdges: number;
  nodesByType: Record<string, number>;
  edgesByType: Record<string, number>;
  recentNodes: IntelligenceNode[];
  recentSnapshots: IntelligenceGraphSnapshot[];
  lastMetricsComputed?: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Node type category groupings
 */
export const NODE_TYPE_CATEGORIES: Record<string, NodeType[]> = {
  core: [NodeType.ORGANIZATION, NodeType.USER, NodeType.TEAM],
  media: [
    NodeType.PRESS_RELEASE,
    NodeType.MEDIA_COVERAGE,
    NodeType.JOURNALIST,
    NodeType.PUBLICATION,
    NodeType.MEDIA_LIST,
    NodeType.PITCH,
    NodeType.OUTREACH_CAMPAIGN,
  ],
  monitoring: [NodeType.MEDIA_MENTION, NodeType.MEDIA_ALERT, NodeType.SENTIMENT_SIGNAL],
  analytics: [NodeType.PERFORMANCE_METRIC, NodeType.KPI_INDICATOR, NodeType.TREND_SIGNAL],
  competitive: [NodeType.COMPETITOR, NodeType.COMPETITIVE_INSIGHT, NodeType.MARKET_TREND],
  crisis: [
    NodeType.CRISIS_EVENT,
    NodeType.CRISIS_RESPONSE,
    NodeType.RISK_FACTOR,
    NodeType.RISK_ASSESSMENT,
    NodeType.ESCALATION,
  ],
  brand: [NodeType.BRAND_SIGNAL, NodeType.BRAND_MENTION, NodeType.REPUTATION_SCORE],
  governance: [NodeType.COMPLIANCE_ITEM, NodeType.GOVERNANCE_POLICY, NodeType.AUDIT_FINDING],
  executive: [
    NodeType.EXECUTIVE_DIGEST,
    NodeType.BOARD_REPORT,
    NodeType.INVESTOR_UPDATE,
    NodeType.COMMAND_CENTER_ALERT,
  ],
  strategic: [
    NodeType.STRATEGIC_REPORT,
    NodeType.STRATEGIC_INSIGHT,
    NodeType.STRATEGIC_RECOMMENDATION,
  ],
  audience: [NodeType.AUDIENCE_PERSONA, NodeType.AUDIENCE_SEGMENT],
  content: [NodeType.CONTENT_BRIEF, NodeType.CONTENT_PIECE, NodeType.NARRATIVE],
  graph: [NodeType.CLUSTER, NodeType.TOPIC, NodeType.THEME, NodeType.EVENT, NodeType.CUSTOM],
};

/**
 * Edge type category groupings
 */
export const EDGE_TYPE_CATEGORIES: Record<string, EdgeType[]> = {
  hierarchical: [EdgeType.PARENT_OF, EdgeType.CHILD_OF, EdgeType.BELONGS_TO, EdgeType.CONTAINS],
  causal: [
    EdgeType.CAUSED_BY,
    EdgeType.LEADS_TO,
    EdgeType.TRIGGERS,
    EdgeType.MITIGATES,
    EdgeType.ESCALATES_TO,
  ],
  temporal: [EdgeType.PRECEDES, EdgeType.FOLLOWS, EdgeType.CONCURRENT_WITH, EdgeType.DURING],
  similarity: [
    EdgeType.SIMILAR_TO,
    EdgeType.RELATED_TO,
    EdgeType.CONTRASTS_WITH,
    EdgeType.COMPLEMENTS,
  ],
  attribution: [
    EdgeType.AUTHORED_BY,
    EdgeType.MENTIONS,
    EdgeType.REFERENCES,
    EdgeType.CITES,
    EdgeType.COVERS,
  ],
  influence: [
    EdgeType.INFLUENCES,
    EdgeType.IMPACTS,
    EdgeType.DERIVES_FROM,
    EdgeType.CONTRIBUTES_TO,
  ],
  association: [EdgeType.ASSOCIATED_WITH, EdgeType.LINKED_TO, EdgeType.CORRELATES_WITH],
  sentiment: [
    EdgeType.POSITIVE_SENTIMENT_TOWARD,
    EdgeType.NEGATIVE_SENTIMENT_TOWARD,
    EdgeType.NEUTRAL_SENTIMENT_TOWARD,
  ],
  strategic: [
    EdgeType.SUPPORTS_STRATEGY,
    EdgeType.THREATENS_STRATEGY,
    EdgeType.OPPORTUNITY_FOR,
    EdgeType.RISK_TO,
  ],
};

/**
 * Source system mappings to node types
 */
export const SOURCE_SYSTEM_NODE_TYPES: Record<string, NodeType[]> = {
  pr_generator: [NodeType.PRESS_RELEASE, NodeType.PITCH],
  media_monitoring: [NodeType.MEDIA_COVERAGE, NodeType.MEDIA_MENTION],
  media_alerts: [NodeType.MEDIA_ALERT],
  media_performance: [NodeType.PERFORMANCE_METRIC, NodeType.KPI_INDICATOR],
  competitive_intel: [NodeType.COMPETITOR, NodeType.COMPETITIVE_INSIGHT, NodeType.MARKET_TREND],
  crisis_engine: [NodeType.CRISIS_EVENT, NodeType.CRISIS_RESPONSE, NodeType.ESCALATION],
  risk_radar: [NodeType.RISK_FACTOR, NodeType.RISK_ASSESSMENT],
  brand_reputation: [NodeType.BRAND_SIGNAL, NodeType.BRAND_MENTION, NodeType.REPUTATION_SCORE],
  governance: [NodeType.COMPLIANCE_ITEM, NodeType.GOVERNANCE_POLICY, NodeType.AUDIT_FINDING],
  exec_digest: [NodeType.EXECUTIVE_DIGEST],
  board_reports: [NodeType.BOARD_REPORT],
  investor_relations: [NodeType.INVESTOR_UPDATE],
  command_center: [NodeType.COMMAND_CENTER_ALERT],
  strategic_intelligence: [
    NodeType.STRATEGIC_REPORT,
    NodeType.STRATEGIC_INSIGHT,
    NodeType.STRATEGIC_RECOMMENDATION,
  ],
  journalist_graph: [NodeType.JOURNALIST, NodeType.PUBLICATION],
  media_lists: [NodeType.MEDIA_LIST],
  outreach_engine: [NodeType.OUTREACH_CAMPAIGN],
  personas: [NodeType.AUDIENCE_PERSONA, NodeType.AUDIENCE_SEGMENT],
  content: [NodeType.CONTENT_BRIEF, NodeType.CONTENT_PIECE, NodeType.NARRATIVE],
};
