/**
 * Governance, Compliance & Audit Intelligence Engine Types (Sprint S59)
 * TypeScript types for centralized policy, compliance, and risk management
 */

// ========================================
// Enums as String Literal Types
// ========================================

/**
 * Policy category classification
 */
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

export const GovernancePolicyCategory = {
  CONTENT: 'content' as const,
  CRISIS: 'crisis' as const,
  REPUTATION: 'reputation' as const,
  JOURNALIST: 'journalist' as const,
  LEGAL: 'legal' as const,
  DATA_PRIVACY: 'data_privacy' as const,
  MEDIA_RELATIONS: 'media_relations' as const,
  EXECUTIVE_COMMS: 'executive_comms' as const,
  COMPETITIVE_INTEL: 'competitive_intel' as const,
  BRAND_SAFETY: 'brand_safety' as const,
};

/**
 * Policy scope definition
 */
export type GovernancePolicyScope =
  | 'global'
  | 'brand'
  | 'campaign'
  | 'journalist'
  | 'region'
  | 'channel'
  | 'team';

export const GovernancePolicyScope = {
  GLOBAL: 'global' as const,
  BRAND: 'brand' as const,
  CAMPAIGN: 'campaign' as const,
  JOURNALIST: 'journalist' as const,
  REGION: 'region' as const,
  CHANNEL: 'channel' as const,
  TEAM: 'team' as const,
};

/**
 * Severity levels for policies, findings, and risk scores
 */
export type GovernanceSeverityLevel = 'low' | 'medium' | 'high' | 'critical';

export const GovernanceSeverityLevel = {
  LOW: 'low' as const,
  MEDIUM: 'medium' as const,
  HIGH: 'high' as const,
  CRITICAL: 'critical' as const,
};

/**
 * Rule type classification
 */
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

export const GovernanceRuleType = {
  THRESHOLD: 'threshold' as const,
  PATTERN: 'pattern' as const,
  BLACKLIST: 'blacklist' as const,
  WHITELIST: 'whitelist' as const,
  TIME_WINDOW: 'time_window' as const,
  COMPOUND: 'compound' as const,
  FREQUENCY: 'frequency' as const,
  SENTIMENT: 'sentiment' as const,
  RELATIONSHIP: 'relationship' as const,
  APPROVAL_REQUIRED: 'approval_required' as const,
};

/**
 * Target systems that governance rules can apply to
 */
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

export const GovernanceTargetSystem = {
  MEDIA_MONITORING: 'media_monitoring' as const,
  CRISIS: 'crisis' as const,
  REPUTATION: 'reputation' as const,
  OUTREACH: 'outreach' as const,
  BRIEFINGS: 'briefings' as const,
  JOURNALISTS: 'journalists' as const,
  PRESS_RELEASES: 'press_releases' as const,
  PITCHES: 'pitches' as const,
  MEDIA_LISTS: 'media_lists' as const,
  PERSONAS: 'personas' as const,
  COMPETITIVE_INTEL: 'competitive_intel' as const,
};

/**
 * Finding status workflow states
 */
export type GovernanceFindingStatus =
  | 'open'
  | 'acknowledged'
  | 'in_progress'
  | 'resolved'
  | 'dismissed'
  | 'escalated';

export const GovernanceFindingStatus = {
  OPEN: 'open' as const,
  ACKNOWLEDGED: 'acknowledged' as const,
  IN_PROGRESS: 'in_progress' as const,
  RESOLVED: 'resolved' as const,
  DISMISSED: 'dismissed' as const,
  ESCALATED: 'escalated' as const,
};

/**
 * Entity types for risk scoring
 */
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

export const GovernanceEntityType = {
  BRAND: 'brand' as const,
  CAMPAIGN: 'campaign' as const,
  JOURNALIST: 'journalist' as const,
  STORY: 'story' as const,
  CHANNEL: 'channel' as const,
  OUTLET: 'outlet' as const,
  SPOKESPERSON: 'spokesperson' as const,
  COMPETITOR: 'competitor' as const,
  REGION: 'region' as const,
};

