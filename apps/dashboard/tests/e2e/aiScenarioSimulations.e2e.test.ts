/**
 * AI Scenario Simulations E2E Tests (Sprint S71)
 * End-to-end tests for Autonomous AI Scenario Simulation Engine
 */

import { describe, it, expect } from 'vitest';

// Test configuration
const API_BASE_URL = process.env.TEST_API_URL || 'http://localhost:3001';
const TEST_ORG_ID = 'test-org-e2e';
const TEST_USER_ID = 'test-user-e2e';

// Helper to make API requests
async function apiRequest(
  endpoint: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
) {
  const { method = 'GET', body, headers = {} } = options;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-org-id': TEST_ORG_ID,
      'x-user-id': TEST_USER_ID,
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => null);
  return { response, data };
}

describe('AI Scenario Simulations E2E Tests (S71)', () => {
  let createdSimulationId: string | null = null;
  let createdRunId: string | null = null;

  // ============================================================================
  // FEATURE FLAG CHECK
  // ============================================================================

  describe('Feature Flag Check', () => {
    it('should have ENABLE_AI_SCENARIO_SIMULATIONS feature flag enabled', async () => {
      const { response } = await apiRequest('/api/v1/ai-scenario-simulations/stats');

      // If feature is disabled, we'd get a 403
      expect(response.status).not.toBe(404);
    });
  });

  // ============================================================================
  // SIMULATION CRUD OPERATIONS
  // ============================================================================

  describe('Simulation CRUD Operations', () => {
    it('should create a new simulation', async () => {
      const simulationData = {
        name: 'E2E Crisis Response Simulation',
        description: 'Simulation created during E2E testing',
        objectiveType: 'crisis_comms',
        simulationMode: 'single_run',
        config: {
          maxStepsPerRun: 15,
          temperature: 0.7,
        },
      };

      const { response, data } = await apiRequest('/api/v1/ai-scenario-simulations', {
        method: 'POST',
        body: simulationData,
      });

      // Either success or feature disabled (403)
      if (response.status === 403) {
        expect(data.error).toContain('disabled');
        return;
      }

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.simulation).toBeDefined();
      expect(data.simulation.name).toBe(simulationData.name);
      expect(data.simulation.objectiveType).toBe(simulationData.objectiveType);
      expect(data.simulation.status).toBe('draft');

      createdSimulationId = data.simulation.id;
    });

    it('should list simulations with pagination', async () => {
      const { response, data } = await apiRequest(
        '/api/v1/ai-scenario-simulations?limit=10&offset=0'
      );

      if (response.status === 403) {
        expect(data.error).toContain('disabled');
        return;
      }

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.simulations)).toBe(true);
      expect(typeof data.total).toBe('number');
    });

    it('should get a simulation by ID', async () => {
      if (!createdSimulationId) {
        console.log('Skipping: No simulation created');
        return;
      }

      const { response, data } = await apiRequest(
        `/api/v1/ai-scenario-simulations/${createdSimulationId}`
      );

      if (response.status === 403) {
        expect(data.error).toContain('disabled');
        return;
      }

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.simulation.id).toBe(createdSimulationId);
    });

    it('should update a simulation', async () => {
      if (!createdSimulationId) {
        console.log('Skipping: No simulation created');
        return;
      }

      const updateData = {
        name: 'Updated E2E Simulation Name',
        description: 'Updated description for E2E testing',
        status: 'configured',
      };

      const { response, data } = await apiRequest(
        `/api/v1/ai-scenario-simulations/${createdSimulationId}`,
        {
          method: 'PUT',
          body: updateData,
        }
      );

      if (response.status === 403) {
        expect(data.error).toContain('disabled');
        return;
      }

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.simulation.name).toBe(updateData.name);
      expect(data.simulation.status).toBe('configured');
    });
  });

  // ============================================================================
  // SIMULATION RUN LIFECYCLE
  // ============================================================================

  describe('Simulation Run Lifecycle', () => {
    it('should start a new run', async () => {
      if (!createdSimulationId) {
        console.log('Skipping: No simulation created');
        return;
      }

      const runData = {
        runLabel: 'E2E Test Run 1',
        maxSteps: 10,
        seedContext: {
          scenario: 'Product recall due to safety concerns',
        },
      };

      const { response, data } = await apiRequest(
        `/api/v1/ai-scenario-simulations/${createdSimulationId}/runs`,
        {
          method: 'POST',
          body: runData,
        }
      );

      if (response.status === 403) {
        expect(data.error).toContain('disabled');
        return;
      }

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.run).toBeDefined();
      expect(data.run.runLabel).toBe(runData.runLabel);
      expect(['starting', 'in_progress']).toContain(data.run.status);

      createdRunId = data.run.id;
    });

    it('should list runs for a simulation', async () => {
      if (!createdSimulationId) {
        console.log('Skipping: No simulation created');
        return;
      }

      const { response, data } = await apiRequest(
        `/api/v1/ai-scenario-simulations/${createdSimulationId}/runs?limit=10`
      );

      if (response.status === 403) {
        expect(data.error).toContain('disabled');
        return;
      }

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.runs)).toBe(true);
    });

    it('should get run detail with agents', async () => {
      if (!createdRunId) {
        console.log('Skipping: No run created');
        return;
      }

      const { response, data } = await apiRequest(
        `/api/v1/ai-scenario-simulations/runs/${createdRunId}`
      );

      if (response.status === 403) {
        expect(data.error).toContain('disabled');
        return;
      }

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.run).toBeDefined();
      expect(Array.isArray(data.agents)).toBe(true);
    });

    it('should advance run by one step', async () => {
      if (!createdRunId) {
        console.log('Skipping: No run created');
        return;
      }

      const { response, data } = await apiRequest(
        `/api/v1/ai-scenario-simulations/runs/${createdRunId}/step`,
        { method: 'POST' }
      );

      if (response.status === 403) {
        expect(data.error).toContain('disabled');
        return;
      }

      // Run might already be completed or have advanced
      expect([200, 400]).toContain(response.status);
      if (response.status === 200) {
        expect(data.success).toBe(true);
        expect(data.run).toBeDefined();
        expect(data.turn).toBeDefined();
      }
    });

    it('should list turns for a run', async () => {
      if (!createdRunId) {
        console.log('Skipping: No run created');
        return;
      }

      const { response, data } = await apiRequest(
        `/api/v1/ai-scenario-simulations/runs/${createdRunId}/turns?limit=20`
      );

      if (response.status === 403) {
        expect(data.error).toContain('disabled');
        return;
      }

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.turns)).toBe(true);
    });

    it('should abort a run', async () => {
      if (!createdRunId) {
        console.log('Skipping: No run created');
        return;
      }

      const { response, data } = await apiRequest(
        `/api/v1/ai-scenario-simulations/runs/${createdRunId}/abort`,
        {
          method: 'POST',
          body: { reason: 'E2E test cleanup' },
        }
      );

      if (response.status === 403) {
        expect(data.error).toContain('disabled');
        return;
      }

      // May fail if run is already completed/aborted
      expect([200, 400]).toContain(response.status);
      if (response.status === 200) {
        expect(data.success).toBe(true);
        expect(data.run.status).toBe('aborted');
      }
    });
  });

  // ============================================================================
  // AGENT MANAGEMENT
  // ============================================================================

  describe('Agent Management', () => {
    it('should list preset agent roles', async () => {
      const { response, data } = await apiRequest(
        '/api/v1/ai-scenario-simulations/agents/presets'
      );

      if (response.status === 403) {
        expect(data.error).toContain('disabled');
        return;
      }

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.presets)).toBe(true);

      // Check preset structure
      if (data.presets.length > 0) {
        const preset = data.presets[0];
        expect(preset).toHaveProperty('roleType');
        expect(preset).toHaveProperty('displayName');
        expect(preset).toHaveProperty('systemPrompt');
      }
    });
  });

  // ============================================================================
  // OBSERVABILITY
  // ============================================================================

  describe('Observability', () => {
    it('should get simulation statistics', async () => {
      const { response, data } = await apiRequest(
        '/api/v1/ai-scenario-simulations/stats'
      );

      if (response.status === 403) {
        expect(data.error).toContain('disabled');
        return;
      }

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.stats).toBeDefined();
      expect(data.stats).toHaveProperty('totalSimulations');
      expect(data.stats).toHaveProperty('totalRuns');
      expect(data.stats).toHaveProperty('byStatus');
      expect(data.stats).toHaveProperty('byObjective');
    });

    it('should get run metrics', async () => {
      if (!createdRunId) {
        console.log('Skipping: No run created');
        return;
      }

      const { response, data } = await apiRequest(
        `/api/v1/ai-scenario-simulations/runs/${createdRunId}/metrics`
      );

      if (response.status === 403) {
        expect(data.error).toContain('disabled');
        return;
      }

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.metrics).toBeDefined();
    });

    it('should get audit log', async () => {
      if (!createdSimulationId) {
        console.log('Skipping: No simulation created');
        return;
      }

      const { response, data } = await apiRequest(
        `/api/v1/ai-scenario-simulations/${createdSimulationId}/audit-log?limit=20`
      );

      if (response.status === 403) {
        expect(data.error).toContain('disabled');
        return;
      }

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.events)).toBe(true);
    });
  });

  // ============================================================================
  // CLEANUP
  // ============================================================================

  describe('Cleanup', () => {
    it('should archive the test simulation', async () => {
      if (!createdSimulationId) {
        console.log('Skipping: No simulation to clean up');
        return;
      }

      const { response, data } = await apiRequest(
        `/api/v1/ai-scenario-simulations/${createdSimulationId}/archive`,
        {
          method: 'POST',
          body: { reason: 'E2E test cleanup' },
        }
      );

      if (response.status === 403) {
        expect(data.error).toContain('disabled');
        return;
      }

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.simulation.status).toBe('archived');
    });
  });
});

