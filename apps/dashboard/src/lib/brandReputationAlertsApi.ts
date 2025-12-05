/**
 * Brand Reputation Alerts & Executive Reporting API Client (Sprint S57)
 *
 * Type-safe client functions for brand reputation alerts and executive reports API endpoints
 * plus helper utilities for formatting and display.
 */

import type {
  BrandReputationAlertRule,
  BrandReputationAlertEvent,
  CreateReputationAlertRuleInput,
  UpdateReputationAlertRuleInput,
  ListReputationAlertRulesQuery,
  ListReputationAlertRulesResponse,
  ListReputationAlertEventsQuery,
  ListReputationAlertEventsResponse,
  CreateReputationReportInput,
  GenerateReputationReportInput,
  RegenerateReputationReportSectionInput,
  ListReputationReportsQuery,
  ListReputationReportsResponse,
  GetReputationInsightsQuery,
  GetReputationReportInsightsResponse,
  GetReportResponse,
  CreateReportResponse,
  GenerateReportResponse,
  RegenerateSectionResponse,
  ReputationAlertChannel,
  ReputationAlertStatus,
  ReputationReportFrequency,
  ReputationReportFormat,
  ReputationReportStatus,
  ReputationReportSectionType,
  ReputationComponentKey,
} from '@pravado/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_PREFIX = '/api/v1/reputation-alerts';

// ============================================================================
// GENERIC API CLIENT
// ============================================================================

async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  const url = `${BASE_URL}${API_PREFIX}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    'x-org-id': localStorage.getItem('orgId') || '',
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || `API error: ${response.status}`);
  }

  return result;
}

function buildQueryString(params: Record<string, unknown>): string {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach((v) => query.append(key, String(v)));
      } else if (value instanceof Date) {
        query.append(key, value.toISOString());
      } else {
        query.append(key, String(value));
      }
    }
  });

  return query.toString();
}

// ============================================================================
// ALERT RULE API
// ============================================================================

/**
 * Create a new alert rule
 */
export async function createAlertRule(
  data: CreateReputationAlertRuleInput
): Promise<BrandReputationAlertRule> {
  const result = await apiClient<BrandReputationAlertRule>('/alert-rules', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.data!;
}

/**
 * List alert rules with filters and pagination
 */
export async function listAlertRules(
  query: ListReputationAlertRulesQuery = {}
): Promise<ListReputationAlertRulesResponse> {
  const queryString = buildQueryString(query);
  const result = await apiClient<ListReputationAlertRulesResponse>(
    `/alert-rules?${queryString}`
  );
  return result.data!;
}

/**
 * Get a single alert rule by ID
 */
export async function getAlertRule(ruleId: string): Promise<BrandReputationAlertRule> {
  const result = await apiClient<BrandReputationAlertRule>(`/alert-rules/${ruleId}`);
  return result.data!;
}

/**
 * Update an alert rule
 */
export async function updateAlertRule(
  ruleId: string,
  data: UpdateReputationAlertRuleInput
): Promise<BrandReputationAlertRule> {
  const result = await apiClient<BrandReputationAlertRule>(`/alert-rules/${ruleId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return result.data!;
}

/**
 * Delete an alert rule
 */
export async function deleteAlertRule(ruleId: string): Promise<void> {
  await apiClient(`/alert-rules/${ruleId}`, {
    method: 'DELETE',
  });
}

/**
 * Toggle alert rule active state
 */
export async function toggleAlertRule(
  ruleId: string,
  isActive: boolean
): Promise<BrandReputationAlertRule> {
  return updateAlertRule(ruleId, { isActive });
}

// ============================================================================
// ALERT EVENT API
// ============================================================================

/**
 * List alert events with filters and pagination
 */
export async function listAlertEvents(
  query: ListReputationAlertEventsQuery = {}
): Promise<ListReputationAlertEventsResponse> {
  const queryString = buildQueryString(query);
  const result = await apiClient<ListReputationAlertEventsResponse>(
    `/alert-events?${queryString}`
  );
  return result.data!;
}

/**
 * Get a single alert event by ID
 */
export async function getAlertEvent(eventId: string): Promise<BrandReputationAlertEvent> {
  const result = await apiClient<BrandReputationAlertEvent>(`/alert-events/${eventId}`);
  return result.data!;
}

/**
 * Acknowledge an alert event
 */
export async function acknowledgeAlertEvent(
  eventId: string,
  notes?: string
): Promise<BrandReputationAlertEvent> {
  const result = await apiClient<BrandReputationAlertEvent>(
    `/alert-events/${eventId}/acknowledge`,
    {
      method: 'POST',
      body: JSON.stringify({ notes }),
    }
  );
  return result.data!;
}

