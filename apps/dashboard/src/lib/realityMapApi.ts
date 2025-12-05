/**
 * Reality Map API Client Helpers (Sprint S73)
 * Client-side API functions for AI-Driven Multi-Outcome Reality Maps
 */

import type {
  RealityMap,
  RealityMapNode,
  RealityMapPath,
  RealityMapAuditLog,
  RealityMapStatus,
  RealityMapNodeType,
  RealityMapGraphData,
  RealityMapAnalysisResponse,
  RealityMapStats,
  CreateRealityMapInput,
  UpdateRealityMapInput,
  GenerateRealityMapInput,
  ListRealityMapsQuery,
  ListRealityMapsResponse,
  GetRealityMapResponse,
  CreateRealityMapResponse,
  UpdateRealityMapResponse,
  GenerateRealityMapResponse,
  GetRealityMapGraphResponse,
  GetRealityMapAnalysisResponse,
  GetRealityMapGlobalStatsResponse,
  PathOutcomeType,
} from '@pravado/types';

import {
  REALITY_MAP_STATUS_LABELS,
  REALITY_MAP_STATUS_COLORS,
  REALITY_MAP_NODE_TYPE_LABELS,
  REALITY_MAP_NODE_TYPE_COLORS,
  PATH_OUTCOME_TYPE_LABELS,
  PATH_OUTCOME_TYPE_COLORS,
  PROBABILITY_MODEL_LABELS,
  NARRATIVE_STYLE_LABELS,
} from '@pravado/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const BASE_PATH = '/api/v1/reality-maps';

/**
 * Make authenticated API request
 */
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
// REALITY MAPS CRUD
// ============================================================================

/**
 * List reality maps
 */
export async function listRealityMaps(
  query?: Partial<ListRealityMapsQuery>
): Promise<ListRealityMapsResponse> {
  const params = new URLSearchParams();
  if (query?.search) params.set('search', query.search);
  if (query?.status) params.set('status', query.status);
  if (query?.suiteId) params.set('suiteId', query.suiteId);
  if (query?.sortBy) params.set('sortBy', query.sortBy);
  if (query?.sortOrder) params.set('sortOrder', query.sortOrder);
  if (query?.limit) params.set('limit', String(query.limit));
  if (query?.offset) params.set('offset', String(query.offset));

  const qs = params.toString();
  return fetchWithAuth(`${BASE_PATH}${qs ? `?${qs}` : ''}`);
}

/**
 * Get reality map by ID
 */
export async function getRealityMap(mapId: string): Promise<GetRealityMapResponse> {
  return fetchWithAuth(`${BASE_PATH}/${mapId}`);
}

/**
 * Create a new reality map
 */
