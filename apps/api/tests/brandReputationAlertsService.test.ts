/**
 * Brand Reputation Alerts Service Tests (Sprint S57)
 *
 * Unit tests for the BrandReputationAlertsService class.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrandReputationAlertsService } from '../src/services/brandReputationAlertsService';
import {
  createMockSupabaseClient,
  createMockQueryBuilder,
  createMockSuccess,
  createMockError,
} from './helpers/supabaseMock';
import type {
  CreateReputationAlertRuleInput,
  AlertEvaluationSnapshotContext,
  BrandReputationScoreSnapshot,
} from '@pravado/types';

describe('BrandReputationAlertsService', () => {
  const mockOrgId = 'test-org-123';
  const mockUserId = 'test-user-456';
  const mockRuleId = 'rule-789';
  const mockEventId = 'event-101';
  const mockReportId = 'report-202';

  // Sample data
  const mockRuleRow = {
    id: mockRuleId,
    org_id: mockOrgId,
    name: 'Low Score Alert',
    description: 'Alert when score drops below 50',
    is_active: true,
    channel: 'in_app',
    min_overall_score: 50,
    max_overall_score: null,
    min_delta_overall_score: null,
    max_delta_overall_score: null,
    component_key: null,
    min_component_score: null,
    competitor_slug: null,
    min_competitor_gap: null,
    max_competitor_gap: null,
    min_incident_severity: null,
    link_crisis_incidents: false,
    time_window_minutes: 60,
    cooldown_minutes: 60,
    last_triggered_at: null,
    notification_config: {},
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    created_by: mockUserId,
  };

  const mockEventRow = {
    id: mockEventId,
    org_id: mockOrgId,
    rule_id: mockRuleId,
    status: 'new',
    overall_score_before: 55,
    overall_score_after: 45,
    component_scores_before: { sentiment: 60 },
    component_scores_after: { sentiment: 50 },
    competitor_gap_before: null,
    competitor_gap_after: null,
    competitor_slug: null,
    incident_ids: [],
    trigger_reason: 'Overall score 45.0 below minimum 50',
    context: {},
    triggered_at: '2024-01-01T12:00:00Z',
    acknowledged_at: null,
    acknowledged_by: null,
    resolved_at: null,
    resolved_by: null,
    resolution_notes: null,
    created_at: '2024-01-01T12:00:00Z',
    updated_at: '2024-01-01T12:00:00Z',
  };

  const mockReportRow = {
    id: mockReportId,
    org_id: mockOrgId,
    title: 'Weekly Reputation Report',
    description: null,
    report_period_start: '2024-01-01T00:00:00Z',
    report_period_end: '2024-01-07T00:00:00Z',
    frequency: 'weekly',
    format: 'executive_summary',
    status: 'generated',
    overall_score_snapshot: { overallScore: 75 },
    component_scores_snapshot: { sentiment: 80 },
    competitor_snapshot: [],
    key_metrics: {},
    trend_data: [],
    generation_started_at: '2024-01-07T12:00:00Z',
    generation_completed_at: '2024-01-07T12:01:00Z',
    generation_error: null,
    created_by_user_id: mockUserId,
    created_at: '2024-01-07T12:00:00Z',
    updated_at: '2024-01-07T12:01:00Z',
    published_at: null,
  };

  describe('Alert Rules CRUD', () => {
    it('should create an alert rule', async () => {
      const mockSupabase = createMockSupabaseClient({
        brand_reputation_alert_rules: createMockSuccess(mockRuleRow),
      });
      const service = new BrandReputationAlertsService(mockSupabase);

      const input: CreateReputationAlertRuleInput = {
        name: 'Low Score Alert',
        description: 'Alert when score drops below 50',
        isActive: true,
        channel: 'in_app',
        minOverallScore: 50,
      };

      const result = await service.createAlertRule(mockOrgId, input, mockUserId);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockRuleId);
      expect(result.name).toBe('Low Score Alert');
      expect(result.minOverallScore).toBe(50);
      expect(mockSupabase.from).toHaveBeenCalledWith('brand_reputation_alert_rules');
    });

    it('should list alert rules with pagination', async () => {
      const mockSupabase = createMockSupabaseClient();
      const queryBuilder = createMockQueryBuilder({
        data: [mockRuleRow],
        error: null,
        count: 1,
      });
      vi.spyOn(mockSupabase, 'from').mockReturnValue(queryBuilder as any);

      const service = new BrandReputationAlertsService(mockSupabase);
      const result = await service.listAlertRules(mockOrgId, { limit: 10, offset: 0 });

      expect(result).toBeDefined();
      expect(result.rules).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);
    });

    it('should get a single alert rule by ID', async () => {
      const mockSupabase = createMockSupabaseClient({
        brand_reputation_alert_rules: createMockSuccess(mockRuleRow),
      });
      const service = new BrandReputationAlertsService(mockSupabase);

      const result = await service.getAlertRule(mockOrgId, mockRuleId);

      expect(result).toBeDefined();
      expect(result?.id).toBe(mockRuleId);
    });

    it('should return null for non-existent rule', async () => {
      const mockSupabase = createMockSupabaseClient({
        brand_reputation_alert_rules: { data: null, error: { code: 'PGRST116', message: 'Not found' } },
      });
      const service = new BrandReputationAlertsService(mockSupabase);

      const result = await service.getAlertRule(mockOrgId, 'non-existent');

      expect(result).toBeNull();
    });

    it('should update an alert rule', async () => {
      const updatedRow = { ...mockRuleRow, name: 'Updated Alert' };
      const mockSupabase = createMockSupabaseClient({
        brand_reputation_alert_rules: createMockSuccess(updatedRow),
      });
      const service = new BrandReputationAlertsService(mockSupabase);

      const result = await service.updateAlertRule(mockOrgId, mockRuleId, { name: 'Updated Alert' });

      expect(result.name).toBe('Updated Alert');
    });

    it('should delete an alert rule', async () => {
      const mockSupabase = createMockSupabaseClient({
        brand_reputation_alert_rules: createMockSuccess(null),
      });
      const service = new BrandReputationAlertsService(mockSupabase);

      const result = await service.deleteAlertRule(mockOrgId, mockRuleId);

      expect(result).toBe(true);
    });
  });

  describe('Alert Evaluation Engine', () => {
    it('should trigger alert when score below threshold', async () => {
      const mockSupabase = createMockSupabaseClient();

      // Mock fetching active rules
      const rulesQueryBuilder = createMockQueryBuilder({
        data: [{ ...mockRuleRow, min_overall_score: 60 }],
        error: null,
      });

      // Mock inserting event
      const eventsQueryBuilder = createMockQueryBuilder({
        data: mockEventRow,
        error: null,
      });

      const fromMock = vi.fn((table: string) => {
        if (table === 'brand_reputation_alert_rules') {
          return rulesQueryBuilder;
        }
        if (table === 'brand_reputation_alert_events') {
          return eventsQueryBuilder;
        }
        return createMockQueryBuilder({ data: null, error: null });
      });
      vi.spyOn(mockSupabase, 'from').mockImplementation(fromMock as any);

      const service = new BrandReputationAlertsService(mockSupabase);

      const context: AlertEvaluationSnapshotContext = {
        currentSnapshot: {
          overallScore: 45,
          sentimentScore: 50,
          coverageScore: 60,
          crisisImpactScore: 70,
          competitivePositionScore: 55,
          engagementScore: 65,
          snapshotAt: '2024-01-01T12:00:00Z',
        },
        previousSnapshot: {
          overallScore: 55,
          sentimentScore: 60,
          coverageScore: 65,
          crisisImpactScore: 75,
          competitivePositionScore: 60,
          engagementScore: 70,
          snapshotAt: '2024-01-01T11:00:00Z',
        },
        evaluatedAt: '2024-01-01T12:00:00Z',
      };

      const result = await service.evaluateAlertRulesForSnapshot(mockOrgId, context);

      expect(result).toBeDefined();
      expect(result.rulesEvaluated).toBe(1);
      expect(result.rulesTriggered).toBe(1);
    });

    it('should not trigger alert when score above threshold', async () => {
      const mockSupabase = createMockSupabaseClient();

      const rulesQueryBuilder = createMockQueryBuilder({
        data: [{ ...mockRuleRow, min_overall_score: 40 }],
        error: null,
      });

      vi.spyOn(mockSupabase, 'from').mockReturnValue(rulesQueryBuilder as any);

      const service = new BrandReputationAlertsService(mockSupabase);

      const context: AlertEvaluationSnapshotContext = {
        currentSnapshot: {
          overallScore: 75,
          sentimentScore: 80,
          coverageScore: 70,
          crisisImpactScore: 90,
          competitivePositionScore: 75,
          engagementScore: 85,
          snapshotAt: '2024-01-01T12:00:00Z',
        },
        evaluatedAt: '2024-01-01T12:00:00Z',
      };

      const result = await service.evaluateAlertRulesForSnapshot(mockOrgId, context);

      expect(result.rulesTriggered).toBe(0);
    });

    it('should respect cooldown period', async () => {
      const mockSupabase = createMockSupabaseClient();

      // Rule was triggered 30 minutes ago (within 60 min cooldown)
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const rulesQueryBuilder = createMockQueryBuilder({
        data: [{ ...mockRuleRow, min_overall_score: 60, last_triggered_at: thirtyMinutesAgo }],
        error: null,
      });

      vi.spyOn(mockSupabase, 'from').mockReturnValue(rulesQueryBuilder as any);

      const service = new BrandReputationAlertsService(mockSupabase);

      const context: AlertEvaluationSnapshotContext = {
        currentSnapshot: {
          overallScore: 45,
          sentimentScore: 50,
          coverageScore: 60,
          crisisImpactScore: 70,
          competitivePositionScore: 55,
          engagementScore: 65,
          snapshotAt: new Date().toISOString(),
        },
        evaluatedAt: new Date().toISOString(),
      };

      const result = await service.evaluateAlertRulesForSnapshot(mockOrgId, context);

      expect(result.rulesCooledDown).toBe(1);
      expect(result.rulesTriggered).toBe(0);
    });
  });

  describe('Alert Events', () => {
    it('should list alert events with filters', async () => {
      const mockSupabase = createMockSupabaseClient();

      const queryBuilder = createMockQueryBuilder({
        data: [mockEventRow],
        error: null,
        count: 1,
      });

      // Mock status counts query
      const countsBuilder = createMockQueryBuilder({
        data: [{ status: 'new' }, { status: 'acknowledged' }],
        error: null,
      });

      const fromMock = vi.fn((table: string) => {
        return queryBuilder;
      });
      vi.spyOn(mockSupabase, 'from').mockImplementation(fromMock as any);

      const service = new BrandReputationAlertsService(mockSupabase);
      const result = await service.listAlertEvents(mockOrgId, { status: 'new' });

      expect(result.events).toHaveLength(1);
      expect(result.events[0].status).toBe('new');
    });

    it('should acknowledge an alert event', async () => {
      const acknowledgedRow = {
        ...mockEventRow,
        status: 'acknowledged',
        acknowledged_at: '2024-01-01T13:00:00Z',
        acknowledged_by: mockUserId,
      };
      const mockSupabase = createMockSupabaseClient({
        brand_reputation_alert_events: createMockSuccess(acknowledgedRow),
      });
      const service = new BrandReputationAlertsService(mockSupabase);

      const result = await service.acknowledgeAlertEvent(mockOrgId, mockEventId, mockUserId, 'Acknowledged');

      expect(result.status).toBe('acknowledged');
      expect(result.acknowledgedBy).toBe(mockUserId);
    });

    it('should resolve an alert event', async () => {
      const resolvedRow = {
        ...mockEventRow,
        status: 'resolved',
        resolved_at: '2024-01-01T14:00:00Z',
        resolved_by: mockUserId,
        resolution_notes: 'Issue fixed',
      };
      const mockSupabase = createMockSupabaseClient({
        brand_reputation_alert_events: createMockSuccess(resolvedRow),
      });
      const service = new BrandReputationAlertsService(mockSupabase);

      const result = await service.resolveAlertEvent(mockOrgId, mockEventId, mockUserId, 'Issue fixed');

      expect(result.status).toBe('resolved');
      expect(result.resolutionNotes).toBe('Issue fixed');
    });

    it('should mute an alert event', async () => {
      const mutedRow = { ...mockEventRow, status: 'muted' };
      const mockSupabase = createMockSupabaseClient({
        brand_reputation_alert_events: createMockSuccess(mutedRow),
      });
      const service = new BrandReputationAlertsService(mockSupabase);

      const result = await service.muteAlertEvent(mockOrgId, mockEventId, mockUserId);

      expect(result.status).toBe('muted');
    });
  });

  describe('Reports', () => {
    it('should create a report draft', async () => {
      const mockSupabase = createMockSupabaseClient({
        brand_reputation_reports: createMockSuccess(mockReportRow),
      });
      const service = new BrandReputationAlertsService(mockSupabase);

      const result = await service.createReputationReport(mockOrgId, {
        title: 'Weekly Reputation Report',
        reportPeriodStart: '2024-01-01T00:00:00Z',
        reportPeriodEnd: '2024-01-07T00:00:00Z',
        frequency: 'weekly',
        format: 'executive_summary',
      }, mockUserId);

      expect(result.report).toBeDefined();
      expect(result.report.title).toBe('Weekly Reputation Report');
    });

    it('should list reports with pagination', async () => {
      const mockSupabase = createMockSupabaseClient();
      const queryBuilder = createMockQueryBuilder({
        data: [mockReportRow],
        error: null,
        count: 1,
      });
      vi.spyOn(mockSupabase, 'from').mockReturnValue(queryBuilder as any);

      const service = new BrandReputationAlertsService(mockSupabase);
      const result = await service.listReputationReports(mockOrgId, { limit: 10 });

      expect(result.reports).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should get a report with sections and recipients', async () => {
      const mockSupabase = createMockSupabaseClient();

      const sectionRow = {
        id: 'section-1',
        report_id: mockReportId,
        org_id: mockOrgId,
        section_type: 'overview',
        order_index: 0,
        title: 'Executive Overview',
        content: 'Report content...',
        metadata: {},
        generated_at: '2024-01-07T12:01:00Z',
        generation_model: null,
        generation_prompt_tokens: null,
        generation_completion_tokens: null,
        last_edited_at: null,
        last_edited_by: null,
        created_at: '2024-01-07T12:01:00Z',
        updated_at: '2024-01-07T12:01:00Z',
      };

      const recipientRow = {
        id: 'recipient-1',
        report_id: mockReportId,
        org_id: mockOrgId,
        channel: 'email',
        target: 'ceo@example.com',
        recipient_name: 'CEO',
        is_primary: true,
        delivery_status: 'pending',
        delivered_at: null,
        delivery_error: null,
        created_at: '2024-01-07T12:01:00Z',
        updated_at: '2024-01-07T12:01:00Z',
      };

      const fromMock = vi.fn((table: string) => {
        if (table === 'brand_reputation_reports') {
          return createMockQueryBuilder({ data: mockReportRow, error: null });
        }
        if (table === 'brand_reputation_report_sections') {
          return createMockQueryBuilder({ data: [sectionRow], error: null });
        }
        if (table === 'brand_reputation_report_recipients') {
          return createMockQueryBuilder({ data: [recipientRow], error: null });
        }
        return createMockQueryBuilder({ data: null, error: null });
      });
      vi.spyOn(mockSupabase, 'from').mockImplementation(fromMock as any);

      const service = new BrandReputationAlertsService(mockSupabase);
      const result = await service.getReputationReport(mockOrgId, mockReportId);

      expect(result).toBeDefined();
      expect(result?.report.id).toBe(mockReportId);
      expect(result?.sections).toHaveLength(1);
      expect(result?.recipients).toHaveLength(1);
    });
  });

  describe('Insights', () => {
    it('should get reputation insights', async () => {
      const mockSupabase = createMockSupabaseClient();

      const snapshotRow = {
        overall_score: '75.5',
        sentiment_score: '80.0',
        coverage_score: '70.0',
        crisis_impact_score: '90.0',
        competitive_position_score: '75.0',
        engagement_score: '85.0',
      };

      const eventRow = {
        id: 'event-1',
        title: 'Positive coverage',
        description: 'Good news',
        delta: '5.0',
        affected_component: 'coverage',
        source_system: 'media_monitoring',
        event_timestamp: '2024-01-01T10:00:00Z',
      };

      const fromMock = vi.fn((table: string) => {
        if (table === 'brand_reputation_snapshots') {
          return createMockQueryBuilder({ data: snapshotRow, error: null });
        }
        if (table === 'brand_reputation_events') {
          return createMockQueryBuilder({ data: [eventRow], error: null });
        }
        if (table === 'competitor_profiles') {
          return createMockQueryBuilder({ data: [], error: null });
        }
        if (table === 'crisis_incidents') {
          return createMockQueryBuilder({ data: [], error: null });
        }
        return createMockQueryBuilder({ data: null, error: null });
      });
      vi.spyOn(mockSupabase, 'from').mockImplementation(fromMock as any);
      vi.spyOn(mockSupabase, 'rpc').mockResolvedValue({ data: [{ new_count: 2, acknowledged_count: 1, total_unresolved: 3 }], error: null });

      const service = new BrandReputationAlertsService(mockSupabase);
      const result = await service.getReputationInsights(mockOrgId, {});

      expect(result).toBeDefined();
      expect(result.currentOverallScore).toBe(75.5);
      expect(result.trend).toBe('flat'); // No delta provided
    });
  });

  describe('Error Handling', () => {
    it('should throw error when creating rule fails', async () => {
      const mockSupabase = createMockSupabaseClient({
        brand_reputation_alert_rules: createMockError('Database error'),
      });
      const service = new BrandReputationAlertsService(mockSupabase);

      await expect(
        service.createAlertRule(mockOrgId, { name: 'Test' })
      ).rejects.toThrow('Failed to create alert rule');
    });

    it('should throw error when updating rule fails', async () => {
      const mockSupabase = createMockSupabaseClient({
        brand_reputation_alert_rules: createMockError('Database error'),
      });
      const service = new BrandReputationAlertsService(mockSupabase);

      await expect(
        service.updateAlertRule(mockOrgId, mockRuleId, { name: 'Updated' })
      ).rejects.toThrow('Failed to update alert rule');
    });

    it('should throw error when deleting rule fails', async () => {
      const mockSupabase = createMockSupabaseClient({
        brand_reputation_alert_rules: createMockError('Database error'),
      });
      const service = new BrandReputationAlertsService(mockSupabase);

      await expect(
        service.deleteAlertRule(mockOrgId, mockRuleId)
      ).rejects.toThrow('Failed to delete alert rule');
    });
  });
});
