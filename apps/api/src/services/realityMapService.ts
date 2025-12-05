/**
 * Reality Map Service (Sprint S73)
 * AI-Driven Multi-Outcome "Reality Maps" Engine
 * Generates branching trees of possible futures from multi-scenario suites
 */

import { getSupabaseClient } from '../lib/supabase';
import { routeLLM } from '@pravado/utils';
import { DEFAULT_REALITY_MAP_PARAMETERS } from '@pravado/types';
import type {
  RealityMap,
  RealityMapNode,
  RealityMapEdge,
  RealityMapPath,
  RealityMapAuditLog,
  RealityMapStatus,
  RealityMapNodeType,
  RealityMapParameters,
  RealityMapAnalysisResponse,
  OutcomeUniverse,
  RealityPathSummary,
  RealityMapGraphNode,
  RealityMapGraphEdge,
  GraphMetadata,
  ProbabilityDistribution,
  DetectedContradiction,
  DetectedCorrelation,
  PathComparisonResult,
  NarrativeDeltaResult,
  KeyDriver,
  RealityMapRiskFactor,
  OpportunityFactor,
  RealityMapActionRecommendation,
  NodeSnapshot,
  EdgeTrigger,
  DecisionPoint,
  MitigationStrategy,
  BranchingStructure,
  BranchingNode,
  SimulationDataForIngestion,
  SuiteDataForIngestion,
  ProbabilityModelResult,
  NodeNarrativeResult,
  ScoreComputationResult,
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
  RealityMapStats,
  GetRealityMapGlobalStatsResponse,
  PathOutcomeType,
  EdgeTriggerType,
} from '@pravado/types';

// ============================================================================
// DATABASE HELPERS
// ============================================================================

/**
 * Convert database row to RealityMap entity
 */
function dbRowToRealityMap(row: Record<string, unknown>): RealityMap {
  return {
    id: row.id as string,
    orgId: row.org_id as string,
    suiteId: row.suite_id as string | null,
    name: row.name as string,
    description: row.description as string | null,
    status: row.status as RealityMapStatus,
    parameters: row.parameters as RealityMapParameters,
    generationStartedAt: row.generation_started_at as string | null,
    generationCompletedAt: row.generation_completed_at as string | null,
    totalNodes: row.total_nodes as number,
    totalEdges: row.total_edges as number,
    totalPaths: row.total_paths as number,
    maxDepthReached: row.max_depth_reached as number,
    analysisStatus: row.analysis_status as 'pending' | 'running' | 'completed' | 'failed',
    executiveSummary: row.executive_summary as string | null,
    topRisks: row.top_risks as RealityMapRiskFactor[] | null,
    topOpportunities: row.top_opportunities as OpportunityFactor[] | null,
    keyDecisionPoints: row.key_decision_points as DecisionPoint[] | null,
    errorMessage: row.error_message as string | null,
    errorDetails: row.error_details as Record<string, unknown> | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    createdBy: row.created_by as string | null,
  };
}

/**
 * Convert database row to RealityMapNode entity
 */
