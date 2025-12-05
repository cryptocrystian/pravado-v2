/**
 * Brand Reputation Alerts & Executive Reporting Types (Sprint S57)
 *
 * Types for alert rules, events, executive reports, and reporting system
 * that builds on S56 Brand Reputation Intelligence core.
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Alert delivery channels
 */
export type ReputationAlertChannel = 'in_app' | 'email' | 'slack' | 'webhook';

/**
 * Alert event status
 */
export type ReputationAlertStatus = 'new' | 'acknowledged' | 'muted' | 'resolved';

/**
 * Report frequency options
 */
export type ReputationReportFrequency = 'ad_hoc' | 'weekly' | 'monthly' | 'quarterly';

/**
 * Report format options
 */
export type ReputationReportFormat = 'executive_summary' | 'detailed';

/**
 * Report generation status
 */
export type ReputationReportStatus = 'draft' | 'generating' | 'generated' | 'published';

/**
 * Report section types
 */
export type ReputationReportSectionType =
  | 'overview'
  | 'highlights'
  | 'risks'
  | 'opportunities'
  | 'competitors'
  | 'recommendations'
  | 'events_timeline';

/**
 * Component keys for component-level alerts
 */
export type ReputationComponentKey =
  | 'sentiment'
  | 'coverage'
  | 'crisis_impact'
  | 'competitive_position'
  | 'engagement';

// ============================================================================
// SNAPSHOT TYPES
// ============================================================================

/**
 * Snapshot of brand reputation scores
 */
export interface BrandReputationScoreSnapshot {
  overallScore: number;
  sentimentScore: number;
  coverageScore: number;
  crisisImpactScore: number;
  competitivePositionScore: number;
  engagementScore: number;
  snapshotAt: string;
}

/**
 * Component scores as a map
 */
export interface ComponentScoresMap {
  sentiment?: number;
  coverage?: number;
  crisis_impact?: number;
  competitive_position?: number;
  engagement?: number;
}

/**
 * Competitor snapshot for reports
 */
export interface CompetitorReputationSnapshot {
  competitorId: string;
  competitorName: string;
  competitorSlug: string;
  score: number;
  gap: number; // Our score - competitor score
  trend: 'up' | 'down' | 'flat';
}

/**
 * Crisis incident summary for linking
 */
export interface CrisisIncidentSummary {
  id: string;
  title: string;
  severity: number;
  status: string;
  createdAt: string;
  resolvedAt?: string;
}

// ============================================================================
// ALERT RULES
// ============================================================================

/**
 * Notification configuration for alert rules
 */
export interface AlertNotificationConfig {
  emailAddresses?: string[];
  slackWebhookUrl?: string;
  webhookUrl?: string;
  webhookHeaders?: Record<string, string>;
  includeDetails?: boolean;
  customMessage?: string;
}

/**
 * Brand reputation alert rule
 */
export interface BrandReputationAlertRule {
  id: string;
  orgId: string;

  // Rule metadata
  name: string;
  description?: string;
  isActive: boolean;
  channel: ReputationAlertChannel;

  // Overall score thresholds
  minOverallScore?: number;
  maxOverallScore?: number;

  // Delta thresholds
  minDeltaOverallScore?: number;
  maxDeltaOverallScore?: number;

  // Component thresholds
  componentKey?: ReputationComponentKey;
  minComponentScore?: number;

  // Competitor gap thresholds
  competitorSlug?: string;
  minCompetitorGap?: number;
  maxCompetitorGap?: number;

  // Crisis integration
  minIncidentSeverity?: number;
  linkCrisisIncidents: boolean;

  // Timing controls
  timeWindowMinutes: number;
  cooldownMinutes: number;
  lastTriggeredAt?: string;

  // Notification config
  notificationConfig?: AlertNotificationConfig;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

/**
 * Input for creating an alert rule
 */
export interface CreateReputationAlertRuleInput {
  name: string;
  description?: string;
  isActive?: boolean;
  channel?: ReputationAlertChannel;

