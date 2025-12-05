/**
 * Scenario Reality Map Types (Sprint S73)
 * AI-Driven Multi-Outcome "Reality Maps" Engine
 * Branching tree of possible futures from multi-scenario suites
 */

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

/**
 * Reality map status
 */
export type RealityMapStatus =
  | 'draft'
  | 'generating'
  | 'analyzing'
  | 'completed'
  | 'failed';

/**
 * Reality map node type
 */
export type RealityMapNodeType =
  | 'root'
  | 'branch'
  | 'leaf'
  | 'terminal';

/**
 * Reality map analysis status
 */
export type RealityMapAnalysisStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed';

/**
 * Probability model types
 */
export type ProbabilityModelType =
  | 'weighted_average'
  | 'monte_carlo'
  | 'bayesian'
  | 'expert_adjusted';

/**
 * Narrative style options
 */
export type NarrativeStyle =
  | 'executive'
  | 'detailed'
  | 'technical'
  | 'strategic';

/**
 * Path outcome types
 */
export type PathOutcomeType =
  | 'best_case'
  | 'worst_case'
  | 'most_likely'
  | 'high_risk'
  | 'high_opportunity'
  | 'balanced';

/**
 * Edge trigger types
 */
export type EdgeTriggerType =
  | 'simulation_outcome'
  | 'risk_escalation'
  | 'opportunity'
  | 'time_based'
  | 'external_event'
  | 'decision_point'
  | 'condition_met';

/**
 * Comparison types
 */
export type ComparisonType =
  | 'maps'
  | 'paths'
  | 'nodes';

/**
 * Audit event types for reality maps
 */
export type RealityMapAuditEventType =
  | 'map_created'
  | 'map_updated'
  | 'generation_started'
  | 'generation_completed'
  | 'generation_failed'
  | 'analysis_started'
  | 'analysis_completed'
  | 'node_created'
  | 'node_updated'
  | 'path_computed'
  | 'comparison_created'
  | 'map_exported'
  | 'map_shared';

// ============================================================================
// LABEL MAPS
// ============================================================================

/**
 * Status labels for UI display
 */
export const REALITY_MAP_STATUS_LABELS: Record<RealityMapStatus, string> = {
  draft: 'Draft',
  generating: 'Generating',
  analyzing: 'Analyzing',
  completed: 'Completed',
  failed: 'Failed',
};

/**
 * Status colors for UI styling
 */
export const REALITY_MAP_STATUS_COLORS: Record<RealityMapStatus, string> = {
  draft: 'gray',
  generating: 'blue',
  analyzing: 'yellow',
  completed: 'green',
  failed: 'red',
};

/**
 * Node type labels
 */
export const REALITY_MAP_NODE_TYPE_LABELS: Record<RealityMapNodeType, string> = {
  root: 'Starting Point',
  branch: 'Branch Point',
  leaf: 'Outcome',
  terminal: 'Terminal',
};

/**
 * Node type colors
 */
export const REALITY_MAP_NODE_TYPE_COLORS: Record<RealityMapNodeType, string> = {
  root: 'indigo',
  branch: 'blue',
  leaf: 'green',
  terminal: 'gray',
};

/**
 * Analysis status labels
 */
export const REALITY_MAP_ANALYSIS_STATUS_LABELS: Record<RealityMapAnalysisStatus, string> = {
  pending: 'Pending',
  running: 'Running',
  completed: 'Completed',
  failed: 'Failed',
};

/**
 * Probability model labels
 */
export const PROBABILITY_MODEL_LABELS: Record<ProbabilityModelType, string> = {
  weighted_average: 'Weighted Average',
  monte_carlo: 'Monte Carlo Simulation',
  bayesian: 'Bayesian Inference',
  expert_adjusted: 'Expert-Adjusted',
};

/**
 * Narrative style labels
 */
export const NARRATIVE_STYLE_LABELS: Record<NarrativeStyle, string> = {
  executive: 'Executive Summary',
  detailed: 'Detailed Analysis',
  technical: 'Technical Report',
  strategic: 'Strategic Overview',
};

/**
 * Path outcome type labels
 */
