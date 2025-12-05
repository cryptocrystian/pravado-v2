/**
 * Strategic Intelligence Narrative Engine Types (Sprint S65)
 * CEO-level unified strategic intelligence reports synthesizing all Pravado systems
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Strategic report format types
 */
export type StrategicReportFormat =
  | 'quarterly_strategic_review'
  | 'annual_strategic_assessment'
  | 'board_strategy_brief'
  | 'ceo_intelligence_brief'
  | 'investor_strategy_update'
  | 'crisis_strategic_response'
  | 'competitive_strategy_report'
  | 'custom';

/**
 * Strategic report workflow status
 */
export type StrategicReportStatus =
  | 'draft'
  | 'generating'
  | 'review'
  | 'approved'
  | 'published'
  | 'archived';

/**
 * Strategic section types for report composition
 */
export type StrategicSectionType =
  | 'executive_summary'
  | 'strategic_outlook'
  | 'market_dynamics'
  | 'competitive_positioning'
  | 'risk_opportunity_matrix'
  | 'messaging_alignment'
  | 'ceo_talking_points'
  | 'quarter_changes'
  | 'key_kpis_narrative'
  | 'prioritized_initiatives'
  | 'brand_health_overview'
  | 'crisis_posture'
  | 'governance_compliance'
  | 'investor_sentiment'
  | 'media_performance_summary'
  | 'strategic_recommendations'
  | 'appendix'
  | 'custom';

/**
 * Strategic section status
 */
export type StrategicSectionStatus =
  | 'draft'
  | 'generated'
  | 'edited'
  | 'approved';

/**
 * Target audience for strategic reports
 */
export type StrategicAudience =
  | 'ceo'
  | 'c_suite'
  | 'board'
  | 'investors'
  | 'senior_leadership'
  | 'all_executives';

/**
 * Source systems for data aggregation
 */
export type StrategicSourceSystem =
  | 'pr_generator'
  | 'media_monitoring'
  | 'media_alerts'
  | 'media_performance'
  | 'competitive_intel'
  | 'crisis_engine'
  | 'brand_reputation'
  | 'brand_alerts'
  | 'governance'
  | 'risk_radar'
  | 'exec_command_center'
  | 'exec_digest'
  | 'board_reports'
  | 'investor_relations'
  | 'journalist_graph'
  | 'media_lists'
  | 'outreach_engine'
  | 'custom';

/**
 * Audit event types for strategic intelligence
 */
export type StrategicEventType =
  | 'created'
  | 'updated'
  | 'status_changed'
  | 'section_generated'
  | 'section_regenerated'
  | 'section_edited'
  | 'insights_refreshed'
  | 'source_added'
  | 'source_removed'
  | 'approved'
  | 'published'
  | 'archived';

// ============================================================================
// DISPLAY LABELS
// ============================================================================

export const STRATEGIC_FORMAT_LABELS: Record<StrategicReportFormat, string> = {
  quarterly_strategic_review: 'Quarterly Strategic Review',
  annual_strategic_assessment: 'Annual Strategic Assessment',
  board_strategy_brief: 'Board Strategy Brief',
  ceo_intelligence_brief: 'CEO Intelligence Brief',
  investor_strategy_update: 'Investor Strategy Update',
  crisis_strategic_response: 'Crisis Strategic Response',
  competitive_strategy_report: 'Competitive Strategy Report',
  custom: 'Custom Report',
};

export const STRATEGIC_STATUS_LABELS: Record<StrategicReportStatus, string> = {
  draft: 'Draft',
  generating: 'Generating',
  review: 'In Review',
  approved: 'Approved',
  published: 'Published',
  archived: 'Archived',
};

export const STRATEGIC_SECTION_TYPE_LABELS: Record<StrategicSectionType, string> = {
  executive_summary: 'Executive Summary',
  strategic_outlook: 'Strategic Outlook',
  market_dynamics: 'Market Dynamics',
  competitive_positioning: 'Competitive Positioning',
  risk_opportunity_matrix: 'Risk & Opportunity Matrix',
  messaging_alignment: 'Messaging Alignment',
  ceo_talking_points: 'CEO Talking Points',
  quarter_changes: 'Quarter-over-Quarter Changes',
  key_kpis_narrative: 'Key KPIs Narrative',
  prioritized_initiatives: 'Prioritized Initiatives',
  brand_health_overview: 'Brand Health Overview',
  crisis_posture: 'Crisis Posture Assessment',
  governance_compliance: 'Governance & Compliance',
  investor_sentiment: 'Investor Sentiment Analysis',
  media_performance_summary: 'Media Performance Summary',
  strategic_recommendations: 'Strategic Recommendations',
  appendix: 'Appendix',
  custom: 'Custom Section',
};

