/**
 * Executive Digest Types (Sprint S62)
 * Automated Strategic Briefs & Exec Weekly Digest Generator V1
 *
 * Types for:
 * - Digest configurations and scheduling
 * - LLM-generated sections
 * - Email recipients and delivery
 * - PDF generation and storage
 * - Audit logging
 */

// ============================================================================
// Enums and Constants
// ============================================================================

/**
 * Delivery period for digests
 */
export type ExecDigestDeliveryPeriod = 'weekly' | 'monthly';

export const EXEC_DIGEST_DELIVERY_PERIODS: ExecDigestDeliveryPeriod[] = ['weekly', 'monthly'];

export const EXEC_DIGEST_DELIVERY_PERIOD_LABELS: Record<ExecDigestDeliveryPeriod, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
};

/**
 * Time window for digest data aggregation
 */
export type ExecDigestTimeWindow = '7d' | '30d';

export const EXEC_DIGEST_TIME_WINDOWS: ExecDigestTimeWindow[] = ['7d', '30d'];

export const EXEC_DIGEST_TIME_WINDOW_LABELS: Record<ExecDigestTimeWindow, string> = {
  '7d': 'Last 7 Days',
  '30d': 'Last 30 Days',
};

/**
 * Section types within a digest
 */
export type ExecDigestSectionType =
  | 'executive_summary'
  | 'key_kpis'
  | 'key_insights'
  | 'risk_summary'
  | 'reputation_summary'
  | 'competitive_summary'
  | 'media_performance'
  | 'crisis_status'
  | 'governance_highlights'
  | 'action_recommendations'
  | 'custom';

export const EXEC_DIGEST_SECTION_TYPES: ExecDigestSectionType[] = [
  'executive_summary',
  'key_kpis',
  'key_insights',
  'risk_summary',
  'reputation_summary',
  'competitive_summary',
  'media_performance',
  'crisis_status',
  'governance_highlights',
  'action_recommendations',
  'custom',
];

export const EXEC_DIGEST_SECTION_TYPE_LABELS: Record<ExecDigestSectionType, string> = {
  executive_summary: 'Executive Summary',
  key_kpis: 'Key Performance Indicators',
  key_insights: 'Key Insights',
  risk_summary: 'Risk Summary',
  reputation_summary: 'Brand Reputation',
  competitive_summary: 'Competitive Intelligence',
  media_performance: 'Media Performance',
  crisis_status: 'Crisis Status',
  governance_highlights: 'Governance & Compliance',
  action_recommendations: 'Action Recommendations',
  custom: 'Custom Section',
};

export const EXEC_DIGEST_SECTION_DEFAULT_ORDER: ExecDigestSectionType[] = [
  'executive_summary',
  'key_kpis',
  'key_insights',
  'risk_summary',
  'reputation_summary',
  'media_performance',
  'competitive_summary',
  'crisis_status',
  'governance_highlights',
  'action_recommendations',
];

/**
 * Delivery status for digest deliveries
 */
export type ExecDigestDeliveryStatus =
  | 'pending'
  | 'sending'
  | 'success'
  | 'partial_success'
  | 'error';

export const EXEC_DIGEST_DELIVERY_STATUSES: ExecDigestDeliveryStatus[] = [
  'pending',
  'sending',
  'success',
  'partial_success',
  'error',
];

export const EXEC_DIGEST_DELIVERY_STATUS_LABELS: Record<ExecDigestDeliveryStatus, string> = {
  pending: 'Pending',
  sending: 'Sending',
  success: 'Delivered',
  partial_success: 'Partially Delivered',
  error: 'Failed',
};

/**
 * Audit action types
 */
export type ExecDigestActionType =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'generated'
  | 'delivered'
  | 'recipient_added'
  | 'recipient_removed'
  | 'sections_reordered'
  | 'pdf_generated'
  | 'scheduled';

export const EXEC_DIGEST_ACTION_TYPES: ExecDigestActionType[] = [
  'created',
  'updated',
  'deleted',
  'generated',
  'delivered',
  'recipient_added',
  'recipient_removed',
  'sections_reordered',
  'pdf_generated',
  'scheduled',
];

// ============================================================================
// Core Entity Types
// ============================================================================

/**
 * Executive Digest configuration
 */
export interface ExecDigest {
  id: string;
  orgId: string;

  // Basic info
  title: string;
  description: string | null;

  // Scheduling
  deliveryPeriod: ExecDigestDeliveryPeriod;
  timeWindow: ExecDigestTimeWindow;
  scheduleDayOfWeek: number; // 0=Sunday, 1=Monday, etc.
  scheduleHour: number; // 0-23
  scheduleTimezone: string;
  nextDeliveryAt: string | null;
  lastDeliveredAt: string | null;