/**
 * Rule evaluation modes
 */
export type GovernanceEvaluationMode = 'on_event' | 'scheduled' | 'manual';

export const GovernanceEvaluationMode = {
  ON_EVENT: 'on_event' as const,
  SCHEDULED: 'scheduled' as const,
  MANUAL: 'manual' as const,
};

/**
 * Score trend indicators
 */
export type GovernanceScoreTrend = 'improving' | 'stable' | 'worsening';

export const GovernanceScoreTrend = {
  IMPROVING: 'improving' as const,
  STABLE: 'stable' as const,
  WORSENING: 'worsening' as const,
};

/**
 * Insight generation method
 */
export type GovernanceInsightGenerationMethod = 'rule_based' | 'llm_assisted' | 'hybrid';

export const GovernanceInsightGenerationMethod = {
  RULE_BASED: 'rule_based' as const,
  LLM_ASSISTED: 'llm_assisted' as const,
  HYBRID: 'hybrid' as const,
};

// ========================================
// Core Entity Interfaces
// ========================================

/**
 * Governance Policy - Central policy definition
 */
export interface GovernancePolicy {
  id: string;
  orgId: string;

  // Policy identification
  key: string;
  name: string;
  description?: string;

  // Classification
  category: GovernancePolicyCategory;
  scope: GovernancePolicyScope;
  severity: GovernanceSeverityLevel;

  // Configuration
  ruleConfig: Record<string, unknown>;

  // Status
  isActive: boolean;
  isArchived: boolean;

  // Ownership
  ownerUserId?: string;
  department?: string;

  // Compliance metadata
  regulatoryReference?: string;
  effectiveDate?: Date;
  reviewDate?: Date;

  // Audit
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Rule condition definition structure
 */
export interface GovernanceRuleCondition {
  field?: string;
  operator?: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'matches' | 'in' | 'not_in';
  value?: unknown;
  threshold?: number;
  pattern?: string;
  items?: string[];
  timeWindow?: {
    duration: number;
    unit: 'minutes' | 'hours' | 'days';
  };
  conditions?: GovernanceRuleCondition[];
  logic?: 'and' | 'or';
  [key: string]: unknown;
}

/**
 * Rule action definition structure
 */
export interface GovernanceRuleAction {
  type: 'create_finding' | 'notify' | 'block' | 'escalate' | 'log' | 'webhook';
  severity?: GovernanceSeverityLevel;
  message?: string;
  recipients?: string[];
  webhookUrl?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Governance Rule - Individual rule within a policy
 */
export interface GovernanceRule {
  id: string;
  orgId: string;
  policyId: string;

  // Rule identification
  name: string;
  description?: string;

  // Rule definition
  ruleType: GovernanceRuleType;
  targetSystem: GovernanceTargetSystem;

  // Rule logic
  condition: GovernanceRuleCondition;
  action: GovernanceRuleAction;

  // Execution settings
  priority: number;
  isActive: boolean;

  // Evaluation settings
  evaluationMode: GovernanceEvaluationMode;
  scheduleCron?: string;

  // Thresholds and limits
  cooldownMinutes: number;
  maxFindingsPerDay?: number;

  // Metadata
  tags: string[];
  metadata: Record<string, unknown>;

  // Audit
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Affected entity in a finding
 */
export interface GovernanceAffectedEntity {
  entityType: GovernanceEntityType;
  entityId: string;
  entityName?: string;
  impact?: 'direct' | 'indirect';
  [key: string]: unknown;
}

/**
 * Recommended action for a finding
 */
export interface GovernanceRecommendedAction {
  action: string;
  priority: 'immediate' | 'high' | 'medium' | 'low';
  assignee?: string;
  dueDate?: Date;
  completed?: boolean;
  [key: string]: unknown;
}

/**
 * Governance Finding - Concrete violation or warning
 */
export interface GovernanceFinding {
  id: string;
  orgId: string;
  policyId: string;
  ruleId: string;