  // Overall score thresholds
  minOverallScore?: number;
  maxOverallScore?: number;

  // Delta thresholds
  minDeltaOverallScore?: number;
  maxDeltaOverallScore?: number;

  // Component thresholds
  componentKey?: ReputationComponentKey;
  minComponentScore?: number;

  // Competitor gap thresholds
  competitorSlug?: string;
  minCompetitorGap?: number;
  maxCompetitorGap?: number;

  // Crisis integration
  minIncidentSeverity?: number;
  linkCrisisIncidents?: boolean;

  // Timing controls
  timeWindowMinutes?: number;
  cooldownMinutes?: number;

  // Notification config
  notificationConfig?: AlertNotificationConfig;
}

/**
 * Input for updating an alert rule
 */
export interface UpdateReputationAlertRuleInput {
  name?: string;
  description?: string;
  isActive?: boolean;
  channel?: ReputationAlertChannel;

  // Overall score thresholds
  minOverallScore?: number | null;
  maxOverallScore?: number | null;

  // Delta thresholds
  minDeltaOverallScore?: number | null;
  maxDeltaOverallScore?: number | null;

  // Component thresholds
  componentKey?: ReputationComponentKey | null;
  minComponentScore?: number | null;

  // Competitor gap thresholds
  competitorSlug?: string | null;
  minCompetitorGap?: number | null;
  maxCompetitorGap?: number | null;

  // Crisis integration
  minIncidentSeverity?: number | null;
  linkCrisisIncidents?: boolean;

  // Timing controls
  timeWindowMinutes?: number;
  cooldownMinutes?: number;

  // Notification config
  notificationConfig?: AlertNotificationConfig | null;
}

/**
 * Query parameters for listing alert rules
 */
export interface ListReputationAlertRulesQuery {
  [key: string]: unknown;
  isActive?: boolean;
  channel?: ReputationAlertChannel;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'createdAt' | 'lastTriggeredAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Response for listing alert rules
 */
export interface ListReputationAlertRulesResponse {
  rules: BrandReputationAlertRule[];
  total: number;
  limit: number;
  offset: number;
}

// ============================================================================
// ALERT EVENTS
// ============================================================================

/**
 * Alert event context
 */
export interface AlertEventContext {
  triggerCondition?: string;
  mediaEventIds?: string[];
  mentionIds?: string[];
  competitorData?: CompetitorReputationSnapshot;
  crisisIncidents?: CrisisIncidentSummary[];
  additionalInfo?: Record<string, unknown>;
}

/**
 * Brand reputation alert event
 */
export interface BrandReputationAlertEvent {
  id: string;
  orgId: string;
  ruleId: string;

  // Status
  status: ReputationAlertStatus;

  // Score snapshots
  overallScoreBefore?: number;
  overallScoreAfter?: number;
  componentScoresBefore?: ComponentScoresMap;
  componentScoresAfter?: ComponentScoresMap;

  // Competitor gap snapshots
  competitorGapBefore?: number;
  competitorGapAfter?: number;
  competitorSlug?: string;

  // Related incidents
  incidentIds: string[];

  // Event details
  triggerReason?: string;
  context?: AlertEventContext;

  // Timestamps
  triggeredAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;

  createdAt: string;
  updatedAt: string;

