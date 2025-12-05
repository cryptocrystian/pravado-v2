/**
 * Unified Intelligence Graph API Helper (Sprint S66)
 * Global Insight Fabric & Unified Intelligence Graph V1
 */

import {
  IntelligenceNode,
  IntelligenceEdge,
  IntelligenceGraphSnapshot,
  IntelligenceGraphAuditLog,
  NodeWithConnections,
  EdgeWithNodes,
  GraphMetrics,
  GraphPath,
  PathExplanation,
  TraversalResult,
  SemanticSearchResult,
  GraphStats,
  NodeType,
  EdgeType,
  GraphSnapshotStatus,
  GraphEventType,
  CreateNodeInput,
  UpdateNodeInput,
  ListNodesInput,
  CreateEdgeInput,
  UpdateEdgeInput,
  ListEdgesInput,
  MergeNodesInput,
  GraphQueryInput,
  GenerateSnapshotInput,
  ExplainPathInput,
  GenerateEmbeddingsInput,
  ComputeMetricsInput,
  ListNodesResponse,
  ListEdgesResponse,
  GraphQueryResponse,
  ListSnapshotsResponse,
  ListAuditLogsResponse,
  MergeNodesResponse,
  GenerateEmbeddingsResponse,
  ComputeMetricsResponse,
  NODE_TYPE_LABELS,
  EDGE_TYPE_LABELS,
  SNAPSHOT_STATUS_LABELS,
  EVENT_TYPE_LABELS,
} from '@pravado/types';

// ============================================================================
// API BASE URL
// ============================================================================

const API_BASE = '/api/v1/unified-graph';

// ============================================================================
// FETCH HELPER
// ============================================================================

