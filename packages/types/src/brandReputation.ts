/**
 * Brand Reputation Intelligence Types (Sprint S56)
 *
 * Type definitions for real-time brand reputation scoring,
 * executive radar dashboard, and reputation event tracking.
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Components that make up the overall reputation score
 */
export type ReputationComponent =
  | 'sentiment'
  | 'coverage'
  | 'crisis_impact'
  | 'competitive_position'
  | 'engagement';

/**
 * Direction of reputation trend
 */
export type ReputationTrendDirection = 'up' | 'down' | 'flat';

/**
 * Severity levels for reputation alerts
 */
export type ReputationAlertSeverity = 'info' | 'warning' | 'critical';

/**
 * Time windows for reputation analysis
 */
export type ReputationTimeWindow = '24h' | '7d' | '30d' | '90d' | 'all';

/**
 * Source systems that generate reputation events
 */
export type ReputationSourceSystem =
  | 'media_monitoring'
  | 'media_alert'
  | 'media_performance'
  | 'crisis_incident'
  | 'competitive_intel'
  | 'pr_outreach'
  | 'pr_generator'
  | 'pr_pitch'
  | 'journalist_engagement'
  | 'social_listening'
  | 'manual_adjustment';

/**
 * Types of reputation signals/events
 */
export type ReputationSignalType =
  | 'sentiment_shift'
  | 'coverage_spike'
  | 'coverage_drop'
  | 'crisis_detected'
  | 'crisis_resolved'
  | 'competitor_gain'
  | 'competitor_loss'
  | 'engagement_increase'
  | 'engagement_decrease'
  | 'media_mention'
  | 'journalist_response'
  | 'outreach_success'
  | 'outreach_failure'
  | 'alert_triggered'
  | 'performance_change';

/**
 * Severity levels for reputation events
 */
export type ReputationEventSeverity = 'low' | 'medium' | 'high' | 'critical';

// ============================================================================
// CORE INTERFACES
// ============================================================================

/**
 * Point-in-time reputation score breakdown
 */
export interface ReputationScoreBreakdown {
  overall: number;
  sentiment: number;
  coverage: number;
  crisisImpact: number;
  competitivePosition: number;
  engagement: number;
}

/**
 * Individual component score with metadata
 */
export interface ComponentScore {
  component: ReputationComponent;
  score: number;
  previousScore?: number;
  delta?: number;
  weight: number;
  contribution: number; // Weighted contribution to overall score
  trend: ReputationTrendDirection;
  factors: ComponentFactor[];
}

/**
 * Factor contributing to a component score
 */
export interface ComponentFactor {
  name: string;
  impact: number; // Positive or negative impact
  description: string;
  sourceSystem?: ReputationSourceSystem;
  sourceEntityId?: string;
}

/**
 * A driver of reputation change (positive or negative)
 */
export interface ReputationDriver {
  id: string;
  type: 'positive' | 'negative';
  title: string;
  description: string;
  impact: number; // Score impact (positive or negative)
  impactPercentage: number; // % of overall change
  component: ReputationComponent;
  sourceSystem: ReputationSourceSystem;
  sourceEntityType?: string;
  sourceEntityId?: string;
  occurredAt: string;
  metadata?: Record<string, unknown>;
}

/**
 * Comparison of brand reputation vs a competitor
 */
export interface CompetitorReputationComparison {
  competitorId: string;
  competitorName: string;
  competitorScore: number;
  competitorTrend: ReputationTrendDirection;
  brandScore: number;
  scoreDelta: number; // Brand score - Competitor score
  rank: number;
  previousRank?: number;
  rankChange: number;
  strengths: string[]; // Areas where brand outperforms
  weaknesses: string[]; // Areas where competitor outperforms
  componentComparison: {
    component: ReputationComponent;
    brandScore: number;
    competitorScore: number;
    delta: number;
  }[];
}

/**
 * A point on the reputation trend timeline
 */
export interface ReputationTrendPoint {
  timestamp: string;
  overallScore: number;
  components: {
    sentiment: number;
    coverage: number;
    crisisImpact: number;
    competitivePosition: number;
    engagement: number;
  };
  events: number; // Number of events in this period
  crisisActive: boolean;
}

