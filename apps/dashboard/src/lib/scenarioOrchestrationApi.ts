/**
 * Scenario Orchestration API Client Helpers (Sprint S72)
 * Client-side API functions for multi-scenario orchestration suites
 */

import type {
  ScenarioSuite,
  ScenarioSuiteItem,
  ScenarioSuiteRun,
  ScenarioSuiteRunItem,
  ScenarioSuiteAuditEvent,
  ScenarioSuiteStatus,
  ScenarioSuiteRunStatus,
  TriggerConditionType,
  CreateScenarioSuiteInput,
  UpdateScenarioSuiteInput,
  CreateSuiteItemInput,
  UpdateSuiteItemInput,
  ListScenarioSuitesQuery,
  ListScenarioSuitesResponse,
  GetScenarioSuiteResponse,
  ListSuiteRunsQuery,
  ListSuiteRunsResponse,
  GetScenarioSuiteRunResponse,
  StartScenarioSuiteRunInput,
  StartScenarioSuiteRunResponse,
  AdvanceSuiteRunInput,
  AdvanceSuiteRunResponse,
  AbortSuiteRunResponse,
  ListSuiteRunItemsResponse,
  CreateScenarioSuiteResponse,
  UpdateScenarioSuiteResponse,
  ArchiveScenarioSuiteResponse,
  GetSuiteRunMetricsResponse,
  GetScenarioSuiteStatsResponse,
  GenerateSuiteNarrativeResponse,
  GenerateSuiteRiskMapResponse,
  ListSuiteAuditEventsResponse,
} from '@pravado/types';

import {
  SCENARIO_SUITE_STATUS_LABELS,
  SCENARIO_SUITE_STATUS_COLORS,
  SCENARIO_SUITE_RUN_STATUS_LABELS,
  SCENARIO_SUITE_RUN_STATUS_COLORS,
  SCENARIO_SUITE_ITEM_STATUS_LABELS,
  SCENARIO_SUITE_ITEM_STATUS_COLORS,
  TRIGGER_CONDITION_TYPE_LABELS,
  TRIGGER_CONDITION_TYPE_DESCRIPTIONS,
} from '@pravado/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const BASE_PATH = '/api/v1/scenario-orchestrations';

async function fetchWithAuth<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Request failed');
  }

  return result;
}

// ============================================================================
// SUITE CRUD
// ============================================================================

/**
 * List scenario suites
 */
export async function listSuites(
  query?: Partial<ListScenarioSuitesQuery>
): Promise<ListScenarioSuitesResponse> {
  const params = new URLSearchParams();
  if (query?.search) params.set('search', query.search);
  if (query?.status) params.set('status', query.status);
  if (query?.sortBy) params.set('sortBy', query.sortBy);
  if (query?.sortOrder) params.set('sortOrder', query.sortOrder);
  if (query?.limit) params.set('limit', String(query.limit));
  if (query?.offset) params.set('offset', String(query.offset));
  if (query?.includeArchived) params.set('includeArchived', 'true');

  const qs = params.toString();
  return fetchWithAuth(`${BASE_PATH}/suites${qs ? `?${qs}` : ''}`);
}

/**
 * Get suite by ID with items
 */
export async function getSuite(suiteId: string): Promise<GetScenarioSuiteResponse> {
  return fetchWithAuth(`${BASE_PATH}/suites/${suiteId}`);
}

/**
 * Create a new suite
 */