async function apiFetch<T>(
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
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// ============================================================================
// NODE OPERATIONS
// ============================================================================

export async function createNode(input: CreateNodeInput): Promise<IntelligenceNode> {
  return apiFetch<IntelligenceNode>('/nodes', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function getNode(nodeId: string): Promise<IntelligenceNode> {
  return apiFetch<IntelligenceNode>(`/nodes/${nodeId}`);
}

export async function updateNode(
  nodeId: string,
  input: UpdateNodeInput
): Promise<IntelligenceNode> {
  return apiFetch<IntelligenceNode>(`/nodes/${nodeId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteNode(nodeId: string): Promise<void> {
  return apiFetch<void>(`/nodes/${nodeId}`, {
    method: 'DELETE',
  });
}

export async function listNodes(
  input: ListNodesInput = {}
): Promise<ListNodesResponse> {
  const params = new URLSearchParams();

  if (input.limit) params.set('limit', String(input.limit));
  if (input.offset) params.set('offset', String(input.offset));
  if (input.nodeTypes?.length) params.set('nodeTypes', input.nodeTypes.join(','));
  if (input.tags?.length) params.set('tags', input.tags.join(','));
  if (input.categories?.length) params.set('categories', input.categories.join(','));
  if (input.search) params.set('search', input.search);
  if (input.sourceSystem) params.set('sourceSystem', input.sourceSystem);
  if (input.isActive !== undefined) params.set('isActive', String(input.isActive));
  if (input.sortBy) params.set('sortBy', input.sortBy);
  if (input.sortOrder) params.set('sortOrder', input.sortOrder);
  if (input.clusterId) params.set('clusterId', input.clusterId);
  if (input.communityId) params.set('communityId', input.communityId);

  const query = params.toString();
  return apiFetch<ListNodesResponse>(`/nodes${query ? `?${query}` : ''}`);
}

export async function getNodeWithConnections(
  nodeId: string
): Promise<NodeWithConnections> {
  return apiFetch<NodeWithConnections>(`/nodes/${nodeId}/connections`);
}

export async function getNodeNeighbors(
  nodeId: string,
  input: { direction?: 'outgoing' | 'incoming' | 'both'; limit?: number } = {}
): Promise<{ node: IntelligenceNode; neighbors: IntelligenceNode[]; edges: IntelligenceEdge[] }> {
  const params = new URLSearchParams();
  if (input.direction) params.set('direction', input.direction);
  if (input.limit) params.set('limit', String(input.limit));

  const query = params.toString();
  return apiFetch(`/nodes/${nodeId}/neighbors${query ? `?${query}` : ''}`);
}

// ============================================================================
// EDGE OPERATIONS
// ============================================================================

export async function createEdge(input: CreateEdgeInput): Promise<IntelligenceEdge> {
  return apiFetch<IntelligenceEdge>('/edges', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function getEdge(edgeId: string): Promise<IntelligenceEdge> {
  return apiFetch<IntelligenceEdge>(`/edges/${edgeId}`);
}

export async function updateEdge(
  edgeId: string,
  input: UpdateEdgeInput
): Promise<IntelligenceEdge> {
  return apiFetch<IntelligenceEdge>(`/edges/${edgeId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteEdge(edgeId: string): Promise<void> {
  return apiFetch<void>(`/edges/${edgeId}`, {
    method: 'DELETE',
  });
}

export async function listEdges(
  input: ListEdgesInput = {}
): Promise<ListEdgesResponse> {
  const params = new URLSearchParams();

  if (input.limit) params.set('limit', String(input.limit));
  if (input.offset) params.set('offset', String(input.offset));
  if (input.edgeTypes?.length) params.set('edgeTypes', input.edgeTypes.join(','));
  if (input.sourceNodeId) params.set('sourceNodeId', input.sourceNodeId);
  if (input.targetNodeId) params.set('targetNodeId', input.targetNodeId);
  if (input.nodeId) params.set('nodeId', input.nodeId);
  if (input.minWeight !== undefined) params.set('minWeight', String(input.minWeight));
  if (input.maxWeight !== undefined) params.set('maxWeight', String(input.maxWeight));
  if (input.isActive !== undefined) params.set('isActive', String(input.isActive));
  if (input.isBidirectional !== undefined) params.set('isBidirectional', String(input.isBidirectional));
  if (input.sortBy) params.set('sortBy', input.sortBy);
  if (input.sortOrder) params.set('sortOrder', input.sortOrder);

  const query = params.toString();
  return apiFetch<ListEdgesResponse>(`/edges${query ? `?${query}` : ''}`);
}

export async function getEdgeWithNodes(edgeId: string): Promise<EdgeWithNodes> {
  return apiFetch<EdgeWithNodes>(`/edges/${edgeId}/nodes`);
}

// ============================================================================
// MERGE OPERATIONS
// ============================================================================

export async function mergeNodes(input: MergeNodesInput): Promise<MergeNodesResponse> {
  return apiFetch<MergeNodesResponse>('/merge', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// ============================================================================
// QUERY & TRAVERSAL
// ============================================================================

export async function queryGraph(input: GraphQueryInput): Promise<GraphQueryResponse> {
  return apiFetch<GraphQueryResponse>('/query', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function traverseGraph(input: {
  startNodeId: string;
  direction?: 'outgoing' | 'incoming' | 'both';
  maxDepth?: number;
  nodeTypes?: NodeType[];
  edgeTypes?: EdgeType[];
  limit?: number;
}): Promise<TraversalResult> {
  return apiFetch<TraversalResult>('/traverse', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function findShortestPath(
  startNodeId: string,
  endNodeId: string,
  maxDepth?: number
): Promise<GraphPath | null> {
  try {
    return await apiFetch<GraphPath>('/path', {
      method: 'POST',
      body: JSON.stringify({ startNodeId, endNodeId, maxDepth }),
    });
  } catch (error) {
    if (String(error).includes('No path found')) {
      return null;
    }
    throw error;
  }
}

export async function explainPath(input: ExplainPathInput): Promise<PathExplanation | null> {
  try {
    return await apiFetch<PathExplanation>('/explain-path', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  } catch (error) {
    if (String(error).includes('No path found')) {
      return null;
    }
    throw error;
  }
}

export async function semanticSearch(input: {
  query: string;
  nodeTypes?: NodeType[];
  threshold?: number;
  limit?: number;
}): Promise<{ results: SemanticSearchResult[] }> {
  return apiFetch('/search', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// ============================================================================
// METRICS
// ============================================================================

export async function getMetrics(): Promise<GraphMetrics> {
  return apiFetch<GraphMetrics>('/metrics');
}

export async function computeMetrics(
  input: ComputeMetricsInput = {}
): Promise<ComputeMetricsResponse> {
  return apiFetch<ComputeMetricsResponse>('/metrics/compute', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// ============================================================================
// EMBEDDINGS
// ============================================================================

export async function generateEmbeddings(
  input: GenerateEmbeddingsInput
): Promise<GenerateEmbeddingsResponse> {
  return apiFetch<GenerateEmbeddingsResponse>('/embeddings', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// ============================================================================
// SNAPSHOTS
// ============================================================================

export async function createSnapshot(
  input: GenerateSnapshotInput
): Promise<IntelligenceGraphSnapshot> {
  return apiFetch<IntelligenceGraphSnapshot>('/snapshots', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function getSnapshot(snapshotId: string): Promise<IntelligenceGraphSnapshot> {
  return apiFetch<IntelligenceGraphSnapshot>(`/snapshots/${snapshotId}`);
}

export async function listSnapshots(input: {
  limit?: number;
  offset?: number;
  status?: GraphSnapshotStatus;
} = {}): Promise<ListSnapshotsResponse> {
  const params = new URLSearchParams();

  if (input.limit) params.set('limit', String(input.limit));
  if (input.offset) params.set('offset', String(input.offset));
  if (input.status) params.set('status', input.status);

  const query = params.toString();
  return apiFetch<ListSnapshotsResponse>(`/snapshots${query ? `?${query}` : ''}`);
}

export async function regenerateSnapshot(
  snapshotId: string
): Promise<IntelligenceGraphSnapshot> {
  return apiFetch<IntelligenceGraphSnapshot>(`/snapshots/${snapshotId}/regenerate`, {
    method: 'POST',
  });
}

// ============================================================================
// AUDIT LOGS
// ============================================================================

export async function listAuditLogs(input: {
  limit?: number;
  offset?: number;
  eventType?: GraphEventType;
  nodeId?: string;
  edgeId?: string;
} = {}): Promise<ListAuditLogsResponse> {
  const params = new URLSearchParams();

  if (input.limit) params.set('limit', String(input.limit));
  if (input.offset) params.set('offset', String(input.offset));
  if (input.eventType) params.set('eventType', input.eventType);
  if (input.nodeId) params.set('nodeId', input.nodeId);
  if (input.edgeId) params.set('edgeId', input.edgeId);

  const query = params.toString();
  return apiFetch<ListAuditLogsResponse>(`/audit${query ? `?${query}` : ''}`);
}

// ============================================================================
// STATS
// ============================================================================

export async function getStats(): Promise<GraphStats> {
  return apiFetch<GraphStats>('/stats');
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

export function getNodeTypeLabel(nodeType: NodeType): string {
  return NODE_TYPE_LABELS[nodeType] || nodeType;
}

export function getEdgeTypeLabel(edgeType: EdgeType): string {
  return EDGE_TYPE_LABELS[edgeType] || edgeType;
}

export function getSnapshotStatusLabel(status: GraphSnapshotStatus): string {
  return SNAPSHOT_STATUS_LABELS[status] || status;
}

export function getEventTypeLabel(eventType: GraphEventType): string {
  return EVENT_TYPE_LABELS[eventType] || eventType;
}

export function getNodeTypeColor(nodeType: NodeType): string {
  const colorMap: Partial<Record<NodeType, string>> = {
    [NodeType.ORGANIZATION]: 'bg-blue-100 text-blue-800',
    [NodeType.USER]: 'bg-purple-100 text-purple-800',
    [NodeType.TEAM]: 'bg-indigo-100 text-indigo-800',
    [NodeType.PRESS_RELEASE]: 'bg-green-100 text-green-800',
    [NodeType.MEDIA_COVERAGE]: 'bg-teal-100 text-teal-800',
    [NodeType.JOURNALIST]: 'bg-cyan-100 text-cyan-800',
    [NodeType.PUBLICATION]: 'bg-sky-100 text-sky-800',
    [NodeType.COMPETITOR]: 'bg-red-100 text-red-800',
    [NodeType.CRISIS_EVENT]: 'bg-rose-100 text-rose-800',
    [NodeType.RISK_FACTOR]: 'bg-orange-100 text-orange-800',
    [NodeType.BRAND_SIGNAL]: 'bg-yellow-100 text-yellow-800',
    [NodeType.STRATEGIC_REPORT]: 'bg-violet-100 text-violet-800',
    [NodeType.CLUSTER]: 'bg-gray-100 text-gray-800',
    [NodeType.TOPIC]: 'bg-emerald-100 text-emerald-800',
    [NodeType.THEME]: 'bg-lime-100 text-lime-800',
  };

  return colorMap[nodeType] || 'bg-slate-100 text-slate-800';
}

export function getEdgeTypeColor(edgeType: EdgeType): string {
  const colorMap: Partial<Record<EdgeType, string>> = {
    [EdgeType.PARENT_OF]: 'text-blue-600',
    [EdgeType.CHILD_OF]: 'text-blue-500',
    [EdgeType.CAUSED_BY]: 'text-red-600',
    [EdgeType.LEADS_TO]: 'text-orange-600',
    [EdgeType.TRIGGERS]: 'text-rose-600',
    [EdgeType.MITIGATES]: 'text-green-600',
    [EdgeType.SIMILAR_TO]: 'text-purple-600',
    [EdgeType.RELATED_TO]: 'text-indigo-600',
    [EdgeType.INFLUENCES]: 'text-cyan-600',
    [EdgeType.IMPACTS]: 'text-teal-600',
    [EdgeType.SUPPORTS_STRATEGY]: 'text-emerald-600',
    [EdgeType.THREATENS_STRATEGY]: 'text-red-500',
    [EdgeType.POSITIVE_SENTIMENT_TOWARD]: 'text-green-500',
    [EdgeType.NEGATIVE_SENTIMENT_TOWARD]: 'text-red-500',
    [EdgeType.NEUTRAL_SENTIMENT_TOWARD]: 'text-gray-500',
  };

  return colorMap[edgeType] || 'text-slate-600';
}

export function getSnapshotStatusColor(status: GraphSnapshotStatus): string {
  const colorMap: Record<GraphSnapshotStatus, string> = {
    [GraphSnapshotStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
    [GraphSnapshotStatus.GENERATING]: 'bg-blue-100 text-blue-800',
    [GraphSnapshotStatus.COMPLETE]: 'bg-green-100 text-green-800',
    [GraphSnapshotStatus.FAILED]: 'bg-red-100 text-red-800',
    [GraphSnapshotStatus.ARCHIVED]: 'bg-gray-100 text-gray-800',
  };

  return colorMap[status];
}

export function formatCentrality(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';
  return (value * 100).toFixed(1) + '%';
}

export function formatWeight(value: number): string {
  return value.toFixed(2);
}

export function formatNodeCount(count: number): string {
  if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
  if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
  return count.toString();
}

// Re-export types for convenience
export type {
  IntelligenceNode,
  IntelligenceEdge,
  IntelligenceGraphSnapshot,
  IntelligenceGraphAuditLog,
  NodeWithConnections,
  EdgeWithNodes,
  GraphMetrics,
  GraphPath,
  PathExplanation,
  TraversalResult,
  SemanticSearchResult,
  GraphStats,
  CreateNodeInput,
  UpdateNodeInput,
  ListNodesInput,
  CreateEdgeInput,
  UpdateEdgeInput,
  ListEdgesInput,
  MergeNodesInput,
  GraphQueryInput,
  GenerateSnapshotInput,
  ExplainPathInput,
  GenerateEmbeddingsInput,
  ComputeMetricsInput,
  ListNodesResponse,
  ListEdgesResponse,
  GraphQueryResponse,
  ListSnapshotsResponse,
  ListAuditLogsResponse,
  MergeNodesResponse,
  GenerateEmbeddingsResponse,
  ComputeMetricsResponse,
};

export {
  NodeType,
  EdgeType,
  GraphSnapshotStatus,
  GraphEventType,
  NODE_TYPE_LABELS,
  EDGE_TYPE_LABELS,
  SNAPSHOT_STATUS_LABELS,
  EVENT_TYPE_LABELS,
};