/**
 * Brand reputation snapshot (stored in database)
 */
export interface BrandReputationSnapshot {
  id: string;
  orgId: string;
  createdAt: string;
  windowStart: string;
  windowEnd: string;

  // Scores
  overallScore: number;
  previousScore?: number;
  scoreDelta?: number;
  trendDirection: ReputationTrendDirection;

  // Component scores
  sentimentScore: number;
  coverageScore: number;
  crisisImpactScore: number;
  competitivePositionScore: number;
  engagementScore: number;

  // Aggregated metrics
  totalMentions: number;
  positiveMentions: number;
  negativeMentions: number;
  neutralMentions: number;

  // Crisis metrics
  activeCrisisCount: number;
  resolvedCrisisCount: number;
  crisisSeverityAvg?: number;

  // Engagement metrics
  totalOutreachSent: number;
  outreachResponseRate?: number;
  journalistEngagementCount: number;

  // Competitive metrics
  competitiveRank?: number;
  competitorsTracked: number;

  // Drivers
  topPositiveDrivers: ReputationDriver[];
  topNegativeDrivers: ReputationDriver[];

  // Competitor comparison
  competitorComparison: CompetitorReputationComparison[];

  // Executive summary
  executiveSummary?: string;
  keyRisks: string[];
  keyOpportunities: string[];

  // Metadata
  metadata: Record<string, unknown>;

  // Calculation info
  calculationStartedAt?: string;
  calculationCompletedAt?: string;
  eventsProcessed: number;
}

/**
 * Brand reputation event (stored in database)
 */
export interface BrandReputationEvent {
  id: string;
  orgId: string;
  createdAt: string;
  eventTimestamp: string;

  // Event details
  sourceSystem: ReputationSourceSystem;
  signalType: ReputationSignalType;
  delta: number;
  affectedComponent: ReputationComponent;
  severity: ReputationEventSeverity;

  // Description
  title: string;
  description?: string;

  // Source reference
  sourceEntityType?: string;
  sourceEntityId?: string;

  // Context
  context: Record<string, unknown>;

  // Processing status
  isProcessed: boolean;
  processedAt?: string;
  processedSnapshotId?: string;

  // Audit
  createdBy?: string;
}

/**
 * Brand reputation configuration (stored in database)
 */
export interface BrandReputationConfig {
  id: string;
  orgId: string;
  createdAt: string;
  updatedAt: string;

  // Component weights (should sum to 100)
  weightSentiment: number;
  weightCoverage: number;
  weightCrisis: number;
  weightCompetitive: number;
  weightEngagement: number;

  // Alert thresholds
  thresholdAlertScoreDrop: number;
  thresholdCriticalScore: number;
  thresholdWarningScore: number;

  // Baseline
  baselineScore?: number;

  // Calculation settings
  defaultTimeWindow: ReputationTimeWindow;
  autoRecalculate: boolean;
  recalculateIntervalHours: number;

  // Competitor tracking
  trackedCompetitorIds: string[];

  // Notification settings
  enableScoreAlerts: boolean;
  alertRecipients: AlertRecipient[];

  // Additional settings
  settings: Record<string, unknown>;

  // Audit
  updatedBy?: string;
}

/**
 * Alert recipient configuration
 */
export interface AlertRecipient {
  type: 'email' | 'slack' | 'webhook';
  destination: string; // Email address, Slack channel, or webhook URL
  severities: ReputationAlertSeverity[];
}

/**
 * Brand reputation alert
 */
export interface BrandReputationAlert {
  id: string;
  orgId: string;
  createdAt: string;

  // Alert details
  severity: ReputationAlertSeverity;
  title: string;
  message: string;

  // Related snapshot
  snapshotId?: string;

  // Trigger details
  triggerType: string;
  triggerValue?: number;
  thresholdValue?: number;

  // Related events
  relatedEventIds: string[];

  // Status
  isAcknowledged: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: string;

  // Resolution
  isResolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;

  // Notifications
  notificationsSent: NotificationRecord[];

  // Metadata
  metadata: Record<string, unknown>;
}

