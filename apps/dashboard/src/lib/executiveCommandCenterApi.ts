/**
 * Executive Command Center API Client (Sprint S61)
 * Frontend API helper for Executive Command Center & Cross-System Insights
 */

import type {
  ExecDashboard,
  ExecDashboardInsight,
  ExecDashboardKpi,
  ExecDashboardNarrative,
  ExecDashboardTimeWindow,
  ExecDashboardPrimaryFocus,
  ExecInsightSourceSystem,
  ExecDashboardWithCounts,
  ExecDashboardSummary,
  ExecKpiTrend,
} from '@pravado/types';

// ============================================================================
// API Response Types
// ============================================================================

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

interface ListDashboardsResponse {
  dashboards: ExecDashboardWithCounts[];
  total: number;
  hasMore: boolean;
}

interface GetDashboardResponse {
  dashboard: ExecDashboard;
  kpis: ExecDashboardKpi[];
  topInsights: ExecDashboardInsight[];
  currentNarrative: ExecDashboardNarrative | null;
}

interface CreateDashboardResponse {
  dashboard: ExecDashboard;
}

interface UpdateDashboardResponse {
  dashboard: ExecDashboard;
}

interface RefreshDashboardResponse {
  dashboard: ExecDashboard;
  kpisCreated: number;
  insightsCreated: number;
  narrativeGenerated: boolean;
  durationMs: number;
}

interface ListInsightsResponse {
  insights: ExecDashboardInsight[];
  total: number;
  hasMore: boolean;
}

interface ListKpisResponse {
  kpis: ExecDashboardKpi[];
  total: number;
}

interface ListNarrativesResponse {
  narratives: ExecDashboardNarrative[];
  total: number;
  hasMore: boolean;
}

// ============================================================================
// Input Types
// ============================================================================

interface CreateDashboardInput {
  title?: string;
  description?: string;
  timeWindow?: ExecDashboardTimeWindow;
  primaryFocus?: ExecDashboardPrimaryFocus;
  filters?: Record<string, unknown>;
  isDefault?: boolean;
}

interface UpdateDashboardInput {
  title?: string;
  description?: string;
  timeWindow?: ExecDashboardTimeWindow;
  primaryFocus?: ExecDashboardPrimaryFocus;
  filters?: Record<string, unknown>;
  isDefault?: boolean;
  isArchived?: boolean;
}

interface RefreshDashboardInput {
  timeWindowOverride?: ExecDashboardTimeWindow;
  primaryFocusOverride?: ExecDashboardPrimaryFocus;
  regenerateNarrative?: boolean;
  forceRefresh?: boolean;
}

interface ListDashboardsParams {
  includeArchived?: boolean;
  primaryFocus?: ExecDashboardPrimaryFocus;
  limit?: number;
  offset?: number;
}

interface ListInsightsParams {
  sourceSystem?: ExecInsightSourceSystem;
  category?: string;
  isTopInsight?: boolean;
  isRisk?: boolean;
  isOpportunity?: boolean;
  limit?: number;
  offset?: number;
}

interface ListKpisParams {
  category?: string;
  sourceSystem?: ExecInsightSourceSystem;
  limit?: number;
  offset?: number;
}

interface ListNarrativesParams {
  limit?: number;
  offset?: number;
}

// ============================================================================
// API Base URL
// ============================================================================

const API_BASE = '/api/v1/exec-dashboards';

// ============================================================================
// Helper Functions
// ============================================================================

async function fetchApi<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || {
          code: 'API_ERROR',
          message: 'An error occurred',
        },
      };
    }

    return data as ApiResponse<T>;
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network error',
      },
    };
  }
}

function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * List all executive dashboards for the organization
 */
export async function listDashboards(
  params: ListDashboardsParams = {}
): Promise<ApiResponse<ListDashboardsResponse>> {
  const queryString = buildQueryString(params as Record<string, unknown>);
  return fetchApi<ListDashboardsResponse>(`${API_BASE}${queryString}`);
}

/**
 * Get a specific dashboard with details
 */
export async function getDashboard(
  dashboardId: string
): Promise<ApiResponse<GetDashboardResponse>> {
  return fetchApi<GetDashboardResponse>(`${API_BASE}/${dashboardId}`);
}

/**
 * Create a new executive dashboard
 */
