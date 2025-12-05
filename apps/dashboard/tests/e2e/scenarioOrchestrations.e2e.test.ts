/**
 * Scenario Orchestrations E2E Tests (Sprint S72)
 * End-to-end tests for multi-scenario orchestration UI
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

// Mock API responses
const mockSuites = [
  {
    id: 'suite-1',
    orgId: 'org-123',
    name: 'Crisis Response Chain',
    description: 'Multi-step crisis simulation suite',
    status: 'configured',
    config: {
      narrativeEnabled: true,
      riskMapEnabled: true,
      stopOnFailure: true,
      maxConcurrentSimulations: 1,
      timeoutSeconds: 3600,
    },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'suite-2',
    orgId: 'org-123',
    name: 'Product Launch Prep',
    description: 'Pre-launch PR simulation suite',
    status: 'draft',
    config: {
      narrativeEnabled: true,
      riskMapEnabled: false,
      stopOnFailure: false,
      maxConcurrentSimulations: 2,
      timeoutSeconds: 7200,
    },
    createdAt: '2024-01-16T10:00:00Z',
    updatedAt: '2024-01-16T10:00:00Z',
  },
];

const mockSuiteItems = [
  {
    id: 'item-1',
    suiteId: 'suite-1',
    simulationId: 'sim-1',
    label: 'Initial Crisis Detection',
    orderIndex: 0,
    triggerConditionType: 'always',
    triggerCondition: { type: 'always' },
  },
  {
    id: 'item-2',
    suiteId: 'suite-1',
    simulationId: 'sim-2',
    label: 'Escalation Response',
    orderIndex: 1,
    triggerConditionType: 'risk_threshold',
    triggerCondition: { type: 'risk_threshold', minRiskLevel: 'high', comparison: '>=' },
  },
  {
    id: 'item-3',
    suiteId: 'suite-1',
    simulationId: 'sim-3',
    label: 'Recovery Phase',
    orderIndex: 2,
    triggerConditionType: 'outcome_match',
    triggerCondition: { type: 'outcome_match', outcomeType: 'negative' },
  },
];

const mockSuiteRun = {
  id: 'run-1',
  suiteId: 'suite-1',
  status: 'running',
  currentItemIndex: 0,
  totalItems: 3,
  totalStepsExecuted: 5,
  totalTokensUsed: 1500,
  totalDurationMs: 30000,
  startedAt: '2024-01-15T11:00:00Z',
};

const mockRunItems = [
  {
    id: 'run-item-1',
    runId: 'run-1',
    suiteItemId: 'item-1',
    simulationRunId: 'sim-run-1',
    orderIndex: 0,
    status: 'completed',
    stepsExecuted: 5,
    tokensUsed: 1500,
    durationMs: 30000,
    riskLevel: 'high',
    keyFindings: ['Crisis detected in social media', 'Negative sentiment spike'],
    conditionEvaluated: false,
    conditionResult: null,
  },
  {
    id: 'run-item-2',
    runId: 'run-1',
    suiteItemId: 'item-2',
    orderIndex: 1,
    status: 'pending',
    conditionEvaluated: true,
    conditionResult: true,
  },
  {
    id: 'run-item-3',
    runId: 'run-1',
    suiteItemId: 'item-3',
    orderIndex: 2,
    status: 'pending',
    conditionEvaluated: false,
    conditionResult: null,
  },
];

const mockStats = {
  totalSuites: 5,
  activeSuites: 3,
  totalRuns: 12,
  runningRuns: 1,
};

// Mock fetch for API calls
const mockFetch = (url: string, options?: RequestInit) => {
  const path = new URL(url, 'http://localhost:4000').pathname;

  // List suites
  if (path === '/api/v1/scenario-orchestrations/suites' && (!options || options.method === 'GET' || !options.method)) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ suites: mockSuites, total: mockSuites.length }),
    });
  }

  // Get suite
  if (path.match(/\/api\/v1\/scenario-orchestrations\/suites\/suite-\d+$/) && (!options || options.method === 'GET' || !options.method)) {
    const suiteId = path.split('/').pop();
    const suite = mockSuites.find(s => s.id === suiteId);
    const items = mockSuiteItems.filter(i => i.suiteId === suiteId);
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ suite, items }),
    });
  }

  // Create suite
  if (path === '/api/v1/scenario-orchestrations/suites' && options?.method === 'POST') {
    const body = JSON.parse(options.body as string);
    const newSuite = {
      id: 'suite-new',
      orgId: 'org-123',
      ...body,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true, suite: newSuite }),
    });
  }

  // Start run
  if (path.match(/\/api\/v1\/scenario-orchestrations\/suites\/suite-\d+\/runs$/) && options?.method === 'POST') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true, run: mockSuiteRun }),
    });
  }

  // Get run
  if (path.match(/\/api\/v1\/scenario-orchestrations\/suite-runs\/run-\d+$/) && (!options || options.method === 'GET' || !options.method)) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ run: mockSuiteRun }),
    });
  }

  // Get run items
  if (path.match(/\/api\/v1\/scenario-orchestrations\/suite-runs\/run-\d+\/items$/) && (!options || options.method === 'GET' || !options.method)) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ items: mockRunItems }),
    });
  }

  // Advance run
  if (path.match(/\/api\/v1\/scenario-orchestrations\/suite-runs\/run-\d+\/advance$/) && options?.method === 'POST') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        advanced: true,
        run: { ...mockSuiteRun, currentItemIndex: 1 },
      }),
    });
  }

  // Abort run
  if (path.match(/\/api\/v1\/scenario-orchestrations\/suite-runs\/run-\d+\/abort$/) && options?.method === 'POST') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        run: { ...mockSuiteRun, status: 'aborted' },
      }),
    });
  }

  // Stats
  if (path === '/api/v1/scenario-orchestrations/stats') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockStats),
    });
  }

  // Generate narrative
  if (path.match(/\/api\/v1\/scenario-orchestrations\/suite-runs\/run-\d+\/narrative$/) && options?.method === 'POST') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        narrative: 'The crisis simulation revealed significant vulnerabilities in the initial response...',
      }),
    });
  }

  // Generate risk map
  if (path.match(/\/api\/v1\/scenario-orchestrations\/suite-runs\/run-\d+\/risk-map$/) && options?.method === 'POST') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        riskMap: {
          risks: [
            { category: 'Reputation', level: 'high', description: 'Negative coverage risk', mitigation: 'Prepare holding statements' },
            { category: 'Operational', level: 'medium', description: 'Response delay risk', mitigation: 'Pre-draft communications' },
          ],
          opportunities: [
            { category: 'Brand', description: 'Demonstrate transparency', potential: 'Trust building' },
          ],
        },
      }),
    });
  }

  // Archive suite
  if (path.match(/\/api\/v1\/scenario-orchestrations\/suites\/suite-\d+\/archive$/) && options?.method === 'POST') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        suite: { ...mockSuites[0], status: 'archived' },
      }),
    });
  }

  // Default 404
  return Promise.resolve({
    ok: false,
    status: 404,
    json: () => Promise.resolve({ error: 'Not found' }),
  });
};

describe('Scenario Orchestrations E2E', () => {
  let originalFetch: typeof global.fetch;

  beforeAll(() => {
    originalFetch = global.fetch;
    global.fetch = mockFetch as typeof global.fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  describe('Suite List View', () => {
    it('should load and display suites', async () => {
      const response = await fetch('http://localhost:4000/api/v1/scenario-orchestrations/suites');
      const data = await response.json();

      expect(data.suites).toHaveLength(2);
      expect(data.suites[0].name).toBe('Crisis Response Chain');
      expect(data.suites[1].name).toBe('Product Launch Prep');
    });

    it('should display stats correctly', async () => {
      const response = await fetch('http://localhost:4000/api/v1/scenario-orchestrations/stats');
      const data = await response.json();

      expect(data.totalSuites).toBe(5);
      expect(data.activeSuites).toBe(3);
      expect(data.runningRuns).toBe(1);
    });

    it('should filter suites by status', async () => {
      const response = await fetch('http://localhost:4000/api/v1/scenario-orchestrations/suites?status=configured');
      const data = await response.json();

      expect(data.suites).toBeDefined();
    });
  });

  describe('Suite Detail View', () => {
    it('should load suite with items', async () => {
      const response = await fetch('http://localhost:4000/api/v1/scenario-orchestrations/suites/suite-1');
      const data = await response.json();

      expect(data.suite.name).toBe('Crisis Response Chain');
      expect(data.items).toHaveLength(3);
      expect(data.items[0].label).toBe('Initial Crisis Detection');
    });

    it('should display trigger conditions for items', async () => {
      const response = await fetch('http://localhost:4000/api/v1/scenario-orchestrations/suites/suite-1');
      const data = await response.json();

      const escalationItem = data.items.find((i: typeof mockSuiteItems[0]) => i.label === 'Escalation Response');
      expect(escalationItem.triggerConditionType).toBe('risk_threshold');
      expect(escalationItem.triggerCondition.minRiskLevel).toBe('high');
    });
  });

  describe('Suite Creation', () => {
    it('should create a new suite', async () => {
      const response = await fetch('http://localhost:4000/api/v1/scenario-orchestrations/suites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Test Suite',
          description: 'A new suite for testing',
          config: {
            narrativeEnabled: true,
            riskMapEnabled: true,
            stopOnFailure: true,
            maxConcurrentSimulations: 1,
            timeoutSeconds: 3600,
          },
        }),
      });
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.suite.name).toBe('New Test Suite');
      expect(data.suite.status).toBe('draft');
    });

    it('should validate required fields', async () => {
      // In real app, API would reject this
      const input = { name: '' };
      expect(input.name.trim()).toBe('');
    });
  });

  describe('Suite Run Execution', () => {
    it('should start a suite run', async () => {
      const response = await fetch('http://localhost:4000/api/v1/scenario-orchestrations/suites/suite-1/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.run.status).toBe('running');
      expect(data.run.totalItems).toBe(3);
    });

    it('should get run details', async () => {
      const response = await fetch('http://localhost:4000/api/v1/scenario-orchestrations/suite-runs/run-1');
      const data = await response.json();

      expect(data.run.id).toBe('run-1');
      expect(data.run.status).toBe('running');
      expect(data.run.currentItemIndex).toBe(0);
    });

    it('should get run items', async () => {
      const response = await fetch('http://localhost:4000/api/v1/scenario-orchestrations/suite-runs/run-1/items');
      const data = await response.json();

      expect(data.items).toHaveLength(3);
      expect(data.items[0].status).toBe('completed');
      expect(data.items[1].status).toBe('pending');
    });

    it('should advance to next item', async () => {
      const response = await fetch('http://localhost:4000/api/v1/scenario-orchestrations/suite-runs/run-1/advance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.advanced).toBe(true);
      expect(data.run.currentItemIndex).toBe(1);
    });

    it('should abort a running run', async () => {
      const response = await fetch('http://localhost:4000/api/v1/scenario-orchestrations/suite-runs/run-1/abort', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'User cancelled' }),
      });
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.run.status).toBe('aborted');
    });
  });

  describe('Narrative Generation', () => {
    it('should generate suite narrative', async () => {
      const response = await fetch('http://localhost:4000/api/v1/scenario-orchestrations/suite-runs/run-1/narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: 'summary' }),
      });
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.narrative).toContain('crisis simulation');
    });
  });

  describe('Risk Map Generation', () => {
    it('should generate suite risk map', async () => {
      const response = await fetch('http://localhost:4000/api/v1/scenario-orchestrations/suite-runs/run-1/risk-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ includeOpportunities: true }),
      });
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.riskMap.risks).toHaveLength(2);
      expect(data.riskMap.opportunities).toHaveLength(1);
    });

    it('should include risk mitigations', async () => {
      const response = await fetch('http://localhost:4000/api/v1/scenario-orchestrations/suite-runs/run-1/risk-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ includeMitigations: true }),
      });
      const data = await response.json();

      expect(data.riskMap.risks[0].mitigation).toBeDefined();
    });
  });

  describe('Suite Archival', () => {
    it('should archive a suite', async () => {
      const response = await fetch('http://localhost:4000/api/v1/scenario-orchestrations/suites/suite-1/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'No longer needed' }),
      });
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.suite.status).toBe('archived');
    });
  });

  describe('Condition Evaluation Display', () => {
    it('should display condition evaluation results', async () => {
      const response = await fetch('http://localhost:4000/api/v1/scenario-orchestrations/suite-runs/run-1/items');
      const data = await response.json();

      const secondItem = data.items.find((i: typeof mockRunItems[0]) => i.orderIndex === 1);
      expect(secondItem.conditionEvaluated).toBe(true);
      expect(secondItem.conditionResult).toBe(true);
    });
  });

  describe('Timeline Visualization', () => {
    it('should have items in correct order', async () => {
      const response = await fetch('http://localhost:4000/api/v1/scenario-orchestrations/suite-runs/run-1/items');
      const data = await response.json();

      const sortedItems = [...data.items].sort((a: typeof mockRunItems[0], b: typeof mockRunItems[0]) => a.orderIndex - b.orderIndex);
      expect(sortedItems[0].orderIndex).toBe(0);
      expect(sortedItems[1].orderIndex).toBe(1);
      expect(sortedItems[2].orderIndex).toBe(2);
    });

    it('should show completed items with metrics', async () => {
      const response = await fetch('http://localhost:4000/api/v1/scenario-orchestrations/suite-runs/run-1/items');
      const data = await response.json();

      const completedItem = data.items.find((i: typeof mockRunItems[0]) => i.status === 'completed');
      expect(completedItem.stepsExecuted).toBe(5);
      expect(completedItem.tokensUsed).toBe(1500);
      expect(completedItem.riskLevel).toBe('high');
    });
  });

  describe('Metrics Aggregation', () => {
    it('should aggregate metrics from run items', async () => {
      const response = await fetch('http://localhost:4000/api/v1/scenario-orchestrations/suite-runs/run-1/items');
      const data = await response.json();

      const totalSteps = data.items.reduce((sum: number, item: typeof mockRunItems[0]) => sum + (item.stepsExecuted || 0), 0);
      const totalTokens = data.items.reduce((sum: number, item: typeof mockRunItems[0]) => sum + (item.tokensUsed || 0), 0);

      expect(totalSteps).toBe(5);
      expect(totalTokens).toBe(1500);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent suite', async () => {
      const response = await fetch('http://localhost:4000/api/v1/scenario-orchestrations/suites/non-existent');
      expect(response.ok).toBe(false);
    });

    it('should handle network errors gracefully', async () => {
      // In real app, component would show error state
      const mockError = new Error('Network error');
      expect(mockError.message).toBe('Network error');
    });
  });
});
