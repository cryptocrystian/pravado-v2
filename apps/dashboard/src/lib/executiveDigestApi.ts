/**
 * Executive Digest API Client (Sprint S62)
 * Automated Strategic Briefs & Exec Weekly Digest Generator V1
 *
 * Type-safe client functions for executive digest API endpoints
 * plus helper utilities for formatting and display.
 */

import type {
  ExecDigest,
  ExecDigestWithCounts,
  ExecDigestSection,
  ExecDigestRecipient,
  ExecDigestDeliveryLog,
  ExecDigestDeliveryPeriod,
  ExecDigestTimeWindow,
  ExecDigestSectionType,
  ExecDigestDeliveryStatus,
  GetExecDigestResponse,
  ListExecDigestsResponse,
  GenerateExecDigestResponse,
  DeliverExecDigestResponse,
  ListExecDigestRecipientsResponse,
  ListExecDigestDeliveryLogsResponse,
  ListExecDigestSectionsResponse,
  ExecDigestStats,
} from '@pravado/types';
import {
  EXEC_DIGEST_SECTION_TYPE_LABELS,
  EXEC_DIGEST_DELIVERY_PERIOD_LABELS,
  EXEC_DIGEST_TIME_WINDOW_LABELS,
  EXEC_DIGEST_DELIVERY_STATUS_LABELS,
} from '@pravado/types';
import type {
  CreateExecDigestInput,
  UpdateExecDigestInput,
  GenerateExecDigestInput,
  DeliverExecDigestInput,
  AddExecDigestRecipientInput,
  UpdateExecDigestRecipientInput,
  ListExecDigestsQuery,
  ListExecDigestRecipientsQuery,
  ListExecDigestDeliveryLogsQuery,
} from '@pravado/validators';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_PREFIX = '/api/v1/exec-digests';

// ============================================================================
// GENERIC API CLIENT
// ============================================================================

async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string; message?: string }> {
  const url = `${BASE_URL}${API_PREFIX}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    'x-org-id': typeof window !== 'undefined' ? localStorage.getItem('orgId') || '' : '',
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
// DIGEST CRUD API
// ============================================================================

/**
 * List digests with filtering and pagination
 */
export async function listDigests(query?: ListExecDigestsQuery): Promise<ListExecDigestsResponse> {
  const qs = query ? buildQueryString(query) : '';
  const result = await apiClient<ListExecDigestsResponse>(qs ? `?${qs}` : '');
  return result.data!;
}

/**
 * Create a new digest
 */
export async function createDigest(data: CreateExecDigestInput): Promise<ExecDigest> {
  const result = await apiClient<ExecDigest>('', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.data!;
}

/**
 * Get a single digest with all related data
 */
export async function getDigest(id: string): Promise<GetExecDigestResponse> {
  const result = await apiClient<GetExecDigestResponse>(`/${id}`);
  return result.data!;
}

/**
 * Update a digest
 */
export async function updateDigest(id: string, data: UpdateExecDigestInput): Promise<ExecDigest> {
  const result = await apiClient<ExecDigest>(`/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return result.data!;
}

/**
 * Delete (archive) a digest
 */
export async function deleteDigest(
  id: string,
  hardDelete: boolean = false
): Promise<{ deleted: boolean; archived: boolean }> {
  const qs = hardDelete ? '?hard=true' : '';
  const result = await apiClient<{ deleted: boolean; archived: boolean }>(`/${id}${qs}`, {
    method: 'DELETE',
  });
  return result.data!;
}

/**
 * Get digest statistics
 */
export async function getDigestStats(): Promise<ExecDigestStats> {
  const result = await apiClient<ExecDigestStats>('/stats');
  return result.data!;
}

// ============================================================================
// GENERATION & DELIVERY API
// ============================================================================

/**
 * Generate digest content (sections) from aggregated data
 */
export async function generateDigest(
  id: string,
  options?: GenerateExecDigestInput
): Promise<GenerateExecDigestResponse> {
  const result = await apiClient<GenerateExecDigestResponse>(`/${id}/generate`, {
    method: 'POST',
    body: JSON.stringify(options || {}),
  });
  return result.data!;
}

/**
 * Deliver digest to recipients via email
 */