export async function createDashboard(
  input: CreateDashboardInput
): Promise<ApiResponse<CreateDashboardResponse>> {
  return fetchApi<CreateDashboardResponse>(API_BASE, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/**
 * Update an executive dashboard
 */
export async function updateDashboard(
  dashboardId: string,
  input: UpdateDashboardInput
): Promise<ApiResponse<UpdateDashboardResponse>> {
  return fetchApi<UpdateDashboardResponse>(`${API_BASE}/${dashboardId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

/**
 * Delete/archive an executive dashboard
 */
export async function deleteDashboard(
  dashboardId: string,
  hardDelete = false
): Promise<ApiResponse<{ deleted: boolean; archived: boolean }>> {
  const queryString = hardDelete ? '?hardDelete=true' : '';
  return fetchApi<{ deleted: boolean; archived: boolean }>(
    `${API_BASE}/${dashboardId}${queryString}`,
    { method: 'DELETE' }
  );
}

/**
 * Refresh a dashboard (rebuild KPIs, insights, and optionally narrative)
 */
export async function refreshDashboard(
  dashboardId: string,
  input: RefreshDashboardInput = {}
): Promise<ApiResponse<RefreshDashboardResponse>> {
  return fetchApi<RefreshDashboardResponse>(`${API_BASE}/${dashboardId}/refresh`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/**
 * List insights for a dashboard
 */
export async function listInsights(
  dashboardId: string,
  params: ListInsightsParams = {}
): Promise<ApiResponse<ListInsightsResponse>> {
  const queryString = buildQueryString(params as Record<string, unknown>);
  return fetchApi<ListInsightsResponse>(`${API_BASE}/${dashboardId}/insights${queryString}`);
}

/**
 * List KPIs for a dashboard
 */
export async function listKpis(
  dashboardId: string,
  params: ListKpisParams = {}
): Promise<ApiResponse<ListKpisResponse>> {
  const queryString = buildQueryString(params as Record<string, unknown>);
  return fetchApi<ListKpisResponse>(`${API_BASE}/${dashboardId}/kpis${queryString}`);
}

/**
 * List narratives for a dashboard
 */
export async function listNarratives(
  dashboardId: string,
  params: ListNarrativesParams = {}
): Promise<ApiResponse<ListNarrativesResponse>> {
  const queryString = buildQueryString(params as Record<string, unknown>);
  return fetchApi<ListNarrativesResponse>(`${API_BASE}/${dashboardId}/narratives${queryString}`);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get display label for source system
 */
export function getSourceSystemLabel(source: ExecInsightSourceSystem): string {
  const labels: Record<ExecInsightSourceSystem, string> = {
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
  return labels[source] || source;
}

/**
 * Get display label for time window
 */
export function getTimeWindowLabel(timeWindow: ExecDashboardTimeWindow): string {
  const labels: Record<ExecDashboardTimeWindow, string> = {
    '24h': 'Last 24 Hours',
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days',
    '90d': 'Last 90 Days',
  };
  return labels[timeWindow] || timeWindow;
}

/**
 * Get display label for primary focus
 */
export function getPrimaryFocusLabel(focus: ExecDashboardPrimaryFocus): string {
  const labels: Record<ExecDashboardPrimaryFocus, string> = {
    risk: 'Risk Management',
    reputation: 'Brand Reputation',
    growth: 'Growth & Opportunities',
    governance: 'Governance & Compliance',
    mixed: 'Mixed Overview',
  };
  return labels[focus] || focus;
}

/**
 * Get color class for source system
 */
export function getSourceSystemColor(source: ExecInsightSourceSystem): string {
  const colors: Record<ExecInsightSourceSystem, string> = {
    risk_radar: 'text-red-600 bg-red-50',
    crisis: 'text-orange-600 bg-orange-50',
    reputation: 'text-blue-600 bg-blue-50',
    governance: 'text-purple-600 bg-purple-50',
    media_performance: 'text-green-600 bg-green-50',
    competitive_intel: 'text-yellow-600 bg-yellow-50',
    personas: 'text-pink-600 bg-pink-50',
    outreach: 'text-indigo-600 bg-indigo-50',
    media_monitoring: 'text-cyan-600 bg-cyan-50',
    press_releases: 'text-teal-600 bg-teal-50',
    pitches: 'text-emerald-600 bg-emerald-50',
    media_lists: 'text-sky-600 bg-sky-50',
    journalist_discovery: 'text-violet-600 bg-violet-50',
    other: 'text-gray-600 bg-gray-50',
  };
  return colors[source] || 'text-gray-600 bg-gray-50';
}

/**
 * Get trend icon class
 */
export function getTrendIconClass(trend: 'up' | 'down' | 'flat'): string {
  switch (trend) {
    case 'up':
      return 'text-green-500';
    case 'down':
      return 'text-red-500';
    default:
      return 'text-gray-400';
  }
}

/**
 * Format relative time
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

/**
 * Format duration in milliseconds
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

// ============================================================================
// Export API Object
// ============================================================================

export const execDashboardApi = {
  listDashboards,
  getDashboard,
  createDashboard,
  updateDashboard,
  deleteDashboard,
  refreshDashboard,
  listInsights,
  listKpis,
  listNarratives,
};

// Re-export types for convenience
export type {
  ExecDashboard,
  ExecDashboardInsight,
  ExecDashboardKpi,
  ExecDashboardNarrative,
  ExecDashboardTimeWindow,
  ExecDashboardPrimaryFocus,
  ExecInsightSourceSystem,
  ExecDashboardWithCounts,
  ExecDashboardSummary,
  ExecKpiTrend,
  ListDashboardsResponse,
  GetDashboardResponse,
  CreateDashboardResponse,
  UpdateDashboardResponse,
  RefreshDashboardResponse,
  ListInsightsResponse,
  ListKpisResponse,
  ListNarrativesResponse,
  CreateDashboardInput,
  UpdateDashboardInput,
  RefreshDashboardInput,
  ListDashboardsParams,
  ListInsightsParams,
  ListKpisParams,
  ListNarrativesParams,
};