  // Joined data (optional)
  rule?: BrandReputationAlertRule;
}

/**
 * Query parameters for listing alert events
 */
export interface ListReputationAlertEventsQuery {
  [key: string]: unknown;
  status?: ReputationAlertStatus;
  ruleId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'triggeredAt' | 'status' | 'overallScoreAfter';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Response for listing alert events
 */
export interface ListReputationAlertEventsResponse {
  events: BrandReputationAlertEvent[];
  total: number;
  limit: number;
  offset: number;
  counts: {
    new: number;
    acknowledged: number;
    muted: number;
    resolved: number;
  };
}

/**
 * Input for acknowledging an alert event
 */
export interface AcknowledgeAlertEventInput {
  notes?: string;
}

/**
 * Input for resolving an alert event
 */
export interface ResolveAlertEventInput {
  resolutionNotes: string;
}

// ============================================================================
// REPORTS
// ============================================================================

/**
 * Key metrics for reports
 */
export interface ReportKeyMetrics {
  currentOverallScore: number;
  previousOverallScore?: number;
  scoreDelta?: number;
  trend: 'up' | 'down' | 'flat';
  totalMentions?: number;
  positiveMentions?: number;
  negativeMentions?: number;
  topPositiveDriver?: string;
  topNegativeDriver?: string;
  alertsTriggered?: number;
  crisisCount?: number;
}

/**
 * Trend data point for reports
 */
export interface ReportTrendDataPoint {
  date: string;
  overallScore: number;
  sentimentScore?: number;
  coverageScore?: number;
  crisisImpactScore?: number;
  competitivePositionScore?: number;
  engagementScore?: number;
}

/**
 * Brand reputation report
 */
export interface BrandReputationReport {
  id: string;
  orgId: string;

  // Report metadata
  title: string;
  description?: string;

  // Period
  reportPeriodStart: string;
  reportPeriodEnd: string;

  // Configuration
  frequency: ReputationReportFrequency;
  format: ReputationReportFormat;
  status: ReputationReportStatus;

  // Snapshots
  overallScoreSnapshot?: BrandReputationScoreSnapshot;
  componentScoresSnapshot?: ComponentScoresMap;
  competitorSnapshot?: CompetitorReputationSnapshot[];

  // Metrics
  keyMetrics?: ReportKeyMetrics;
  trendData?: ReportTrendDataPoint[];

  // Generation metadata
  generationStartedAt?: string;
  generationCompletedAt?: string;
  generationError?: string;

  // Ownership
  createdByUserId?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;

  // Related data (optional)
  sections?: BrandReputationReportSection[];
  recipients?: BrandReputationReportRecipient[];
}

/**
 * Brand reputation report section
 */
export interface BrandReputationReportSection {
  id: string;
  reportId: string;
  orgId: string;

  // Section configuration
  sectionType: ReputationReportSectionType;
  orderIndex: number;
  title: string;

  // Content
  content?: string;

  // Metadata
  metadata?: Record<string, unknown>;

  // Generation tracking
  generatedAt?: string;
  generationModel?: string;
  generationPromptTokens?: number;
  generationCompletionTokens?: number;

  // Edit tracking
  lastEditedAt?: string;
  lastEditedBy?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Brand reputation report recipient
 */
export interface BrandReputationReportRecipient {
  id: string;
  reportId: string;
  orgId: string;

  // Recipient configuration
  channel: ReputationAlertChannel;
  target: string;
  recipientName?: string;

