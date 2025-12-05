/**
 * Media Performance Analytics API Client (Sprint S52)
 * Type-safe frontend client for unified performance intelligence endpoints
 */

import type {
  MediaPerformanceSnapshot,
  MediaPerformanceDimension,
  MediaPerformanceScore,
  MediaPerformanceInsight,
  CreateSnapshotRequest,
  CreateDimensionRequest,
  CreateScoreRequest,
  CreateInsightRequest,
  UpdateInsightRequest,
  MediaPerformanceFilters,
  DimensionFilters,
  ScoreFilters,
  InsightFilters,
  GetSnapshotsResponse,
  GetDimensionsResponse,
  GetScoresResponse,
  GetInsightsResponse,
  GetTrendResponse,
  GetAnomaliesResponse,
  GetOverviewResponse,
  MetricType,
  InsightCategory,
} from '@pravado/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Generic API client with error handling
 */
async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Include cookies for auth
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  const data = await response.json();
  return data.success !== false ? data.data : data;
}

/**
 * Build query string from filters
 */
function buildQueryString(params: Record<string, any>): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query.append(key, String(value));
    }
  });
  return query.toString();
}

/**
 * ============================================================================
 * SNAPSHOT API
 * ============================================================================
 */

export async function createSnapshot(
  data: CreateSnapshotRequest
): Promise<MediaPerformanceSnapshot> {
  return apiClient<MediaPerformanceSnapshot>('/api/v1/media-performance/snapshots', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getSnapshots(
  filters?: MediaPerformanceFilters,
  limit = 100,
  offset = 0
): Promise<GetSnapshotsResponse> {
  const query = buildQueryString({ ...filters, limit, offset });
  return apiClient<GetSnapshotsResponse>(
    `/api/v1/media-performance/snapshots?${query}`
  );
}

export async function getSnapshot(id: string): Promise<MediaPerformanceSnapshot> {
  return apiClient<MediaPerformanceSnapshot>(
    `/api/v1/media-performance/snapshots/${id}`
  );
}

/**
 * ============================================================================
 * DIMENSION API
 * ============================================================================
 */

export async function createDimension(
  data: CreateDimensionRequest
): Promise<MediaPerformanceDimension> {
  return apiClient<MediaPerformanceDimension>('/api/v1/media-performance/dimensions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getDimensions(
  filters?: DimensionFilters,
  limit = 100,
  offset = 0
): Promise<GetDimensionsResponse> {
  const query = buildQueryString({ ...filters, limit, offset });
  return apiClient<GetDimensionsResponse>(
    `/api/v1/media-performance/dimensions?${query}`
  );
}

/**
 * ============================================================================
 * SCORE API
 * ============================================================================
 */

export async function upsertScore(
  data: CreateScoreRequest
): Promise<MediaPerformanceScore> {
  return apiClient<MediaPerformanceScore>('/api/v1/media-performance/scores', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getScores(
  filters?: ScoreFilters,
  limit = 100,
  offset = 0
): Promise<GetScoresResponse> {
  const query = buildQueryString({ ...filters, limit, offset });
  return apiClient<GetScoresResponse>(`/api/v1/media-performance/scores?${query}`);
}

/**
 * ============================================================================
 * INSIGHT API
 * ============================================================================
 */

export async function createInsight(
  data: CreateInsightRequest
): Promise<MediaPerformanceInsight> {
  return apiClient<MediaPerformanceInsight>('/api/v1/media-performance/insights', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function generateInsight(
  snapshotId: string,
  category: InsightCategory
): Promise<MediaPerformanceInsight> {
  return apiClient<MediaPerformanceInsight>(
    `/api/v1/media-performance/insights/generate/${snapshotId}`,
    {
      method: 'POST',
      body: JSON.stringify({ category }),
    }
  );
}

export async function updateInsight(
  id: string,
  data: UpdateInsightRequest
): Promise<MediaPerformanceInsight> {
  return apiClient<MediaPerformanceInsight>(
    `/api/v1/media-performance/insights/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    }
  );
}

export async function markInsightAsRead(id: string): Promise<MediaPerformanceInsight> {
  return updateInsight(id, { isRead: true });
}

export async function dismissInsight(id: string): Promise<MediaPerformanceInsight> {
  return updateInsight(id, { isDismissed: true });
}

export async function getInsights(
  filters?: InsightFilters,
  limit = 50,
  offset = 0
): Promise<GetInsightsResponse> {
  const query = buildQueryString({ ...filters, limit, offset });
  return apiClient<GetInsightsResponse>(
    `/api/v1/media-performance/insights?${query}`
  );
}

/**
 * ============================================================================
 * ANALYTICS API
 * ============================================================================
 */

export async function getTrend(
  metric: MetricType,
  filters?: MediaPerformanceFilters,
  limit = 100
): Promise<GetTrendResponse> {
  const query = buildQueryString({ ...filters, limit });
  return apiClient<GetTrendResponse>(
    `/api/v1/media-performance/trends/${metric}?${query}`
  );
}

export async function getAnomalies(
  filters?: MediaPerformanceFilters,
  limit = 20
): Promise<GetAnomaliesResponse> {
  const query = buildQueryString({ ...filters, limit });
  return apiClient<GetAnomaliesResponse>(
    `/api/v1/media-performance/anomalies?${query}`
  );
}

export async function getOverview(
  startDate: Date | string,
  endDate: Date | string,
  brandId?: string,
  campaignId?: string
): Promise<GetOverviewResponse> {
  const query = buildQueryString({ startDate, endDate, brandId, campaignId });
  return apiClient<GetOverviewResponse>(
    `/api/v1/media-performance/overview?${query}`
  );
}

/**
 * ============================================================================
 * HELPER FUNCTIONS
 * ============================================================================
 */

/**
 * Get score color based on value (0-100)
 */
export function getScoreColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'gray';
  if (score >= 80) return 'green';
  if (score >= 60) return 'blue';
  if (score >= 40) return 'yellow';
  return 'red';
}

/**
 * Get score label based on value
 */
export function getScoreLabel(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'N/A';
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Poor';
}

/**
 * Format sentiment value (-1 to 1) to percentage
 */
export function formatSentiment(sentiment: number | null | undefined): string {
  if (sentiment === null || sentiment === undefined) return 'Neutral';
  const percentage = Math.round(((sentiment + 1) / 2) * 100);
  if (percentage >= 70) return `Very Positive (${percentage}%)`;
  if (percentage >= 55) return `Positive (${percentage}%)`;
  if (percentage >= 45) return `Neutral (${percentage}%)`;
  if (percentage >= 30) return `Negative (${percentage}%)`;
  return `Very Negative (${percentage}%)`;
}

/**
 * Get sentiment color based on value
 */
export function getSentimentColor(sentiment: number | null | undefined): string {
  if (sentiment === null || sentiment === undefined) return 'gray';
  if (sentiment >= 0.4) return 'green';
  if (sentiment >= 0.1) return 'blue';
  if (sentiment >= -0.1) return 'yellow';
  if (sentiment >= -0.4) return 'orange';
  return 'red';
}

/**
 * Format large numbers (e.g., 1.2M, 3.4K)
 */
export function formatReach(reach: number | null | undefined): string {
  if (reach === null || reach === undefined) return '0';
  if (reach >= 1000000) return `${(reach / 1000000).toFixed(1)}M`;
  if (reach >= 1000) return `${(reach / 1000).toFixed(1)}K`;
  return reach.toString();
}

/**
 * Format percentage change with sign
 */
export function formatChange(change: number | null | undefined): string {
  if (change === null || change === undefined) return '0%';
  const sign = change > 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
}

/**
 * Get trend direction icon
 */
export function getTrendIcon(direction: 'up' | 'down' | 'stable'): string {
  return direction === 'up' ? '↑' : direction === 'down' ? '↓' : '→';
}

/**
 * Get trend color based on direction
 */
export function getTrendColor(direction: 'up' | 'down' | 'stable'): string {
  return direction === 'up' ? 'green' : direction === 'down' ? 'red' : 'gray';
}

/**
 * Format date range for display
 */
export function formatDateRange(start: Date, end: Date): string {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  };

  return `${formatDate(start)} - ${formatDate(end)}`;
}

/**
 * Get insight category icon
 */
export function getInsightCategoryIcon(
  category: InsightCategory
): string {
  const icons: Record<InsightCategory, string> = {
    achievement: '🎯',
    anomaly: '⚠️',
    recommendation: '💡',
    trend: '📈',
    risk: '🚨',
    opportunity: '✨',
  };
  return icons[category] || '📊';
}

/**
 * Get insight category color
 */
export function getInsightCategoryColor(category: InsightCategory): string {
  const colors: Record<InsightCategory, string> = {
    achievement: 'green',
    anomaly: 'yellow',
    recommendation: 'blue',
    trend: 'purple',
    risk: 'red',
    opportunity: 'teal',
  };
  return colors[category] || 'gray';
}
