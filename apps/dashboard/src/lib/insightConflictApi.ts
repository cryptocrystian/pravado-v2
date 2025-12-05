/**
 * Insight Conflict Resolution API Client (Sprint S74)
 *
 * Type-safe client functions for insight conflict resolution API endpoints
 * plus helper utilities for formatting and display.
 */

import type {
  InsightConflict,
  InsightConflictItem,
  InsightConflictResolution,
  InsightConflictAuditLog,
  InsightConflictCluster,
  ConflictGraphData,
  ConflictAnalysisResult,
  ConflictStats,
  ConflictType,
  ConflictSeverity,
  ConflictStatus,
  ConflictResolutionType,
  ConflictEdgeType,
  ConflictItemRole,
  CreateConflictInput,
  UpdateConflictInput,
  AnalyzeConflictInput,
  ResolveConflictInput,
  ReviewResolutionInput,
  CreateClusterInput,
  CreateGraphEdgeInput,
  ListConflictsQuery,
  ListConflictItemsQuery,
  ListResolutionsQuery,
  ListAuditLogQuery,
  ListClustersQuery,
  RunDetectionInput,
  BatchAnalyzeInput,
  BatchResolveInput,
  BatchDismissInput,
  ListConflictsResponse,
  GetConflictResponse,
  CreateConflictResponse,
  UpdateConflictResponse,
  AnalyzeConflictResponse,
  ResolveConflictResponse,
  GetConflictGraphResponse,
  GetConflictStatsResponse,
  ListConflictItemsResponse,
  ListResolutionsResponse,
  ListAuditLogResponse,
  ListClustersResponse,
  RunDetectionResponse,
  BatchAnalyzeResponse,
  BatchResolveResponse,
  BatchDismissResponse,
  InsightConflictGraphEdge,
} from '@pravado/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_PREFIX = '/api/v1/insight-conflicts';

// ============================================================================
// GENERIC API CLIENT
// ============================================================================

async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${API_PREFIX}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    'x-org-id': localStorage.getItem('orgId') || '',
    'x-user-id': localStorage.getItem('userId') || '',
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
// CONFLICT CRUD API
// ============================================================================

/**
 * List insight conflicts for the organization
 */
export async function listConflicts(
  filters?: ListConflictsQuery
): Promise<ListConflictsResponse> {
  const query = buildQueryString((filters || {}) as Record<string, unknown>);
  return apiClient<ListConflictsResponse>(`?${query}`);
}

/**
 * Get a single insight conflict by ID
 */
export async function getConflict(id: string): Promise<GetConflictResponse> {
  return apiClient<GetConflictResponse>(`/${id}`);
}

/**
 * Create a new insight conflict
 */