/**
 * Notification record
 */
export interface NotificationRecord {
  type: 'email' | 'slack' | 'webhook';
  destination: string;
  sentAt: string;
  success: boolean;
  error?: string;
}

/**
 * Executive radar summary for dashboard
 */
export interface ExecutiveRadarSummary {
  // Current state
  currentScore: number;
  previousScore: number;
  scoreDelta: number;
  trendDirection: ReputationTrendDirection;
  scoreBreakdown: ReputationScoreBreakdown;

  // Component analysis
  componentScores: ComponentScore[];
  strongestComponent: ReputationComponent;
  weakestComponent: ReputationComponent;

  // Drivers
  topPositiveDrivers: ReputationDriver[];
  topNegativeDrivers: ReputationDriver[];
  recentEvents: BrandReputationEvent[];

  // Competitive context
  competitorComparison: CompetitorReputationComparison[];
  competitiveRank: number;
  competitorCount: number;

  // Crisis context
  activeCrises: number;
  crisisImpactOnScore: number;
  crisisNotes?: string;

  // Trend data
  trendPoints: ReputationTrendPoint[];

  // Executive narrative
  summary: string;
  keyRisks: string[];
  keyOpportunities: string[];
  recommendedActions: string[];

  // Alerts
  activeAlerts: BrandReputationAlert[];
  alertCount: number;

  // Metadata
  calculatedAt: string;
  windowStart: string;
  windowEnd: string;
  timeWindow: ReputationTimeWindow;
}

// ============================================================================
// REQUEST/RESPONSE DTOS
// ============================================================================

/**
 * Request to get reputation dashboard data
 */
export interface GetReputationDashboardRequest {
  window?: ReputationTimeWindow;
  includeCompetitors?: boolean;
  includeTrend?: boolean;
  includeEvents?: boolean;
  maxDrivers?: number;
}

/**
 * Response for reputation dashboard data
 */
export interface GetReputationDashboardResponse {
  snapshot: BrandReputationSnapshot;
  executiveSummary: ExecutiveRadarSummary;
  config: BrandReputationConfig;
  hasData: boolean;
  lastCalculatedAt?: string;
}

/**
 * Request to get reputation trend data
 */
export interface GetReputationTrendRequest {
  window: ReputationTimeWindow;
  granularity?: 'hourly' | 'daily' | 'weekly';
  includeComponents?: boolean;
}

/**
 * Response for reputation trend data
 */
export interface GetReputationTrendResponse {
  trendPoints: ReputationTrendPoint[];
  overallTrend: ReputationTrendDirection;
  startScore: number;
  endScore: number;
  highScore: number;
  lowScore: number;
  averageScore: number;
  volatility: number; // Standard deviation
  window: ReputationTimeWindow;
  windowStart: string;
  windowEnd: string;
}

/**
 * Request to recalculate reputation
 */
export interface RecalculateReputationRequest {
  window: ReputationTimeWindow;
  forceRefresh?: boolean;
  includeHistorical?: boolean;
}

/**
 * Response for recalculation
 */
export interface RecalculateReputationResponse {
  snapshot: BrandReputationSnapshot;
  eventsProcessed: number;
  calculationTimeMs: number;
  previousScore?: number;
  newScore: number;
  scoreDelta?: number;
}

/**
 * Request to update reputation config
 */
export interface UpdateReputationConfigRequest {
  weightSentiment?: number;
  weightCoverage?: number;
  weightCrisis?: number;
  weightCompetitive?: number;
  weightEngagement?: number;
  thresholdAlertScoreDrop?: number;
  thresholdCriticalScore?: number;
  thresholdWarningScore?: number;
  baselineScore?: number;
  defaultTimeWindow?: ReputationTimeWindow;
  autoRecalculate?: boolean;
  recalculateIntervalHours?: number;
  trackedCompetitorIds?: string[];
  enableScoreAlerts?: boolean;
  alertRecipients?: AlertRecipient[];
  settings?: Record<string, unknown>;
}

/**
 * Request to create a manual reputation event
 */