  // Source identification
  sourceSystem: GovernanceTargetSystem;
  sourceReferenceId: string;
  sourceReferenceType?: string;

  // Finding classification
  severity: GovernanceSeverityLevel;
  status: GovernanceFindingStatus;

  // Finding details
  summary: string;
  details?: string;

  // Impact assessment
  impactScore?: number; // 0-100
  affectedEntities: GovernanceAffectedEntity[];

  // Recommended actions
  recommendedActions: GovernanceRecommendedAction[];
  mitigationNotes?: string;

  // Resolution tracking
  assignedTo?: string;
  resolvedBy?: string;
  resolutionNotes?: string;

  // Timestamps
  detectedAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  dismissedAt?: Date;

  // Context snapshot
  metadata: Record<string, unknown>;
  eventSnapshot: Record<string, unknown>;

  // Audit
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Contributing factor to a risk score
 */
export interface GovernanceContributingFactor {
  source: string;
  factor: string;
  contribution: number; // 0-100
  trend?: GovernanceScoreTrend;
  [key: string]: unknown;
}

/**
 * Governance Risk Score - Aggregated risk by entity
 */
export interface GovernanceRiskScore {
  id: string;
  orgId: string;

  // Entity identification
  entityType: GovernanceEntityType;
  entityId: string;
  entityName?: string;

  // Overall risk score
  overallScore: number; // 0-100
  riskLevel: GovernanceSeverityLevel;

  // Dimensional risk scores
  contentRisk?: number; // 0-100
  reputationRisk?: number; // 0-100
  crisisRisk?: number; // 0-100
  legalRisk?: number; // 0-100
  relationshipRisk?: number; // 0-100
  competitiveRisk?: number; // 0-100

  // Trend indicators
  previousScore?: number;
  scoreTrend?: GovernanceScoreTrend;
  trendPeriodDays: number;

  // Score breakdown
  breakdown: Record<string, unknown>;
  contributingFactors: GovernanceContributingFactor[];

  // Linked data
  activeFindingsCount: number;
  linkedFindingIds: string[];

  // Computation metadata
  computedAt: Date;
  computationMethod: string;
  confidenceScore?: number; // 0-1

  // Validity
  validUntil?: Date;
  isStale: boolean;

  // Audit
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Recommendation in an audit insight
 */
export interface GovernanceInsightRecommendation {
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category?: string;
  estimatedImpact?: string;
  [key: string]: unknown;
}

/**
 * Action item in an audit insight
 */
export interface GovernanceInsightActionItem {
  action: string;
  assignee?: string;
  dueDate?: Date;
  status: 'pending' | 'in_progress' | 'completed';
  [key: string]: unknown;
}

/**
 * Top risk item in an audit insight
 */
export interface GovernanceInsightTopRisk {
  entityType: GovernanceEntityType;
  entityId: string;
  entityName?: string;
  riskScore: number;
  riskLevel: GovernanceSeverityLevel;
  primaryConcern: string;
  trend?: GovernanceScoreTrend;
  [key: string]: unknown;
}

/**
 * Recipient for insight distribution
 */
export interface GovernanceInsightRecipient {
  userId?: string;
  email?: string;
  role?: string;
  sentAt?: Date;
  [key: string]: unknown;
}

/**
 * Governance Audit Insight - Higher-level reports and insights
 */
export interface GovernanceAuditInsight {
  id: string;
  orgId: string;

  // Time window
  timeWindowStart: Date;
  timeWindowEnd: Date;

  // Insight classification
  insightType: string;
  scope: GovernancePolicyScope;

  // Content
  title: string;
  summary: string;
  executiveSummary?: string;
  detailedAnalysis?: string;

  // Recommendations
  recommendations: GovernanceInsightRecommendation[];
  actionItems: GovernanceInsightActionItem[];