export async function deliverDigest(
  id: string,
  options?: DeliverExecDigestInput
): Promise<DeliverExecDigestResponse> {
  const result = await apiClient<DeliverExecDigestResponse>(`/${id}/deliver`, {
    method: 'POST',
    body: JSON.stringify(options || {}),
  });
  return result.data!;
}

// ============================================================================
// SECTION MANAGEMENT API
// ============================================================================

/**
 * List sections for a digest
 */
export async function listSections(digestId: string): Promise<ListExecDigestSectionsResponse> {
  const result = await apiClient<ListExecDigestSectionsResponse>(`/${digestId}/sections`);
  return result.data!;
}

/**
 * Update section ordering
 */
export async function updateSectionOrder(
  digestId: string,
  sections: { sectionId: string; sortOrder: number }[]
): Promise<ExecDigestSection[]> {
  const result = await apiClient<{ sections: ExecDigestSection[] }>(`/${digestId}/sections/order`, {
    method: 'POST',
    body: JSON.stringify({ sections }),
  });
  return result.data!.sections;
}

// ============================================================================
// RECIPIENT MANAGEMENT API
// ============================================================================

/**
 * List recipients for a digest
 */
export async function listRecipients(
  digestId: string,
  query?: ListExecDigestRecipientsQuery
): Promise<ListExecDigestRecipientsResponse> {
  const qs = query ? buildQueryString(query) : '';
  const result = await apiClient<ListExecDigestRecipientsResponse>(
    `/${digestId}/recipients${qs ? `?${qs}` : ''}`
  );
  return result.data!;
}

/**
 * Add a recipient to a digest
 */