export const PATH_OUTCOME_TYPE_LABELS: Record<PathOutcomeType, string> = {
  best_case: 'Best Case',
  worst_case: 'Worst Case',
  most_likely: 'Most Likely',
  high_risk: 'High Risk',
  high_opportunity: 'High Opportunity',
  balanced: 'Balanced',
};

/**
 * Path outcome type colors
 */
export const PATH_OUTCOME_TYPE_COLORS: Record<PathOutcomeType, string> = {
  best_case: 'green',
  worst_case: 'red',
  most_likely: 'blue',
  high_risk: 'orange',
  high_opportunity: 'purple',
  balanced: 'gray',
};

/**
 * Edge trigger type labels
 */
export const EDGE_TRIGGER_TYPE_LABELS: Record<EdgeTriggerType, string> = {
  simulation_outcome: 'Simulation Outcome',
  risk_escalation: 'Risk Escalation',
  opportunity: 'Opportunity Detected',
  time_based: 'Time-Based',
  external_event: 'External Event',
  decision_point: 'Decision Point',
  condition_met: 'Condition Met',
};

// ============================================================================
// CORE ENTITY INTERFACES
// ============================================================================

/**
 * Generation parameters for reality maps
 */
export interface RealityMapParameters {
  maxDepth: number;
  branchingFactor: number;
  minProbability: number;
  includeRiskAnalysis: boolean;
  includeOpportunityAnalysis: boolean;
  narrativeStyle: NarrativeStyle;
  probabilityModel: ProbabilityModelType;
  simulationIds?: string[];
  suiteRunIds?: string[];
  customWeights?: Record<string, number>;
  contextualFactors?: string[];
  timeHorizon?: string;
  focusAreas?: string[];
}

/**
 * Default generation parameters
 */
export const DEFAULT_REALITY_MAP_PARAMETERS: RealityMapParameters = {
  maxDepth: 5,
  branchingFactor: 3,
  minProbability: 0.05,
  includeRiskAnalysis: true,
  includeOpportunityAnalysis: true,
  narrativeStyle: 'executive',
  probabilityModel: 'weighted_average',
};

/**
 * Main Reality Map entity
 */
export interface RealityMap {
  id: string;
  orgId: string;
  suiteId: string | null;
  name: string;
  description: string | null;
  status: RealityMapStatus;
  parameters: RealityMapParameters;

  // Generation metadata
  generationStartedAt: string | null;
  generationCompletedAt: string | null;
  totalNodes: number;
  totalEdges: number;
  totalPaths: number;
  maxDepthReached: number;

  // Analysis results
  analysisStatus: RealityMapAnalysisStatus;
  executiveSummary: string | null;
  topRisks: RealityMapRiskFactor[] | null;
  topOpportunities: OpportunityFactor[] | null;
  keyDecisionPoints: DecisionPoint[] | null;

  // Error handling
  errorMessage: string | null;
  errorDetails: Record<string, unknown> | null;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
}

/**
 * Key driver for a node outcome
 */
export interface KeyDriver {
  id: string;
  name: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  direction: 'positive' | 'negative' | 'neutral';
  source: string;
  confidence: number;
}

/**
 * Reality Map Risk factor
 */
export interface RealityMapRiskFactor {
  id: string;
  category: string;
  name: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  likelihood: number;
  impact: number;
  score: number;
  mitigation: string | null;
  affectedNodes: string[];
}

/**
 * Opportunity factor
 */
export interface OpportunityFactor {
  id: string;
  category: string;
  name: string;
  description: string;
  potential: 'high' | 'medium' | 'low';
  likelihood: number;
  impact: number;
  score: number;
  actionRequired: string | null;
  affectedNodes: string[];
}

/**
 * Decision point in the map
 */
export interface DecisionPoint {
  nodeId: string;
  description: string;
  options: DecisionOption[];
  recommendedOption: string | null;
  urgency: 'immediate' | 'short_term' | 'long_term';
  stakeholders: string[];
}

/**
 * Decision option at a decision point
 */
export interface DecisionOption {
  id: string;
  label: string;
  description: string;
  expectedOutcome: string;
  riskLevel: 'high' | 'medium' | 'low';
  opportunityLevel: 'high' | 'medium' | 'low';
  childNodeId: string | null;
}

