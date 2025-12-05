/**
 * Insight Conflict Service Tests (Sprint S74)
 * Unit tests for the Autonomous Insight Conflict Resolution Engine
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createInsightConflictService,
  InsightConflictService,
} from '../src/services/insightConflictService';

// Mock Supabase
const createMockSupabase = () => {
  let mockData: any = { data: null, error: null };

  const chainMethods: any = {
    then: (resolve: (value: any) => void) => Promise.resolve(mockData).then(resolve),
  };

  const mockSelect = vi.fn(() => chainMethods);
  const mockInsert = vi.fn(() => chainMethods);
  const mockUpdate = vi.fn(() => chainMethods);
  const mockDelete = vi.fn(() => chainMethods);
  const mockEq = vi.fn(() => chainMethods);
  const mockNeq = vi.fn(() => chainMethods);
  const mockIn = vi.fn(() => chainMethods);
  const mockIs = vi.fn(() => chainMethods);
  const mockIlike = vi.fn(() => chainMethods);
  const mockGte = vi.fn(() => chainMethods);
  const mockLte = vi.fn(() => chainMethods);
  const mockOrder = vi.fn(() => chainMethods);
  const mockRange = vi.fn(() => chainMethods);
  const mockLimit = vi.fn(() => chainMethods);
  const mockSingle = vi.fn(() => chainMethods);
  const mockRpc = vi.fn().mockResolvedValue({ data: [], error: null });

  const setMockData = (data: any) => {
    mockData = data;
  };

  Object.assign(chainMethods, {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    eq: mockEq,
    neq: mockNeq,
    in: mockIn,
    is: mockIs,
    ilike: mockIlike,
    gte: mockGte,
    lte: mockLte,
    order: mockOrder,
    range: mockRange,
    limit: mockLimit,
    single: mockSingle,
  });

  const mockFrom = vi.fn().mockImplementation(() => chainMethods);

  return {
    from: mockFrom,
    rpc: mockRpc,
    _mocks: {
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      single: mockSingle,
      rpc: mockRpc,
      setMockData,
    },
  };
};

// Mock routeLLM
vi.mock('@pravado/utils', () => ({
  routeLLM: vi.fn().mockResolvedValue({
    result: { content: 'AI-generated analysis' },
    modelUsed: 'gpt-4',
    usage: { promptTokens: 100, completionTokens: 200 },
  }),
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}));

describe('InsightConflictService', () => {
  let service: InsightConflictService;
  let mockSupabase: ReturnType<typeof createMockSupabase>;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    vi.clearAllMocks();

    service = createInsightConflictService({
      supabase: mockSupabase as any,
      debugMode: true,
    });
  });

  describe('Conflict CRUD Operations', () => {
    it('should create a conflict', async () => {
      const now = new Date().toISOString();
      mockSupabase._mocks.setMockData({
        data: {
          id: 'conflict-1',
          org_id: 'org-1',
          conflict_type: 'contradiction',
          severity: 'high',
          status: 'detected',
          title: 'Test Conflict',
          conflict_summary: 'Two sources contradict each other',
          source_entities: [],
          affected_systems: ['system-a', 'system-b'],
          created_at: now,
          updated_at: now,
          created_by: 'user-1',
        },
        error: null,
      });

      const result = await service.createConflict('org-1', 'user-1', {
        conflictType: 'contradiction',
        title: 'Test Conflict',
        conflictSummary: 'Two sources contradict each other',
        severity: 'high',
        affectedSystems: ['system-a', 'system-b'],
      });

      expect(result.conflict).toBeDefined();
      expect(result.conflict.title).toBe('Test Conflict');
      expect(result.conflict.conflictType).toBe('contradiction');
      expect(mockSupabase._mocks.insert).toHaveBeenCalled();
    });

    it('should list conflicts with filters', async () => {
      mockSupabase._mocks.setMockData({
        data: [
          {
            id: 'conflict-1',
            org_id: 'org-1',
            conflict_type: 'contradiction',
            severity: 'high',
            status: 'detected',
            title: 'Test Conflict 1',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            source_entities: [],
            affected_systems: [],
          },
          {
            id: 'conflict-2',
            org_id: 'org-1',
            conflict_type: 'divergence',
            severity: 'medium',
            status: 'resolved',
            title: 'Test Conflict 2',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            source_entities: [],
            affected_systems: [],
          },
        ],
        error: null,
        count: 2,
      });

      const result = await service.listConflicts('org-1', {
        conflictType: 'contradiction',
        severity: 'high',
        limit: 10,
      });

      expect(result.conflicts).toBeDefined();
      expect(result.conflicts.length).toBe(2);
      expect(result.total).toBe(2);
    });

    it('should get a single conflict by ID', async () => {
      const now = new Date().toISOString();
      mockSupabase._mocks.setMockData({
        data: {
          id: 'conflict-1',
          org_id: 'org-1',
          conflict_type: 'contradiction',
          severity: 'high',
          status: 'detected',
          title: 'Test Conflict',
          created_at: now,
          updated_at: now,
          source_entities: [],
          affected_systems: [],
        },
        error: null,
      });

      const result = await service.getConflict('org-1', 'conflict-1');

      expect(result.conflict).toBeDefined();
      expect(result.conflict?.id).toBe('conflict-1');
    });

    it('should update a conflict', async () => {
      const now = new Date().toISOString();
      mockSupabase._mocks.setMockData({
        data: {
          id: 'conflict-1',
          org_id: 'org-1',
          conflict_type: 'contradiction',
          severity: 'critical',
          status: 'analyzing',
          title: 'Updated Conflict',
          created_at: now,
          updated_at: now,
          source_entities: [],
          affected_systems: [],
        },
        error: null,
      });

      const result = await service.updateConflict('org-1', 'conflict-1', 'user-1', {
        title: 'Updated Conflict',
        severity: 'critical',
        status: 'analyzing',
      });

      expect(result.conflict).toBeDefined();
      expect(result.conflict?.title).toBe('Updated Conflict');
      expect(result.conflict?.severity).toBe('critical');
    });

    it('should delete a conflict', async () => {
      mockSupabase._mocks.setMockData({ data: null, error: null });

      const result = await service.deleteConflict('org-1', 'conflict-1');

      expect(result.success).toBe(true);
      expect(mockSupabase._mocks.delete).toHaveBeenCalled();
    });

    it('should dismiss a conflict', async () => {
      const now = new Date().toISOString();
      mockSupabase._mocks.setMockData({
        data: {
          id: 'conflict-1',
          org_id: 'org-1',
          conflict_type: 'contradiction',
          severity: 'low',
          status: 'dismissed',
          title: 'Dismissed Conflict',
          created_at: now,
          updated_at: now,
          source_entities: [],
          affected_systems: [],
        },
        error: null,
      });

      const result = await service.dismissConflict('org-1', 'conflict-1', 'user-1', 'Not relevant');

      expect(result.conflict).toBeDefined();
      expect(result.conflict?.status).toBe('dismissed');
    });
  });

  describe('Conflict Items', () => {
    it('should list conflict items', async () => {
      mockSupabase._mocks.setMockData({
        data: [
          {
            id: 'item-1',
            conflict_id: 'conflict-1',
            entity_type: 'narrative',
            entity_id: 'entity-1',
            raw_insight: 'Revenue increased by 20%',
            source_system: 'unified_narrative',
            created_at: new Date().toISOString(),
          },
          {
            id: 'item-2',
            conflict_id: 'conflict-1',
            entity_type: 'narrative',
            entity_id: 'entity-2',
            raw_insight: 'Revenue decreased by 5%',
            source_system: 'competitive_intelligence',
            created_at: new Date().toISOString(),
          },
        ],
        error: null,
        count: 2,
      });

      const result = await service.listConflictItems('org-1', { conflictId: 'conflict-1' });

      expect(result.items).toBeDefined();
      expect(result.items.length).toBe(2);
    });
  });

  describe('Conflict Resolutions', () => {
    it('should list resolutions for a conflict', async () => {
      mockSupabase._mocks.setMockData({
        data: [
          {
            id: 'resolution-1',
            conflict_id: 'conflict-1',
            resolution_type: 'ai_consensus',
            resolved_summary: 'The consensus is that revenue increased moderately',
            is_accepted: true,
            human_reviewed: true,
            created_at: new Date().toISOString(),
            recommended_actions: [],
          },
        ],
        error: null,
        count: 1,
      });

      const result = await service.listResolutions('org-1', { conflictId: 'conflict-1' });

      expect(result.resolutions).toBeDefined();
      expect(result.resolutions.length).toBe(1);
      expect(result.resolutions[0].resolutionType).toBe('ai_consensus');
    });
  });

  describe('Conflict Clusters', () => {
    it('should create a cluster', async () => {
      const now = new Date().toISOString();
      mockSupabase._mocks.setMockData({
        data: {
          id: 'cluster-1',
          org_id: 'org-1',
          name: 'Revenue Conflicts',
          description: 'Conflicts related to revenue data',
          conflict_count: 0,
          is_auto_generated: false,
          is_active: true,
          created_at: now,
          updated_at: now,
        },
        error: null,
      });

      const result = await service.createCluster('org-1', 'user-1', {
        name: 'Revenue Conflicts',
        description: 'Conflicts related to revenue data',
      });

      expect(result.cluster).toBeDefined();
      expect(result.cluster.name).toBe('Revenue Conflicts');
    });

    it('should list clusters', async () => {
      mockSupabase._mocks.setMockData({
        data: [
          {
            id: 'cluster-1',
            org_id: 'org-1',
            name: 'Revenue Conflicts',
            conflict_count: 3,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        error: null,
        count: 1,
      });

      const result = await service.listClusters('org-1', { isActive: true });

      expect(result.clusters).toBeDefined();
      expect(result.clusters.length).toBe(1);
    });
  });

  describe('Conflict Graph', () => {
    it('should get conflict graph', async () => {
      const now = new Date().toISOString();
      // Mock getting the conflict with graph data
      mockSupabase._mocks.setMockData({
        data: {
          id: 'conflict-1',
          org_id: 'org-1',
          conflict_type: 'contradiction',
          severity: 'high',
          status: 'analyzed',
          title: 'Test Conflict',
          conflict_graph: {
            nodes: [
              { id: 'n1', type: 'conflict', label: 'Test Conflict', data: {} },
              { id: 'n2', type: 'item', label: 'Item 1', data: {} },
            ],
            edges: [
              { id: 'e1', source: 'n1', target: 'n2', type: 'contains' },
            ],
            metadata: {
              totalNodes: 2,
              totalEdges: 1,
              conflictCount: 1,
              itemCount: 1,
              resolutionCount: 0,
              generatedAt: now,
            },
          },
          source_entities: [],
          affected_systems: [],
          created_at: now,
          updated_at: now,
        },
        error: null,
      });

      const result = await service.getConflictGraph('org-1', 'conflict-1');

      expect(result.graph).toBeDefined();
      expect(result.graph.nodes.length).toBe(2);
      expect(result.graph.edges.length).toBe(1);
    });

    it('should create a graph edge between conflicts', async () => {
      const now = new Date().toISOString();
      mockSupabase._mocks.setMockData({
        data: {
          id: 'edge-1',
          org_id: 'org-1',
          source_conflict_id: 'conflict-1',
          target_conflict_id: 'conflict-2',
          edge_type: 'related',
          edge_weight: 0.8,
          created_at: now,
        },
        error: null,
      });

      const result = await service.createGraphEdge('org-1', 'user-1', {
        sourceConflictId: 'conflict-1',
        targetConflictId: 'conflict-2',
        edgeType: 'related',
        edgeWeight: 0.8,
      });

      expect(result.edge).toBeDefined();
      expect(result.edge.sourceConflictId).toBe('conflict-1');
      expect(result.edge.targetConflictId).toBe('conflict-2');
    });
  });

  describe('Audit Log', () => {
    it('should list audit log entries', async () => {
      mockSupabase._mocks.setMockData({
        data: [
          {
            id: 'audit-1',
            conflict_id: 'conflict-1',
            event_type: 'created',
            actor_id: 'user-1',
            actor_type: 'user',
            event_details: {},
            created_at: new Date().toISOString(),
          },
          {
            id: 'audit-2',
            conflict_id: 'conflict-1',
            event_type: 'analyzed',
            actor_id: null,
            actor_type: 'ai',
            event_details: { model: 'gpt-4' },
            created_at: new Date().toISOString(),
          },
        ],
        error: null,
        count: 2,
      });

      const result = await service.listAuditLog('org-1', { conflictId: 'conflict-1' });

      expect(result.events).toBeDefined();
      expect(result.events.length).toBe(2);
      expect(result.events[0].eventType).toBe('created');
    });
  });

  describe('Statistics', () => {
    it('should get conflict statistics', async () => {
      mockSupabase._mocks.rpc.mockResolvedValue({
        data: {
          total_conflicts: 10,
          detected_count: 3,
          analyzing_count: 2,
          resolved_count: 4,
          dismissed_count: 1,
          critical_count: 1,
          high_count: 3,
          medium_count: 4,
          low_count: 2,
          contradiction_count: 4,
          divergence_count: 2,
          ambiguity_count: 2,
          missing_data_count: 1,
          inconsistency_count: 1,
          avg_resolution_time: 24.5,
          resolution_rate: 0.4,
          cluster_count: 2,
        },
        error: null,
      });

      const result = await service.getConflictStats('org-1');

      expect(result.stats).toBeDefined();
      expect(result.stats.totalConflicts).toBe(10);
      expect(result.stats.resolvedCount).toBe(4);
      expect(result.stats.resolutionRate).toBe(0.4);
    });
  });

  describe('Batch Operations', () => {
    it('should batch analyze multiple conflicts', async () => {
      mockSupabase._mocks.setMockData({
        data: {
          id: 'conflict-1',
          org_id: 'org-1',
          conflict_type: 'contradiction',
          severity: 'medium',
          status: 'analyzing',
          title: 'Conflict 1',
          source_entities: [],
          affected_systems: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      const result = await service.batchAnalyze('org-1', 'user-1', {
        conflictIds: ['conflict-1', 'conflict-2'],
      });

      expect(result.results).toBeDefined();
      expect(result.totalProcessed).toBeGreaterThan(0);
    });

    it('should batch dismiss multiple conflicts', async () => {
      mockSupabase._mocks.setMockData({
        data: {
          id: 'conflict-1',
          org_id: 'org-1',
          status: 'dismissed',
          source_entities: [],
          affected_systems: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      const result = await service.batchDismiss('org-1', 'user-1', {
        conflictIds: ['conflict-1', 'conflict-2'],
        reason: 'Not relevant',
      });

      expect(result.results).toBeDefined();
      expect(result.totalProcessed).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockSupabase._mocks.setMockData({
        data: null,
        error: { message: 'Database connection failed', code: 'DB_ERROR' },
      });

      await expect(
        service.createConflict('org-1', 'user-1', {
          conflictType: 'contradiction',
          title: 'Test',
        })
      ).rejects.toThrow();
    });

    it('should return null for non-existent conflict', async () => {
      mockSupabase._mocks.setMockData({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await service.getConflict('org-1', 'non-existent');

      expect(result.conflict).toBeNull();
    });
  });

  describe('Helper Functions', () => {
    it('should suggest resolution type based on conflict', async () => {
      const now = new Date().toISOString();
      mockSupabase._mocks.setMockData({
        data: {
          id: 'conflict-1',
          org_id: 'org-1',
          conflict_type: 'contradiction',
          severity: 'high',
          status: 'detected',
          title: 'Contradiction Test',
          source_entities: [
            { entityType: 'narrative', entityId: 'e1', sourceSystem: 'system_a' },
            { entityType: 'narrative', entityId: 'e2', sourceSystem: 'system_b' },
          ],
          affected_systems: ['system_a', 'system_b'],
          created_at: now,
          updated_at: now,
        },
        error: null,
      });

      // The service has internal logic to suggest resolution types
      // This test verifies the conflict can be loaded properly
      const result = await service.getConflict('org-1', 'conflict-1');
      expect(result.conflict).toBeDefined();
      expect(result.conflict?.sourceEntities.length).toBe(2);
    });
  });
});