export async function createSuite(
  input: CreateScenarioSuiteInput
): Promise<CreateScenarioSuiteResponse> {
  return fetchWithAuth(`${BASE_PATH}/suites`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/**
 * Update a suite
 */
export async function updateSuite(
  suiteId: string,
  input: UpdateScenarioSuiteInput
): Promise<UpdateScenarioSuiteResponse> {
  return fetchWithAuth(`${BASE_PATH}/suites/${suiteId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

/**
 * Archive a suite
 */
export async function archiveSuite(
  suiteId: string,
  reason?: string
): Promise<ArchiveScenarioSuiteResponse> {
  return fetchWithAuth(`${BASE_PATH}/suites/${suiteId}/archive`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

// ============================================================================
// SUITE ITEMS
// ============================================================================

/**
 * Add an item to a suite
 */
export async function addSuiteItem(
  suiteId: string,
  input: CreateSuiteItemInput
): Promise<{ success: boolean; item: ScenarioSuiteItem }> {
  return fetchWithAuth(`${BASE_PATH}/suites/${suiteId}/items`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/**
 * Update a suite item
 */
export async function updateSuiteItem(
  itemId: string,
  input: UpdateSuiteItemInput
): Promise<{ success: boolean; item: ScenarioSuiteItem }> {
  return fetchWithAuth(`${BASE_PATH}/suite-items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

/**
 * Remove a suite item
 */
export async function removeSuiteItem(
  itemId: string
): Promise<{ success: boolean }> {
  return fetchWithAuth(`${BASE_PATH}/suite-items/${itemId}`, {
    method: 'DELETE',
  });
}

// ============================================================================
// SUITE RUNS
// ============================================================================

/**
 * Start a new suite run
 */
export async function startSuiteRun(
  suiteId: string,
  input?: StartScenarioSuiteRunInput
): Promise<StartScenarioSuiteRunResponse> {
  return fetchWithAuth(`${BASE_PATH}/suites/${suiteId}/runs`, {
    method: 'POST',
    body: JSON.stringify(input || {}),
  });
}

/**
 * List suite runs
 */
export async function listSuiteRuns(
  suiteId: string,
  query?: Partial<ListSuiteRunsQuery>
): Promise<ListSuiteRunsResponse> {
  const params = new URLSearchParams();
  if (query?.status) params.set('status', query.status);
  if (query?.limit) params.set('limit', String(query.limit));
  if (query?.offset) params.set('offset', String(query.offset));
  if (query?.sortOrder) params.set('sortOrder', query.sortOrder);

  const qs = params.toString();
  return fetchWithAuth(`${BASE_PATH}/suites/${suiteId}/runs${qs ? `?${qs}` : ''}`);
}

/**
 * Get suite run detail
 */
export async function getSuiteRun(runId: string): Promise<GetScenarioSuiteRunResponse> {
  return fetchWithAuth(`${BASE_PATH}/suite-runs/${runId}`);
}

/**
 * List suite run items
 */
export async function listSuiteRunItems(
  runId: string
): Promise<ListSuiteRunItemsResponse> {
  return fetchWithAuth(`${BASE_PATH}/suite-runs/${runId}/items`);
}

/**
 * Advance suite run
 */
export async function advanceSuiteRun(
  runId: string,
  input?: AdvanceSuiteRunInput
): Promise<AdvanceSuiteRunResponse> {
  return fetchWithAuth(`${BASE_PATH}/suite-runs/${runId}/advance`, {
    method: 'POST',
    body: JSON.stringify(input || {}),
  });
}

/**
 * Abort suite run
 */
export async function abortSuiteRun(
  runId: string,
  reason?: string
): Promise<AbortSuiteRunResponse> {
  return fetchWithAuth(`${BASE_PATH}/suite-runs/${runId}/abort`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

// ============================================================================
// METRICS & OBSERVABILITY
// ============================================================================

/**
 * Get suite run metrics
 */
export async function getSuiteRunMetrics(
  runId: string
): Promise<GetSuiteRunMetricsResponse> {
  return fetchWithAuth(`${BASE_PATH}/suite-runs/${runId}/metrics`);
}

/**
 * Get suite statistics
 */
export async function getSuiteStats(): Promise<GetScenarioSuiteStatsResponse> {
  return fetchWithAuth(`${BASE_PATH}/stats`);
}

// ============================================================================
// NARRATIVE & RISK MAP
// ============================================================================

/**
 * Generate suite narrative
 */
export async function generateSuiteNarrative(
  runId: string,
  options?: { format?: 'summary' | 'detailed' | 'executive'; includeRecommendations?: boolean }
): Promise<GenerateSuiteNarrativeResponse> {
  return fetchWithAuth(`${BASE_PATH}/suite-runs/${runId}/narrative`, {
    method: 'POST',
    body: JSON.stringify(options || {}),
  });
}

/**
 * Generate suite risk map
 */
export async function generateSuiteRiskMap(
  runId: string,
  options?: { includeOpportunities?: boolean; includeMitigations?: boolean }
): Promise<GenerateSuiteRiskMapResponse> {
  return fetchWithAuth(`${BASE_PATH}/suite-runs/${runId}/risk-map`, {
    method: 'POST',
    body: JSON.stringify(options || {}),
  });
}

// ============================================================================
// AUDIT LOG
// ============================================================================

/**
 * List audit events for a suite
 */
export async function listSuiteAuditEvents(
  suiteId: string,
  query?: { limit?: number; offset?: number; eventType?: string }
): Promise<ListSuiteAuditEventsResponse> {
  const params = new URLSearchParams();
  if (query?.limit) params.set('limit', String(query.limit));
  if (query?.offset) params.set('offset', String(query.offset));
  if (query?.eventType) params.set('eventType', query.eventType);

  const qs = params.toString();
  return fetchWithAuth(`${BASE_PATH}/suites/${suiteId}/audit-log${qs ? `?${qs}` : ''}`);
}

/**
 * List audit events for a run
 */
export async function listRunAuditEvents(
  runId: string,
  query?: { limit?: number; offset?: number; eventType?: string }
): Promise<ListSuiteAuditEventsResponse> {
  const params = new URLSearchParams();
  if (query?.limit) params.set('limit', String(query.limit));
  if (query?.offset) params.set('offset', String(query.offset));
  if (query?.eventType) params.set('eventType', query.eventType);

  const qs = params.toString();
  return fetchWithAuth(`${BASE_PATH}/suite-runs/${runId}/audit-log${qs ? `?${qs}` : ''}`);
}

// ============================================================================
// LABEL MAPS & UTILITIES
// ============================================================================

export const SUITE_STATUS_LABELS = SCENARIO_SUITE_STATUS_LABELS;
export const SUITE_STATUS_COLORS = SCENARIO_SUITE_STATUS_COLORS;
export const SUITE_RUN_STATUS_LABELS = SCENARIO_SUITE_RUN_STATUS_LABELS;
export const SUITE_RUN_STATUS_COLORS = SCENARIO_SUITE_RUN_STATUS_COLORS;
export const SUITE_ITEM_STATUS_LABELS = SCENARIO_SUITE_ITEM_STATUS_LABELS;
export const SUITE_ITEM_STATUS_COLORS = SCENARIO_SUITE_ITEM_STATUS_COLORS;
export const CONDITION_TYPE_LABELS = TRIGGER_CONDITION_TYPE_LABELS;
export const CONDITION_TYPE_DESCRIPTIONS = TRIGGER_CONDITION_TYPE_DESCRIPTIONS;

/**
 * Get status badge color class for Tailwind
 */
export function getStatusBadgeClass(status: ScenarioSuiteStatus | ScenarioSuiteRunStatus): string {
  const colorMap: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-800',
    blue: 'bg-blue-100 text-blue-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    orange: 'bg-orange-100 text-orange-800',
    indigo: 'bg-indigo-100 text-indigo-800',
  };

  const color = SUITE_STATUS_COLORS[status as ScenarioSuiteStatus] ||
                SUITE_RUN_STATUS_COLORS[status as ScenarioSuiteRunStatus] ||
                'gray';

  return colorMap[color] || colorMap.gray;
}

/**
 * Format duration from milliseconds
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}

/**
 * Get risk level badge color
 */
export function getRiskBadgeClass(riskLevel: string): string {
  const colorMap: Record<string, string> = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  };
  return colorMap[riskLevel] || colorMap.low;
}

// Re-export types for convenience
export type {
  ScenarioSuite,
  ScenarioSuiteItem,
  ScenarioSuiteRun,
  ScenarioSuiteRunItem,
  ScenarioSuiteAuditEvent,
  ScenarioSuiteStatus,
  ScenarioSuiteRunStatus,
  TriggerConditionType,
  CreateScenarioSuiteInput,
  UpdateScenarioSuiteInput,
  CreateSuiteItemInput,
  UpdateSuiteItemInput,
  StartScenarioSuiteRunInput,
  AdvanceSuiteRunInput,
};
