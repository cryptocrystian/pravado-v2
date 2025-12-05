/**
 * Executive Risk Radar & Predictive Crisis Forecasting Engine Types (Sprint S60)
 * TypeScript types for predictive crisis likelihood, leading indicators, and executive risk dashboards
 */

// ========================================
// Enums as String Literal Types
// ========================================

/**
 * Risk level classification
 */
export type RiskRadarLevel = 'low' | 'medium' | 'high' | 'critical';

export const RiskRadarLevel = {
  LOW: 'low' as const,
  MEDIUM: 'medium' as const,
  HIGH: 'high' as const,
  CRITICAL: 'critical' as const,
};

/**
 * Indicator type classification
 */
export type RiskRadarIndicatorType =
  | 'sentiment'
  | 'velocity'
  | 'alerts'
  | 'competitive'
  | 'governance'
  | 'persona'
  | 'media_coverage'
  | 'crisis_history'
  | 'reputation';

export const RiskRadarIndicatorType = {
  SENTIMENT: 'sentiment' as const,
  VELOCITY: 'velocity' as const,
  ALERTS: 'alerts' as const,
  COMPETITIVE: 'competitive' as const,
  GOVERNANCE: 'governance' as const,
  PERSONA: 'persona' as const,
  MEDIA_COVERAGE: 'media_coverage' as const,
  CRISIS_HISTORY: 'crisis_history' as const,
  REPUTATION: 'reputation' as const,
};

/**
 * Forecast time horizon
 */
export type RiskRadarForecastHorizon = '24h' | '72h' | '7d' | '14d' | '30d';

export const RiskRadarForecastHorizon = {
  H24: '24h' as const,
  H72: '72h' as const,
  D7: '7d' as const,
  D14: '14d' as const,
  D30: '30d' as const,
};

/**
 * Driver category classification
 */
export type RiskRadarDriverCategory =
  | 'sentiment_shift'
  | 'velocity_spike'
  | 'competitive_pressure'
  | 'governance_violation'
  | 'media_surge'
  | 'crisis_pattern'
  | 'persona_sensitivity'
  | 'external_event'
  | 'reputation_decline';

export const RiskRadarDriverCategory = {
  SENTIMENT_SHIFT: 'sentiment_shift' as const,
  VELOCITY_SPIKE: 'velocity_spike' as const,
  COMPETITIVE_PRESSURE: 'competitive_pressure' as const,
  GOVERNANCE_VIOLATION: 'governance_violation' as const,
  MEDIA_SURGE: 'media_surge' as const,
  CRISIS_PATTERN: 'crisis_pattern' as const,
  PERSONA_SENSITIVITY: 'persona_sensitivity' as const,
  EXTERNAL_EVENT: 'external_event' as const,
  REPUTATION_DECLINE: 'reputation_decline' as const,
};

/**
 * Note type classification
 */
export type RiskRadarNoteType =
  | 'observation'
  | 'action_taken'
  | 'escalation'
  | 'resolution'
  | 'context'
  | 'executive_comment';

export const RiskRadarNoteType = {
  OBSERVATION: 'observation' as const,
  ACTION_TAKEN: 'action_taken' as const,
  ESCALATION: 'escalation' as const,
  RESOLUTION: 'resolution' as const,
  CONTEXT: 'context' as const,
  EXECUTIVE_COMMENT: 'executive_comment' as const,
};

/**
 * Trend direction
 */
export type RiskRadarTrendDirection = 'improving' | 'stable' | 'worsening' | 'volatile';

export const RiskRadarTrendDirection = {
  IMPROVING: 'improving' as const,
  STABLE: 'stable' as const,
  WORSENING: 'worsening' as const,
  VOLATILE: 'volatile' as const,
};

// ========================================
// Signal Matrix Types
// ========================================

/**
 * Signal source from integrated systems
 */
export interface RiskRadarSignalSource {
  system: string;
  metric: string;
  value: number;
  normalizedValue?: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Signal matrix aggregating all system inputs
 */
export interface RiskRadarSignalMatrix {
  // Media monitoring (S40-S43)
  mediaVolume?: number;
  mediaSentiment?: number;
  mediaReach?: number;
  alertCount?: number;
  alertSeverity?: number;

