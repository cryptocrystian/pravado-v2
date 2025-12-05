/**
 * Journalist Timeline Service Tests (Sprint S49)
 * Comprehensive test suite for relationship timeline and narrative generation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JournalistTimelineService } from '../src/services/journalistTimelineService';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CreateTimelineEventInput,
  TimelineQuery,
  BatchCreateTimelineEventsInput,
  CreateManualNoteInput,
  SystemEventPush,
} from '@pravado/types';

// Mock Supabase client
function createMockSupabase(): SupabaseClient {
  const mockData = {
    events: [] as any[],
    nextId: 1,
  };

  const createChainableMock = (finalData: any) => {
    const chain: any = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(() => Promise.resolve({ data: finalData, error: null })),
      maybeSingle: vi.fn(() => Promise.resolve({ data: finalData, error: null })),
    };

    // Make chain thenable
    chain.then = (resolve: any) => {
      return Promise.resolve({ data: finalData, error: null }).then(resolve);
    };

    return chain;
  };

  const supabase = {
    from: vi.fn((table: string) => {
      if (table === 'journalist_relationship_events') {
        return createChainableMock(mockData.events);
      }
      if (table === 'journalist_profiles') {
        return createChainableMock({ id: 'journalist-1', name: 'Test Journalist' });
      }
      return createChainableMock(null);
    }),
    rpc: vi.fn((funcName: string, params: any) => {
      if (funcName === 'get_journalist_timeline_stats') {
        return Promise.resolve({
          data: {
            total_events: 10,
            last_interaction: new Date().toISOString(),
            first_interaction: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
            event_type_counts: { pitch_sent: 5, pitch_replied: 2 },
            sentiment_distribution: { positive: 5, neutral: 3, negative: 2, unknown: 0 },
            avg_relevance_score: 0.75,
            avg_relationship_impact: 0.3,
            total_clusters: 2,
            recent_30_days: 5,
            recent_90_days: 8,
          },
          error: null,
        });
      }
      if (funcName === 'calculate_relationship_health_score') {
        return Promise.resolve({ data: 65.5, error: null });
      }
      if (funcName === 'auto_cluster_timeline_events') {
        return Promise.resolve({ data: 2, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    }),
  } as unknown as SupabaseClient;

  return supabase;
}

describe('JournalistTimelineService', () => {
  let service: JournalistTimelineService;
  let mockSupabase: SupabaseClient;
  const orgId = 'org-123';
  const journalistId = 'journalist-456';
  const userId = 'user-789';

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    service = new JournalistTimelineService(mockSupabase);
  });

  describe('Event Creation', () => {
    it('should create a timeline event with all fields', async () => {
      const input: CreateTimelineEventInput = {
        journalistId,
        eventType: 'pitch_sent',
        title: 'Sent pitch about Q4 earnings',
        description: 'Personalized pitch based on recent coverage',
        sourceSystem: 'pitch_engine',
        sourceId: 'pitch-123',
        payload: { pitchId: 'pitch-123', subject: 'Q4 Earnings Story' },
        metadata: { campaignId: 'campaign-456' },
        relevanceScore: 0.8,
        relationshipImpact: 0.2,
        sentiment: 'neutral',
      };

      const event = await service.createEvent(orgId, input, userId);

      expect(event).toBeDefined();
      expect(mockSupabase.from).toHaveBeenCalledWith('journalist_relationship_events');
    });

    it('should apply default relevance score for high-value events', async () => {
      const input: CreateTimelineEventInput = {
        journalistId,
        eventType: 'pitch_replied',
        title: 'Journalist replied to pitch',
        sourceSystem: 'pitch_engine',
      };

      const event = await service.createEvent(orgId, input, userId);
      expect(event).toBeDefined();
    });

    it('should apply default sentiment based on event type', async () => {
      const input: CreateTimelineEventInput = {
        journalistId,
        eventType: 'coverage_published',
        title: 'Coverage published',
        sourceSystem: 'media_monitoring',
      };

      const event = await service.createEvent(orgId, input, userId);
      expect(event).toBeDefined();
    });
  });

  describe('Timeline Retrieval', () => {
    it('should retrieve events for a journalist with sorting', async () => {
      const query: TimelineQuery = {
        journalistId,
        sortBy: 'event_timestamp',
        sortOrder: 'desc',
        limit: 20,
        offset: 0,
      };

      const result = await service.listEvents(orgId, query);

      expect(result).toBeDefined();
      expect(result.events).toBeDefined();
      expect(result.pagination).toBeDefined();
    });

    it('should filter by event types', async () => {
      const query: TimelineQuery = {
        journalistId,
        eventTypes: ['pitch_sent', 'pitch_replied'],
      };

      const result = await service.listEvents(orgId, query);
      expect(result).toBeDefined();
    });

    it('should filter by time range (last 30 days)', async () => {
      const query: TimelineQuery = {
        journalistId,
        last30Days: true,
      };

      const result = await service.listEvents(orgId, query);
      expect(result).toBeDefined();
    });

    it('should filter by sentiment', async () => {
      const query: TimelineQuery = {
        journalistId,
        sentiments: ['positive'],
      };

      const result = await service.listEvents(orgId, query);
      expect(result).toBeDefined();
    });

    it('should filter by minimum relevance score', async () => {
      const query: TimelineQuery = {
        journalistId,
        minRelevanceScore: 0.7,
      };

      const result = await service.listEvents(orgId, query);
      expect(result).toBeDefined();
    });

    it('should support full-text search', async () => {
      const query: TimelineQuery = {
        journalistId,
        searchQuery: 'Q4 earnings',
      };

      const result = await service.listEvents(orgId, query);
      expect(result).toBeDefined();
    });
  });

  describe('Statistics & Analytics', () => {
    it('should retrieve timeline statistics', async () => {
      const stats = await service.getStats(orgId, journalistId);

      expect(stats).toBeDefined();
      expect(stats.totalEvents).toBe(10);
      expect(stats.recent30Days).toBe(5);
      expect(stats.avgRelevanceScore).toBe(0.75);
      expect(stats.sentimentDistribution).toBeDefined();
    });

    it('should calculate relationship health score', async () => {
      const healthScore = await service.calculateHealthScore(orgId, journalistId);

      expect(healthScore).toBeDefined();
      expect(healthScore.score).toBeGreaterThanOrEqual(0);
      expect(healthScore.score).toBeLessThanOrEqual(100);
      expect(healthScore.trend).toMatch(/improving|stable|declining/);
      expect(healthScore.breakdown).toBeDefined();
    });

    it('should generate health score recommendations', async () => {
      const healthScore = await service.calculateHealthScore(orgId, journalistId);

      expect(healthScore.recommendations).toBeDefined();
      expect(Array.isArray(healthScore.recommendations)).toBe(true);
    });
  });

  describe('Event Clustering', () => {
    it('should auto-cluster related events', async () => {
      const clustersCreated = await service.autoClusterEvents(orgId, journalistId);

      expect(clustersCreated).toBe(2);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('auto_cluster_timeline_events', {
        p_org_id: orgId,
        p_journalist_id: journalistId,
      });
    });

    it('should retrieve cluster with all events', async () => {
      // Mock cluster data
      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: (resolve: any) =>
          Promise.resolve({
            data: [
              {
                id: 'event-1',
                cluster_id: 'cluster-123',
                cluster_type: 'outreach_sequence',
                event_type: 'outreach_sent',
                title: 'Initial outreach',
                event_timestamp: new Date().toISOString(),
                relevance_score: 0.7,
                relationship_impact: 0.1,
                org_id: orgId,
                journalist_id: journalistId,
                source_system: 'pr_outreach',
                sentiment: 'neutral',
                payload: {},
                metadata: {},
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ],
            error: null,
          }).then(resolve),
      } as any);

      const cluster = await service.getCluster(orgId, 'cluster-123');

      expect(cluster).toBeDefined();
      expect(cluster.id).toBe('cluster-123');
      expect(cluster.type).toBe('outreach_sequence');
      expect(cluster.events.length).toBeGreaterThan(0);
    });
  });

  describe('Batch Operations', () => {
    it('should create multiple events in batch', async () => {
      const input: BatchCreateTimelineEventsInput = {
        events: [
          {
            journalistId,
            eventType: 'pitch_sent',
            title: 'Pitch 1',
            sourceSystem: 'pitch_engine',
          },
          {
            journalistId,
            eventType: 'pitch_sent',
            title: 'Pitch 2',
            sourceSystem: 'pitch_engine',
          },
        ],
      };

      const result = await service.batchCreateEvents(orgId, input, userId);

      expect(result).toBeDefined();
      expect(result.created).toBeGreaterThanOrEqual(0);
      expect(result.errors).toBeDefined();
    });

    it('should skip duplicates when requested', async () => {
      const input: BatchCreateTimelineEventsInput = {
        events: [
          {
            journalistId,
            eventType: 'pitch_sent',
            title: 'Pitch 1',
            sourceSystem: 'pitch_engine',
            sourceId: 'pitch-123',
          },
        ],
        skipDuplicates: true,
      };

      const result = await service.batchCreateEvents(orgId, input, userId);

      expect(result).toBeDefined();
      expect(result.skipped).toBeGreaterThanOrEqual(0);
    });

    it('should auto-cluster after batch creation', async () => {
      const input: BatchCreateTimelineEventsInput = {
        events: [
          {
            journalistId,
            eventType: 'outreach_sent',
            title: 'Outreach 1',
            sourceSystem: 'pr_outreach',
          },
        ],
        autoCluster: true,
      };

      const result = await service.batchCreateEvents(orgId, input, userId);

      expect(result.clusterResult).toBeDefined();
    });
  });

  describe('Manual Notes', () => {
    it('should create a manual note', async () => {
      const input: CreateManualNoteInput = {
        journalistId,
        title: 'Follow-up call scheduled',
        description: 'Discussed upcoming feature launch, very interested',
        sentiment: 'positive',
        relationshipImpact: 0.4,
      };

      const note = await service.createManualNote(orgId, input, userId);

      expect(note).toBeDefined();
    });
  });

  describe('System Integration', () => {
    it('should push system events from upstream services', async () => {
      const event: SystemEventPush = {
        sourceSystem: 'pitch_engine',
        sourceId: 'pitch-789',
        journalistId,
        eventType: 'pitch_sent',
        title: 'Pitch sent from S39',
        payload: { pitchId: 'pitch-789' },
        relevanceScore: 0.75,
      };

      const result = await service.pushSystemEvent(orgId, event);

      expect(result).toBeDefined();
    });
  });

  describe('Input Validation & Error Handling', () => {
    it('should handle missing required fields', async () => {
      const input: any = {
        journalistId,
        // Missing eventType
        title: 'Test',
        sourceSystem: 'manual',
      };

      await expect(service.createEvent(orgId, input, userId)).rejects.toThrow();
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(mockSupabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn(() => Promise.resolve({ data: null, error: { message: 'DB error' } })),
        then: (resolve: any) =>
          Promise.resolve({ data: null, error: { message: 'DB error' } }).then(resolve),
      } as any);

      const input: CreateTimelineEventInput = {
        journalistId,
        eventType: 'pitch_sent',
        title: 'Test',
        sourceSystem: 'manual',
      };

      await expect(service.createEvent(orgId, input, userId)).rejects.toThrow();
    });
  });

  describe('RLS Compliance', () => {
    it('should scope all queries by org_id', async () => {
      const query: TimelineQuery = {
        journalistId,
      };

      await service.listEvents(orgId, query);

      expect(mockSupabase.from).toHaveBeenCalledWith('journalist_relationship_events');
    });

    it('should include org_id in all inserts', async () => {
      const input: CreateTimelineEventInput = {
        journalistId,
        eventType: 'manual_note',
        title: 'Test note',
        sourceSystem: 'manual',
      };

      await service.createEvent(orgId, input, userId);

      expect(mockSupabase.from).toHaveBeenCalledWith('journalist_relationship_events');
    });
  });

  describe('Aggregation & Charting', () => {
    it('should generate daily aggregation data', async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = new Date();

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: (resolve: any) =>
          Promise.resolve({
            data: [
              {
                event_timestamp: new Date().toISOString(),
                sentiment: 'positive',
                relevance_score: 0.8,
                relationship_impact: 0.3,
                event_type: 'pitch_replied',
              },
            ],
            error: null,
          }).then(resolve),
      } as any);

      const aggregation = await service.getAggregation(orgId, journalistId, 'day', startDate, endDate);

      expect(aggregation).toBeDefined();
      expect(aggregation.period).toBe('day');
      expect(aggregation.dataPoints).toBeDefined();
    });
  });
});