export async function addRecipient(
  digestId: string,
  data: AddExecDigestRecipientInput
): Promise<ExecDigestRecipient> {
  const result = await apiClient<ExecDigestRecipient>(`/${digestId}/recipients`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.data!;
}

/**
 * Update a recipient
 */
export async function updateRecipient(
  digestId: string,
  recipientId: string,
  data: UpdateExecDigestRecipientInput
): Promise<ExecDigestRecipient> {
  const result = await apiClient<ExecDigestRecipient>(`/${digestId}/recipients/${recipientId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return result.data!;
}

/**
 * Remove a recipient from a digest
 */
export async function removeRecipient(digestId: string, recipientId: string): Promise<void> {
  await apiClient(`/${digestId}/recipients/${recipientId}`, {
    method: 'DELETE',
  });
}

// ============================================================================
// DELIVERY LOG API
// ============================================================================

/**
 * List delivery logs for a digest
 */
export async function listDeliveryLogs(
  digestId: string,
  query?: ListExecDigestDeliveryLogsQuery
): Promise<ListExecDigestDeliveryLogsResponse> {
  const qs = query ? buildQueryString(query) : '';
  const result = await apiClient<ListExecDigestDeliveryLogsResponse>(
    `/${digestId}/deliveries${qs ? `?${qs}` : ''}`
  );
  return result.data!;
}

// ============================================================================
// HELPER FUNCTIONS
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
 * Get color for delivery status
 */
export function getDeliveryStatusColor(status: ExecDigestDeliveryStatus): string {
  const colors: Record<ExecDigestDeliveryStatus, string> = {
    pending: 'text-yellow-600',
    sending: 'text-blue-600',
    success: 'text-green-600',
    partial_success: 'text-orange-600',
    error: 'text-red-600',
  };
  return colors[status] || 'text-gray-600';
}

/**
 * Get background color for delivery status
 */
export function getDeliveryStatusBgColor(status: ExecDigestDeliveryStatus): string {
  const colors: Record<ExecDigestDeliveryStatus, string> = {
    pending: 'bg-yellow-100',
    sending: 'bg-blue-100',
    success: 'bg-green-100',
    partial_success: 'bg-orange-100',
    error: 'bg-red-100',
  };
  return colors[status] || 'bg-gray-100';
}

/**
 * Get icon for delivery status
 */
export function getDeliveryStatusIcon(status: ExecDigestDeliveryStatus): string {
  const icons: Record<ExecDigestDeliveryStatus, string> = {
    pending: 'clock',
    sending: 'loader',
    success: 'check-circle',
    partial_success: 'alert-circle',
    error: 'x-circle',
  };
  return icons[status] || 'circle';
}

/**
 * Get icon for section type
 */
export function getSectionTypeIcon(type: ExecDigestSectionType): string {
  const icons: Record<ExecDigestSectionType, string> = {
    executive_summary: 'file-text',
    key_kpis: 'bar-chart-2',
    key_insights: 'lightbulb',
    risk_summary: 'alert-triangle',
    reputation_summary: 'star',
    competitive_summary: 'users',
    media_performance: 'trending-up',
    crisis_status: 'alert-octagon',
    governance_highlights: 'shield',
    action_recommendations: 'check-square',
    custom: 'edit',
  };
  return icons[type] || 'file';
}

/**
 * Format day of week number to name
 */
export function getDayOfWeekLabel(day: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[day] || 'Unknown';
}

/**
 * Format hour to 12-hour time
 */
export function formatHour(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:00 ${period}`;
}

/**
 * Format schedule string
 */
export function formatSchedule(digest: ExecDigest): string {
  const day = getDayOfWeekLabel(digest.scheduleDayOfWeek);
  const time = formatHour(digest.scheduleHour);
  const period = getDeliveryPeriodLabel(digest.deliveryPeriod);
  return `${period} on ${day} at ${time} (${digest.scheduleTimezone})`;
}

/**
 * Format relative time
 */
export function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return 'Never';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Format future time
 */
export function formatFutureTime(dateString: string | null): string {
  if (!dateString) return 'Not scheduled';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMs < 0) return 'Overdue';
  if (diffMins < 60) return `in ${diffMins}m`;
  if (diffHours < 24) return `in ${diffHours}h`;
  if (diffDays < 7) return `in ${diffDays}d`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Format date and time
 */
export function formatDateTime(dateString: string | null): string {
  if (!dateString) return 'N/A';

  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Get color for KPI trend
 */
export function getTrendColor(direction: 'up' | 'down' | 'flat'): string {
  const colors: Record<'up' | 'down' | 'flat', string> = {
    up: 'text-green-600',
    down: 'text-red-600',
    flat: 'text-gray-600',
  };
  return colors[direction] || 'text-gray-600';
}

/**
 * Get icon for KPI trend
 */
export function getTrendIcon(direction: 'up' | 'down' | 'flat'): string {
  const icons: Record<'up' | 'down' | 'flat', string> = {
    up: 'trending-up',
    down: 'trending-down',
    flat: 'minus',
  };
  return icons[direction] || 'minus';
}

/**
 * Format percentage
 */
export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

/**
 * Format large number with K/M suffix
 */
export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return 'N/A';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

/**
 * Get color for score (0-100)
 */
export function getScoreColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'text-gray-600';
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-red-600';
}

/**
 * Get background color for score (0-100)
 */
export function getScoreBgColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'bg-gray-100';
  if (score >= 80) return 'bg-green-100';
  if (score >= 60) return 'bg-blue-100';
  if (score >= 40) return 'bg-yellow-100';
  return 'bg-red-100';
}

/**
 * Calculate digest health status
 */
export function getDigestHealthStatus(
  digest: ExecDigestWithCounts
): 'healthy' | 'warning' | 'error' {
  // Check if digest is active
  if (!digest.isActive) return 'warning';

  // Check if recipients configured
  if (digest.recipientsCount === 0) return 'warning';

  // Check if sections generated
  if (digest.sectionsCount === 0) return 'warning';

  // Check if deliveries are working
  if (digest.deliveriesCount > 0) {
    return 'healthy';
  }

  return 'warning';
}

/**
 * Get color for digest health status
 */
export function getDigestHealthColor(status: 'healthy' | 'warning' | 'error'): string {
  const colors: Record<'healthy' | 'warning' | 'error', string> = {
    healthy: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
  };
  return colors[status];
}

// Re-export types for convenience
export type {
  ExecDigest,
  ExecDigestWithCounts,
  ExecDigestSection,
  ExecDigestRecipient,
  ExecDigestDeliveryLog,
  ExecDigestDeliveryPeriod,
  ExecDigestTimeWindow,
  ExecDigestSectionType,
  ExecDigestDeliveryStatus,
  GetExecDigestResponse,
  ListExecDigestsResponse,
  GenerateExecDigestResponse,
  DeliverExecDigestResponse,
  ListExecDigestRecipientsResponse,
  ListExecDigestDeliveryLogsResponse,
  ListExecDigestSectionsResponse,
  ExecDigestStats,
};
