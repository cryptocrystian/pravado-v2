/**
 * Insight Conflict Resolution Types (Sprint S74)
 * Autonomous Insight Conflict Resolution Engine V1
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Types of conflicts detected across intelligence systems
 */
export type ConflictType =
  | 'contradiction'    // Direct opposing statements
  | 'divergence'       // Different conclusions from same data
  | 'ambiguity'        // Unclear or multiple interpretations
  | 'missing_data'     // Incomplete information causing gaps
  | 'inconsistency';   // Logical or factual inconsistencies

/**
 * Severity levels for conflicts
 */
export type ConflictSeverity =
  | 'low'        // Minor discrepancy, low impact
  | 'medium'     // Moderate conflict, should be addressed
  | 'high'       // Significant conflict, needs attention
  | 'critical';  // Urgent conflict, immediate resolution required

/**
 * Status of conflict resolution workflow
 */
export type ConflictStatus =
  | 'detected'   // Conflict identified
  | 'analyzing'  // Analysis in progress
  | 'resolved'   // Resolution completed
  | 'dismissed'; // Marked as not requiring resolution

/**
 * Types of resolution strategies
 */
export type ConflictResolutionType =
  | 'ai_consensus'     // AI synthesizes consensus from multiple sources
  | 'weighted_truth'   // Truth weighted by source reliability
  | 'source_priority'  // Higher priority source takes precedence
  | 'hybrid';          // Combination of multiple strategies

/**
 * Types of edges in conflict graph
 */
export type ConflictEdgeType =
  | 'related'      // General relationship
  | 'caused_by'    // Causal relationship
  | 'contradicts'  // Direct contradiction
  | 'supersedes';  // One conflict supersedes another

/**
 * Role of an item within a conflict
 */
export type ConflictItemRole =
  | 'primary'    // Main conflicting item
  | 'secondary'  // Secondary conflicting item
  | 'context';   // Provides context

/**
 * Actor types for audit log
 */
export type ConflictActorType =
  | 'user'    // Human user
  | 'system'  // Automated system
  | 'ai';     // AI agent

// ============================================================================
// LABEL MAPS
// ============================================================================

export const CONFLICT_TYPE_LABELS: Record<ConflictType, string> = {
  contradiction: 'Contradiction',
  divergence: 'Divergence',
  ambiguity: 'Ambiguity',
  missing_data: 'Missing Data',
  inconsistency: 'Inconsistency',
};

export const CONFLICT_TYPE_COLORS: Record<ConflictType, string> = {
  contradiction: 'red',
  divergence: 'orange',
  ambiguity: 'yellow',
  missing_data: 'blue',
  inconsistency: 'purple',
};

export const CONFLICT_SEVERITY_LABELS: Record<ConflictSeverity, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export const CONFLICT_SEVERITY_COLORS: Record<ConflictSeverity, string> = {
  low: 'green',
  medium: 'yellow',
  high: 'orange',
  critical: 'red',
};

export const CONFLICT_STATUS_LABELS: Record<ConflictStatus, string> = {
  detected: 'Detected',
  analyzing: 'Analyzing',
  resolved: 'Resolved',
  dismissed: 'Dismissed',
};

export const CONFLICT_STATUS_COLORS: Record<ConflictStatus, string> = {
  detected: 'blue',
  analyzing: 'yellow',
  resolved: 'green',
  dismissed: 'gray',
};

export const CONFLICT_RESOLUTION_TYPE_LABELS: Record<ConflictResolutionType, string> = {
  ai_consensus: 'AI Consensus',
  weighted_truth: 'Weighted Truth',
  source_priority: 'Source Priority',
  hybrid: 'Hybrid',
};

export const CONFLICT_RESOLUTION_TYPE_COLORS: Record<ConflictResolutionType, string> = {
  ai_consensus: 'indigo',
  weighted_truth: 'blue',
  source_priority: 'purple',
  hybrid: 'green',
};

export const CONFLICT_EDGE_TYPE_LABELS: Record<ConflictEdgeType, string> = {
  related: 'Related',
  caused_by: 'Caused By',
  contradicts: 'Contradicts',
  supersedes: 'Supersedes',
};

// ============================================================================
// ENTITY INTERFACES
// ============================================================================

/**
 * Source entity reference within a conflict
 */
export interface ConflictSourceEntity {
  entityType: string;
  entityId: string;
  sourceSystem: string;
  displayName?: string | null;
  url?: string | null;
}

/**
 * Insight Conflict Item
 * Individual insight that is part of a conflict
 */
