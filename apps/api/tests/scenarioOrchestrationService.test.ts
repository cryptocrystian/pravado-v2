/**
 * Scenario Orchestration Service Tests (Sprint S72)
 * Tests for multi-scenario suite orchestration
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as scenarioOrchestrationService from '../src/services/scenarioOrchestrationService';
import type {
  CreateScenarioSuiteInput,
  CreateSuiteItemInput,
  TriggerCondition,
} from '@pravado/types';

// Mock Supabase
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockRange = vi.fn();
const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();

vi.mock('../src/lib/supabase', () => ({
  getSupabaseClient: () => ({
    from: mockFrom,
  }),
}));

// Mock AI Simulation Service
vi.mock('../src/services/aiScenarioSimulationService', () => ({
  getSimulation: vi.fn(),
  startRun: vi.fn(),
  runUntilConverged: vi.fn(),
}));

// Mock LLM Router
vi.mock('@pravado/utils', () => ({
  routeLLM: vi.fn(),
}));

describe('scenarioOrchestrationService', () => {
  const mockOrgId = 'org-123';
  const mockUserId = 'user-456';

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default chain
    mockFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    });
    mockSelect.mockReturnValue({
      eq: mockEq,
      order: mockOrder,
      range: mockRange,
      single: mockSingle,
      maybeSingle: mockMaybeSingle,
    });
    mockInsert.mockReturnValue({
      select: mockSelect,
    });
    mockUpdate.mockReturnValue({
      eq: mockEq,
    });
    mockDelete.mockReturnValue({
      eq: mockEq,
    });
    mockEq.mockReturnValue({
      eq: mockEq,
      select: mockSelect,
      single: mockSingle,
      maybeSingle: mockMaybeSingle,
      order: mockOrder,
    });
    mockOrder.mockReturnValue({
      range: mockRange,
      limit: vi.fn().mockReturnValue({
        data: [],
        error: null,
      }),
    });
    mockRange.mockReturnValue({
      data: [],
      error: null,
      count: 0,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('createSuite', () => {
    it('should create a new suite with default config', async () => {
      const input: CreateScenarioSuiteInput = {
        name: 'Test Suite',
        description: 'A test suite',
      };

      const mockSuite = {
        id: 'suite-1',
        org_id: mockOrgId,
        name: input.name,
        description: input.description,
        status: 'draft',
        config: {
          narrativeEnabled: true,
          riskMapEnabled: true,
          stopOnFailure: true,
          maxConcurrentSimulations: 1,
          timeoutSeconds: 3600,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSingle.mockResolvedValue({ data: mockSuite, error: null });

      const result = await scenarioOrchestrationService.createSuite(mockOrgId, mockUserId, input);

      expect(result.suite).toBeDefined();
      expect(result.suite.name).toBe(input.name);
      expect(mockFrom).toHaveBeenCalledWith('scenario_suites');
    });

    it('should create suite with custom config', async () => {
      const input: CreateScenarioSuiteInput = {
        name: 'Custom Suite',
        config: {
          narrativeEnabled: false,
          riskMapEnabled: true,
          stopOnFailure: false,
          maxConcurrentSimulations: 3,
          timeoutSeconds: 7200,
        },
      };

      const mockSuite = {
        id: 'suite-2',
        org_id: mockOrgId,
        name: input.name,
        status: 'draft',
        config: input.config,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSingle.mockResolvedValue({ data: mockSuite, error: null });

      const result = await scenarioOrchestrationService.createSuite(mockOrgId, mockUserId, input);

      expect(result.suite.config.maxConcurrentSimulations).toBe(3);
      expect(result.suite.config.stopOnFailure).toBe(false);
    });

    it('should throw error on database failure', async () => {
      const input: CreateScenarioSuiteInput = { name: 'Fail Suite' };

      mockSingle.mockResolvedValue({ data: null, error: { message: 'DB Error' } });

      await expect(
        scenarioOrchestrationService.createSuite(mockOrgId, mockUserId, input)
      ).rejects.toThrow('DB Error');
    });
  });

  describe('getSuite', () => {
    it('should return suite with items', async () => {
      const mockSuite = {
        id: 'suite-1',
        org_id: mockOrgId,
        name: 'Test Suite',
        status: 'configured',
        config: {},
      };

      const mockItems = [
        { id: 'item-1', suite_id: 'suite-1', simulation_id: 'sim-1', order_index: 0 },
        { id: 'item-2', suite_id: 'suite-1', simulation_id: 'sim-2', order_index: 1 },
      ];

      mockMaybeSingle.mockResolvedValueOnce({ data: mockSuite, error: null });
      mockOrder.mockReturnValue({ data: mockItems, error: null });

      const result = await scenarioOrchestrationService.getSuite(mockOrgId, 'suite-1');

      expect(result.suite).toBeDefined();
      expect(result.items).toHaveLength(2);
    });

    it('should return null for non-existent suite', async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: null });

      const result = await scenarioOrchestrationService.getSuite(mockOrgId, 'non-existent');

      expect(result.suite).toBeNull();
    });
  });

  describe('listSuites', () => {
    it('should list suites with pagination', async () => {
      const mockSuites = [
        { id: 'suite-1', name: 'Suite 1', status: 'configured' },
        { id: 'suite-2', name: 'Suite 2', status: 'draft' },
      ];

      mockRange.mockReturnValue({
        data: mockSuites,
        error: null,
        count: 2,
      });

      const result = await scenarioOrchestrationService.listSuites(mockOrgId, {
        limit: 10,
        offset: 0,
      });

      expect(result.suites).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter by status', async () => {
      const mockSuites = [
        { id: 'suite-1', name: 'Suite 1', status: 'configured' },
      ];

      mockRange.mockReturnValue({
        data: mockSuites,
        error: null,
        count: 1,
      });

      const result = await scenarioOrchestrationService.listSuites(mockOrgId, {
        status: 'configured',
      });

      expect(result.suites).toHaveLength(1);
      expect(mockEq).toHaveBeenCalled();
    });
  });

  describe('addSuiteItem', () => {
    it('should add item with trigger condition', async () => {
      const input: CreateSuiteItemInput = {
        simulationId: 'sim-1',
        orderIndex: 0,
        triggerConditionType: 'risk_threshold',
        triggerCondition: {
          type: 'risk_threshold',
          minRiskLevel: 'high',
          comparison: '>=',
        },
      };

      const mockItem = {
        id: 'item-1',
        suite_id: 'suite-1',
        simulation_id: input.simulationId,
        order_index: input.orderIndex,
        trigger_condition_type: input.triggerConditionType,
        trigger_condition: input.triggerCondition,
      };

      mockSingle.mockResolvedValue({ data: mockItem, error: null });

      const result = await scenarioOrchestrationService.addSuiteItem(
        mockOrgId,
        'suite-1',
        mockUserId,
        input
      );

      expect(result.item.triggerConditionType).toBe('risk_threshold');
    });

    it('should validate simulation exists', async () => {
      const input: CreateSuiteItemInput = {
        simulationId: 'non-existent',
        orderIndex: 0,
        triggerConditionType: 'always',
        triggerCondition: { type: 'always' },
      };

      // Mock simulation lookup returning null
      const { getSimulation } = await import('../src/services/aiScenarioSimulationService');
      (getSimulation as ReturnType<typeof vi.fn>).mockResolvedValue({ simulation: null });

      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Simulation not found' },
      });

      await expect(
        scenarioOrchestrationService.addSuiteItem(mockOrgId, 'suite-1', mockUserId, input)
      ).rejects.toThrow();
    });
  });

  describe('startSuiteRun', () => {
    it('should start a new run', async () => {
      const mockSuite = {
        id: 'suite-1',
        org_id: mockOrgId,
        status: 'configured',
        config: { stopOnFailure: true },
      };

      const mockItems = [
        { id: 'item-1', simulation_id: 'sim-1', order_index: 0 },
      ];

      const mockRun = {
        id: 'run-1',
        suite_id: 'suite-1',
        status: 'running',
        current_item_index: 0,
        total_items: 1,
      };

      mockMaybeSingle.mockResolvedValueOnce({ data: mockSuite, error: null });
      mockOrder.mockReturnValueOnce({ data: mockItems, error: null });
      mockSingle.mockResolvedValue({ data: mockRun, error: null });

      const result = await scenarioOrchestrationService.startSuiteRun(
        mockOrgId,
        'suite-1',
        mockUserId
      );

      expect(result.run).toBeDefined();
      expect(result.run?.status).toBe('running');
    });

    it('should reject if suite has no items', async () => {
      const mockSuite = {
        id: 'suite-1',
        org_id: mockOrgId,
        status: 'configured',
      };

      mockMaybeSingle.mockResolvedValueOnce({ data: mockSuite, error: null });
      mockOrder.mockReturnValueOnce({ data: [], error: null });

      await expect(
        scenarioOrchestrationService.startSuiteRun(mockOrgId, 'suite-1', mockUserId)
      ).rejects.toThrow('Suite has no items');
    });

    it('should reject if suite is archived', async () => {
      const mockSuite = {
        id: 'suite-1',
        org_id: mockOrgId,
        status: 'archived',
      };

      mockMaybeSingle.mockResolvedValueOnce({ data: mockSuite, error: null });

      await expect(
        scenarioOrchestrationService.startSuiteRun(mockOrgId, 'suite-1', mockUserId)
      ).rejects.toThrow('Cannot run archived suite');
    });
  });

  describe('evaluateCondition', () => {
    it('should evaluate always condition as true', () => {
      const condition: TriggerCondition = { type: 'always' };
      const result = scenarioOrchestrationService.evaluateCondition(condition, {});
      expect(result).toBe(true);
    });

    it('should evaluate risk_threshold condition', () => {
      const condition: TriggerCondition = {
        type: 'risk_threshold',
        minRiskLevel: 'high',
        comparison: '>=',
      };

      const riskLevels = { low: 1, medium: 2, high: 3, critical: 4 };

      // high >= high should be true
      expect(
        scenarioOrchestrationService.evaluateCondition(condition, { riskLevel: 'high' })
      ).toBe(true);

      // critical >= high should be true
      expect(
        scenarioOrchestrationService.evaluateCondition(condition, { riskLevel: 'critical' })
      ).toBe(true);

      // medium >= high should be false
      expect(
        scenarioOrchestrationService.evaluateCondition(condition, { riskLevel: 'medium' })
      ).toBe(false);
    });

    it('should evaluate keyword_match condition with any mode', () => {
      const condition: TriggerCondition = {
        type: 'keyword_match',
        keywords: ['crisis', 'emergency', 'urgent'],
        matchMode: 'any',
      };

      expect(
        scenarioOrchestrationService.evaluateCondition(condition, {
          narrative: 'This is a crisis situation',
        })
      ).toBe(true);

      expect(
        scenarioOrchestrationService.evaluateCondition(condition, {
          narrative: 'Everything is fine',
        })
      ).toBe(false);
    });

    it('should evaluate keyword_match condition with all mode', () => {
      const condition: TriggerCondition = {
        type: 'keyword_match',
        keywords: ['crisis', 'urgent'],
        matchMode: 'all',
      };

      expect(
        scenarioOrchestrationService.evaluateCondition(condition, {
          narrative: 'This is an urgent crisis',
        })
      ).toBe(true);

      expect(
        scenarioOrchestrationService.evaluateCondition(condition, {
          narrative: 'This is just a crisis',
        })
      ).toBe(false);
    });

    it('should evaluate outcome_match condition', () => {
      const condition: TriggerCondition = {
        type: 'outcome_match',
        outcomeType: 'negative',
      };

      expect(
        scenarioOrchestrationService.evaluateCondition(condition, {
          outcomeType: 'negative',
        })
      ).toBe(true);

      expect(
        scenarioOrchestrationService.evaluateCondition(condition, {
          outcomeType: 'positive',
        })
      ).toBe(false);
    });

    it('should evaluate sentiment_shift condition', () => {
      const condition: TriggerCondition = {
        type: 'sentiment_shift',
        direction: 'negative',
        magnitude: 'large',
      };

      expect(
        scenarioOrchestrationService.evaluateCondition(condition, {
          sentimentShift: { direction: 'negative', magnitude: 'large' },
        })
      ).toBe(true);

      expect(
        scenarioOrchestrationService.evaluateCondition(condition, {
          sentimentShift: { direction: 'positive', magnitude: 'small' },
        })
      ).toBe(false);
    });
  });

  describe('advanceSuiteRun', () => {
    it('should advance to next item when condition met', async () => {
      const mockRun = {
        id: 'run-1',
        suite_id: 'suite-1',
        status: 'running',
        current_item_index: 0,
        total_items: 2,
      };

      const mockRunItems = [
        {
          id: 'run-item-1',
          run_id: 'run-1',
          suite_item_id: 'item-1',
          status: 'completed',
          order_index: 0,
        },
      ];

      const mockNextItem = {
        id: 'item-2',
        trigger_condition_type: 'always',
        trigger_condition: { type: 'always' },
        simulation_id: 'sim-2',
        order_index: 1,
      };

      mockMaybeSingle.mockResolvedValueOnce({ data: mockRun, error: null });
      mockOrder.mockReturnValueOnce({ data: mockRunItems, error: null });
      mockMaybeSingle.mockResolvedValueOnce({ data: mockNextItem, error: null });
      mockSingle.mockResolvedValue({ data: { ...mockRun, current_item_index: 1 }, error: null });

      const result = await scenarioOrchestrationService.advanceSuiteRun(
        mockOrgId,
        'run-1',
        mockUserId
      );

      expect(result.advanced).toBe(true);
      expect(result.run?.currentItemIndex).toBe(1);
    });

    it('should skip item when condition not met', async () => {
      const mockRun = {
        id: 'run-1',
        suite_id: 'suite-1',
        status: 'running',
        current_item_index: 0,
        total_items: 2,
      };

      const mockRunItems = [
        {
          id: 'run-item-1',
          run_id: 'run-1',
          suite_item_id: 'item-1',
          status: 'completed',
          order_index: 0,
          risk_level: 'low',
        },
      ];

      const mockNextItem = {
        id: 'item-2',
        trigger_condition_type: 'risk_threshold',
        trigger_condition: { type: 'risk_threshold', minRiskLevel: 'high', comparison: '>=' },
        simulation_id: 'sim-2',
        order_index: 1,
      };

      mockMaybeSingle.mockResolvedValueOnce({ data: mockRun, error: null });
      mockOrder.mockReturnValueOnce({ data: mockRunItems, error: null });
      mockMaybeSingle.mockResolvedValueOnce({ data: mockNextItem, error: null });
      mockSingle.mockResolvedValue({ data: mockRun, error: null });

      const result = await scenarioOrchestrationService.advanceSuiteRun(
        mockOrgId,
        'run-1',
        mockUserId
      );

      // Should have marked item as skipped
      expect(mockFrom).toHaveBeenCalledWith('scenario_suite_run_items');
    });
  });

  describe('abortSuiteRun', () => {
    it('should abort a running run', async () => {
      const mockRun = {
        id: 'run-1',
        suite_id: 'suite-1',
        status: 'running',
      };

      mockMaybeSingle.mockResolvedValueOnce({ data: mockRun, error: null });
      mockSingle.mockResolvedValue({
        data: { ...mockRun, status: 'aborted' },
        error: null,
      });

      const result = await scenarioOrchestrationService.abortSuiteRun(
        mockOrgId,
        'run-1',
        mockUserId,
        'User requested'
      );

      expect(result.success).toBe(true);
      expect(result.run?.status).toBe('aborted');
    });

    it('should reject aborting completed run', async () => {
      const mockRun = {
        id: 'run-1',
        suite_id: 'suite-1',
        status: 'completed',
      };

      mockMaybeSingle.mockResolvedValueOnce({ data: mockRun, error: null });

      await expect(
        scenarioOrchestrationService.abortSuiteRun(
          mockOrgId,
          'run-1',
          mockUserId,
          'Too late'
        )
      ).rejects.toThrow('Cannot abort');
    });
  });

  describe('generateSuiteNarrative', () => {
    it('should generate narrative for completed run', async () => {
      const mockRun = {
        id: 'run-1',
        suite_id: 'suite-1',
        status: 'completed',
        aggregated_outcomes: [{ summary: 'Test outcome' }],
      };

      const mockSuite = {
        id: 'suite-1',
        name: 'Test Suite',
      };

      mockMaybeSingle.mockResolvedValueOnce({ data: mockRun, error: null });
      mockMaybeSingle.mockResolvedValueOnce({ data: mockSuite, error: null });

      const { routeLLM } = await import('@pravado/utils');
      (routeLLM as ReturnType<typeof vi.fn>).mockResolvedValue({
        content: 'Generated narrative summary.',
      });

      const result = await scenarioOrchestrationService.generateSuiteNarrative(
        mockOrgId,
        'run-1',
        { format: 'summary' }
      );

      expect(result.narrative).toBe('Generated narrative summary.');
      expect(routeLLM).toHaveBeenCalled();
    });
  });

  describe('generateSuiteRiskMap', () => {
    it('should generate risk map for completed run', async () => {
      const mockRun = {
        id: 'run-1',
        suite_id: 'suite-1',
        status: 'completed',
        aggregated_outcomes: [{ riskLevel: 'high', summary: 'High risk item' }],
      };

      const mockRunItems = [
        { risk_level: 'high', key_findings: ['Finding 1'] },
        { risk_level: 'medium', key_findings: ['Finding 2'] },
      ];

      mockMaybeSingle.mockResolvedValueOnce({ data: mockRun, error: null });
      mockOrder.mockReturnValueOnce({ data: mockRunItems, error: null });

      const { routeLLM } = await import('@pravado/utils');
      (routeLLM as ReturnType<typeof vi.fn>).mockResolvedValue({
        content: JSON.stringify({
          risks: [{ category: 'Reputation', level: 'high', description: 'Test' }],
          opportunities: [],
        }),
      });

      const result = await scenarioOrchestrationService.generateSuiteRiskMap(
        mockOrgId,
        'run-1',
        { includeOpportunities: true }
      );

      expect(result.riskMap).toBeDefined();
      expect(result.riskMap.risks).toBeDefined();
    });
  });

  describe('getSuiteStats', () => {
    it('should return aggregated stats', async () => {
      mockRange.mockReturnValue({
        data: [
          { status: 'configured' },
          { status: 'configured' },
          { status: 'running' },
          { status: 'completed' },
          { status: 'archived' },
        ],
        error: null,
        count: 5,
      });

      const result = await scenarioOrchestrationService.getSuiteStats(mockOrgId);

      expect(result.totalSuites).toBe(5);
      expect(result.activeSuites).toBeGreaterThanOrEqual(0);
    });
  });

  describe('archiveSuite', () => {
    it('should archive an existing suite', async () => {
      const mockSuite = {
        id: 'suite-1',
        org_id: mockOrgId,
        name: 'Test Suite',
        status: 'configured',
      };

      mockMaybeSingle.mockResolvedValueOnce({ data: mockSuite, error: null });
      mockSingle.mockResolvedValue({
        data: { ...mockSuite, status: 'archived' },
        error: null,
      });

      const result = await scenarioOrchestrationService.archiveSuite(
        mockOrgId,
        'suite-1',
        mockUserId,
        'No longer needed'
      );

      expect(result.success).toBe(true);
      expect(result.suite?.status).toBe('archived');
    });

    it('should reject archiving already archived suite', async () => {
      const mockSuite = {
        id: 'suite-1',
        org_id: mockOrgId,
        status: 'archived',
      };

      mockMaybeSingle.mockResolvedValueOnce({ data: mockSuite, error: null });

      await expect(
        scenarioOrchestrationService.archiveSuite(
          mockOrgId,
          'suite-1',
          mockUserId
        )
      ).rejects.toThrow('already archived');
    });
  });
});