/**
 * Resolve an alert event
 */
export async function resolveAlertEvent(
  eventId: string,
  resolutionNotes: string
): Promise<BrandReputationAlertEvent> {
  const result = await apiClient<BrandReputationAlertEvent>(
    `/alert-events/${eventId}/resolve`,
    {
      method: 'POST',
      body: JSON.stringify({ resolutionNotes }),
    }
  );
  return result.data!;
}

/**
 * Mute an alert event
 */
export async function muteAlertEvent(eventId: string): Promise<BrandReputationAlertEvent> {
  const result = await apiClient<BrandReputationAlertEvent>(
    `/alert-events/${eventId}/mute`,
    {
      method: 'POST',
    }
  );
  return result.data!;
}

// ============================================================================
// REPORT API
// ============================================================================

/**
 * Create a new report (draft)
 */
export async function createReport(
  data: CreateReputationReportInput
): Promise<CreateReportResponse> {
  const result = await apiClient<CreateReportResponse>('/reports', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.data!;
}

/**
 * List reports with filters and pagination
 */
export async function listReports(
  query: ListReputationReportsQuery = {}
): Promise<ListReputationReportsResponse> {
  const queryString = buildQueryString(query);
  const result = await apiClient<ListReputationReportsResponse>(`/reports?${queryString}`);
  return result.data!;
}

/**
 * Get a single report with sections and recipients
 */
export async function getReport(reportId: string): Promise<GetReportResponse> {
  const result = await apiClient<GetReportResponse>(`/reports/${reportId}`);
  return result.data!;
}

/**
 * Generate a full report with sections
 */
export async function generateReport(
  data: GenerateReputationReportInput
): Promise<GenerateReportResponse> {
  const result = await apiClient<GenerateReportResponse>('/reports/generate', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.data!;
}

/**
 * Regenerate a specific report section
 */
export async function regenerateReportSection(
  reportId: string,
  sectionId: string,
  data: RegenerateReputationReportSectionInput = {}
): Promise<RegenerateSectionResponse> {
  const result = await apiClient<RegenerateSectionResponse>(
    `/reports/${reportId}/sections/${sectionId}/regenerate`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
  return result.data!;
}

// ============================================================================
// INSIGHTS API
// ============================================================================

/**
 * Get reputation insights for dashboards
 */
export async function getReputationInsights(
  query: GetReputationInsightsQuery = {}
): Promise<GetReputationReportInsightsResponse> {
  const queryString = buildQueryString(query);
  const result = await apiClient<GetReputationReportInsightsResponse>(
    `/insights?${queryString}`
  );
  return result.data!;
}

// ============================================================================
// HELPER FUNCTIONS - CHANNEL DISPLAY
// ============================================================================

/**
 * Get label for alert channel
 */
export function getChannelLabel(channel: ReputationAlertChannel): string {
  const labels: Record<ReputationAlertChannel, string> = {
    in_app: 'In-App',
    email: 'Email',
    slack: 'Slack',
    webhook: 'Webhook',
  };
  return labels[channel] || channel;
}

/**
 * Get icon for alert channel
 */
export function getChannelIcon(channel: ReputationAlertChannel): string {
  const icons: Record<ReputationAlertChannel, string> = {
    in_app: '🔔',
    email: '📧',
    slack: '💬',
    webhook: '🔗',
  };
  return icons[channel] || '📢';
}

// ============================================================================
// HELPER FUNCTIONS - STATUS DISPLAY
// ============================================================================

/**
 * Get label for alert status
 */
export function getAlertStatusLabel(status: ReputationAlertStatus): string {
  const labels: Record<ReputationAlertStatus, string> = {
    new: 'New',
    acknowledged: 'Acknowledged',
    muted: 'Muted',
    resolved: 'Resolved',
  };
  return labels[status] || status;
}

/**
 * Get color for alert status
 */
export function getAlertStatusColor(status: ReputationAlertStatus): string {
  const colors: Record<ReputationAlertStatus, string> = {
    new: 'text-red-600',
    acknowledged: 'text-yellow-600',
    muted: 'text-gray-600',
    resolved: 'text-green-600',
  };
  return colors[status] || 'text-gray-600';
}

/**
 * Get background color for alert status
 */
export function getAlertStatusBgColor(status: ReputationAlertStatus): string {
  const colors: Record<ReputationAlertStatus, string> = {
    new: 'bg-red-100',
    acknowledged: 'bg-yellow-100',
    muted: 'bg-gray-100',
    resolved: 'bg-green-100',
  };
  return colors[status] || 'bg-gray-100';
}

/**
 * Get icon for alert status
 */
export function getAlertStatusIcon(status: ReputationAlertStatus): string {
  const icons: Record<ReputationAlertStatus, string> = {
    new: '🔴',
    acknowledged: '🟡',
    muted: '🔇',
    resolved: '✅',
  };
  return icons[status] || '❓';
}

// ============================================================================
// HELPER FUNCTIONS - REPORT DISPLAY
// ============================================================================

/**
 * Get label for report frequency
 */
export function getReportFrequencyLabel(frequency: ReputationReportFrequency): string {
  const labels: Record<ReputationReportFrequency, string> = {
    ad_hoc: 'Ad Hoc',
    weekly: 'Weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
  };
  return labels[frequency] || frequency;
}

/**
 * Get label for report format
 */
export function getReportFormatLabel(format: ReputationReportFormat): string {
  const labels: Record<ReputationReportFormat, string> = {
    executive_summary: 'Executive Summary',
    detailed: 'Detailed Report',
  };
  return labels[format] || format;
}

/**
 * Get label for report status
 */
export function getReportStatusLabel(status: ReputationReportStatus): string {
  const labels: Record<ReputationReportStatus, string> = {
    draft: 'Draft',
    generating: 'Generating',
    generated: 'Generated',
    published: 'Published',
  };
  return labels[status] || status;
}

/**
 * Get color for report status
 */
export function getReportStatusColor(status: ReputationReportStatus): string {
  const colors: Record<ReputationReportStatus, string> = {
    draft: 'text-gray-600',
    generating: 'text-blue-600',
    generated: 'text-green-600',
    published: 'text-purple-600',
  };
  return colors[status] || 'text-gray-600';
}

/**
 * Get background color for report status
 */
export function getReportStatusBgColor(status: ReputationReportStatus): string {
  const colors: Record<ReputationReportStatus, string> = {
    draft: 'bg-gray-100',
    generating: 'bg-blue-100',
    generated: 'bg-green-100',
    published: 'bg-purple-100',
  };
  return colors[status] || 'bg-gray-100';
}

/**
 * Get icon for report status
 */
export function getReportStatusIcon(status: ReputationReportStatus): string {
  const icons: Record<ReputationReportStatus, string> = {
    draft: '📝',
    generating: '⏳',
    generated: '✅',
    published: '📤',
  };
  return icons[status] || '📄';
}

// ============================================================================
// HELPER FUNCTIONS - SECTION DISPLAY
// ============================================================================

/**
 * Get label for report section type
 */
export function getSectionTypeLabel(sectionType: ReputationReportSectionType): string {
  const labels: Record<ReputationReportSectionType, string> = {
    overview: 'Executive Overview',
    highlights: 'Key Highlights',
    risks: 'Risks & Concerns',
    opportunities: 'Opportunities',
    competitors: 'Competitive Landscape',
    recommendations: 'Recommended Actions',
    events_timeline: 'Events Timeline',
  };
  return labels[sectionType] || sectionType;
}

/**
 * Get icon for report section type
 */
export function getSectionTypeIcon(sectionType: ReputationReportSectionType): string {
  const icons: Record<ReputationReportSectionType, string> = {
    overview: '📊',
    highlights: '⭐',
    risks: '⚠️',
    opportunities: '💡',
    competitors: '🏆',
    recommendations: '📋',
    events_timeline: '📅',
  };
  return icons[sectionType] || '📄';
}

// ============================================================================
// HELPER FUNCTIONS - COMPONENT DISPLAY
// ============================================================================

/**
 * Get label for reputation component key
 */
export function getComponentKeyLabel(key: ReputationComponentKey): string {
  const labels: Record<ReputationComponentKey, string> = {
    sentiment: 'Sentiment',
    coverage: 'Coverage',
    crisis_impact: 'Crisis Impact',
    competitive_position: 'Competitive Position',
    engagement: 'Engagement',
  };
  return labels[key] || key;
}

/**
 * Get icon for reputation component key
 */
export function getComponentKeyIcon(key: ReputationComponentKey): string {
  const icons: Record<ReputationComponentKey, string> = {
    sentiment: '💬',
    coverage: '📰',
    crisis_impact: '⚠️',
    competitive_position: '🏆',
    engagement: '🤝',
  };
  return icons[key] || '📊';
}

// ============================================================================
// HELPER FUNCTIONS - SCORE DISPLAY
// ============================================================================

/**
 * Get color for score value (0-100)
 */
export function getScoreColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'text-gray-600';
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 40) return 'text-yellow-600';
  if (score >= 20) return 'text-orange-600';
  return 'text-red-600';
}

/**
 * Get background color for score
 */
export function getScoreBgColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'bg-gray-100';
  if (score >= 80) return 'bg-green-100';
  if (score >= 60) return 'bg-blue-100';
  if (score >= 40) return 'bg-yellow-100';
  if (score >= 20) return 'bg-orange-100';
  return 'bg-red-100';
}

