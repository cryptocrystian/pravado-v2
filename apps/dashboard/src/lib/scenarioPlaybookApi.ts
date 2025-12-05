/**
 * Scenario Playbook API Client Helpers (Sprint S67)
 * Client-side API functions for scenario simulation and playbook orchestration
 */

import type {
  ScenarioPlaybook,
  ScenarioPlaybookStep,
  Scenario,
  ScenarioRun,
  ScenarioRunStep,
  PlaybookWithSteps,
  ScenarioWithPlaybook,
  RunWithDetails,
  SimulationResult,
  CreateScenarioPlaybookInput,
  UpdateScenarioPlaybookInput,
  CreatePlaybookStepInput,
  UpdatePlaybookStepInput,
  ScenarioListPlaybooksQuery,
  ScenarioListPlaybooksResponse,
  CreateScenarioInput,
  UpdateScenarioInput,
  ListScenariosQuery,
  ListScenariosResponse,
  StartScenarioRunInput,
  ListScenarioRunsQuery,
  ListScenarioRunsResponse,
  ListScenarioAuditLogsQuery,
  ListScenarioAuditLogsResponse,
  ScenarioParameters,
  ScenarioPlaybookStatsResponse,
} from '@pravado/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const BASE_PATH = '/api/v1/scenario-playbooks';

interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      code: 'UNKNOWN_ERROR',
      message: `HTTP ${response.status}: ${response.statusText}`,
    }));
    throw new Error(error.message || 'Request failed');
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach((v) => searchParams.append(key, String(v)));
      } else {
        searchParams.append(key, String(value));
      }
    }
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

// =============================================================================
// PLAYBOOK OPERATIONS
// =============================================================================

/**
 * Create a new playbook
 */