function dbRowToNode(row: Record<string, unknown>): RealityMapNode {
  return {
    id: row.id as string,
    realityMapId: row.reality_map_id as string,
    parentNodeId: row.parent_node_id as string | null,
    nodeType: row.node_type as RealityMapNodeType,
    depth: row.depth as number,
    pathIndex: row.path_index as string | null,
    label: row.label as string | null,
    probability: row.probability as number,
    cumulativeProbability: row.cumulative_probability as number,
    riskScore: row.risk_score as number,
    opportunityScore: row.opportunity_score as number,
    confidenceScore: row.confidence_score as number,
    aiSummary: row.ai_summary as string | null,
    narrativeDelta: row.narrative_delta as string | null,
    keyDrivers: (row.key_drivers as KeyDriver[]) || [],
    expectedTimeline: row.expected_timeline as string | null,
    simulationId: row.simulation_id as string | null,
    simulationRunId: row.simulation_run_id as string | null,
    suiteItemId: row.suite_item_id as string | null,
    snapshot: (row.snapshot as NodeSnapshot) || {},
    riskFactors: (row.risk_factors as RealityMapRiskFactor[]) || [],
    opportunityFactors: (row.opportunity_factors as OpportunityFactor[]) || [],
    mitigationStrategies: (row.mitigation_strategies as MitigationStrategy[]) || [],
    actionRecommendations: (row.action_recommendations as RealityMapActionRecommendation[]) || [],
    generationOrder: row.generation_order as number | null,
    processingTimeMs: row.processing_time_ms as number | null,
    tokensUsed: row.tokens_used as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/**
 * Convert database row to RealityMapEdge entity
 * NOTE: Reserved for future use when edge queries are needed
 */
function dbRowToEdge(row: Record<string, unknown>): RealityMapEdge {
  return {
    id: row.id as string,
    realityMapId: row.reality_map_id as string,
    parentNodeId: row.parent_node_id as string,
    childNodeId: row.child_node_id as string,
    trigger: (row.trigger as EdgeTrigger) || { type: 'simulation_outcome', condition: '' },
    triggerType: row.trigger_type as EdgeTriggerType | null,
    transitionProbability: row.transition_probability as number,
    label: row.label as string | null,
    description: row.description as string | null,
    weight: row.weight as number,
    createdAt: row.created_at as string,
  };
}

// Export for potential external use
export { dbRowToEdge };

/**
 * Convert database row to RealityMapPath entity
 */
function dbRowToPath(row: Record<string, unknown>): RealityMapPath {
  return {
    id: row.id as string,
    realityMapId: row.reality_map_id as string,
    pathNodes: row.path_nodes as string[],
    pathIndex: row.path_index as string | null,
    depth: row.depth as number,
    totalProbability: row.total_probability as number,
    avgRiskScore: row.avg_risk_score as number,
    avgOpportunityScore: row.avg_opportunity_score as number,
    maxRiskScore: row.max_risk_score as number,
    maxOpportunityScore: row.max_opportunity_score as number,
    pathSummary: row.path_summary as string | null,
    pathTitle: row.path_title as string | null,
    outcomeType: row.outcome_type as PathOutcomeType | null,
    comparisonMetrics: row.comparison_metrics as RealityMapPath['comparisonMetrics'],
    createdAt: row.created_at as string,
  };
}

/**
 * Convert database row to audit log entry
 */
function dbRowToAuditLog(row: Record<string, unknown>): RealityMapAuditLog {
  return {
    id: row.id as string,
    realityMapId: row.reality_map_id as string,
    nodeId: row.node_id as string | null,
    eventType: row.event_type as RealityMapAuditLog['eventType'],
    actorId: row.actor_id as string | null,
    details: (row.details as Record<string, unknown>) || {},
    createdAt: row.created_at as string,
  };
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Create a new reality map
 */
export async function createRealityMap(
  orgId: string,
  userId: string,
  input: CreateRealityMapInput
): Promise<CreateRealityMapResponse> {
  const supabase = getSupabaseClient();

  const parameters: RealityMapParameters = {
    ...DEFAULT_REALITY_MAP_PARAMETERS,
    ...input.parameters,
  };

  const { data, error } = await supabase
    .from('reality_maps')
    .insert({
      org_id: orgId,
      name: input.name,
      description: input.description || null,
      suite_id: input.suiteId || null,
      status: 'draft',
      parameters,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create reality map: ${error.message}`);
  }

  await logAuditEvent(data.id, null, userId, 'map_created', {
    name: input.name,
    suiteId: input.suiteId,
  });

  return {
    success: true,
    map: dbRowToRealityMap(data),
  };
}

/**
 * Get reality map by ID with stats
 */
export async function getRealityMap(
  orgId: string,
  mapId: string
): Promise<GetRealityMapResponse> {
  const supabase = getSupabaseClient();

  const { data: mapData, error: mapError } = await supabase
    .from('reality_maps')
    .select('*')
    .eq('id', mapId)
    .eq('org_id', orgId)
    .maybeSingle();

  if (mapError) {
    throw new Error(`Failed to get reality map: ${mapError.message}`);
  }

  if (!mapData) {
    return { map: null, rootNode: null, stats: null };
  }

  // Get root node
  const { data: rootData } = await supabase
    .from('reality_map_nodes')
    .select('*')
    .eq('reality_map_id', mapId)
    .eq('node_type', 'root')
    .maybeSingle();

  // Get stats
  const stats = await computeMapStats(mapId);

  return {
    map: dbRowToRealityMap(mapData),
    rootNode: rootData ? dbRowToNode(rootData) : null,
    stats,
  };
}

/**
 * List reality maps with filtering
 */
export async function listRealityMaps(
  orgId: string,
  query: ListRealityMapsQuery
): Promise<ListRealityMapsResponse> {
  const supabase = getSupabaseClient();

  let queryBuilder = supabase
    .from('reality_maps')
    .select('*', { count: 'exact' })
    .eq('org_id', orgId);

  if (query.search) {
    queryBuilder = queryBuilder.or(`name.ilike.%${query.search}%,description.ilike.%${query.search}%`);
  }

  if (query.status) {
    queryBuilder = queryBuilder.eq('status', query.status);
  }

  if (query.suiteId) {
    queryBuilder = queryBuilder.eq('suite_id', query.suiteId);
  }

  const sortColumn = query.sortBy || 'created_at';
  const sortOrder = query.sortOrder || 'desc';
  queryBuilder = queryBuilder.order(sortColumn, { ascending: sortOrder === 'asc' });

  const limit = query.limit || 20;
  const offset = query.offset || 0;
  queryBuilder = queryBuilder.range(offset, offset + limit - 1);

  const { data, error, count } = await queryBuilder;

  if (error) {
    throw new Error(`Failed to list reality maps: ${error.message}`);
  }

  return {
    maps: (data || []).map(dbRowToRealityMap),
    total: count || 0,
    limit,
    offset,
  };
}

/**
 * Update reality map
 */
export async function updateRealityMap(
  orgId: string,
  mapId: string,
  userId: string,
  input: UpdateRealityMapInput
): Promise<UpdateRealityMapResponse> {
  const supabase = getSupabaseClient();

  // Get existing map
  const { data: existing } = await supabase
    .from('reality_maps')
    .select('*')
    .eq('id', mapId)
    .eq('org_id', orgId)
    .single();

  if (!existing) {
    throw new Error('Reality map not found');
  }

  const updates: Record<string, unknown> = {};

  if (input.name !== undefined) {
    updates.name = input.name;
  }

  if (input.description !== undefined) {
    updates.description = input.description;
  }

  if (input.parameters !== undefined) {
    updates.parameters = {
      ...existing.parameters,
      ...input.parameters,
    };
  }

  const { data, error } = await supabase
    .from('reality_maps')
    .update(updates)
    .eq('id', mapId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update reality map: ${error.message}`);
  }

  await logAuditEvent(mapId, null, userId, 'map_updated', { updates });

  return {
    success: true,
    map: dbRowToRealityMap(data),
  };
}

/**
 * Delete reality map
 */
export async function deleteRealityMap(
  orgId: string,
  mapId: string
): Promise<{ success: boolean }> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('reality_maps')
    .delete()
    .eq('id', mapId)
    .eq('org_id', orgId);

  if (error) {
    throw new Error(`Failed to delete reality map: ${error.message}`);
  }

  return { success: true };
}

// ============================================================================
// GENERATION ENGINE
// ============================================================================

/**
 * Generate reality map from source data
 */
export async function generateRealityMap(
  orgId: string,
  mapId: string,
  userId: string,
  input: GenerateRealityMapInput
): Promise<GenerateRealityMapResponse> {
  const supabase = getSupabaseClient();
  const startTime = Date.now();

  // Get map
  const { data: mapData } = await supabase
    .from('reality_maps')
    .select('*')
    .eq('id', mapId)
    .eq('org_id', orgId)
    .single();

  if (!mapData) {
    throw new Error('Reality map not found');
  }

  // Update status to generating
  await supabase
    .from('reality_maps')
    .update({
      status: 'generating',
      generation_started_at: new Date().toISOString(),
    })
    .eq('id', mapId);

  await logAuditEvent(mapId, null, userId, 'generation_started', { input });

  try {
    const parameters: RealityMapParameters = {
      ...mapData.parameters,
      ...input.parameters,
    };

    // Clear existing nodes/edges if regenerating
    if (input.regenerate) {
      await supabase.from('reality_map_edges').delete().eq('reality_map_id', mapId);
      await supabase.from('reality_map_nodes').delete().eq('reality_map_id', mapId);
      await supabase.from('reality_map_paths').delete().eq('reality_map_id', mapId);
    }

    // Step 1: Ingest source data
    const sourceData = await ingestSourceData(orgId, mapData.suite_id, input);

    // Step 2: Compute branching structure
    const branchingStructure = await computeBranchingStructure(
      sourceData,
      parameters
    );

    // Step 3: Run probability model
    const probabilityResults = await runProbabilityModel(
      branchingStructure,
      parameters
    );

    // Step 4: Generate node narratives
    const narrativeResults = await generateNodeNarratives(
      branchingStructure,
      parameters
    );

    // Step 5: Compute risk/opportunity scores
    const scoreResults = await computeRiskOpportunityScores(
      branchingStructure,
      sourceData
    );

    // Step 6: Build and persist graph
    const { nodesCreated, edgesCreated } = await buildGraph(
      mapId,
      branchingStructure,
      probabilityResults,
      narrativeResults,
      scoreResults
    );

    // Step 7: Compute paths
    const pathsComputed = await computePaths(mapId);

    // Update map with completion status
    const generationTime = Date.now() - startTime;

    await supabase
      .from('reality_maps')
      .update({
        status: 'completed',
        generation_completed_at: new Date().toISOString(),
        total_nodes: nodesCreated,
        total_edges: edgesCreated,
        total_paths: pathsComputed,
        max_depth_reached: branchingStructure.maxDepth,
      })
      .eq('id', mapId);

    await logAuditEvent(mapId, null, userId, 'generation_completed', {
      nodesCreated,
      edgesCreated,
      pathsComputed,
      generationTime,
    });

    // Get updated map
    const { data: updatedMap } = await supabase
      .from('reality_maps')
      .select('*')
      .eq('id', mapId)
      .single();

    return {
      success: true,
      map: dbRowToRealityMap(updatedMap),
      generationTime,
      nodesCreated,
      edgesCreated,
      pathsComputed,
    };
  } catch (error) {
    // Update map with failure status
    await supabase
      .from('reality_maps')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        error_details: { error: String(error) },
      })
      .eq('id', mapId);

    await logAuditEvent(mapId, null, userId, 'generation_failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    throw error;
  }
}

/**
 * Ingest source data from simulations and suites
 */
async function ingestSourceData(
  orgId: string,
  suiteId: string | null,
  input: GenerateRealityMapInput
): Promise<{
  simulations: SimulationDataForIngestion[];
  suites: SuiteDataForIngestion[];
}> {
  const supabase = getSupabaseClient();
  const simulations: SimulationDataForIngestion[] = [];
  const suites: SuiteDataForIngestion[] = [];

  // Ingest from specified simulation IDs
  if (input.simulationIds && input.simulationIds.length > 0) {
    for (const simId of input.simulationIds) {
      const simData = await ingestSimulationData(orgId, simId);
      if (simData) {
        simulations.push(simData);
      }
    }
  }

  // Ingest from suite if specified
  if (suiteId) {
    const suiteData = await ingestSuiteData(orgId, suiteId);
    if (suiteData) {
      suites.push(suiteData);
    }
  }

  // Ingest from suite run IDs
  if (input.suiteRunIds && input.suiteRunIds.length > 0) {
    for (const runId of input.suiteRunIds) {
      // Get suite from run
      const { data: runData } = await supabase
        .from('scenario_suite_runs')
        .select('suite_id')
        .eq('id', runId)
        .single();

      if (runData?.suite_id) {
        const suiteData = await ingestSuiteData(orgId, runData.suite_id, runId);
        if (suiteData) {
          suites.push(suiteData);
        }
      }
    }
  }

  return { simulations, suites };
}

/**
 * Ingest data from a single simulation
 */
async function ingestSimulationData(
  orgId: string,
  simulationId: string
): Promise<SimulationDataForIngestion | null> {
  const supabase = getSupabaseClient();

  const { data: simData } = await supabase
    .from('ai_scenario_simulations')
    .select('*')
    .eq('id', simulationId)
    .eq('org_id', orgId)
    .single();

  if (!simData) {
    return null;
  }

  // Get latest run
  const { data: runData } = await supabase
    .from('ai_scenario_simulation_runs')
    .select('*')
    .eq('simulation_id', simulationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    simulationId,
    simulationRunId: runData?.id,
    outcomes: extractOutcomesFromSimulation(simData, runData),
    riskAssessment: extractRiskAssessment(runData),
    opportunityAssessment: extractOpportunityAssessment(runData),
    narrative: runData?.outcome_narrative || simData.description || '',
    keyFindings: runData?.key_findings || [],
  };
}

/**
 * Ingest data from a suite
 */
async function ingestSuiteData(
  orgId: string,
  suiteId: string,
  runId?: string
): Promise<SuiteDataForIngestion | null> {
  const supabase = getSupabaseClient();

  const { data: suiteData } = await supabase
    .from('scenario_suites')
    .select('*')
    .eq('id', suiteId)
    .eq('org_id', orgId)
    .single();

  if (!suiteData) {
    return null;
  }

  // Get items
  const { data: itemsData } = await supabase
    .from('scenario_suite_items')
    .select('*')
    .eq('suite_id', suiteId)
    .order('order_index', { ascending: true });

  // Get run if specified
  let runData = null;
  if (runId) {
    const { data } = await supabase
      .from('scenario_suite_runs')
      .select('*')
      .eq('id', runId)
      .single();
    runData = data;
  }

  return {
    suiteId,
    suiteRunId: runId,
    items: (itemsData || []).map((item) => ({
      itemId: item.id,
      simulationId: item.simulation_id,
      orderIndex: item.order_index,
      status: item.status || 'pending',
      conditionMet: true,
      outcome: null,
    })),
    aggregatedOutcomes: runData?.aggregated_outcomes || {},
    suiteNarrative: runData?.suite_narrative || null,
    riskMap: runData?.risk_map || null,
  };
}

/**
 * Extract outcomes from simulation data
 */
function extractOutcomesFromSimulation(
  simData: Record<string, unknown>,
  runData: Record<string, unknown> | null
): SimulationDataForIngestion['outcomes'] {
  const outcomes = [];

  // Create main outcome from simulation
  outcomes.push({
    id: `outcome-${simData.id}-main`,
    type: simData.objective_type as string || 'general',
    probability: 0.5,
    description: runData?.outcome_narrative as string || 'Simulation outcome',
    riskLevel: runData?.risk_level as 'critical' | 'high' | 'medium' | 'low' || 'medium',
    opportunityLevel: 'medium' as const,
    drivers: runData?.key_findings as string[] || [],
  });

  // Add alternative outcomes if available
  const altOutcomes = runData?.alternative_outcomes as unknown[];
  if (altOutcomes && Array.isArray(altOutcomes)) {
    altOutcomes.forEach((alt, idx) => {
      const altObj = alt as Record<string, unknown>;
      outcomes.push({
        id: `outcome-${simData.id}-alt-${idx}`,
        type: altObj.type as string || 'alternative',
        probability: (altObj.probability as number) || 0.2,
        description: altObj.description as string || 'Alternative outcome',
        riskLevel: altObj.riskLevel as 'critical' | 'high' | 'medium' | 'low' || 'medium',
        opportunityLevel: altObj.opportunityLevel as 'high' | 'medium' | 'low' || 'medium',
        drivers: altObj.drivers as string[] || [],
      });
    });
  }

  return outcomes;
}

/**
 * Extract risk assessment from run data
 */
function extractRiskAssessment(
  runData: Record<string, unknown> | null
): SimulationDataForIngestion['riskAssessment'] {
  if (!runData) {
    return { overallScore: 50, factors: [], mitigations: [] };
  }

  const riskFactors = runData.risk_factors as RealityMapRiskFactor[] || [];

  return {
    overallScore: runData.risk_score as number || 50,
    factors: riskFactors,
    mitigations: [],
  };
}

/**
 * Extract opportunity assessment from run data
 */
function extractOpportunityAssessment(
  runData: Record<string, unknown> | null
): SimulationDataForIngestion['opportunityAssessment'] {
  if (!runData) {
    return { overallScore: 50, factors: [], actions: [] };
  }

  return {
    overallScore: runData.opportunity_score as number || 50,
    factors: runData.opportunity_factors as OpportunityFactor[] || [],
    actions: [],
  };
}

/**
 * Compute branching structure from source data
 */
async function computeBranchingStructure(
  sourceData: { simulations: SimulationDataForIngestion[]; suites: SuiteDataForIngestion[] },
  parameters: RealityMapParameters
): Promise<BranchingStructure> {
  // Note: allNodes tracking removed as it was unused
  let nodeCounter = 0;

  // Create root node
  const root: BranchingNode = {
    id: `node-${nodeCounter++}`,
    label: 'Current State',
    probability: 1.0,
    source: 'computed',
    sourceId: null,
    children: [],
    metadata: { depth: 0 },
  };

  // Add branches from simulations
  for (const sim of sourceData.simulations) {
    for (const outcome of sim.outcomes) {
      if (outcome.probability >= parameters.minProbability) {
        const childNode: BranchingNode = {
          id: `node-${nodeCounter++}`,
          label: outcome.description.slice(0, 100),
          probability: outcome.probability,
          source: 'simulation',
          sourceId: sim.simulationId,
          children: [],
          metadata: {
            depth: 1,
            outcomeId: outcome.id,
            riskLevel: outcome.riskLevel,
            drivers: outcome.drivers,
          },
        };

        // Add second-level branches based on risk escalation
        if (outcome.riskLevel === 'high' || outcome.riskLevel === 'critical') {
          childNode.children.push(
            createEscalationBranch(nodeCounter++, 2, 'crisis'),
            createEscalationBranch(nodeCounter++, 2, 'managed')
          );
        } else {
          childNode.children.push(
            createEscalationBranch(nodeCounter++, 2, 'opportunity'),
            createEscalationBranch(nodeCounter++, 2, 'stable')
          );
        }

        root.children.push(childNode);
      }
    }
  }

  // Add branches from suites
  for (const suite of sourceData.suites) {
    for (const item of suite.items) {
      const childNode: BranchingNode = {
        id: `node-${nodeCounter++}`,
        label: `Suite Item: ${item.itemId}`,
        probability: 0.5,
        source: 'suite',
        sourceId: suite.suiteId,
        children: [],
        metadata: {
          depth: 1,
          itemId: item.itemId,
          orderIndex: item.orderIndex,
        },
      };

      root.children.push(childNode);
    }
  }

  // If no source data, create default branches
  if (root.children.length === 0) {
    root.children = [
      createDefaultBranch(nodeCounter++, 'Best Case', 0.25),
      createDefaultBranch(nodeCounter++, 'Likely Case', 0.5),
      createDefaultBranch(nodeCounter++, 'Worst Case', 0.25),
    ];
  }

  // Limit branching factor
  if (root.children.length > parameters.branchingFactor) {
    root.children = root.children.slice(0, parameters.branchingFactor);
  }

  // Compute max depth
  const maxDepth = computeMaxDepth(root);

  return {
    rootNode: root,
    totalBranches: countTotalBranches(root),
    maxDepth: Math.min(maxDepth, parameters.maxDepth),
  };
}

/**
 * Create escalation branch node
 */
function createEscalationBranch(
  nodeId: number,
  depth: number,
  type: 'crisis' | 'managed' | 'opportunity' | 'stable'
): BranchingNode {
  const labels: Record<string, string> = {
    crisis: 'Crisis Escalation',
    managed: 'Managed Response',
    opportunity: 'Opportunity Captured',
    stable: 'Stable State',
  };

  const probabilities: Record<string, number> = {
    crisis: 0.3,
    managed: 0.7,
    opportunity: 0.4,
    stable: 0.6,
  };

  return {
    id: `node-${nodeId}`,
    label: labels[type],
    probability: probabilities[type],
    source: 'computed',
    sourceId: null,
    children: [],
    metadata: { depth, escalationType: type },
  };
}

/**
 * Create default branch node
 */
function createDefaultBranch(
  nodeId: number,
  label: string,
  probability: number
): BranchingNode {
  return {
    id: `node-${nodeId}`,
    label,
    probability,
    source: 'computed',
    sourceId: null,
    children: [],
    metadata: { depth: 1 },
  };
}

/**
 * Compute max depth of branching structure
 */
function computeMaxDepth(node: BranchingNode): number {
  if (node.children.length === 0) {
    return 0;
  }
  return 1 + Math.max(...node.children.map(computeMaxDepth));
}

/**
 * Count total branches in structure
 */
function countTotalBranches(node: BranchingNode): number {
  let count = node.children.length;
  for (const child of node.children) {
    count += countTotalBranches(child);
  }
  return count;
}

/**
 * Run probability model
 */
async function runProbabilityModel(
  structure: BranchingStructure,
  parameters: RealityMapParameters
): Promise<Map<string, ProbabilityModelResult>> {
  const results = new Map<string, ProbabilityModelResult>();

  // Process nodes recursively
  const processNode = (node: BranchingNode, cumulativeProb: number) => {
    const nodeProb = node.probability * cumulativeProb;

    results.set(node.id, {
      nodeId: node.id,
      probability: node.probability,
      confidence: parameters.probabilityModel === 'expert_adjusted' ? 0.7 : 0.8,
      methodology: parameters.probabilityModel,
      inputs: node.metadata.drivers as string[] || [],
      adjustments: [],
    });

    for (const child of node.children) {
      processNode(child, nodeProb);
    }
  };

  processNode(structure.rootNode, 1.0);

  return results;
}

/**
 * Generate node narratives using LLM
 */
async function generateNodeNarratives(
  structure: BranchingStructure,
  parameters: RealityMapParameters
): Promise<Map<string, NodeNarrativeResult>> {
  const results = new Map<string, NodeNarrativeResult>();

  const processNode = async (node: BranchingNode, parentLabel: string | null) => {
    const startTime = Date.now();

    try {
      const prompt = buildNarrativePrompt(node, parentLabel, parameters.narrativeStyle);

      const response = await routeLLM({
        systemPrompt: 'You are an expert scenario analyst. Generate concise, actionable narratives for scenario outcomes.',
        userPrompt: prompt,
        temperature: 0.6,
      });

      const content = response.content;

      results.set(node.id, {
        nodeId: node.id,
        summary: content.slice(0, 1000),
        delta: parentLabel ? `Evolved from: ${parentLabel}` : null,
        drivers: extractDriversFromNarrative(content),
        tokensUsed: content.length / 4,
        generationTime: Date.now() - startTime,
      });
    } catch (error) {
      results.set(node.id, {
        nodeId: node.id,
        summary: node.label,
        delta: null,
        drivers: [],
        tokensUsed: 0,
        generationTime: Date.now() - startTime,
      });
    }

    for (const child of node.children) {
      await processNode(child, node.label);
    }
  };

  await processNode(structure.rootNode, null);

  return results;
}

/**
 * Build narrative generation prompt
 */
function buildNarrativePrompt(
  node: BranchingNode,
  parentLabel: string | null,
  style: string
): string {
  const styleGuide = {
    executive: 'Use executive-level language. Focus on strategic implications and decision points.',
    detailed: 'Provide detailed analysis with supporting evidence and reasoning.',
    technical: 'Use technical language. Focus on operational details and metrics.',
    strategic: 'Focus on long-term strategic positioning and competitive advantage.',
  };

  return `Generate a ${style} narrative for this scenario outcome:

Label: ${node.label}
Probability: ${(node.probability * 100).toFixed(1)}%
${parentLabel ? `Previous State: ${parentLabel}` : 'This is the starting state.'}
${node.metadata.riskLevel ? `Risk Level: ${node.metadata.riskLevel}` : ''}
${node.metadata.drivers ? `Key Drivers: ${(node.metadata.drivers as string[]).join(', ')}` : ''}

Style: ${styleGuide[style as keyof typeof styleGuide] || styleGuide.executive}

Provide a 2-3 sentence summary of this scenario state and its implications.`;
}

/**
 * Extract key drivers from narrative
 */
function extractDriversFromNarrative(narrative: string): KeyDriver[] {
  // Simple extraction - in production would use NLP
  const drivers: KeyDriver[] = [];
  const keywords = ['because', 'due to', 'driven by', 'caused by', 'resulting from'];

  for (const keyword of keywords) {
    const idx = narrative.toLowerCase().indexOf(keyword);
    if (idx !== -1) {
      const snippet = narrative.slice(idx + keyword.length, idx + keyword.length + 100);
      const endIdx = snippet.search(/[.!?]/);
      const driverText = endIdx > 0 ? snippet.slice(0, endIdx) : snippet;

      drivers.push({
        id: `driver-${drivers.length}`,
        name: driverText.trim().slice(0, 50),
        description: driverText.trim(),
        impact: 'medium',
        direction: 'neutral',
        source: 'narrative',
        confidence: 0.7,
      });
    }
  }

  return drivers.slice(0, 3);
}

/**
 * Compute risk and opportunity scores
 */
async function computeRiskOpportunityScores(
  structure: BranchingStructure,
  sourceData: { simulations: SimulationDataForIngestion[]; suites: SuiteDataForIngestion[] }
): Promise<Map<string, ScoreComputationResult>> {
  const results = new Map<string, ScoreComputationResult>();

  // Build simulation lookup
  const simLookup = new Map<string, SimulationDataForIngestion>();
  for (const sim of sourceData.simulations) {
    simLookup.set(sim.simulationId, sim);
  }

  const processNode = (node: BranchingNode) => {
    let riskScore = 50;
    let opportunityScore = 50;
    const riskFactors: RealityMapRiskFactor[] = [];
    const opportunityFactors: OpportunityFactor[] = [];

    // Get scores from source simulation if available
    if (node.source === 'simulation' && node.sourceId) {
      const sim = simLookup.get(node.sourceId);
      if (sim) {
        riskScore = sim.riskAssessment.overallScore;
        opportunityScore = sim.opportunityAssessment.overallScore;
        riskFactors.push(...sim.riskAssessment.factors);
        opportunityFactors.push(...sim.opportunityAssessment.factors);
      }
    }

    // Adjust based on metadata
    const riskLevel = node.metadata.riskLevel as string;
    if (riskLevel === 'critical') riskScore = Math.min(100, riskScore + 30);
    if (riskLevel === 'high') riskScore = Math.min(100, riskScore + 15);
    if (riskLevel === 'low') riskScore = Math.max(0, riskScore - 15);

    const escalationType = node.metadata.escalationType as string;
    if (escalationType === 'crisis') riskScore = Math.min(100, riskScore + 20);
    if (escalationType === 'opportunity') opportunityScore = Math.min(100, opportunityScore + 20);

    results.set(node.id, {
      nodeId: node.id,
      riskScore,
      opportunityScore,
      riskFactors,
      opportunityFactors,
      methodology: 'weighted_composite',
    });

    for (const child of node.children) {
      processNode(child);
    }
  };

  processNode(structure.rootNode);

  return results;
}

/**
 * Build and persist graph to database
 */
async function buildGraph(
  mapId: string,
  structure: BranchingStructure,
  probabilityResults: Map<string, ProbabilityModelResult>,
  narrativeResults: Map<string, NodeNarrativeResult>,
  scoreResults: Map<string, ScoreComputationResult>
): Promise<{ nodesCreated: number; edgesCreated: number }> {
  const supabase = getSupabaseClient();
  const nodeIdMap = new Map<string, string>(); // temp ID -> DB ID
  let nodesCreated = 0;
  let edgesCreated = 0;
  let generationOrder = 0;

  const persistNode = async (
    node: BranchingNode,
    parentDbId: string | null,
    pathIndex: string
  ): Promise<string> => {
    const probResult = probabilityResults.get(node.id);
    const narrativeResult = narrativeResults.get(node.id);
    const scoreResult = scoreResults.get(node.id);

    const depth = (node.metadata.depth as number) || 0;

    const { data: nodeData, error } = await supabase
      .from('reality_map_nodes')
      .insert({
        reality_map_id: mapId,
        parent_node_id: parentDbId,
        node_type: depth === 0 ? 'root' : node.children.length === 0 ? 'leaf' : 'branch',
        depth,
        path_index: pathIndex,
        label: node.label,
        probability: node.probability,
        cumulative_probability: probResult?.probability || node.probability,
        risk_score: scoreResult?.riskScore || 50,
        opportunity_score: scoreResult?.opportunityScore || 50,
        confidence_score: probResult?.confidence || 0.8,
        ai_summary: narrativeResult?.summary || node.label,
        narrative_delta: narrativeResult?.delta,
        key_drivers: narrativeResult?.drivers || [],
        simulation_id: node.source === 'simulation' ? node.sourceId : null,
        snapshot: node.metadata,
        risk_factors: scoreResult?.riskFactors || [],
        opportunity_factors: scoreResult?.opportunityFactors || [],
        generation_order: generationOrder++,
        processing_time_ms: narrativeResult?.generationTime,
        tokens_used: narrativeResult?.tokensUsed || 0,
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to create node: ${error.message}`);
    }

    const dbId = nodeData.id;
    nodeIdMap.set(node.id, dbId);
    nodesCreated++;

    // Create edge from parent
    if (parentDbId) {
      const { error: edgeError } = await supabase.from('reality_map_edges').insert({
        reality_map_id: mapId,
        parent_node_id: parentDbId,
        child_node_id: dbId,
        trigger: {
          type: 'simulation_outcome',
          condition: node.label,
        },
        trigger_type: 'simulation_outcome',
        transition_probability: node.probability,
        label: node.label,
        weight: 1.0,
      });

      if (!edgeError) {
        edgesCreated++;
      }
    }

    // Process children
    for (let i = 0; i < node.children.length; i++) {
      const childPathIndex = pathIndex ? `${pathIndex}.${i}` : `${i}`;
      await persistNode(node.children[i], dbId, childPathIndex);
    }

    return dbId;
  };

  await persistNode(structure.rootNode, null, '0');

  return { nodesCreated, edgesCreated };
}

/**
 * Compute and persist paths
 */
async function computePaths(mapId: string): Promise<number> {
  const supabase = getSupabaseClient();

  // Get all leaf nodes
  const { data: leafNodes } = await supabase
    .from('reality_map_nodes')
    .select('*')
    .eq('reality_map_id', mapId)
    .eq('node_type', 'leaf');

  if (!leafNodes || leafNodes.length === 0) {
    return 0;
  }

  let pathsComputed = 0;

  for (const leaf of leafNodes) {
    // Build path from leaf to root
    const pathNodes: string[] = [];
    let currentNode = leaf;
    let totalProbability = 1.0;
    let totalRisk = 0;
    let totalOpportunity = 0;
    let maxRisk = 0;
    let maxOpportunity = 0;

    while (currentNode) {
      pathNodes.unshift(currentNode.id);
      totalProbability *= currentNode.probability;
      totalRisk += currentNode.risk_score;
      totalOpportunity += currentNode.opportunity_score;
      maxRisk = Math.max(maxRisk, currentNode.risk_score);
      maxOpportunity = Math.max(maxOpportunity, currentNode.opportunity_score);

      if (currentNode.parent_node_id) {
        const { data: parent } = await supabase
          .from('reality_map_nodes')
          .select('*')
          .eq('id', currentNode.parent_node_id)
          .single();
        currentNode = parent;
      } else {
        break;
      }
    }

    // Determine outcome type
    let outcomeType: PathOutcomeType = 'balanced';
    if (maxRisk >= 80) outcomeType = 'worst_case';
    else if (maxOpportunity >= 80) outcomeType = 'best_case';
    else if (totalProbability >= 0.4) outcomeType = 'most_likely';
    else if (maxRisk >= 60) outcomeType = 'high_risk';
    else if (maxOpportunity >= 60) outcomeType = 'high_opportunity';

    const avgRisk = totalRisk / pathNodes.length;
    const avgOpportunity = totalOpportunity / pathNodes.length;

    await supabase.from('reality_map_paths').insert({
      reality_map_id: mapId,
      path_nodes: pathNodes,
      path_index: leaf.path_index,
      depth: pathNodes.length - 1,
      total_probability: totalProbability,
      avg_risk_score: avgRisk,
      avg_opportunity_score: avgOpportunity,
      max_risk_score: maxRisk,
      max_opportunity_score: maxOpportunity,
      path_title: `Path to: ${leaf.label}`,
      outcome_type: outcomeType,
    });

    pathsComputed++;
  }

  return pathsComputed;
}

// ============================================================================
// GRAPH RETRIEVAL
// ============================================================================

/**
 * Get graph data for visualization
 */
export async function getGraph(
  orgId: string,
  mapId: string
): Promise<GetRealityMapGraphResponse> {
  const supabase = getSupabaseClient();

  // Verify map belongs to org
  const { data: mapData } = await supabase
    .from('reality_maps')
    .select('id')
    .eq('id', mapId)
    .eq('org_id', orgId)
    .single();

  if (!mapData) {
    throw new Error('Reality map not found');
  }

  // Get all nodes
  const { data: nodesData } = await supabase
    .from('reality_map_nodes')
    .select('*')
    .eq('reality_map_id', mapId)
    .order('depth', { ascending: true });

  // Get all edges
  const { data: edgesData } = await supabase
    .from('reality_map_edges')
    .select('*')
    .eq('reality_map_id', mapId);

  // Get all paths
  const { data: pathsData } = await supabase
    .from('reality_map_paths')
    .select('*')
    .eq('reality_map_id', mapId);

  // Build child IDs map
  const childIdsMap = new Map<string, string[]>();
  for (const edge of edgesData || []) {
    const existing = childIdsMap.get(edge.parent_node_id) || [];
    existing.push(edge.child_node_id);
    childIdsMap.set(edge.parent_node_id, existing);
  }

  // Convert to graph format
  const nodes: RealityMapGraphNode[] = (nodesData || []).map((node: Record<string, unknown>, idx: number) => ({
    id: node.id as string,
    label: (node.label as string) || `Node ${idx + 1}`,
    type: node.node_type as RealityMapNodeType,
    depth: node.depth as number,
    probability: node.probability as number,
    cumulativeProbability: node.cumulative_probability as number,
    riskScore: node.risk_score as number,
    opportunityScore: node.opportunity_score as number,
    summary: (node.ai_summary as string | undefined) ?? null,
    parentId: node.parent_node_id as string | null,
    childIds: childIdsMap.get(node.id as string) || [],
    position: computeNodePosition(node.depth as number, idx, (nodesData || []).length),
    color: getNodeColor(node.node_type as RealityMapNodeType, node.risk_score as number),
    size: Math.max(20, (node.probability as number) * 50),
  }));

  const edges: RealityMapGraphEdge[] = (edgesData || []).map((edge: Record<string, unknown>) => ({
    id: edge.id as string,
    source: edge.parent_node_id as string,
    target: edge.child_node_id as string,
    label: (edge.label as string | undefined) ?? null,
    probability: edge.transition_probability as number,
    triggerType: (edge.trigger_type as EdgeTriggerType | undefined) ?? null,
    weight: edge.weight as number,
    color: '#9CA3AF',
    animated: false,
  }));

  const paths = (pathsData || []).map(dbRowToPath);

  // Find special nodes/paths
  const rootNode = nodes.find((n) => n.type === 'root');
  const leafNodes = nodes.filter((n) => n.type === 'leaf');
  const mostLikelyPath = paths.sort((a, b) => b.totalProbability - a.totalProbability)[0];
  const highestRiskPath = paths.sort((a, b) => b.maxRiskScore - a.maxRiskScore)[0];
  const highestOpportunityPath = paths.sort(
    (a, b) => b.maxOpportunityScore - a.maxOpportunityScore
  )[0];

  const metadata: GraphMetadata = {
    totalNodes: nodes.length,
    totalEdges: edges.length,
    totalPaths: paths.length,
    maxDepth: Math.max(...nodes.map((n) => n.depth), 0),
    rootNodeId: rootNode?.id || null,
    leafNodeIds: leafNodes.map((n) => n.id),
    mostLikelyPathId: mostLikelyPath?.id || null,
    highestRiskPathId: highestRiskPath?.id || null,
    highestOpportunityPathId: highestOpportunityPath?.id || null,
    generationTime: null,
  };

  return {
    success: true,
    graph: { nodes, edges, paths, metadata },
  };
}

/**
 * Compute node position for visualization
 */
function computeNodePosition(
  depth: number,
  index: number,
  totalNodes: number
): { x: number; y: number } {
  const xSpacing = 200;
  const ySpacing = 100;

  return {
    x: depth * xSpacing,
    y: (index - totalNodes / 2) * ySpacing,
  };
}

/**
 * Get node color based on type and risk
 */
function getNodeColor(nodeType: RealityMapNodeType, riskScore: number): string {
  if (nodeType === 'root') return '#6366F1'; // indigo
  if (riskScore >= 80) return '#EF4444'; // red
  if (riskScore >= 60) return '#F97316'; // orange
  if (riskScore >= 40) return '#EAB308'; // yellow
  return '#22C55E'; // green
}

// ============================================================================
// ANALYSIS ENGINE
// ============================================================================

/**
 * Get analysis for reality map
 */
export async function getAnalysis(
  orgId: string,
  mapId: string
): Promise<GetRealityMapAnalysisResponse> {
  const supabase = getSupabaseClient();

  // Verify map
  const { data: mapData } = await supabase
    .from('reality_maps')
    .select('*')
    .eq('id', mapId)
    .eq('org_id', orgId)
    .single();

  if (!mapData) {
    throw new Error('Reality map not found');
  }

  // Update analysis status
  await supabase
    .from('reality_maps')
    .update({ analysis_status: 'running' })
    .eq('id', mapId);

  try {
    // Generate outcome universe
    const outcomeUniverse = await generateOutcomeUniverse(mapId);

    // Compute path comparisons
    const pathComparisons = await computePathComparisons(mapId);

    // Compute narrative delta
    const narrativeDelta = await computeNarrativeDelta(mapId);

    // Detect contradictions
    const contradictions = await detectContradictions(mapId);

    // Detect correlations
    const correlations = await detectCorrelations(mapId);

    // Generate recommendations
    const recommendations = await generateRecommendations(mapId, outcomeUniverse);

    // Update map with analysis results
    await supabase
      .from('reality_maps')
      .update({
        analysis_status: 'completed',
        executive_summary: outcomeUniverse.executiveSummary,
      })
      .eq('id', mapId);

    const analysis: RealityMapAnalysisResponse = {
      mapId,
      analysisTimestamp: new Date().toISOString(),
      outcomeUniverse,
      pathComparisons,
      narrativeDelta,
      contradictions,
      correlations,
      recommendations,
      confidence: 0.85,
      aggregatedRisks: [],
      aggregatedOpportunities: [],
    };

    return {
      success: true,
      analysis,
    };
  } catch (error) {
    await supabase
      .from('reality_maps')
      .update({ analysis_status: 'failed' })
      .eq('id', mapId);

    throw error;
  }
}

/**
 * Generate outcome universe
 */
async function generateOutcomeUniverse(mapId: string): Promise<OutcomeUniverse> {
  const supabase = getSupabaseClient();

  // Get paths
  const { data: paths } = await supabase
    .from('reality_map_paths')
    .select('*')
    .eq('reality_map_id', mapId)
    .order('total_probability', { ascending: false });

  // Get nodes
  const { data: nodes } = await supabase
    .from('reality_map_nodes')
    .select('*')
    .eq('reality_map_id', mapId);

  const totalRealities = paths?.length || 0;
  const branchingNodes = nodes?.filter((n) => n.node_type === 'branch').length || 0;

  // Build probability distribution
  const probabilityWeightedOutcomes: ProbabilityDistribution[] = [];
  let cumulativeProb = 0;

  for (const path of paths || []) {
    cumulativeProb += path.total_probability;
    probabilityWeightedOutcomes.push({
      pathId: path.id,
      probability: path.total_probability,
      cumulativeProbability: cumulativeProb,
      percentile: cumulativeProb * 100,
      outcomeType: path.outcome_type || 'balanced',
    });
  }

  // Find scenario extremes
  const bestCase = paths?.find((p) => p.outcome_type === 'best_case');
  const worstCase = paths?.find((p) => p.outcome_type === 'worst_case');
  const mostLikely = paths?.sort(
    (a, b) => b.total_probability - a.total_probability
  )[0];

  // Generate executive summary
  const executiveSummary = await generateExecutiveSummary(
    totalRealities,
    branchingNodes,
    paths || []
  );

  // Build heatmaps
  const riskHeatmap: Record<string, number> = {};
  const opportunityHeatmap: Record<string, number> = {};

  for (const node of nodes || []) {
    const category = node.label || 'Unknown';
    riskHeatmap[category] = node.risk_score;
    opportunityHeatmap[category] = node.opportunity_score;
  }

  return {
    totalRealities,
    totalBranchingNodes: branchingNodes,
    probabilityWeightedOutcomes,
    executiveSummary,
    bestCaseScenario: bestCase ? buildPathSummary(bestCase) : null,
    worstCaseScenario: worstCase ? buildPathSummary(worstCase) : null,
    mostLikelyScenario: mostLikely ? buildPathSummary(mostLikely) : null,
    riskHeatmap,
    opportunityHeatmap,
    timelineProjection: [],
  };
}

/**
 * Build path summary from path data
 */
function buildPathSummary(path: Record<string, unknown>): RealityPathSummary {
  const maxRisk = path.max_risk_score as number;

  return {
    pathId: path.id as string,
    title: (path.path_title as string) || 'Untitled Path',
    description: (path.path_summary as string) || 'No description available',
    probability: path.total_probability as number,
    riskLevel: maxRisk >= 80 ? 'critical' : maxRisk >= 60 ? 'high' : maxRisk >= 40 ? 'medium' : 'low',
    opportunityLevel:
      (path.max_opportunity_score as number) >= 70
        ? 'high'
        : (path.max_opportunity_score as number) >= 40
          ? 'medium'
          : 'low',
    nodeCount: ((path.path_nodes as string[]) || []).length,
    keyEvents: [],
    finalOutcome: (path.outcome_type as string) || 'balanced',
    recommendedActions: [],
  };
}

/**
 * Generate executive summary using LLM
 */
async function generateExecutiveSummary(
  totalRealities: number,
  branchingNodes: number,
  paths: Record<string, unknown>[]
): Promise<string> {
  try {
    const prompt = `Generate a brief executive summary (2-3 sentences) for a scenario analysis with:
- ${totalRealities} possible outcome paths
- ${branchingNodes} key decision/branching points
- Probability range: ${paths.length > 0 ? `${((paths[paths.length - 1].total_probability as number) * 100).toFixed(1)}% to ${((paths[0].total_probability as number) * 100).toFixed(1)}%` : 'N/A'}

Focus on strategic implications and key takeaways for executive decision-making.`;

    const response = await routeLLM({
      systemPrompt: 'You are an executive strategy advisor.',
      userPrompt: prompt,
      temperature: 0.5,
    });

    return response.content;
  } catch (error) {
    return `Analysis identified ${totalRealities} possible outcomes across ${branchingNodes} decision points. Review recommended.`;
  }
}

/**
 * Compute path comparisons
 */
async function computePathComparisons(mapId: string): Promise<PathComparisonResult[]> {
  const supabase = getSupabaseClient();

  const { data: paths } = await supabase
    .from('reality_map_paths')
    .select('*')
    .eq('reality_map_id', mapId)
    .order('total_probability', { ascending: false })
    .limit(5);

  if (!paths || paths.length < 2) {
    return [];
  }

  const comparisons: PathComparisonResult[] = [];

  // Compare top paths
  for (let i = 0; i < paths.length - 1; i++) {
    const path1 = paths[i];
    const path2 = paths[i + 1];

    comparisons.push({
      path1Id: path1.id,
      path2Id: path2.id,
      similarities: ['Both originate from same root state'],
      differences: [
        `Path 1 has ${((path1.total_probability - path2.total_probability) * 100).toFixed(1)}% higher probability`,
        `Risk difference: ${path1.avg_risk_score - path2.avg_risk_score} points`,
      ],
      probabilityDelta: path1.total_probability - path2.total_probability,
      riskDelta: path1.avg_risk_score - path2.avg_risk_score,
      opportunityDelta: path1.avg_opportunity_score - path2.avg_opportunity_score,
      recommendation:
        path1.avg_risk_score > path2.avg_risk_score
          ? 'Consider mitigation strategies for higher-risk path'
          : 'Both paths present manageable risk profiles',
    });
  }

  return comparisons;
}

/**
 * Compute narrative delta
 */
async function computeNarrativeDelta(mapId: string): Promise<NarrativeDeltaResult> {
  const supabase = getSupabaseClient();

  const { data: nodes } = await supabase
    .from('reality_map_nodes')
    .select('id, label, narrative_delta')
    .eq('reality_map_id', mapId);

  const nodeDeltas: Record<string, string> = {};
  for (const node of nodes || []) {
    if (node.narrative_delta) {
      nodeDeltas[node.id] = node.narrative_delta;
    }
  }

  return {
    overallDelta: 'Scenario evolution tracked across all nodes',
    nodeDeltas,
    emergingThemes: ['Risk escalation', 'Opportunity windows'],
    fadingThemes: [],
    pivotPoints: (nodes || [])
      .filter((n) => n.label?.toLowerCase().includes('decision'))
      .map((n) => n.id),
  };
}

/**
 * Detect contradictions in the map
 */
async function detectContradictions(mapId: string): Promise<DetectedContradiction[]> {
  const supabase = getSupabaseClient();

  const { data: paths } = await supabase
    .from('reality_map_paths')
    .select('*')
    .eq('reality_map_id', mapId);

  const contradictions: DetectedContradiction[] = [];

  // Check for probability inconsistencies
  const totalProb = (paths || []).reduce((sum, p) => sum + p.total_probability, 0);
  if (totalProb > 1.1) {
    contradictions.push({
      id: 'prob-overflow',
      type: 'probabilistic',
      description: `Total path probabilities exceed 100% (${(totalProb * 100).toFixed(1)}%)`,
      affectedNodes: [],
      severity: 'medium',
      resolution: 'Normalize probabilities across paths',
    });
  }

  return contradictions;
}

/**
 * Detect correlations in the map
 */
async function detectCorrelations(mapId: string): Promise<DetectedCorrelation[]> {
  const supabase = getSupabaseClient();

  const { data: nodes } = await supabase
    .from('reality_map_nodes')
    .select('*')
    .eq('reality_map_id', mapId);

  const correlations: DetectedCorrelation[] = [];

  // Check for risk-opportunity correlation
  const avgRisk = (nodes || []).reduce((sum, n) => sum + n.risk_score, 0) / (nodes?.length || 1);
  const avgOpp = (nodes || []).reduce((sum, n) => sum + n.opportunity_score, 0) / (nodes?.length || 1);

  if (Math.abs(avgRisk - avgOpp) < 20) {
    correlations.push({
      id: 'risk-opp-balance',
      type: 'positive',
      strength: 0.7,
      factor1: 'Risk Level',
      factor2: 'Opportunity Level',
      description: 'Risk and opportunity levels are balanced across scenarios',
      affectedPaths: [],
      confidence: 0.8,
    });
  }

  return correlations;
}

/**
 * Generate recommendations
 */
async function generateRecommendations(
  _mapId: string,
  universe: OutcomeUniverse
): Promise<RealityMapActionRecommendation[]> {
  const recommendations: RealityMapActionRecommendation[] = [];

  // Based on worst case scenario
  if (universe.worstCaseScenario && universe.worstCaseScenario.riskLevel === 'critical') {
    recommendations.push({
      id: 'rec-1',
      action: 'Develop contingency plans for high-risk scenarios',
      priority: 'critical',
      category: 'Risk Mitigation',
      expectedImpact: 'Reduce potential damage from worst-case outcomes',
      timeframe: 'Immediate',
      resources: ['Crisis team', 'Legal counsel'],
      dependencies: [],
    });
  }

  // Based on best case scenario
  if (universe.bestCaseScenario && universe.bestCaseScenario.opportunityLevel === 'high') {
    recommendations.push({
      id: 'rec-2',
      action: 'Prepare to capitalize on favorable outcomes',
      priority: 'high',
      category: 'Opportunity Capture',
      expectedImpact: 'Maximize value from positive scenarios',
      timeframe: 'Short-term',
      resources: ['Strategy team', 'Business development'],
      dependencies: [],
    });
  }

  // General recommendation
  recommendations.push({
    id: 'rec-3',
    action: 'Monitor key decision points for early warning signals',
    priority: 'medium',
    category: 'Monitoring',
    expectedImpact: 'Enable proactive response to scenario changes',
    timeframe: 'Ongoing',
    resources: ['Analytics team'],
    dependencies: [],
  });

  return recommendations;
}

// ============================================================================
// STATS & UTILITIES
// ============================================================================

/**
 * Compute stats for a map
 */
async function computeMapStats(mapId: string): Promise<RealityMapStats | null> {
  const supabase = getSupabaseClient();

  const { data: nodes } = await supabase
    .from('reality_map_nodes')
    .select('*')
    .eq('reality_map_id', mapId);

  const { data: edges } = await supabase
    .from('reality_map_edges')
    .select('id')
    .eq('reality_map_id', mapId);

  const { data: paths } = await supabase
    .from('reality_map_paths')
    .select('id')
    .eq('reality_map_id', mapId);

  if (!nodes || nodes.length === 0) {
    return null;
  }

  const leafNodes = nodes.filter((n) => n.node_type === 'leaf');
  const branchNodes = nodes.filter((n) => n.node_type === 'branch');

  return {
    totalNodes: nodes.length,
    totalEdges: edges?.length || 0,
    totalPaths: paths?.length || 0,
    maxDepth: Math.max(...nodes.map((n) => n.depth)),
    avgProbability: nodes.reduce((sum, n) => sum + n.probability, 0) / nodes.length,
    avgRiskScore: nodes.reduce((sum, n) => sum + n.risk_score, 0) / nodes.length,
    avgOpportunityScore: nodes.reduce((sum, n) => sum + n.opportunity_score, 0) / nodes.length,
    leafNodeCount: leafNodes.length,
    branchNodeCount: branchNodes.length,
  };
}

/**
 * Get global stats for org
 */
export async function getGlobalStats(
  orgId: string
): Promise<GetRealityMapGlobalStatsResponse> {
  const supabase = getSupabaseClient();

  const { data: maps } = await supabase
    .from('reality_maps')
    .select('status, total_nodes, total_paths')
    .eq('org_id', orgId);

  if (!maps) {
    return {
      totalMaps: 0,
      completedMaps: 0,
      generatingMaps: 0,
      failedMaps: 0,
      totalNodes: 0,
      totalPaths: 0,
      avgNodesPerMap: 0,
      avgPathsPerMap: 0,
    };
  }

  const completed = maps.filter((m) => m.status === 'completed');
  const generating = maps.filter((m) => m.status === 'generating');
  const failed = maps.filter((m) => m.status === 'failed');

  const totalNodes = maps.reduce((sum, m) => sum + (m.total_nodes || 0), 0);
  const totalPaths = maps.reduce((sum, m) => sum + (m.total_paths || 0), 0);

  return {
    totalMaps: maps.length,
    completedMaps: completed.length,
    generatingMaps: generating.length,
    failedMaps: failed.length,
    totalNodes,
    totalPaths,
    avgNodesPerMap: maps.length > 0 ? totalNodes / maps.length : 0,
    avgPathsPerMap: maps.length > 0 ? totalPaths / maps.length : 0,
  };
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

/**
 * Log audit event
 */
async function logAuditEvent(
  mapId: string,
  nodeId: string | null,
  actorId: string | null,
  eventType: string,
  details: Record<string, unknown>
): Promise<void> {
  const supabase = getSupabaseClient();

  await supabase.from('reality_map_audit_log').insert({
    reality_map_id: mapId,
    node_id: nodeId,
    actor_id: actorId,
    event_type: eventType,
    details,
  });
}

/**
 * List audit events
 */
export async function listAuditEvents(
  orgId: string,
  mapId: string,
  query: { limit?: number; offset?: number; eventType?: string }
): Promise<{ events: RealityMapAuditLog[]; total: number }> {
  const supabase = getSupabaseClient();

  // Verify map belongs to org
  const { data: mapData } = await supabase
    .from('reality_maps')
    .select('id')
    .eq('id', mapId)
    .eq('org_id', orgId)
    .single();

  if (!mapData) {
    throw new Error('Reality map not found');
  }

  let queryBuilder = supabase
    .from('reality_map_audit_log')
    .select('*', { count: 'exact' })
    .eq('reality_map_id', mapId)
    .order('created_at', { ascending: false });

  if (query.eventType) {
    queryBuilder = queryBuilder.eq('event_type', query.eventType);
  }

  const limit = query.limit || 50;
  const offset = query.offset || 0;
  queryBuilder = queryBuilder.range(offset, offset + limit - 1);

  const { data, error, count } = await queryBuilder;

  if (error) {
    throw new Error(`Failed to list audit events: ${error.message}`);
  }

  return {
    events: (data || []).map(dbRowToAuditLog),
    total: count || 0,
  };
}
