/**
 * Executive Command Center Types (Sprint S61)
 * Unified executive dashboards with cross-system insights,
 * KPIs, and LLM-generated narratives
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Time window for dashboard analysis
 */
export type ExecDashboardTimeWindow = '24h' | '7d' | '30d' | '90d';

/**
 * Primary focus area for dashboard
 */
export type ExecDashboardPrimaryFocus =
  | 'risk'
  | 'reputation'
  | 'growth'
  | 'governance'
  | 'mixed';

/**
 * Source system for insights
 */
export type ExecInsightSourceSystem =
  | 'risk_radar'
  | 'crisis'
  | 'reputation'
  | 'governance'
  | 'media_performance'
  | 'competitive_intel'
  | 'personas'
  | 'outreach'
  | 'media_monitoring'
  | 'press_releases'
  | 'pitches'
  | 'media_lists'
  | 'journalist_discovery'
  | 'other';

/**
 * Audit action types for executive dashboards
 */
export type ExecDashboardActionType =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'viewed'
  | 'refreshed'
  | 'narrative_generated'
  | 'exported';

/**
 * Trend direction for KPIs
 */
export type ExecKpiTrendDirection = 'up' | 'down' | 'flat';

/**
 * Insight severity levels
 */
export type ExecInsightSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

// ============================================================================
// CORE ENTITIES
// ============================================================================

/**
 * KPI trend data
 */
export interface ExecKpiTrend {
  direction: ExecKpiTrendDirection;
  change: number;
  previousValue: number | null;
  changePercent?: number;
}

/**
 * Dashboard filters
 */
export interface ExecDashboardFilters {
  sourceSystemsIncluded?: ExecInsightSourceSystem[];
  sourceSystemsExcluded?: ExecInsightSourceSystem[];
  severityThreshold?: ExecInsightSeverity;
  categories?: string[];
  excludeArchived?: boolean;
  customDateRange?: {
    startDate: string;
    endDate: string;
  };
}

/**
 * Dashboard summary snapshot
 */
export interface ExecDashboardSummary {
  totalInsights: number;
  topRisksCount: number;
  topOpportunitiesCount: number;
  activeKpis: number;
  overallRiskIndex?: number;
  reputationScore?: number;
  crisisCount?: number;
  governanceScore?: number;
  lastUpdated: string;
  sourceBreakdown: Record<ExecInsightSourceSystem, number>;
}

/**
 * Executive Dashboard entity
 */