export interface CreateReputationEventRequest {
  signalType: ReputationSignalType;
  delta: number;
  affectedComponent: ReputationComponent;
  severity: ReputationEventSeverity;
  title: string;
  description?: string;
  sourceEntityType?: string;
  sourceEntityId?: string;
  context?: Record<string, unknown>;
}

/**
 * Request to get reputation events
 */
export interface GetReputationEventsRequest {
  window?: ReputationTimeWindow;
  sourceSystem?: ReputationSourceSystem;
  component?: ReputationComponent;
  severity?: ReputationEventSeverity;
  limit?: number;
  offset?: number;
}

/**
 * Response for reputation events
 */
export interface GetReputationEventsResponse {
  events: BrandReputationEvent[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Request to acknowledge an alert
 */
export interface AcknowledgeAlertRequest {
  notes?: string;
}

/**
 * Request to resolve an alert
 */
export interface ResolveAlertRequest {
  resolutionNotes: string;
}

/**
 * Request to get reputation alerts
 */
export interface GetReputationAlertsRequest {
  severity?: ReputationAlertSeverity;
  isAcknowledged?: boolean;
  isResolved?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Response for reputation alerts
 */
export interface GetReputationAlertsResponse {
  alerts: BrandReputationAlert[];
  total: number;
  unacknowledgedCount: number;
  criticalCount: number;
}

// ============================================================================
// CALCULATION HELPERS
// ============================================================================

/**
 * Input for score calculation
 */
export interface ScoreCalculationInput {
  // Sentiment data
  positiveMentions: number;
  negativeMentions: number;
  neutralMentions: number;
  averageSentiment: number; // -1 to 1

  // Coverage data
  totalMentions: number;
  tier1Mentions: number;
  tier2Mentions: number;
  tier3Mentions: number;
  mentionVelocity: number; // Mentions per day

  // Crisis data
  activeCrises: number;
  criticalCrises: number;
  crisisSeveritySum: number;
  recentCrisisResolutions: number;

  // Competitive data
  competitorAvgScore: number;
  competitorCount: number;
  rankAmongCompetitors: number;

  // Engagement data
  outreachSent: number;
  outreachResponses: number;
  journalistMeetings: number;
  mediaHits: number;
}

/**
 * Output from score calculation
 */
export interface ScoreCalculationOutput {
  overallScore: number;
  components: {
    sentiment: number;
    coverage: number;
    crisisImpact: number;
    competitivePosition: number;
    engagement: number;
  };
  weightedContributions: {
    sentiment: number;
    coverage: number;
    crisisImpact: number;
    competitivePosition: number;
    engagement: number;
  };
}

/**
 * Configuration for score calculation
 */
export interface ScoreCalculationConfig {
  weights: {
    sentiment: number;
    coverage: number;
    crisisImpact: number;
    competitivePosition: number;
    engagement: number;
  };
  thresholds: {
    sentimentNeutralRange: [number, number]; // e.g., [-0.2, 0.2]
    coverageBaseline: number; // Expected mentions per period
    crisisSeverityMultiplier: number;
    engagementResponseRateTarget: number;
  };
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Summary statistics for a time period
 */
export interface ReputationPeriodStats {
  window: ReputationTimeWindow;
  windowStart: string;
  windowEnd: string;
  snapshotCount: number;
  eventCount: number;
  averageScore: number;
  minScore: number;
  maxScore: number;
  scoreVolatility: number;
  trendDirection: ReputationTrendDirection;
}

/**
 * Health check result for reputation system
 */
export interface ReputationSystemHealth {
  isHealthy: boolean;
  lastSnapshotAt?: string;
  lastEventAt?: string;
  snapshotAge?: number; // Hours since last snapshot
  eventBacklog: number; // Unprocessed events
  configValid: boolean;
  issues: string[];
}

/**
 * Time window boundaries
 */
export interface TimeWindowBoundaries {
  start: Date;
  end: Date;
  durationHours: number;
  label: string;
}

/**
 * Source system aggregation
 */
export interface SourceSystemAggregation {
  sourceSystem: ReputationSourceSystem;
  eventCount: number;
  totalDelta: number;
  averageDelta: number;
  maxSeverity: ReputationEventSeverity;
  latestEventAt: string;
}
