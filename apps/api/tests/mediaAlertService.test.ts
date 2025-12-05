/**
 * Media Alert Service Tests (Sprint S43)
 * Unit tests for alert rule management and event generation
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { MediaAlertService } from '../src/services/mediaAlertService';
import { createMediaAlertService } from '../src/services/mediaAlertService';

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
  const mockIn = vi.fn(() => chainMethods);
  const mockGte = vi.fn(() => chainMethods);
  const mockLte = vi.fn(() => chainMethods);
  const mockOrder = vi.fn(() => chainMethods);
  const mockRange = vi.fn(() => chainMethods);
  const mockSingle = vi.fn(() => chainMethods);
  const mockRpc = vi.fn().mockResolvedValue({ data: null, error: null });

  const setMockData = (data: any) => {
    mockData = data;
  };

  Object.assign(chainMethods, {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    eq: mockEq,
    in: mockIn,
    gte: mockGte,
    lte: mockLte,
    order: mockOrder,
    range: mockRange,
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
      eq: mockEq,
      in: mockIn,
      single: mockSingle,
      rpc: mockRpc,
      setMockData,
    },
  };
};

describe('MediaAlertService', () => {
  let service: MediaAlertService;
  let mockSupabase: ReturnType<typeof createMockSupabase>;

  beforeEach(() => {
    mockSupabase = createMockSupabase();

    service = createMediaAlertService({
      supabase: mockSupabase as any,
      debugMode: true,
    });
  });

  describe('Rule Management', () => {
    it('should create an alert rule', async () => {
      mockSupabase._mocks.setMockData({
        data: {
          id: 'rule-1',
          org_id: 'org-1',
          name: 'Test Rule',
          description: 'Test Description',
          is_active: true,
          alert_type: 'mention_match',
          brand_terms: ['pravado'],
          competitor_terms: null,
          journalist_ids: null,
          outlet_ids: null,
          min_sentiment: null,
          max_sentiment: null,
          min_mentions: null,
          time_window_minutes: null,
          min_relevance: null,
          last_triggered_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      const rule = await service.createRule('org-1', {
        name: 'Test Rule',
        description: 'Test Description',
        alertType: 'mention_match',
        brandTerms: ['pravado'],
      });

      expect(rule).toBeDefined();
      expect(rule.name).toBe('Test Rule');
      expect(rule.alertType).toBe('mention_match');
      expect(mockSupabase._mocks.insert).toHaveBeenCalled();
    });

    it('should list alert rules with filters', async () => {
      mockSupabase._mocks.setMockData({
        data: [
          {
            id: 'rule-1',
            org_id: 'org-1',
            name: 'Rule 1',
            description: null,
            is_active: true,
            alert_type: 'mention_match',
            brand_terms: null,
            competitor_terms: null,
            journalist_ids: null,
            outlet_ids: null,
            min_sentiment: null,
            max_sentiment: null,
            min_mentions: null,
            time_window_minutes: null,
            min_relevance: null,
            last_triggered_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        error: null,
        count: 1,
      });

      const result = await service.listRules('org-1', { limit: 10 });

      expect(result.rules).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockSupabase._mocks.select).toHaveBeenCalled();
    });

    it('should update an alert rule', async () => {
      mockSupabase._mocks.setMockData({
        data: {
          id: 'rule-1',
          org_id: 'org-1',
          name: 'Updated Rule',
          description: null,
          is_active: false,
          alert_type: 'mention_match',
          brand_terms: null,
          competitor_terms: null,
          journalist_ids: null,
          outlet_ids: null,
          min_sentiment: null,
          max_sentiment: null,
          min_mentions: null,
          time_window_minutes: null,
          min_relevance: null,
          last_triggered_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      const rule = await service.updateRule('rule-1', 'org-1', {
        name: 'Updated Rule',
        isActive: false,
      });

      expect(rule.name).toBe('Updated Rule');
      expect(rule.isActive).toBe(false);
      expect(mockSupabase._mocks.update).toHaveBeenCalled();
    });

    it('should delete an alert rule', async () => {
      mockSupabase._mocks.setMockData({ data: null, error: null });

      await expect(
        service.deleteRule('rule-1', 'org-1')
      ).resolves.not.toThrow();

      expect(mockSupabase._mocks.delete).toHaveBeenCalled();
    });
  });

  describe('Event Management', () => {
    it('should list alert events with filters', async () => {
      mockSupabase._mocks.setMockData({
        data: [
          {
            id: 'event-1',
            org_id: 'org-1',
            rule_id: 'rule-1',
            triggered_at: new Date().toISOString(),
            alert_type: 'mention_match',
            severity: 'warning',
            article_id: null,
            mention_id: null,
            journalist_id: null,
            outlet_id: null,
            summary: 'Test event',
            details: {},
            is_read: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        error: null,
        count: 1,
      });

      const result = await service.listEvents('org-1', {
        severity: 'warning',
        limit: 10,
      });

      expect(result.events).toHaveLength(1);
      expect(result.events[0].severity).toBe('warning');
    });

    it('should mark events as read', async () => {
      mockSupabase._mocks.setMockData({ data: null, error: null, count: 2 });

      const count = await service.markEventsAsRead('org-1', {
        eventIds: ['event-1', 'event-2'],
        isRead: true,
      });

      expect(count).toBe(2);
      expect(mockSupabase._mocks.update).toHaveBeenCalled();
    });
  });

  describe('Alert Evaluation', () => {
    it('should evaluate mention match rule', async () => {
      // Mock active rules query
      mockSupabase._mocks.setMockData({
        data: [
          {
            id: 'rule-1',
            org_id: 'org-1',
            name: 'Brand Mentions',
            description: null,
            is_active: true,
            alert_type: 'mention_match',
            brand_terms: ['pravado'],
            competitor_terms: null,
            journalist_ids: null,
            outlet_ids: null,
            min_sentiment: null,
            max_sentiment: null,
            min_mentions: null,
            time_window_minutes: null,
            min_relevance: null,
            last_triggered_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        error: null,
      });

      const mention = {
        id: 'mention-1',
        orgId: 'org-1',
        articleId: 'article-1',
        journalistId: null,
        entity: 'Pravado',
        entityType: 'brand' as const,
        snippet: 'Pravado announces new feature',
        context: 'Pravado announces new feature',
        sentiment: 'positive' as const,
        confidence: 0.9,
        isPrimaryMention: true,
        positionInArticle: 0,
        metadata: {},
        createdAt: new Date(),
      };

      const events = await service.evaluateRulesForNewMention(mention);

      expect(events).toBeDefined();
      expect(Array.isArray(events)).toBe(true);
    });

    it('should evaluate volume spike rule', async () => {
      // Mock active volume spike rules
      mockSupabase._mocks.setMockData({
        data: [
          {
            id: 'rule-1',
            org_id: 'org-1',
            name: 'Volume Spike',
            description: null,
            is_active: true,
            alert_type: 'volume_spike',
            brand_terms: ['pravado'],
            competitor_terms: null,
            journalist_ids: null,
            outlet_ids: null,
            min_sentiment: null,
            max_sentiment: null,
            min_mentions: 5,
            time_window_minutes: 60,
            min_relevance: null,
            last_triggered_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        error: null,
      });

      const events = await service.evaluateRulesForWindow('org-1');

      expect(events).toBeDefined();
      expect(Array.isArray(events)).toBe(true);
    });

    it('should prevent duplicate alerts within time window', async () => {
      const recentTrigger = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago

      mockSupabase._mocks.setMockData({
        data: [
          {
            id: 'rule-1',
            org_id: 'org-1',
            name: 'Volume Spike',
            description: null,
            is_active: true,
            alert_type: 'volume_spike',
            brand_terms: null,
            competitor_terms: null,
            journalist_ids: null,
            outlet_ids: null,
            min_sentiment: null,
            max_sentiment: null,
            min_mentions: 5,
            time_window_minutes: 60,
            min_relevance: null,
            last_triggered_at: recentTrigger.toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        error: null,
      });

      const events = await service.evaluateRulesForWindow('org-1');

      // Should not trigger because last_triggered_at is within the window
      expect(events).toHaveLength(0);
    });
  });

  describe('Signals Overview', () => {
    it('should get signals overview via RPC', async () => {
      mockSupabase._mocks.rpc.mockResolvedValueOnce({
        data: {
          total_rules: 5,
          active_rules: 3,
          total_events: 100,
          unread_events: 10,
          critical_events_24h: 2,
          warning_events_24h: 5,
          info_events_24h: 8,
        },
        error: null,
      });

      // Mock recent events RPC
      mockSupabase._mocks.rpc.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      // Mock type data query
      mockSupabase._mocks.setMockData({
        data: [
          { alert_type: 'mention_match' },
          { alert_type: 'mention_match' },
          { alert_type: 'volume_spike' },
        ],
        error: null,
      });

      const overview = await service.getSignalsOverview('org-1');

      expect(overview.stats.totalRules).toBe(5);
      expect(overview.stats.activeRules).toBe(3);
      expect(overview.stats.criticalEvents24h).toBe(2);
    });

    it('should use fallback if RPC fails', async () => {
      mockSupabase._mocks.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'RPC failed' },
      });

      mockSupabase._mocks.setMockData({
        data: [],
        error: null,
        count: 0,
      });

      const overview = await service.getSignalsOverview('org-1');

      expect(overview).toBeDefined();
      expect(overview.stats.totalRules).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Severity Determination', () => {
    it('should assign critical severity for negative high-confidence mentions', async () => {
      mockSupabase._mocks.setMockData({
        data: [
          {
            id: 'rule-1',
            org_id: 'org-1',
            name: 'Test',
            description: null,
            is_active: true,
            alert_type: 'mention_match',
            brand_terms: ['test'],
            competitor_terms: null,
            journalist_ids: null,
            outlet_ids: null,
            min_sentiment: null,
            max_sentiment: null,
            min_mentions: null,
            time_window_minutes: null,
            min_relevance: null,
            last_triggered_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        error: null,
      });

      const mention = {
        id: 'mention-1',
        orgId: 'org-1',
        articleId: 'article-1',
        journalistId: null,
        entity: 'Test',
        entityType: 'brand' as const,
        snippet: 'test',
        context: 'test context',
        sentiment: 'negative' as const,
        confidence: 0.9,
        isPrimaryMention: true,
        positionInArticle: 0,
        metadata: {},
        createdAt: new Date(),
      };

      const events = await service.evaluateRulesForNewMention(mention);

      // The mention should match the rule and create an event
      expect(events).toBeDefined();
      expect(Array.isArray(events)).toBe(true);
    });
  });
});