/**
 * Mitigation strategy
 */
export interface MitigationStrategy {
  id: string;
  riskId: string;
  strategy: string;
  effectiveness: 'high' | 'medium' | 'low';
  cost: 'high' | 'medium' | 'low';
  timeframe: string;
  owner: string | null;
}

/**
 * Reality Map Action recommendation
 */
export interface RealityMapActionRecommendation {
  id: string;
  action: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  expectedImpact: string;
  timeframe: string;
  resources: string[];
  dependencies: string[];
}

/**
 * Node snapshot - state captured at this point
 */
export interface NodeSnapshot {
  simulationState?: Record<string, unknown>;
  riskRadarState?: Record<string, unknown>;
  reputationState?: Record<string, unknown>;
  marketConditions?: Record<string, unknown>;
  stakeholderSentiment?: Record<string, unknown>;
  mediaLandscape?: Record<string, unknown>;
  competitorActivity?: Record<string, unknown>;
  customData?: Record<string, unknown>;
}

/**
 * Reality Map Node entity
 */
export interface RealityMapNode {
  id: string;
  realityMapId: string;
  parentNodeId: string | null;
  // Alias for dashboard compatibility
  parentId?: string | null;
  childIds?: string[];

  // Node identification
  nodeType: RealityMapNodeType;
  depth: number;
  pathIndex: string | null;
  label: string | null;

  // Probability and scoring
  probability: number;
  cumulativeProbability: number;
  riskScore: number;
  opportunityScore: number;
  confidenceScore: number;

  // AI-generated content
  aiSummary: string | null;
  narrativeDelta: string | null;
  keyDrivers: KeyDriver[];
  expectedTimeline: string | null;

  // Simulation linkage
  simulationId: string | null;
  simulationRunId: string | null;
  suiteItemId: string | null;

  // Snapshot
  snapshot: NodeSnapshot;

  // Risk/opportunity details
  riskFactors: RealityMapRiskFactor[];
  opportunityFactors: OpportunityFactor[];
  mitigationStrategies: MitigationStrategy[];
  actionRecommendations: RealityMapActionRecommendation[];

  // Metadata
  generationOrder: number | null;
  processingTimeMs: number | null;
  tokensUsed: number;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Edge trigger definition
 */
export interface EdgeTrigger {
  type: EdgeTriggerType;
  condition: string;
  sourceData?: Record<string, unknown>;
  threshold?: number;
  operator?: '>' | '>=' | '<' | '<=' | '==' | '!=';
  value?: unknown;
}

/**
 * Reality Map Edge entity
 */
export interface RealityMapEdge {
  id: string;
  realityMapId: string;
  parentNodeId: string;
  childNodeId: string;

  // Edge properties
  trigger: EdgeTrigger;
  triggerType: EdgeTriggerType | null;
  transitionProbability: number;

  // Edge metadata
  label: string | null;
  description: string | null;
  weight: number;

  // Timestamps
  createdAt: string;
}

/**
 * Path comparison metrics
 */
export interface PathComparisonMetrics {
  probabilityDelta: number;
  riskDelta: number;
  opportunityDelta: number;
  commonNodes: string[];
  divergencePoint: string | null;
  narrativeComparison: string | null;
}

/**
 * Reality Map Path entity
 */
export interface RealityMapPath {
  id: string;
  realityMapId: string;

  // Path definition
  pathNodes: string[];
  pathIndex: string | null;
  depth: number;

  // Path metrics
  totalProbability: number;
  avgRiskScore: number;
  avgOpportunityScore: number;
  maxRiskScore: number;
  maxOpportunityScore: number;

  // Path narrative
  pathSummary: string | null;
  pathTitle: string | null;
  outcomeType: PathOutcomeType | null;

  // Dashboard-expected properties (widened)
  keyDrivers?: Array<{ name: string; impact: string; description?: string; direction?: string }>;
  aiSummary?: string | null;

  // Comparison data
  comparisonMetrics: PathComparisonMetrics | null;