  // Delivery tracking
  isPrimary: boolean;
  deliveryStatus: string;
  deliveredAt?: string;
  deliveryError?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Input for creating a report
 */
export interface CreateReputationReportInput {
  title: string;
  description?: string;
  reportPeriodStart: string;
  reportPeriodEnd: string;
  frequency?: ReputationReportFrequency;
  format?: ReputationReportFormat;
  recipients?: Array<{
    channel: ReputationAlertChannel;
    target: string;
    recipientName?: string;
    isPrimary?: boolean;
  }>;
}

/**
 * Input for generating a report (ad hoc)
 */
export interface GenerateReputationReportInput {
  title?: string;
  description?: string;
  reportPeriodStart: string;
  reportPeriodEnd: string;
  frequency?: ReputationReportFrequency;
  format?: ReputationReportFormat;
  includeCompetitors?: boolean;
  includeCrisisData?: boolean;
  includeMediaMetrics?: boolean;
  recipients?: Array<{
    channel: ReputationAlertChannel;
    target: string;
    recipientName?: string;
    isPrimary?: boolean;
  }>;
}

/**
 * Input for regenerating a report section
 */
export interface RegenerateReputationReportSectionInput {
  additionalContext?: string;
  tone?: 'formal' | 'conversational' | 'executive';
  maxLength?: number;
}

/**
 * Query parameters for listing reports
 */
export interface ListReputationReportsQuery {
  [key: string]: unknown;
  status?: ReputationReportStatus;
  frequency?: ReputationReportFrequency;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'reportPeriodStart' | 'status';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Response for listing reports
 */
export interface ListReputationReportsResponse {
  reports: BrandReputationReport[];
  total: number;
  limit: number;
  offset: number;
}

// ============================================================================
// INSIGHTS
// ============================================================================

/**
 * Reputation driver for insights
 */
export interface ReputationInsightDriver {
  id: string;
  title: string;
  description?: string;
  impact: number;
  component: ReputationComponentKey;
  sourceSystem: string;
  occurredAt: string;
}

/**
 * Reputation insights response
 */
export interface GetReputationReportInsightsResponse {
  // Current state
  currentOverallScore: number;
  previousOverallScore?: number;
  scoreDelta: number;
  trend: 'up' | 'down' | 'flat';

  // Component breakdown
  componentScores: ComponentScoresMap;

  // Drivers
  topPositiveDrivers: ReputationInsightDriver[];
  topNegativeDrivers: ReputationInsightDriver[];

  // Competitor insights
  competitorWithBiggestGapChange?: {
    competitorId: string;
    competitorName: string;
    gapBefore: number;
    gapAfter: number;
    gapDelta: number;
  };

  // Alert summary
  alertSummary: {
    newAlerts: number;
    acknowledgedAlerts: number;
    resolvedAlerts: number;
    totalUnresolved: number;
  };

  // Crisis summary
  crisisSummary?: {
    activeIncidents: number;
    resolvedThisPeriod: number;
    averageSeverity: number;
  };

