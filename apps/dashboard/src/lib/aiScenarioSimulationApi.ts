/**
 * AI Scenario Simulation API Client Helpers (Sprint S71)
 * Client-side API functions for autonomous multi-agent simulations
 */

import type {
  AIScenarioSimulation,
  AIScenarioRun,
  AIScenarioAuditLogEntry,
  AIScenarioSimulationStats,
  CreateAISimulationInput,
  UpdateAISimulationInput,
  ListAISimulationsQuery,
  ListAISimulationsResponse,
  StartSimulationRunInput,
  ListSimulationRunsQuery,
  ListSimulationRunsResponse,
  AISimulationRunDetailResponse,
  StepRunInput,
  RunUntilConvergedInput,
  RunUntilConvergedResponse,
  PostAgentFeedbackInput,
  PostAgentFeedbackResponse,
  ListRunTurnsQuery,
  ListRunTurnsResponse,
  ListRunMetricsQuery,
  ListRunMetricsResponse,
  ListRunOutcomesQuery,
  ListRunOutcomesResponse,
  SummarizeOutcomesInput,
  SummarizeOutcomesResponse,
  ArchiveSimulationResponse,
} from '@pravado/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const BASE_PATH = '/api/v1/ai-scenario-simulations';

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
// SIMULATION CRUD
// ============================================================================

/**
 * List AI scenario simulations
 */
export async function listSimulations(
  query?: Partial<ListAISimulationsQuery>
): Promise<ListAISimulationsResponse> {
  const params = new URLSearchParams();
  if (query?.search) params.set('search', query.search);
  if (query?.status) params.set('status', query.status);
  if (query?.objectiveType) params.set('objectiveType', query.objectiveType);
  if (query?.simulationMode) params.set('simulationMode', query.simulationMode);
  if (query?.linkedPlaybookId) params.set('linkedPlaybookId', query.linkedPlaybookId);
  if (query?.sortBy) params.set('sortBy', query.sortBy);
  if (query?.sortOrder) params.set('sortOrder', query.sortOrder);
  if (query?.limit) params.set('limit', String(query.limit));
  if (query?.offset) params.set('offset', String(query.offset));

  const queryString = params.toString();
  const url = `${BASE_PATH}/simulations${queryString ? `?${queryString}` : ''}`;

  return fetchWithAuth<ListAISimulationsResponse>(url);
}

/**
 * Get a simulation by ID
 */
export async function getSimulation(id: string): Promise<{ simulation: AIScenarioSimulation }> {
  return fetchWithAuth<{ simulation: AIScenarioSimulation }>(
    `${BASE_PATH}/simulations/${id}`
  );
}

/**
 * Create a new simulation
 */
export async function createSimulation(
  input: CreateAISimulationInput
): Promise<{ simulation: AIScenarioSimulation }> {
  return fetchWithAuth<{ simulation: AIScenarioSimulation }>(
    `${BASE_PATH}/simulations`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    }
  );
}

/**
 * Update a simulation
 */