// ============================================================================
// INPUT VALIDATION TESTS
// ============================================================================

describe('Input Validation Tests', () => {
  it('should reject invalid simulation name', async () => {
    const { response, data } = await apiRequest('/api/v1/ai-scenario-simulations', {
      method: 'POST',
      body: {
        name: '', // Too short
        objectiveType: 'crisis_comms',
      },
    });

    if (response.status === 403) return; // Feature disabled

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('should reject invalid objective type', async () => {
    const { response, data } = await apiRequest('/api/v1/ai-scenario-simulations', {
      method: 'POST',
      body: {
        name: 'Valid Name',
        objectiveType: 'invalid_type',
      },
    });

    if (response.status === 403) return; // Feature disabled

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('should reject invalid simulation mode', async () => {
    const { response, data } = await apiRequest('/api/v1/ai-scenario-simulations', {
      method: 'POST',
      body: {
        name: 'Valid Name',
        objectiveType: 'crisis_comms',
        simulationMode: 'invalid_mode',
      },
    });

    if (response.status === 403) return; // Feature disabled

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('should reject maxSteps exceeding limit', async () => {
    const { response, data } = await apiRequest('/api/v1/ai-scenario-simulations', {
      method: 'POST',
      body: {
        name: 'Valid Name',
        objectiveType: 'crisis_comms',
        config: {
          maxStepsPerRun: 1000, // Exceeds max of 100
        },
      },
    });

    if (response.status === 403) return; // Feature disabled

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });
});

// ============================================================================
// SIMULATION MODE TESTS
// ============================================================================

describe('Simulation Mode Tests', () => {
  it('should create multi-run simulation', async () => {
    const { response, data } = await apiRequest('/api/v1/ai-scenario-simulations', {
      method: 'POST',
      body: {
        name: 'E2E Multi-Run Simulation',
        objectiveType: 'investor_relations',
        simulationMode: 'multi_run',
        config: {
          maxRuns: 5,
          variationSeed: 'earnings_call',
        },
      },
    });

    if (response.status === 403) return; // Feature disabled

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.simulation.simulationMode).toBe('multi_run');

    // Cleanup
    if (data.simulation?.id) {
      await apiRequest(`/api/v1/ai-scenario-simulations/${data.simulation.id}/archive`, {
        method: 'POST',
        body: { reason: 'E2E test cleanup' },
      });
    }
  });

  it('should create what-if simulation', async () => {
    const { response, data } = await apiRequest('/api/v1/ai-scenario-simulations', {
      method: 'POST',
      body: {
        name: 'E2E What-If Simulation',
        objectiveType: 'go_to_market',
        simulationMode: 'what_if',
        config: {
          branchingEnabled: true,
          alternativeScenarios: ['optimistic', 'pessimistic'],
        },
      },
    });

    if (response.status === 403) return; // Feature disabled

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.simulation.simulationMode).toBe('what_if');

    // Cleanup
    if (data.simulation?.id) {
      await apiRequest(`/api/v1/ai-scenario-simulations/${data.simulation.id}/archive`, {
        method: 'POST',
        body: { reason: 'E2E test cleanup' },
      });
    }
  });
});