  // Crisis (S55)
  activeCrisisCount?: number;
  crisisSeverity?: number;
  escalationCount?: number;

  // Brand reputation (S56-S57)
  reputationScore?: number;
  reputationTrend?: number;
  sentimentShift?: number;

  // Competitive intelligence (S53)
  competitivePressure?: number;
  marketShareChange?: number;
  competitorMentions?: number;

  // Governance (S59)
  openFindings?: number;
  findingSeverity?: number;
  complianceScore?: number;

  // Persona insights (S51)
  personaSensitivity?: number;
  audienceRisk?: number;

  // Media performance (S52)
  performanceScore?: number;
  coverageQuality?: number;

  // Raw signals
  rawSignals?: RiskRadarSignalSource[];
}

/**
 * Key concern identified from analysis
 */
export interface RiskRadarConcern {
  id: string;
  title: string;
  description: string;
  severity: RiskRadarLevel;
  source: string;
  relatedDriverIds?: string[];
  timestamp: Date;
}

/**
 * Emerging risk pattern
 */
export interface RiskRadarEmergingRisk {
  id: string;
  name: string;
  description: string;
  probability: number; // 0-1
  potentialImpact: RiskRadarLevel;
  firstDetected: Date;
  velocity: number;
  indicators: string[];
}

/**
 * Positive factor offsetting risk
 */
export interface RiskRadarPositiveFactor {
  id: string;
  name: string;
  description: string;
  impact: number; // Risk reduction percentage
  source: string;
}

// ========================================
// Core Entity Interfaces
// ========================================

/**
 * Risk Radar Snapshot - Point-in-time risk assessment
 */
export interface RiskRadarSnapshot {
  id: string;
  orgId: string;

  // Snapshot identification
  snapshotDate: Date;
  title?: string;
  description?: string;

  // Risk scoring
  overallRiskIndex: number; // 0-100
  riskLevel: RiskRadarLevel;
  confidenceScore?: number; // 0-1

  // Component scores (0-100)
  sentimentScore?: number;
  velocityScore?: number;
  alertScore?: number;
  competitiveScore?: number;
  governanceScore?: number;
  personaScore?: number;

  // Signal matrix
  signalMatrix: RiskRadarSignalMatrix;

  // Computed insights
  keyConcerns: RiskRadarConcern[];
  emergingRisks: RiskRadarEmergingRisk[];
  positiveFactors: RiskRadarPositiveFactor[];

  // Status
  isActive: boolean;
  isArchived: boolean;

  // Computation metadata
  computationMethod: string;
  modelVersion?: string;
  computationDurationMs?: number;

  // Audit
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Risk Radar Indicator - Individual risk signal
 */
export interface RiskRadarIndicator {
  id: string;
  orgId: string;
  snapshotId: string;

  // Indicator identification
  indicatorType: RiskRadarIndicatorType;
  name: string;
  description?: string;

  // Scoring
  score: number; // 0-100
  weight: number; // 0-1
  normalizedScore?: number; // 0-100

  // Trend analysis
  previousScore?: number;
  scoreDelta?: number;
  trendDirection?: RiskRadarTrendDirection;
  velocity?: number;

  // Source data
  sourceSystem: string;
  sourceReferenceId?: string;
  sourceData: Record<string, unknown>;

  // Time window
  measurementStart?: Date;
  measurementEnd?: Date;

  // Metadata
  metadata: Record<string, unknown>;
  tags: string[];

  // Audit
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Projection curve point for forecasts
 */
export interface RiskRadarProjectionPoint {
  timestamp: Date;
  value: number;
  confidence: number;
  lowerBound?: number;
  upperBound?: number;
}

/**
 * Forecast assumption
 */
export interface RiskRadarForecastAssumption {
  assumption: string;
  confidence: number; // 0-1
  impact: 'low' | 'medium' | 'high';
}

/**
 * Recommended action from forecast
 */
export interface RiskRadarRecommendedAction {
  action: string;
  priority: 'immediate' | 'high' | 'medium' | 'low';
  owner?: string;
  dueDate?: Date;
  rationale?: string;
}

/**
 * Watch item from forecast
 */
export interface RiskRadarWatchItem {
  item: string;
  reason: string;
  threshold?: number;
  currentValue?: number;
}

/**
 * Risk Radar Forecast - Predictive projection
 */
export interface RiskRadarForecast {
  id: string;
  orgId: string;
  snapshotId: string;