export async function createPlaybook(input: CreateScenarioPlaybookInput): Promise<PlaybookWithSteps> {
  const response = await fetch(`${API_BASE_URL}${BASE_PATH}/playbooks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  return handleResponse<PlaybookWithSteps>(response);
}

/**
 * Get playbook by ID
 */
export async function getPlaybook(playbookId: string): Promise<ScenarioPlaybook> {
  const response = await fetch(`${API_BASE_URL}${BASE_PATH}/playbooks/${playbookId}`, {
    method: 'GET',
    credentials: 'include',
  });

  return handleResponse<ScenarioPlaybook>(response);
}

/**
 * Get playbook with steps
 */
export async function getPlaybookWithSteps(playbookId: string): Promise<PlaybookWithSteps> {
  const response = await fetch(`${API_BASE_URL}${BASE_PATH}/playbooks/${playbookId}/full`, {
    method: 'GET',
    credentials: 'include',
  });

  return handleResponse<PlaybookWithSteps>(response);
}

/**
 * Update playbook
 */
export async function updatePlaybook(
  playbookId: string,
  input: UpdateScenarioPlaybookInput
): Promise<ScenarioPlaybook> {
  const response = await fetch(`${API_BASE_URL}${BASE_PATH}/playbooks/${playbookId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  return handleResponse<ScenarioPlaybook>(response);
}

/**
 * Delete playbook
 */
export async function deletePlaybook(playbookId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${BASE_PATH}/playbooks/${playbookId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  return handleResponse<void>(response);
}

/**
 * List playbooks
 */
export async function listPlaybooks(query?: ScenarioListPlaybooksQuery): Promise<ScenarioListPlaybooksResponse> {
  const queryString = buildQueryString((query || {}) as Record<string, unknown>);
  const response = await fetch(`${API_BASE_URL}${BASE_PATH}/playbooks${queryString}`, {
    method: 'GET',
    credentials: 'include',
  });

  return handleResponse<ScenarioListPlaybooksResponse>(response);
}

/**
 * Activate playbook
 */
export async function activatePlaybook(playbookId: string): Promise<ScenarioPlaybook> {
  const response = await fetch(`${API_BASE_URL}${BASE_PATH}/playbooks/${playbookId}/activate`, {
    method: 'POST',
    credentials: 'include',
  });

  return handleResponse<ScenarioPlaybook>(response);
}

/**
 * Archive playbook
 */
export async function archivePlaybook(playbookId: string): Promise<ScenarioPlaybook> {
  const response = await fetch(`${API_BASE_URL}${BASE_PATH}/playbooks/${playbookId}/archive`, {
    method: 'POST',
    credentials: 'include',
  });

  return handleResponse<ScenarioPlaybook>(response);
}

// =============================================================================
// PLAYBOOK STEP OPERATIONS
// =============================================================================

/**
 * Add step to playbook
 */
export async function addPlaybookStep(
  playbookId: string,
  step: CreatePlaybookStepInput,
  insertAtIndex?: number
): Promise<ScenarioPlaybookStep> {
  const response = await fetch(`${API_BASE_URL}${BASE_PATH}/playbooks/${playbookId}/steps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ ...step, insertAtIndex }),
  });

  return handleResponse<ScenarioPlaybookStep>(response);
}

/**
 * Update step
 */
export async function updatePlaybookStep(
  stepId: string,
  input: UpdatePlaybookStepInput
): Promise<ScenarioPlaybookStep> {
  const response = await fetch(`${API_BASE_URL}${BASE_PATH}/steps/${stepId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  return handleResponse<ScenarioPlaybookStep>(response);
}

/**
 * Delete step
 */
export async function deletePlaybookStep(stepId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${BASE_PATH}/steps/${stepId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  return handleResponse<void>(response);
}

/**
 * Reorder steps
 */
export async function reorderPlaybookSteps(
  playbookId: string,
  stepOrder: string[]
): Promise<{ steps: ScenarioPlaybookStep[] }> {
  const response = await fetch(
    `${API_BASE_URL}${BASE_PATH}/playbooks/${playbookId}/steps/reorder`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ stepOrder }),
    }
  );

  return handleResponse<{ steps: ScenarioPlaybookStep[] }>(response);
}

// =============================================================================
// SCENARIO OPERATIONS
// =============================================================================

/**
 * Create scenario
 */
export async function createScenario(input: CreateScenarioInput): Promise<Scenario> {
  const response = await fetch(`${API_BASE_URL}${BASE_PATH}/scenarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  return handleResponse<Scenario>(response);
}

/**
 * Get scenario by ID
 */
export async function getScenario(scenarioId: string): Promise<Scenario> {
  const response = await fetch(`${API_BASE_URL}${BASE_PATH}/scenarios/${scenarioId}`, {
    method: 'GET',
    credentials: 'include',
  });

  return handleResponse<Scenario>(response);
}

/**
 * Get scenario with playbook
 */
export async function getScenarioWithPlaybook(scenarioId: string): Promise<ScenarioWithPlaybook> {
  const response = await fetch(`${API_BASE_URL}${BASE_PATH}/scenarios/${scenarioId}/full`, {
    method: 'GET',
    credentials: 'include',
  });

  return handleResponse<ScenarioWithPlaybook>(response);
}

/**
 * Update scenario
 */
export async function updateScenario(
  scenarioId: string,
  input: UpdateScenarioInput
): Promise<Scenario> {
  const response = await fetch(`${API_BASE_URL}${BASE_PATH}/scenarios/${scenarioId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  return handleResponse<Scenario>(response);
}

/**
 * Delete scenario
 */
export async function deleteScenario(scenarioId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${BASE_PATH}/scenarios/${scenarioId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  return handleResponse<void>(response);
}

/**
 * List scenarios
 */
export async function listScenarios(query?: ListScenariosQuery): Promise<ListScenariosResponse> {
  const queryString = buildQueryString((query || {}) as Record<string, unknown>);
  const response = await fetch(`${API_BASE_URL}${BASE_PATH}/scenarios${queryString}`, {
    method: 'GET',
    credentials: 'include',
  });

  return handleResponse<ListScenariosResponse>(response);
}

// =============================================================================
// SIMULATION OPERATIONS
// =============================================================================

/**
 * Simulate scenario
 */
export async function simulateScenario(
  scenarioId: string,
  options?: {
    playbookId?: string;
    overrideParameters?: ScenarioParameters;
    includeGraphContext?: boolean;
    includeMetricsContext?: boolean;
    generateNarrative?: boolean;
  }
): Promise<SimulationResult> {
  const response = await fetch(`${API_BASE_URL}${BASE_PATH}/scenarios/${scenarioId}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(options || {}),
  });

  return handleResponse<SimulationResult>(response);
}

// =============================================================================
// RUN OPERATIONS
// =============================================================================

/**
 * Start scenario run
 */
export async function startScenarioRun(input: StartScenarioRunInput): Promise<RunWithDetails> {
  const response = await fetch(`${API_BASE_URL}${BASE_PATH}/runs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  return handleResponse<RunWithDetails>(response);
}

/**
 * Get run by ID
 */
export async function getScenarioRun(runId: string): Promise<ScenarioRun> {
  const response = await fetch(`${API_BASE_URL}${BASE_PATH}/runs/${runId}`, {
    method: 'GET',
    credentials: 'include',
  });

  return handleResponse<ScenarioRun>(response);
}

/**
 * Get run with details
 */
export async function getRunWithDetails(runId: string): Promise<RunWithDetails> {
  const response = await fetch(`${API_BASE_URL}${BASE_PATH}/runs/${runId}/full`, {
    method: 'GET',
    credentials: 'include',
  });

  return handleResponse<RunWithDetails>(response);
}

/**
 * List runs
 */
export async function listScenarioRuns(
  query?: ListScenarioRunsQuery
): Promise<ListScenarioRunsResponse> {
  const queryString = buildQueryString((query || {}) as Record<string, unknown>);
  const response = await fetch(`${API_BASE_URL}${BASE_PATH}/runs${queryString}`, {
    method: 'GET',
    credentials: 'include',
  });

  return handleResponse<ListScenarioRunsResponse>(response);
}

/**
 * Pause run
 */
export async function pauseScenarioRun(runId: string): Promise<ScenarioRun> {
  const response = await fetch(`${API_BASE_URL}${BASE_PATH}/runs/${runId}/pause`, {
    method: 'POST',
    credentials: 'include',
  });

  return handleResponse<ScenarioRun>(response);
}

/**
 * Resume run
 */
export async function resumeScenarioRun(runId: string): Promise<ScenarioRun> {
  const response = await fetch(`${API_BASE_URL}${BASE_PATH}/runs/${runId}/resume`, {
    method: 'POST',
    credentials: 'include',
  });

  return handleResponse<ScenarioRun>(response);
}

/**
 * Cancel run
 */
export async function cancelScenarioRun(
  runId: string,
  reason?: string
): Promise<ScenarioRun> {
  const response = await fetch(`${API_BASE_URL}${BASE_PATH}/runs/${runId}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ reason }),
  });

  return handleResponse<ScenarioRun>(response);
}

// =============================================================================
// STEP APPROVAL OPERATIONS
// =============================================================================

/**
 * Approve or reject step
 */
export async function approveScenarioStep(
  stepId: string,
  approved: boolean,
  notes?: string
): Promise<ScenarioRunStep> {
  const response = await fetch(`${API_BASE_URL}${BASE_PATH}/run-steps/${stepId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ approved, notes }),
  });

  return handleResponse<ScenarioRunStep>(response);
}

// =============================================================================
// AUDIT LOG OPERATIONS
// =============================================================================

/**
 * List audit logs
 */
export async function listScenarioAuditLogs(
  query?: ListScenarioAuditLogsQuery
): Promise<ListScenarioAuditLogsResponse> {
  const queryString = buildQueryString((query || {}) as Record<string, unknown>);
  const response = await fetch(`${API_BASE_URL}${BASE_PATH}/audit${queryString}`, {
    method: 'GET',
    credentials: 'include',
  });

  return handleResponse<ListScenarioAuditLogsResponse>(response);
}

// =============================================================================
// STATS OPERATIONS
// =============================================================================

/**
 * Get scenario playbook stats
 */
export async function getScenarioPlaybookStats(): Promise<ScenarioPlaybookStatsResponse> {
  const response = await fetch(`${API_BASE_URL}${BASE_PATH}/stats`, {
    method: 'GET',
    credentials: 'include',
  });

  return handleResponse<ScenarioPlaybookStatsResponse>(response);
}

// =============================================================================
// HELPER TYPES FOR UI
// =============================================================================

export interface PlaybookFormData {
  name: string;
  description?: string;
  category?: string;
  triggerType: string;
  targetSystems: string[];
  riskLevel: string;
  tags: string[];
}

export interface ScenarioFormData {
  name: string;
  description?: string;
  scenarioType: string;
  horizonDays: number;
  parameters: ScenarioParameters;
  defaultPlaybookId?: string;
  tags: string[];
}

export interface StepFormData {
  name: string;
  description?: string;
  actionType: string;
  actionPayload: Record<string, unknown>;
  requiresApproval: boolean;
  approvalRoles: string[];
  waitForSignals: boolean;
  signalConditions: Record<string, unknown>;
  waitDurationMinutes?: number;
  timeoutMinutes?: number;
  conditionExpression?: string;
  skipOnFailure: boolean;
}

/**
 * Convert form data to API input
 */
export function playbookFormToInput(data: PlaybookFormData): CreateScenarioPlaybookInput {
  return {
    name: data.name,
    description: data.description,
    category: data.category,
    triggerType: data.triggerType as CreateScenarioPlaybookInput['triggerType'],
    targetSystems: data.targetSystems,
    riskLevel: data.riskLevel as CreateScenarioPlaybookInput['riskLevel'],
    tags: data.tags,
    steps: [],
  };
}

/**
 * Convert form data to API input
 */
export function scenarioFormToInput(data: ScenarioFormData): CreateScenarioInput {
  return {
    name: data.name,
    description: data.description,
    scenarioType: data.scenarioType as CreateScenarioInput['scenarioType'],
    horizonDays: data.horizonDays,
    parameters: data.parameters,
    defaultPlaybookId: data.defaultPlaybookId,
    tags: data.tags,
  };
}

/**
 * Convert form data to API input
 */
export function stepFormToInput(data: StepFormData): CreatePlaybookStepInput {
  return {
    name: data.name,
    description: data.description,
    actionType: data.actionType as CreatePlaybookStepInput['actionType'],
    actionPayload: data.actionPayload,
    requiresApproval: data.requiresApproval,
    approvalRoles: data.approvalRoles,
    waitForSignals: data.waitForSignals,
    signalConditions: data.signalConditions,
    waitDurationMinutes: data.waitDurationMinutes,
    timeoutMinutes: data.timeoutMinutes,
    conditionExpression: data.conditionExpression,
    skipOnFailure: data.skipOnFailure,
  };
}