  // Period info
  periodStart: string;
  periodEnd: string;
  calculatedAt: string;
}

/**
 * Query parameters for insights
 */
export interface GetReputationInsightsQuery {
  [key: string]: unknown;
  periodStart?: string;
  periodEnd?: string;
  includeCompetitors?: boolean;
  includeCrisisData?: boolean;
  maxDrivers?: number;
}

// ============================================================================
// EVALUATION CONTEXT
// ============================================================================

/**
 * Context for evaluating alert rules against a snapshot
 */
export interface AlertEvaluationSnapshotContext {
  currentSnapshot: BrandReputationScoreSnapshot;
  previousSnapshot?: BrandReputationScoreSnapshot;
  competitorGaps?: Record<string, number>; // slug -> gap
  previousCompetitorGaps?: Record<string, number>;
  activeIncidents?: CrisisIncidentSummary[];
  evaluatedAt: string;
}

/**
 * Context for evaluating alert rules over a time window
 */
export interface AlertEvaluationWindowContext {
  windowStart: string;
  windowEnd: string;
  startSnapshot?: BrandReputationScoreSnapshot;
  endSnapshot?: BrandReputationScoreSnapshot;
  competitorGaps?: Record<string, number>;
  previousCompetitorGaps?: Record<string, number>;
  activeIncidents?: CrisisIncidentSummary[];
  evaluatedAt: string;
}

/**
 * Result of evaluating a single alert rule
 */
export interface AlertRuleEvaluationResult {
  ruleId: string;
  ruleName: string;
  triggered: boolean;
  reason?: string;
  cooldownActive: boolean;
  cooldownEndsAt?: string;
  scoreData?: {
    overallBefore?: number;
    overallAfter?: number;
    componentKey?: ReputationComponentKey;
    componentBefore?: number;
    componentAfter?: number;
    competitorSlug?: string;
    gapBefore?: number;
    gapAfter?: number;
  };
  matchedIncidents?: CrisisIncidentSummary[];
}

/**
 * Result of evaluating all rules for an org
 */
export interface AlertEvaluationResult {
  orgId: string;
  evaluatedAt: string;
  rulesEvaluated: number;
  rulesTriggered: number;
  rulesCooledDown: number;
  results: AlertRuleEvaluationResult[];
  eventsCreated: BrandReputationAlertEvent[];
}

// ============================================================================
// SERVICE RESPONSES
// ============================================================================

/**
 * Response for creating an alert rule
 */
export interface CreateAlertRuleResponse {
  rule: BrandReputationAlertRule;
}

/**
 * Response for updating an alert rule
 */
export interface UpdateAlertRuleResponse {
  rule: BrandReputationAlertRule;
}

/**
 * Response for deleting an alert rule
 */
export interface DeleteAlertRuleResponse {
  success: boolean;
  deletedRuleId: string;
}

/**
 * Response for acknowledging an alert event
 */
export interface AcknowledgeAlertEventResponse {
  event: BrandReputationAlertEvent;
}

/**
 * Response for resolving an alert event
 */
export interface ResolveAlertEventResponse {
  event: BrandReputationAlertEvent;
}

/**
 * Response for creating a report
 */
export interface CreateReportResponse {
  report: BrandReputationReport;
}

/**
 * Response for generating a report
 */
export interface GenerateReportResponse {
  report: BrandReputationReport;
  sections: BrandReputationReportSection[];
  generationTimeMs: number;
}

/**
 * Response for regenerating a section
 */
export interface RegenerateSectionResponse {
  section: BrandReputationReportSection;
  regenerationTimeMs: number;
}

/**
 * Response for getting a single report with details
 */
export interface GetReportResponse {
  report: BrandReputationReport;
  sections: BrandReputationReportSection[];
  recipients: BrandReputationReportRecipient[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default section order for reports
 */
export const DEFAULT_REPORT_SECTION_ORDER: ReputationReportSectionType[] = [
  'overview',
  'highlights',
  'risks',
  'opportunities',
  'competitors',
  'recommendations',
  'events_timeline',
];

/**
 * Default section titles
 */
export const DEFAULT_SECTION_TITLES: Record<ReputationReportSectionType, string> = {
  overview: 'Executive Overview',
  highlights: 'Key Highlights',
  risks: 'Risks & Concerns',
  opportunities: 'Opportunities',
  competitors: 'Competitive Landscape',
  recommendations: 'Recommended Actions',
  events_timeline: 'Events Timeline',
};

/**
 * Alert channel display names
 */
export const ALERT_CHANNEL_LABELS: Record<ReputationAlertChannel, string> = {
  in_app: 'In-App',
  email: 'Email',
  slack: 'Slack',
  webhook: 'Webhook',
};

/**
 * Alert status display names
 */
export const ALERT_STATUS_LABELS: Record<ReputationAlertStatus, string> = {
  new: 'New',
  acknowledged: 'Acknowledged',
  muted: 'Muted',
  resolved: 'Resolved',
};

/**
 * Report frequency display names
 */
export const REPORT_FREQUENCY_LABELS: Record<ReputationReportFrequency, string> = {
  ad_hoc: 'Ad Hoc',
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
};

/**
 * Report format display names
 */
export const REPORT_FORMAT_LABELS: Record<ReputationReportFormat, string> = {
  executive_summary: 'Executive Summary',
  detailed: 'Detailed Report',
};

/**
 * Report status display names
 */
export const REPORT_STATUS_LABELS: Record<ReputationReportStatus, string> = {
  draft: 'Draft',
  generating: 'Generating',
  generated: 'Generated',
  published: 'Published',
};

/**
 * Component key display names
 */
export const COMPONENT_KEY_LABELS: Record<ReputationComponentKey, string> = {
  sentiment: 'Sentiment',
  coverage: 'Coverage',
  crisis_impact: 'Crisis Impact',
  competitive_position: 'Competitive Position',
  engagement: 'Engagement',
};
