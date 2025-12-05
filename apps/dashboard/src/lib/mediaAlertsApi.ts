/**
 * Media Alerts API Helper (Sprint S43)
 * Client-side API functions for media monitoring alerts and smart signals
 */

import type {
  MediaAlertRule,
  MediaAlertEvent,
  MediaAlertRuleListResponse,
  MediaAlertEventListResponse,
  MediaAlertSignalsOverview,
  CreateMediaAlertRuleInput,
  UpdateMediaAlertRuleInput,
  ListMediaAlertRulesQuery,
  ListMediaAlertEventsQuery,
  MarkAlertEventsReadInput,
} from '@pravado/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// ============================================================================
// API Error Handling
// ============================================================================

interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });

  const result: ApiResponse<T> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'API request failed');
  }

  return result.data;
}

// ============================================================================
// Alert Rule API Functions
// ============================================================================

export async function createAlertRule(input: CreateMediaAlertRuleInput): Promise<MediaAlertRule> {
  const data = await fetchApi<{ rule: MediaAlertRule }>('/api/v1/media-alerts/rules', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return data.rule;
}

export async function listAlertRules(params?: ListMediaAlertRulesQuery): Promise<MediaAlertRuleListResponse> {
  const queryParams = new URLSearchParams();
  if (params?.alertType) queryParams.set('alertType', params.alertType);
  if (params?.isActive !== undefined) queryParams.set('isActive', String(params.isActive));
  if (params?.limit !== undefined) queryParams.set('limit', String(params.limit));
  if (params?.offset !== undefined) queryParams.set('offset', String(params.offset));
  if (params?.sortBy) queryParams.set('sortBy', params.sortBy);
  if (params?.sortOrder) queryParams.set('sortOrder', params.sortOrder);

  const endpoint = `/api/v1/media-alerts/rules${queryParams.toString() ? `?${queryParams}` : ''}`;
  return fetchApi<MediaAlertRuleListResponse>(endpoint);
}

export async function getAlertRule(id: string): Promise<MediaAlertRule> {
  const data = await fetchApi<{ rule: MediaAlertRule }>(`/api/v1/media-alerts/rules/${id}`);
  return data.rule;
}

export async function updateAlertRule(id: string, input: UpdateMediaAlertRuleInput): Promise<MediaAlertRule> {
  const data = await fetchApi<{ rule: MediaAlertRule }>(`/api/v1/media-alerts/rules/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return data.rule;
}

export async function deleteAlertRule(id: string): Promise<void> {
  await fetchApi<{ message: string }>(`/api/v1/media-alerts/rules/${id}`, {
    method: 'DELETE',
  });
}

// ============================================================================
// Alert Event API Functions
// ============================================================================

export async function listAlertEvents(params?: ListMediaAlertEventsQuery): Promise<MediaAlertEventListResponse> {
  const queryParams = new URLSearchParams();
  if (params?.ruleId) queryParams.set('ruleId', params.ruleId);
  if (params?.alertType) queryParams.set('alertType', params.alertType);
  if (params?.severity) queryParams.set('severity', params.severity);
  if (params?.isRead !== undefined) queryParams.set('isRead', String(params.isRead));
  if (params?.startDate) queryParams.set('startDate', params.startDate);
  if (params?.endDate) queryParams.set('endDate', params.endDate);
  if (params?.limit !== undefined) queryParams.set('limit', String(params.limit));
  if (params?.offset !== undefined) queryParams.set('offset', String(params.offset));
  if (params?.sortBy) queryParams.set('sortBy', params.sortBy);
  if (params?.sortOrder) queryParams.set('sortOrder', params.sortOrder);

  const endpoint = `/api/v1/media-alerts/events${queryParams.toString() ? `?${queryParams}` : ''}`;
  return fetchApi<MediaAlertEventListResponse>(endpoint);
}

export async function getAlertEvent(id: string): Promise<MediaAlertEvent> {
  const data = await fetchApi<{ event: MediaAlertEvent }>(`/api/v1/media-alerts/events/${id}`);
  return data.event;
}

export async function markAlertEventsRead(input: MarkAlertEventsReadInput): Promise<number> {
  const data = await fetchApi<{ updatedCount: number }>('/api/v1/media-alerts/events/mark-read', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return data.updatedCount;
}

// ============================================================================
// Signals & Evaluation API Functions
// ============================================================================

export async function getSignalsOverview(): Promise<MediaAlertSignalsOverview> {
  return fetchApi<MediaAlertSignalsOverview>('/api/v1/media-alerts/signals');
}

export async function manualEvaluateAlerts(): Promise<{ eventsCreated: number; events: MediaAlertEvent[] }> {
  return fetchApi<{ eventsCreated: number; events: MediaAlertEvent[] }>('/api/v1/media-alerts/evaluate', {
    method: 'POST',
  });
}
