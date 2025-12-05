/**
 * Unified Intelligence Graph Service (Sprint S66)
 * Global Insight Fabric & Unified Intelligence Graph V1
 * Cross-system knowledge graph integrating S38-S65
 */

import { SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import crypto from 'crypto';
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
  ClusterInfo,
  SnapshotDiff,
  GraphStats,
  NodeType,
  EdgeType,
  EmbeddingProvider,
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
} from '@pravado/types';

// ============================================================================
// TYPES
// ============================================================================

export interface ServiceContext {
  supabase: SupabaseClient;
  orgId: string;
  userId: string;
}

interface DbNode {
  id: string;
  org_id: string;
  node_type: string;
  external_id: string | null;
  source_system: string | null;
  source_table: string | null;
  label: string;
  description: string | null;
  properties_json: Record<string, unknown>;
  tags: string[];
  categories: string[];
  valid_from: string | null;
  valid_to: string | null;
  degree_centrality: number | null;
  betweenness_centrality: number | null;
  closeness_centrality: number | null;
  pagerank_score: number | null;
  cluster_id: string | null;
  community_id: string | null;
  is_active: boolean;
  confidence_score: number | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

interface DbEdge {
  id: string;
  org_id: string;
  source_node_id: string;
  target_node_id: string;
  edge_type: string;
  label: string | null;
  description: string | null;
  properties_json: Record<string, unknown>;
  weight: number;
  is_bidirectional: boolean;
  valid_from: string | null;
  valid_to: string | null;
  source_system: string | null;
  inference_method: string | null;
  confidence_score: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

interface DbSnapshot {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  snapshot_type: string;
  status: string;
  node_count: number | null;
  edge_count: number | null;
  cluster_count: number | null;
  metrics_json: Record<string, unknown>;
  nodes_json: unknown[] | null;
  edges_json: unknown[] | null;
  clusters_json: unknown[] | null;
  previous_snapshot_id: string | null;
  diff_json: Record<string, unknown> | null;
  storage_url: string | null;
  storage_size_bytes: number | null;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

interface DbAuditLog {
  id: string;
  org_id: string;
  event_type: string;
  node_id: string | null;
  edge_id: string | null;
  snapshot_id: string | null;
  actor_id: string | null;
  actor_type: string;
  changes_json: Record<string, unknown>;
  metadata_json: Record<string, unknown>;
  query_json: Record<string, unknown> | null;
  result_count: number | null;
  execution_time_ms: number | null;
  created_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

// ============================================================================
// MAPPERS
// ============================================================================

function mapDbNode(row: DbNode): IntelligenceNode {
  return {
    id: row.id,
    orgId: row.org_id,
    nodeType: row.node_type as NodeType,
    externalId: row.external_id,
    sourceSystem: row.source_system,
    sourceTable: row.source_table,
    label: row.label,
    description: row.description,
    propertiesJson: row.properties_json || {},
    tags: row.tags || [],
    categories: row.categories || [],
    validFrom: row.valid_from,
    validTo: row.valid_to,
    degreeCentrality: row.degree_centrality,
    betweennessCentrality: row.betweenness_centrality,
    closenessCentrality: row.closeness_centrality,
    pagerankScore: row.pagerank_score,
    clusterId: row.cluster_id,
    communityId: row.community_id,
    isActive: row.is_active,
    confidenceScore: row.confidence_score,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

function mapDbEdge(row: DbEdge): IntelligenceEdge {
  return {
    id: row.id,
    orgId: row.org_id,
    sourceNodeId: row.source_node_id,
    targetNodeId: row.target_node_id,
    edgeType: row.edge_type as EdgeType,
    label: row.label,
    description: row.description,
    propertiesJson: row.properties_json || {},
    weight: row.weight,
    isBidirectional: row.is_bidirectional,
    validFrom: row.valid_from,
    validTo: row.valid_to,
    sourceSystem: row.source_system,
    inferenceMethod: row.inference_method,
    confidenceScore: row.confidence_score,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
  };
}

function mapDbSnapshot(row: DbSnapshot): IntelligenceGraphSnapshot {
  return {
    id: row.id,
    orgId: row.org_id,
    name: row.name,
    description: row.description,
    snapshotType: row.snapshot_type,
    status: row.status as GraphSnapshotStatus,
    nodeCount: row.node_count,
    edgeCount: row.edge_count,
    clusterCount: row.cluster_count,
    metricsJson: (row.metrics_json as unknown) as GraphMetrics,
    nodesJson: row.nodes_json as IntelligenceNode[] | null,
    edgesJson: row.edges_json as IntelligenceEdge[] | null,
    clustersJson: row.clusters_json as ClusterInfo[] | null,
    previousSnapshotId: row.previous_snapshot_id,
    diffJson: row.diff_json as SnapshotDiff | null,
    storageUrl: row.storage_url,
    storageSizeBytes: row.storage_size_bytes,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
  };
}

function mapDbAuditLog(row: DbAuditLog): IntelligenceGraphAuditLog {
  return {
    id: row.id,
    orgId: row.org_id,
    eventType: row.event_type as GraphEventType,
    nodeId: row.node_id,
    edgeId: row.edge_id,
    snapshotId: row.snapshot_id,
    actorId: row.actor_id,
    actorType: row.actor_type,
    changesJson: row.changes_json || {},
    metadataJson: row.metadata_json || {},
    queryJson: row.query_json as GraphQueryInput | null,
    resultCount: row.result_count,
    executionTimeMs: row.execution_time_ms,
    createdAt: row.created_at,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
  };
}

// ============================================================================
// OPENAI CLIENT
// ============================================================================

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  return new OpenAI({ apiKey });
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

async function logAuditEvent(
  ctx: ServiceContext,
  eventType: GraphEventType,
  options: {
    nodeId?: string;
    edgeId?: string;
    snapshotId?: string;
    changes?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    query?: GraphQueryInput;
    resultCount?: number;
    executionTimeMs?: number;
  }
): Promise<void> {
  try {
    await ctx.supabase.from('intelligence_graph_audit_log').insert({
      org_id: ctx.orgId,
      event_type: eventType,
      node_id: options.nodeId,
      edge_id: options.edgeId,
      snapshot_id: options.snapshotId,
      actor_id: ctx.userId,
      actor_type: 'user',
      changes_json: options.changes || {},
      metadata_json: options.metadata || {},
      query_json: options.query,
      result_count: options.resultCount,
      execution_time_ms: options.executionTimeMs,
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

// ============================================================================
// NODE OPERATIONS
// ============================================================================

export async function createNode(
  ctx: ServiceContext,
  input: CreateNodeInput
): Promise<IntelligenceNode> {
  const { data, error } = await ctx.supabase
    .from('intelligence_nodes')
    .insert({
      org_id: ctx.orgId,
      node_type: input.nodeType,
      label: input.label,
      description: input.description,
      external_id: input.externalId,
      source_system: input.sourceSystem,
      source_table: input.sourceTable,
      properties_json: input.propertiesJson || {},
      tags: input.tags || [],
      categories: input.categories || [],
      valid_from: input.validFrom,
      valid_to: input.validTo,
      confidence_score: input.confidenceScore,
      created_by: ctx.userId,
      updated_by: ctx.userId,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create node: ${error.message}`);

  const node = mapDbNode(data);

  await logAuditEvent(ctx, GraphEventType.NODE_CREATED, {
    nodeId: node.id,
    changes: { node: input },
  });

  return node;
}

export async function getNode(
  ctx: ServiceContext,
  nodeId: string
): Promise<IntelligenceNode | null> {
  const { data, error } = await ctx.supabase
    .from('intelligence_nodes')
    .select('*')
    .eq('id', nodeId)
    .eq('org_id', ctx.orgId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to get node: ${error.message}`);
  }

  return mapDbNode(data);
}

export async function updateNode(
  ctx: ServiceContext,
  nodeId: string,
  input: UpdateNodeInput
): Promise<IntelligenceNode> {
  const updateData: Record<string, unknown> = {
    updated_by: ctx.userId,
  };

  if (input.label !== undefined) updateData.label = input.label;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.propertiesJson !== undefined) updateData.properties_json = input.propertiesJson;
  if (input.tags !== undefined) updateData.tags = input.tags;
  if (input.categories !== undefined) updateData.categories = input.categories;
  if (input.validFrom !== undefined) updateData.valid_from = input.validFrom;
  if (input.validTo !== undefined) updateData.valid_to = input.validTo;
  if (input.confidenceScore !== undefined) updateData.confidence_score = input.confidenceScore;
  if (input.isActive !== undefined) updateData.is_active = input.isActive;

  const { data, error } = await ctx.supabase
    .from('intelligence_nodes')
    .update(updateData)
    .eq('id', nodeId)
    .eq('org_id', ctx.orgId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update node: ${error.message}`);

  const node = mapDbNode(data);

  await logAuditEvent(ctx, GraphEventType.NODE_UPDATED, {
    nodeId: node.id,
    changes: input as unknown as Record<string, unknown>,
  });

  return node;
}

export async function deleteNode(ctx: ServiceContext, nodeId: string): Promise<void> {
  const { error } = await ctx.supabase
    .from('intelligence_nodes')
    .delete()
    .eq('id', nodeId)
    .eq('org_id', ctx.orgId);

  if (error) throw new Error(`Failed to delete node: ${error.message}`);

  await logAuditEvent(ctx, GraphEventType.NODE_DELETED, {
    nodeId,
  });
}

export async function listNodes(
  ctx: ServiceContext,
  input: ListNodesInput
): Promise<ListNodesResponse> {
  let query = ctx.supabase.from('intelligence_nodes').select('*', { count: 'exact' });

  query = query.eq('org_id', ctx.orgId);

  if (input.nodeTypes && input.nodeTypes.length > 0) {
    query = query.in('node_type', input.nodeTypes);
  }
  if (input.tags && input.tags.length > 0) {
    query = query.overlaps('tags', input.tags);
  }
  if (input.categories && input.categories.length > 0) {
    query = query.overlaps('categories', input.categories);
  }
  if (input.search) {
    query = query.or(`label.ilike.%${input.search}%,description.ilike.%${input.search}%`);
  }
  if (input.sourceSystem) {
    query = query.eq('source_system', input.sourceSystem);
  }
  if (input.isActive !== undefined) {
    query = query.eq('is_active', input.isActive);
  }
  if (input.clusterId) {
    query = query.eq('cluster_id', input.clusterId);
  }
  if (input.communityId) {
    query = query.eq('community_id', input.communityId);
  }

  const sortColumn =
    input.sortBy === 'label'
      ? 'label'
      : input.sortBy === 'degree_centrality'
        ? 'degree_centrality'
        : input.sortBy === 'pagerank_score'
          ? 'pagerank_score'
          : input.sortBy === 'updated_at'
            ? 'updated_at'
            : 'created_at';

  query = query
    .order(sortColumn, { ascending: input.sortOrder === 'asc' })
    .range(input.offset || 0, (input.offset || 0) + (input.limit || 20) - 1);

  const { data, error, count } = await query;

  if (error) throw new Error(`Failed to list nodes: ${error.message}`);

  return {
    nodes: (data || []).map(mapDbNode),
    total: count || 0,
    limit: input.limit || 20,
    offset: input.offset || 0,
  };
}

export async function getNodeWithConnections(
  ctx: ServiceContext,
  nodeId: string
): Promise<NodeWithConnections | null> {
  const node = await getNode(ctx, nodeId);
  if (!node) return null;

  // Get incoming edges
  const { data: incomingEdges } = await ctx.supabase
    .from('intelligence_edges')
    .select('*')
    .eq('org_id', ctx.orgId)
    .eq('target_node_id', nodeId)
    .eq('is_active', true);

  // Get outgoing edges
  const { data: outgoingEdges } = await ctx.supabase
    .from('intelligence_edges')
    .select('*')
    .eq('org_id', ctx.orgId)
    .eq('source_node_id', nodeId)
    .eq('is_active', true);

  // Get neighbor node IDs
  const neighborIds = new Set<string>();
  (incomingEdges || []).forEach((e) => neighborIds.add(e.source_node_id));
  (outgoingEdges || []).forEach((e) => neighborIds.add(e.target_node_id));

  let neighbors: IntelligenceNode[] = [];
  if (neighborIds.size > 0) {
    const { data: neighborData } = await ctx.supabase
      .from('intelligence_nodes')
      .select('*')
      .eq('org_id', ctx.orgId)
      .in('id', Array.from(neighborIds));

    neighbors = (neighborData || []).map(mapDbNode);
  }

  return {
    node,
    incomingEdges: (incomingEdges || []).map(mapDbEdge),
    outgoingEdges: (outgoingEdges || []).map(mapDbEdge),
    neighbors,
  };
}

// ============================================================================
// EDGE OPERATIONS
// ============================================================================

export async function createEdge(
  ctx: ServiceContext,
  input: CreateEdgeInput
): Promise<IntelligenceEdge> {
  // Validate nodes exist
  const { data: nodes } = await ctx.supabase
    .from('intelligence_nodes')
    .select('id')
    .eq('org_id', ctx.orgId)
    .in('id', [input.sourceNodeId, input.targetNodeId]);

  if (!nodes || nodes.length !== 2) {
    throw new Error('Source or target node not found');
  }

  const { data, error } = await ctx.supabase
    .from('intelligence_edges')
    .insert({
      org_id: ctx.orgId,
      source_node_id: input.sourceNodeId,
      target_node_id: input.targetNodeId,
      edge_type: input.edgeType,
      label: input.label,
      description: input.description,
      properties_json: input.propertiesJson || {},
      weight: input.weight ?? 1.0,
      is_bidirectional: input.isBidirectional ?? false,
      valid_from: input.validFrom,
      valid_to: input.validTo,
      source_system: input.sourceSystem,
      inference_method: input.inferenceMethod,
      confidence_score: input.confidenceScore,
      created_by: ctx.userId,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create edge: ${error.message}`);

  const edge = mapDbEdge(data);

  await logAuditEvent(ctx, GraphEventType.EDGE_CREATED, {
    edgeId: edge.id,
    changes: { edge: input },
  });

  return edge;
}

export async function getEdge(
  ctx: ServiceContext,
  edgeId: string
): Promise<IntelligenceEdge | null> {
  const { data, error } = await ctx.supabase
    .from('intelligence_edges')
    .select('*')
    .eq('id', edgeId)
    .eq('org_id', ctx.orgId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to get edge: ${error.message}`);
  }

  return mapDbEdge(data);
}

export async function updateEdge(
  ctx: ServiceContext,
  edgeId: string,
  input: UpdateEdgeInput
): Promise<IntelligenceEdge> {
  const updateData: Record<string, unknown> = {};

  if (input.label !== undefined) updateData.label = input.label;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.propertiesJson !== undefined) updateData.properties_json = input.propertiesJson;
  if (input.weight !== undefined) updateData.weight = input.weight;
  if (input.isBidirectional !== undefined) updateData.is_bidirectional = input.isBidirectional;
  if (input.validFrom !== undefined) updateData.valid_from = input.validFrom;
  if (input.validTo !== undefined) updateData.valid_to = input.validTo;
  if (input.confidenceScore !== undefined) updateData.confidence_score = input.confidenceScore;
  if (input.isActive !== undefined) updateData.is_active = input.isActive;

  const { data, error } = await ctx.supabase
    .from('intelligence_edges')
    .update(updateData)
    .eq('id', edgeId)
    .eq('org_id', ctx.orgId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update edge: ${error.message}`);

  const edge = mapDbEdge(data);

  await logAuditEvent(ctx, GraphEventType.EDGE_UPDATED, {
    edgeId: edge.id,
    changes: input as unknown as Record<string, unknown>,
  });

  return edge;
}

export async function deleteEdge(ctx: ServiceContext, edgeId: string): Promise<void> {
  const { error } = await ctx.supabase
    .from('intelligence_edges')
    .delete()
    .eq('id', edgeId)
    .eq('org_id', ctx.orgId);

  if (error) throw new Error(`Failed to delete edge: ${error.message}`);

  await logAuditEvent(ctx, GraphEventType.EDGE_DELETED, {
    edgeId,
  });
}

export async function listEdges(
  ctx: ServiceContext,
  input: ListEdgesInput
): Promise<ListEdgesResponse> {
  let query = ctx.supabase.from('intelligence_edges').select('*', { count: 'exact' });

  query = query.eq('org_id', ctx.orgId);

  if (input.edgeTypes && input.edgeTypes.length > 0) {
    query = query.in('edge_type', input.edgeTypes);
  }
  if (input.sourceNodeId) {
    query = query.eq('source_node_id', input.sourceNodeId);
  }
  if (input.targetNodeId) {
    query = query.eq('target_node_id', input.targetNodeId);
  }
  if (input.nodeId) {
    query = query.or(`source_node_id.eq.${input.nodeId},target_node_id.eq.${input.nodeId}`);
  }
  if (input.minWeight !== undefined) {
    query = query.gte('weight', input.minWeight);
  }
  if (input.maxWeight !== undefined) {
    query = query.lte('weight', input.maxWeight);
  }
  if (input.isActive !== undefined) {
    query = query.eq('is_active', input.isActive);
  }
  if (input.isBidirectional !== undefined) {
    query = query.eq('is_bidirectional', input.isBidirectional);
  }

  const sortColumn = input.sortBy === 'weight' ? 'weight' : 'created_at';

  query = query
    .order(sortColumn, { ascending: input.sortOrder === 'asc' })
    .range(input.offset || 0, (input.offset || 0) + (input.limit || 20) - 1);

  const { data, error, count } = await query;

  if (error) throw new Error(`Failed to list edges: ${error.message}`);

  return {
    edges: (data || []).map(mapDbEdge),
    total: count || 0,
    limit: input.limit || 20,
    offset: input.offset || 0,
  };
}

export async function getEdgeWithNodes(
  ctx: ServiceContext,
  edgeId: string
): Promise<EdgeWithNodes | null> {
  const edge = await getEdge(ctx, edgeId);
  if (!edge) return null;

  const { data: nodes } = await ctx.supabase
    .from('intelligence_nodes')
    .select('*')
    .eq('org_id', ctx.orgId)
    .in('id', [edge.sourceNodeId, edge.targetNodeId]);

  if (!nodes || nodes.length !== 2) return null;

  const sourceNode = nodes.find((n) => n.id === edge.sourceNodeId);
  const targetNode = nodes.find((n) => n.id === edge.targetNodeId);

  if (!sourceNode || !targetNode) return null;

  return {
    edge,
    sourceNode: mapDbNode(sourceNode),
    targetNode: mapDbNode(targetNode),
  };
}

// ============================================================================
// MERGE OPERATIONS
// ============================================================================

export async function mergeNodes(
  ctx: ServiceContext,
  input: MergeNodesInput
): Promise<MergeNodesResponse> {
  const { data: sourceNodes } = await ctx.supabase
    .from('intelligence_nodes')
    .select('*')
    .eq('org_id', ctx.orgId)
    .in('id', input.sourceNodeIds)
    .order('created_at', { ascending: true });

  if (!sourceNodes || sourceNodes.length !== input.sourceNodeIds.length) {
    throw new Error('One or more source nodes not found');
  }

  let mergedNode: IntelligenceNode;

  if (input.mergeStrategy === 'create_new' || !input.targetNodeId) {
    // Create a new node with merged properties
    const mergedProperties = sourceNodes.reduce(
      (acc, node) => ({
        ...acc,
        ...node.properties_json,
      }),
      {}
    );

    const mergedTags = [...new Set(sourceNodes.flatMap((n) => n.tags || []))];
    const mergedCategories = [...new Set(sourceNodes.flatMap((n) => n.categories || []))];

    const { data: newNode, error } = await ctx.supabase
      .from('intelligence_nodes')
      .insert({
        org_id: ctx.orgId,
        node_type: sourceNodes[0].node_type,
        label: input.newLabel || sourceNodes[0].label,
        description: input.newDescription || sourceNodes[0].description,
        properties_json: mergedProperties,
        tags: mergedTags,
        categories: mergedCategories,
        created_by: ctx.userId,
        updated_by: ctx.userId,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create merged node: ${error.message}`);

    mergedNode = mapDbNode(newNode);
  } else {
    // Update existing target node
    const targetNode = sourceNodes.find((n) => n.id === input.targetNodeId);
    if (!targetNode) {
      throw new Error('Target node not in source nodes list');
    }

    const mergedProperties = sourceNodes.reduce(
      (acc, node) => ({
        ...acc,
        ...node.properties_json,
      }),
      {}
    );

    const { data: updatedNode, error } = await ctx.supabase
      .from('intelligence_nodes')
      .update({
        label: input.newLabel || targetNode.label,
        description: input.newDescription || targetNode.description,
        properties_json: mergedProperties,
        updated_by: ctx.userId,
      })
      .eq('id', input.targetNodeId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update target node: ${error.message}`);

    mergedNode = mapDbNode(updatedNode);
  }

  let edgesPreserved = 0;
  let edgesRemoved = 0;

  if (input.preserveEdges) {
    // Redirect edges to merged node
    const nodesToRemove = input.sourceNodeIds.filter((id) => id !== mergedNode.id);

    for (const nodeId of nodesToRemove) {
      // Update incoming edges
      const { data: incomingUpdated } = await ctx.supabase
        .from('intelligence_edges')
        .update({ target_node_id: mergedNode.id })
        .eq('org_id', ctx.orgId)
        .eq('target_node_id', nodeId)
        .neq('source_node_id', mergedNode.id)
        .select();

      edgesPreserved += incomingUpdated?.length || 0;

      // Update outgoing edges
      const { data: outgoingUpdated } = await ctx.supabase
        .from('intelligence_edges')
        .update({ source_node_id: mergedNode.id })
        .eq('org_id', ctx.orgId)
        .eq('source_node_id', nodeId)
        .neq('target_node_id', mergedNode.id)
        .select();

      edgesPreserved += outgoingUpdated?.length || 0;
    }
  }

  // Delete source nodes (except the merged one)
  const nodesToDelete = input.sourceNodeIds.filter((id) => id !== mergedNode.id);
  if (nodesToDelete.length > 0) {
    // Count edges that will be deleted
    const { count: deletedEdgesCount } = await ctx.supabase
      .from('intelligence_edges')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', ctx.orgId)
      .or(
        nodesToDelete.map((id) => `source_node_id.eq.${id},target_node_id.eq.${id}`).join(',')
      );

    edgesRemoved = deletedEdgesCount || 0;

    await ctx.supabase
      .from('intelligence_nodes')
      .delete()
      .eq('org_id', ctx.orgId)
      .in('id', nodesToDelete);
  }

  await logAuditEvent(ctx, GraphEventType.NODE_MERGED, {
    nodeId: mergedNode.id,
    changes: {
      mergedNodeIds: input.sourceNodeIds,
      strategy: input.mergeStrategy,
    },
  });

  return {
    mergedNode,
    mergedNodeIds: input.sourceNodeIds,
    edgesPreserved,
    edgesRemoved,
  };
}

// ============================================================================
// GRAPH QUERY & TRAVERSAL
// ============================================================================

export async function queryGraph(
  ctx: ServiceContext,
  input: GraphQueryInput
): Promise<GraphQueryResponse> {
  const startTime = Date.now();
  const nodes: IntelligenceNode[] = [];
  const edges: IntelligenceEdge[] = [];
  const paths: GraphPath[] = [];
  const aggregations: Record<string, number> = {};

  // If semantic query, use embedding search
  if (input.semanticQuery) {
    const semanticResults = await semanticSearch(ctx, {
      query: input.semanticQuery,
      nodeTypes: input.nodeTypes,
      threshold: input.semanticThreshold || 0.7,
      limit: input.limit || 100,
    });

    nodes.push(...semanticResults.map((r) => r.node));
  } else if (input.startNodeId) {
    // Traversal query
    const traversalResult = await traverseGraph(ctx, {
      startNodeId: input.startNodeId,
      direction: input.direction || 'both',
      maxDepth: input.maxDepth || 3,
      nodeTypes: input.nodeTypes,
      edgeTypes: input.edgeTypes,
      limit: input.limit || 100,
    });

    nodes.push(...traversalResult.visitedNodes);
    paths.push(...traversalResult.paths);
  } else {
    // Standard query with filters
    let query = ctx.supabase.from('intelligence_nodes').select('*');

    query = query.eq('org_id', ctx.orgId).eq('is_active', true);

    if (input.nodeTypes && input.nodeTypes.length > 0) {
      query = query.in('node_type', input.nodeTypes);
    }

    // Apply custom filters
    if (input.nodeFilters) {
      for (const filter of input.nodeFilters) {
        switch (filter.operator) {
          case 'equals':
            query = query.eq(filter.field, filter.value);
            break;
          case 'not_equals':
            query = query.neq(filter.field, filter.value);
            break;
          case 'contains':
            query = query.ilike(filter.field, `%${filter.value}%`);
            break;
          case 'greater_than':
            query = query.gt(filter.field, filter.value);
            break;
          case 'less_than':
            query = query.lt(filter.field, filter.value);
            break;
          case 'in':
            query = query.in(filter.field, filter.value as unknown[]);
            break;
        }
      }
    }

    query = query.range(input.offset || 0, (input.offset || 0) + (input.limit || 100) - 1);

    const { data } = await query;
    nodes.push(...(data || []).map(mapDbNode));
  }

  // Get edges for the found nodes
  if (nodes.length > 0) {
    const nodeIds = nodes.map((n) => n.id);
    const { data: edgeData } = await ctx.supabase
      .from('intelligence_edges')
      .select('*')
      .eq('org_id', ctx.orgId)
      .eq('is_active', true)
      .or(`source_node_id.in.(${nodeIds.join(',')}),target_node_id.in.(${nodeIds.join(',')})`);

    // Filter edges where both endpoints are in our node set
    const filteredEdges = (edgeData || []).filter(
      (e) => nodeIds.includes(e.source_node_id) && nodeIds.includes(e.target_node_id)
    );

    edges.push(...filteredEdges.map(mapDbEdge));
  }

  // Compute aggregations if requested
  if (input.groupBy) {
    const field = input.groupBy === 'node_type' ? 'nodeType' : input.groupBy;
    for (const node of nodes) {
      const key = String((node as unknown as Record<string, unknown>)[field] || 'unknown');
      aggregations[key] = (aggregations[key] || 0) + 1;
    }
  }

  const executionTimeMs = Date.now() - startTime;

  await logAuditEvent(ctx, GraphEventType.QUERY_EXECUTED, {
    query: input,
    resultCount: nodes.length,
    executionTimeMs,
  });

  return {
    nodes,
    edges,
    paths: paths.length > 0 ? paths : undefined,
    aggregations: Object.keys(aggregations).length > 0 ? aggregations : undefined,
    total: nodes.length,
    executionTimeMs,
  };
}

export async function traverseGraph(
  ctx: ServiceContext,
  input: {
    startNodeId: string;
    direction?: 'outgoing' | 'incoming' | 'both';
    maxDepth?: number;
    nodeTypes?: NodeType[];
    edgeTypes?: EdgeType[];
    limit?: number;
  }
): Promise<TraversalResult> {
  const startTime = Date.now();
  const startNode = await getNode(ctx, input.startNodeId);
  if (!startNode) {
    throw new Error('Start node not found');
  }

  const visited = new Map<string, { node: IntelligenceNode; depth: number; path: string[] }>();
  const queue: Array<{ nodeId: string; depth: number; path: string[] }> = [
    { nodeId: input.startNodeId, depth: 0, path: [input.startNodeId] },
  ];

  visited.set(input.startNodeId, { node: startNode, depth: 0, path: [input.startNodeId] });

  const maxDepth = input.maxDepth || 3;
  const limit = input.limit || 100;
  const direction = input.direction || 'both';

  while (queue.length > 0 && visited.size < limit) {
    const current = queue.shift()!;

    if (current.depth >= maxDepth) continue;

    // Get edges based on direction
    let edgeQuery = ctx.supabase
      .from('intelligence_edges')
      .select('*')
      .eq('org_id', ctx.orgId)
      .eq('is_active', true);

    if (direction === 'outgoing') {
      edgeQuery = edgeQuery.eq('source_node_id', current.nodeId);
    } else if (direction === 'incoming') {
      edgeQuery = edgeQuery.eq('target_node_id', current.nodeId);
    } else {
      edgeQuery = edgeQuery.or(
        `source_node_id.eq.${current.nodeId},target_node_id.eq.${current.nodeId}`
      );
    }

    if (input.edgeTypes && input.edgeTypes.length > 0) {
      edgeQuery = edgeQuery.in('edge_type', input.edgeTypes);
    }

    const { data: edges } = await edgeQuery;

    for (const edge of edges || []) {
      const nextNodeId =
        edge.source_node_id === current.nodeId ? edge.target_node_id : edge.source_node_id;

      if (visited.has(nextNodeId)) continue;

      const { data: nextNodeData } = await ctx.supabase
        .from('intelligence_nodes')
        .select('*')
        .eq('id', nextNodeId)
        .eq('org_id', ctx.orgId)
        .eq('is_active', true)
        .single();

      if (!nextNodeData) continue;

      const nextNode = mapDbNode(nextNodeData);

      if (input.nodeTypes && input.nodeTypes.length > 0) {
        if (!input.nodeTypes.includes(nextNode.nodeType)) continue;
      }

      const newPath = [...current.path, nextNodeId];
      visited.set(nextNodeId, { node: nextNode, depth: current.depth + 1, path: newPath });
      queue.push({ nodeId: nextNodeId, depth: current.depth + 1, path: newPath });
    }
  }

  const visitedNodes = Array.from(visited.values()).map((v) => v.node);
  const paths: GraphPath[] = Array.from(visited.values())
    .filter((v) => v.path.length > 1)
    .map((v) => ({
      startNodeId: input.startNodeId,
      endNodeId: v.node.id,
      path: v.path,
      pathLength: v.path.length - 1,
      totalWeight: 0,
      nodes: [],
      edges: [],
    }));

  const executionTimeMs = Date.now() - startTime;

  await logAuditEvent(ctx, GraphEventType.TRAVERSAL_EXECUTED, {
    nodeId: input.startNodeId,
    resultCount: visitedNodes.length,
    executionTimeMs,
    metadata: { maxDepth, direction },
  });

  return {
    startNode,
    visitedNodes,
    paths,
    depth: maxDepth,
    totalNodesVisited: visitedNodes.length,
  };
}

export async function findShortestPath(
  ctx: ServiceContext,
  startNodeId: string,
  endNodeId: string,
  maxDepth: number = 6
): Promise<GraphPath | null> {
  // BFS for shortest path
  const visited = new Map<string, { prevNodeId: string | null; edge: IntelligenceEdge | null }>();
  const queue: string[] = [startNodeId];
  visited.set(startNodeId, { prevNodeId: null, edge: null });

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const currentDepth = getPathLength(visited, currentId);

    if (currentDepth >= maxDepth) continue;

    if (currentId === endNodeId) {
      // Reconstruct path
      const path: string[] = [];
      const edges: IntelligenceEdge[] = [];
      let nodeId: string | null = endNodeId;

      while (nodeId) {
        path.unshift(nodeId);
        const entry = visited.get(nodeId);
        if (entry?.edge) edges.unshift(entry.edge);
        nodeId = entry?.prevNodeId || null;
      }

      // Get nodes
      const { data: nodesData } = await ctx.supabase
        .from('intelligence_nodes')
        .select('*')
        .eq('org_id', ctx.orgId)
        .in('id', path);

      const nodes = (nodesData || []).map(mapDbNode);
      const totalWeight = edges.reduce((sum, e) => sum + e.weight, 0);

      return {
        startNodeId,
        endNodeId,
        path,
        pathLength: path.length - 1,
        totalWeight,
        nodes,
        edges,
      };
    }

    // Get neighbors
    const { data: edgeData } = await ctx.supabase
      .from('intelligence_edges')
      .select('*')
      .eq('org_id', ctx.orgId)
      .eq('is_active', true)
      .or(`source_node_id.eq.${currentId},target_node_id.eq.${currentId}`);

    for (const edgeRow of edgeData || []) {
      const edge = mapDbEdge(edgeRow);
      const nextId = edge.sourceNodeId === currentId ? edge.targetNodeId : edge.sourceNodeId;

      if (!visited.has(nextId)) {
        visited.set(nextId, { prevNodeId: currentId, edge });
        queue.push(nextId);
      }
    }
  }

  return null;
}

function getPathLength(
  visited: Map<string, { prevNodeId: string | null; edge: IntelligenceEdge | null }>,
  nodeId: string
): number {
  let length = 0;
  let current: string | null = nodeId;

  while (current) {
    const entry = visited.get(current);
    if (!entry?.prevNodeId) break;
    length++;
    current = entry.prevNodeId;
  }

  return length;
}

// ============================================================================
// PATH EXPLANATION (LLM-POWERED)
// ============================================================================

export async function explainPath(
  ctx: ServiceContext,
  input: ExplainPathInput
): Promise<PathExplanation | null> {
  const path = await findShortestPath(ctx, input.startNodeId, input.endNodeId, input.maxDepth);
  if (!path) return null;

  if (!input.includeReasoning) {
    return {
      path,
      explanation: '',
      reasoning: [],
      confidence: 0,
      keyRelationships: [],
    };
  }

  const openai = getOpenAIClient();

  // Build context for LLM
  const pathDescription = path.nodes
    .map((node, i) => {
      const edge = path.edges[i];
      const edgeDesc = edge ? ` --[${edge.edgeType}]--> ` : '';
      return `${node.label} (${node.nodeType})${edgeDesc}`;
    })
    .join('');

  const prompt = `Analyze this knowledge graph path and explain the relationship chain:

Path: ${pathDescription}

Node details:
${path.nodes.map((n) => `- ${n.label}: ${n.description || 'No description'}`).join('\n')}

Edge details:
${path.edges.map((e) => `- ${e.edgeType}: ${e.description || 'No description'}, weight: ${e.weight}`).join('\n')}

Provide:
1. A clear narrative explanation of how these entities are connected
2. Key reasoning steps that explain the relationship chain
3. An assessment of the significance of each relationship
4. A confidence score (0-1) for the overall explanation

Format your response as JSON with the following structure:
{
  "explanation": "narrative explanation",
  "reasoning": ["step 1", "step 2", ...],
  "confidence": 0.85,
  "keyRelationships": [
    {"fromLabel": "A", "toLabel": "B", "relationship": "influences", "significance": "high impact"}
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from LLM');
    }

    const result = JSON.parse(content);

    await logAuditEvent(ctx, GraphEventType.REASONING_EXECUTED, {
      nodeId: input.startNodeId,
      metadata: {
        endNodeId: input.endNodeId,
        pathLength: path.pathLength,
      },
    });

    return {
      path,
      explanation: result.explanation || '',
      reasoning: result.reasoning || [],
      confidence: result.confidence || 0,
      keyRelationships: result.keyRelationships || [],
    };
  } catch (error) {
    console.error('Failed to generate path explanation:', error);
    return {
      path,
      explanation: 'Failed to generate explanation',
      reasoning: [],
      confidence: 0,
      keyRelationships: [],
    };
  }
}

// ============================================================================
// EMBEDDINGS
// ============================================================================

export async function generateEmbeddings(
  ctx: ServiceContext,
  input: GenerateEmbeddingsInput
): Promise<GenerateEmbeddingsResponse> {
  const openai = getOpenAIClient();
  let nodeEmbeddingsGenerated = 0;
  let edgeEmbeddingsGenerated = 0;
  const errors: Array<{ id: string; error: string }> = [];

  const provider = input.provider || EmbeddingProvider.OPENAI_3_SMALL;
  const model =
    provider === EmbeddingProvider.OPENAI_ADA_002
      ? 'text-embedding-ada-002'
      : 'text-embedding-3-small';

  // Generate node embeddings
  if (input.nodeIds && input.nodeIds.length > 0) {
    const { data: nodes } = await ctx.supabase
      .from('intelligence_nodes')
      .select('*')
      .eq('org_id', ctx.orgId)
      .in('id', input.nodeIds);

    for (const node of nodes || []) {
      try {
        const contextText = `${node.label}. ${node.description || ''} Tags: ${(node.tags || []).join(', ')}`;
        const contextHash = crypto.createHash('sha256').update(contextText).digest('hex');

        // Check if embedding exists and is current
        if (!input.forceRegenerate) {
          const { data: existing } = await ctx.supabase
            .from('intelligence_node_embeddings')
            .select('id')
            .eq('node_id', node.id)
            .eq('context_hash', contextHash)
            .eq('is_current', true)
            .single();

          if (existing) continue;
        }

        // Generate embedding
        const response = await openai.embeddings.create({
          model,
          input: contextText,
        });

        const embedding = response.data[0]?.embedding;
        if (!embedding) continue;

        // Mark old embeddings as not current
        await ctx.supabase
          .from('intelligence_node_embeddings')
          .update({ is_current: false })
          .eq('node_id', node.id);

        // Insert new embedding
        await ctx.supabase.from('intelligence_node_embeddings').insert({
          org_id: ctx.orgId,
          node_id: node.id,
          provider,
          model_version: model,
          embedding_vector: `[${embedding.join(',')}]`,
          dimensions: embedding.length,
          context_text: contextText,
          context_hash: contextHash,
          is_current: true,
        });

        nodeEmbeddingsGenerated++;
      } catch (error) {
        errors.push({ id: node.id, error: String(error) });
      }
    }
  }

  // Generate edge embeddings
  if (input.edgeIds && input.edgeIds.length > 0) {
    const { data: edges } = await ctx.supabase
      .from('intelligence_edges')
      .select('*')
      .eq('org_id', ctx.orgId)
      .in('id', input.edgeIds);

    for (const edge of edges || []) {
      try {
        const contextText = `Relationship: ${edge.edge_type}. ${edge.label || ''} ${edge.description || ''}`;
        const contextHash = crypto.createHash('sha256').update(contextText).digest('hex');

        if (!input.forceRegenerate) {
          const { data: existing } = await ctx.supabase
            .from('intelligence_edge_embeddings')
            .select('id')
            .eq('edge_id', edge.id)
            .eq('context_hash', contextHash)
            .eq('is_current', true)
            .single();

          if (existing) continue;
        }

        const response = await openai.embeddings.create({
          model,
          input: contextText,
        });

        const embedding = response.data[0]?.embedding;
        if (!embedding) continue;

        await ctx.supabase
          .from('intelligence_edge_embeddings')
          .update({ is_current: false })
          .eq('edge_id', edge.id);

        await ctx.supabase.from('intelligence_edge_embeddings').insert({
          org_id: ctx.orgId,
          edge_id: edge.id,
          provider,
          model_version: model,
          embedding_vector: `[${embedding.join(',')}]`,
          dimensions: embedding.length,
          context_text: contextText,
          context_hash: contextHash,
          is_current: true,
        });

        edgeEmbeddingsGenerated++;
      } catch (error) {
        errors.push({ id: edge.id, error: String(error) });
      }
    }
  }

  if (nodeEmbeddingsGenerated > 0 || edgeEmbeddingsGenerated > 0) {
    await logAuditEvent(ctx, GraphEventType.EMBEDDING_GENERATED, {
      metadata: {
        nodeEmbeddingsGenerated,
        edgeEmbeddingsGenerated,
      },
    });
  }

  return {
    nodeEmbeddingsGenerated,
    edgeEmbeddingsGenerated,
    errors,
  };
}

export async function semanticSearch(
  ctx: ServiceContext,
  input: {
    query: string;
    nodeTypes?: NodeType[];
    threshold?: number;
    limit?: number;
  }
): Promise<SemanticSearchResult[]> {
  const openai = getOpenAIClient();

  // Generate query embedding
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: input.query,
  });

  const queryEmbedding = response.data[0]?.embedding;
  if (!queryEmbedding) {
    throw new Error('Failed to generate query embedding');
  }

  // Search using cosine similarity (using pgvector)
  const { data: results } = await ctx.supabase.rpc('search_nodes_by_embedding', {
    query_embedding: `[${queryEmbedding.join(',')}]`,
    match_threshold: input.threshold || 0.7,
    match_count: input.limit || 20,
    p_org_id: ctx.orgId,
    p_node_types: input.nodeTypes || null,
  });

  if (!results) return [];

  // Fetch full node data
  const nodeIds = results.map((r: { node_id: string }) => r.node_id);
  const { data: nodes } = await ctx.supabase
    .from('intelligence_nodes')
    .select('*')
    .in('id', nodeIds);

  const nodeMap = new Map((nodes || []).map((n) => [n.id, mapDbNode(n)]));

  return results
    .map((r: { node_id: string; similarity: number; context_text: string }) => {
      const node = nodeMap.get(r.node_id);
      if (!node) return null;
      return {
        node,
        similarity: r.similarity,
        matchedContext: r.context_text,
      };
    })
    .filter(Boolean) as SemanticSearchResult[];
}

// ============================================================================
// METRICS & ANALYTICS
// ============================================================================

export async function computeMetrics(
  ctx: ServiceContext,
  input: ComputeMetricsInput
): Promise<ComputeMetricsResponse> {
  const startTime = Date.now();

  // Get all active nodes and edges
  let nodeQuery = ctx.supabase
    .from('intelligence_nodes')
    .select('*')
    .eq('org_id', ctx.orgId)
    .eq('is_active', true);

  let edgeQuery = ctx.supabase
    .from('intelligence_edges')
    .select('*')
    .eq('org_id', ctx.orgId)
    .eq('is_active', true);

  if (input.nodeTypes && input.nodeTypes.length > 0) {
    nodeQuery = nodeQuery.in('node_type', input.nodeTypes);
  }

  if (input.edgeTypes && input.edgeTypes.length > 0) {
    edgeQuery = edgeQuery.in('edge_type', input.edgeTypes);
  }

  const [{ data: nodes }, { data: edges }] = await Promise.all([nodeQuery, edgeQuery]);

  const nodeList = (nodes || []).map(mapDbNode);
  const edgeList = (edges || []).map(mapDbEdge);

  // Build adjacency lists
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();

  for (const edge of edgeList) {
    if (!outgoing.has(edge.sourceNodeId)) outgoing.set(edge.sourceNodeId, []);
    outgoing.get(edge.sourceNodeId)!.push(edge.targetNodeId);

    if (!incoming.has(edge.targetNodeId)) incoming.set(edge.targetNodeId, []);
    incoming.get(edge.targetNodeId)!.push(edge.sourceNodeId);
  }

  let nodesUpdated = 0;

  if (input.computeCentrality) {
    // Compute degree centrality
    const maxDegree = Math.max(
      ...nodeList.map(
        (n) => (outgoing.get(n.id)?.length || 0) + (incoming.get(n.id)?.length || 0)
      ),
      1
    );

    for (const node of nodeList) {
      const degree = (outgoing.get(node.id)?.length || 0) + (incoming.get(node.id)?.length || 0);
      const degreeCentrality = degree / maxDegree;

      // Simplified PageRank (just using degree for now)
      const pagerankScore = degreeCentrality;

      await ctx.supabase
        .from('intelligence_nodes')
        .update({
          degree_centrality: degreeCentrality,
          pagerank_score: pagerankScore,
        })
        .eq('id', node.id);

      nodesUpdated++;
    }
  }

  let clustersIdentified = 0;
  let communitiesDetected = 0;

  if (input.computeClusters) {
    // Simple clustering based on connectivity
    const visited = new Set<string>();
    let clusterNum = 0;

    for (const node of nodeList) {
      if (visited.has(node.id)) continue;

      clusterNum++;
      const clusterId = crypto.randomUUID();
      const clusterNodes: string[] = [];

      // BFS to find connected component
      const queue = [node.id];
      while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;

        visited.add(current);
        clusterNodes.push(current);

        const neighbors = [
          ...(outgoing.get(current) || []),
          ...(incoming.get(current) || []),
        ];

        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            queue.push(neighbor);
          }
        }
      }

      // Update cluster assignment
      await ctx.supabase
        .from('intelligence_nodes')
        .update({ cluster_id: clusterId })
        .in('id', clusterNodes);

      clustersIdentified++;
    }
  }

  // Compute aggregate metrics
  const nodesByType: Record<string, number> = {};
  const edgesByType: Record<string, number> = {};

  for (const node of nodeList) {
    nodesByType[node.nodeType] = (nodesByType[node.nodeType] || 0) + 1;
  }

  for (const edge of edgeList) {
    edgesByType[edge.edgeType] = (edgesByType[edge.edgeType] || 0) + 1;
  }

  const density =
    nodeList.length > 1 ? edgeList.length / (nodeList.length * (nodeList.length - 1)) : 0;
  const avgDegree = nodeList.length > 0 ? (edgeList.length * 2) / nodeList.length : 0;

  const metrics: GraphMetrics = {
    totalNodes: nodeList.length,
    activeNodes: nodeList.length,
    nodesByType,
    totalEdges: edgeList.length,
    activeEdges: edgeList.length,
    edgesByType,
    density,
    avgDegree,
    clusterCount: clustersIdentified,
    communityCount: communitiesDetected,
    computedAt: new Date().toISOString(),
  };

  const executionTimeMs = Date.now() - startTime;

  await logAuditEvent(ctx, GraphEventType.METRICS_COMPUTED, {
    metadata: {
      nodesUpdated,
      clustersIdentified,
      communitiesDetected,
      executionTimeMs,
    },
  });

  return {
    metrics,
    nodesUpdated,
    clustersIdentified,
    communitiesDetected,
    executionTimeMs,
  };
}

export async function getMetrics(ctx: ServiceContext): Promise<GraphMetrics> {
  // Get counts
  const [
    { count: totalNodes },
    { count: activeNodes },
    { count: totalEdges },
    { count: activeEdges },
  ] = await Promise.all([
    ctx.supabase
      .from('intelligence_nodes')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', ctx.orgId),
    ctx.supabase
      .from('intelligence_nodes')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', ctx.orgId)
      .eq('is_active', true),
    ctx.supabase
      .from('intelligence_edges')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', ctx.orgId),
    ctx.supabase
      .from('intelligence_edges')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', ctx.orgId)
      .eq('is_active', true),
  ]);

  // Get distribution by type
  const { data: nodeTypeData } = await ctx.supabase
    .from('intelligence_nodes')
    .select('node_type')
    .eq('org_id', ctx.orgId);

  const { data: edgeTypeData } = await ctx.supabase
    .from('intelligence_edges')
    .select('edge_type')
    .eq('org_id', ctx.orgId);

  const nodesByType: Record<string, number> = {};
  const edgesByType: Record<string, number> = {};

  for (const row of nodeTypeData || []) {
    nodesByType[row.node_type] = (nodesByType[row.node_type] || 0) + 1;
  }

  for (const row of edgeTypeData || []) {
    edgesByType[row.edge_type] = (edgesByType[row.edge_type] || 0) + 1;
  }

  // Get top nodes by centrality
  const { data: topByDegree } = await ctx.supabase
    .from('intelligence_nodes')
    .select('id, label, degree_centrality')
    .eq('org_id', ctx.orgId)
    .eq('is_active', true)
    .not('degree_centrality', 'is', null)
    .order('degree_centrality', { ascending: false })
    .limit(10);

  const { data: topByPagerank } = await ctx.supabase
    .from('intelligence_nodes')
    .select('id, label, pagerank_score')
    .eq('org_id', ctx.orgId)
    .eq('is_active', true)
    .not('pagerank_score', 'is', null)
    .order('pagerank_score', { ascending: false })
    .limit(10);

  // Count clusters
  const { data: clusterData } = await ctx.supabase
    .from('intelligence_nodes')
    .select('cluster_id')
    .eq('org_id', ctx.orgId)
    .not('cluster_id', 'is', null);

  const uniqueClusters = new Set((clusterData || []).map((r) => r.cluster_id));

  return {
    totalNodes: totalNodes || 0,
    activeNodes: activeNodes || 0,
    nodesByType,
    totalEdges: totalEdges || 0,
    activeEdges: activeEdges || 0,
    edgesByType,
    clusterCount: uniqueClusters.size,
    topNodesByDegree: (topByDegree || []).map((n) => ({
      nodeId: n.id,
      label: n.label,
      degree: n.degree_centrality,
    })),
    topNodesByPagerank: (topByPagerank || []).map((n) => ({
      nodeId: n.id,
      label: n.label,
      pagerank: n.pagerank_score,
    })),
    computedAt: new Date().toISOString(),
  };
}

// ============================================================================
// SNAPSHOTS
// ============================================================================

export async function createSnapshot(
  ctx: ServiceContext,
  input: GenerateSnapshotInput
): Promise<IntelligenceGraphSnapshot> {
  // Create pending snapshot
  const { data: snapshot, error } = await ctx.supabase
    .from('intelligence_graph_snapshots')
    .insert({
      org_id: ctx.orgId,
      name: input.name,
      description: input.description,
      snapshot_type: input.snapshotType || 'full',
      status: 'pending',
      created_by: ctx.userId,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create snapshot: ${error.message}`);

  // Start generation in background
  generateSnapshotAsync(ctx, snapshot.id, input).catch(console.error);

  return mapDbSnapshot(snapshot);
}

async function generateSnapshotAsync(
  ctx: ServiceContext,
  snapshotId: string,
  input: GenerateSnapshotInput
): Promise<void> {
  try {
    // Update status to generating
    await ctx.supabase
      .from('intelligence_graph_snapshots')
      .update({
        status: 'generating',
        started_at: new Date().toISOString(),
      })
      .eq('id', snapshotId);

    // Fetch graph data
    let nodeQuery = ctx.supabase
      .from('intelligence_nodes')
      .select('*')
      .eq('org_id', ctx.orgId)
      .eq('is_active', true);

    if (input.nodeTypes && input.nodeTypes.length > 0) {
      nodeQuery = nodeQuery.in('node_type', input.nodeTypes);
    }

    const { data: nodes } = await nodeQuery;
    const nodeList = (nodes || []).map(mapDbNode);

    const { data: edges } = await ctx.supabase
      .from('intelligence_edges')
      .select('*')
      .eq('org_id', ctx.orgId)
      .eq('is_active', true);

    const edgeList = (edges || []).map(mapDbEdge);

    // Compute metrics
    const metrics = await getMetrics(ctx);

    // Compute diff if requested
    let diffJson: SnapshotDiff | null = null;
    if (input.computeDiff) {
      const { data: prevSnapshot } = await ctx.supabase
        .from('intelligence_graph_snapshots')
        .select('*')
        .eq('org_id', ctx.orgId)
        .eq('status', 'complete')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (prevSnapshot) {
        const prevNodes = new Set<string>((prevSnapshot.nodes_json || []).map((n: { id: string }) => n.id));
        const currentNodes = new Set<string>(nodeList.map((n) => n.id));
        const prevEdges = new Set<string>((prevSnapshot.edges_json || []).map((e: { id: string }) => e.id));
        const currentEdges = new Set<string>(edgeList.map((e) => e.id));

        diffJson = {
          nodesAdded: [...currentNodes].filter((id) => !prevNodes.has(id)).length,
          nodesRemoved: [...prevNodes].filter((id) => !currentNodes.has(id)).length,
          nodesModified: 0,
          edgesAdded: [...currentEdges].filter((id) => !prevEdges.has(id)).length,
          edgesRemoved: [...prevEdges].filter((id) => !currentEdges.has(id)).length,
          edgesModified: 0,
          metricsChanges: {},
          addedNodeIds: [...currentNodes].filter((id) => !prevNodes.has(id)),
          removedNodeIds: [...prevNodes].filter((id) => !currentNodes.has(id)),
          addedEdgeIds: [...currentEdges].filter((id) => !prevEdges.has(id)),
          removedEdgeIds: [...prevEdges].filter((id) => !currentEdges.has(id)),
        };

        await ctx.supabase
          .from('intelligence_graph_snapshots')
          .update({ previous_snapshot_id: prevSnapshot.id })
          .eq('id', snapshotId);
      }
    }

    // Update snapshot with data
    await ctx.supabase
      .from('intelligence_graph_snapshots')
      .update({
        status: 'complete',
        completed_at: new Date().toISOString(),
        node_count: nodeList.length,
        edge_count: edgeList.length,
        metrics_json: metrics,
        nodes_json: input.includeNodes !== false ? nodeList : null,
        edges_json: input.includeEdges !== false ? edgeList : null,
        diff_json: diffJson,
      })
      .eq('id', snapshotId);

    await logAuditEvent(ctx, GraphEventType.SNAPSHOT_CREATED, {
      snapshotId,
      metadata: {
        nodeCount: nodeList.length,
        edgeCount: edgeList.length,
      },
    });
  } catch (error) {
    await ctx.supabase
      .from('intelligence_graph_snapshots')
      .update({
        status: 'failed',
        error_message: String(error),
      })
      .eq('id', snapshotId);
  }
}

export async function getSnapshot(
  ctx: ServiceContext,
  snapshotId: string
): Promise<IntelligenceGraphSnapshot | null> {
  const { data, error } = await ctx.supabase
    .from('intelligence_graph_snapshots')
    .select('*')
    .eq('id', snapshotId)
    .eq('org_id', ctx.orgId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to get snapshot: ${error.message}`);
  }

  return mapDbSnapshot(data);
}

export async function listSnapshots(
  ctx: ServiceContext,
  input: { limit?: number; offset?: number; status?: GraphSnapshotStatus }
): Promise<ListSnapshotsResponse> {
  let query = ctx.supabase
    .from('intelligence_graph_snapshots')
    .select('*', { count: 'exact' })
    .eq('org_id', ctx.orgId);

  if (input.status) {
    query = query.eq('status', input.status);
  }

  query = query
    .order('created_at', { ascending: false })
    .range(input.offset || 0, (input.offset || 0) + (input.limit || 20) - 1);

  const { data, error, count } = await query;

  if (error) throw new Error(`Failed to list snapshots: ${error.message}`);

  return {
    snapshots: (data || []).map(mapDbSnapshot),
    total: count || 0,
    limit: input.limit || 20,
    offset: input.offset || 0,
  };
}

export async function regenerateSnapshot(
  ctx: ServiceContext,
  snapshotId: string
): Promise<IntelligenceGraphSnapshot> {
  const snapshot = await getSnapshot(ctx, snapshotId);
  if (!snapshot) throw new Error('Snapshot not found');

  // Reset to pending and regenerate
  await ctx.supabase
    .from('intelligence_graph_snapshots')
    .update({
      status: 'pending',
      error_message: null,
    })
    .eq('id', snapshotId);

  generateSnapshotAsync(ctx, snapshotId, {
    name: snapshot.name,
    description: snapshot.description || undefined,
    snapshotType: snapshot.snapshotType as 'full' | 'incremental' | 'metrics_only',
    computeDiff: true,
  }).catch(console.error);

  await logAuditEvent(ctx, GraphEventType.SNAPSHOT_REGENERATED, {
    snapshotId,
  });

  return { ...snapshot, status: GraphSnapshotStatus.PENDING };
}

// ============================================================================
// AUDIT LOGS
// ============================================================================

export async function listAuditLogs(
  ctx: ServiceContext,
  input: {
    limit?: number;
    offset?: number;
    eventType?: GraphEventType;
    nodeId?: string;
    edgeId?: string;
  }
): Promise<ListAuditLogsResponse> {
  let query = ctx.supabase
    .from('intelligence_graph_audit_log')
    .select('*', { count: 'exact' })
    .eq('org_id', ctx.orgId);

  if (input.eventType) {
    query = query.eq('event_type', input.eventType);
  }
  if (input.nodeId) {
    query = query.eq('node_id', input.nodeId);
  }
  if (input.edgeId) {
    query = query.eq('edge_id', input.edgeId);
  }

  query = query
    .order('created_at', { ascending: false })
    .range(input.offset || 0, (input.offset || 0) + (input.limit || 50) - 1);

  const { data, error, count } = await query;

  if (error) throw new Error(`Failed to list audit logs: ${error.message}`);

  return {
    logs: (data || []).map(mapDbAuditLog),
    total: count || 0,
    limit: input.limit || 50,
    offset: input.offset || 0,
  };
}

// ============================================================================
// STATISTICS
// ============================================================================

export async function getStats(ctx: ServiceContext): Promise<GraphStats> {
  const [
    { count: totalNodes },
    { count: totalEdges },
    { count: activeNodes },
    { count: activeEdges },
    { data: recentNodes },
    { data: recentSnapshots },
  ] = await Promise.all([
    ctx.supabase
      .from('intelligence_nodes')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', ctx.orgId),
    ctx.supabase
      .from('intelligence_edges')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', ctx.orgId),
    ctx.supabase
      .from('intelligence_nodes')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', ctx.orgId)
      .eq('is_active', true),
    ctx.supabase
      .from('intelligence_edges')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', ctx.orgId)
      .eq('is_active', true),
    ctx.supabase
      .from('intelligence_nodes')
      .select('*')
      .eq('org_id', ctx.orgId)
      .order('created_at', { ascending: false })
      .limit(5),
    ctx.supabase
      .from('intelligence_graph_snapshots')
      .select('*')
      .eq('org_id', ctx.orgId)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  // Get distribution
  const { data: nodeTypeData } = await ctx.supabase
    .from('intelligence_nodes')
    .select('node_type')
    .eq('org_id', ctx.orgId);

  const { data: edgeTypeData } = await ctx.supabase
    .from('intelligence_edges')
    .select('edge_type')
    .eq('org_id', ctx.orgId);

  const nodesByType: Record<string, number> = {};
  const edgesByType: Record<string, number> = {};

  for (const row of nodeTypeData || []) {
    nodesByType[row.node_type] = (nodesByType[row.node_type] || 0) + 1;
  }

  for (const row of edgeTypeData || []) {
    edgesByType[row.edge_type] = (edgesByType[row.edge_type] || 0) + 1;
  }

  return {
    totalNodes: totalNodes || 0,
    totalEdges: totalEdges || 0,
    activeNodes: activeNodes || 0,
    activeEdges: activeEdges || 0,
    nodesByType,
    edgesByType,
    recentNodes: (recentNodes || []).map(mapDbNode),
    recentSnapshots: (recentSnapshots || []).map(mapDbSnapshot),
  };
}