  // Risk overview
  topRisks: GovernanceInsightTopRisk[];
  riskDistribution: Record<string, number>;

  // Metrics snapshot
  metricsSnapshot: Record<string, unknown>;
  trendAnalysis: Record<string, unknown>;

  // Linked findings
  linkedFindings: string[];
  findingsCount: number;
  resolvedFindingsCount: number;

  // Generation metadata
  generatedBy: GovernanceInsightGenerationMethod;
  llmModel?: string;
  generationPrompt?: string;
  tokensUsed?: number;

  // Distribution
  recipients: GovernanceInsightRecipient[];
  distributedAt?: Date;

  // Audit
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Governance Policy Version - Version history for audit trail
 */
export interface GovernancePolicyVersion {
  id: string;
  orgId: string;
  policyId: string;

  versionNumber: number;

  // Snapshot of policy at this version
  policySnapshot: Record<string, unknown>;

  // Change tracking
  changeSummary?: string;
  changedFields: string[];

  // Audit
  createdBy?: string;
  createdAt: Date;
}

// ========================================
// Input/DTO Types for CRUD Operations
// ========================================

/**
 * Create policy input
 */
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
  effectiveDate?: Date;
  reviewDate?: Date;
}

/**
 * Update policy input
 */
export interface UpdateGovernancePolicyInput {
  name?: string;
  description?: string;
  category?: GovernancePolicyCategory;
  scope?: GovernancePolicyScope;
  severity?: GovernanceSeverityLevel;
  ruleConfig?: Record<string, unknown>;
  isActive?: boolean;
  isArchived?: boolean;
  ownerUserId?: string;
  department?: string;
  regulatoryReference?: string;
  effectiveDate?: Date;
  reviewDate?: Date;
}

/**
 * Create rule input
 */
export interface CreateGovernanceRuleInput {
  policyId: string;
  name: string;
  description?: string;
  ruleType: GovernanceRuleType;
  targetSystem: GovernanceTargetSystem;
  condition: GovernanceRuleCondition;
  action: GovernanceRuleAction;
  priority?: number;
  isActive?: boolean;
  evaluationMode?: GovernanceEvaluationMode;
  scheduleCron?: string;
  cooldownMinutes?: number;
  maxFindingsPerDay?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Update rule input
 */
export interface UpdateGovernanceRuleInput {
  name?: string;
  description?: string;
  ruleType?: GovernanceRuleType;
  targetSystem?: GovernanceTargetSystem;
  condition?: GovernanceRuleCondition;
  action?: GovernanceRuleAction;
  priority?: number;
  isActive?: boolean;
  evaluationMode?: GovernanceEvaluationMode;
  scheduleCron?: string;
  cooldownMinutes?: number;
  maxFindingsPerDay?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Create finding input (typically created by rule evaluation)
 */
export interface CreateGovernanceFindingInput {
  policyId: string;
  ruleId: string;
  sourceSystem: GovernanceTargetSystem;
  sourceReferenceId: string;
  sourceReferenceType?: string;
  severity: GovernanceSeverityLevel;
  summary: string;
  details?: string;
  impactScore?: number;
  affectedEntities?: GovernanceAffectedEntity[];
  recommendedActions?: GovernanceRecommendedAction[];
  metadata?: Record<string, unknown>;
  eventSnapshot?: Record<string, unknown>;
}

/**
 * Update finding input (status changes, resolution)
 */
export interface UpdateGovernanceFindingInput {
  status?: GovernanceFindingStatus;
  assignedTo?: string;
  mitigationNotes?: string;
  resolutionNotes?: string;
  recommendedActions?: GovernanceRecommendedAction[];
}

/**
 * Upsert risk score input
 */
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
  validUntil?: Date;
}

/**
 * Create audit insight input
 */
export interface CreateGovernanceAuditInsightInput {
  timeWindowStart: Date;
  timeWindowEnd: Date;
  insightType?: string;
  scope?: GovernancePolicyScope;
  title: string;
  summary: string;
  executiveSummary?: string;
  detailedAnalysis?: string;
  recommendations?: GovernanceInsightRecommendation[];
  actionItems?: GovernanceInsightActionItem[];
  topRisks?: GovernanceInsightTopRisk[];
  riskDistribution?: Record<string, number>;
  metricsSnapshot?: Record<string, unknown>;
  trendAnalysis?: Record<string, unknown>;
  linkedFindings?: string[];
  generatedBy?: GovernanceInsightGenerationMethod;
  llmModel?: string;
  generationPrompt?: string;
  tokensUsed?: number;
}

// ========================================
// Query Types
// ========================================

/**
 * Query parameters for listing policies
 */
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
  [key: string]: unknown;
}

/**
 * Query parameters for listing rules
 */
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
  [key: string]: unknown;
}

/**
 * Query parameters for listing findings
 */
export interface GovernanceFindingsQuery {
  policyId?: string;
  ruleId?: string;
  sourceSystem?: GovernanceTargetSystem | GovernanceTargetSystem[];
  severity?: GovernanceSeverityLevel | GovernanceSeverityLevel[];
  status?: GovernanceFindingStatus | GovernanceFindingStatus[];
  assignedTo?: string;
  detectedAfter?: Date;
  detectedBefore?: Date;
  searchQuery?: string;
  sortBy?: 'detected_at' | 'severity' | 'status' | 'impact_score';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  [key: string]: unknown;
}

/**
 * Query parameters for listing risk scores
 */
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
  [key: string]: unknown;
}

/**
 * Query parameters for listing audit insights
 */
export interface GovernanceAuditInsightsQuery {
  insightType?: string;
  scope?: GovernancePolicyScope | GovernancePolicyScope[];
  timeWindowStart?: Date;
  timeWindowEnd?: Date;
  generatedBy?: GovernanceInsightGenerationMethod;
  sortBy?: 'created_at' | 'time_window_start' | 'title';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  [key: string]: unknown;
}

// ========================================
// Response Types
// ========================================

/**
 * List policies response
 */
export interface GovernancePoliciesListResponse {
  policies: GovernancePolicy[];
  total: number;
  hasMore: boolean;
}

/**
 * Policy detail response with related rules
 */
export interface GovernancePolicyDetailResponse {
  policy: GovernancePolicy;
  rules: GovernanceRule[];
  rulesCount: number;
  activeFindingsCount: number;
  recentFindings: GovernanceFinding[];
}

/**
 * List rules response
 */
export interface GovernanceRulesListResponse {
  rules: GovernanceRule[];
  total: number;
  hasMore: boolean;
}

/**
 * List findings response
 */
export interface GovernanceFindingsListResponse {
  findings: GovernanceFinding[];
  total: number;
  hasMore: boolean;
}

/**
 * Finding detail response with policy and rule context
 */
export interface GovernanceFindingDetailResponse {
  finding: GovernanceFinding;
  policy: GovernancePolicy;
  rule: GovernanceRule;
  relatedFindings: GovernanceFinding[];
}

/**
 * List risk scores response
 */
export interface GovernanceRiskScoresListResponse {
  riskScores: GovernanceRiskScore[];
  total: number;
  hasMore: boolean;
}

/**
 * List audit insights response
 */
export interface GovernanceAuditInsightsListResponse {
  insights: GovernanceAuditInsight[];
  total: number;
  hasMore: boolean;
}

/**
 * Policy versions response
 */
export interface GovernancePolicyVersionsResponse {
  versions: GovernancePolicyVersion[];
  total: number;
}

// ========================================
// Dashboard & Analytics Types
// ========================================

/**
 * Governance dashboard summary
 */
export interface GovernanceDashboardSummary {
  // Policy stats
  totalPolicies: number;
  activePolicies: number;
  policiesByCategory: Record<GovernancePolicyCategory, number>;
  policiesBySeverity: Record<GovernanceSeverityLevel, number>;