  // Forecast identification
  horizon: RiskRadarForecastHorizon;
  forecastDate: Date;
  targetDate: Date;

  // Predicted values
  predictedRiskIndex: number; // 0-100
  predictedRiskLevel: RiskRadarLevel;
  confidenceIntervalLow?: number;
  confidenceIntervalHigh?: number;
  probabilityOfCrisis?: number; // 0-1

  // Projection curves
  projectionCurve: RiskRadarProjectionPoint[];

  // Narrative synthesis
  executiveSummary?: string;
  detailedAnalysis?: string;
  keyAssumptions: RiskRadarForecastAssumption[];
  recommendedActions: RiskRadarRecommendedAction[];
  watchItems: RiskRadarWatchItem[];

  // Model metadata
  modelName?: string;
  modelVersion?: string;
  llmModel?: string;
  tokensUsed?: number;
  generationDurationMs?: number;

  // Validation
  isCurrent: boolean;
  supersededBy?: string;
  accuracyScore?: number;

  // Audit
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Affected entity in driver analysis
 */
export interface RiskRadarAffectedEntity {
  entityType: string;
  entityId: string;
  entityName?: string;
  impact: RiskRadarLevel;
}

/**
 * Risk Radar Driver - Key risk driver
 */
export interface RiskRadarDriver {
  id: string;
  orgId: string;
  snapshotId: string;

  // Driver identification
  category: RiskRadarDriverCategory;
  name: string;
  description?: string;

  // Impact assessment
  impactScore: number; // 0-100
  contributionPercentage?: number; // 0-100
  urgency: RiskRadarLevel;

  // Source attribution
  sourceSystem?: string;
  sourceReferenceId?: string;
  sourceData: Record<string, unknown>;

  // Trend
  isEmerging: boolean;
  isTurningPoint: boolean;
  firstDetectedAt?: Date;
  trendVelocity?: number;

  // Related entities
  affectedEntities: RiskRadarAffectedEntity[];
  relatedIndicatorIds: string[];

  // Metadata
  metadata: Record<string, unknown>;
  tags: string[];

  // Audit
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Risk Radar Note - Collaboration annotation
 */
export interface RiskRadarNote {
  id: string;
  orgId: string;
  snapshotId: string;

  // Note content
  noteType: RiskRadarNoteType;
  title?: string;
  content: string;

  // Context
  relatedIndicatorId?: string;
  relatedDriverId?: string;
  relatedForecastId?: string;

  // Visibility
  isExecutiveVisible: boolean;
  isPinned: boolean;

  // Metadata
  metadata: Record<string, unknown>;
  tags: string[];

  // Audit
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Risk Radar Audit Log Entry
 */
export interface RiskRadarAuditLogEntry {
  id: string;
  orgId: string;

  // Operation details
  operation: string;
  entityType: string;
  entityId?: string;
  requestId?: string;

  // User context
  userId?: string;
  userEmail?: string;

  // LLM details
  llmModel?: string;
  tokensInput?: number;
  tokensOutput?: number;
  tokensTotal?: number;
  durationMs?: number;

  // Request/response previews
  promptPreview?: string;
  responsePreview?: string;

  // Status
  status: string;
  errorMessage?: string;

  // Metadata
  metadata: Record<string, unknown>;

  // Timestamp
  createdAt: Date;
}

// ========================================
// Dashboard Types
// ========================================

/**
 * Risk trend data point
 */
export interface RiskRadarTrendPoint {
  date: Date;
  riskIndex: number;
  riskLevel: RiskRadarLevel;
  snapshotId?: string;
}

/**
 * Risk distribution by level
 */
export interface RiskRadarDistribution {
  low: number;
  medium: number;
  high: number;
  critical: number;
}

/**
 * Component score summary
 */
export interface RiskRadarComponentSummary {
  name: string;
  score: number;
  trend: RiskRadarTrendDirection;
  delta: number;
}

/**
 * Executive Risk Dashboard - Main dashboard data
 */
export interface RiskRadarDashboard {
  // Current state
  currentSnapshot?: RiskRadarSnapshot;
  currentForecast?: RiskRadarForecast;

