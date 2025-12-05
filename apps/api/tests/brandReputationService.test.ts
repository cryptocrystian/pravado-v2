/**
 * Brand Reputation Service Tests (Sprint S56)
 * Comprehensive tests for brand reputation intelligence,
 * score calculation, executive radar, and alert management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { BrandReputationService } from '../src/services/brandReputationService';
import type {
  BrandReputationSnapshot,
  BrandReputationEvent,
  BrandReputationConfig,
  BrandReputationAlert,
  ReputationTimeWindow,
  ReputationComponent,
  ReputationSourceSystem,
  ReputationSignalType,
  ReputationEventSeverity,
} from '@pravado/types';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  neq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
  ilike: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  single: vi.fn(),
  rpc: vi.fn(),
  or: vi.fn().mockReturnThis(),
  is: vi.fn().mockReturnThis(),
  contains: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn(),
} as unknown as SupabaseClient;

describe('BrandReputationService', () => {
  let service: BrandReputationService;
  const testOrgId = 'org-123';
  const testUserId = 'user-456';

  beforeEach(() => {
    service = new BrandReputationService(mockSupabase);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ========================================
  // 1. Configuration Tests
  // ========================================
  describe('getOrCreateConfig', () => {
    it('should return existing config if present', async () => {
      const mockConfig = {
        id: 'config-123',
        org_id: testOrgId,
        weight_sentiment: 25,
        weight_coverage: 25,
        weight_crisis: 20,
        weight_competitive: 15,
        weight_engagement: 15,
        threshold_alert_score_drop: 10,
        threshold_critical_score: 30,
        threshold_warning_score: 50,
        baseline_score: 70,
        default_time_window: '30d',
        auto_recalculate: true,
        recalculate_interval_hours: 24,
        tracked_competitor_ids: [],
        enable_score_alerts: true,
        alert_recipients: [],
        settings: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: mockConfig, error: null }),
          }),
        }),
      } as any);

      const config = await service.getOrCreateConfig(testOrgId);

      expect(config).toBeDefined();
      expect(config.orgId).toBe(testOrgId);
      expect(config.weightSentiment).toBe(25);
    });

    it('should create default config if not present', async () => {
      const mockNewConfig = {
        id: 'config-new',
        org_id: testOrgId,
        weight_sentiment: 25,
        weight_coverage: 25,
        weight_crisis: 20,
        weight_competitive: 15,
        weight_engagement: 15,
        threshold_alert_score_drop: 10,
        threshold_critical_score: 30,
        threshold_warning_score: 50,
        default_time_window: '30d',
        auto_recalculate: true,
        recalculate_interval_hours: 24,
        tracked_competitor_ids: [],
        enable_score_alerts: true,
        alert_recipients: [],
        settings: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // First call returns null (config doesn't exist)
      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      } as any);

      // Second call creates config
      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockNewConfig, error: null }),
          }),
        }),
      } as any);

      const config = await service.getOrCreateConfig(testOrgId);

      expect(config).toBeDefined();
      expect(config.weightSentiment).toBe(25);
    });
  });

  describe('updateConfig', () => {
    it('should update config with valid weights', async () => {
      const mockConfig = {
        id: 'config-123',
        org_id: testOrgId,
        weight_sentiment: 30,
        weight_coverage: 25,
        weight_crisis: 20,
        weight_competitive: 15,
        weight_engagement: 10,
        threshold_alert_score_drop: 10,
        threshold_critical_score: 30,
        threshold_warning_score: 50,
        default_time_window: '30d',
        auto_recalculate: true,
        recalculate_interval_hours: 24,
        tracked_competitor_ids: [],
        enable_score_alerts: true,
        alert_recipients: [],
        settings: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        updated_by: testUserId,
      };

      vi.mocked(mockSupabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockConfig, error: null }),
            }),
          }),
        }),
      } as any);

      const config = await service.updateConfig(testOrgId, testUserId, {
        weightSentiment: 30,
        weightEngagement: 10,
      });

      expect(config).toBeDefined();
      expect(config.weightSentiment).toBe(30);
      expect(config.weightEngagement).toBe(10);
    });
  });

  // ========================================
  // 2. Event Recording Tests
  // ========================================
  describe('recordEvent', () => {
    it('should record a reputation event', async () => {
      const mockEvent = {
        id: 'event-123',
        org_id: testOrgId,
        source_system: 'media_monitoring',
        signal_type: 'sentiment_shift',
        delta: 5.0,
        affected_component: 'sentiment',
        severity: 'medium',
        title: 'Positive sentiment shift detected',
        description: 'Media coverage has become more positive',
        event_timestamp: new Date().toISOString(),
        context: {},
        is_processed: false,
        created_at: new Date().toISOString(),
      };

      vi.mocked(mockSupabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockEvent, error: null }),
          }),
        }),
      } as any);

      const event = await service.recordEvent(testOrgId, {
        sourceSystem: 'media_monitoring' as ReputationSourceSystem,
        signalType: 'sentiment_shift' as ReputationSignalType,
        delta: 5.0,
        affectedComponent: 'sentiment' as ReputationComponent,
        severity: 'medium' as ReputationEventSeverity,
        title: 'Positive sentiment shift detected',
        description: 'Media coverage has become more positive',
      });

      expect(event).toBeDefined();
      expect(event.delta).toBe(5.0);
      expect(event.affectedComponent).toBe('sentiment');
    });
  });

  describe('getEvents', () => {
    it('should return paginated events', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          org_id: testOrgId,
          source_system: 'media_monitoring',
          signal_type: 'coverage_spike',
          delta: 10.0,
          affected_component: 'coverage',
          severity: 'high',
          title: 'Coverage spike detected',
          event_timestamp: new Date().toISOString(),
          context: {},
          is_processed: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 'event-2',
          org_id: testOrgId,
          source_system: 'crisis_incident',
          signal_type: 'crisis_detected',
          delta: -15.0,
          affected_component: 'crisis_impact',
          severity: 'critical',
          title: 'Crisis detected',
          event_timestamp: new Date().toISOString(),
          context: {},
          is_processed: true,
          created_at: new Date().toISOString(),
        },
      ];

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({ data: mockEvents, error: null, count: 2 }),
            }),
          }),
        }),
      } as any);

      const result = await service.getEvents(testOrgId, { limit: 20, offset: 0 });

      expect(result.events).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.events[0].signalType).toBe('coverage_spike');
    });
  });

  // ========================================
  // 3. Alert Management Tests
  // ========================================
  describe('getAlerts', () => {
    it('should return active alerts', async () => {
      const mockAlerts = [
        {
          id: 'alert-1',
          org_id: testOrgId,
          severity: 'critical',
          title: 'Score dropped below critical threshold',
          message: 'Brand reputation score has fallen to 28',
          is_acknowledged: false,
          is_resolved: false,
          trigger_type: 'score_below_critical',
          trigger_value: 28,
          threshold_value: 30,
          related_event_ids: [],
          notifications_sent: [],
          metadata: {},
          created_at: new Date().toISOString(),
        },
      ];

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: vi.fn().mockResolvedValue({ data: mockAlerts, error: null, count: 1 }),
              }),
            }),
          }),
        }),
      } as any);

      const result = await service.getAlerts(testOrgId, { isResolved: false });

      expect(result.alerts).toHaveLength(1);
      expect(result.criticalCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('acknowledgeAlert', () => {
    it('should acknowledge an alert', async () => {
      const mockAlert = {
        id: 'alert-1',
        org_id: testOrgId,
        severity: 'warning',
        title: 'Score approaching warning threshold',
        message: 'Brand reputation score is at 52',
        is_acknowledged: true,
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: testUserId,
        is_resolved: false,
        trigger_type: 'score_below_warning',
        related_event_ids: [],
        notifications_sent: [],
        metadata: {},
        created_at: new Date().toISOString(),
      };

      vi.mocked(mockSupabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockAlert, error: null }),
              }),
            }),
          }),
        }),
      } as any);

      const alert = await service.acknowledgeAlert(testOrgId, testUserId, 'alert-1', 'Investigating');

      expect(alert).toBeDefined();
      expect(alert.isAcknowledged).toBe(true);
    });
  });

  describe('resolveAlert', () => {
    it('should resolve an alert', async () => {
      const mockAlert = {
        id: 'alert-1',
        org_id: testOrgId,
        severity: 'warning',
        title: 'Score approaching warning threshold',
        message: 'Brand reputation score is at 52',
        is_acknowledged: true,
        is_resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: testUserId,
        resolution_notes: 'Issue addressed through PR campaign',
        trigger_type: 'score_below_warning',
        related_event_ids: [],
        notifications_sent: [],
        metadata: {},
        created_at: new Date().toISOString(),
      };

      vi.mocked(mockSupabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockAlert, error: null }),
              }),
            }),
          }),
        }),
      } as any);

      const alert = await service.resolveAlert(
        testOrgId,
        testUserId,
        'alert-1',
        'Issue addressed through PR campaign'
      );

      expect(alert).toBeDefined();
      expect(alert.isResolved).toBe(true);
      expect(alert.resolutionNotes).toBe('Issue addressed through PR campaign');
    });
  });

  // ========================================
  // 4. Dashboard & Snapshot Tests
  // ========================================
  describe('getLatestSnapshot', () => {
    it('should return the latest snapshot', async () => {
      const mockSnapshot = {
        id: 'snapshot-123',
        org_id: testOrgId,
        overall_score: 75.5,
        previous_score: 72.0,
        score_delta: 3.5,
        trend_direction: 'up',
        sentiment_score: 80,
        coverage_score: 70,
        crisis_impact_score: 85,
        competitive_position_score: 70,
        engagement_score: 75,
        total_mentions: 150,
        positive_mentions: 100,
        negative_mentions: 25,
        neutral_mentions: 25,
        active_crisis_count: 0,
        resolved_crisis_count: 1,
        total_outreach_sent: 50,
        journalist_engagement_count: 30,
        competitive_rank: 2,
        competitors_tracked: 5,
        top_positive_drivers: [],
        top_negative_drivers: [],
        competitor_comparison: [],
        key_risks: [],
        key_opportunities: [],
        metadata: {},
        events_processed: 25,
        window_start: new Date().toISOString(),
        window_end: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: mockSnapshot, error: null }),
              }),
            }),
          }),
        }),
      } as any);

      const snapshot = await service.getLatestSnapshot(testOrgId);

      expect(snapshot).toBeDefined();
      expect(snapshot?.overallScore).toBe(75.5);
      expect(snapshot?.trendDirection).toBe('up');
    });
  });

  // ========================================
  // 5. Trend Analysis Tests
  // ========================================
  describe('getTrend', () => {
    it('should return trend data for time window', async () => {
      const mockSnapshots = [
        {
          id: 'snap-1',
          org_id: testOrgId,
          overall_score: 70,
          sentiment_score: 75,
          coverage_score: 65,
          crisis_impact_score: 80,
          competitive_position_score: 68,
          engagement_score: 72,
          active_crisis_count: 0,
          created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'snap-2',
          org_id: testOrgId,
          overall_score: 72,
          sentiment_score: 77,
          coverage_score: 67,
          crisis_impact_score: 80,
          competitive_position_score: 70,
          engagement_score: 74,
          active_crisis_count: 0,
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'snap-3',
          org_id: testOrgId,
          overall_score: 75,
          sentiment_score: 80,
          coverage_score: 70,
          crisis_impact_score: 85,
          competitive_position_score: 72,
          engagement_score: 75,
          active_crisis_count: 0,
          created_at: new Date().toISOString(),
        },
      ];

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: mockSnapshots, error: null }),
              }),
            }),
          }),
        }),
      } as any);

      const trend = await service.getTrend(testOrgId, '7d' as ReputationTimeWindow);

      expect(trend).toBeDefined();
      expect(trend.trendPoints).toHaveLength(3);
      expect(trend.overallTrend).toBe('up');
      expect(trend.startScore).toBe(70);
      expect(trend.endScore).toBe(75);
    });
  });

  // ========================================
  // 6. System Health Tests
  // ========================================
  describe('getSystemHealth', () => {
    it('should return healthy status when data is recent', async () => {
      const recentTimestamp = new Date().toISOString();

      // Mock snapshot query
      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { created_at: recentTimestamp },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any);

      // Mock event query
      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { created_at: recentTimestamp },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any);

      // Mock unprocessed event count
      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
          }),
        }),
      } as any);

      // Mock config query
      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { weight_sentiment: 25 },
              error: null,
            }),
          }),
        }),
      } as any);

      const health = await service.getSystemHealth(testOrgId);

      expect(health).toBeDefined();
      expect(health.isHealthy).toBe(true);
      expect(health.issues).toHaveLength(0);
    });
  });

  // ========================================
  // 7. Score Calculation Utility Tests
  // ========================================
  describe('getWindowBoundaries', () => {
    it('should return correct boundaries for 24h window', () => {
      const boundaries = service['getWindowBoundaries']('24h' as ReputationTimeWindow);

      const expectedDuration = 24;
      expect(boundaries.durationHours).toBe(expectedDuration);
      expect(boundaries.label).toBe('Last 24 Hours');
    });

    it('should return correct boundaries for 30d window', () => {
      const boundaries = service['getWindowBoundaries']('30d' as ReputationTimeWindow);

      const expectedDuration = 30 * 24;
      expect(boundaries.durationHours).toBe(expectedDuration);
      expect(boundaries.label).toBe('Last 30 Days');
    });
  });

  describe('determineTrend', () => {
    it('should return up for positive delta above threshold', () => {
      const trend = service['determineTrend'](5.0);
      expect(trend).toBe('up');
    });

    it('should return down for negative delta below threshold', () => {
      const trend = service['determineTrend'](-5.0);
      expect(trend).toBe('down');
    });

    it('should return flat for small delta', () => {
      const trend = service['determineTrend'](0.5);
      expect(trend).toBe('flat');
    });
  });

  describe('calculateVolatility', () => {
    it('should calculate volatility correctly', () => {
      const scores = [70, 72, 68, 75, 71];
      const volatility = service['calculateVolatility'](scores);

      // Should be the standard deviation
      expect(volatility).toBeGreaterThan(0);
      expect(volatility).toBeLessThan(10);
    });

    it('should return 0 for empty array', () => {
      const volatility = service['calculateVolatility']([]);
      expect(volatility).toBe(0);
    });

    it('should return 0 for single value', () => {
      const volatility = service['calculateVolatility']([75]);
      expect(volatility).toBe(0);
    });
  });
});