  // Configuration flags
  includeRecommendations: boolean;
  includeKpis: boolean;
  includeInsights: boolean;
  includeRiskSummary: boolean;
  includeReputationSummary: boolean;
  includeCompetitiveSummary: boolean;
  includeMediaPerformance: boolean;
  includeCrisisStatus: boolean;
  includeGovernance: boolean;

  // Data snapshots
  summary: ExecDigestSummary;
  kpiSnapshot: ExecDigestKpiSnapshot[];
  insightsSnapshot: ExecDigestInsightSnapshot[];

  // PDF info
  pdfStoragePath: string | null;
  pdfGeneratedAt: string | null;

  // Status
  isActive: boolean;
  isArchived: boolean;

  // Ownership
  createdBy: string | null;
  updatedBy: string | null;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Digest summary snapshot
 */
export interface ExecDigestSummary {
  generatedAt?: string;
  timeWindow?: ExecDigestTimeWindow;
  totalKpis?: number;
  totalInsights?: number;
  riskScore?: number;
  reputationScore?: number;
  sentimentScore?: number;
  topRiskCount?: number;
  topOpportunityCount?: number;
  systemsContributing?: string[];
  narrative?: string;
}

/**
 * KPI snapshot within digest
 */
export interface ExecDigestKpiSnapshot {
  metricKey: string;
  metricLabel: string;
  metricValue: number;
  metricUnit?: string;
  trend?: {
    direction: 'up' | 'down' | 'flat';
    changePercent?: number;
    periodLabel?: string;
  };
  category?: string;
  sourceSystem?: string;
}

/**
 * Insight snapshot within digest
 */
export interface ExecDigestInsightSnapshot {
  title: string;
  description?: string;
  sourceSystem: string;
  severityOrImpact: number;
  isRisk: boolean;
  isOpportunity: boolean;
  category?: string;
}

/**
 * Digest section (LLM-generated)
 */
export interface ExecDigestSection {
  id: string;
  orgId: string;
  digestId: string;

  // Section details
  sectionType: ExecDigestSectionType;
  title: string;
  content: string;
  sortOrder: number;

  // LLM metadata
  modelName: string | null;
  tokensUsed: number | null;
  generationDurationMs: number | null;

  // Configuration
  isVisible: boolean;

  // Metadata
  meta: Record<string, unknown>;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Digest recipient
 */
export interface ExecDigestRecipient {
  id: string;
  orgId: string;
  digestId: string;

  // Recipient info
  email: string;
  name: string | null;
  role: string | null;

  // Validation
  isValidated: boolean;
  validatedAt: string | null;

  // Status
  isActive: boolean;

  // Delivery preferences
  includePdf: boolean;
  includeInlineSummary: boolean;

  // Metadata
  meta: Record<string, unknown>;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Delivery log entry
 */
export interface ExecDigestDeliveryLog {
  id: string;
  orgId: string;
  digestId: string;

  // Delivery details
  deliveryPeriod: ExecDigestDeliveryPeriod;
  timeWindow: ExecDigestTimeWindow;

  // Timing
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;

  // Status
  status: ExecDigestDeliveryStatus;
  errorMessage: string | null;

  // Statistics
  recipientsCount: number;
  successfulDeliveries: number;
  failedDeliveries: number;

  // PDF info
  pdfStoragePath: string | null;
  pdfSizeBytes: number | null;

  // Metadata
  metadata: Record<string, unknown>;
  recipientResults: ExecDigestRecipientResult[];

  // Timestamps
  createdAt: string;
}

/**
 * Per-recipient delivery result
 */
export interface ExecDigestRecipientResult {
  recipientId: string;
  email: string;
  status: 'success' | 'error';
  errorMessage?: string;
  sentAt?: string;
}

/**
 * Audit log entry
 */
export interface ExecDigestAuditLog {
  id: string;
  orgId: string;
  userId: string | null;
  digestId: string | null;

  // Action details
  actionType: ExecDigestActionType;
  description: string;

  // Metadata
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;