  // Trends
  riskTrend: RiskRadarTrendPoint[];
  trendPeriodDays: number;

  // Distribution
  riskDistribution: RiskRadarDistribution;

  // Components
  componentSummaries: RiskRadarComponentSummary[];

  // Key items
  topDrivers: RiskRadarDriver[];
  emergingRisks: RiskRadarEmergingRisk[];
  recentNotes: RiskRadarNote[];

  // Stats
  totalSnapshots: number;
  snapshotsThisPeriod: number;
  avgRiskIndex: number;
  peakRiskIndex: number;

  // Last updated
  lastUpdated: Date;
}

// ========================================
// Input/DTO Types for CRUD Operations
// ========================================

/**
 * Create snapshot input
 */
export interface CreateRiskRadarSnapshotInput {
  title?: string;
  description?: string;
  signalMatrix?: RiskRadarSignalMatrix;
  computationMethod?: string;
}

/**
 * Update snapshot input
 */
export interface UpdateRiskRadarSnapshotInput {
  title?: string;
  description?: string;
  isActive?: boolean;
  isArchived?: boolean;
}

/**
 * Create indicator input
 */
export interface CreateRiskRadarIndicatorInput {
  indicatorType: RiskRadarIndicatorType;
  name: string;
  description?: string;
  score: number;
  weight?: number;
  sourceSystem: string;
  sourceReferenceId?: string;
  sourceData?: Record<string, unknown>;
  measurementStart?: Date;
  measurementEnd?: Date;
  tags?: string[];
}

/**
 * Create forecast input
 */
export interface CreateRiskRadarForecastInput {
  horizon: RiskRadarForecastHorizon;
  useLlm?: boolean;
  llmModel?: string;
  customPrompt?: string;
}

/**
 * Regenerate forecast input
 */
export interface RegenerateRiskRadarForecastInput {
  useLlm?: boolean;
  llmModel?: string;
  customPrompt?: string;
  includeDetailedAnalysis?: boolean;
}

/**
 * Create driver input
 */
export interface CreateRiskRadarDriverInput {
  category: RiskRadarDriverCategory;
  name: string;
  description?: string;
  impactScore: number;
  contributionPercentage?: number;
  urgency?: RiskRadarLevel;
  sourceSystem?: string;
  sourceReferenceId?: string;
  sourceData?: Record<string, unknown>;
  isEmerging?: boolean;
  isTurningPoint?: boolean;
  affectedEntities?: RiskRadarAffectedEntity[];
  relatedIndicatorIds?: string[];
  tags?: string[];
}

/**
 * Create note input
 */
export interface CreateRiskRadarNoteInput {
  noteType: RiskRadarNoteType;
  title?: string;
  content: string;
  relatedIndicatorId?: string;
  relatedDriverId?: string;
  relatedForecastId?: string;
  isExecutiveVisible?: boolean;
  isPinned?: boolean;
  tags?: string[];
}

/**
 * Update note input
 */
export interface UpdateRiskRadarNoteInput {
  title?: string;
  content?: string;
  isExecutiveVisible?: boolean;
  isPinned?: boolean;
  tags?: string[];
}

// ========================================
// Query Types
// ========================================

/**
 * Query parameters for listing snapshots
 */
export interface RiskRadarSnapshotsQuery {
  riskLevel?: RiskRadarLevel | RiskRadarLevel[];
  isActive?: boolean;
  isArchived?: boolean;
  startDate?: Date;
  endDate?: Date;
  minRiskIndex?: number;
  maxRiskIndex?: number;
  sortBy?: 'snapshot_date' | 'overall_risk_index' | 'created_at';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * Query parameters for listing indicators
 */
export interface RiskRadarIndicatorsQuery {
  indicatorType?: RiskRadarIndicatorType | RiskRadarIndicatorType[];
  sourceSystem?: string;
  minScore?: number;
  maxScore?: number;
  trendDirection?: RiskRadarTrendDirection;
  sortBy?: 'score' | 'created_at' | 'indicator_type';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * Query parameters for listing forecasts
 */
export interface RiskRadarForecastsQuery {
  horizon?: RiskRadarForecastHorizon | RiskRadarForecastHorizon[];
  isCurrent?: boolean;
  minProbability?: number;
  maxProbability?: number;
  sortBy?: 'forecast_date' | 'predicted_risk_index' | 'probability_of_crisis';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * Query parameters for listing drivers
 */
export interface RiskRadarDriversQuery {
  category?: RiskRadarDriverCategory | RiskRadarDriverCategory[];
  urgency?: RiskRadarLevel | RiskRadarLevel[];
  isEmerging?: boolean;
  isTurningPoint?: boolean;
  minImpactScore?: number;
  sortBy?: 'impact_score' | 'contribution_percentage' | 'created_at';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * Query parameters for listing notes
 */
export interface RiskRadarNotesQuery {
  noteType?: RiskRadarNoteType | RiskRadarNoteType[];
  isExecutiveVisible?: boolean;
  isPinned?: boolean;
  createdBy?: string;
  sortBy?: 'created_at' | 'note_type';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * Query parameters for dashboard
 */
export interface RiskRadarDashboardQuery {
  trendPeriodDays?: number;
  includeForecasts?: boolean;
  topDriversLimit?: number;
  recentNotesLimit?: number;
}

// ========================================
// Response Types
// ========================================

/**
 * List snapshots response
 */
export interface RiskRadarSnapshotsListResponse {
  snapshots: RiskRadarSnapshot[];
  total: number;
  hasMore: boolean;
}

/**
 * Snapshot detail response
 */
export interface RiskRadarSnapshotDetailResponse {
  snapshot: RiskRadarSnapshot;
  indicators: RiskRadarIndicator[];
  drivers: RiskRadarDriver[];
  currentForecast?: RiskRadarForecast;
  recentNotes: RiskRadarNote[];
}

/**
 * List indicators response
 */
export interface RiskRadarIndicatorsListResponse {
  indicators: RiskRadarIndicator[];
  total: number;
  hasMore: boolean;
}

/**
 * List forecasts response
 */
export interface RiskRadarForecastsListResponse {
  forecasts: RiskRadarForecast[];
  total: number;
  hasMore: boolean;
}

/**
 * List drivers response
 */
export interface RiskRadarDriversListResponse {
  drivers: RiskRadarDriver[];
  total: number;
  hasMore: boolean;
}

/**
 * List notes response
 */
export interface RiskRadarNotesListResponse {
  notes: RiskRadarNote[];
  total: number;
  hasMore: boolean;
}

/**
 * Rebuild indicators response
 */
export interface RiskRadarRebuildIndicatorsResponse {
  indicatorsCreated: number;
  indicatorsUpdated: number;
  newRiskIndex: number;
  newRiskLevel: RiskRadarLevel;
  durationMs: number;
}

/**
 * Forecast generation response
 */
export interface RiskRadarForecastGenerationResponse {
  forecast: RiskRadarForecast;
  tokensUsed: number;
  durationMs: number;
}

// ========================================
// Narrative Types
// ========================================

/**
 * Forecast narrative structure
 */
export interface RiskRadarForecastNarrative {
  executiveSummary: string;
  detailedAnalysis: string;
  keyAssumptions: RiskRadarForecastAssumption[];
  recommendedActions: RiskRadarRecommendedAction[];
  watchItems: RiskRadarWatchItem[];
  confidenceStatement: string;
}

/**
 * Narrative generation context
 */
export interface RiskRadarNarrativeContext {
  snapshot: RiskRadarSnapshot;
  indicators: RiskRadarIndicator[];
  drivers: RiskRadarDriver[];
  previousForecasts?: RiskRadarForecast[];
  horizon: RiskRadarForecastHorizon;
}
