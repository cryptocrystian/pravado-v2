/**
 * Risk Radar API Client (Sprint S60)
 * Frontend API layer for executive risk radar & predictive crisis forecasting engine
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Client-side API request (for use in client components)
 * Uses credentials: 'include' to automatically send cookies
 */
async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });

  return response.json();
}

// ========================================
// Type definitions matching backend
// ========================================

export type RiskRadarLevel = 'low' | 'medium' | 'high' | 'critical';

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

export type RiskRadarForecastHorizon = '24h' | '72h' | '7d' | '14d' | '30d';

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

export type RiskRadarNoteType =
  | 'observation'
  | 'action_taken'
  | 'escalation'
  | 'resolution'
  | 'context'
  | 'executive_comment';

export type RiskRadarTrendDirection = 'improving' | 'stable' | 'worsening' | 'volatile';

// ========================================
// Entity Interfaces
// ========================================

export interface RiskRadarSignalMatrix {
  mediaVolume?: number;
  mediaSentiment?: number;
  mediaReach?: number;
  alertCount?: number;
  alertSeverity?: number;
  activeCrisisCount?: number;
  crisisSeverity?: number;
  escalationCount?: number;
  reputationScore?: number;
  reputationTrend?: number;
  sentimentShift?: number;
  competitivePressure?: number;
  marketShareChange?: number;
  competitorMentions?: number;
  openFindings?: number;
  findingSeverity?: number;
  complianceScore?: number;
  personaSensitivity?: number;
  audienceRisk?: number;
  performanceScore?: number;
  coverageQuality?: number;
}

export interface RiskRadarConcern {
  id: string;
  title: string;
  description: string;
  severity: RiskRadarLevel;
  source: string;
  relatedDriverIds?: string[];
  timestamp: string;
}

export interface RiskRadarEmergingRisk {
  id: string;
  name: string;
  description: string;
  probability: number;
  potentialImpact: RiskRadarLevel;
  firstDetected: string;
  velocity: number;
  indicators: string[];
}

export interface RiskRadarPositiveFactor {
  id: string;
  name: string;
  description: string;
  impact: number;
  source: string;
}

