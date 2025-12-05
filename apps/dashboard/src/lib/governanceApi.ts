/**
 * Governance API Client (Sprint S59)
 * Frontend API layer for governance, compliance & audit intelligence engine
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

export type GovernancePolicyCategory =
  | 'content'
  | 'crisis'
  | 'reputation'
  | 'journalist'
  | 'legal'
  | 'data_privacy'
  | 'media_relations'
  | 'executive_comms'
  | 'competitive_intel'
  | 'brand_safety';

export type GovernancePolicyScope =
  | 'global'
  | 'brand'
  | 'campaign'
  | 'journalist'
  | 'region'
  | 'channel'
  | 'team';

export type GovernanceSeverityLevel = 'low' | 'medium' | 'high' | 'critical';

export type GovernanceRuleType =
  | 'threshold'
  | 'pattern'
  | 'blacklist'
  | 'whitelist'
  | 'time_window'
  | 'compound'
  | 'frequency'
  | 'sentiment'
  | 'relationship'
  | 'approval_required';

export type GovernanceTargetSystem =
  | 'media_monitoring'
  | 'crisis'
  | 'reputation'
  | 'outreach'
  | 'briefings'
  | 'journalists'
  | 'press_releases'
  | 'pitches'
  | 'media_lists'
  | 'personas'
  | 'competitive_intel';

export type GovernanceFindingStatus =
  | 'open'
  | 'acknowledged'
  | 'in_progress'
  | 'resolved'
  | 'dismissed'
  | 'escalated';

export type GovernanceEntityType =
  | 'brand'
  | 'campaign'
  | 'journalist'
  | 'story'
  | 'channel'
  | 'outlet'
  | 'spokesperson'
  | 'competitor'
  | 'region';

export type GovernanceScoreTrend = 'improving' | 'stable' | 'worsening';

export type GovernanceEvaluationMode = 'on_event' | 'scheduled' | 'manual';

export type GovernanceInsightGenerationMethod = 'rule_based' | 'llm_assisted' | 'hybrid';

// ========================================
// Entity Interfaces
// ========================================

export interface GovernancePolicy {
  id: string;
  orgId: string;
  key: string;
  name: string;
  description?: string;
  category: GovernancePolicyCategory;
  scope: GovernancePolicyScope;
  severity: GovernanceSeverityLevel;
  ruleConfig: Record<string, unknown>;
  isActive: boolean;
  isArchived: boolean;
  ownerUserId?: string;
  department?: string;
  regulatoryReference?: string;
  effectiveDate?: string;
  reviewDate?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GovernanceRule {
  id: string;
  orgId: string;
  policyId: string;
  name: string;
  description?: string;
  ruleType: GovernanceRuleType;
  targetSystem: GovernanceTargetSystem;
  condition: Record<string, unknown>;
  action: Record<string, unknown>;
  priority: number;
  isActive: boolean;
  evaluationMode: GovernanceEvaluationMode;
  scheduleCron?: string;
  cooldownMinutes: number;
  maxFindingsPerDay?: number;
  tags: string[];
  metadata: Record<string, unknown>;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GovernanceAffectedEntity {
  entityType: GovernanceEntityType;
  entityId: string;
  entityName?: string;
  impact?: 'direct' | 'indirect';
}

export interface GovernanceRecommendedAction {
  action: string;
  priority: 'immediate' | 'high' | 'medium' | 'low';
  assignee?: string;
  dueDate?: string;
  completed?: boolean;
}

export interface GovernanceFinding {
  id: string;
  orgId: string;
  policyId: string;
  ruleId: string;
  sourceSystem: GovernanceTargetSystem;
  sourceReferenceId: string;
  sourceReferenceType?: string;
  severity: GovernanceSeverityLevel;
  status: GovernanceFindingStatus;
  summary: string;
  details?: string;
  impactScore?: number;
  affectedEntities: GovernanceAffectedEntity[];
  recommendedActions: GovernanceRecommendedAction[];
  mitigationNotes?: string;
  assignedTo?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
  detectedAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  dismissedAt?: string;
  metadata: Record<string, unknown>;
  eventSnapshot: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface GovernanceContributingFactor {
  source: string;
  factor: string;
  contribution: number;
  trend?: GovernanceScoreTrend;
}

export interface GovernanceRiskScore {
  id: string;
  orgId: string;
  entityType: GovernanceEntityType;
  entityId: string;
  entityName?: string;
  overallScore: number;
  riskLevel: GovernanceSeverityLevel;
  contentRisk?: number;
  reputationRisk?: number;
  crisisRisk?: number;
  legalRisk?: number;
  relationshipRisk?: number;
  competitiveRisk?: number;
  previousScore?: number;
  scoreTrend?: GovernanceScoreTrend;
  trendPeriodDays: number;
  breakdown: Record<string, unknown>;
  contributingFactors: GovernanceContributingFactor[];
  activeFindingsCount: number;
  linkedFindingIds: string[];
  computedAt: string;
  computationMethod: string;
  confidenceScore?: number;
  validUntil?: string;
  isStale: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GovernanceInsightRecommendation {
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category?: string;
  estimatedImpact?: string;
}

export interface GovernanceInsightActionItem {
  action: string;
  assignee?: string;
  dueDate?: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface GovernanceInsightTopRisk {
  entityType: GovernanceEntityType;
  entityId: string;
  entityName?: string;
  riskScore: number;
  riskLevel: GovernanceSeverityLevel;
  primaryConcern: string;
  trend?: GovernanceScoreTrend;
}

export interface GovernanceAuditInsight {
  id: string;
  orgId: string;
  timeWindowStart: string;
  timeWindowEnd: string;
  insightType: string;
  scope: GovernancePolicyScope;
  title: string;
  summary: string;
  executiveSummary?: string;
  detailedAnalysis?: string;
  recommendations: GovernanceInsightRecommendation[];
  actionItems: GovernanceInsightActionItem[];
  topRisks: GovernanceInsightTopRisk[];
  riskDistribution: Record<string, number>;
  metricsSnapshot: Record<string, unknown>;
  trendAnalysis: Record<string, unknown>;
  linkedFindings: string[];
  findingsCount: number;
  resolvedFindingsCount: number;
  generatedBy: GovernanceInsightGenerationMethod;
  llmModel?: string;
  generationPrompt?: string;
  tokensUsed?: number;
  distributedAt?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GovernancePolicyVersion {
  id: string;
  orgId: string;
  policyId: string;
  versionNumber: number;
  policySnapshot: Record<string, unknown>;
  changeSummary?: string;
  changedFields: string[];
  createdBy?: string;
  createdAt: string;
}

// ========================================
// Response Types
// ========================================

export interface GovernancePoliciesListResponse {
  policies: GovernancePolicy[];
  total: number;
  hasMore: boolean;
}

export interface GovernancePolicyDetailResponse {
  policy: GovernancePolicy;
  rules: GovernanceRule[];
  rulesCount: number;
  activeFindingsCount: number;
  recentFindings: GovernanceFinding[];
}

export interface GovernanceRulesListResponse {
  rules: GovernanceRule[];
  total: number;
  hasMore: boolean;
}

export interface GovernanceFindingsListResponse {
  findings: GovernanceFinding[];
  total: number;
  hasMore: boolean;
}

export interface GovernanceFindingDetailResponse {
  finding: GovernanceFinding;
  policy: GovernancePolicy;
  rule: GovernanceRule;
  relatedFindings: GovernanceFinding[];
}

export interface GovernanceRiskScoresListResponse {
  riskScores: GovernanceRiskScore[];
  total: number;
  hasMore: boolean;
}

export interface GovernanceAuditInsightsListResponse {
  insights: GovernanceAuditInsight[];
  total: number;
  hasMore: boolean;
}

export interface GovernancePolicyVersionsResponse {
  versions: GovernancePolicyVersion[];
  total: number;
}

export interface GovernanceDashboardSummary {
  totalPolicies: number;
  activePolicies: number;
  policiesByCategory: Record<GovernancePolicyCategory, number>;
  policiesBySeverity: Record<GovernanceSeverityLevel, number>;
  totalRules: number;
  activeRules: number;
  rulesByType: Record<GovernanceRuleType, number>;
  rulesByTargetSystem: Record<GovernanceTargetSystem, number>;
  totalFindings: number;
  openFindings: number;
  findingsByStatus: Record<GovernanceFindingStatus, number>;
  findingsBySeverity: Record<GovernanceSeverityLevel, number>;
  findingsTrend: { period: string; count: number; resolved: number }[];
  highRiskEntities: number;
  avgRiskScore: number;
  riskTrend: GovernanceScoreTrend;
  topRisks: GovernanceInsightTopRisk[];
  lastUpdated: string;
}

export interface GovernanceComplianceMetrics {
  complianceScore: number;
  policyCoverage: number;
  ruleEffectiveness: number;
  resolutionRate: number;
  meanTimeToResolution: number;
  findingsPerDay: number;
  trendsVsPreviousPeriod: {
    complianceScoreChange: number;
    findingsChange: number;
    resolutionRateChange: number;
  };
}

export interface GovernanceRiskHeatmapCell {
  entityType: GovernanceEntityType;
  riskDimension: string;
  score: number;
  trend: GovernanceScoreTrend;
  findingsCount: number;
}

export interface GovernanceRiskHeatmapResponse {
  cells: GovernanceRiskHeatmapCell[];
  entityTypes: GovernanceEntityType[];
  riskDimensions: string[];
}

export interface GovernanceEvaluationResult {
  ruleId: string;
  triggered: boolean;
  conditionsMet: boolean;
  findingCreated?: string;
  actionsTaken: string[];
  evaluationDuration: number;
  error?: string;
}

export interface GovernanceBatchEvaluationResponse {
  results: GovernanceEvaluationResult[];
  totalRulesEvaluated: number;
  findingsCreated: number;
  duration: number;
}

// ========================================
// Query Types
// ========================================

export interface GovernancePoliciesQuery {
  category?: GovernancePolicyCategory | GovernancePolicyCategory[];
  scope?: GovernancePolicyScope | GovernancePolicyScope[];
  severity?: GovernanceSeverityLevel | GovernanceSeverityLevel[];
  isActive?: boolean;
  isArchived?: boolean;
  ownerUserId?: string;
  department?: string;
  searchQuery?: string;
  sortBy?: 'created_at' | 'updated_at' | 'name' | 'severity';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface GovernanceRulesQuery {
  policyId?: string;
  ruleType?: GovernanceRuleType | GovernanceRuleType[];
  targetSystem?: GovernanceTargetSystem | GovernanceTargetSystem[];
  isActive?: boolean;
  evaluationMode?: GovernanceEvaluationMode;
  tags?: string[];
  searchQuery?: string;
  sortBy?: 'created_at' | 'updated_at' | 'name' | 'priority';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface GovernanceFindingsQuery {
  policyId?: string;
  ruleId?: string;
  sourceSystem?: GovernanceTargetSystem | GovernanceTargetSystem[];
  severity?: GovernanceSeverityLevel | GovernanceSeverityLevel[];
  status?: GovernanceFindingStatus | GovernanceFindingStatus[];
  assignedTo?: string;
  detectedAfter?: string;
  detectedBefore?: string;
  searchQuery?: string;
  sortBy?: 'detected_at' | 'severity' | 'status' | 'impact_score';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface GovernanceRiskScoresQuery {
  entityType?: GovernanceEntityType | GovernanceEntityType[];
  riskLevel?: GovernanceSeverityLevel | GovernanceSeverityLevel[];
  minOverallScore?: number;
  maxOverallScore?: number;
  scoreTrend?: GovernanceScoreTrend;
  isStale?: boolean;
  sortBy?: 'overall_score' | 'computed_at' | 'entity_name';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface GovernanceAuditInsightsQuery {
  insightType?: string;
  scope?: GovernancePolicyScope | GovernancePolicyScope[];
  timeWindowStart?: string;
  timeWindowEnd?: string;
  generatedBy?: GovernanceInsightGenerationMethod;
  sortBy?: 'created_at' | 'time_window_start' | 'title';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// ========================================
// Input Types
// ========================================

export interface CreateGovernancePolicyInput {
  key: string;
  name: string;
  description?: string;
  category: GovernancePolicyCategory;
  scope?: GovernancePolicyScope;
  severity?: GovernanceSeverityLevel;
  ruleConfig?: Record<string, unknown>;
  isActive?: boolean;
  ownerUserId?: string;
  department?: string;
  regulatoryReference?: string;
  effectiveDate?: string;
  reviewDate?: string;
}

export interface UpdateGovernancePolicyInput {
  name?: string;
  description?: string | null;
  category?: GovernancePolicyCategory;
  scope?: GovernancePolicyScope;
  severity?: GovernanceSeverityLevel;
  ruleConfig?: Record<string, unknown>;
  isActive?: boolean;
  isArchived?: boolean;
  ownerUserId?: string | null;
  department?: string | null;
  regulatoryReference?: string | null;
  effectiveDate?: string | null;
  reviewDate?: string | null;
}

export interface CreateGovernanceRuleInput {
  policyId: string;
  name: string;
  description?: string;
  ruleType: GovernanceRuleType;
  targetSystem: GovernanceTargetSystem;
  condition: Record<string, unknown>;
  action: Record<string, unknown>;
  priority?: number;
  isActive?: boolean;
  evaluationMode?: GovernanceEvaluationMode;
  scheduleCron?: string;
  cooldownMinutes?: number;
  maxFindingsPerDay?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface UpdateGovernanceRuleInput {
  name?: string;
  description?: string | null;
  ruleType?: GovernanceRuleType;
  targetSystem?: GovernanceTargetSystem;
  condition?: Record<string, unknown>;
  action?: Record<string, unknown>;
  priority?: number;
  isActive?: boolean;
  evaluationMode?: GovernanceEvaluationMode;
  scheduleCron?: string | null;
  cooldownMinutes?: number;
  maxFindingsPerDay?: number | null;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface UpsertGovernanceRiskScoreInput {
  entityType: GovernanceEntityType;
  entityId: string;
  entityName?: string;
  overallScore: number;
  riskLevel: GovernanceSeverityLevel;
  contentRisk?: number;
  reputationRisk?: number;
  crisisRisk?: number;
  legalRisk?: number;
  relationshipRisk?: number;
  competitiveRisk?: number;
  breakdown?: Record<string, unknown>;
  contributingFactors?: GovernanceContributingFactor[];
  linkedFindingIds?: string[];
  computationMethod?: string;
  confidenceScore?: number;
  validUntil?: string;
}

export interface GenerateGovernanceInsightRequest {
  timeWindowStart: string;
  timeWindowEnd: string;
  scope?: GovernancePolicyScope;
  insightType?: string;
  useLlm?: boolean;
  llmModel?: string;
}

// ========================================
// API Functions - Policies
// ========================================

function buildQueryString(query: Record<string, unknown>): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      params.set(key, value.join(','));
    } else {
      params.set(key, String(value));
    }
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

export async function listPolicies(
  query: GovernancePoliciesQuery = {}
): Promise<GovernancePoliciesListResponse> {
  const path = `/api/v1/governance/policies${buildQueryString(query as Record<string, unknown>)}`;
  const response = await apiRequest<GovernancePoliciesListResponse>(path);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to list policies');
  }

  return response.data;
}

export async function getPolicy(id: string): Promise<GovernancePolicyDetailResponse> {
  const response = await apiRequest<GovernancePolicyDetailResponse>(
    `/api/v1/governance/policies/${id}`
  );

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to get policy');
  }

  return response.data;
}

export async function createPolicy(
  input: CreateGovernancePolicyInput
): Promise<GovernancePolicy> {
  const response = await apiRequest<GovernancePolicy>('/api/v1/governance/policies', {
    method: 'POST',
    body: JSON.stringify(input),
  });

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to create policy');
  }

  return response.data;
}

export async function updatePolicy(
  id: string,
  input: UpdateGovernancePolicyInput
): Promise<GovernancePolicy> {
  const response = await apiRequest<GovernancePolicy>(
    `/api/v1/governance/policies/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    }
  );

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to update policy');
  }

  return response.data;
}

export async function deletePolicy(id: string): Promise<void> {
  const response = await apiRequest(`/api/v1/governance/policies/${id}`, {
    method: 'DELETE',
  });

  if (!response.success) {
    throw new Error(response.error?.message || 'Failed to delete policy');
  }
}

export async function getPolicyVersions(
  policyId: string
): Promise<GovernancePolicyVersionsResponse> {
  const response = await apiRequest<GovernancePolicyVersionsResponse>(
    `/api/v1/governance/policies/${policyId}/versions`
  );

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to get policy versions');
  }

  return response.data;
}

// ========================================
// API Functions - Rules
// ========================================

export async function listRules(
  query: GovernanceRulesQuery = {}
): Promise<GovernanceRulesListResponse> {
  const path = `/api/v1/governance/rules${buildQueryString(query as Record<string, unknown>)}`;
  const response = await apiRequest<GovernanceRulesListResponse>(path);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to list rules');
  }

  return response.data;
}

export async function getRule(id: string): Promise<GovernanceRule> {
  const response = await apiRequest<GovernanceRule>(
    `/api/v1/governance/rules/${id}`
  );

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to get rule');
  }

  return response.data;
}

export async function createRule(
  input: CreateGovernanceRuleInput
): Promise<GovernanceRule> {
  const response = await apiRequest<GovernanceRule>('/api/v1/governance/rules', {
    method: 'POST',
    body: JSON.stringify(input),
  });

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to create rule');
  }

  return response.data;
}

export async function updateRule(
  id: string,
  input: UpdateGovernanceRuleInput
): Promise<GovernanceRule> {
  const response = await apiRequest<GovernanceRule>(
    `/api/v1/governance/rules/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    }
  );

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to update rule');
  }

  return response.data;
}

export async function deleteRule(id: string): Promise<void> {
  const response = await apiRequest(`/api/v1/governance/rules/${id}`, {
    method: 'DELETE',
  });

  if (!response.success) {
    throw new Error(response.error?.message || 'Failed to delete rule');
  }
}

// ========================================
// API Functions - Findings
// ========================================

export async function listFindings(
  query: GovernanceFindingsQuery = {}
): Promise<GovernanceFindingsListResponse> {
  const path = `/api/v1/governance/findings${buildQueryString(query as Record<string, unknown>)}`;
  const response = await apiRequest<GovernanceFindingsListResponse>(path);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to list findings');
  }

  return response.data;
}

export async function getFinding(id: string): Promise<GovernanceFindingDetailResponse> {
  const response = await apiRequest<GovernanceFindingDetailResponse>(
    `/api/v1/governance/findings/${id}`
  );

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to get finding');
  }

  return response.data;
}

export async function acknowledgeFinding(
  id: string,
  notes?: string
): Promise<GovernanceFinding> {
  const response = await apiRequest<GovernanceFinding>(
    `/api/v1/governance/findings/${id}/acknowledge`,
    {
      method: 'POST',
      body: JSON.stringify({ notes }),
    }
  );

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to acknowledge finding');
  }

  return response.data;
}

export async function resolveFinding(
  id: string,
  resolutionNotes: string
): Promise<GovernanceFinding> {
  const response = await apiRequest<GovernanceFinding>(
    `/api/v1/governance/findings/${id}/resolve`,
    {
      method: 'POST',
      body: JSON.stringify({ resolutionNotes }),
    }
  );

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to resolve finding');
  }

  return response.data;
}

export async function dismissFinding(
  id: string,
  reason: string
): Promise<GovernanceFinding> {
  const response = await apiRequest<GovernanceFinding>(
    `/api/v1/governance/findings/${id}/dismiss`,
    {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }
  );

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to dismiss finding');
  }

  return response.data;
}

export async function escalateFinding(
  id: string,
  escalateTo: string,
  notes?: string
): Promise<GovernanceFinding> {
  const response = await apiRequest<GovernanceFinding>(
    `/api/v1/governance/findings/${id}/escalate`,
    {
      method: 'POST',
      body: JSON.stringify({ escalateTo, notes }),
    }
  );

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to escalate finding');
  }

  return response.data;
}

// ========================================
// API Functions - Risk Scores
// ========================================

export async function listRiskScores(
  query: GovernanceRiskScoresQuery = {}
): Promise<GovernanceRiskScoresListResponse> {
  const path = `/api/v1/governance/risk-scores${buildQueryString(query as Record<string, unknown>)}`;
  const response = await apiRequest<GovernanceRiskScoresListResponse>(path);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to list risk scores');
  }

  return response.data;
}

export async function upsertRiskScore(
  input: UpsertGovernanceRiskScoreInput
): Promise<GovernanceRiskScore> {
  const response = await apiRequest<GovernanceRiskScore>(
    '/api/v1/governance/risk-scores',
    {
      method: 'PUT',
      body: JSON.stringify(input),
    }
  );

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to upsert risk score');
  }

  return response.data;
}

export async function recalculateRiskScore(
  entityType: GovernanceEntityType,
  entityId: string,
  force?: boolean
): Promise<GovernanceRiskScore> {
  const response = await apiRequest<GovernanceRiskScore>(
    '/api/v1/governance/risk-scores/recalculate',
    {
      method: 'POST',
      body: JSON.stringify({ entityType, entityId, force }),
    }
  );

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to recalculate risk score');
  }

  return response.data;
}

// ========================================
// API Functions - Audit Insights
// ========================================

export async function listInsights(
  query: GovernanceAuditInsightsQuery = {}
): Promise<GovernanceAuditInsightsListResponse> {
  const path = `/api/v1/governance/insights${buildQueryString(query as Record<string, unknown>)}`;
  const response = await apiRequest<GovernanceAuditInsightsListResponse>(path);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to list insights');
  }

  return response.data;
}

export async function getInsight(id: string): Promise<GovernanceAuditInsight> {
  const response = await apiRequest<GovernanceAuditInsight>(
    `/api/v1/governance/insights/${id}`
  );

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to get insight');
  }

  return response.data;
}

export async function generateInsight(
  request: GenerateGovernanceInsightRequest
): Promise<GovernanceAuditInsight> {
  const response = await apiRequest<GovernanceAuditInsight>(
    '/api/v1/governance/insights/generate',
    {
      method: 'POST',
      body: JSON.stringify(request),
    }
  );

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to generate insight');
  }

  return response.data;
}

// ========================================
// API Functions - Dashboard & Analytics
// ========================================

export async function getDashboardSummary(): Promise<GovernanceDashboardSummary> {
  const response = await apiRequest<GovernanceDashboardSummary>(
    '/api/v1/governance/dashboard'
  );

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to get dashboard summary');
  }

  return response.data;
}

export async function getComplianceMetrics(
  days: number = 30
): Promise<GovernanceComplianceMetrics> {
  const response = await apiRequest<GovernanceComplianceMetrics>(
    `/api/v1/governance/compliance-metrics?days=${days}`
  );

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to get compliance metrics');
  }

  return response.data;
}

export async function getRiskHeatmap(): Promise<GovernanceRiskHeatmapResponse> {
  const response = await apiRequest<GovernanceRiskHeatmapResponse>(
    '/api/v1/governance/risk-heatmap'
  );

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to get risk heatmap');
  }

  return response.data;
}

// ========================================
// API Functions - Rule Evaluation
// ========================================

export async function evaluateRules(
  context: {
    sourceSystem: GovernanceTargetSystem;
    eventType: string;
    eventId: string;
    eventData: Record<string, unknown>;
    timestamp: string;
    metadata?: Record<string, unknown>;
  },
  ruleIds?: string[]
): Promise<GovernanceBatchEvaluationResponse> {
  const response = await apiRequest<GovernanceBatchEvaluationResponse>(
    '/api/v1/governance/evaluate',
    {
      method: 'POST',
      body: JSON.stringify({ context, ruleIds }),
    }
  );

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to evaluate rules');
  }

  return response.data;
}

// ========================================
// Helper Functions
// ========================================

export function getSeverityColor(severity: GovernanceSeverityLevel): string {
  switch (severity) {
    case 'low':
      return 'green';
    case 'medium':
      return 'yellow';
    case 'high':
      return 'orange';
    case 'critical':
      return 'red';
    default:
      return 'gray';
  }
}

export function getSeverityBgColor(severity: GovernanceSeverityLevel): string {
  switch (severity) {
    case 'low':
      return 'bg-green-100 text-green-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'high':
      return 'bg-orange-100 text-orange-800';
    case 'critical':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getStatusColor(status: GovernanceFindingStatus): string {
  switch (status) {
    case 'open':
      return 'red';
    case 'acknowledged':
      return 'yellow';
    case 'in_progress':
      return 'blue';
    case 'resolved':
      return 'green';
    case 'dismissed':
      return 'gray';
    case 'escalated':
      return 'purple';
    default:
      return 'gray';
  }
}

export function getStatusBgColor(status: GovernanceFindingStatus): string {
  switch (status) {
    case 'open':
      return 'bg-red-100 text-red-800';
    case 'acknowledged':
      return 'bg-yellow-100 text-yellow-800';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800';
    case 'resolved':
      return 'bg-green-100 text-green-800';
    case 'dismissed':
      return 'bg-gray-100 text-gray-800';
    case 'escalated':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getTrendIcon(trend: GovernanceScoreTrend): string {
  switch (trend) {
    case 'improving':
      return 'trending-down'; // Lower risk = better
    case 'worsening':
      return 'trending-up'; // Higher risk = worse
    case 'stable':
      return 'minus';
    default:
      return 'minus';
  }
}

export function getTrendColor(trend: GovernanceScoreTrend): string {
  switch (trend) {
    case 'improving':
      return 'green';
    case 'worsening':
      return 'red';
    case 'stable':
      return 'gray';
    default:
      return 'gray';
  }
}

export function getCategoryLabel(category: GovernancePolicyCategory): string {
  const labels: Record<GovernancePolicyCategory, string> = {
    content: 'Content',
    crisis: 'Crisis',
    reputation: 'Reputation',
    journalist: 'Journalist',
    legal: 'Legal',
    data_privacy: 'Data Privacy',
    media_relations: 'Media Relations',
    executive_comms: 'Executive Comms',
    competitive_intel: 'Competitive Intel',
    brand_safety: 'Brand Safety',
  };
  return labels[category] || category;
}

export function getScopeLabel(scope: GovernancePolicyScope): string {
  const labels: Record<GovernancePolicyScope, string> = {
    global: 'Global',
    brand: 'Brand',
    campaign: 'Campaign',
    journalist: 'Journalist',
    region: 'Region',
    channel: 'Channel',
    team: 'Team',
  };
  return labels[scope] || scope;
}

export function getRuleTypeLabel(ruleType: GovernanceRuleType): string {
  const labels: Record<GovernanceRuleType, string> = {
    threshold: 'Threshold',
    pattern: 'Pattern',
    blacklist: 'Blacklist',
    whitelist: 'Whitelist',
    time_window: 'Time Window',
    compound: 'Compound',
    frequency: 'Frequency',
    sentiment: 'Sentiment',
    relationship: 'Relationship',
    approval_required: 'Approval Required',
  };
  return labels[ruleType] || ruleType;
}

export function getTargetSystemLabel(system: GovernanceTargetSystem): string {
  const labels: Record<GovernanceTargetSystem, string> = {
    media_monitoring: 'Media Monitoring',
    crisis: 'Crisis',
    reputation: 'Reputation',
    outreach: 'Outreach',
    briefings: 'Briefings',
    journalists: 'Journalists',
    press_releases: 'Press Releases',
    pitches: 'Pitches',
    media_lists: 'Media Lists',
    personas: 'Personas',
    competitive_intel: 'Competitive Intel',
  };
  return labels[system] || system;
}

export function getEntityTypeLabel(entityType: GovernanceEntityType): string {
  const labels: Record<GovernanceEntityType, string> = {
    brand: 'Brand',
    campaign: 'Campaign',
    journalist: 'Journalist',
    story: 'Story',
    channel: 'Channel',
    outlet: 'Outlet',
    spokesperson: 'Spokesperson',
    competitor: 'Competitor',
    region: 'Region',
  };
  return labels[entityType] || entityType;
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