export async function updateSimulation(
  id: string,
  input: UpdateAISimulationInput
): Promise<{ simulation: AIScenarioSimulation }> {
  return fetchWithAuth<{ simulation: AIScenarioSimulation }>(
    `${BASE_PATH}/simulations/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    }
  );
}

/**
 * Archive a simulation
 */
export async function archiveSimulation(
  id: string,
  reason?: string
): Promise<ArchiveSimulationResponse> {
  return fetchWithAuth<ArchiveSimulationResponse>(
    `${BASE_PATH}/simulations/${id}/archive`,
    {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }
  );
}

/**
 * Delete a simulation permanently
 */
export async function deleteSimulation(id: string): Promise<void> {
  await fetchWithAuth<void>(`${BASE_PATH}/simulations/${id}`, {
    method: 'DELETE',
  });
}

// ============================================================================
// RUN LIFECYCLE
// ============================================================================

/**
 * Start a new simulation run
 */
export async function startRun(
  simulationId: string,
  input?: StartSimulationRunInput
): Promise<{ run: AIScenarioRun }> {
  return fetchWithAuth<{ run: AIScenarioRun }>(
    `${BASE_PATH}/simulations/${simulationId}/runs`,
    {
      method: 'POST',
      body: JSON.stringify(input || {}),
    }
  );
}

/**
 * List runs for a simulation
 */
export async function listRuns(
  simulationId: string,
  query?: Partial<ListSimulationRunsQuery>
): Promise<ListSimulationRunsResponse> {
  const params = new URLSearchParams();
  if (query?.status) params.set('status', query.status);
  if (query?.riskLevel) params.set('riskLevel', query.riskLevel);
  if (query?.sortBy) params.set('sortBy', query.sortBy);
  if (query?.sortOrder) params.set('sortOrder', query.sortOrder);
  if (query?.limit) params.set('limit', String(query.limit));
  if (query?.offset) params.set('offset', String(query.offset));

  const queryString = params.toString();
  const url = `${BASE_PATH}/simulations/${simulationId}/runs${queryString ? `?${queryString}` : ''}`;

  return fetchWithAuth<ListSimulationRunsResponse>(url);
}

/**
 * Get run details
 */
export async function getRunDetail(runId: string): Promise<AISimulationRunDetailResponse> {
  return fetchWithAuth<AISimulationRunDetailResponse>(`${BASE_PATH}/runs/${runId}`);
}

/**
 * Advance run by one step
 */
export async function stepRun(
  runId: string,
  input?: StepRunInput
): Promise<{ run: AIScenarioRun }> {
  return fetchWithAuth<{ run: AIScenarioRun }>(
    `${BASE_PATH}/runs/${runId}/step`,
    {
      method: 'POST',
      body: JSON.stringify(input || {}),
    }
  );
}

/**
 * Run until convergence or max steps
 */
export async function runToCompletion(
  runId: string,
  input?: RunUntilConvergedInput
): Promise<RunUntilConvergedResponse> {
  return fetchWithAuth<RunUntilConvergedResponse>(
    `${BASE_PATH}/runs/${runId}/run-to-completion`,
    {
      method: 'POST',
      body: JSON.stringify(input || {}),
    }
  );
}

/**
 * Post agent feedback during a run
 */
export async function postFeedback(
  runId: string,
  input: PostAgentFeedbackInput
): Promise<PostAgentFeedbackResponse> {
  return fetchWithAuth<PostAgentFeedbackResponse>(
    `${BASE_PATH}/runs/${runId}/feedback`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    }
  );
}

/**
 * Abort a running simulation
 */
export async function abortRun(runId: string): Promise<{ run: AIScenarioRun }> {
  return fetchWithAuth<{ run: AIScenarioRun }>(
    `${BASE_PATH}/runs/${runId}/abort`,
    {
      method: 'POST',
    }
  );
}

// ============================================================================
// OBSERVABILITY
// ============================================================================

/**
 * List turns for a run
 */
export async function listTurns(
  runId: string,
  query?: Partial<ListRunTurnsQuery>
): Promise<ListRunTurnsResponse> {
  const params = new URLSearchParams();
  if (query?.speakerAgentId) params.set('speakerAgentId', query.speakerAgentId);
  if (query?.channel) params.set('channel', query.channel);
  if (query?.stepIndex !== undefined) params.set('stepIndex', String(query.stepIndex));
  if (query?.sortOrder) params.set('sortOrder', query.sortOrder);
  if (query?.limit) params.set('limit', String(query.limit));
  if (query?.offset) params.set('offset', String(query.offset));

  const queryString = params.toString();
  const url = `${BASE_PATH}/runs/${runId}/turns${queryString ? `?${queryString}` : ''}`;

  return fetchWithAuth<ListRunTurnsResponse>(url);
}

/**
 * List metrics for a run
 */
export async function listMetrics(
  runId: string,
  query?: Partial<ListRunMetricsQuery>
): Promise<ListRunMetricsResponse> {
  const params = new URLSearchParams();
  if (query?.metricKey) params.set('metricKey', query.metricKey);
  if (query?.metricCategory) params.set('metricCategory', query.metricCategory);
  if (query?.stepIndex !== undefined) params.set('stepIndex', String(query.stepIndex));
  if (query?.sortOrder) params.set('sortOrder', query.sortOrder);
  if (query?.limit) params.set('limit', String(query.limit));
  if (query?.offset) params.set('offset', String(query.offset));

  const queryString = params.toString();
  const url = `${BASE_PATH}/runs/${runId}/metrics${queryString ? `?${queryString}` : ''}`;

  return fetchWithAuth<ListRunMetricsResponse>(url);
}

/**
 * List outcomes for a run
 */
export async function listOutcomes(
  runId: string,
  query?: Partial<ListRunOutcomesQuery>
): Promise<ListRunOutcomesResponse> {
  const params = new URLSearchParams();
  if (query?.outcomeType) params.set('outcomeType', query.outcomeType);
  if (query?.riskLevel) params.set('riskLevel', query.riskLevel);
  if (query?.sortOrder) params.set('sortOrder', query.sortOrder);
  if (query?.limit) params.set('limit', String(query.limit));
  if (query?.offset) params.set('offset', String(query.offset));

  const queryString = params.toString();
  const url = `${BASE_PATH}/runs/${runId}/outcomes${queryString ? `?${queryString}` : ''}`;

  return fetchWithAuth<ListRunOutcomesResponse>(url);
}

/**
 * Summarize outcomes for a run
 */
export async function summarizeOutcomes(
  runId: string,
  input?: SummarizeOutcomesInput
): Promise<SummarizeOutcomesResponse> {
  return fetchWithAuth<SummarizeOutcomesResponse>(
    `${BASE_PATH}/runs/${runId}/summarize`,
    {
      method: 'POST',
      body: JSON.stringify(input || {}),
    }
  );
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get simulation statistics
 */
export async function getStats(): Promise<{ stats: AIScenarioSimulationStats }> {
  return fetchWithAuth<{ stats: AIScenarioSimulationStats }>(`${BASE_PATH}/stats`);
}

// ============================================================================
// AUDIT LOGS
// ============================================================================

/**
 * List audit logs
 */
export async function listAuditLogs(query?: {
  simulationId?: string;
  runId?: string;
  eventType?: string;
  limit?: number;
  offset?: number;
}): Promise<{ auditLogs: AIScenarioAuditLogEntry[]; total: number }> {
  const params = new URLSearchParams();
  if (query?.simulationId) params.set('simulationId', query.simulationId);
  if (query?.runId) params.set('runId', query.runId);
  if (query?.eventType) params.set('eventType', query.eventType);
  if (query?.limit) params.set('limit', String(query.limit));
  if (query?.offset) params.set('offset', String(query.offset));

  const queryString = params.toString();
  const url = `${BASE_PATH}/audit${queryString ? `?${queryString}` : ''}`;

  return fetchWithAuth<{ auditLogs: AIScenarioAuditLogEntry[]; total: number }>(url);
}

// ============================================================================
// EXPORT NAMESPACE
// ============================================================================

export const aiScenarioSimulationApi = {
  // Simulations
  listSimulations,
  getSimulation,
  createSimulation,
  updateSimulation,
  archiveSimulation,
  deleteSimulation,

  // Runs
  startRun,
  listRuns,
  getRunDetail,
  stepRun,
  runToCompletion,
  postFeedback,
  abortRun,

  // Observability
  listTurns,
  listMetrics,
  listOutcomes,
  summarizeOutcomes,

  // Stats & Audit
  getStats,
  listAuditLogs,
};
