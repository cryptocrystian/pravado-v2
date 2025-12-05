/**
 * Executive Digest Service Tests (Sprint S62)
 * Comprehensive tests for automated strategic briefs and digest generation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createExecutiveDigestService, type ExecutiveDigestService } from '../src/services/executiveDigestService';
import type {
  CreateExecDigestInput,
  UpdateExecDigestInput,
  GenerateExecDigestInput,
  DeliverExecDigestInput,
  AddExecDigestRecipientInput,
} from '@pravado/types';

// Mock fetch for OpenAI calls
global.fetch = vi.fn();

// Mock Supabase client
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
  ilike: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  single: vi.fn(),
  rpc: vi.fn(),
  storage: {
    from: vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/digest.pdf' } }),
    }),
  },
} as unknown as SupabaseClient;

describe('ExecutiveDigestService', () => {
  let service: ExecutiveDigestService;
  const testOrgId = 'org-123';
  const testUserId = 'user-456';
  const testDigestId = 'digest-789';

  beforeEach(() => {
    service = createExecutiveDigestService({
      supabase: mockSupabase,
      openaiApiKey: 'test-api-key',
      storageBucket: 'test-bucket',
      debugMode: true,
    });
    vi.clearAllMocks();

    // Default mock for OpenAI API
    (global.fetch as vi.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: 'Generated content' } }],
        usage: { total_tokens: 100 },
      }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ========================================
  // 1. Digest Creation Tests
  // ========================================
  describe('createDigest', () => {
    it('should create a digest with all fields', async () => {
      const input: CreateExecDigestInput = {
        title: 'Weekly Executive Digest',
        description: 'Weekly summary for leadership team',
        deliveryPeriod: 'weekly',
        timeWindow: '7d',
        scheduleDayOfWeek: 1, // Monday
        scheduleHour: 8,
        scheduleTimezone: 'America/New_York',
        includeRecommendations: true,
        includeKpis: true,
        includeInsights: true,
        includeRiskSummary: true,
        includeReputationSummary: true,
        includeCompetitiveSummary: true,
        includeMediaPerformance: true,
        includeCrisisStatus: true,
        includeGovernance: true,
        isActive: true,
      };

      const mockDigest = {
        id: testDigestId,
        org_id: testOrgId,
        title: input.title,
        description: input.description,
        delivery_period: input.deliveryPeriod,
        time_window: input.timeWindow,
        schedule_day_of_week: input.scheduleDayOfWeek,
        schedule_hour: input.scheduleHour,
        schedule_timezone: input.scheduleTimezone,
        include_recommendations: input.includeRecommendations,
        include_kpis: input.includeKpis,
        include_insights: input.includeInsights,
        include_risk_summary: input.includeRiskSummary,
        include_reputation_summary: input.includeReputationSummary,
        include_competitive_summary: input.includeCompetitiveSummary,
        include_media_performance: input.includeMediaPerformance,
        include_crisis_status: input.includeCrisisStatus,
        include_governance: input.includeGovernance,
        is_active: input.isActive,
        is_archived: false,
        summary: {},
        kpi_snapshot: [],
        insights_snapshot: [],
        pdf_storage_path: null,
        pdf_generated_at: null,
        next_delivery_at: null,
        last_delivered_at: null,
        created_by: testUserId,
        updated_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(mockSupabase.single).mockResolvedValueOnce({
        data: mockDigest,
        error: null,
      } as any);

      const result = await service.createDigest(testOrgId, testUserId, input);

      expect(mockSupabase.from).toHaveBeenCalledWith('exec_digests');
      expect(result.title).toBe(input.title);
      expect(result.deliveryPeriod).toBe(input.deliveryPeriod);
      expect(result.timeWindow).toBe(input.timeWindow);
      expect(result.scheduleHour).toBe(input.scheduleHour);
    });

    it('should create a digest with default values when minimal input provided', async () => {
      const input: CreateExecDigestInput = {
        title: 'Basic Digest',
      };

      const mockDigest = {
        id: testDigestId,
        org_id: testOrgId,
        title: input.title,
        description: null,
        delivery_period: 'weekly',
        time_window: '7d',
        schedule_day_of_week: 1,
        schedule_hour: 8,
        schedule_timezone: 'UTC',
        include_recommendations: true,
        include_kpis: true,
        include_insights: true,
        include_risk_summary: true,
        include_reputation_summary: true,
        include_competitive_summary: true,
        include_media_performance: true,
        include_crisis_status: true,
        include_governance: true,
        is_active: true,
        is_archived: false,
        summary: {},
        kpi_snapshot: [],
        insights_snapshot: [],
        pdf_storage_path: null,
        pdf_generated_at: null,
        next_delivery_at: null,
        last_delivered_at: null,
        created_by: testUserId,
        updated_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(mockSupabase.single).mockResolvedValueOnce({
        data: mockDigest,
        error: null,
      } as any);

      const result = await service.createDigest(testOrgId, testUserId, input);

      expect(result.title).toBe('Basic Digest');
      expect(result.deliveryPeriod).toBe('weekly');
      expect(result.includeRecommendations).toBe(true);
    });

    it('should throw error on database failure', async () => {
      vi.mocked(mockSupabase.single).mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      } as any);

      await expect(service.createDigest(testOrgId, testUserId, { title: 'Test' }))
        .rejects.toThrow('Failed to create digest');
    });
  });

  // ========================================
  // 2. Digest Retrieval Tests
  // ========================================
  describe('getDigest', () => {
    it('should retrieve a digest with all related data', async () => {
      const mockDigest = {
        id: testDigestId,
        org_id: testOrgId,
        title: 'Test Digest',
        description: null,
        delivery_period: 'weekly',
        time_window: '7d',
        schedule_day_of_week: 1,
        schedule_hour: 8,
        schedule_timezone: 'UTC',
        include_recommendations: true,
        include_kpis: true,
        include_insights: true,
        include_risk_summary: true,
        include_reputation_summary: true,
        include_competitive_summary: true,
        include_media_performance: true,
        include_crisis_status: true,
        include_governance: true,
        is_active: true,
        is_archived: false,
        summary: {},
        kpi_snapshot: [],
        insights_snapshot: [],
        pdf_storage_path: null,
        pdf_generated_at: null,
        next_delivery_at: null,
        last_delivered_at: null,
        created_by: testUserId,
        updated_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock digest query
      vi.mocked(mockSupabase.single).mockResolvedValueOnce({
        data: mockDigest,
        error: null,
      } as any);

      // Mock sections query
      vi.mocked(mockSupabase.order).mockResolvedValueOnce({
        data: [],
        error: null,
      } as any);

      // Mock recipients query
      vi.mocked(mockSupabase.order).mockResolvedValueOnce({
        data: [],
        error: null,
      } as any);

      // Mock deliveries query
      vi.mocked(mockSupabase.limit).mockResolvedValueOnce({
        data: [],
        error: null,
      } as any);

      const result = await service.getDigest(testOrgId, testDigestId);

      expect(result).not.toBeNull();
      expect(result!.digest.id).toBe(testDigestId);
      expect(result!.digest.title).toBe('Test Digest');
      expect(result!.sections).toEqual([]);
      expect(result!.recipients).toEqual([]);
      expect(result!.recentDeliveries).toEqual([]);
    });

    it('should return null for non-existent digest', async () => {
      vi.mocked(mockSupabase.single).mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      } as any);

      const result = await service.getDigest(testOrgId, 'non-existent-id');
      expect(result).toBeNull();
    });
  });

  // ========================================
  // 3. Digest Update Tests
  // ========================================
  describe('updateDigest', () => {
    it('should update digest fields', async () => {
      const updates: UpdateExecDigestInput = {
        title: 'Updated Title',
        description: 'Updated description',
        isActive: false,
      };

      const mockUpdated = {
        id: testDigestId,
        org_id: testOrgId,
        title: updates.title,
        description: updates.description,
        delivery_period: 'weekly',
        time_window: '7d',
        schedule_day_of_week: 1,
        schedule_hour: 8,
        schedule_timezone: 'UTC',
        include_recommendations: true,
        include_kpis: true,
        include_insights: true,
        include_risk_summary: true,
        include_reputation_summary: true,
        include_competitive_summary: true,
        include_media_performance: true,
        include_crisis_status: true,
        include_governance: true,
        is_active: false,
        is_archived: false,
        summary: {},
        kpi_snapshot: [],
        insights_snapshot: [],
        pdf_storage_path: null,
        pdf_generated_at: null,
        next_delivery_at: null,
        last_delivered_at: null,
        created_by: testUserId,
        updated_by: testUserId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(mockSupabase.single).mockResolvedValueOnce({
        data: mockUpdated,
        error: null,
      } as any);

      const result = await service.updateDigest(testOrgId, testDigestId, testUserId, updates);

      expect(mockSupabase.from).toHaveBeenCalledWith('exec_digests');
      expect(mockSupabase.update).toHaveBeenCalled();
      expect(result!.title).toBe('Updated Title');
      expect(result!.isActive).toBe(false);
    });

    it('should return null for non-existent digest', async () => {
      vi.mocked(mockSupabase.single).mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      } as any);

      const result = await service.updateDigest(testOrgId, 'non-existent', testUserId, { title: 'New' });
      expect(result).toBeNull();
    });
  });

  // ========================================
  // 4. Digest Deletion Tests
  // ========================================
  describe('deleteDigest', () => {
    it('should soft delete (archive) digest by default', async () => {
      vi.mocked(mockSupabase.eq).mockResolvedValueOnce({
        data: null,
        error: null,
      } as any);

      const result = await service.deleteDigest(testOrgId, testDigestId, testUserId);

      expect(mockSupabase.update).toHaveBeenCalled();
      expect(result.archived).toBe(true);
      expect(result.deleted).toBe(false);
    });

    it('should hard delete digest when specified', async () => {
      vi.mocked(mockSupabase.eq).mockResolvedValueOnce({
        data: null,
        error: null,
      } as any);

      const result = await service.deleteDigest(testOrgId, testDigestId, testUserId, true);

      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(result.deleted).toBe(true);
      expect(result.archived).toBe(false);
    });
  });

  // ========================================
  // 5. Recipient Management Tests
  // ========================================
  describe('addRecipient', () => {
    it('should add a recipient with all fields', async () => {
      const input: AddExecDigestRecipientInput = {
        email: 'exec@company.com',
        name: 'John Executive',
        role: 'CEO',
        includePdf: true,
        includeInlineSummary: true,
      };

      const mockRecipient = {
        id: 'recipient-1',
        org_id: testOrgId,
        digest_id: testDigestId,
        email: input.email,
        name: input.name,
        role: input.role,
        is_validated: false,
        validated_at: null,
        is_active: true,
        include_pdf: input.includePdf,
        include_inline_summary: input.includeInlineSummary,
        meta: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(mockSupabase.single).mockResolvedValueOnce({
        data: mockRecipient,
        error: null,
      } as any);

      const result = await service.addRecipient(testOrgId, testDigestId, testUserId, input);

      expect(result.email).toBe('exec@company.com');
      expect(result.name).toBe('John Executive');
      expect(result.role).toBe('CEO');
      expect(result.includePdf).toBe(true);
    });

    it('should normalize email to lowercase', async () => {
      const input: AddExecDigestRecipientInput = {
        email: 'EXEC@COMPANY.COM',
      };

      const mockRecipient = {
        id: 'recipient-2',
        org_id: testOrgId,
        digest_id: testDigestId,
        email: 'exec@company.com',
        name: null,
        role: null,
        is_validated: false,
        validated_at: null,
        is_active: true,
        include_pdf: true,
        include_inline_summary: true,
        meta: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(mockSupabase.single).mockResolvedValueOnce({
        data: mockRecipient,
        error: null,
      } as any);

      const result = await service.addRecipient(testOrgId, testDigestId, testUserId, input);

      expect(result.email).toBe('exec@company.com');
    });
  });

  describe('removeRecipient', () => {
    it('should remove a recipient', async () => {
      // Mock get recipient for logging
      vi.mocked(mockSupabase.single).mockResolvedValueOnce({
        data: { email: 'test@test.com' },
        error: null,
      } as any);

      // Mock delete
      vi.mocked(mockSupabase.eq).mockResolvedValueOnce({
        data: null,
        error: null,
      } as any);

      const result = await service.removeRecipient(testOrgId, testDigestId, 'recipient-1', testUserId);

      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  // ========================================
  // 6. Digest Statistics Tests
  // ========================================
  describe('getDigestStats', () => {
    it('should return digest statistics', async () => {
      const mockStats = {
        total_digests: 5,
        active_digests: 3,
        total_deliveries: 20,
        successful_deliveries: 18,
        total_recipients: 15,
        active_recipients: 12,
      };

      vi.mocked(mockSupabase.rpc).mockResolvedValueOnce({
        data: mockStats,
        error: null,
      } as any);

      const result = await service.getDigestStats(testOrgId);

      expect(result.totalDigests).toBe(5);
      expect(result.activeDigests).toBe(3);
      expect(result.totalDeliveries).toBe(20);
      expect(result.successfulDeliveries).toBe(18);
      expect(result.totalRecipients).toBe(15);
      expect(result.activeRecipients).toBe(12);
    });

    it('should return zeros when RPC fails', async () => {
      vi.mocked(mockSupabase.rpc).mockResolvedValueOnce({
        data: null,
        error: { message: 'RPC error' },
      } as any);

      const result = await service.getDigestStats(testOrgId);

      expect(result.totalDigests).toBe(0);
      expect(result.activeDigests).toBe(0);
    });
  });

  // ========================================
  // 7. List Operations Tests
  // ========================================
  describe('listDigests', () => {
    it('should list digests with pagination', async () => {
      const mockDigests = [
        {
          id: 'digest-1',
          org_id: testOrgId,
          title: 'Digest 1',
          description: null,
          delivery_period: 'weekly',
          time_window: '7d',
          schedule_day_of_week: 1,
          schedule_hour: 8,
          schedule_timezone: 'UTC',
          include_recommendations: true,
          include_kpis: true,
          include_insights: true,
          include_risk_summary: true,
          include_reputation_summary: true,
          include_competitive_summary: true,
          include_media_performance: true,
          include_crisis_status: true,
          include_governance: true,
          is_active: true,
          is_archived: false,
          summary: {},
          kpi_snapshot: [],
          insights_snapshot: [],
          pdf_storage_path: null,
          pdf_generated_at: null,
          next_delivery_at: null,
          last_delivered_at: null,
          created_by: testUserId,
          updated_by: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          exec_digest_sections: [{ count: 5 }],
          exec_digest_recipients: [{ count: 3 }],
          exec_digest_delivery_log: [{ count: 10 }],
        },
      ];

      vi.mocked(mockSupabase.range).mockResolvedValueOnce({
        data: mockDigests,
        error: null,
        count: 1,
      } as any);

      const result = await service.listDigests(testOrgId, { limit: 20, offset: 0 });

      expect(result.digests.length).toBe(1);
      expect(result.total).toBe(1);
      expect(result.hasMore).toBe(false);
    });

    it('should filter by delivery period', async () => {
      vi.mocked(mockSupabase.range).mockResolvedValueOnce({
        data: [],
        error: null,
        count: 0,
      } as any);

      await service.listDigests(testOrgId, { deliveryPeriod: 'monthly' });

      expect(mockSupabase.eq).toHaveBeenCalledWith('delivery_period', 'monthly');
    });
  });

  // ========================================
  // 8. Scheduler Integration Tests
  // ========================================
  describe('getDigestsForScheduledDelivery', () => {
    it('should return digests due for delivery', async () => {
      const mockDigests = [
        {
          id: testDigestId,
          org_id: testOrgId,
          title: 'Due Digest',
          description: null,
          delivery_period: 'weekly',
          time_window: '7d',
          schedule_day_of_week: 1,
          schedule_hour: 8,
          schedule_timezone: 'UTC',
          include_recommendations: true,
          include_kpis: true,
          include_insights: true,
          include_risk_summary: true,
          include_reputation_summary: true,
          include_competitive_summary: true,
          include_media_performance: true,
          include_crisis_status: true,
          include_governance: true,
          is_active: true,
          is_archived: false,
          summary: {},
          kpi_snapshot: [],
          insights_snapshot: [],
          pdf_storage_path: null,
          pdf_generated_at: null,
          next_delivery_at: new Date(Date.now() - 60000).toISOString(),
          last_delivered_at: null,
          created_by: testUserId,
          updated_by: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      vi.mocked(mockSupabase.lte).mockResolvedValueOnce({
        data: mockDigests,
        error: null,
      } as any);

      const result = await service.getDigestsForScheduledDelivery();

      expect(result.length).toBe(1);
      expect(result[0].id).toBe(testDigestId);
    });
  });
});