  // Timestamps
  createdAt: string;
}

// ============================================================================
// Extended Types (with counts)
// ============================================================================

/**
 * Digest with related counts
 */
export interface ExecDigestWithCounts extends ExecDigest {
  sectionsCount: number;
  recipientsCount: number;
  deliveriesCount: number;
  lastDeliveryStatus?: ExecDigestDeliveryStatus;
}

// ============================================================================
// API Input Types
// ============================================================================

/**
 * Create digest input
 */
export interface CreateExecDigestInput {
  title?: string;
  description?: string;
  deliveryPeriod?: ExecDigestDeliveryPeriod;
  timeWindow?: ExecDigestTimeWindow;
  scheduleDayOfWeek?: number;
  scheduleHour?: number;
  scheduleTimezone?: string;
  includeRecommendations?: boolean;
  includeKpis?: boolean;
  includeInsights?: boolean;
  includeRiskSummary?: boolean;
  includeReputationSummary?: boolean;
  includeCompetitiveSummary?: boolean;
  includeMediaPerformance?: boolean;
  includeCrisisStatus?: boolean;
  includeGovernance?: boolean;
  isActive?: boolean;
}

/**
 * Update digest input
 */
export interface UpdateExecDigestInput {
  title?: string;
  description?: string | null;
  deliveryPeriod?: ExecDigestDeliveryPeriod;
  timeWindow?: ExecDigestTimeWindow;
  scheduleDayOfWeek?: number;
  scheduleHour?: number;
  scheduleTimezone?: string;
  includeRecommendations?: boolean;
  includeKpis?: boolean;
  includeInsights?: boolean;
  includeRiskSummary?: boolean;
  includeReputationSummary?: boolean;
  includeCompetitiveSummary?: boolean;
  includeMediaPerformance?: boolean;
  includeCrisisStatus?: boolean;
  includeGovernance?: boolean;
  isActive?: boolean;
  isArchived?: boolean;
}

/**
 * Generate digest input
 */
export interface GenerateExecDigestInput {
  timeWindowOverride?: ExecDigestTimeWindow;
  forceRegenerate?: boolean;
  generatePdf?: boolean;
  includeSections?: ExecDigestSectionType[];
}

/**
 * Deliver digest input
 */
export interface DeliverExecDigestInput {
  recipientIds?: string[]; // If empty, send to all active recipients
  regeneratePdf?: boolean;
  testMode?: boolean; // If true, don't actually send emails
}

/**
 * Add recipient input
 */
export interface AddExecDigestRecipientInput {
  email: string;
  name?: string;
  role?: string;
  includePdf?: boolean;
  includeInlineSummary?: boolean;
}

/**
 * Update recipient input
 */
export interface UpdateExecDigestRecipientInput {
  name?: string | null;
  role?: string | null;
  includePdf?: boolean;
  includeInlineSummary?: boolean;
  isActive?: boolean;
}

/**
 * Section order update input
 */
export interface UpdateSectionOrderInput {
  sectionId: string;
  sortOrder: number;
}

// ============================================================================
// API Query Types
// ============================================================================

/**
 * List digests query
 */
export interface ListExecDigestsQuery {
  includeArchived?: boolean;
  deliveryPeriod?: ExecDigestDeliveryPeriod;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * List recipients query
 */
export interface ListExecDigestRecipientsQuery {
  digestId: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * List delivery logs query
 */
export interface ListExecDigestDeliveryLogsQuery {
  digestId: string;
  status?: ExecDigestDeliveryStatus;
  limit?: number;
  offset?: number;
}

/**
 * List sections query
 */
export interface ListExecDigestSectionsQuery {
  digestId: string;
  sectionType?: ExecDigestSectionType;
  isVisible?: boolean;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * List digests response
 */
export interface ListExecDigestsResponse {
  digests: ExecDigestWithCounts[];
  total: number;
  hasMore: boolean;
}

/**
 * Get digest response
 */
export interface GetExecDigestResponse {
  digest: ExecDigest;
  sections: ExecDigestSection[];
  recipients: ExecDigestRecipient[];
  recentDeliveries: ExecDigestDeliveryLog[];
}

/**
 * Generate digest response
 */
export interface GenerateExecDigestResponse {
  digest: ExecDigest;
  sections: ExecDigestSection[];
  pdfUrl: string | null;
  generationDurationMs: number;
  totalTokensUsed: number;
}

/**
 * Deliver digest response
 */
export interface DeliverExecDigestResponse {
  deliveryLog: ExecDigestDeliveryLog;
  pdfUrl: string | null;
}

/**
 * List recipients response
 */
export interface ListExecDigestRecipientsResponse {
  recipients: ExecDigestRecipient[];
  total: number;
  hasMore: boolean;
}

/**
 * List delivery logs response
 */
export interface ListExecDigestDeliveryLogsResponse {
  deliveryLogs: ExecDigestDeliveryLog[];
  total: number;
  hasMore: boolean;
}

/**
 * List sections response
 */
export interface ListExecDigestSectionsResponse {
  sections: ExecDigestSection[];
  total: number;
}

/**
 * Digest statistics
 */
export interface ExecDigestStats {
  totalDigests: number;
  activeDigests: number;
  totalDeliveries: number;
  successfulDeliveries: number;
  totalRecipients: number;
  activeRecipients: number;
}

// ============================================================================
// Service Configuration
// ============================================================================

/**
 * Service configuration
 */
export interface ExecDigestServiceConfig {
  supabase: unknown;
  openaiApiKey: string;
  smtpConfig?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  storageBucket?: string;
  debugMode?: boolean;
}

// ============================================================================
// PDF Generation Types
// ============================================================================

/**
 * PDF generation options
 */
export interface ExecDigestPdfOptions {
  includeHeader?: boolean;
  includeFooter?: boolean;
  includeBranding?: boolean;
  pageSize?: 'A4' | 'Letter';
  orientation?: 'portrait' | 'landscape';
}

/**
 * PDF generation result
 */
export interface ExecDigestPdfResult {
  storagePath: string;
  publicUrl: string | null;
  sizeBytes: number;
  pageCount: number;
  generatedAt: string;
}

// ============================================================================
// Email Types
// ============================================================================

/**
 * Email delivery options
 */
export interface ExecDigestEmailOptions {
  subject?: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  attachPdf?: boolean;
  inlineSummary?: boolean;
}

/**
 * Email delivery result per recipient
 */
export interface ExecDigestEmailResult {
  recipientId: string;
  email: string;
  status: 'success' | 'error';
  messageId?: string;
  errorMessage?: string;
  sentAt: string;
}

// ============================================================================
// Scheduler Types
// ============================================================================

/**
 * Scheduled job info
 */
export interface ExecDigestScheduledJob {
  digestId: string;
  orgId: string;
  scheduledFor: string;
  deliveryPeriod: ExecDigestDeliveryPeriod;
  timeWindow: ExecDigestTimeWindow;
  status: 'scheduled' | 'running' | 'completed' | 'failed';
}

// ============================================================================
// Content Generation Types
// ============================================================================

/**
 * Section generation context
 */
export interface ExecDigestSectionContext {
  sectionType: ExecDigestSectionType;
  timeWindow: ExecDigestTimeWindow;
  kpis: ExecDigestKpiSnapshot[];
  insights: ExecDigestInsightSnapshot[];
  riskData?: Record<string, unknown>;
  reputationData?: Record<string, unknown>;
  competitiveData?: Record<string, unknown>;
  mediaData?: Record<string, unknown>;
  crisisData?: Record<string, unknown>;
  governanceData?: Record<string, unknown>;
}

/**
 * Section generation result
 */
export interface ExecDigestSectionResult {
  sectionType: ExecDigestSectionType;
  title: string;
  content: string;
  tokensUsed: number;
  durationMs: number;
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Check if a string is a valid delivery period
 */
export function isValidDeliveryPeriod(value: string): value is ExecDigestDeliveryPeriod {
  return EXEC_DIGEST_DELIVERY_PERIODS.includes(value as ExecDigestDeliveryPeriod);
}

/**
 * Check if a string is a valid time window
 */
export function isValidTimeWindow(value: string): value is ExecDigestTimeWindow {
  return EXEC_DIGEST_TIME_WINDOWS.includes(value as ExecDigestTimeWindow);
}

/**
 * Check if a string is a valid section type
 */
export function isValidSectionType(value: string): value is ExecDigestSectionType {
  return EXEC_DIGEST_SECTION_TYPES.includes(value as ExecDigestSectionType);
}

/**
 * Check if a string is a valid delivery status
 */
export function isValidDeliveryStatus(value: string): value is ExecDigestDeliveryStatus {
  return EXEC_DIGEST_DELIVERY_STATUSES.includes(value as ExecDigestDeliveryStatus);
}

/**
 * Check if a string is a valid action type
 */
export function isValidActionType(value: string): value is ExecDigestActionType {
  return EXEC_DIGEST_ACTION_TYPES.includes(value as ExecDigestActionType);
}

// ============================================================================
// Display Helpers
// ============================================================================

/**
 * Get label for delivery period
 */
export function getDeliveryPeriodLabel(period: ExecDigestDeliveryPeriod): string {
  return EXEC_DIGEST_DELIVERY_PERIOD_LABELS[period] || period;
}

/**
 * Get label for time window
 */
export function getTimeWindowLabel(window: ExecDigestTimeWindow): string {
  return EXEC_DIGEST_TIME_WINDOW_LABELS[window] || window;
}

/**
 * Get label for section type
 */
export function getSectionTypeLabel(type: ExecDigestSectionType): string {
  return EXEC_DIGEST_SECTION_TYPE_LABELS[type] || type;
}

/**
 * Get label for delivery status
 */
export function getDeliveryStatusLabel(status: ExecDigestDeliveryStatus): string {
  return EXEC_DIGEST_DELIVERY_STATUS_LABELS[status] || status;
}

/**
 * Get day of week label
 */
export function getDayOfWeekLabel(day: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[day] || 'Unknown';
}

/**
 * Format schedule time
 */
export function formatScheduleTime(hour: number, timezone: string): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:00 ${period} ${timezone}`;
}