export const STRATEGIC_AUDIENCE_LABELS: Record<StrategicAudience, string> = {
  ceo: 'CEO',
  c_suite: 'C-Suite Executives',
  board: 'Board of Directors',
  investors: 'Investors',
  senior_leadership: 'Senior Leadership',
  all_executives: 'All Executives',
};

export const STRATEGIC_SOURCE_LABELS: Record<StrategicSourceSystem, string> = {
  pr_generator: 'PR Generator',
  media_monitoring: 'Media Monitoring',
  media_alerts: 'Media Alerts',
  media_performance: 'Media Performance',
  competitive_intel: 'Competitive Intelligence',
  crisis_engine: 'Crisis Engine',
  brand_reputation: 'Brand Reputation',
  brand_alerts: 'Brand Alerts',
  governance: 'Governance',
  risk_radar: 'Risk Radar',
  exec_command_center: 'Executive Command Center',
  exec_digest: 'Executive Digest',
  board_reports: 'Board Reports',
  investor_relations: 'Investor Relations',
  journalist_graph: 'Journalist Graph',
  media_lists: 'Media Lists',
  outreach_engine: 'Outreach Engine',
  custom: 'Custom Source',
};

export const STRATEGIC_EVENT_LABELS: Record<StrategicEventType, string> = {
  created: 'Created',
  updated: 'Updated',
  status_changed: 'Status Changed',
  section_generated: 'Section Generated',
  section_regenerated: 'Section Regenerated',
  section_edited: 'Section Edited',
  insights_refreshed: 'Insights Refreshed',
  source_added: 'Source Added',
  source_removed: 'Source Removed',
  approved: 'Approved',
  published: 'Published',
  archived: 'Archived',
};

// ============================================================================
// CORE INTERFACES
// ============================================================================

/**
 * KPIs snapshot from all upstream systems
 */
export interface StrategicKPIsSnapshot {
  // Media Performance KPIs
  mediaReach?: number;
  mediaMentions?: number;
  shareOfVoice?: number;
  sentimentScore?: number;

  // Brand Health KPIs
  brandHealthScore?: number;
  brandAwarenessIndex?: number;
  reputationScore?: number;

  // PR Performance KPIs
  pressReleaseCount?: number;
  mediaPickupRate?: number;
  journalistEngagementRate?: number;

  // Competitive KPIs
  competitivePositionIndex?: number;
  marketShareEstimate?: number;

  // Crisis KPIs
  crisisReadinessScore?: number;
  activeCrisisCount?: number;

  // Governance KPIs
  complianceScore?: number;
  esgScore?: number;

  // Engagement KPIs
  investorEngagementScore?: number;
  analystCoverageCount?: number;

  // Custom KPIs
  customKpis?: Record<string, number | string>;
}

/**
 * Summary JSON structure for quick access
 */
export interface StrategicSummaryJson {
  keyInsights?: string[];
  topRisks?: Array<{
    risk: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    mitigation?: string;
  }>;
  topOpportunities?: Array<{
    opportunity: string;
    impact: 'low' | 'medium' | 'high';
    timeframe?: string;
  }>;
  strategicPriorities?: string[];
  executiveSummaryText?: string;
  recommendedActions?: string[];
  quarterHighlights?: string[];
  quarterLowlights?: string[];
}

/**
 * Chart configuration for visualizations
 */
export interface StrategicChartConfig {
  chartId: string;
  chartType: 'line' | 'bar' | 'pie' | 'area' | 'radar' | 'gauge' | 'heatmap';
  title: string;
  description?: string;
  dataSource: string;
  config: Record<string, unknown>;
  data?: unknown[];
}

/**
 * Data table configuration
 */
export interface StrategicDataTable {
  tableId: string;
  title: string;
  description?: string;
  columns: Array<{
    key: string;
    label: string;
    type: 'text' | 'number' | 'percent' | 'date' | 'currency' | 'badge';
  }>;
  data: Record<string, unknown>[];
}

/**
 * Source reference within a section
 */
export interface StrategicSourceRef {
  sourceId: string;
  sourceSystem: StrategicSourceSystem;
  excerptUsed?: string;
  relevanceNote?: string;
}

/**
 * Section metrics
 */
export interface StrategicSectionMetrics {
  keyMetrics?: Record<string, number | string>;
  trends?: Array<{
    metric: string;
    direction: 'up' | 'down' | 'stable';
    percentChange?: number;
    narrative?: string;
  }>;
  comparisons?: Array<{
    metric: string;
    current: number | string;
    previous: number | string;
    benchmark?: number | string;
  }>;
}

/**
 * LLM fallback information
 */