export interface ExecDashboard {
  id: string;
  orgId: string;
  title: string;
  description: string | null;
  timeWindow: ExecDashboardTimeWindow;
  primaryFocus: ExecDashboardPrimaryFocus;
  filters: ExecDashboardFilters;
  summary: ExecDashboardSummary | null;
  isDefault: boolean;
  isArchived: boolean;
  lastRefreshedAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Executive Dashboard Insight entity
 */
export interface ExecDashboardInsight {
  id: string;
  orgId: string;
  dashboardId: string;
  sourceSystem: ExecInsightSourceSystem;
  insightType: string;
  severityOrImpact: number;
  category: string | null;
  title: string;
  description: string | null;
  linkUrl: string | null;
  linkedEntityType: string | null;
  linkedEntityId: string | null;
  isTopInsight: boolean;
  isOpportunity: boolean;
  isRisk: boolean;
  sortOrder: number;
  meta: Record<string, unknown>;
  createdAt: string;
}

/**
 * Executive Dashboard KPI entity
 */
export interface ExecDashboardKpi {
  id: string;
  orgId: string;
  dashboardId: string;
  metricKey: string;
  metricLabel: string;
  metricValue: number;
  metricUnit: string | null;
  metricTrend: ExecKpiTrend;
  displayOrder: number;
  category: string | null;
  sourceSystem: ExecInsightSourceSystem | null;
  meta: Record<string, unknown>;
  createdAt: string;
}

/**
 * Executive Dashboard Narrative entity
 */
export interface ExecDashboardNarrative {
  id: string;
  orgId: string;
  dashboardId: string;
  modelName: string;
  tokensUsed: number;
  durationMs: number;
  narrativeText: string;
  risksSection: string | null;
  opportunitiesSection: string | null;
  storylineSection: string | null;
  contextSnapshot: ExecNarrativeContext;
  isCurrent: boolean;
  createdBy: string | null;
  createdAt: string;
}

/**
 * Context snapshot for narrative generation
 */
export interface ExecNarrativeContext {
  timeWindow: ExecDashboardTimeWindow;
  primaryFocus: ExecDashboardPrimaryFocus;
  topRisks: ExecNarrativeRiskSummary[];
  topOpportunities: ExecNarrativeOpportunitySummary[];
  kpiSnapshot: ExecNarrativeKpiSnapshot[];
  sourceSystemStats: Record<ExecInsightSourceSystem, number>;
  generatedAt: string;
}

/**
 * Risk summary for narrative context
 */
export interface ExecNarrativeRiskSummary {
  title: string;
  severity: number;
  source: ExecInsightSourceSystem;
  description?: string;
}

/**
 * Opportunity summary for narrative context
 */
export interface ExecNarrativeOpportunitySummary {
  title: string;
  impact: number;
  source: ExecInsightSourceSystem;
  description?: string;
}

/**
 * KPI snapshot for narrative context
 */
export interface ExecNarrativeKpiSnapshot {
  key: string;
  label: string;
  value: number;
  trend: ExecKpiTrendDirection;
  changePercent?: number;
}

/**
 * Executive Dashboard Audit Log Entry
 */
export interface ExecDashboardAuditEntry {
  id: string;
  orgId: string;
  dashboardId: string | null;
  actionType: ExecDashboardActionType;
  userId: string | null;
  description: string | null;
  meta: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

// ============================================================================
// COMPOSITE TYPES
// ============================================================================

/**
 * Full dashboard snapshot with all related data
 */
export interface ExecDashboardSnapshot {
  dashboard: ExecDashboard;
  kpis: ExecDashboardKpi[];
  insights: ExecDashboardInsight[];
  currentNarrative: ExecDashboardNarrative | null;
  topRisks: ExecDashboardInsight[];
  topOpportunities: ExecDashboardInsight[];
}

/**
 * Dashboard with computed counts
 */
export interface ExecDashboardWithCounts extends ExecDashboard {
  insightsCount: number;
  kpisCount: number;
  hasNarrative: boolean;
}

/**
 * Grouped insights by source system
 */
export interface ExecInsightsBySource {
  sourceSystem: ExecInsightSourceSystem;
  sourceLabel: string;
  insights: ExecDashboardInsight[];
  count: number;
}

/**
 * KPIs grouped by category
 */
export interface ExecKpisByCategory {
  category: string;
  kpis: ExecDashboardKpi[];
  count: number;
}

// ============================================================================
// INPUT TYPES
// ============================================================================

/**
 * Input for creating a new executive dashboard
 */
export interface CreateExecDashboardInput {
  title?: string;
  description?: string;
  timeWindow?: ExecDashboardTimeWindow;
  primaryFocus?: ExecDashboardPrimaryFocus;
  filters?: ExecDashboardFilters;
  isDefault?: boolean;
}

/**
 * Input for updating an executive dashboard
 */
export interface UpdateExecDashboardInput {
  title?: string;
  description?: string;
  timeWindow?: ExecDashboardTimeWindow;
  primaryFocus?: ExecDashboardPrimaryFocus;
  filters?: ExecDashboardFilters;
  isDefault?: boolean;
  isArchived?: boolean;
}

/**
 * Input for refreshing a dashboard
 */
export interface RefreshExecDashboardInput {
  timeWindowOverride?: ExecDashboardTimeWindow;
  primaryFocusOverride?: ExecDashboardPrimaryFocus;
  regenerateNarrative?: boolean;
  forceRefresh?: boolean;
}

/**
 * Input for generating a narrative
 */
export interface GenerateExecNarrativeInput {
  dashboardId: string;
  forceRegenerate?: boolean;
  customPromptHint?: string;
}

/**
 * Input for creating an insight
 */
export interface CreateExecInsightInput {
  dashboardId: string;
  sourceSystem: ExecInsightSourceSystem;
  insightType: string;
  severityOrImpact: number;
  category?: string;
  title: string;
  description?: string;
  linkUrl?: string;
  linkedEntityType?: string;
  linkedEntityId?: string;
  isTopInsight?: boolean;
  isOpportunity?: boolean;
  isRisk?: boolean;
  sortOrder?: number;
  meta?: Record<string, unknown>;
}

/**
 * Input for creating a KPI
 */
export interface CreateExecKpiInput {
  dashboardId: string;
  metricKey: string;
  metricLabel: string;
  metricValue: number;
  metricUnit?: string;
  metricTrend?: ExecKpiTrend;
  displayOrder?: number;
  category?: string;
  sourceSystem?: ExecInsightSourceSystem;
  meta?: Record<string, unknown>;
}

// ============================================================================
// QUERY TYPES
// ============================================================================

/**
 * Query parameters for listing dashboards
 */
export interface ListExecDashboardsQuery {
  includeArchived?: boolean;
  primaryFocus?: ExecDashboardPrimaryFocus;
  limit?: number;
  offset?: number;
}

/**
 * Query parameters for listing insights
 */
export interface ListExecInsightsQuery {
  dashboardId: string;
  sourceSystem?: ExecInsightSourceSystem;
  category?: string;
  isTopInsight?: boolean;
  isRisk?: boolean;
  isOpportunity?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Query parameters for listing KPIs
 */
export interface ListExecKpisQuery {
  dashboardId: string;
  category?: string;
  sourceSystem?: ExecInsightSourceSystem;
  limit?: number;
  offset?: number;
}

/**
 * Query parameters for listing narratives
 */
export interface ListExecNarrativesQuery {
  dashboardId: string;
  limit?: number;
  offset?: number;
}

/**
 * Query parameters for audit log
 */
export interface ListExecAuditLogQuery {
  dashboardId?: string;
  actionType?: ExecDashboardActionType;
  userId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

/**
 * Response for listing dashboards
 */
export interface ListExecDashboardsResponse {
  dashboards: ExecDashboardWithCounts[];
  total: number;
  hasMore: boolean;
}

/**
 * Response for getting a single dashboard
 */
export interface GetExecDashboardResponse {
  dashboard: ExecDashboard;
  kpis: ExecDashboardKpi[];
  topInsights: ExecDashboardInsight[];
  currentNarrative: ExecDashboardNarrative | null;
}

/**
 * Response for creating a dashboard
 */
export interface CreateExecDashboardResponse {
  dashboard: ExecDashboard;
}

/**
 * Response for updating a dashboard
 */
export interface UpdateExecDashboardResponse {
  dashboard: ExecDashboard;
}

/**
 * Response for refreshing a dashboard
 */
export interface RefreshExecDashboardResponse {
  dashboard: ExecDashboard;
  kpisCreated: number;
  insightsCreated: number;
  narrativeGenerated: boolean;
  durationMs: number;
}

/**
 * Response for listing insights
 */
export interface ListExecInsightsResponse {
  insights: ExecDashboardInsight[];
  total: number;
  hasMore: boolean;
  bySource?: ExecInsightsBySource[];
}

/**
 * Response for listing KPIs
 */
export interface ListExecKpisResponse {
  kpis: ExecDashboardKpi[];
  total: number;
  byCategory?: ExecKpisByCategory[];
}

/**
 * Response for listing narratives
 */
export interface ListExecNarrativesResponse {
  narratives: ExecDashboardNarrative[];
  total: number;
  hasMore: boolean;
}

/**
 * Response for generating a narrative
 */
export interface GenerateExecNarrativeResponse {
  narrative: ExecDashboardNarrative;
  tokensUsed: number;
  durationMs: number;
}

/**
 * Response for the full dashboard snapshot
 */
export interface GetExecDashboardSnapshotResponse {
  snapshot: ExecDashboardSnapshot;
  generatedAt: string;
}

// ============================================================================
// SERVICE CONFIGURATION
// ============================================================================

/**
 * Configuration for the executive command center service
 */
export interface ExecCommandCenterServiceConfig {
  supabase: unknown;
  openaiApiKey?: string;
  defaultTimeWindow?: ExecDashboardTimeWindow;
  defaultPrimaryFocus?: ExecDashboardPrimaryFocus;
  maxInsightsPerDashboard?: number;
  maxKpisPerDashboard?: number;
  narrativeModelName?: string;
  debugMode?: boolean;
}

/**
 * Aggregation result from upstream services
 */
export interface ExecUpstreamAggregation {
  riskRadar?: {
    overallRiskIndex: number;
    riskLevel: string;
    topDrivers: Array<{ name: string; impact: number }>;
    activeAlerts: number;
  };
  crisis?: {
    activeIncidents: number;
    criticalCount: number;
    highCount: number;
    recentEscalations: number;
  };
  reputation?: {
    overallScore: number;
    trend: ExecKpiTrendDirection;
    topDrivers: Array<{ name: string; impact: number }>;
    alertsCount: number;
  };
  governance?: {
    complianceScore: number;
    openFindings: number;
    highRiskEntities: number;
    recentAudits: number;
  };
  mediaPerformance?: {
    eviScore: number;
    coverageVelocity: number;
    sentimentScore: number;
    topJournalists: number;
  };
  competitiveIntel?: {
    marketPosition: number;
    competitorAlerts: number;
    shareOfVoice: number;
  };
  outreach?: {
    openRate: number;
    responseRate: number;
    activeCampaigns: number;
  };
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Source system display metadata
 */
export interface ExecSourceSystemMeta {
  key: ExecInsightSourceSystem;
  label: string;
  icon: string;
  color: string;
  priority: number;
}

/**
 * Standard KPI definitions
 */
export interface ExecStandardKpiDef {
  key: string;
  label: string;
  unit: string;
  source: ExecInsightSourceSystem;
  category: string;
  description: string;
  higherIsBetter: boolean;
}

/**
 * Mapping of source systems to labels
 */
export const EXEC_SOURCE_SYSTEM_LABELS: Record<ExecInsightSourceSystem, string> = {
  risk_radar: 'Risk Radar',
  crisis: 'Crisis Response',
  reputation: 'Brand Reputation',
  governance: 'Governance & Compliance',
  media_performance: 'Media Performance',
  competitive_intel: 'Competitive Intelligence',
  personas: 'Audience Personas',
  outreach: 'PR Outreach',
  media_monitoring: 'Media Monitoring',
  press_releases: 'Press Releases',
  pitches: 'Pitch Engine',
  media_lists: 'Media Lists',
  journalist_discovery: 'Journalist Discovery',
  other: 'Other',
};

/**
 * Mapping of time windows to display labels
 */
export const EXEC_TIME_WINDOW_LABELS: Record<ExecDashboardTimeWindow, string> = {
  '24h': 'Last 24 Hours',
  '7d': 'Last 7 Days',
  '30d': 'Last 30 Days',
  '90d': 'Last 90 Days',
};

/**
 * Mapping of primary focus to display labels
 */
export const EXEC_PRIMARY_FOCUS_LABELS: Record<ExecDashboardPrimaryFocus, string> = {
  risk: 'Risk Management',
  reputation: 'Brand Reputation',
  growth: 'Growth & Opportunities',
  governance: 'Governance & Compliance',
  mixed: 'Mixed Overview',
};

/**
 * Standard KPI definitions for the command center
 */
export const EXEC_STANDARD_KPIS: ExecStandardKpiDef[] = [
  {
    key: 'overall_risk_index',
    label: 'Overall Risk Index',
    unit: 'score',
    source: 'risk_radar',
    category: 'risk',
    description: 'Composite risk score from Risk Radar',
    higherIsBetter: false,
  },
  {
    key: 'reputation_score',
    label: 'Reputation Score',
    unit: 'score',
    source: 'reputation',
    category: 'reputation',
    description: 'Overall brand reputation score',
    higherIsBetter: true,
  },
  {
    key: 'active_crises',
    label: 'Active Crises',
    unit: 'count',
    source: 'crisis',
    category: 'risk',
    description: 'Number of active crisis incidents',
    higherIsBetter: false,
  },
  {
    key: 'compliance_score',
    label: 'Compliance Score',
    unit: 'percent',
    source: 'governance',
    category: 'governance',
    description: 'Governance compliance percentage',
    higherIsBetter: true,
  },
  {
    key: 'media_evi',
    label: 'Media EVI',
    unit: 'score',
    source: 'media_performance',
    category: 'media',
    description: 'Earned Value Index for media coverage',
    higherIsBetter: true,
  },
  {
    key: 'share_of_voice',
    label: 'Share of Voice',
    unit: 'percent',
    source: 'competitive_intel',
    category: 'competitive',
    description: 'Market share of voice vs competitors',
    higherIsBetter: true,
  },
  {
    key: 'outreach_response_rate',
    label: 'Outreach Response Rate',
    unit: 'percent',
    source: 'outreach',
    category: 'outreach',
    description: 'Response rate for PR outreach campaigns',
    higherIsBetter: true,
  },
  {
    key: 'coverage_velocity',
    label: 'Coverage Velocity',
    unit: 'articles/day',
    source: 'media_monitoring',
    category: 'media',
    description: 'Rate of new media coverage',
    higherIsBetter: true,
  },
];