  // Rule stats
  totalRules: number;
  activeRules: number;
  rulesByType: Record<GovernanceRuleType, number>;
  rulesByTargetSystem: Record<GovernanceTargetSystem, number>;

  // Finding stats
  totalFindings: number;
  openFindings: number;
  findingsByStatus: Record<GovernanceFindingStatus, number>;
  findingsBySeverity: Record<GovernanceSeverityLevel, number>;
  findingsTrend: {
    period: string;
    count: number;
    resolved: number;
  }[];

  // Risk stats
  highRiskEntities: number;
  avgRiskScore: number;
  riskTrend: GovernanceScoreTrend;
  topRisks: GovernanceInsightTopRisk[];

  // Timestamps
  lastUpdated: Date;
}

/**
 * Compliance metrics
 */
export interface GovernanceComplianceMetrics {
  complianceScore: number; // 0-100
  policyCoverage: number; // % of systems covered
  ruleEffectiveness: number; // % of rules that have detected issues
  resolutionRate: number; // % of findings resolved within SLA
  meanTimeToResolution: number; // hours
  findingsPerDay: number;
  trendsVsPreviousPeriod: {
    complianceScoreChange: number;
    findingsChange: number;
    resolutionRateChange: number;
  };
}

/**
 * Risk heatmap data point
 */
export interface GovernanceRiskHeatmapCell {
  entityType: GovernanceEntityType;
  riskDimension: string;
  score: number;
  trend: GovernanceScoreTrend;
  findingsCount: number;
}

/**
 * Risk heatmap response
 */
export interface GovernanceRiskHeatmapResponse {
  cells: GovernanceRiskHeatmapCell[];
  entityTypes: GovernanceEntityType[];
  riskDimensions: string[];
}

// ========================================
// Rule Evaluation Types
// ========================================

/**
 * Event context for rule evaluation
 */
export interface GovernanceEvaluationContext {
  sourceSystem: GovernanceTargetSystem;
  eventType: string;
  eventId: string;
  eventData: Record<string, unknown>;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Rule evaluation result
 */
export interface GovernanceEvaluationResult {
  ruleId: string;
  triggered: boolean;
  conditionsMet: boolean;
  findingCreated?: string; // finding ID if created
  actionsTaken: string[];
  evaluationDuration: number; // ms
  error?: string;
}

/**
 * Batch evaluation response
 */
export interface GovernanceBatchEvaluationResponse {
  context: GovernanceEvaluationContext;
  results: GovernanceEvaluationResult[];
  totalRulesEvaluated: number;
  findingsCreated: number;
  duration: number; // ms
}

// ========================================
// API Service Types
// ========================================

/**
 * Acknowledge finding request
 */
export interface AcknowledgeFindingRequest {
  notes?: string;
}

/**
 * Resolve finding request
 */
export interface ResolveFindingRequest {
  resolutionNotes: string;
}

/**
 * Dismiss finding request
 */
export interface DismissFindingRequest {
  reason: string;
}

/**
 * Escalate finding request
 */
export interface EscalateFindingRequest {
  escalateTo: string;
  notes?: string;
}

/**
 * Generate insight request
 */
export interface GenerateGovernanceInsightRequest {
  timeWindowStart: Date;
  timeWindowEnd: Date;
  scope?: GovernancePolicyScope;
  insightType?: string;
  useLlm?: boolean;
  llmModel?: string;
}

/**
 * Distribute insight request
 */
export interface DistributeGovernanceInsightRequest {
  insightId: string;
  recipients: GovernanceInsightRecipient[];
}

/**
 * Recalculate risk score request
 */
export interface RecalculateRiskScoreRequest {
  entityType: GovernanceEntityType;
  entityId: string;
  force?: boolean;
}

/**
 * Bulk recalculate risk scores request
 */
export interface BulkRecalculateRiskScoresRequest {
  entityType?: GovernanceEntityType;
  staleOnly?: boolean;
}