export interface StrategicLLMFallbackJson {
  primaryModel: string;
  fallbackModel?: string;
  fallbackReason?: string;
  attempts: number;
}

/**
 * Main Strategic Intelligence Report
 */
export interface StrategicIntelligenceReport {
  id: string;
  orgId: string;
  createdBy: string | null;

  // Report metadata
  title: string;
  description: string | null;
  format: StrategicReportFormat;
  status: StrategicReportStatus;
  audience: StrategicAudience;

  // Time period covered
  periodStart: string;
  periodEnd: string;
  fiscalQuarter: string | null;
  fiscalYear: number | null;

  // Section configuration
  sectionTypes: StrategicSectionType[];

  // Consolidated KPIs snapshot
  kpisSnapshot: StrategicKPIsSnapshot;

  // Strategic scores and metrics (0-100)
  overallStrategicScore: number | null;
  riskPostureScore: number | null;
  opportunityScore: number | null;
  messagingAlignmentScore: number | null;
  competitivePositionScore: number | null;
  brandHealthScore: number | null;

  // Summary for quick access
  summaryJson: StrategicSummaryJson;

  // LLM metadata
  totalTokensUsed: number;
  generationDurationMs: number | null;
  llmModel: string | null;
  llmFallbackJson: StrategicLLMFallbackJson | null;

  // Generation settings
  tone: 'executive' | 'formal' | 'strategic';
  targetLength: 'brief' | 'standard' | 'comprehensive';
  includeCharts: boolean;
  includeRecommendations: boolean;

  // Publishing
  publishedAt: string | null;
  publishedBy: string | null;
  pdfStoragePath: string | null;
  pptxStoragePath: string | null;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Strategic Intelligence Section
 */
export interface StrategicSection {
  id: string;
  orgId: string;
  reportId: string;

  // Section metadata
  sectionType: StrategicSectionType;
  title: string | null;
  status: StrategicSectionStatus;
  orderIndex: number;
  isVisible: boolean;

  // Content
  contentMd: string | null;
  contentHtml: string | null;
  rawLlmJson: Record<string, unknown> | null;

  // Charts and visualizations
  chartsConfig: StrategicChartConfig[];
  dataTables: StrategicDataTable[];

  // Strategic metrics for this section
  sectionMetrics: StrategicSectionMetrics;

  // Source tracking
  sourceRefs: StrategicSourceRef[];

  // Edit tracking
  isEdited: boolean;
  editedAt: string | null;
  editedBy: string | null;

  // Regeneration tracking
  regenerationCount: number;
  lastRegeneratedAt: string | null;

  // LLM metadata
  tokensUsed: number;
  generationDurationMs: number | null;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Strategic Intelligence Source (data sources used)
 */
export interface StrategicSource {
  id: string;
  orgId: string;
  reportId: string;

  // Source metadata
  sourceSystem: StrategicSourceSystem;
  sourceId: string | null;
  sourceType: string | null;
  sourceTitle: string | null;
  sourceUrl: string | null;

  // Data extracted
  extractedData: Record<string, unknown>;
  extractionTimestamp: string;

  // Relevance and quality
  relevanceScore: number | null;
  dataQualityScore: number | null;
  isPrimarySource: boolean;

  // Usage tracking
  sectionsUsing: string[];

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Strategic Intelligence Audit Log Entry
 */
export interface StrategicAuditLogEntry {
  id: string;
  orgId: string;
  reportId: string;

  // Event metadata
  eventType: StrategicEventType;
  userId: string | null;
  userEmail: string | null;

  // Event details
  detailsJson: Record<string, unknown>;
  previousStatus: StrategicReportStatus | null;
  newStatus: StrategicReportStatus | null;

  // Section reference (if applicable)
  sectionId: string | null;
  sectionType: StrategicSectionType | null;

  // LLM usage (if applicable)
  tokensUsed: number | null;
  durationMs: number | null;

  // Timestamp
  createdAt: string;
}

// ============================================================================
// COMPOSITE TYPES
// ============================================================================

/**
 * Report with all related data
 */
export interface StrategicReportWithSections {
  report: StrategicIntelligenceReport;
  sections: StrategicSection[];
  sources?: StrategicSource[];
}

/**
 * Report list item (summary view)
 */
export interface StrategicReportListItem {
  id: string;
  title: string;
  format: StrategicReportFormat;
  status: StrategicReportStatus;
  audience: StrategicAudience;
  periodStart: string;
  periodEnd: string;
  fiscalQuarter: string | null;
  fiscalYear: number | null;
  overallStrategicScore: number | null;
  sectionCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Dashboard statistics
 */
export interface StrategicReportStats {
  totalReports: number;
  byStatus: Record<StrategicReportStatus, number>;
  byFormat: Record<StrategicReportFormat, number>;
  byAudience: Record<StrategicAudience, number>;
  avgStrategicScore: number | null;
  avgRiskScore: number | null;
  avgOpportunityScore: number | null;
  recentReports: StrategicReportListItem[];
  totalSections: number;
  totalSources: number;
}

/**
 * Aggregated insights from all sources
 */
export interface AggregatedStrategicInsights {
  // From Media Performance (S57)
  mediaPerformance?: {
    overallScore: number;
    reach: number;
    impressions: number;
    sentiment: number;
    topMentions: Array<{ outlet: string; count: number }>;
    trends: Array<{ date: string; score: number }>;
  };

