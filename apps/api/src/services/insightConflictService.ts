/**
 * Insight Conflict Resolution Service (Sprint S74)
 * Autonomous Insight Conflict Resolution Engine V1
 */

import { getSupabaseClient } from '../lib/supabase';
import { routeLLM } from '@pravado/utils';
import type {
  InsightConflict,
  InsightConflictItem,
  InsightConflictResolution,
  InsightConflictAuditLog,
  InsightConflictCluster,
  InsightConflictGraphEdge,
  ConflictType,
  ConflictSeverity,
  ConflictStatus,
  ConflictResolutionType,
  ConflictEdgeType,
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
  ListConflictsResponse,
  GetConflictResponse,
  CreateConflictResponse,
  UpdateConflictResponse,
  AnalyzeConflictResponse,
  ResolveConflictResponse,
  GetConflictGraphResponse,
  ListConflictItemsResponse,
  ListResolutionsResponse,
  ListAuditLogResponse,
  ListClustersResponse,
  GetConflictStatsResponse,
  ConflictAnalysisResult,
  ConflictGraphData,
  ConflictGraphNode,
  ConflictGraphEdge,
  ConflictStats,
  RelatedConflict,
  AffectedSystemAnalysis,
  VectorSimilarity,
  RootCauseAnalysisResult,
  RecommendedAction,
  SourceWeight,
  ConflictSourceEntity,
  DetectionConfig,
  RunDetectionInput,
  RunDetectionResponse,
  BatchAnalyzeInput,
  BatchAnalyzeResponse,
  BatchResolveInput,
  BatchResolveResponse,
  BatchDismissInput,
  BatchDismissResponse,
} from '@pravado/types';

// ============================================================================
// INTERNAL TYPES
// ============================================================================