export async function createConflict(
  data: CreateConflictInput
): Promise<CreateConflictResponse> {
  return apiClient<CreateConflictResponse>('/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update an insight conflict
 */
export async function updateConflict(
  id: string,
  data: UpdateConflictInput
): Promise<UpdateConflictResponse> {
  return apiClient<UpdateConflictResponse>(`/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/**
 * Delete an insight conflict
 */
export async function deleteConflict(
  id: string
): Promise<{ success: boolean }> {
  return apiClient<{ success: boolean }>(`/${id}`, {
    method: 'DELETE',
  });
}

// ============================================================================
// ANALYSIS API
// ============================================================================

/**
 * Analyze an insight conflict
 */
export async function analyzeConflict(
  id: string,
  options?: AnalyzeConflictInput
): Promise<AnalyzeConflictResponse> {
  return apiClient<AnalyzeConflictResponse>(`/${id}/analyze`, {
    method: 'POST',
    body: JSON.stringify(options || {}),
  });
}

// ============================================================================
// RESOLUTION API
// ============================================================================

/**
 * Resolve an insight conflict
 */
export async function resolveConflict(
  id: string,
  data: ResolveConflictInput
): Promise<ResolveConflictResponse> {
  return apiClient<ResolveConflictResponse>(`/${id}/resolve`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Dismiss an insight conflict
 */
export async function dismissConflict(
  id: string,
  reason?: string
): Promise<UpdateConflictResponse> {
  return apiClient<UpdateConflictResponse>(`/${id}/dismiss`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

/**
 * Review a resolution
 */
export async function reviewResolution(
  conflictId: string,
  resolutionId: string,
  data: ReviewResolutionInput
): Promise<{ resolution: InsightConflictResolution }> {
  return apiClient<{ resolution: InsightConflictResolution }>(
    `/${conflictId}/resolutions/${resolutionId}/review`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

// ============================================================================
// ITEMS API
// ============================================================================

/**
 * List conflict items for a conflict
 */
export async function listConflictItems(
  conflictId: string,
  filters?: Omit<ListConflictItemsQuery, 'conflictId'>
): Promise<ListConflictItemsResponse> {
  const query = buildQueryString(filters || {});
  return apiClient<ListConflictItemsResponse>(`/${conflictId}/items?${query}`);
}

// ============================================================================
// RESOLUTIONS API
// ============================================================================

/**
 * List resolutions for a conflict
 */
export async function listResolutions(
  conflictId: string,
  filters?: Omit<ListResolutionsQuery, 'conflictId'>
): Promise<ListResolutionsResponse> {
  const query = buildQueryString(filters || {});
  return apiClient<ListResolutionsResponse>(`/${conflictId}/resolutions?${query}`);
}

// ============================================================================
// AUDIT LOG API
// ============================================================================

/**
 * List audit log entries for a conflict
 */
export async function listAuditLog(
  conflictId: string,
  filters?: Omit<ListAuditLogQuery, 'conflictId'>
): Promise<ListAuditLogResponse> {
  const query = buildQueryString(filters || {});
  return apiClient<ListAuditLogResponse>(`/${conflictId}/audit-log?${query}`);
}

// ============================================================================
// GRAPH API
// ============================================================================

/**
 * Get conflict graph for visualization
 */
export async function getConflictGraph(
  id: string
): Promise<GetConflictGraphResponse> {
  return apiClient<GetConflictGraphResponse>(`/${id}/graph`);
}

/**
 * Create a graph edge between conflicts
 */
export async function createGraphEdge(
  data: CreateGraphEdgeInput
): Promise<{ edge: InsightConflictGraphEdge }> {
  return apiClient<{ edge: InsightConflictGraphEdge }>('/graph-edges', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============================================================================
// CLUSTERS API
// ============================================================================

/**
 * List conflict clusters
 */
export async function listClusters(
  filters?: ListClustersQuery
): Promise<ListClustersResponse> {
  const query = buildQueryString((filters || {}) as Record<string, unknown>);
  return apiClient<ListClustersResponse>(`/clusters?${query}`);
}

/**
 * Create a conflict cluster
 */
export async function createCluster(
  data: CreateClusterInput
): Promise<{ cluster: InsightConflictCluster }> {
  return apiClient<{ cluster: InsightConflictCluster }>('/clusters', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============================================================================
// DETECTION API
// ============================================================================

/**
 * Run conflict detection
 */
export async function runDetection(
  input?: RunDetectionInput
): Promise<RunDetectionResponse> {
  return apiClient<RunDetectionResponse>('/detect', {
    method: 'POST',
    body: JSON.stringify(input || {}),
  });
}

// ============================================================================
// BATCH OPERATIONS API
// ============================================================================

/**
 * Batch analyze multiple conflicts
 */
export async function batchAnalyze(
  data: BatchAnalyzeInput
): Promise<BatchAnalyzeResponse> {
  return apiClient<BatchAnalyzeResponse>('/batch/analyze', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Batch resolve multiple conflicts
 */
export async function batchResolve(
  data: BatchResolveInput
): Promise<BatchResolveResponse> {
  return apiClient<BatchResolveResponse>('/batch/resolve', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Batch dismiss multiple conflicts
 */
export async function batchDismiss(
  data: BatchDismissInput
): Promise<BatchDismissResponse> {
  return apiClient<BatchDismissResponse>('/batch/dismiss', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============================================================================
// STATISTICS API
// ============================================================================

/**
 * Get conflict statistics
 */
export async function getConflictStats(): Promise<GetConflictStatsResponse> {
  return apiClient<GetConflictStatsResponse>('/stats');
}

// ============================================================================
// HELPER FUNCTIONS - CONFLICT TYPE
// ============================================================================

/**
 * Get label for conflict type
 */
export function getConflictTypeLabel(type: ConflictType): string {
  const labels: Record<ConflictType, string> = {
    contradiction: 'Contradiction',
    divergence: 'Divergence',
    ambiguity: 'Ambiguity',
    missing_data: 'Missing Data',
    inconsistency: 'Inconsistency',
  };
  return labels[type] || type;
}

/**
 * Get color for conflict type
 */
export function getConflictTypeColor(type: ConflictType): string {
  const colors: Record<ConflictType, string> = {
    contradiction: 'text-red-600',
    divergence: 'text-orange-600',
    ambiguity: 'text-yellow-600',
    missing_data: 'text-blue-600',
    inconsistency: 'text-purple-600',
  };
  return colors[type] || 'text-gray-600';
}

/**
 * Get background color for conflict type
 */
export function getConflictTypeBgColor(type: ConflictType): string {
  const colors: Record<ConflictType, string> = {
    contradiction: 'bg-red-50',
    divergence: 'bg-orange-50',
    ambiguity: 'bg-yellow-50',
    missing_data: 'bg-blue-50',
    inconsistency: 'bg-purple-50',
  };
  return colors[type] || 'bg-gray-50';
}

/**
 * Get icon for conflict type
 */
export function getConflictTypeIcon(type: ConflictType): string {
  const icons: Record<ConflictType, string> = {
    contradiction: 'X',
    divergence: 'ArrowsSplit',
    ambiguity: 'QuestionMark',
    missing_data: 'FileX',
    inconsistency: 'AlertTriangle',
  };
  return icons[type] || 'Circle';
}

// ============================================================================
// HELPER FUNCTIONS - SEVERITY
// ============================================================================

/**
 * Get label for conflict severity
 */
export function getConflictSeverityLabel(severity: ConflictSeverity): string {
  const labels: Record<ConflictSeverity, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
  };
  return labels[severity] || severity;
}

/**
 * Get color for conflict severity
 */
export function getConflictSeverityColor(severity: ConflictSeverity): string {
  const colors: Record<ConflictSeverity, string> = {
    low: 'text-green-600',
    medium: 'text-yellow-600',
    high: 'text-orange-600',
    critical: 'text-red-600',
  };
  return colors[severity] || 'text-gray-600';
}

/**
 * Get background color for conflict severity
 */
export function getConflictSeverityBgColor(severity: ConflictSeverity): string {
  const colors: Record<ConflictSeverity, string> = {
    low: 'bg-green-50',
    medium: 'bg-yellow-50',
    high: 'bg-orange-50',
    critical: 'bg-red-50',
  };
  return colors[severity] || 'bg-gray-50';
}

/**
 * Get badge color for conflict severity
 */
export function getConflictSeverityBadgeColor(severity: ConflictSeverity): string {
  const colors: Record<ConflictSeverity, string> = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  };
  return colors[severity] || 'bg-gray-100 text-gray-800';
}

// ============================================================================
// HELPER FUNCTIONS - STATUS
// ============================================================================

/**
 * Get label for conflict status
 */
export function getConflictStatusLabel(status: ConflictStatus): string {
  const labels: Record<ConflictStatus, string> = {
    detected: 'Detected',
    analyzing: 'Analyzing',
    resolved: 'Resolved',
    dismissed: 'Dismissed',
  };
  return labels[status] || status;
}

/**
 * Get color for conflict status
 */
export function getConflictStatusColor(status: ConflictStatus): string {
  const colors: Record<ConflictStatus, string> = {
    detected: 'text-blue-600',
    analyzing: 'text-yellow-600',
    resolved: 'text-green-600',
    dismissed: 'text-gray-600',
  };
  return colors[status] || 'text-gray-600';
}

/**
 * Get background color for conflict status
 */
export function getConflictStatusBgColor(status: ConflictStatus): string {
  const colors: Record<ConflictStatus, string> = {
    detected: 'bg-blue-50',
    analyzing: 'bg-yellow-50',
    resolved: 'bg-green-50',
    dismissed: 'bg-gray-50',
  };
  return colors[status] || 'bg-gray-50';
}

/**
 * Get badge color for conflict status
 */
export function getConflictStatusBadgeColor(status: ConflictStatus): string {
  const colors: Record<ConflictStatus, string> = {
    detected: 'bg-blue-100 text-blue-800',
    analyzing: 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-green-100 text-green-800',
    dismissed: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

// ============================================================================
// HELPER FUNCTIONS - RESOLUTION TYPE
// ============================================================================

/**
 * Get label for resolution type
 */
export function getResolutionTypeLabel(type: ConflictResolutionType): string {
  const labels: Record<ConflictResolutionType, string> = {
    ai_consensus: 'AI Consensus',
    weighted_truth: 'Weighted Truth',
    source_priority: 'Source Priority',
    hybrid: 'Hybrid',
  };
  return labels[type] || type;
}

/**
 * Get description for resolution type
 */
export function getResolutionTypeDescription(type: ConflictResolutionType): string {
  const descriptions: Record<ConflictResolutionType, string> = {
    ai_consensus: 'AI synthesizes a consensus from all conflicting sources',
    weighted_truth: 'Truth is weighted by source reliability scores',
    source_priority: 'Higher priority source takes precedence',
    hybrid: 'Combination of multiple resolution strategies',
  };
  return descriptions[type] || '';
}

/**
 * Get color for resolution type
 */
export function getResolutionTypeColor(type: ConflictResolutionType): string {
  const colors: Record<ConflictResolutionType, string> = {
    ai_consensus: 'text-indigo-600',
    weighted_truth: 'text-blue-600',
    source_priority: 'text-purple-600',
    hybrid: 'text-green-600',
  };
  return colors[type] || 'text-gray-600';
}

/**
 * Get background color for resolution type
 */
export function getResolutionTypeBgColor(type: ConflictResolutionType): string {
  const colors: Record<ConflictResolutionType, string> = {
    ai_consensus: 'bg-indigo-50',
    weighted_truth: 'bg-blue-50',
    source_priority: 'bg-purple-50',
    hybrid: 'bg-green-50',
  };
  return colors[type] || 'bg-gray-50';
}

// ============================================================================
// HELPER FUNCTIONS - EDGE TYPE
// ============================================================================

/**
 * Get label for edge type
 */
export function getEdgeTypeLabel(type: ConflictEdgeType): string {
  const labels: Record<ConflictEdgeType, string> = {
    related: 'Related',
    caused_by: 'Caused By',
    contradicts: 'Contradicts',
    supersedes: 'Supersedes',
  };
  return labels[type] || type;
}

/**
 * Get color for edge type
 */
export function getEdgeTypeColor(type: ConflictEdgeType): string {
  const colors: Record<ConflictEdgeType, string> = {
    related: '#9CA3AF',
    caused_by: '#F59E0B',
    contradicts: '#EF4444',
    supersedes: '#8B5CF6',
  };
  return colors[type] || '#9CA3AF';
}

// ============================================================================
// HELPER FUNCTIONS - ITEM ROLE
// ============================================================================

/**
 * Get label for item role
 */
export function getItemRoleLabel(role: ConflictItemRole): string {
  const labels: Record<ConflictItemRole, string> = {
    primary: 'Primary',
    secondary: 'Secondary',
    context: 'Context',
  };
  return labels[role] || role;
}

/**
 * Get color for item role
 */
export function getItemRoleColor(role: ConflictItemRole): string {
  const colors: Record<ConflictItemRole, string> = {
    primary: 'text-blue-600',
    secondary: 'text-indigo-600',
    context: 'text-gray-600',
  };
  return colors[role] || 'text-gray-600';
}

// ============================================================================
// HELPER FUNCTIONS - SCORES
// ============================================================================

/**
 * Format confidence score
 */
export function formatConfidenceScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'N/A';
  const percent = Math.round(score * 100);
  if (percent >= 80) return `${percent}% (High)`;
  if (percent >= 60) return `${percent}% (Good)`;
  if (percent >= 40) return `${percent}% (Fair)`;
  return `${percent}% (Low)`;
}

/**
 * Get color for confidence score
 */
export function getConfidenceScoreColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'text-gray-600';
  if (score >= 0.8) return 'text-green-600';
  if (score >= 0.6) return 'text-blue-600';
  if (score >= 0.4) return 'text-yellow-600';
  return 'text-red-600';
}

/**
 * Format severity score (0-100)
 */
export function formatSeverityScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'N/A';
  if (score >= 80) return `${Math.round(score)} (Critical)`;
  if (score >= 60) return `${Math.round(score)} (High)`;
  if (score >= 40) return `${Math.round(score)} (Medium)`;
  return `${Math.round(score)} (Low)`;
}

/**
 * Get color for severity score
 */
export function getSeverityScoreColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'text-gray-600';
  if (score >= 80) return 'text-red-600';
  if (score >= 60) return 'text-orange-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-green-600';
}

// ============================================================================
// HELPER FUNCTIONS - DATES
// ============================================================================

/**
 * Format relative time
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString();
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Format short date
 */
export function formatShortDate(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

// ============================================================================
// HELPER FUNCTIONS - TOKENS & DURATION
// ============================================================================

/**
 * Format token count
 */
export function formatTokens(tokens: number | null | undefined): string {
  if (tokens === null || tokens === undefined) return 'N/A';
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
  return tokens.toString();
}

/**
 * Format duration in milliseconds
 */
export function formatDuration(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return 'N/A';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

// ============================================================================
// HELPER FUNCTIONS - STATISTICS
// ============================================================================

/**
 * Calculate resolution rate percentage
 */
export function formatResolutionRate(rate: number | null | undefined): string {
  if (rate === null || rate === undefined) return 'N/A';
  return `${Math.round(rate * 100)}%`;
}

/**
 * Format average resolution time
 */
export function formatAvgResolutionTime(hours: number | null | undefined): string {
  if (hours === null || hours === undefined) return 'N/A';
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 24) return `${hours.toFixed(1)} hr`;
  return `${(hours / 24).toFixed(1)} days`;
}

// ============================================================================
// HELPER FUNCTIONS - GRAPH
// ============================================================================

/**
 * Get node color based on type
 */
export function getGraphNodeColor(
  nodeType: 'conflict' | 'item' | 'source' | 'resolution',
  severity?: ConflictSeverity
): string {
  if (nodeType === 'conflict' && severity) {
    const colors: Record<ConflictSeverity, string> = {
      low: '#22C55E',
      medium: '#EAB308',
      high: '#F97316',
      critical: '#EF4444',
    };
    return colors[severity] || '#6B7280';
  }

  const colors: Record<string, string> = {
    conflict: '#3B82F6',
    item: '#8B5CF6',
    source: '#14B8A6',
    resolution: '#22C55E',
  };
  return colors[nodeType] || '#6B7280';
}

/**
 * Get node size based on importance
 */
export function getGraphNodeSize(
  nodeType: 'conflict' | 'item' | 'source' | 'resolution',
  severity?: ConflictSeverity
): number {
  if (nodeType === 'conflict' && severity) {
    const sizes: Record<ConflictSeverity, number> = {
      low: 20,
      medium: 25,
      high: 30,
      critical: 40,
    };
    return sizes[severity] || 20;
  }

  const sizes: Record<string, number> = {
    conflict: 25,
    item: 15,
    source: 12,
    resolution: 20,
  };
  return sizes[nodeType] || 15;
}

// ============================================================================
// HELPER FUNCTIONS - SOURCE SYSTEMS
// ============================================================================

/**
 * Get label for source system
 */
export function getSourceSystemLabel(system: string): string {
  const labels: Record<string, string> = {
    unified_intelligence_graph: 'Unified Intelligence Graph',
    unified_narrative: 'Unified Narrative',
    reality_maps: 'Reality Maps',
    media_monitoring: 'Media Monitoring',
    competitive_intelligence: 'Competitive Intelligence',
    brand_reputation: 'Brand Reputation',
    risk_radar: 'Risk Radar',
    strategic_intelligence: 'Strategic Intelligence',
  };
  return labels[system] || system;
}

/**
 * Get color for source system
 */
export function getSourceSystemColor(system: string): string {
  const colors: Record<string, string> = {
    unified_intelligence_graph: 'text-indigo-600',
    unified_narrative: 'text-blue-600',
    reality_maps: 'text-purple-600',
    media_monitoring: 'text-green-600',
    competitive_intelligence: 'text-orange-600',
    brand_reputation: 'text-pink-600',
    risk_radar: 'text-red-600',
    strategic_intelligence: 'text-teal-600',
  };
  return colors[system] || 'text-gray-600';
}

// ============================================================================
// HELPER FUNCTIONS - DIFFICULTY
// ============================================================================

/**
 * Get label for resolution difficulty
 */
export function getDifficultyLabel(
  difficulty: 'easy' | 'moderate' | 'difficult'
): string {
  const labels: Record<string, string> = {
    easy: 'Easy',
    moderate: 'Moderate',
    difficult: 'Difficult',
  };
  return labels[difficulty] || difficulty;
}

/**
 * Get color for resolution difficulty
 */
export function getDifficultyColor(
  difficulty: 'easy' | 'moderate' | 'difficult'
): string {
  const colors: Record<string, string> = {
    easy: 'text-green-600',
    moderate: 'text-yellow-600',
    difficult: 'text-red-600',
  };
  return colors[difficulty] || 'text-gray-600';
}

// ============================================================================
// HELPER FUNCTIONS - PRIORITY
// ============================================================================

/**
 * Get color for priority
 */
export function getPriorityColor(priority: 'low' | 'medium' | 'high'): string {
  const colors: Record<string, string> = {
    low: 'text-green-600',
    medium: 'text-yellow-600',
    high: 'text-red-600',
  };
  return colors[priority] || 'text-gray-600';
}

/**
 * Get background color for priority
 */
export function getPriorityBgColor(priority: 'low' | 'medium' | 'high'): string {
  const colors: Record<string, string> = {
    low: 'bg-green-50',
    medium: 'bg-yellow-50',
    high: 'bg-red-50',
  };
  return colors[priority] || 'bg-gray-50';
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type {
  InsightConflict,
  InsightConflictItem,
  InsightConflictResolution,
  InsightConflictAuditLog,
  InsightConflictCluster,
  ConflictGraphData,
  ConflictAnalysisResult,
  ConflictStats,
  ConflictType,
  ConflictSeverity,
  ConflictStatus,
  ConflictResolutionType,
  ConflictEdgeType,
  ConflictItemRole,
  CreateConflictInput,
  UpdateConflictInput,
  AnalyzeConflictInput,
  ResolveConflictInput,
  ReviewResolutionInput,
  CreateClusterInput,
  CreateGraphEdgeInput,
  ListConflictsQuery,
  BatchAnalyzeInput,
  BatchResolveInput,
  BatchDismissInput,
};