export async function createRealityMap(
  input: CreateRealityMapInput
): Promise<CreateRealityMapResponse> {
  return fetchWithAuth(`${BASE_PATH}`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/**
 * Update a reality map
 */
export async function updateRealityMap(
  mapId: string,
  input: UpdateRealityMapInput
): Promise<UpdateRealityMapResponse> {
  return fetchWithAuth(`${BASE_PATH}/${mapId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

/**
 * Delete a reality map
 */
export async function deleteRealityMap(mapId: string): Promise<{ success: boolean }> {
  return fetchWithAuth(`${BASE_PATH}/${mapId}`, {
    method: 'DELETE',
  });
}

// ============================================================================
// GENERATION
// ============================================================================

/**
 * Generate reality map from source data
 */
export async function generateRealityMap(
  mapId: string,
  input?: GenerateRealityMapInput
): Promise<GenerateRealityMapResponse> {
  return fetchWithAuth(`${BASE_PATH}/${mapId}/generate`, {
    method: 'POST',
    body: JSON.stringify(input || {}),
  });
}

// ============================================================================
// GRAPH & VISUALIZATION
// ============================================================================

/**
 * Get graph data for visualization
 */
export async function getGraph(mapId: string): Promise<GetRealityMapGraphResponse> {
  return fetchWithAuth(`${BASE_PATH}/${mapId}/graph`);
}

// ============================================================================
// ANALYSIS
// ============================================================================

/**
 * Get analysis for reality map
 */
export async function getAnalysis(mapId: string): Promise<GetRealityMapAnalysisResponse> {
  return fetchWithAuth(`${BASE_PATH}/${mapId}/analysis`);
}

// ============================================================================
// STATS
// ============================================================================

/**
 * Get global stats for organization
 */
export async function getGlobalStats(): Promise<GetRealityMapGlobalStatsResponse> {
  return fetchWithAuth(`${BASE_PATH}/stats`);
}

// ============================================================================
// AUDIT LOG
// ============================================================================

/**
 * List audit events for a reality map
 */
export async function listAuditEvents(
  mapId: string,
  query?: { limit?: number; offset?: number; eventType?: string }
): Promise<{ events: RealityMapAuditLog[]; total: number }> {
  const params = new URLSearchParams();
  if (query?.limit) params.set('limit', String(query.limit));
  if (query?.offset) params.set('offset', String(query.offset));
  if (query?.eventType) params.set('eventType', query.eventType);

  const qs = params.toString();
  return fetchWithAuth(`${BASE_PATH}/${mapId}/audit-log${qs ? `?${qs}` : ''}`);
}

// ============================================================================
// LABEL MAPS & UTILITIES
// ============================================================================

export const STATUS_LABELS = REALITY_MAP_STATUS_LABELS;
export const STATUS_COLORS = REALITY_MAP_STATUS_COLORS;
export const NODE_TYPE_LABELS = REALITY_MAP_NODE_TYPE_LABELS;
export const NODE_TYPE_COLORS = REALITY_MAP_NODE_TYPE_COLORS;
export const OUTCOME_TYPE_LABELS = PATH_OUTCOME_TYPE_LABELS;
export const OUTCOME_TYPE_COLORS = PATH_OUTCOME_TYPE_COLORS;
export const PROBABILITY_MODELS = PROBABILITY_MODEL_LABELS;
export const NARRATIVE_STYLES = NARRATIVE_STYLE_LABELS;

/**
 * Get status badge color class for Tailwind
 */
export function getStatusBadgeClass(status: RealityMapStatus): string {
  const colorMap: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-800',
    blue: 'bg-blue-100 text-blue-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
  };

  const color = STATUS_COLORS[status] || 'gray';
  return colorMap[color] || colorMap.gray;
}

/**
 * Get node type badge color class
 */
export function getNodeTypeBadgeClass(nodeType: RealityMapNodeType): string {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-100 text-indigo-800',
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    gray: 'bg-gray-100 text-gray-800',
  };

  const color = NODE_TYPE_COLORS[nodeType] || 'gray';
  return colorMap[color] || colorMap.gray;
}

/**
 * Get outcome type badge color class
 */
export function getOutcomeTypeBadgeClass(outcomeType: PathOutcomeType): string {
  const colorMap: Record<string, string> = {
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    blue: 'bg-blue-100 text-blue-800',
    orange: 'bg-orange-100 text-orange-800',
    purple: 'bg-purple-100 text-purple-800',
    gray: 'bg-gray-100 text-gray-800',
  };

  const color = OUTCOME_TYPE_COLORS[outcomeType] || 'gray';
  return colorMap[color] || colorMap.gray;
}

/**
 * Get risk score color class
 */
export function getRiskScoreClass(score: number): string {
  if (score >= 80) return 'text-red-600';
  if (score >= 60) return 'text-orange-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-green-600';
}

/**
 * Get opportunity score color class
 */
export function getOpportunityScoreClass(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-gray-600';
}

/**
 * Format probability as percentage
 */
export function formatProbability(probability: number): string {
  return `${(probability * 100).toFixed(1)}%`;
}

/**
 * Format score (0-100)
 */
export function formatScore(score: number): string {
  return score.toFixed(0);
}

/**
 * Get node color based on risk score
 */
export function getNodeColor(riskScore: number): string {
  if (riskScore >= 80) return '#EF4444'; // red
  if (riskScore >= 60) return '#F97316'; // orange
  if (riskScore >= 40) return '#EAB308'; // yellow
  return '#22C55E'; // green
}

/**
 * Get edge color based on probability
 */
export function getEdgeColor(probability: number): string {
  if (probability >= 0.7) return '#22C55E'; // green - high prob
  if (probability >= 0.4) return '#3B82F6'; // blue - medium prob
  return '#9CA3AF'; // gray - low prob
}

/**
 * Calculate node size based on probability
 */
export function calculateNodeSize(probability: number, baseSize: number = 40): number {
  return Math.max(baseSize * 0.5, baseSize * probability * 1.5);
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
 * Get risk level from score
 */
export function getRiskLevel(score: number): 'critical' | 'high' | 'medium' | 'low' {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

/**
 * Get risk level badge class
 */
export function getRiskLevelBadgeClass(level: string): string {
  const classes: Record<string, string> = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800',
  };
  return classes[level] || classes.low;
}

/**
 * Get opportunity level from score
 */
export function getOpportunityLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

/**
 * Get opportunity level badge class
 */
export function getOpportunityLevelBadgeClass(level: string): string {
  const classes: Record<string, string> = {
    high: 'bg-green-100 text-green-800',
    medium: 'bg-blue-100 text-blue-800',
    low: 'bg-gray-100 text-gray-800',
  };
  return classes[level] || classes.low;
}

// ============================================================================
// RE-EXPORT TYPES
// ============================================================================

export type {
  RealityMap,
  RealityMapNode,
  RealityMapPath,
  RealityMapAuditLog,
  RealityMapStatus,
  RealityMapNodeType,
  RealityMapGraphData,
  RealityMapAnalysisResponse,
  RealityMapStats,
  CreateRealityMapInput,
  UpdateRealityMapInput,
  GenerateRealityMapInput,
  ListRealityMapsQuery,
  PathOutcomeType,
};
