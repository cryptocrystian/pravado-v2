/**
 * Brand Reputation Intelligence API Client (Sprint S56)
 *
 * Type-safe client functions for brand reputation API endpoints
 * plus helper utilities for formatting and display.
 */

import type {
  BrandReputationSnapshot,
  BrandReputationEvent,
  BrandReputationConfig,
  BrandReputationAlert,
  CompetitorReputationComparison,
  ReputationTrendPoint,
  ComponentScore,
  GetReputationDashboardResponse,
  GetReputationTrendResponse,
  RecalculateReputationResponse,
  GetReputationEventsResponse,
  GetReputationAlertsResponse,
  ReputationTimeWindow,
  ReputationComponent,
  ReputationTrendDirection,
  ReputationAlertSeverity,
  ReputationSourceSystem,
  ReputationSignalType,
  ReputationEventSeverity,
  ReputationSystemHealth,
  UpdateReputationConfigRequest,
  CreateReputationEventRequest,
} from '@pravado/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_PREFIX = '/api/v1/reputation';

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

function buildQueryString(params: Record<string, any>): string {
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
// DASHBOARD API
// ============================================================================

export interface GetDashboardOptions {
  window?: ReputationTimeWindow;
  includeCompetitors?: boolean;
  includeTrend?: boolean;
  includeEvents?: boolean;
  maxDrivers?: number;
}

export async function getDashboard(
  options: GetDashboardOptions = {}
): Promise<GetReputationDashboardResponse> {
  const query = buildQueryString({
    window: options.window,
    includeCompetitors: options.includeCompetitors,
    includeTrend: options.includeTrend,
    includeEvents: options.includeEvents,
    maxDrivers: options.maxDrivers,
  });
  const result = await apiClient<GetReputationDashboardResponse>(`/dashboard?${query}`);
  return result.data!;
}

// ============================================================================
// TREND API
// ============================================================================

export interface GetTrendOptions {
  window?: ReputationTimeWindow;
  granularity?: 'hourly' | 'daily' | 'weekly';
  includeComponents?: boolean;
}

export async function getTrend(
  options: GetTrendOptions = {}
): Promise<GetReputationTrendResponse> {
  const query = buildQueryString({
    window: options.window || '30d',
    granularity: options.granularity,
    includeComponents: options.includeComponents,
  });
  const result = await apiClient<GetReputationTrendResponse>(`/trend?${query}`);
  return result.data!;
}

// ============================================================================
// RECALCULATION API
// ============================================================================

export interface RecalculateOptions {
  window?: ReputationTimeWindow;
  forceRefresh?: boolean;
  includeHistorical?: boolean;
}

export async function recalculateReputation(
  options: RecalculateOptions = {}
): Promise<RecalculateReputationResponse> {
  const result = await apiClient<RecalculateReputationResponse>('/recalculate', {
    method: 'POST',
    body: JSON.stringify({
      window: options.window || '30d',
      forceRefresh: options.forceRefresh,
      includeHistorical: options.includeHistorical,
    }),
  });
  return result.data!;
}

// ============================================================================
// CONFIGURATION API
// ============================================================================

export async function getConfig(): Promise<BrandReputationConfig> {
  const result = await apiClient<BrandReputationConfig>('/config');
  return result.data!;
}

export async function updateConfig(
  data: UpdateReputationConfigRequest
): Promise<BrandReputationConfig> {
  const result = await apiClient<BrandReputationConfig>('/config', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return result.data!;
}

// ============================================================================
// SNAPSHOT API
// ============================================================================

export async function getSnapshot(snapshotId: string): Promise<BrandReputationSnapshot> {
  const result = await apiClient<BrandReputationSnapshot>(`/snapshots/${snapshotId}`);
  return result.data!;
}

// ============================================================================
// EVENTS API
// ============================================================================

export interface GetEventsOptions {
  window?: ReputationTimeWindow;
  sourceSystem?: ReputationSourceSystem;
  component?: ReputationComponent;
  severity?: ReputationEventSeverity;
  limit?: number;
  offset?: number;
}

export async function getEvents(
  options: GetEventsOptions = {}
): Promise<GetReputationEventsResponse> {
  const query = buildQueryString(options);
  const result = await apiClient<GetReputationEventsResponse>(`/events?${query}`);
  return result.data!;
}

export async function createEvent(
  data: CreateReputationEventRequest
): Promise<BrandReputationEvent> {
  const result = await apiClient<BrandReputationEvent>('/events', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.data!;
}

export async function getEvent(eventId: string): Promise<BrandReputationEvent> {
  const result = await apiClient<BrandReputationEvent>(`/events/${eventId}`);
  return result.data!;
}

// ============================================================================
// ALERTS API
// ============================================================================

export interface GetAlertsOptions {
  severity?: ReputationAlertSeverity;
  isAcknowledged?: boolean;
  isResolved?: boolean;
  limit?: number;
  offset?: number;
}

export async function getAlerts(
  options: GetAlertsOptions = {}
): Promise<GetReputationAlertsResponse> {
  const query = buildQueryString(options);
  const result = await apiClient<GetReputationAlertsResponse>(`/alerts?${query}`);
  return result.data!;
}

export async function getAlert(alertId: string): Promise<BrandReputationAlert> {
  const result = await apiClient<BrandReputationAlert>(`/alerts/${alertId}`);
  return result.data!;
}

export async function acknowledgeAlert(
  alertId: string,
  notes?: string
): Promise<BrandReputationAlert> {
  const result = await apiClient<BrandReputationAlert>(`/alerts/${alertId}/acknowledge`, {
    method: 'POST',
    body: JSON.stringify({ notes }),
  });
  return result.data!;
}

export async function resolveAlert(
  alertId: string,
  resolutionNotes: string
): Promise<BrandReputationAlert> {
  const result = await apiClient<BrandReputationAlert>(`/alerts/${alertId}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ resolutionNotes }),
  });
  return result.data!;
}

// ============================================================================
// HEALTH CHECK API
// ============================================================================

export async function getSystemHealth(): Promise<ReputationSystemHealth> {
  const result = await apiClient<ReputationSystemHealth>('/health');
  return result.data!;
}

// ============================================================================
// COMPETITOR COMPARISON API
// ============================================================================

export interface CompetitorComparisonResponse {
  brandScore: number;
  competitorComparison: CompetitorReputationComparison[];
  competitiveRank: number;
  competitorCount: number;
}

export async function getCompetitorComparison(
  window: ReputationTimeWindow = '30d'
): Promise<CompetitorComparisonResponse> {
  const query = buildQueryString({ window });
  const result = await apiClient<CompetitorComparisonResponse>(`/competitors?${query}`);
  return result.data!;
}

// ============================================================================
// HELPER FUNCTIONS - SCORE DISPLAY
// ============================================================================

/**
 * Get color for reputation score (0-100)
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
 * Get background color for reputation score
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
 * Get label for reputation score
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
// HELPER FUNCTIONS - TREND DISPLAY
// ============================================================================

/**
 * Get color for trend direction
 */
export function getTrendColor(trend: ReputationTrendDirection | null | undefined): string {
  if (!trend) return 'text-gray-600';
  if (trend === 'up') return 'text-green-600';
  if (trend === 'down') return 'text-red-600';
  return 'text-gray-600';
}

/**
 * Get arrow icon for trend direction
 */
export function getTrendIcon(trend: ReputationTrendDirection | null | undefined): string {
  if (!trend) return '-';
  if (trend === 'up') return '↑';
  if (trend === 'down') return '↓';
  return '→';
}

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

// ============================================================================
// HELPER FUNCTIONS - COMPONENT DISPLAY
// ============================================================================

/**
 * Get label for reputation component
 */
export function getComponentLabel(component: ReputationComponent): string {
  const labels: Record<ReputationComponent, string> = {
    sentiment: 'Sentiment',
    coverage: 'Coverage',
    crisis_impact: 'Crisis Impact',
    competitive_position: 'Competitive Position',
    engagement: 'Engagement',
  };
  return labels[component] || component;
}

/**
 * Get icon for reputation component
 */
export function getComponentIcon(component: ReputationComponent): string {
  const icons: Record<ReputationComponent, string> = {
    sentiment: '💬',
    coverage: '📰',
    crisis_impact: '⚠️',
    competitive_position: '🏆',
    engagement: '🤝',
  };
  return icons[component] || '📊';
}

/**
 * Get description for reputation component
 */
export function getComponentDescription(component: ReputationComponent): string {
  const descriptions: Record<ReputationComponent, string> = {
    sentiment: 'Overall sentiment of media coverage and mentions',
    coverage: 'Volume and quality of earned media coverage',
    crisis_impact: 'Impact of active crises on reputation',
    competitive_position: 'Position relative to tracked competitors',
    engagement: 'Journalist response rates and media engagement',
  };
  return descriptions[component] || '';
}

// ============================================================================
// HELPER FUNCTIONS - SEVERITY DISPLAY
// ============================================================================

/**
 * Get color for alert severity
 */
export function getAlertSeverityColor(severity: ReputationAlertSeverity): string {
  const colors: Record<ReputationAlertSeverity, string> = {
    info: 'text-blue-600',
    warning: 'text-yellow-600',
    critical: 'text-red-600',
  };
  return colors[severity] || 'text-gray-600';
}

/**
 * Get background color for alert severity
 */
export function getAlertSeverityBgColor(severity: ReputationAlertSeverity): string {
  const colors: Record<ReputationAlertSeverity, string> = {
    info: 'bg-blue-100',
    warning: 'bg-yellow-100',
    critical: 'bg-red-100',
  };
  return colors[severity] || 'bg-gray-100';
}

/**
 * Get color for event severity
 */
export function getEventSeverityColor(severity: ReputationEventSeverity): string {
  const colors: Record<ReputationEventSeverity, string> = {
    low: 'text-gray-600',
    medium: 'text-blue-600',
    high: 'text-orange-600',
    critical: 'text-red-600',
  };
  return colors[severity] || 'text-gray-600';
}

/**
 * Get background color for event severity
 */
export function getEventSeverityBgColor(severity: ReputationEventSeverity): string {
  const colors: Record<ReputationEventSeverity, string> = {
    low: 'bg-gray-100',
    medium: 'bg-blue-100',
    high: 'bg-orange-100',
    critical: 'bg-red-100',
  };
  return colors[severity] || 'bg-gray-100';
}

// ============================================================================
// HELPER FUNCTIONS - SOURCE SYSTEM DISPLAY
// ============================================================================

/**
 * Get label for source system
 */
export function getSourceSystemLabel(source: ReputationSourceSystem): string {
  const labels: Record<ReputationSourceSystem, string> = {
    media_monitoring: 'Media Monitoring',
    media_alert: 'Media Alert',
    media_performance: 'Media Performance',
    crisis_incident: 'Crisis Incident',
    competitive_intel: 'Competitive Intelligence',
    pr_outreach: 'PR Outreach',
    pr_generator: 'PR Generator',
    pr_pitch: 'PR Pitch',
    journalist_engagement: 'Journalist Engagement',
    social_listening: 'Social Listening',
    manual_adjustment: 'Manual Adjustment',
  };
  return labels[source] || source;
}

/**
 * Get icon for source system
 */
export function getSourceSystemIcon(source: ReputationSourceSystem): string {
  const icons: Record<ReputationSourceSystem, string> = {
    media_monitoring: '📡',
    media_alert: '🔔',
    media_performance: '📈',
    crisis_incident: '🚨',
    competitive_intel: '🔍',
    pr_outreach: '📧',
    pr_generator: '📝',
    pr_pitch: '💼',
    journalist_engagement: '🤝',
    social_listening: '👂',
    manual_adjustment: '✏️',
  };
  return icons[source] || '📊';
}

// ============================================================================
// HELPER FUNCTIONS - SIGNAL TYPE DISPLAY
// ============================================================================

/**
 * Get label for signal type
 */
export function getSignalTypeLabel(signalType: ReputationSignalType): string {
  const labels: Record<ReputationSignalType, string> = {
    sentiment_shift: 'Sentiment Shift',
    coverage_spike: 'Coverage Spike',
    coverage_drop: 'Coverage Drop',
    crisis_detected: 'Crisis Detected',
    crisis_resolved: 'Crisis Resolved',
    competitor_gain: 'Competitor Gain',
    competitor_loss: 'Competitor Loss',
    engagement_increase: 'Engagement Increase',
    engagement_decrease: 'Engagement Decrease',
    media_mention: 'Media Mention',
    journalist_response: 'Journalist Response',
    outreach_success: 'Outreach Success',
    outreach_failure: 'Outreach Failure',
    alert_triggered: 'Alert Triggered',
    performance_change: 'Performance Change',
  };
  return labels[signalType] || signalType;
}

/**
 * Get color for signal type (positive/negative/neutral)
 */
export function getSignalTypeColor(signalType: ReputationSignalType): string {
  const positive = ['crisis_resolved', 'engagement_increase', 'outreach_success', 'coverage_spike'];
  const negative = ['crisis_detected', 'engagement_decrease', 'outreach_failure', 'coverage_drop', 'competitor_gain'];

  if (positive.includes(signalType)) return 'text-green-600';
  if (negative.includes(signalType)) return 'text-red-600';
  return 'text-gray-600';
}

// ============================================================================
// HELPER FUNCTIONS - TIME WINDOW DISPLAY
// ============================================================================

/**
 * Get label for time window
 */
export function getTimeWindowLabel(window: ReputationTimeWindow): string {
  const labels: Record<ReputationTimeWindow, string> = {
    '24h': 'Last 24 Hours',
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days',
    '90d': 'Last 90 Days',
    all: 'All Time',
  };
  return labels[window] || window;
}

/**
 * Get short label for time window
 */
export function getTimeWindowShortLabel(window: ReputationTimeWindow): string {
  const labels: Record<ReputationTimeWindow, string> = {
    '24h': '24h',
    '7d': '7d',
    '30d': '30d',
    '90d': '90d',
    all: 'All',
  };
  return labels[window] || window;
}

// ============================================================================
// HELPER FUNCTIONS - DRIVER DISPLAY
// ============================================================================

/**
 * Get color for driver type
 */
export function getDriverTypeColor(type: 'positive' | 'negative'): string {
  return type === 'positive' ? 'text-green-600' : 'text-red-600';
}

/**
 * Get background color for driver type
 */
export function getDriverTypeBgColor(type: 'positive' | 'negative'): string {
  return type === 'positive' ? 'bg-green-50' : 'bg-red-50';
}

/**
 * Get icon for driver type
 */
export function getDriverTypeIcon(type: 'positive' | 'negative'): string {
  return type === 'positive' ? '📈' : '📉';
}

// ============================================================================
// HELPER FUNCTIONS - FORMATTING
// ============================================================================

/**
 * Format percentage
 */
export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';
  return `${value.toFixed(1)}%`;
}

/**
 * Format number with K/M suffix
 */
export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return 'N/A';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

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

// ============================================================================
// HELPER FUNCTIONS - COMPETITIVE COMPARISON
// ============================================================================

/**
 * Get rank change indicator
 */
export function formatRankChange(change: number): { text: string; colorClass: string } {
  if (change === 0) {
    return { text: '-', colorClass: 'text-gray-600' };
  }
  if (change > 0) {
    return { text: `+${change}`, colorClass: 'text-green-600' };
  }
  return { text: `${change}`, colorClass: 'text-red-600' };
}

/**
 * Get ordinal suffix for rank (1st, 2nd, 3rd, etc.)
 */
export function formatRank(rank: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = rank % 100;
  return rank + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

// ============================================================================
// CHART HELPERS
// ============================================================================

/**
 * Prepare trend data for chart display
 */
export function prepareTrendChartData(trendPoints: ReputationTrendPoint[]): {
  labels: string[];
  overallScores: number[];
  componentData: {
    sentiment: number[];
    coverage: number[];
    crisisImpact: number[];
    competitivePosition: number[];
    engagement: number[];
  };
} {
  const labels = trendPoints.map((p) =>
    new Date(p.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  );
  const overallScores = trendPoints.map((p) => p.overallScore);
  const componentData = {
    sentiment: trendPoints.map((p) => p.components.sentiment),
    coverage: trendPoints.map((p) => p.components.coverage),
    crisisImpact: trendPoints.map((p) => p.components.crisisImpact),
    competitivePosition: trendPoints.map((p) => p.components.competitivePosition),
    engagement: trendPoints.map((p) => p.components.engagement),
  };

  return { labels, overallScores, componentData };
}

/**
 * Prepare component score data for radar chart
 */
export function prepareRadarChartData(componentScores: ComponentScore[]): {
  labels: string[];
  scores: number[];
  previousScores: number[];
} {
  const labels = componentScores.map((c) => getComponentLabel(c.component));
  const scores = componentScores.map((c) => c.score);
  const previousScores = componentScores.map((c) => c.previousScore || c.score);

  return { labels, scores, previousScores };
}