  // Timestamps
  createdAt: string;
}

/**
 * Reality Map Audit Log entry
 */
export interface RealityMapAuditLog {
  id: string;
  realityMapId: string;
  nodeId: string | null;
  eventType: RealityMapAuditEventType;
  actorId: string | null;
  details: Record<string, unknown>;
  createdAt: string;
}

/**
 * Reality Map Comparison entity
 */
export interface RealityMapComparison {
  id: string;
  orgId: string;
  realityMapIds: string[];
  pathIds: string[] | null;
  comparisonType: ComparisonType;
  comparisonResult: ComparisonResult;
  narrativeComparison: string | null;
  riskComparison: RiskComparisonResult | null;
  opportunityComparison: OpportunityComparisonResult | null;
  createdBy: string | null;
  createdAt: string;
}

/**
 * Comparison result structure
 */
export interface ComparisonResult {
  summary: string;
  similarities: string[];
  differences: string[];
  recommendations: string[];
  winningPath?: string;
  winningMap?: string;
  confidence: number;
}

/**
 * Risk comparison result
 */
export interface RiskComparisonResult {
  highestRiskPath: string;
  lowestRiskPath: string;
  riskDelta: number;
  commonRisks: RealityMapRiskFactor[];
  uniqueRisks: Record<string, RealityMapRiskFactor[]>;
}

/**
 * Opportunity comparison result
 */
export interface OpportunityComparisonResult {
  highestOpportunityPath: string;
  lowestOpportunityPath: string;
  opportunityDelta: number;
  commonOpportunities: OpportunityFactor[];
  uniqueOpportunities: Record<string, OpportunityFactor[]>;
}

// ============================================================================
// GRAPH RESPONSE TYPES
// ============================================================================

/**
 * Graph data for visualization
 */
export interface RealityMapGraphData {
  nodes: RealityMapGraphNode[];
  edges: RealityMapGraphEdge[];
  paths: RealityMapPath[];
  metadata: GraphMetadata;
}

/**
 * Reality Map Graph node for visualization
 */
export interface RealityMapGraphNode {
  id: string;
  label: string;
  type: RealityMapNodeType;
  depth: number;
  probability: number;
  cumulativeProbability: number;
  riskScore: number;
  opportunityScore: number;
  summary: string | null;
  parentId: string | null;
  childIds: string[];
  position?: { x: number; y: number };
  color?: string;
  size?: number;
}

/**
 * Reality Map Graph edge for visualization
 */
export interface RealityMapGraphEdge {
  id: string;
  source: string;
  target: string;
  label: string | null;
  probability: number;
  triggerType: EdgeTriggerType | null;
  weight: number;
  color?: string;
  animated?: boolean;
}

/**
 * Graph path for visualization (simplified path representation)
 */
export interface RealityGraphPath {
  id: string;
  label: string | null;
  description: string | null;
  outcomeType: PathOutcomeType | null;
  cumulativeProbability: number;
  riskScore: number;
  opportunityScore: number;
  pathNodes: string[];
  keyDrivers?: Array<{ name: string; impact: string; description?: string; direction?: string }>;
  aiSummary?: string | null;
  // Legacy path properties for compatibility
  startNodeId?: string;
  endNodeId?: string;
  path?: string[];
  pathLength?: number;
  weight?: number;
  totalProbability?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Graph metadata
 */
export interface GraphMetadata {
  totalNodes: number;
  totalEdges: number;
  totalPaths: number;
  maxDepth: number;
  rootNodeId: string | null;
  leafNodeIds: string[];
  mostLikelyPathId: string | null;
  highestRiskPathId: string | null;
  highestOpportunityPathId: string | null;
  generationTime: number | null;
}

// ============================================================================
// ANALYSIS RESPONSE TYPES
// ============================================================================

/**
 * Probability distribution
 */
export interface ProbabilityDistribution {
  pathId: string;
  probability: number;
  cumulativeProbability: number;
  percentile: number;
  outcomeType: PathOutcomeType;
}

/**
 * Node narrative for display
 */
export interface NodeNarrative {
  nodeId: string;
  summary: string;
  deltaFromParent: string | null;
  keyTakeaways: string[];
  recommendations: string[];
  warnings: string[];
}

/**
 * Path summary for display
 */
export interface RealityPathSummary {
  pathId: string;
  title: string;
  description: string;
  probability: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  opportunityLevel: 'high' | 'medium' | 'low';
  nodeCount: number;
  keyEvents: string[];
  finalOutcome: string;
  recommendedActions: string[];
}

/**
 * Contradiction detected in analysis
 */
export interface DetectedContradiction {
  id: string;
  type: 'logical' | 'probabilistic' | 'temporal' | 'causal';
  description: string;
  affectedNodes: string[];
  severity: 'high' | 'medium' | 'low';
  resolution: string | null;
}

/**
 * Correlation detected in analysis
 */
export interface DetectedCorrelation {
  id: string;
  type: 'positive' | 'negative';
  strength: number;
  factor1: string;
  factor2: string;
  description: string;
  affectedPaths: string[];
  confidence: number;
}

/**
 * Outcome universe - aggregated analysis
 */
export interface OutcomeUniverse {
  totalRealities: number;
  totalBranchingNodes: number;
  probabilityWeightedOutcomes: ProbabilityDistribution[];
  executiveSummary: string;
  bestCaseScenario: RealityPathSummary | null;
  worstCaseScenario: RealityPathSummary | null;
  mostLikelyScenario: RealityPathSummary | null;
  riskHeatmap: Record<string, number>;
  opportunityHeatmap: Record<string, number>;
  timelineProjection: TimelineProjection[];
  // Dashboard-expected properties (widened)
  totalOutcomes?: number;
  positiveOutcomes?: number;
  negativeOutcomes?: number;
  outcomeDistribution?: Record<string, number>;
  riskSummary?: { level: string; score: number; averageScore?: number; maxScore?: number; factors: string[] };
  opportunitySummary?: { level: string; score: number; averageScore?: number; maxScore?: number; factors: string[] };
  topDrivers?: Array<{ name: string; impact: string; description: string; direction?: string }>;
}

/**
 * Timeline projection point
 */
export interface TimelineProjection {
  timestamp: string;
  label: string;
  probabilityRange: { min: number; max: number };
  riskRange: { min: number; max: number };
  keyEvents: string[];
}

/**
 * Full analysis response
 */
export interface RealityMapAnalysisResponse {
  mapId: string;
  analysisTimestamp: string;
  outcomeUniverse: OutcomeUniverse;
  pathComparisons: PathComparisonResult[];
  narrativeDelta: NarrativeDeltaResult;
  contradictions: DetectedContradiction[];
  correlations: DetectedCorrelation[];
  recommendations: RealityMapActionRecommendation[];
  confidence: number;
  // Dashboard-expected properties (widened)
  aggregatedRisks: RealityMapRiskFactor[];
  aggregatedOpportunities: OpportunityFactor[];
}

/**
 * Path comparison result
 */
export interface PathComparisonResult {
  id?: string;
  path1Id: string;
  path2Id: string;
  pathAId?: string;
  pathBId?: string;
  similarities: string[];
  differences: string[];
  probabilityDelta: number;
  riskDelta: number;
  opportunityDelta: number;
  recommendation: string;
  divergencePoint?: string | null;
  divergenceFactors?: Array<{ name: string; impact: string }>;
  narrativeDelta?: string | null;
}

/**
 * Narrative delta result
 */
export interface NarrativeDeltaResult {
  overallDelta: string;
  nodeDeltas: Record<string, string>;
  emergingThemes: string[];
  fadingThemes: string[];
  pivotPoints: string[];
}

// ============================================================================
// INPUT TYPES
// ============================================================================

/**
 * Create reality map input
 */
export interface CreateRealityMapInput {
  name: string;
  description?: string;
  suiteId?: string;
  parameters?: Partial<RealityMapParameters>;
}

/**
 * Update reality map input
 */
export interface UpdateRealityMapInput {
  name?: string;
  description?: string;
  parameters?: Partial<RealityMapParameters>;
}

/**
 * Generate reality map input
 */
export interface GenerateRealityMapInput {
  parameters?: Partial<RealityMapParameters>;
  sourceType?: 'suite' | 'simulations' | 'manual';
  simulationIds?: string[];
  suiteRunIds?: string[];
  seedData?: Record<string, unknown>;
  regenerate?: boolean;
}

/**
 * Create node input (for manual node creation)
 */
export interface CreateRealityMapNodeInput {
  parentNodeId?: string;
  label?: string;
  nodeType?: RealityMapNodeType;
  probability?: number;
  riskScore?: number;
  opportunityScore?: number;
  aiSummary?: string;
  keyDrivers?: KeyDriver[];
  snapshot?: NodeSnapshot;
}

/**
 * Update node input
 */
export interface UpdateRealityMapNodeInput {
  label?: string;
  probability?: number;
  riskScore?: number;
  opportunityScore?: number;
  aiSummary?: string;
  narrativeDelta?: string;
  keyDrivers?: KeyDriver[];
}

/**
 * Create edge input
 */
export interface CreateRealityMapEdgeInput {
  parentNodeId: string;
  childNodeId: string;
  trigger?: EdgeTrigger;
  triggerType?: EdgeTriggerType;
  transitionProbability?: number;
  label?: string;
  description?: string;
}

/**
 * Analysis options input
 */
export interface AnalysisOptionsInput {
  includeContradictions?: boolean;
  includeCorrelations?: boolean;
  includePathComparisons?: boolean;
  narrativeDepth?: 'summary' | 'detailed' | 'comprehensive';
  focusPaths?: string[];
  customPrompt?: string;
}

/**
 * Comparison input
 */
export interface CreateComparisonInput {
  realityMapIds?: string[];
  pathIds?: string[];
  comparisonType: ComparisonType;
  includeNarrative?: boolean;
  includeRiskComparison?: boolean;
  includeOpportunityComparison?: boolean;
}

// ============================================================================
// QUERY TYPES
// ============================================================================

/**
 * List reality maps query
 */
export interface ListRealityMapsQuery {
  search?: string;
  status?: RealityMapStatus;
  suiteId?: string;
  sortBy?: 'created_at' | 'updated_at' | 'name' | 'total_nodes';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * List nodes query
 */
export interface ListRealityMapNodesQuery {
  depth?: number;
  nodeType?: RealityMapNodeType;
  minProbability?: number;
  minRiskScore?: number;
  minOpportunityScore?: number;
  parentNodeId?: string;
  limit?: number;
  offset?: number;
}

/**
 * List paths query
 */
export interface ListRealityMapPathsQuery {
  outcomeType?: PathOutcomeType;
  minProbability?: number;
  maxRiskScore?: number;
  minOpportunityScore?: number;
  sortBy?: 'probability' | 'risk' | 'opportunity';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * List audit log query
 */
export interface ListRealityMapAuditQuery {
  eventType?: RealityMapAuditEventType;
  nodeId?: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

/**
 * List reality maps response
 */
export interface ListRealityMapsResponse {
  maps: RealityMap[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Get reality map response
 */
export interface GetRealityMapResponse {
  map: RealityMap | null;
  rootNode: RealityMapNode | null;
  stats: RealityMapStats | null;
}

/**
 * Reality map stats
 */
export interface RealityMapStats {
  totalNodes: number;
  totalEdges: number;
  totalPaths: number;
  maxDepth: number;
  avgProbability: number;
  avgRiskScore: number;
  avgOpportunityScore: number;
  leafNodeCount: number;
  branchNodeCount: number;
}

/**
 * Create reality map response
 */
export interface CreateRealityMapResponse {
  success: boolean;
  map: RealityMap;
}

/**
 * Update reality map response
 */
export interface UpdateRealityMapResponse {
  success: boolean;
  map: RealityMap;
}

/**
 * Delete reality map response
 */
export interface DeleteRealityMapResponse {
  success: boolean;
}

/**
 * Generate reality map response
 */
export interface GenerateRealityMapResponse {
  success: boolean;
  map: RealityMap;
  generationTime: number;
  nodesCreated: number;
  edgesCreated: number;
  pathsComputed: number;
}

/**
 * Get graph response
 */
export interface GetRealityMapGraphResponse {
  success: boolean;
  graph: RealityMapGraphData;
}

/**
 * Get analysis response
 */
export interface GetRealityMapAnalysisResponse {
  success: boolean;
  analysis: RealityMapAnalysisResponse;
}

/**
 * List nodes response
 */
export interface ListRealityMapNodesResponse {
  nodes: RealityMapNode[];
  total: number;
}

/**
 * Get node response
 */
export interface GetRealityMapNodeResponse {
  node: RealityMapNode | null;
  children: RealityMapNode[];
  parent: RealityMapNode | null;
  path: RealityMapNode[];
}

/**
 * List paths response
 */
export interface ListRealityMapPathsResponse {
  paths: RealityMapPath[];
  total: number;
}

/**
 * Get path response
 */
export interface GetRealityMapPathResponse {
  path: RealityMapPath | null;
  nodes: RealityMapNode[];
  edges: RealityMapEdge[];
}

/**
 * List audit log response
 */
export interface ListRealityMapAuditResponse {
  events: RealityMapAuditLog[];
  total: number;
}

/**
 * Create comparison response
 */
export interface CreateComparisonResponse {
  success: boolean;
  comparison: RealityMapComparison;
}

/**
 * Global reality map stats response
 */
export interface GetRealityMapGlobalStatsResponse {
  totalMaps: number;
  completedMaps: number;
  generatingMaps: number;
  failedMaps: number;
  totalNodes: number;
  totalPaths: number;
  avgNodesPerMap: number;
  avgPathsPerMap: number;
}

// ============================================================================
// GENERATION ENGINE TYPES
// ============================================================================

/**
 * Simulation data for ingestion
 */
export interface SimulationDataForIngestion {
  simulationId: string;
  simulationRunId?: string;
  outcomes: SimulationOutcome[];
  riskAssessment: RealityMapRiskAssessment;
  opportunityAssessment: OpportunityAssessment;
  narrative: string;
  keyFindings: string[];
}

/**
 * Simulation outcome
 */
export interface SimulationOutcome {
  id: string;
  type: string;
  probability: number;
  description: string;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  opportunityLevel: 'high' | 'medium' | 'low';
  drivers: string[];
}

/**
 * Reality Map Risk assessment from simulation
 */
export interface RealityMapRiskAssessment {
  overallScore: number;
  factors: RealityMapRiskFactor[];
  mitigations: MitigationStrategy[];
}

/**
 * Opportunity assessment from simulation
 */
export interface OpportunityAssessment {
  overallScore: number;
  factors: OpportunityFactor[];
  actions: RealityMapActionRecommendation[];
}

/**
 * Suite data for ingestion
 */
export interface SuiteDataForIngestion {
  suiteId: string;
  suiteRunId?: string;
  items: SuiteItemData[];
  aggregatedOutcomes: Record<string, unknown>;
  suiteNarrative: string | null;
  riskMap: Record<string, unknown> | null;
}

/**
 * Suite item data
 */
export interface SuiteItemData {
  itemId: string;
  simulationId: string;
  orderIndex: number;
  status: string;
  conditionMet: boolean;
  outcome: SimulationOutcome | null;
}

/**
 * Branching structure for generation
 */
export interface BranchingStructure {
  rootNode: BranchingNode;
  totalBranches: number;
  maxDepth: number;
}

/**
 * Branching node in structure
 */
export interface BranchingNode {
  id: string;
  label: string;
  probability: number;
  source: 'simulation' | 'suite' | 'computed';
  sourceId: string | null;
  children: BranchingNode[];
  metadata: Record<string, unknown>;
}

/**
 * Probability model result
 */
export interface ProbabilityModelResult {
  nodeId: string;
  probability: number;
  confidence: number;
  methodology: ProbabilityModelType;
  inputs: string[];
  adjustments: ProbabilityAdjustment[];
}

/**
 * Probability adjustment
 */
export interface ProbabilityAdjustment {
  factor: string;
  adjustment: number;
  reason: string;
}

/**
 * Node narrative generation result
 */
export interface NodeNarrativeResult {
  nodeId: string;
  summary: string;
  delta: string | null;
  drivers: KeyDriver[];
  tokensUsed: number;
  generationTime: number;
}

/**
 * Risk/opportunity score result
 */
export interface ScoreComputationResult {
  nodeId: string;
  riskScore: number;
  opportunityScore: number;
  riskFactors: RealityMapRiskFactor[];
  opportunityFactors: OpportunityFactor[];
  methodology: string;
}

// Type aliases for backward compatibility
export type PathComparison = PathComparisonResult;

// All types are exported at their declaration points above
