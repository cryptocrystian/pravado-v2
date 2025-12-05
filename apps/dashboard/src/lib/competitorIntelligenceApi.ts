/**
 * Competitive Intelligence API Client (Sprint S53)
 *
 * Type-safe client functions for competitive intelligence API endpoints
 * plus helper utilities for formatting and display.
 */

import type {
  Competitor,
  CompetitorMention,
  CompetitorMetricsSnapshot,
  CompetitorInsight,
  CreateCompetitorRequest,
  UpdateCompetitorRequest,
  CreateCompetitorMentionRequest,
  CreateCompetitorInsightRequest,
  UpdateCompetitorInsightRequest,
  GenerateInsightRequest,
  CompetitorFilters,
  CompetitorMentionFilters,
  SnapshotFilters,
  CIInsightFilters,
  OverlapFilters,
  GetCompetitorsResponse,
  GetCompetitorMentionsResponse,
  CIGetSnapshotsResponse,
  CIGetInsightsResponse,
  GetOverlapResponse,
  CompetitorMetricsSummary,
  ComparativeAnalyticsResponse,
  OverlapAnalysisResponse,
  CompetitorTier,
  CIInsightCategory,
  OverlapType,
} from '@pravado/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_PREFIX = '/api/v1/competitive-intelligence';

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
// COMPETITOR MANAGEMENT API
// ============================================================================