export interface RiskRadarSnapshot {
  id: string;
  orgId: string;
  snapshotDate: string;
  title?: string;
  description?: string;
  overallRiskIndex: number;
  riskLevel: RiskRadarLevel;
  confidenceScore?: number;
  sentimentScore?: number;
  velocityScore?: number;
  alertScore?: number;
  competitiveScore?: number;
  governanceScore?: number;
  personaScore?: number;
  signalMatrix: RiskRadarSignalMatrix;
  keyConcerns: RiskRadarConcern[];
  emergingRisks: RiskRadarEmergingRisk[];
  positiveFactors: RiskRadarPositiveFactor[];
  isActive: boolean;
  isArchived: boolean;
  computationMethod: string;
  modelVersion?: string;
  computationDurationMs?: number;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RiskRadarIndicator {
  id: string;
  orgId: string;
  snapshotId: string;
  indicatorType: RiskRadarIndicatorType;
  name: string;
  description?: string;
  score: number;
  weight: number;
  normalizedScore?: number;
  previousScore?: number;
  scoreDelta?: number;
  trendDirection?: RiskRadarTrendDirection;
  velocity?: number;
  sourceSystem: string;
  sourceReferenceId?: string;
  sourceData: Record<string, unknown>;
  measurementStart?: string;
  measurementEnd?: string;
  metadata: Record<string, unknown>;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RiskRadarProjectionPoint {
  timestamp: string;
  value: number;
  confidence: number;
  lowerBound?: number;
  upperBound?: number;
}

export interface RiskRadarForecastAssumption {
  assumption: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
}

export interface RiskRadarRecommendedAction {
  action: string;
  priority: 'immediate' | 'high' | 'medium' | 'low';
  owner?: string;
  dueDate?: string;
  rationale?: string;
}

export interface RiskRadarWatchItem {
  item: string;
  reason: string;
  threshold?: number;
  currentValue?: number;
}

export interface RiskRadarForecast {
  id: string;
  orgId: string;
  snapshotId: string;
  horizon: RiskRadarForecastHorizon;
  forecastDate: string;
  targetDate: string;
  predictedRiskIndex: number;
  predictedRiskLevel: RiskRadarLevel;
  confidenceIntervalLow?: number;
  confidenceIntervalHigh?: number;
  probabilityOfCrisis?: number;
  projectionCurve: RiskRadarProjectionPoint[];
  executiveSummary?: string;
  detailedAnalysis?: string;
  keyAssumptions: RiskRadarForecastAssumption[];
  recommendedActions: RiskRadarRecommendedAction[];
  watchItems: RiskRadarWatchItem[];
  modelName?: string;
  modelVersion?: string;
  llmModel?: string;
  tokensUsed?: number;
  generationDurationMs?: number;
  isCurrent: boolean;
  supersededBy?: string;
  accuracyScore?: number;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RiskRadarAffectedEntity {
  entityType: string;
  entityId: string;
  entityName?: string;
  impact: RiskRadarLevel;
}

export interface RiskRadarDriver {
  id: string;
  orgId: string;
  snapshotId: string;
  category: RiskRadarDriverCategory;
  name: string;
  description?: string;
  impactScore: number;
  contributionPercentage?: number;
  urgency: RiskRadarLevel;
  sourceSystem?: string;
  sourceReferenceId?: string;
  sourceData: Record<string, unknown>;
  isEmerging: boolean;
  isTurningPoint: boolean;
  firstDetectedAt?: string;
  trendVelocity?: number;
  affectedEntities: RiskRadarAffectedEntity[];
  relatedIndicatorIds: string[];
  metadata: Record<string, unknown>;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RiskRadarNote {
  id: string;
  orgId: string;
  snapshotId: string;
  noteType: RiskRadarNoteType;
  title?: string;
  content: string;
  relatedIndicatorId?: string;
  relatedDriverId?: string;
  relatedForecastId?: string;
  isExecutiveVisible: boolean;
  isPinned: boolean;
  metadata: Record<string, unknown>;
  tags: string[];
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// ========================================
// Dashboard Types
// ========================================

export interface RiskRadarTrendPoint {
  date: string;
  riskIndex: number;
  riskLevel: RiskRadarLevel;
  snapshotId?: string;
}

export interface RiskRadarDistribution {
  low: number;
  medium: number;
  high: number;
  critical: number;
}

export interface RiskRadarComponentSummary {
  name: string;
  score: number;
  trend: RiskRadarTrendDirection;
  delta: number;
}

export interface RiskRadarDashboard {
  currentSnapshot?: RiskRadarSnapshot;
  currentForecast?: RiskRadarForecast;
  riskTrend: RiskRadarTrendPoint[];
  trendPeriodDays: number;
  riskDistribution: RiskRadarDistribution;
  componentSummaries: RiskRadarComponentSummary[];
  topDrivers: RiskRadarDriver[];
  emergingRisks: RiskRadarEmergingRisk[];
  recentNotes: RiskRadarNote[];
  totalSnapshots: number;
  snapshotsThisPeriod: number;
  avgRiskIndex: number;
  peakRiskIndex: number;
  lastUpdated: string;
}

// ========================================
// Input Types
// ========================================

export interface CreateRiskRadarSnapshotInput {
  title?: string;
  description?: string;
  signalMatrix?: RiskRadarSignalMatrix;
  computationMethod?: string;
}

export interface UpdateRiskRadarSnapshotInput {
  title?: string;
  description?: string;
  isActive?: boolean;
  isArchived?: boolean;
}

export interface CreateRiskRadarForecastInput {
  horizon: RiskRadarForecastHorizon;
  useLlm?: boolean;
  llmModel?: string;
  customPrompt?: string;
}

export interface RegenerateRiskRadarForecastInput {
  useLlm?: boolean;
  llmModel?: string;
  customPrompt?: string;
  includeDetailedAnalysis?: boolean;
}

export interface CreateRiskRadarNoteInput {
  noteType?: RiskRadarNoteType;
  title?: string;
  content: string;
  relatedIndicatorId?: string;
  relatedDriverId?: string;
  relatedForecastId?: string;
  isExecutiveVisible?: boolean;
  isPinned?: boolean;
  tags?: string[];
}

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

export interface RiskRadarSnapshotsQuery {
  riskLevel?: RiskRadarLevel | RiskRadarLevel[];
  isActive?: boolean;
  isArchived?: boolean;
  startDate?: string;
  endDate?: string;
  minRiskIndex?: number;
  maxRiskIndex?: number;
  sortBy?: 'snapshot_date' | 'overall_risk_index' | 'created_at';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

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

export interface RiskRadarDashboardQuery {
  trendPeriodDays?: number;
  includeForecasts?: boolean;
  topDriversLimit?: number;
  recentNotesLimit?: number;
}

// ========================================
// Response Types
// ========================================

export interface RiskRadarSnapshotsListResponse {
  snapshots: RiskRadarSnapshot[];
  total: number;
  hasMore: boolean;
}

export interface RiskRadarSnapshotDetailResponse {
  snapshot: RiskRadarSnapshot;
  indicators: RiskRadarIndicator[];
  drivers: RiskRadarDriver[];
  currentForecast?: RiskRadarForecast;
  recentNotes: RiskRadarNote[];
}

export interface RiskRadarIndicatorsListResponse {
  indicators: RiskRadarIndicator[];
  total: number;
  hasMore: boolean;
}

export interface RiskRadarForecastsListResponse {
  forecasts: RiskRadarForecast[];
  total: number;
  hasMore: boolean;
}

export interface RiskRadarDriversListResponse {
  drivers: RiskRadarDriver[];
  total: number;
  hasMore: boolean;
}

export interface RiskRadarNotesListResponse {
  notes: RiskRadarNote[];
  total: number;
  hasMore: boolean;
}

export interface RiskRadarRebuildIndicatorsResponse {
  indicatorsCreated: number;
  indicatorsUpdated: number;
  newRiskIndex: number;
  newRiskLevel: RiskRadarLevel;
  durationMs: number;
}

export interface RiskRadarForecastGenerationResponse {
  forecast: RiskRadarForecast;
  tokensUsed: number;
  durationMs: number;
}

// ========================================
// Dashboard API
// ========================================

/**
 * Get risk radar dashboard
 */
export async function getDashboard(
  query: RiskRadarDashboardQuery = {}
): Promise<ApiResponse<RiskRadarDashboard>> {
  const params = new URLSearchParams();
  if (query.trendPeriodDays !== undefined) params.set('trendPeriodDays', String(query.trendPeriodDays));
  if (query.includeForecasts !== undefined) params.set('includeForecasts', String(query.includeForecasts));
  if (query.topDriversLimit !== undefined) params.set('topDriversLimit', String(query.topDriversLimit));
  if (query.recentNotesLimit !== undefined) params.set('recentNotesLimit', String(query.recentNotesLimit));

  const queryString = params.toString();
  return apiRequest(`/api/v1/risk-radar/dashboard${queryString ? `?${queryString}` : ''}`);
}

// ========================================
// Snapshot API
// ========================================

/**
 * List risk snapshots
 */
export async function listSnapshots(
  query: RiskRadarSnapshotsQuery = {}
): Promise<ApiResponse<RiskRadarSnapshotsListResponse>> {
  const params = new URLSearchParams();
  if (query.riskLevel) params.set('riskLevel', Array.isArray(query.riskLevel) ? query.riskLevel.join(',') : query.riskLevel);
  if (query.isActive !== undefined) params.set('isActive', String(query.isActive));
  if (query.isArchived !== undefined) params.set('isArchived', String(query.isArchived));
  if (query.startDate) params.set('startDate', query.startDate);
  if (query.endDate) params.set('endDate', query.endDate);
  if (query.minRiskIndex !== undefined) params.set('minRiskIndex', String(query.minRiskIndex));
  if (query.maxRiskIndex !== undefined) params.set('maxRiskIndex', String(query.maxRiskIndex));
  if (query.sortBy) params.set('sortBy', query.sortBy);
  if (query.sortOrder) params.set('sortOrder', query.sortOrder);
  if (query.limit !== undefined) params.set('limit', String(query.limit));
  if (query.offset !== undefined) params.set('offset', String(query.offset));

  const queryString = params.toString();
  return apiRequest(`/api/v1/risk-radar/snapshots${queryString ? `?${queryString}` : ''}`);
}

/**
 * Create a new risk snapshot
 */
export async function createSnapshot(
  input: CreateRiskRadarSnapshotInput
): Promise<ApiResponse<RiskRadarSnapshot>> {
  return apiRequest('/api/v1/risk-radar/snapshots', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/**
 * Get the currently active snapshot
 */
export async function getActiveSnapshot(): Promise<ApiResponse<RiskRadarSnapshot>> {
  return apiRequest('/api/v1/risk-radar/snapshots/active');
}

/**
 * Get a specific snapshot
 */
export async function getSnapshot(snapshotId: string): Promise<ApiResponse<RiskRadarSnapshot>> {
  return apiRequest(`/api/v1/risk-radar/snapshots/${snapshotId}`);
}

/**
 * Get snapshot with full details
 */
export async function getSnapshotDetail(
  snapshotId: string
): Promise<ApiResponse<RiskRadarSnapshotDetailResponse>> {
  return apiRequest(`/api/v1/risk-radar/snapshots/${snapshotId}/detail`);
}

/**
 * Update a snapshot
 */
export async function updateSnapshot(
  snapshotId: string,
  input: UpdateRiskRadarSnapshotInput
): Promise<ApiResponse<RiskRadarSnapshot>> {
  return apiRequest(`/api/v1/risk-radar/snapshots/${snapshotId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

/**
 * Archive a snapshot
 */
export async function archiveSnapshot(snapshotId: string): Promise<ApiResponse<void>> {
  return apiRequest(`/api/v1/risk-radar/snapshots/${snapshotId}/archive`, {
    method: 'POST',
  });
}

// ========================================
// Indicator API
// ========================================

/**
 * List indicators for a snapshot
 */
export async function listIndicators(
  snapshotId: string,
  query: RiskRadarIndicatorsQuery = {}
): Promise<ApiResponse<RiskRadarIndicatorsListResponse>> {
  const params = new URLSearchParams();
  if (query.indicatorType) params.set('indicatorType', Array.isArray(query.indicatorType) ? query.indicatorType.join(',') : query.indicatorType);
  if (query.sourceSystem) params.set('sourceSystem', query.sourceSystem);
  if (query.minScore !== undefined) params.set('minScore', String(query.minScore));
  if (query.maxScore !== undefined) params.set('maxScore', String(query.maxScore));
  if (query.trendDirection) params.set('trendDirection', query.trendDirection);
  if (query.sortBy) params.set('sortBy', query.sortBy);
  if (query.sortOrder) params.set('sortOrder', query.sortOrder);
  if (query.limit !== undefined) params.set('limit', String(query.limit));
  if (query.offset !== undefined) params.set('offset', String(query.offset));

  const queryString = params.toString();
  return apiRequest(`/api/v1/risk-radar/snapshots/${snapshotId}/indicators${queryString ? `?${queryString}` : ''}`);
}

/**
 * Rebuild indicators for a snapshot
 */
export async function rebuildIndicators(
  snapshotId: string
): Promise<ApiResponse<RiskRadarRebuildIndicatorsResponse>> {
  return apiRequest(`/api/v1/risk-radar/snapshots/${snapshotId}/indicators/rebuild`, {
    method: 'POST',
  });
}

// ========================================
// Forecast API
// ========================================

/**
 * List forecasts for a snapshot
 */
export async function listForecasts(
  snapshotId: string,
  query: RiskRadarForecastsQuery = {}
): Promise<ApiResponse<RiskRadarForecastsListResponse>> {
  const params = new URLSearchParams();
  if (query.horizon) params.set('horizon', Array.isArray(query.horizon) ? query.horizon.join(',') : query.horizon);
  if (query.isCurrent !== undefined) params.set('isCurrent', String(query.isCurrent));
  if (query.minProbability !== undefined) params.set('minProbability', String(query.minProbability));
  if (query.maxProbability !== undefined) params.set('maxProbability', String(query.maxProbability));
  if (query.sortBy) params.set('sortBy', query.sortBy);
  if (query.sortOrder) params.set('sortOrder', query.sortOrder);
  if (query.limit !== undefined) params.set('limit', String(query.limit));
  if (query.offset !== undefined) params.set('offset', String(query.offset));

  const queryString = params.toString();
  return apiRequest(`/api/v1/risk-radar/snapshots/${snapshotId}/forecasts${queryString ? `?${queryString}` : ''}`);
}

/**
 * Create a new forecast for a snapshot
 */
export async function createForecast(
  snapshotId: string,
  input: CreateRiskRadarForecastInput
): Promise<ApiResponse<RiskRadarForecastGenerationResponse>> {
  return apiRequest(`/api/v1/risk-radar/snapshots/${snapshotId}/forecasts`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/**
 * Get a specific forecast
 */
export async function getForecast(forecastId: string): Promise<ApiResponse<RiskRadarForecast>> {
  return apiRequest(`/api/v1/risk-radar/forecasts/${forecastId}`);
}

/**
 * Regenerate a forecast
 */
export async function regenerateForecast(
  forecastId: string,
  input: RegenerateRiskRadarForecastInput = {}
): Promise<ApiResponse<RiskRadarForecastGenerationResponse>> {
  return apiRequest(`/api/v1/risk-radar/forecasts/${forecastId}/regenerate`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// ========================================
// Driver API
// ========================================

/**
 * List drivers for a snapshot
 */
export async function listDrivers(
  snapshotId: string,
  query: RiskRadarDriversQuery = {}
): Promise<ApiResponse<RiskRadarDriversListResponse>> {
  const params = new URLSearchParams();
  if (query.category) params.set('category', Array.isArray(query.category) ? query.category.join(',') : query.category);
  if (query.urgency) params.set('urgency', Array.isArray(query.urgency) ? query.urgency.join(',') : query.urgency);
  if (query.isEmerging !== undefined) params.set('isEmerging', String(query.isEmerging));
  if (query.isTurningPoint !== undefined) params.set('isTurningPoint', String(query.isTurningPoint));
  if (query.minImpactScore !== undefined) params.set('minImpactScore', String(query.minImpactScore));
  if (query.sortBy) params.set('sortBy', query.sortBy);
  if (query.sortOrder) params.set('sortOrder', query.sortOrder);
  if (query.limit !== undefined) params.set('limit', String(query.limit));
  if (query.offset !== undefined) params.set('offset', String(query.offset));

  const queryString = params.toString();
  return apiRequest(`/api/v1/risk-radar/snapshots/${snapshotId}/drivers${queryString ? `?${queryString}` : ''}`);
}

/**
 * Identify drivers from indicators
 */
export async function identifyDrivers(
  snapshotId: string
): Promise<ApiResponse<{ drivers: RiskRadarDriver[]; count: number }>> {
  return apiRequest(`/api/v1/risk-radar/snapshots/${snapshotId}/drivers/identify`, {
    method: 'POST',
  });
}

// ========================================
// Note API
// ========================================

/**
 * List notes for a snapshot
 */
export async function listNotes(
  snapshotId: string,
  query: RiskRadarNotesQuery = {}
): Promise<ApiResponse<RiskRadarNotesListResponse>> {
  const params = new URLSearchParams();
  if (query.noteType) params.set('noteType', Array.isArray(query.noteType) ? query.noteType.join(',') : query.noteType);
  if (query.isExecutiveVisible !== undefined) params.set('isExecutiveVisible', String(query.isExecutiveVisible));
  if (query.isPinned !== undefined) params.set('isPinned', String(query.isPinned));
  if (query.createdBy) params.set('createdBy', query.createdBy);
  if (query.sortBy) params.set('sortBy', query.sortBy);
  if (query.sortOrder) params.set('sortOrder', query.sortOrder);
  if (query.limit !== undefined) params.set('limit', String(query.limit));
  if (query.offset !== undefined) params.set('offset', String(query.offset));

  const queryString = params.toString();
  return apiRequest(`/api/v1/risk-radar/snapshots/${snapshotId}/notes${queryString ? `?${queryString}` : ''}`);
}

/**
 * Create a new note for a snapshot
 */
export async function createNote(
  snapshotId: string,
  input: CreateRiskRadarNoteInput
): Promise<ApiResponse<RiskRadarNote>> {
  return apiRequest(`/api/v1/risk-radar/snapshots/${snapshotId}/notes`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/**
 * Update a note
 */
export async function updateNote(
  noteId: string,
  input: UpdateRiskRadarNoteInput
): Promise<ApiResponse<RiskRadarNote>> {
  return apiRequest(`/api/v1/risk-radar/notes/${noteId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

/**
 * Delete a note
 */
export async function deleteNote(noteId: string): Promise<ApiResponse<void>> {
  return apiRequest(`/api/v1/risk-radar/notes/${noteId}`, {
    method: 'DELETE',
  });
}

// ========================================
// Helper Functions
// ========================================

/**
 * Format relative time for display
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

/**
 * Get risk level label for display
 */
export function getRiskLevelLabel(level: RiskRadarLevel): string {
  const labels: Record<RiskRadarLevel, string> = {
    low: 'Low Risk',
    medium: 'Medium Risk',
    high: 'High Risk',
    critical: 'Critical Risk',
  };
  return labels[level] || level;
}

/**
 * Get risk level color
 */
export function getRiskLevelColor(level: RiskRadarLevel): string {
  const colors: Record<RiskRadarLevel, string> = {
    low: 'green',
    medium: 'yellow',
    high: 'orange',
    critical: 'red',
  };
  return colors[level] || 'gray';
}

/**
 * Get indicator type label
 */
export function getIndicatorTypeLabel(type: RiskRadarIndicatorType): string {
  const labels: Record<RiskRadarIndicatorType, string> = {
    sentiment: 'Sentiment',
    velocity: 'Velocity',
    alerts: 'Alerts',
    competitive: 'Competitive',
    governance: 'Governance',
    persona: 'Persona',
    media_coverage: 'Media Coverage',
    crisis_history: 'Crisis History',
    reputation: 'Reputation',
  };
  return labels[type] || type;
}

/**
 * Get forecast horizon label
 */
export function getHorizonLabel(horizon: RiskRadarForecastHorizon): string {
  const labels: Record<RiskRadarForecastHorizon, string> = {
    '24h': '24 Hours',
    '72h': '72 Hours',
    '7d': '7 Days',
    '14d': '14 Days',
    '30d': '30 Days',
  };
  return labels[horizon] || horizon;
}

/**
 * Get driver category label
 */
export function getDriverCategoryLabel(category: RiskRadarDriverCategory): string {
  const labels: Record<RiskRadarDriverCategory, string> = {
    sentiment_shift: 'Sentiment Shift',
    velocity_spike: 'Velocity Spike',
    competitive_pressure: 'Competitive Pressure',
    governance_violation: 'Governance Violation',
    media_surge: 'Media Surge',
    crisis_pattern: 'Crisis Pattern',
    persona_sensitivity: 'Persona Sensitivity',
    external_event: 'External Event',
    reputation_decline: 'Reputation Decline',
  };
  return labels[category] || category;
}

/**
 * Get note type label
 */
export function getNoteTypeLabel(type: RiskRadarNoteType): string {
  const labels: Record<RiskRadarNoteType, string> = {
    observation: 'Observation',
    action_taken: 'Action Taken',
    escalation: 'Escalation',
    resolution: 'Resolution',
    context: 'Context',
    executive_comment: 'Executive Comment',
  };
  return labels[type] || type;
}

/**
 * Get trend direction label
 */
export function getTrendDirectionLabel(direction: RiskRadarTrendDirection): string {
  const labels: Record<RiskRadarTrendDirection, string> = {
    improving: 'Improving',
    stable: 'Stable',
    worsening: 'Worsening',
    volatile: 'Volatile',
  };
  return labels[direction] || direction;
}

/**
 * Get trend direction color
 */
export function getTrendDirectionColor(direction: RiskRadarTrendDirection): string {
  const colors: Record<RiskRadarTrendDirection, string> = {
    improving: 'green',
    stable: 'gray',
    worsening: 'red',
    volatile: 'orange',
  };
  return colors[direction] || 'gray';
}

/**
 * Format probability as percentage
 */
export function formatProbability(probability: number): string {
  return `${Math.round(probability * 100)}%`;
}

/**
 * Format risk index with level indicator
 */
export function formatRiskIndex(index: number, level: RiskRadarLevel): string {
  return `${index}/100 (${getRiskLevelLabel(level)})`;
}

// ========================================
// Type Aliases for convenience
// ========================================

/** Alias for RiskRadarLevel for simpler imports */
export type RiskLevel = RiskRadarLevel;

// ========================================
// API Object (for object-style imports)
// ========================================

/**
 * Risk Radar API object for use with object-style imports
 */
export const riskRadarApi = {
  // Dashboard
  getDashboard,
  // Snapshots
  listSnapshots,
  createSnapshot,
  getActiveSnapshot,
  getSnapshot,
  getSnapshotDetail,
  updateSnapshot,
  archiveSnapshot,
  // Indicators
  listIndicators,
  rebuildIndicators,
  // Forecasts
  listForecasts,
  createForecast,
  generateForecast: createForecast,
  getForecast,
  regenerateForecast,
  // Drivers
  listDrivers,
  identifyDrivers,
  // Notes
  listNotes,
  createNote: createNote as (snapshotId: string, input: CreateRiskRadarNoteInput) => Promise<ApiResponse<RiskRadarNote>>,
  addNote: createNote,
  updateNote,
  deleteNote,
};