/**
 * Get label for score value
 */
export function getScoreLabel(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'N/A';
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  if (score >= 20) return 'Poor';
  return 'Critical';
}

/**
 * Format score with label
 */
export function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'N/A';
  return `${score.toFixed(0)} (${getScoreLabel(score)})`;
}

// ============================================================================
// HELPER FUNCTIONS - DELTA DISPLAY
// ============================================================================

/**
 * Format delta with sign and color class
 */
export function formatDelta(delta: number | null | undefined): {
  text: string;
  colorClass: string;
} {
  if (delta === null || delta === undefined) {
    return { text: 'N/A', colorClass: 'text-gray-600' };
  }
  const sign = delta >= 0 ? '+' : '';
  const text = `${sign}${delta.toFixed(1)}`;
  const colorClass = delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-600' : 'text-gray-600';
  return { text, colorClass };
}

/**
 * Get trend direction from delta
 */
export function getTrendFromDelta(delta: number | null | undefined): 'up' | 'down' | 'flat' {
  if (delta === null || delta === undefined) return 'flat';
  if (delta > 2) return 'up';
  if (delta < -2) return 'down';
  return 'flat';
}

/**
 * Get trend icon
 */
export function getTrendIcon(trend: 'up' | 'down' | 'flat'): string {
  const icons = {
    up: '↑',
    down: '↓',
    flat: '→',
  };
  return icons[trend] || '→';
}