export interface InsightConflictItem {
  id: string;
  conflictId: string;
  entityType: string;
  entityId: string;
  rawInsight: string;
  processedInsight?: string | null;
  vector?: number[] | null;
  sourceSystem: string;
  sourceTimestamp?: string | null;
  confidenceScore?: number | null;
  itemRole?: ConflictItemRole | null;
  createdAt: string;
}

/**
 * Recommended action from resolution
 */
export interface RecommendedAction {
  action: string;
  priority: 'low' | 'medium' | 'high';
  description?: string | null;
  targetSystem?: string | null;
  estimatedImpact?: string | null;
}

/**
 * Source weight for weighted truth resolution
 */
export interface SourceWeight {
  sourceSystem: string;
  weight: number;
  rationale?: string | null;
}

/**
 * Insight Conflict Resolution
 * AI-generated or human-approved resolution
 */
export interface InsightConflictResolution {
  id: string;
  conflictId: string;
  resolutionType: ConflictResolutionType;
  resolvedSummary: string;
  consensusNarrative?: string | null;
  recommendedActions: RecommendedAction[];
  resolutionConfidence?: number | null;
  resolutionRationale?: string | null;
  sourceWeights?: SourceWeight[] | null;
  priorityOrder?: string[] | null;
  aiModelUsed?: string | null;
  aiPromptTokens?: number | null;
  aiCompletionTokens?: number | null;
  humanReviewed: boolean;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
  isAccepted: boolean;
  acceptedAt?: string | null;
  acceptedBy?: string | null;
  createdAt: string;
}

/**
 * Analysis result from conflict analysis
 */
export interface ConflictAnalysisResult {
  conflictId: string;
  severityScore: number;
  severityRationale: string;
  rootCauses: RootCause[];
  relatedConflicts: RelatedConflict[];
  suggestedResolutionType: ConflictResolutionType;
  estimatedResolutionDifficulty: 'easy' | 'moderate' | 'difficult';
  affectedSystemsAnalysis: AffectedSystemAnalysis[];
  vectorSimilarities: VectorSimilarity[];
}

/**
 * Root cause identified in analysis
 */
export interface RootCause {
  cause: string;
  confidence: number;
  sourceSystem?: string | null;
  evidence?: string | null;
}

/**
 * Related conflict reference
 */
export interface RelatedConflict {
  conflictId: string;
  edgeType: ConflictEdgeType;
  similarity: number;
}

/**
 * Analysis of an affected system
 */
export interface AffectedSystemAnalysis {
  system: string;
  impactLevel: 'low' | 'medium' | 'high';
  description: string;
}

/**
 * Vector similarity between conflict items
 */
export interface VectorSimilarity {
  itemAId: string;
  itemBId: string;
  similarity: number;
}

/**
 * Insight Conflict Audit Log Entry
 */
export interface InsightConflictAuditLog {
  id: string;
  conflictId: string;
  eventType: string;
  actorId?: string | null;
  actorType: ConflictActorType;
  eventDetails: Record<string, unknown>;
  previousState?: Record<string, unknown> | null;
  newState?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

/**
 * Insight Conflict Cluster
 */
export interface InsightConflictCluster {
  id: string;
  orgId: string;
  name: string;
  description?: string | null;
  primaryConflictType?: ConflictType | null;
  averageSeverity?: ConflictSeverity | null;
  conflictCount: number;
  centroidVector?: number[] | null;
  isAutoGenerated: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Main Insight Conflict entity
 */
export interface InsightConflict {
  id: string;
  orgId: string;
  conflictType: ConflictType;
  severity: ConflictSeverity;
  status: ConflictStatus;
  title: string;
  conflictSummary?: string | null;
  sourceEntities: ConflictSourceEntity[];
  affectedSystems: string[];
  analysisStartedAt?: string | null;
  analysisCompletedAt?: string | null;
  analysisResult?: ConflictAnalysisResult | null;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
  conflictGraph?: ConflictGraphData | null;
  clusterId?: string | null;
  clusterSimilarity?: number | null;
  rootCauseAnalysis?: RootCauseAnalysisResult | null;
  linkedRealityMapId?: string | null;
  linkedNodeIds?: string[] | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;