  // From Competitive Intelligence (S58)
  competitiveIntel?: {
    positionIndex: number;
    topCompetitors: Array<{ name: string; shareOfVoice: number }>;
    strengthsVsCompetitors: string[];
    weaknessesVsCompetitors: string[];
    marketTrends: string[];
  };

  // From Crisis Engine (S59)
  crisisStatus?: {
    readinessScore: number;
    activeCrises: number;
    recentCrises: Array<{ title: string; severity: string; resolvedAt?: string }>;
    riskFactors: string[];
  };

  // From Brand Reputation (S60)
  brandHealth?: {
    overallScore: number;
    awarenessIndex: number;
    sentimentTrend: 'improving' | 'stable' | 'declining';
    keyAttributes: Array<{ attribute: string; score: number }>;
    reputationRisks: string[];
  };

  // From Governance (S62)
  governance?: {
    complianceScore: number;
    esgScore: number;
    openIssues: number;
    upcomingDeadlines: Array<{ item: string; date: string }>;
  };

  // From Investor Relations (S64)
  investorSentiment?: {
    overallScore: number;
    analystCoverage: number;
    recentEarnings: { quarter: string; sentiment: string };
    keyQuestions: string[];
  };

  // From Executive Command Center (S63)
  executiveMetrics?: {
    overallHealthScore: number;
    priorityAlerts: number;
    pendingDecisions: number;
    recentDigests: Array<{ title: string; date: string }>;
  };
}

/**
 * Source data extraction result
 */
export interface SourceExtractionResult {
  sourceSystem: StrategicSourceSystem;
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  extractedAt: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * List reports response
 */
export interface ListStrategicReportsResponse {
  reports: StrategicReportListItem[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Generate report response
 */
export interface GenerateStrategicReportResponse {
  report: StrategicIntelligenceReport;
  sections: StrategicSection[];
  sources: StrategicSource[];
  insights: AggregatedStrategicInsights;
  tokensUsed: number;
  durationMs: number;
}

/**
 * Publish report response
 */
export interface PublishStrategicReportResponse {
  report: StrategicIntelligenceReport;
  pdfUrl?: string;
  pptxUrl?: string;
}

/**
 * Refresh insights response
 */
export interface RefreshInsightsResponse {
  report: StrategicIntelligenceReport;
  insights: AggregatedStrategicInsights;
  sourcesUpdated: number;
  newDataPoints: number;
}

/**
 * List sources response
 */
export interface ListStrategicSourcesResponse {
  sources: StrategicSource[];
  total: number;
}

/**
 * List audit logs response
 */
export interface ListStrategicAuditLogsResponse {
  logs: StrategicAuditLogEntry[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Section generation options
 */
export interface SectionGenerationOptions {
  sectionType: StrategicSectionType;
  customPrompt?: string;
  includeCharts?: boolean;
  dataSources?: StrategicSourceSystem[];
  maxTokens?: number;
}

/**
 * Report generation options
 */
export interface ReportGenerationOptions {
  regenerateSections?: StrategicSectionType[];
  refreshInsights?: boolean;
  includeSources?: StrategicSourceSystem[];
  excludeSources?: StrategicSourceSystem[];
  customInstructions?: string;
}

/**
 * Export options
 */
export interface StrategicExportOptions {
  format: 'pdf' | 'pptx' | 'docx' | 'html';
  includeSections?: StrategicSectionType[];
  includeCharts?: boolean;
  includeAppendix?: boolean;
  brandingOptions?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
}

/**
 * Comparison between periods
 */
export interface PeriodComparison {
  currentPeriod: {
    start: string;
    end: string;
    fiscalQuarter?: string;
    fiscalYear?: number;
  };
  previousPeriod: {
    start: string;
    end: string;
    fiscalQuarter?: string;
    fiscalYear?: number;
  };
  metrics: Array<{
    name: string;
    current: number;
    previous: number;
    change: number;
    changePercent: number;
    trend: 'up' | 'down' | 'stable';
  }>;
}