interface DbConflict {
  id: string;
  org_id: string;
  conflict_type: ConflictType;
  severity: ConflictSeverity;
  status: ConflictStatus;
  title: string;
  conflict_summary: string | null;
  source_entities: ConflictSourceEntity[];
  affected_systems: string[];
  analysis_started_at: string | null;
  analysis_completed_at: string | null;
  analysis_result: ConflictAnalysisResult | null;
  resolved_at: string | null;
  resolved_by: string | null;
  conflict_graph: ConflictGraphData | null;
  cluster_id: string | null;
  cluster_similarity: number | null;
  root_cause_analysis: RootCauseAnalysisResult | null;
  linked_reality_map_id: string | null;
  linked_node_ids: string[] | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

interface DbConflictItem {
  id: string;
  conflict_id: string;
  entity_type: string;
  entity_id: string;
  raw_insight: string;
  processed_insight: string | null;
  vector: number[] | null;
  source_system: string;
  source_timestamp: string | null;
  confidence_score: number | null;
  item_role: string | null;
  created_at: string;
}

interface DbResolution {
  id: string;
  conflict_id: string;
  resolution_type: ConflictResolutionType;
  resolved_summary: string;
  consensus_narrative: string | null;
  recommended_actions: RecommendedAction[];
  resolution_confidence: number | null;
  resolution_rationale: string | null;
  source_weights: SourceWeight[] | null;
  priority_order: string[] | null;
  ai_model_used: string | null;
  ai_prompt_tokens: number | null;
  ai_completion_tokens: number | null;
  human_reviewed: boolean;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  is_accepted: boolean;
  accepted_at: string | null;
  accepted_by: string | null;
  created_at: string;
}

interface DbAuditLog {
  id: string;
  conflict_id: string;
  event_type: string;
  actor_id: string | null;
  actor_type: string;
  event_details: Record<string, unknown>;
  previous_state: Record<string, unknown> | null;
  new_state: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface DbCluster {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  primary_conflict_type: ConflictType | null;
  average_severity: ConflictSeverity | null;
  conflict_count: number;
  centroid_vector: number[] | null;
  is_auto_generated: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface DbGraphEdge {
  id: string;
  org_id: string;
  source_conflict_id: string;
  target_conflict_id: string;
  edge_type: ConflictEdgeType;
  edge_weight: number;
  edge_label: string | null;
  edge_metadata: Record<string, unknown> | null;
  created_at: string;
}

// ============================================================================
// MAPPERS
// ============================================================================

function mapDbConflict(db: DbConflict): InsightConflict {
  return {
    id: db.id,
    orgId: db.org_id,
    conflictType: db.conflict_type,
    severity: db.severity,
    status: db.status,
    title: db.title,
    conflictSummary: db.conflict_summary,
    sourceEntities: db.source_entities || [],
    affectedSystems: db.affected_systems || [],
    analysisStartedAt: db.analysis_started_at,
    analysisCompletedAt: db.analysis_completed_at,
    analysisResult: db.analysis_result,
    resolvedAt: db.resolved_at,
    resolvedBy: db.resolved_by,
    conflictGraph: db.conflict_graph,
    clusterId: db.cluster_id,
    clusterSimilarity: db.cluster_similarity,
    rootCauseAnalysis: db.root_cause_analysis,
    linkedRealityMapId: db.linked_reality_map_id,
    linkedNodeIds: db.linked_node_ids,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
    createdBy: db.created_by,
  };
}

function mapDbItem(db: DbConflictItem): InsightConflictItem {
  return {
    id: db.id,
    conflictId: db.conflict_id,
    entityType: db.entity_type,
    entityId: db.entity_id,
    rawInsight: db.raw_insight,
    processedInsight: db.processed_insight,
    vector: db.vector,
    sourceSystem: db.source_system,
    sourceTimestamp: db.source_timestamp,
    confidenceScore: db.confidence_score,
    itemRole: db.item_role as InsightConflictItem['itemRole'],
    createdAt: db.created_at,
  };
}

function mapDbResolution(db: DbResolution): InsightConflictResolution {
  return {
    id: db.id,
    conflictId: db.conflict_id,
    resolutionType: db.resolution_type,
    resolvedSummary: db.resolved_summary,
    consensusNarrative: db.consensus_narrative,
    recommendedActions: db.recommended_actions || [],
    resolutionConfidence: db.resolution_confidence,
    resolutionRationale: db.resolution_rationale,
    sourceWeights: db.source_weights,
    priorityOrder: db.priority_order,
    aiModelUsed: db.ai_model_used,
    aiPromptTokens: db.ai_prompt_tokens,
    aiCompletionTokens: db.ai_completion_tokens,
    humanReviewed: db.human_reviewed,
    reviewedBy: db.reviewed_by,
    reviewedAt: db.reviewed_at,
    reviewNotes: db.review_notes,
    isAccepted: db.is_accepted,
    acceptedAt: db.accepted_at,
    acceptedBy: db.accepted_by,
    createdAt: db.created_at,
  };
}

function mapDbAuditLog(db: DbAuditLog): InsightConflictAuditLog {
  return {
    id: db.id,
    conflictId: db.conflict_id,
    eventType: db.event_type,
    actorId: db.actor_id,
    actorType: db.actor_type as InsightConflictAuditLog['actorType'],
    eventDetails: db.event_details,
    previousState: db.previous_state,
    newState: db.new_state,
    ipAddress: db.ip_address,
    userAgent: db.user_agent,
    createdAt: db.created_at,
  };
}

function mapDbCluster(db: DbCluster): InsightConflictCluster {
  return {
    id: db.id,
    orgId: db.org_id,
    name: db.name,
    description: db.description,
    primaryConflictType: db.primary_conflict_type,
    averageSeverity: db.average_severity,
    conflictCount: db.conflict_count,
    centroidVector: db.centroid_vector,
    isAutoGenerated: db.is_auto_generated,
    isActive: db.is_active,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

function mapDbGraphEdge(db: DbGraphEdge): InsightConflictGraphEdge {
  return {
    id: db.id,
    orgId: db.org_id,
    sourceConflictId: db.source_conflict_id,
    targetConflictId: db.target_conflict_id,
    edgeType: db.edge_type,
    edgeWeight: db.edge_weight,
    edgeLabel: db.edge_label,
    edgeMetadata: db.edge_metadata,
    createdAt: db.created_at,
  };
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

async function logAuditEvent(
  conflictId: string,
  eventType: string,
  actorId: string | null,
  actorType: 'user' | 'system' | 'ai',
  eventDetails: Record<string, unknown>,
  previousState?: Record<string, unknown> | null,
  newState?: Record<string, unknown> | null
): Promise<void> {
  const supabase = getSupabaseClient();

  await supabase.from('insight_conflict_audit_log').insert({
    conflict_id: conflictId,
    event_type: eventType,
    actor_id: actorId,
    actor_type: actorType,
    event_details: eventDetails,
    previous_state: previousState || null,
    new_state: newState || null,
  });
}

// ============================================================================
// DETECTION ENGINE
// ============================================================================

/**
 * Detect contradictions across systems
 */
export async function detectContradictions(
  orgId: string,
  _config?: DetectionConfig
): Promise<InsightConflict[]> {
  const supabase = getSupabaseClient();
  const detected: InsightConflict[] = [];

  // Query recent insights from multiple systems
  // This is a simplified implementation - in production, this would query
  // actual insight tables from various systems (S66, S70, S73, etc.)

  // For now, we simulate by checking for existing patterns
  const { data: _existingConflicts } = await supabase
    .from('insight_conflicts')
    .select('*')
    .eq('org_id', orgId)
    .eq('conflict_type', 'contradiction')
    .eq('status', 'detected')
    .limit(10);

  // In a real implementation, we would:
  // 1. Query unified intelligence graph (S66)
  // 2. Compare narrative outputs (S70)
  // 3. Analyze reality map nodes (S73)
  // 4. Use vector similarity to find contradictions

  return detected;
}

/**
 * Detect ambiguities in insights
 */
export async function detectAmbiguities(
  _orgId: string,
  _config?: DetectionConfig
): Promise<InsightConflict[]> {
  const detected: InsightConflict[] = [];

  // Detect ambiguous statements that have multiple interpretations
  // This would use NLP to identify hedging language, uncertain phrases, etc.

  return detected;
}

/**
 * Detect divergences (different conclusions from same data)
 */
export async function detectDivergences(
  _orgId: string,
  _config?: DetectionConfig
): Promise<InsightConflict[]> {
  const detected: InsightConflict[] = [];

  // Compare conclusions drawn from the same underlying data
  // across different systems

  return detected;
}

/**
 * Detect missing data gaps
 */
export async function detectMissingData(
  _orgId: string,
  _config?: DetectionConfig
): Promise<InsightConflict[]> {
  const detected: InsightConflict[] = [];

  // Identify where data is expected but missing
  // This would analyze data completeness across systems

  return detected;
}

/**
 * Detect logical inconsistencies
 */
export async function detectInconsistencies(
  _orgId: string,
  _config?: DetectionConfig
): Promise<InsightConflict[]> {
  const detected: InsightConflict[] = [];

  // Find logical inconsistencies in data or conclusions
  // This would use rule-based and ML-based consistency checks

  return detected;
}

/**
 * Run full detection across all types
 */
export async function runDetection(
  orgId: string,
  _userId: string,
  input?: RunDetectionInput
): Promise<RunDetectionResponse> {
  const startTime = Date.now();
  const config = input?.config || {};
  const allConflicts: InsightConflict[] = [];
  const errors: { source: string; error: string; timestamp: string }[] = [];

  try {
    if (config.enableContradictionDetection !== false) {
      const contradictions = await detectContradictions(orgId, config);
      allConflicts.push(...contradictions);
    }
  } catch (err) {
    errors.push({
      source: 'contradiction_detection',
      error: err instanceof Error ? err.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    if (config.enableAmbiguityDetection !== false) {
      const ambiguities = await detectAmbiguities(orgId, config);
      allConflicts.push(...ambiguities);
    }
  } catch (err) {
    errors.push({
      source: 'ambiguity_detection',
      error: err instanceof Error ? err.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    if (config.enableDivergenceDetection !== false) {
      const divergences = await detectDivergences(orgId, config);
      allConflicts.push(...divergences);
    }
  } catch (err) {
    errors.push({
      source: 'divergence_detection',
      error: err instanceof Error ? err.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    if (config.enableMissingDataDetection !== false) {
      const missingData = await detectMissingData(orgId, config);
      allConflicts.push(...missingData);
    }
  } catch (err) {
    errors.push({
      source: 'missing_data_detection',
      error: err instanceof Error ? err.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    if (config.enableInconsistencyDetection !== false) {
      const inconsistencies = await detectInconsistencies(orgId, config);
      allConflicts.push(...inconsistencies);
    }
  } catch (err) {
    errors.push({
      source: 'inconsistency_detection',
      error: err instanceof Error ? err.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }

  const processingTime = Date.now() - startTime;

  return {
    result: {
      conflictsDetected: allConflicts.length,
      conflicts: allConflicts,
      processingTime,
      sourcesScanned: input?.targetSystems?.length || 5,
      errors,
    },
  };
}

// ============================================================================
// ANALYSIS ENGINE
// ============================================================================

/**
 * Compute severity for a conflict
 */
export async function computeConflictSeverity(
  conflict: InsightConflict,
  items: InsightConflictItem[]
): Promise<{ score: number; severity: ConflictSeverity; rationale: string }> {
  // Factors that influence severity:
  // 1. Number of conflicting items
  // 2. Confidence scores of items
  // 3. Number of affected systems
  // 4. Type of conflict
  // 5. Historical resolution difficulty

  let score = 0;
  const factors: string[] = [];

  // Item count factor
  const itemCount = items.length;
  if (itemCount >= 5) {
    score += 30;
    factors.push(`${itemCount} conflicting items (high impact)`);
  } else if (itemCount >= 3) {
    score += 20;
    factors.push(`${itemCount} conflicting items (moderate impact)`);
  } else {
    score += 10;
    factors.push(`${itemCount} conflicting items (low impact)`);
  }

  // Affected systems factor
  const systemCount = conflict.affectedSystems.length;
  if (systemCount >= 4) {
    score += 25;
    factors.push(`${systemCount} affected systems (critical)`);
  } else if (systemCount >= 2) {
    score += 15;
    factors.push(`${systemCount} affected systems (moderate)`);
  } else {
    score += 5;
    factors.push(`${systemCount} affected system (low)`);
  }

  // Conflict type factor
  const typeScores: Record<ConflictType, number> = {
    contradiction: 25,
    inconsistency: 20,
    divergence: 15,
    ambiguity: 10,
    missing_data: 10,
  };
  score += typeScores[conflict.conflictType];
  factors.push(`Conflict type: ${conflict.conflictType}`);

  // Average confidence factor
  const avgConfidence = items.reduce((sum, item) => sum + (item.confidenceScore || 0.5), 0) / items.length;
  if (avgConfidence >= 0.8) {
    score += 20;
    factors.push('High confidence sources');
  } else if (avgConfidence >= 0.5) {
    score += 10;
    factors.push('Moderate confidence sources');
  }

  // Determine severity level
  let severity: ConflictSeverity;
  if (score >= 80) {
    severity = 'critical';
  } else if (score >= 60) {
    severity = 'high';
  } else if (score >= 40) {
    severity = 'medium';
  } else {
    severity = 'low';
  }

  return {
    score,
    severity,
    rationale: factors.join('; '),
  };
}

/**
 * Generate conflict graph for visualization
 */
export async function generateConflictGraph(
  orgId: string,
  conflictId: string
): Promise<ConflictGraphData> {
  const supabase = getSupabaseClient();

  // Get conflict
  const { data: conflictData } = await supabase
    .from('insight_conflicts')
    .select('*')
    .eq('id', conflictId)
    .eq('org_id', orgId)
    .single();

  if (!conflictData) {
    throw new Error('Conflict not found');
  }

  const conflict = mapDbConflict(conflictData);

  // Get items
  const { data: itemsData } = await supabase
    .from('insight_conflict_items')
    .select('*')
    .eq('conflict_id', conflictId);

  const items = (itemsData || []).map(mapDbItem);

  // Get resolutions
  const { data: resolutionsData } = await supabase
    .from('insight_conflict_resolutions')
    .select('*')
    .eq('conflict_id', conflictId);

  const resolutions = (resolutionsData || []).map(mapDbResolution);

  // Build graph nodes
  const nodes: ConflictGraphNode[] = [];
  const edges: ConflictGraphEdge[] = [];

  // Add conflict node at center
  nodes.push({
    id: conflict.id,
    type: 'conflict',
    label: conflict.title,
    data: {
      conflictType: conflict.conflictType,
      severity: conflict.severity,
      status: conflict.status,
    },
    position: { x: 400, y: 300 },
    size: 60,
    color: getSeverityColor(conflict.severity),
  });

  // Add item nodes around conflict
  const itemAngleStep = (2 * Math.PI) / Math.max(items.length, 1);
  items.forEach((item, index) => {
    const angle = index * itemAngleStep;
    const radius = 200;
    nodes.push({
      id: item.id,
      type: 'item',
      label: item.rawInsight.slice(0, 50) + (item.rawInsight.length > 50 ? '...' : ''),
      data: {
        sourceSystem: item.sourceSystem,
        confidence: item.confidenceScore || undefined,
      },
      position: {
        x: 400 + radius * Math.cos(angle),
        y: 300 + radius * Math.sin(angle),
      },
      size: 40,
      color: getSourceColor(item.sourceSystem),
    });

    // Add edge from item to conflict
    edges.push({
      id: `edge-${item.id}-${conflict.id}`,
      source: item.id,
      target: conflict.id,
      type: 'contains',
      weight: item.confidenceScore || 0.5,
    });
  });

  // Add resolution nodes
  resolutions.forEach((resolution, index) => {
    nodes.push({
      id: resolution.id,
      type: 'resolution',
      label: resolution.resolutionType,
      data: {
        resolutionType: resolution.resolutionType,
        confidence: resolution.resolutionConfidence || undefined,
      },
      position: {
        x: 400,
        y: 500 + index * 80,
      },
      size: 50,
      color: resolution.isAccepted ? '#22C55E' : '#6B7280',
    });

    // Add edge from conflict to resolution
    edges.push({
      id: `edge-${conflict.id}-${resolution.id}`,
      source: conflict.id,
      target: resolution.id,
      type: 'resolved_by',
      weight: resolution.resolutionConfidence || 0.5,
    });
  });

  return {
    nodes,
    edges,
    metadata: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      conflictCount: 1,
      itemCount: items.length,
      resolutionCount: resolutions.length,
      generatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Cluster similar conflicts
 */
export async function clusterConflicts(
  orgId: string,
  conflictIds: string[]
): Promise<InsightConflictCluster[]> {
  const supabase = getSupabaseClient();

  // Get conflicts
  const { data: conflictsData } = await supabase
    .from('insight_conflicts')
    .select('*')
    .eq('org_id', orgId)
    .in('id', conflictIds);

  if (!conflictsData || conflictsData.length === 0) {
    return [];
  }

  // Simple clustering by conflict type
  // In production, this would use proper clustering algorithms
  const typeGroups: Record<string, string[]> = {};
  conflictsData.forEach((c) => {
    if (!typeGroups[c.conflict_type]) {
      typeGroups[c.conflict_type] = [];
    }
    typeGroups[c.conflict_type].push(c.id);
  });

  const clusters: InsightConflictCluster[] = [];

  for (const [type, ids] of Object.entries(typeGroups)) {
    if (ids.length >= 2) {
      // Create cluster
      const { data: clusterData, error: _error } = await supabase
        .from('insight_conflict_clusters')
        .insert({
          org_id: orgId,
          name: `${type.charAt(0).toUpperCase() + type.slice(1)} Cluster`,
          description: `Auto-generated cluster for ${type} conflicts`,
          primary_conflict_type: type,
          conflict_count: ids.length,
          is_auto_generated: true,
          is_active: true,
        })
        .select()
        .single();

      if (clusterData) {
        // Update conflicts with cluster ID
        await supabase
          .from('insight_conflicts')
          .update({ cluster_id: clusterData.id })
          .in('id', ids);

        clusters.push(mapDbCluster(clusterData));
      }
    }
  }

  return clusters;
}

/**
 * Analyze root cause of conflict
 */
export async function analyzeRootCause(
  conflict: InsightConflict,
  items: InsightConflictItem[]
): Promise<RootCauseAnalysisResult> {
  // Use LLM to analyze root cause
  const prompt = `Analyze the root cause of this conflict:

Conflict Type: ${conflict.conflictType}
Title: ${conflict.title}
Summary: ${conflict.conflictSummary || 'N/A'}
Affected Systems: ${conflict.affectedSystems.join(', ')}

Conflicting Insights:
${items.map((item, i) => `${i + 1}. [${item.sourceSystem}] ${item.rawInsight}`).join('\n')}

Provide a root cause analysis in JSON format:
{
  "primaryCause": { "cause": "...", "confidence": 0.0-1.0, "sourceSystem": "...", "evidence": "..." },
  "contributingCauses": [{ "cause": "...", "confidence": 0.0-1.0 }],
  "recommendations": ["..."],
  "confidence": 0.0-1.0
}`;

  try {
    const response = await routeLLM({
      userPrompt: prompt,
      maxTokens: 1000,
    });

    const parsed = JSON.parse(response.content);
    return {
      primaryCause: parsed.primaryCause,
      contributingCauses: parsed.contributingCauses || [],
      timeline: null,
      recommendations: parsed.recommendations || [],
      confidence: parsed.confidence || 0.7,
    };
  } catch (err) {
    // Return default analysis
    return {
      primaryCause: {
        cause: 'Data source discrepancy',
        confidence: 0.5,
        sourceSystem: items[0]?.sourceSystem || null,
        evidence: 'Multiple sources reporting different information',
      },
      contributingCauses: [],
      timeline: null,
      recommendations: ['Review data sources for accuracy', 'Establish source priority'],
      confidence: 0.5,
    };
  }
}

/**
 * Link conflict to reality map nodes
 */
export async function linkRealityMapNodes(
  conflictId: string,
  realityMapId: string,
  nodeIds: string[]
): Promise<void> {
  const supabase = getSupabaseClient();

  await supabase
    .from('insight_conflicts')
    .update({
      linked_reality_map_id: realityMapId,
      linked_node_ids: nodeIds,
    })
    .eq('id', conflictId);
}

/**
 * Full conflict analysis
 */
export async function analyzeConflict(
  orgId: string,
  userId: string,
  conflictId: string,
  input?: AnalyzeConflictInput
): Promise<AnalyzeConflictResponse> {
  const supabase = getSupabaseClient();

  // Get conflict
  const { data: conflictData, error: conflictError } = await supabase
    .from('insight_conflicts')
    .select('*')
    .eq('id', conflictId)
    .eq('org_id', orgId)
    .single();

  if (conflictError || !conflictData) {
    throw new Error('Conflict not found');
  }

  // Update status to analyzing
  await supabase
    .from('insight_conflicts')
    .update({
      status: 'analyzing',
      analysis_started_at: new Date().toISOString(),
    })
    .eq('id', conflictId);

  // Get items
  const { data: itemsData } = await supabase
    .from('insight_conflict_items')
    .select('*')
    .eq('conflict_id', conflictId);

  const items = (itemsData || []).map(mapDbItem);

  // Compute severity
  const severityResult = await computeConflictSeverity(mapDbConflict(conflictData), items);

  // Find related conflicts
  let relatedConflicts: RelatedConflict[] = [];
  if (input?.includeRelatedConflicts !== false) {
    const { data: related } = await supabase
      .from('insight_conflicts')
      .select('id, conflict_type')
      .eq('org_id', orgId)
      .eq('conflict_type', conflictData.conflict_type)
      .neq('id', conflictId)
      .limit(input?.maxRelatedConflicts || 5);

    relatedConflicts = (related || []).map((r) => ({
      conflictId: r.id,
      edgeType: 'related' as ConflictEdgeType,
      similarity: 0.7, // Simplified - would use vector similarity
    }));
  }

  // Vector analysis
  let vectorSimilarities: VectorSimilarity[] = [];
  if (input?.includeVectorAnalysis) {
    // Compute pairwise similarities
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        if (items[i].vector && items[j].vector) {
          const similarity = cosineSimilarity(items[i].vector!, items[j].vector!);
          vectorSimilarities.push({
            itemAId: items[i].id,
            itemBId: items[j].id,
            similarity,
          });
        }
      }
    }
  }

  // Root cause analysis
  let rootCauseAnalysis: RootCauseAnalysisResult | null = null;
  if (input?.includeRootCauseAnalysis) {
    rootCauseAnalysis = await analyzeRootCause(mapDbConflict(conflictData), items);
  }

  // Affected systems analysis
  const affectedSystemsAnalysis: AffectedSystemAnalysis[] = conflictData.affected_systems.map((system: string) => ({
    system,
    impactLevel: severityResult.severity === 'critical' ? 'high' : severityResult.severity === 'high' ? 'medium' : 'low',
    description: `${system} contains conflicting information`,
  }));

  // Suggest resolution type
  const suggestedResolutionType = suggestResolutionType(conflictData.conflict_type, items);

  // Build analysis result
  const analysis: ConflictAnalysisResult = {
    conflictId,
    severityScore: severityResult.score,
    severityRationale: severityResult.rationale,
    rootCauses: rootCauseAnalysis?.contributingCauses.map((c) => ({
      cause: c.cause,
      confidence: c.confidence,
      sourceSystem: c.sourceSystem || null,
      evidence: c.evidence || null,
    })) || [],
    relatedConflicts,
    suggestedResolutionType,
    estimatedResolutionDifficulty: severityResult.severity === 'critical' ? 'difficult' : severityResult.severity === 'high' ? 'moderate' : 'easy',
    affectedSystemsAnalysis,
    vectorSimilarities,
  };

  // Update conflict with analysis
  const { data: updatedConflict } = await supabase
    .from('insight_conflicts')
    .update({
      severity: severityResult.severity,
      status: 'detected', // Back to detected after analysis
      analysis_completed_at: new Date().toISOString(),
      analysis_result: analysis,
      root_cause_analysis: rootCauseAnalysis,
    })
    .eq('id', conflictId)
    .select()
    .single();

  // Log audit event
  await logAuditEvent(
    conflictId,
    'analyzed',
    userId,
    'user',
    { analysis },
    { status: conflictData.status },
    { status: 'detected', analysis_result: analysis }
  );

  return {
    conflict: mapDbConflict(updatedConflict),
    analysis,
  };
}

// ============================================================================
// RESOLUTION ENGINE
// ============================================================================

/**
 * AI consensus resolution - synthesize agreement from multiple sources
 */
async function aiConsensusResolution(
  conflict: InsightConflict,
  items: InsightConflictItem[]
): Promise<{ summary: string; narrative: string; actions: RecommendedAction[]; confidence: number }> {
  const prompt = `You are an expert at synthesizing conflicting information into a coherent consensus.

Conflict Type: ${conflict.conflictType}
Title: ${conflict.title}
Summary: ${conflict.conflictSummary || 'N/A'}

Conflicting Insights:
${items.map((item, i) => `${i + 1}. [${item.sourceSystem}] (Confidence: ${(item.confidenceScore || 0.5) * 100}%)
   ${item.rawInsight}`).join('\n\n')}

Analyze these conflicting insights and provide:
1. A consensus summary that reconciles the differences
2. A narrative explaining how the consensus was reached
3. Recommended actions to prevent future conflicts

Response in JSON format:
{
  "summary": "...",
  "narrative": "...",
  "actions": [{ "action": "...", "priority": "high|medium|low", "description": "..." }],
  "confidence": 0.0-1.0
}`;

  try {
    const response = await routeLLM({
      userPrompt: prompt,
      maxTokens: 1500,
    });

    const parsed = JSON.parse(response.content);
    return {
      summary: parsed.summary,
      narrative: parsed.narrative,
      actions: parsed.actions || [],
      confidence: parsed.confidence || 0.7,
    };
  } catch (err) {
    return {
      summary: 'Unable to reach consensus automatically. Manual review required.',
      narrative: 'AI consensus generation failed. Please review the conflicting insights manually.',
      actions: [{ action: 'Manual review required', priority: 'high', description: 'Review conflicting insights' }],
      confidence: 0.3,
    };
  }
}

/**
 * Weighted truth resolution - weight sources by reliability
 */
async function weightedTruthResolution(
  _conflict: InsightConflict,
  items: InsightConflictItem[],
  sourceWeights?: SourceWeight[]
): Promise<{ summary: string; narrative: string; actions: RecommendedAction[]; confidence: number }> {
  // Calculate weights
  const weights: Record<string, number> = {};

  if (sourceWeights && sourceWeights.length > 0) {
    sourceWeights.forEach((sw) => {
      weights[sw.sourceSystem] = sw.weight;
    });
  } else {
    // Default: weight by confidence scores
    items.forEach((item) => {
      if (!weights[item.sourceSystem]) {
        weights[item.sourceSystem] = 0;
      }
      weights[item.sourceSystem] += item.confidenceScore || 0.5;
    });

    // Normalize
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    Object.keys(weights).forEach((k) => {
      weights[k] = weights[k] / total;
    });
  }

  // Find highest weighted source
  const sortedSources = Object.entries(weights).sort((a, b) => b[1] - a[1]);
  const primarySource = sortedSources[0]?.[0];
  const primaryItems = items.filter((i) => i.sourceSystem === primarySource);

  const summary = primaryItems.length > 0
    ? `Based on weighted source analysis, the most reliable interpretation is: ${primaryItems[0].rawInsight}`
    : 'Unable to determine weighted truth.';

  return {
    summary,
    narrative: `Source weights: ${sortedSources.map(([s, w]) => `${s}: ${(w * 100).toFixed(1)}%`).join(', ')}. Primary source: ${primarySource}.`,
    actions: [
      { action: 'Update other sources to match', priority: 'medium', description: `Align other systems with ${primarySource}` },
    ],
    confidence: sortedSources[0]?.[1] || 0.5,
  };
}

/**
 * Source priority resolution - use priority order
 */
async function sourcePriorityResolution(
  _conflict: InsightConflict,
  items: InsightConflictItem[],
  priorityOrder?: string[]
): Promise<{ summary: string; narrative: string; actions: RecommendedAction[]; confidence: number }> {
  const order = priorityOrder || items.map((i) => i.sourceSystem);

  // Find first source in priority order that has items
  const primarySource = order.find((s) => items.some((i) => i.sourceSystem === s));
  const primaryItems = items.filter((i) => i.sourceSystem === primarySource);

  const summary = primaryItems.length > 0
    ? `Based on source priority (${order.slice(0, 3).join(' > ')}), the authoritative interpretation is: ${primaryItems[0].rawInsight}`
    : 'No matching source found in priority order.';

  return {
    summary,
    narrative: `Applied source priority order: ${order.join(' > ')}. ${primarySource} is the highest priority source with relevant data.`,
    actions: [
      { action: 'Review priority order', priority: 'low', description: 'Ensure source priority reflects organizational trust levels' },
    ],
    confidence: 0.8,
  };
}

/**
 * Hybrid resolution - combine multiple strategies
 */
async function hybridResolution(
  conflict: InsightConflict,
  items: InsightConflictItem[],
  sourceWeights?: SourceWeight[],
  priorityOrder?: string[]
): Promise<{ summary: string; narrative: string; actions: RecommendedAction[]; confidence: number }> {
  // Get results from all strategies
  const [consensus, weighted, priority] = await Promise.all([
    aiConsensusResolution(conflict, items),
    weightedTruthResolution(conflict, items, sourceWeights),
    sourcePriorityResolution(conflict, items, priorityOrder),
  ]);

  // Combine based on confidence
  const strategies = [
    { name: 'consensus', result: consensus },
    { name: 'weighted', result: weighted },
    { name: 'priority', result: priority },
  ].sort((a, b) => b.result.confidence - a.result.confidence);

  const best = strategies[0];
  const allActions = [...consensus.actions, ...weighted.actions, ...priority.actions];
  const uniqueActions = allActions.filter((a, i) =>
    allActions.findIndex((b) => b.action === a.action) === i
  );

  return {
    summary: best.result.summary,
    narrative: `Hybrid resolution selected ${best.name} strategy (confidence: ${(best.result.confidence * 100).toFixed(0)}%). ${best.result.narrative}`,
    actions: uniqueActions.slice(0, 5),
    confidence: best.result.confidence,
  };
}

/**
 * Resolve a conflict
 */
export async function resolveConflict(
  orgId: string,
  userId: string,
  conflictId: string,
  input: ResolveConflictInput
): Promise<ResolveConflictResponse> {
  const supabase = getSupabaseClient();

  // Get conflict
  const { data: conflictData, error: conflictError } = await supabase
    .from('insight_conflicts')
    .select('*')
    .eq('id', conflictId)
    .eq('org_id', orgId)
    .single();

  if (conflictError || !conflictData) {
    throw new Error('Conflict not found');
  }

  // Get items
  const { data: itemsData } = await supabase
    .from('insight_conflict_items')
    .select('*')
    .eq('conflict_id', conflictId);

  const items = (itemsData || []).map(mapDbItem);
  const conflict = mapDbConflict(conflictData);

  // Run resolution strategy
  let resolutionResult: { summary: string; narrative: string; actions: RecommendedAction[]; confidence: number };

  switch (input.resolutionType) {
    case 'ai_consensus':
      resolutionResult = await aiConsensusResolution(conflict, items);
      break;
    case 'weighted_truth':
      resolutionResult = await weightedTruthResolution(conflict, items, input.sourceWeights || undefined);
      break;
    case 'source_priority':
      resolutionResult = await sourcePriorityResolution(conflict, items, input.priorityOrder || undefined);
      break;
    case 'hybrid':
      resolutionResult = await hybridResolution(conflict, items, input.sourceWeights || undefined, input.priorityOrder || undefined);
      break;
    default:
      throw new Error('Invalid resolution type');
  }

  // Create resolution record
  const { data: resolutionData, error: resolutionError } = await supabase
    .from('insight_conflict_resolutions')
    .insert({
      conflict_id: conflictId,
      resolution_type: input.resolutionType,
      resolved_summary: resolutionResult.summary,
      consensus_narrative: resolutionResult.narrative,
      recommended_actions: resolutionResult.actions,
      resolution_confidence: resolutionResult.confidence,
      resolution_rationale: `Generated using ${input.resolutionType} strategy`,
      source_weights: input.sourceWeights,
      priority_order: input.priorityOrder,
      ai_model_used: 'claude-3-haiku',
      is_accepted: input.autoAccept || false,
      accepted_at: input.autoAccept ? new Date().toISOString() : null,
      accepted_by: input.autoAccept ? userId : null,
    })
    .select()
    .single();

  if (resolutionError) {
    throw new Error('Failed to create resolution');
  }

  // Update conflict status
  const newStatus = input.autoAccept ? 'resolved' : 'detected';
  const { data: updatedConflict } = await supabase
    .from('insight_conflicts')
    .update({
      status: newStatus,
      resolved_at: input.autoAccept ? new Date().toISOString() : null,
      resolved_by: input.autoAccept ? userId : null,
    })
    .eq('id', conflictId)
    .select()
    .single();

  // Log audit event
  await logAuditEvent(
    conflictId,
    'resolved',
    userId,
    'user',
    { resolutionType: input.resolutionType, autoAccept: input.autoAccept },
    { status: conflictData.status },
    { status: newStatus }
  );

  return {
    conflict: mapDbConflict(updatedConflict),
    resolution: mapDbResolution(resolutionData),
  };
}

/**
 * Review and accept/reject a resolution
 */
export async function reviewResolution(
  orgId: string,
  userId: string,
  conflictId: string,
  resolutionId: string,
  input: ReviewResolutionInput
): Promise<InsightConflictResolution> {
  const supabase = getSupabaseClient();

  // Verify conflict belongs to org
  const { data: conflictData } = await supabase
    .from('insight_conflicts')
    .select('id')
    .eq('id', conflictId)
    .eq('org_id', orgId)
    .single();

  if (!conflictData) {
    throw new Error('Conflict not found');
  }

  // Update resolution
  const { data: resolutionData, error } = await supabase
    .from('insight_conflict_resolutions')
    .update({
      is_accepted: input.isAccepted,
      human_reviewed: true,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      review_notes: input.reviewNotes,
      accepted_at: input.isAccepted ? new Date().toISOString() : null,
      accepted_by: input.isAccepted ? userId : null,
    })
    .eq('id', resolutionId)
    .eq('conflict_id', conflictId)
    .select()
    .single();

  if (error || !resolutionData) {
    throw new Error('Failed to update resolution');
  }

  // Update conflict status if accepted
  if (input.isAccepted) {
    await supabase
      .from('insight_conflicts')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolved_by: userId,
      })
      .eq('id', conflictId);
  }

  // Log audit event
  await logAuditEvent(
    conflictId,
    input.isAccepted ? 'resolution_accepted' : 'resolution_rejected',
    userId,
    'user',
    { resolutionId, isAccepted: input.isAccepted, reviewNotes: input.reviewNotes }
  );

  return mapDbResolution(resolutionData);
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Create a new conflict
 */
export async function createConflict(
  orgId: string,
  userId: string,
  input: CreateConflictInput
): Promise<CreateConflictResponse> {
  const supabase = getSupabaseClient();

  // Create conflict
  const { data: conflictData, error: conflictError } = await supabase
    .from('insight_conflicts')
    .insert({
      org_id: orgId,
      conflict_type: input.conflictType,
      title: input.title,
      conflict_summary: input.conflictSummary,
      severity: input.severity || 'medium',
      source_entities: input.sourceEntities || [],
      affected_systems: input.affectedSystems || [],
      status: 'detected',
      created_by: userId,
    })
    .select()
    .single();

  if (conflictError || !conflictData) {
    throw new Error('Failed to create conflict');
  }

  // Create items if provided
  if (input.items && input.items.length > 0) {
    const itemInserts = input.items.map((item) => ({
      conflict_id: conflictData.id,
      entity_type: item.entityType,
      entity_id: item.entityId,
      raw_insight: item.rawInsight,
      processed_insight: item.processedInsight,
      source_system: item.sourceSystem,
      source_timestamp: item.sourceTimestamp,
      confidence_score: item.confidenceScore,
      item_role: item.itemRole,
    }));

    await supabase.from('insight_conflict_items').insert(itemInserts);
  }

  // Log audit event
  await logAuditEvent(
    conflictData.id,
    'created',
    userId,
    'user',
    { title: input.title, conflictType: input.conflictType }
  );

  return {
    conflict: mapDbConflict(conflictData),
  };
}

/**
 * Get a conflict by ID
 */
export async function getConflict(
  orgId: string,
  conflictId: string,
  options?: { includeItems?: boolean; includeResolutions?: boolean; includeRelated?: boolean }
): Promise<GetConflictResponse> {
  const supabase = getSupabaseClient();

  // Get conflict
  const { data: conflictData, error } = await supabase
    .from('insight_conflicts')
    .select('*')
    .eq('id', conflictId)
    .eq('org_id', orgId)
    .single();

  if (error || !conflictData) {
    throw new Error('Conflict not found');
  }

  const conflict = mapDbConflict(conflictData);

  // Get items
  let items: InsightConflictItem[] = [];
  if (options?.includeItems !== false) {
    const { data: itemsData } = await supabase
      .from('insight_conflict_items')
      .select('*')
      .eq('conflict_id', conflictId);

    items = (itemsData || []).map(mapDbItem);
  }

  // Get resolutions
  let resolutions: InsightConflictResolution[] = [];
  if (options?.includeResolutions !== false) {
    const { data: resolutionsData } = await supabase
      .from('insight_conflict_resolutions')
      .select('*')
      .eq('conflict_id', conflictId)
      .order('created_at', { ascending: false });

    resolutions = (resolutionsData || []).map(mapDbResolution);
  }

  // Get related conflicts
  let relatedConflicts: InsightConflict[] = [];
  if (options?.includeRelated) {
    const { data: relatedData } = await supabase
      .from('insight_conflicts')
      .select('*')
      .eq('org_id', orgId)
      .eq('conflict_type', conflictData.conflict_type)
      .neq('id', conflictId)
      .limit(5);

    relatedConflicts = (relatedData || []).map(mapDbConflict);
  }

  return {
    conflict,
    items,
    resolutions,
    relatedConflicts,
  };
}

/**
 * List conflicts
 */
export async function listConflicts(
  orgId: string,
  query?: ListConflictsQuery
): Promise<ListConflictsResponse> {
  const supabase = getSupabaseClient();
  const limit = query?.limit || 20;
  const offset = query?.offset || 0;

  let builder = supabase
    .from('insight_conflicts')
    .select('*', { count: 'exact' })
    .eq('org_id', orgId);

  // Apply filters
  if (query?.search) {
    builder = builder.ilike('title', `%${query.search}%`);
  }
  if (query?.conflictType) {
    builder = builder.eq('conflict_type', query.conflictType);
  }
  if (query?.severity) {
    builder = builder.eq('severity', query.severity);
  }
  if (query?.status) {
    builder = builder.eq('status', query.status);
  }
  if (query?.clusterId) {
    builder = builder.eq('cluster_id', query.clusterId);
  }
  if (query?.affectedSystem) {
    builder = builder.contains('affected_systems', [query.affectedSystem]);
  }
  if (query?.fromDate) {
    builder = builder.gte('created_at', query.fromDate);
  }
  if (query?.toDate) {
    builder = builder.lte('created_at', query.toDate);
  }

  // Apply sorting
  const sortBy = query?.sortBy || 'created_at';
  const sortOrder = query?.sortOrder || 'desc';
  builder = builder.order(sortBy, { ascending: sortOrder === 'asc' });

  // Apply pagination
  builder = builder.range(offset, offset + limit - 1);

  const { data, error, count } = await builder;

  if (error) {
    throw new Error('Failed to list conflicts');
  }

  return {
    conflicts: (data || []).map(mapDbConflict),
    total: count || 0,
    hasMore: (count || 0) > offset + limit,
  };
}

/**
 * Update a conflict
 */
export async function updateConflict(
  orgId: string,
  userId: string,
  conflictId: string,
  input: UpdateConflictInput
): Promise<UpdateConflictResponse> {
  const supabase = getSupabaseClient();

  // Get current state
  const { data: currentData } = await supabase
    .from('insight_conflicts')
    .select('*')
    .eq('id', conflictId)
    .eq('org_id', orgId)
    .single();

  if (!currentData) {
    throw new Error('Conflict not found');
  }

  // Build update object
  const updateObj: Record<string, unknown> = {};
  if (input.title !== undefined) updateObj.title = input.title;
  if (input.conflictSummary !== undefined) updateObj.conflict_summary = input.conflictSummary;
  if (input.severity !== undefined) updateObj.severity = input.severity;
  if (input.status !== undefined) updateObj.status = input.status;
  if (input.affectedSystems !== undefined) updateObj.affected_systems = input.affectedSystems;
  if (input.clusterId !== undefined) updateObj.cluster_id = input.clusterId;
  if (input.linkedRealityMapId !== undefined) updateObj.linked_reality_map_id = input.linkedRealityMapId;
  if (input.linkedNodeIds !== undefined) updateObj.linked_node_ids = input.linkedNodeIds;

  const { data: updatedData, error } = await supabase
    .from('insight_conflicts')
    .update(updateObj)
    .eq('id', conflictId)
    .select()
    .single();

  if (error || !updatedData) {
    throw new Error('Failed to update conflict');
  }

  // Log audit event
  await logAuditEvent(
    conflictId,
    'updated',
    userId,
    'user',
    { changes: Object.keys(updateObj) },
    { ...currentData },
    { ...updatedData }
  );

  return {
    conflict: mapDbConflict(updatedData),
  };
}

/**
 * Delete a conflict
 */
export async function deleteConflict(
  orgId: string,
  userId: string,
  conflictId: string
): Promise<void> {
  const supabase = getSupabaseClient();

  // Log before delete
  await logAuditEvent(conflictId, 'deleted', userId, 'user', {});

  const { error } = await supabase
    .from('insight_conflicts')
    .delete()
    .eq('id', conflictId)
    .eq('org_id', orgId);

  if (error) {
    throw new Error('Failed to delete conflict');
  }
}

/**
 * Dismiss a conflict
 */
export async function dismissConflict(
  orgId: string,
  userId: string,
  conflictId: string,
  reason?: string
): Promise<InsightConflict> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('insight_conflicts')
    .update({
      status: 'dismissed',
      resolved_at: new Date().toISOString(),
      resolved_by: userId,
    })
    .eq('id', conflictId)
    .eq('org_id', orgId)
    .select()
    .single();

  if (error || !data) {
    throw new Error('Failed to dismiss conflict');
  }

  await logAuditEvent(conflictId, 'dismissed', userId, 'user', { reason });

  return mapDbConflict(data);
}

// ============================================================================
// ITEMS, RESOLUTIONS, AUDIT LOG
// ============================================================================

/**
 * List conflict items
 */
export async function listConflictItems(
  orgId: string,
  query: ListConflictItemsQuery
): Promise<ListConflictItemsResponse> {
  const supabase = getSupabaseClient();
  const limit = query.limit || 20;
  const offset = query.offset || 0;

  // Verify conflict belongs to org
  const { data: conflictData } = await supabase
    .from('insight_conflicts')
    .select('id')
    .eq('id', query.conflictId)
    .eq('org_id', orgId)
    .single();

  if (!conflictData) {
    throw new Error('Conflict not found');
  }

  let builder = supabase
    .from('insight_conflict_items')
    .select('*', { count: 'exact' })
    .eq('conflict_id', query.conflictId);

  if (query.sourceSystem) {
    builder = builder.eq('source_system', query.sourceSystem);
  }
  if (query.itemRole) {
    builder = builder.eq('item_role', query.itemRole);
  }

  builder = builder.range(offset, offset + limit - 1);

  const { data, error, count } = await builder;

  if (error) {
    throw new Error('Failed to list items');
  }

  return {
    items: (data || []).map(mapDbItem),
    total: count || 0,
    hasMore: (count || 0) > offset + limit,
  };
}

/**
 * List resolutions
 */
export async function listResolutions(
  orgId: string,
  query: ListResolutionsQuery
): Promise<ListResolutionsResponse> {
  const supabase = getSupabaseClient();
  const limit = query.limit || 20;
  const offset = query.offset || 0;

  // Verify conflict belongs to org
  const { data: conflictData } = await supabase
    .from('insight_conflicts')
    .select('id')
    .eq('id', query.conflictId)
    .eq('org_id', orgId)
    .single();

  if (!conflictData) {
    throw new Error('Conflict not found');
  }

  let builder = supabase
    .from('insight_conflict_resolutions')
    .select('*', { count: 'exact' })
    .eq('conflict_id', query.conflictId);

  if (query.resolutionType) {
    builder = builder.eq('resolution_type', query.resolutionType);
  }
  if (query.isAccepted !== undefined && query.isAccepted !== null) {
    builder = builder.eq('is_accepted', query.isAccepted);
  }

  builder = builder.order('created_at', { ascending: false });
  builder = builder.range(offset, offset + limit - 1);

  const { data, error, count } = await builder;

  if (error) {
    throw new Error('Failed to list resolutions');
  }

  return {
    resolutions: (data || []).map(mapDbResolution),
    total: count || 0,
    hasMore: (count || 0) > offset + limit,
  };
}

/**
 * List audit log
 */
export async function listAuditLog(
  orgId: string,
  query: ListAuditLogQuery
): Promise<ListAuditLogResponse> {
  const supabase = getSupabaseClient();
  const limit = query.limit || 20;
  const offset = query.offset || 0;

  // Verify conflict belongs to org
  const { data: conflictData } = await supabase
    .from('insight_conflicts')
    .select('id')
    .eq('id', query.conflictId)
    .eq('org_id', orgId)
    .single();

  if (!conflictData) {
    throw new Error('Conflict not found');
  }

  let builder = supabase
    .from('insight_conflict_audit_log')
    .select('*', { count: 'exact' })
    .eq('conflict_id', query.conflictId);

  if (query.eventType) {
    builder = builder.eq('event_type', query.eventType);
  }
  if (query.actorId) {
    builder = builder.eq('actor_id', query.actorId);
  }
  if (query.fromDate) {
    builder = builder.gte('created_at', query.fromDate);
  }
  if (query.toDate) {
    builder = builder.lte('created_at', query.toDate);
  }

  builder = builder.order('created_at', { ascending: false });
  builder = builder.range(offset, offset + limit - 1);

  const { data, error, count } = await builder;

  if (error) {
    throw new Error('Failed to list audit log');
  }

  return {
    events: (data || []).map(mapDbAuditLog),
    total: count || 0,
    hasMore: (count || 0) > offset + limit,
  };
}

// ============================================================================
// CLUSTERS
// ============================================================================

/**
 * Create a cluster
 */
export async function createCluster(
  orgId: string,
  input: CreateClusterInput
): Promise<InsightConflictCluster> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('insight_conflict_clusters')
    .insert({
      org_id: orgId,
      name: input.name,
      description: input.description,
      is_auto_generated: false,
      is_active: true,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error('Failed to create cluster');
  }

  // Add conflicts to cluster if provided
  if (input.conflictIds && input.conflictIds.length > 0) {
    await supabase
      .from('insight_conflicts')
      .update({ cluster_id: data.id })
      .in('id', input.conflictIds);
  }

  return mapDbCluster(data);
}

/**
 * List clusters
 */
export async function listClusters(
  orgId: string,
  query?: ListClustersQuery
): Promise<ListClustersResponse> {
  const supabase = getSupabaseClient();
  const limit = query?.limit || 20;
  const offset = query?.offset || 0;

  let builder = supabase
    .from('insight_conflict_clusters')
    .select('*', { count: 'exact' })
    .eq('org_id', orgId);

  if (query?.isActive !== undefined && query?.isActive !== null) {
    builder = builder.eq('is_active', query.isActive);
  }
  if (query?.primaryConflictType) {
    builder = builder.eq('primary_conflict_type', query.primaryConflictType);
  }

  builder = builder.order('created_at', { ascending: false });
  builder = builder.range(offset, offset + limit - 1);

  const { data, error, count } = await builder;

  if (error) {
    throw new Error('Failed to list clusters');
  }

  return {
    clusters: (data || []).map(mapDbCluster),
    total: count || 0,
    hasMore: (count || 0) > offset + limit,
  };
}

// ============================================================================
// GRAPH
// ============================================================================

/**
 * Get conflict graph
 */
export async function getConflictGraph(
  orgId: string,
  conflictId: string
): Promise<GetConflictGraphResponse> {
  const graph = await generateConflictGraph(orgId, conflictId);
  return { graph };
}

/**
 * Create graph edge
 */
export async function createGraphEdge(
  orgId: string,
  input: CreateGraphEdgeInput
): Promise<InsightConflictGraphEdge> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('insight_conflict_graph_edges')
    .insert({
      org_id: orgId,
      source_conflict_id: input.sourceConflictId,
      target_conflict_id: input.targetConflictId,
      edge_type: input.edgeType,
      edge_weight: input.edgeWeight || 1.0,
      edge_label: input.edgeLabel,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error('Failed to create edge');
  }

  return mapDbGraphEdge(data);
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get conflict statistics
 */
export async function getConflictStats(orgId: string): Promise<GetConflictStatsResponse> {
  const supabase = getSupabaseClient();

  // Get all conflicts for stats
  const { data: conflicts } = await supabase
    .from('insight_conflicts')
    .select('status, severity, conflict_type, resolved_at, created_at')
    .eq('org_id', orgId);

  const conflictList = conflicts || [];

  // Count clusters
  const { count: clusterCount } = await supabase
    .from('insight_conflict_clusters')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('is_active', true);

  // Calculate stats
  const stats: ConflictStats = {
    totalConflicts: conflictList.length,
    detectedCount: conflictList.filter((c) => c.status === 'detected').length,
    analyzingCount: conflictList.filter((c) => c.status === 'analyzing').length,
    resolvedCount: conflictList.filter((c) => c.status === 'resolved').length,
    dismissedCount: conflictList.filter((c) => c.status === 'dismissed').length,
    criticalCount: conflictList.filter((c) => c.severity === 'critical').length,
    highCount: conflictList.filter((c) => c.severity === 'high').length,
    mediumCount: conflictList.filter((c) => c.severity === 'medium').length,
    lowCount: conflictList.filter((c) => c.severity === 'low').length,
    contradictionCount: conflictList.filter((c) => c.conflict_type === 'contradiction').length,
    divergenceCount: conflictList.filter((c) => c.conflict_type === 'divergence').length,
    ambiguityCount: conflictList.filter((c) => c.conflict_type === 'ambiguity').length,
    missingDataCount: conflictList.filter((c) => c.conflict_type === 'missing_data').length,
    inconsistencyCount: conflictList.filter((c) => c.conflict_type === 'inconsistency').length,
    averageResolutionTime: null,
    resolutionRate: conflictList.length > 0
      ? conflictList.filter((c) => c.status === 'resolved').length / conflictList.length
      : null,
    clusterCount: clusterCount || 0,
  };

  // Calculate average resolution time for resolved conflicts
  const resolvedConflicts = conflictList.filter((c) => c.resolved_at && c.created_at);
  if (resolvedConflicts.length > 0) {
    const totalTime = resolvedConflicts.reduce((sum, c) => {
      return sum + (new Date(c.resolved_at).getTime() - new Date(c.created_at).getTime());
    }, 0);
    stats.averageResolutionTime = totalTime / resolvedConflicts.length;
  }

  return { stats };
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Batch analyze conflicts
 */
export async function batchAnalyze(
  orgId: string,
  userId: string,
  input: BatchAnalyzeInput
): Promise<BatchAnalyzeResponse> {
  const results: BatchAnalyzeResponse['results'] = [];

  for (const conflictId of input.conflictIds) {
    try {
      const response = await analyzeConflict(orgId, userId, conflictId, input.options || undefined);
      results.push({
        conflictId,
        success: true,
        analysis: response.analysis,
      });
    } catch (err) {
      results.push({
        conflictId,
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  return {
    results,
    totalProcessed: results.length,
    successCount: results.filter((r) => r.success).length,
    errorCount: results.filter((r) => !r.success).length,
  };
}

/**
 * Batch resolve conflicts
 */
export async function batchResolve(
  orgId: string,
  userId: string,
  input: BatchResolveInput
): Promise<BatchResolveResponse> {
  const results: BatchResolveResponse['results'] = [];

  for (const conflictId of input.conflictIds) {
    try {
      const response = await resolveConflict(orgId, userId, conflictId, {
        resolutionType: input.resolutionType,
        ...input.options,
      });
      results.push({
        conflictId,
        success: true,
        resolution: response.resolution,
      });
    } catch (err) {
      results.push({
        conflictId,
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  return {
    results,
    totalProcessed: results.length,
    successCount: results.filter((r) => r.success).length,
    errorCount: results.filter((r) => !r.success).length,
  };
}

/**
 * Batch dismiss conflicts
 */
export async function batchDismiss(
  orgId: string,
  userId: string,
  input: BatchDismissInput
): Promise<BatchDismissResponse> {
  const results: BatchDismissResponse['results'] = [];

  for (const conflictId of input.conflictIds) {
    try {
      await dismissConflict(orgId, userId, conflictId, input.reason || undefined);
      results.push({
        conflictId,
        success: true,
      });
    } catch (err) {
      results.push({
        conflictId,
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  return {
    results,
    totalProcessed: results.length,
    successCount: results.filter((r) => r.success).length,
    errorCount: results.filter((r) => !r.success).length,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getSeverityColor(severity: ConflictSeverity): string {
  const colors: Record<ConflictSeverity, string> = {
    low: '#22C55E',
    medium: '#EAB308',
    high: '#F97316',
    critical: '#EF4444',
  };
  return colors[severity];
}

function getSourceColor(source: string): string {
  // Generate consistent color from source name
  let hash = 0;
  for (let i = 0; i < source.length; i++) {
    hash = source.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 50%)`;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function suggestResolutionType(conflictType: ConflictType, _items: InsightConflictItem[]): ConflictResolutionType {
  // Suggest based on conflict type and item characteristics
  switch (conflictType) {
    case 'contradiction':
      // For contradictions, AI consensus works well
      return 'ai_consensus';
    case 'divergence':
      // For divergence, weighted truth can help
      return 'weighted_truth';
    case 'ambiguity':
      // For ambiguity, AI can clarify
      return 'ai_consensus';
    case 'missing_data':
      // For missing data, source priority helps
      return 'source_priority';
    case 'inconsistency':
      // For inconsistency, hybrid approach
      return 'hybrid';
    default:
      return 'ai_consensus';
  }
}