  // Joined data (optional)
  items?: InsightConflictItem[];
  resolutions?: InsightConflictResolution[];
  cluster?: InsightConflictCluster | null;
}

// ============================================================================
// ROOT CAUSE ANALYSIS
// ============================================================================

/**
 * Full root cause analysis result
 */
export interface RootCauseAnalysisResult {
  primaryCause: RootCause;
  contributingCauses: RootCause[];
  timeline?: CauseTimelineEvent[] | null;
  recommendations: string[];
  confidence: number;
}

/**
 * Timeline event in cause analysis
 */
export interface CauseTimelineEvent {
  timestamp: string;
  event: string;
  system: string;
  significance: 'low' | 'medium' | 'high';
}

// ============================================================================
// GRAPH DATA STRUCTURES
// ============================================================================

/**
 * Node in conflict graph
 */
export interface ConflictGraphNode {
  id: string;
  type: 'conflict' | 'item' | 'source' | 'resolution';
  label: string;
  data: {
    conflictType?: ConflictType;
    severity?: ConflictSeverity;
    status?: ConflictStatus;
    sourceSystem?: string;
    confidence?: number;
    resolutionType?: ConflictResolutionType;
  };
  position?: { x: number; y: number };
  size?: number;
  color?: string;
}

/**
 * Edge in conflict graph
 */
export interface ConflictGraphEdge {
  id: string;
  source: string;
  target: string;
  type: ConflictEdgeType | 'contains' | 'resolved_by';
  label?: string | null;
  weight?: number;
  color?: string;
}

/**
 * Complete conflict graph data
 */
export interface ConflictGraphData {
  nodes: ConflictGraphNode[];
  edges: ConflictGraphEdge[];
  metadata: ConflictGraphMetadata;
}

/**
 * Graph metadata
 */
export interface ConflictGraphMetadata {
  totalNodes: number;
  totalEdges: number;
  conflictCount: number;
  itemCount: number;
  resolutionCount: number;
  generatedAt: string;
}

// ============================================================================
// GRAPH EDGE ENTITY
// ============================================================================

/**
 * Stored graph edge between conflicts
 */
export interface InsightConflictGraphEdge {
  id: string;
  orgId: string;
  sourceConflictId: string;
  targetConflictId: string;
  edgeType: ConflictEdgeType;
  edgeWeight: number;
  edgeLabel?: string | null;
  edgeMetadata?: Record<string, unknown> | null;
  createdAt: string;
}

// ============================================================================
// INPUT TYPES
// ============================================================================

/**
 * Input for creating a new conflict
 */
export interface CreateConflictInput {
  conflictType: ConflictType;
  title: string;
  conflictSummary?: string | null;
  severity?: ConflictSeverity | null;
  sourceEntities?: ConflictSourceEntity[] | null;
  affectedSystems?: string[] | null;
  items?: CreateConflictItemInput[] | null;
}

/**
 * Input for creating a conflict item
 */
export interface CreateConflictItemInput {
  entityType: string;
  entityId: string;
  rawInsight: string;
  processedInsight?: string | null;
  sourceSystem: string;
  sourceTimestamp?: string | null;
  confidenceScore?: number | null;
  itemRole?: ConflictItemRole | null;
}

/**
 * Input for updating a conflict
 */
export interface UpdateConflictInput {
  title?: string | null;
  conflictSummary?: string | null;
  severity?: ConflictSeverity | null;
  status?: ConflictStatus | null;
  affectedSystems?: string[] | null;
  clusterId?: string | null;
  linkedRealityMapId?: string | null;
  linkedNodeIds?: string[] | null;
}

/**
 * Input for analyzing a conflict
 */
export interface AnalyzeConflictInput {
  includeRelatedConflicts?: boolean | null;
  includeVectorAnalysis?: boolean | null;
  includeRootCauseAnalysis?: boolean | null;
  maxRelatedConflicts?: number | null;
}

/**
 * Input for resolving a conflict
 */
export interface ResolveConflictInput {
  resolutionType: ConflictResolutionType;
  sourceWeights?: SourceWeight[] | null;
  priorityOrder?: string[] | null;
  customPrompt?: string | null;
  autoAccept?: boolean | null;
}

/**
 * Input for reviewing a resolution
 */
export interface ReviewResolutionInput {
  isAccepted: boolean;
  reviewNotes?: string | null;
}

/**
 * Input for creating a cluster
 */
export interface CreateClusterInput {
  name: string;
  description?: string | null;
  conflictIds?: string[] | null;
}

/**
 * Input for adding a graph edge
 */
export interface CreateGraphEdgeInput {
  sourceConflictId: string;
  targetConflictId: string;
  edgeType: ConflictEdgeType;
  edgeWeight?: number | null;
  edgeLabel?: string | null;
}

// ============================================================================
// QUERY TYPES
// ============================================================================

/**
 * Query parameters for listing conflicts
 */
export interface ListConflictsQuery {
  search?: string | null;
  conflictType?: ConflictType | null;
  severity?: ConflictSeverity | null;
  status?: ConflictStatus | null;
  affectedSystem?: string | null;
  clusterId?: string | null;
  hasResolution?: boolean | null;
  fromDate?: string | null;
  toDate?: string | null;
  sortBy?: 'created_at' | 'updated_at' | 'severity' | 'status' | null;
  sortOrder?: 'asc' | 'desc' | null;
  limit?: number | null;
  offset?: number | null;
}

/**
 * Query parameters for listing items
 */
export interface ListConflictItemsQuery {
  conflictId: string;
  sourceSystem?: string | null;
  itemRole?: ConflictItemRole | null;
  limit?: number | null;
  offset?: number | null;
}

/**
 * Query parameters for listing resolutions
 */
export interface ListResolutionsQuery {
  conflictId: string;
  resolutionType?: ConflictResolutionType | null;
  isAccepted?: boolean | null;
  limit?: number | null;
  offset?: number | null;
}

/**
 * Query parameters for listing audit log
 */
export interface ListAuditLogQuery {
  conflictId: string;
  eventType?: string | null;
  actorId?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  limit?: number | null;
  offset?: number | null;
}

/**
 * Query parameters for listing clusters
 */
export interface ListClustersQuery {
  isActive?: boolean | null;
  primaryConflictType?: ConflictType | null;
  limit?: number | null;
  offset?: number | null;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

/**
 * Response for listing conflicts
 */
export interface ListConflictsResponse {
  conflicts: InsightConflict[];
  total: number;
  hasMore: boolean;
}

/**
 * Response for getting a single conflict
 */
export interface GetConflictResponse {
  conflict: InsightConflict;
  items: InsightConflictItem[];
  resolutions: InsightConflictResolution[];
  relatedConflicts: InsightConflict[];
}

/**
 * Response for creating a conflict
 */
export interface CreateConflictResponse {
  conflict: InsightConflict;
}

/**
 * Response for updating a conflict
 */
export interface UpdateConflictResponse {
  conflict: InsightConflict;
}

/**
 * Response for analyzing a conflict
 */
export interface AnalyzeConflictResponse {
  conflict: InsightConflict;
  analysis: ConflictAnalysisResult;
}

/**
 * Response for resolving a conflict
 */
export interface ResolveConflictResponse {
  conflict: InsightConflict;
  resolution: InsightConflictResolution;
}

/**
 * Response for getting conflict graph
 */
export interface GetConflictGraphResponse {
  graph: ConflictGraphData;
}

/**
 * Response for listing items
 */
export interface ListConflictItemsResponse {
  items: InsightConflictItem[];
  total: number;
  hasMore: boolean;
}

/**
 * Response for listing resolutions
 */
export interface ListResolutionsResponse {
  resolutions: InsightConflictResolution[];
  total: number;
  hasMore: boolean;
}

/**
 * Response for listing audit log
 */
export interface ListAuditLogResponse {
  events: InsightConflictAuditLog[];
  total: number;
  hasMore: boolean;
}

/**
 * Response for listing clusters
 */
export interface ListClustersResponse {
  clusters: InsightConflictCluster[];
  total: number;
  hasMore: boolean;
}

/**
 * Response for global conflict stats
 */
export interface GetConflictStatsResponse {
  stats: ConflictStats;
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Conflict statistics for an organization
 */
export interface ConflictStats {
  totalConflicts: number;
  detectedCount: number;
  analyzingCount: number;
  resolvedCount: number;
  dismissedCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  contradictionCount: number;
  divergenceCount: number;
  ambiguityCount: number;
  missingDataCount: number;
  inconsistencyCount: number;
  averageResolutionTime?: number | null;
  resolutionRate?: number | null;
  clusterCount: number;
}

/**
 * Conflict trend data point
 */
export interface ConflictTrendPoint {
  date: string;
  detected: number;
  resolved: number;
  dismissed: number;
}

/**
 * Conflict trends over time
 */
export interface ConflictTrends {
  daily: ConflictTrendPoint[];
  weekly: ConflictTrendPoint[];
  monthly: ConflictTrendPoint[];
}

// ============================================================================
// DETECTION TYPES
// ============================================================================

/**
 * Detection configuration
 */
export interface DetectionConfig {
  enableContradictionDetection?: boolean | null;
  enableDivergenceDetection?: boolean | null;
  enableAmbiguityDetection?: boolean | null;
  enableMissingDataDetection?: boolean | null;
  enableInconsistencyDetection?: boolean | null;
  contradictionThreshold?: number | null;
  divergenceThreshold?: number | null;
  ambiguityThreshold?: number | null;
  minConfidenceScore?: number | null;
  maxBatchSize?: number | null;
}

/**
 * Detection result
 */
export interface DetectionResult {
  conflictsDetected: number;
  conflicts: InsightConflict[];
  processingTime: number;
  sourcesScanned: number;
  errors: DetectionError[];
}

/**
 * Detection error
 */
export interface DetectionError {
  source: string;
  error: string;
  timestamp: string;
}

/**
 * Input for running detection
 */
export interface RunDetectionInput {
  config?: DetectionConfig | null;
  targetSystems?: string[] | null;
  timeRange?: {
    from: string;
    to: string;
  } | null;
}

/**
 * Response for detection run
 */
export interface RunDetectionResponse {
  result: DetectionResult;
}

// ============================================================================
// RESOLUTION RESULT
// ============================================================================

/**
 * Complete resolution result
 */
export interface ConflictResolutionResult {
  resolution: InsightConflictResolution;
  conflictUpdated: InsightConflict;
  auditLogEntryId: string;
  processingTime: number;
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Input for batch analyzing conflicts
 */
export interface BatchAnalyzeInput {
  conflictIds: string[];
  options?: AnalyzeConflictInput | null;
}

/**
 * Response for batch analysis
 */
export interface BatchAnalyzeResponse {
  results: {
    conflictId: string;
    success: boolean;
    analysis?: ConflictAnalysisResult | null;
    error?: string | null;
  }[];
  totalProcessed: number;
  successCount: number;
  errorCount: number;
}

/**
 * Input for batch resolving conflicts
 */
export interface BatchResolveInput {
  conflictIds: string[];
  resolutionType: ConflictResolutionType;
  options?: Omit<ResolveConflictInput, 'resolutionType'> | null;
}

/**
 * Response for batch resolution
 */
export interface BatchResolveResponse {
  results: {
    conflictId: string;
    success: boolean;
    resolution?: InsightConflictResolution | null;
    error?: string | null;
  }[];
  totalProcessed: number;
  successCount: number;
  errorCount: number;
}

/**
 * Input for batch dismissing conflicts
 */
export interface BatchDismissInput {
  conflictIds: string[];
  reason?: string | null;
}

/**
 * Response for batch dismissal
 */
export interface BatchDismissResponse {
  results: {
    conflictId: string;
    success: boolean;
    error?: string | null;
  }[];
  totalProcessed: number;
  successCount: number;
  errorCount: number;
}

// ============================================================================
// INTEGRATION TYPES
// ============================================================================

/**
 * Reality map node linkage
 */
export interface RealityMapLinkage {
  realityMapId: string;
  nodeIds: string[];
  linkType: 'source' | 'affected' | 'related';
}

/**
 * Unified graph entity reference
 */
export interface UnifiedGraphEntityRef {
  entityType: string;
  entityId: string;
  graphNodeId?: string | null;
}

/**
 * Cross-system correlation
 */
export interface CrossSystemCorrelation {
  systemA: string;
  systemB: string;
  correlationType: 'positive' | 'negative' | 'neutral';
  correlationStrength: number;
  description?: string | null;
}

// ============================================================================
// AI/LLM TYPES
// ============================================================================

/**
 * LLM prompt template for conflict resolution
 */
export interface ConflictPromptTemplate {
  name: string;
  template: string;
  variables: string[];
  resolutionType: ConflictResolutionType;
}

/**
 * LLM response for conflict analysis
 */
export interface LLMConflictAnalysis {
  summary: string;
  rootCauses: RootCause[];
  suggestedResolutionType: ConflictResolutionType;
  confidence: number;
  reasoning: string;
}

/**
 * LLM response for conflict resolution
 */
export interface LLMConflictResolution {
  resolvedSummary: string;
  consensusNarrative: string;
  recommendedActions: RecommendedAction[];
  confidence: number;
  rationale: string;
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

/**
 * Conflict notification
 */
export interface ConflictNotification {
  id: string;
  conflictId: string;
  notificationType: 'new_conflict' | 'severity_escalation' | 'resolution_available' | 'action_required';
  title: string;
  message: string;
  severity: ConflictSeverity;
  createdAt: string;
  readAt?: string | null;
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

/**
 * Export format options
 */
export type ConflictExportFormat = 'json' | 'csv' | 'pdf';

/**
 * Export configuration
 */
export interface ConflictExportConfig {
  format: ConflictExportFormat;
  includeItems?: boolean | null;
  includeResolutions?: boolean | null;
  includeAuditLog?: boolean | null;
  dateRange?: {
    from: string;
    to: string;
  } | null;
}

/**
 * Export result
 */
export interface ConflictExportResult {
  exportId: string;
  format: ConflictExportFormat;
  url?: string | null;
  expiresAt?: string | null;
  conflictCount: number;
  generatedAt: string;
}