/**
 * Get trend color
 */
export function getTrendColor(trend: 'up' | 'down' | 'flat'): string {
  const colors = {
    up: 'text-green-600',
    down: 'text-red-600',
    flat: 'text-gray-600',
  };
  return colors[trend] || 'text-gray-600';
}

// ============================================================================
// HELPER FUNCTIONS - DATE FORMATTING
// ============================================================================

/**
 * Format date for display
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format date and time for display
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(d);
}

/**
 * Format report period for display
 */
export function formatReportPeriod(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

// ============================================================================
// HELPER FUNCTIONS - ALERTS DASHBOARD
// ============================================================================

/**
 * Get unread alerts count
 */
export async function getUnreadAlertsCount(): Promise<number> {
  const response = await listAlertEvents({ status: 'new', limit: 1 });
  return response.counts.new;
}

/**
 * Get alerts summary for dashboard
 */
export async function getAlertsSummary(): Promise<{
  new: number;
  acknowledged: number;
  total: number;
}> {
  const response = await listAlertEvents({ limit: 1 });
  return {
    new: response.counts.new,
    acknowledged: response.counts.acknowledged,
    total: response.total,
  };
}

// ============================================================================
// HELPER FUNCTIONS - RULE BUILDER
// ============================================================================

/**
 * Create a threshold alert rule
 */
export function createThresholdRuleInput(
  name: string,
  minScore: number,
  channel: ReputationAlertChannel = 'in_app'
): CreateReputationAlertRuleInput {
  return {
    name,
    description: `Alert when overall reputation score drops below ${minScore}`,
    isActive: true,
    channel,
    minOverallScore: minScore,
    cooldownMinutes: 60,
  };
}

/**
 * Create a component-specific alert rule
 */
export function createComponentRuleInput(
  name: string,
  componentKey: ReputationComponentKey,
  minScore: number,
  channel: ReputationAlertChannel = 'in_app'
): CreateReputationAlertRuleInput {
  return {
    name,
    description: `Alert when ${getComponentKeyLabel(componentKey)} score drops below ${minScore}`,
    isActive: true,
    channel,
    componentKey,
    minComponentScore: minScore,
    cooldownMinutes: 60,
  };
}

/**
 * Create a competitor gap alert rule
 */
export function createCompetitorGapRuleInput(
  name: string,
  competitorSlug: string,
  maxGap: number,
  channel: ReputationAlertChannel = 'in_app'
): CreateReputationAlertRuleInput {
  return {
    name,
    description: `Alert when gap with competitor "${competitorSlug}" exceeds ${maxGap}`,
    isActive: true,
    channel,
    competitorSlug,
    maxCompetitorGap: maxGap,
    cooldownMinutes: 120,
  };
}

/**
 * Create a crisis-linked alert rule
 */
export function createCrisisAlertRuleInput(
  name: string,
  minSeverity: number = 3,
  channel: ReputationAlertChannel = 'email'
): CreateReputationAlertRuleInput {
  return {
    name,
    description: `Alert when crisis incidents with severity >= ${minSeverity} are detected`,
    isActive: true,
    channel,
    linkCrisisIncidents: true,
    minIncidentSeverity: minSeverity,
    cooldownMinutes: 30,
  };
}