export async function createCompetitor(data: CreateCompetitorRequest): Promise<Competitor> {
  const result = await apiClient<Competitor>('/competitors', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.data!;
}

export async function getCompetitors(
  filters?: CompetitorFilters,
  limit: number = 20,
  offset: number = 0
): Promise<GetCompetitorsResponse> {
  const query = buildQueryString({ ...filters, limit, offset });
  const result = await apiClient<GetCompetitorsResponse>(`/competitors?${query}`);
  return result.data!;
}

export async function getCompetitor(id: string): Promise<Competitor> {
  const result = await apiClient<Competitor>(`/competitors/${id}`);
  return result.data!;
}

export async function updateCompetitor(
  id: string,
  data: UpdateCompetitorRequest
): Promise<Competitor> {
  const result = await apiClient<Competitor>(`/competitors/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return result.data!;
}

export async function deleteCompetitor(id: string): Promise<void> {
  await apiClient(`/competitors/${id}`, {
    method: 'DELETE',
  });
}

// ============================================================================
// MENTION TRACKING API
// ============================================================================

export async function createMention(data: CreateCompetitorMentionRequest): Promise<CompetitorMention> {
  const result = await apiClient<CompetitorMention>('/mentions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.data!;
}

export async function getMentions(
  filters?: CompetitorMentionFilters,
  limit: number = 50,
  offset: number = 0
): Promise<GetCompetitorMentionsResponse> {
  const query = buildQueryString({ ...filters, limit, offset });
  const result = await apiClient<GetCompetitorMentionsResponse>(`/mentions?${query}`);
  return result.data!;
}

// ============================================================================
// SNAPSHOT & METRICS API
// ============================================================================

export async function createSnapshot(competitorId: string, period: string = 'daily'): Promise<CompetitorMetricsSnapshot> {
  const result = await apiClient<CompetitorMetricsSnapshot>(`/competitors/${competitorId}/snapshots`, {
    method: 'POST',
    body: JSON.stringify({ period }),
  });
  return result.data!;
}

export async function getSnapshots(
  filters?: SnapshotFilters,
  limit: number = 50,
  offset: number = 0
): Promise<CIGetSnapshotsResponse> {
  const query = buildQueryString({ ...filters, limit, offset });
  const result = await apiClient<CIGetSnapshotsResponse>(`/snapshots?${query}`);
  return result.data!;
}

export async function getCompetitorMetrics(
  competitorId: string,
  startDate: Date | string,
  endDate: Date | string
): Promise<CompetitorMetricsSummary> {
  const query = buildQueryString({
    startDate: startDate instanceof Date ? startDate.toISOString() : startDate,
    endDate: endDate instanceof Date ? endDate.toISOString() : endDate,
  });
  const result = await apiClient<CompetitorMetricsSummary>(`/competitors/${competitorId}/metrics?${query}`);
  return result.data!;
}

// ============================================================================
// COMPARATIVE ANALYTICS API
// ============================================================================

export async function getComparativeAnalytics(
  competitorId: string,
  startDate: Date | string,
  endDate: Date | string,
  brandId?: string
): Promise<ComparativeAnalyticsResponse> {
  const result = await apiClient<ComparativeAnalyticsResponse>(`/competitors/${competitorId}/compare`, {
    method: 'POST',
    body: JSON.stringify({
      startDate: startDate instanceof Date ? startDate.toISOString() : startDate,
      endDate: endDate instanceof Date ? endDate.toISOString() : endDate,
      brandId,
    }),
  });
  return result.data!;
}

// ============================================================================
// OVERLAP ANALYSIS API
// ============================================================================

export async function analyzeOverlap(
  competitorId: string,
  overlapType: OverlapType,
  timeWindowDays: number = 30
): Promise<OverlapAnalysisResponse> {
  const result = await apiClient<OverlapAnalysisResponse>(`/competitors/${competitorId}/overlap`, {
    method: 'POST',
    body: JSON.stringify({ overlapType, timeWindowDays }),
  });
  return result.data!;
}

export async function getOverlap(
  filters?: OverlapFilters,
  limit: number = 20,
  offset: number = 0
): Promise<GetOverlapResponse> {
  const query = buildQueryString({ ...filters, limit, offset });
  const result = await apiClient<GetOverlapResponse>(`/overlap?${query}`);
  return result.data!;
}

// ============================================================================
// INSIGHT GENERATION API
// ============================================================================

export async function createInsight(data: CreateCompetitorInsightRequest): Promise<CompetitorInsight> {
  const result = await apiClient<CompetitorInsight>('/insights', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.data!;
}

export async function getInsights(
  filters?: CIInsightFilters,
  limit: number = 20,
  offset: number = 0
): Promise<CIGetInsightsResponse> {
  const query = buildQueryString({ ...filters, limit, offset });
  const result = await apiClient<CIGetInsightsResponse>(`/insights?${query}`);
  return result.data!;
}

export async function updateInsight(
  id: string,
  data: UpdateCompetitorInsightRequest
): Promise<CompetitorInsight> {
  const result = await apiClient<CompetitorInsight>(`/insights/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return result.data!;
}

export async function generateInsight(data: GenerateInsightRequest): Promise<CompetitorInsight> {
  const result = await apiClient<CompetitorInsight>('/insights/generate', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.data!;
}

// ============================================================================
// EVALUATION API
// ============================================================================

export async function evaluateCompetitor(
  competitorId: string,
  timeWindowDays: number = 30
): Promise<{
  snapshot: CompetitorMetricsSnapshot;
  insights: CompetitorInsight[];
  message: string;
}> {
  const result = await apiClient<any>(`/competitors/${competitorId}/evaluate`, {
    method: 'POST',
    body: JSON.stringify({ timeWindowDays }),
  });
  return result.data!;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get color for competitor tier
 */
export function getTierColor(tier: CompetitorTier): string {
  const colors: Record<CompetitorTier, string> = {
    tier_1: 'text-red-600',    // Direct competitors - highest priority
    tier_2: 'text-orange-600', // Secondary competitors
    tier_3: 'text-yellow-600', // Emerging competitors
    tier_4: 'text-gray-600',   // Distant competitors
  };
  return colors[tier] || 'text-gray-600';
}

/**
 * Get background color for competitor tier
 */
export function getTierBgColor(tier: CompetitorTier): string {
  const colors: Record<CompetitorTier, string> = {
    tier_1: 'bg-red-100',
    tier_2: 'bg-orange-100',
    tier_3: 'bg-yellow-100',
    tier_4: 'bg-gray-100',
  };
  return colors[tier] || 'bg-gray-100';
}

/**
 * Get label for competitor tier
 */
export function getTierLabel(tier: CompetitorTier): string {
  const labels: Record<CompetitorTier, string> = {
    tier_1: 'Direct',
    tier_2: 'Secondary',
    tier_3: 'Emerging',
    tier_4: 'Distant',
  };
  return labels[tier] || 'Unknown';
}

/**
 * Get color for insight category
 */
export function getInsightCategoryColor(category: CIInsightCategory): string {
  const colors: Record<CIInsightCategory, string> = {
    advantage: 'text-green-600',
    threat: 'text-red-600',
    opportunity: 'text-blue-600',
    trend: 'text-purple-600',
    anomaly: 'text-orange-600',
    recommendation: 'text-indigo-600',
  };
  return colors[category] || 'text-gray-600';
}

/**
 * Get background color for insight category
 */
export function getInsightCategoryBgColor(category: CIInsightCategory): string {
  const colors: Record<CIInsightCategory, string> = {
    advantage: 'bg-green-50',
    threat: 'bg-red-50',
    opportunity: 'bg-blue-50',
    trend: 'bg-purple-50',
    anomaly: 'bg-orange-50',
    recommendation: 'bg-indigo-50',
  };
  return colors[category] || 'bg-gray-50';
}

/**
 * Get icon for insight category
 */
export function getInsightCategoryIcon(category: CIInsightCategory): string {
  const icons: Record<CIInsightCategory, string> = {
    advantage: '🏆',
    threat: '⚠️',
    opportunity: '💡',
    trend: '📈',
    anomaly: '🔔',
    recommendation: '💬',
  };
  return icons[category] || '📊';
}

/**
 * Format advantage score with sign
 */
export function formatAdvantageScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'N/A';
  const sign = score >= 0 ? '+' : '';
  return `${sign}${score.toFixed(1)}`;
}

/**
 * Get color for advantage score
 */
export function getAdvantageScoreColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'text-gray-600';
  if (score > 20) return 'text-green-600';
  if (score > 0) return 'text-green-500';
  if (score > -20) return 'text-orange-500';
  return 'text-red-600';
}

/**
 * Format overlap percentage
 */
export function formatOverlapPercentage(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'N/A';
  return `${score.toFixed(1)}%`;
}

/**
 * Get color for overlap score
 */
export function getOverlapScoreColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'text-gray-600';
  if (score > 60) return 'text-red-600';    // High overlap = bad (not differentiated)
  if (score > 40) return 'text-orange-600';
  if (score > 20) return 'text-yellow-600';
  return 'text-green-600';                   // Low overlap = good (differentiated)
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
 * Format sentiment score
 */
export function formatSentiment(sentiment: number | null | undefined): string {
  if (sentiment === null || sentiment === undefined) return 'N/A';
  if (sentiment > 0.3) return 'Positive';
  if (sentiment < -0.3) return 'Negative';
  return 'Neutral';
}

/**
 * Get color for sentiment
 */
export function getSentimentColor(sentiment: number | null | undefined): string {
  if (sentiment === null || sentiment === undefined) return 'text-gray-600';
  if (sentiment > 0.3) return 'text-green-600';
  if (sentiment < -0.3) return 'text-red-600';
  return 'text-gray-600';
}

/**
 * Format EVI score with label
 */
export function formatEVIScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'N/A';
  if (score >= 80) return `${score.toFixed(0)} (Excellent)`;
  if (score >= 60) return `${score.toFixed(0)} (Good)`;
  if (score >= 40) return `${score.toFixed(0)} (Fair)`;
  return `${score.toFixed(0)} (Poor)`;
}

/**
 * Get color for EVI score
 */
export function getEVIScoreColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'text-gray-600';
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-red-600';
}

/**
 * Format date range
 */
export function formatDateRange(start: Date, end: Date): string {
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
}

/**
 * Calculate days between dates
 */
export function daysBetween(start: Date, end: Date): number {
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
