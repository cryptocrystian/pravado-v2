/**
 * OutreachDeliverabilityService Tests (Sprint S45)
 * Test email deliverability tracking and engagement analytics
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createOutreachDeliverabilityService } from '../src/services/outreachDeliverabilityService';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ProviderConfig } from '@pravado/types';

// Mock Supabase client
const createMockSupabase = (): SupabaseClient => {
  const mockData: Record<string, any[]> = {
    pr_outreach_email_messages: [],
    pr_outreach_engagement_metrics: [],
    journalists: [],
  };

  const mockSelect = vi.fn().mockReturnThis();
  const mockInsert = vi.fn().mockReturnThis();
  const mockUpdate = vi.fn().mockReturnThis();
  const mockDelete = vi.fn().mockReturnThis();
  const mockEq = vi.fn().mockReturnThis();
  const mockSingle = vi.fn();
  const mockMaybeSingle = vi.fn();
  const mockOrder = vi.fn().mockReturnThis();
  const mockRange = vi.fn().mockReturnThis();
  const mockGte = vi.fn().mockReturnThis();
  const mockLte = vi.fn().mockReturnThis();
  const mockRpc = vi.fn();

  const mockFrom = vi.fn((table: string) => ({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  }));

  (mockSelect as any).mockImplementation = (columns: string) => ({
    eq: mockEq,
    single: mockSingle,
    maybeSingle: mockMaybeSingle,
    order: mockOrder,
    range: mockRange,
    gte: mockGte,
    lte: mockLte,
  });

  return {
    from: mockFrom,
    rpc: mockRpc,
    // Add other SupabaseClient methods as needed
  } as unknown as SupabaseClient;
};

// Provider config for testing
const stubProviderConfig: ProviderConfig = {
  provider: 'stub',
  fromEmail: 'test@pravado.com',
  fromName: 'Pravado Test',
};

describe('OutreachDeliverabilityService', () => {
  let supabase: SupabaseClient;
  let service: ReturnType<typeof createOutreachDeliverabilityService>;
  const orgId = '123e4567-e89b-12d3-a456-426614174000';
  const journalistId = '223e4567-e89b-12d3-a456-426614174000';
  const messageId = '323e4567-e89b-12d3-a456-426614174000';

  beforeEach(() => {
    supabase = createMockSupabase();
    service = createOutreachDeliverabilityService({ supabase, providerConfig: stubProviderConfig });
  });

  describe('Email Message Management', () => {
    it('should create an email message', async () => {
      const mockMessage = {
        id: messageId,
        org_id: orgId,
        run_id: 'run-123',
        sequence_id: 'seq-123',
        step_number: 1,
        journalist_id: journalistId,
        subject: 'Test Subject',
        body_html: '<p>Test body</p>',
        body_text: 'Test body',
        provider_message_id: null,
        send_status: 'pending',
        sent_at: null,
        delivered_at: null,
        opened_at: null,
        clicked_at: null,
        bounced_at: null,
        complained_at: null,
        raw_event: {},
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.spyOn(supabase, 'from').mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockMessage, error: null }),
          }),
        }),
      } as any);

      const result = await service.createEmailMessage(orgId, {
        runId: 'run-123',
        sequenceId: 'seq-123',
        stepNumber: 1,
        journalistId,
        subject: 'Test Subject',
        bodyHtml: '<p>Test body</p>',
        bodyText: 'Test body',
      });

      expect(result.id).toBe(messageId);
      expect(result.subject).toBe('Test Subject');
      expect(result.sendStatus).toBe('pending');
    });

    it('should get an email message by ID', async () => {
      const mockMessage = {
        id: messageId,
        org_id: orgId,
        subject: 'Test Subject',
        send_status: 'sent',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockMessage, error: null }),
            }),
          }),
        }),
      } as any);

      const result = await service.getEmailMessage(messageId, orgId);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(messageId);
    });

    it('should list email messages with filters', async () => {
      const mockMessages = [
        {
          id: messageId,
          org_id: orgId,
          run_id: 'run-123',
          send_status: 'sent',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({
            data: mockMessages,
            count: 1,
            error: null,
          }),
        }),
      } as any);

      const result = await service.listEmailMessages(orgId, {
        runId: 'run-123',
        limit: 20,
        offset: 0,
      });

      expect(result.messages).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should update an email message', async () => {
      const mockUpdatedMessage = {
        id: messageId,
        org_id: orgId,
        provider_message_id: 'provider-123',
        send_status: 'sent',
        sent_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.spyOn(supabase, 'from').mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockUpdatedMessage, error: null }),
              }),
            }),
          }),
        }),
      } as any);

      const result = await service.updateEmailMessage(messageId, orgId, {
        providerMessageId: 'provider-123',
        sendStatus: 'sent',
        sentAt: new Date(),
      });

      expect(result.providerMessageId).toBe('provider-123');
      expect(result.sendStatus).toBe('sent');
    });

    it('should delete an email message', async () => {
      vi.spyOn(supabase, 'from').mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
      } as any);

      await expect(service.deleteEmailMessage(messageId, orgId)).resolves.not.toThrow();
    });
  });

  describe('Engagement Metrics', () => {
    it('should get engagement metrics for a journalist', async () => {
      const mockMetrics = {
        id: 'metrics-123',
        org_id: orgId,
        journalist_id: journalistId,
        total_sent: 10,
        total_opened: 7,
        total_clicked: 3,
        total_replied: 2,
        total_bounced: 1,
        total_complained: 0,
        engagement_score: 0.45,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: mockMetrics, error: null }),
            }),
          }),
        }),
      } as any);

      const result = await service.getEngagementMetrics(journalistId, orgId);

      expect(result).not.toBeNull();
      expect(result?.totalSent).toBe(10);
      expect(result?.engagementScore).toBe(0.45);
    });

    it('should list engagement metrics', async () => {
      const mockMetrics = [
        {
          id: 'metrics-123',
          org_id: orgId,
          journalist_id: journalistId,
          total_sent: 10,
          engagement_score: 0.45,
          journalists: {
            id: journalistId,
            name: 'John Doe',
            email: 'john@example.com',
            outlet: 'TechCrunch',
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({
            data: mockMetrics,
            count: 1,
            error: null,
          }),
        }),
      } as any);

      const result = await service.listEngagementMetrics(orgId, {
        minScore: 0.3,
        limit: 20,
        offset: 0,
      });

      expect(result.metrics).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should update engagement metrics for a journalist', async () => {
      const mockMetrics = {
        id: 'metrics-123',
        org_id: orgId,
        journalist_id: journalistId,
        engagement_score: 0.5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.spyOn(supabase, 'rpc').mockResolvedValue({ error: null });
      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn()
                .mockResolvedValueOnce({ data: { ...mockMetrics, engagement_score: 0.45 }, error: null })
                .mockResolvedValueOnce({ data: mockMetrics, error: null }),
            }),
          }),
        }),
      } as any);

      const result = await service.updateEngagementMetrics(journalistId, orgId);

      expect(result.journalistId).toBe(journalistId);
      expect(result.metricsUpdated).toBe(true);
      expect(result.newScore).toBe(0.5);
    });

    it('should calculate engagement score correctly', () => {
      const result = service.calculateEngagementScore(100, 60, 30, 20, 5);

      // (60/100 * 0.2) + (30/100 * 0.4) + (20/100 * 0.3) - (5/100 * 0.3)
      // = 0.12 + 0.12 + 0.06 - 0.015 = 0.285
      expect(result.score).toBeCloseTo(0.285, 2);
      expect(result.openRate).toBe(0.6);
      expect(result.clickRate).toBe(0.3);
      expect(result.replyRate).toBe(0.2);
      expect(result.bounceRate).toBe(0.05);
    });

    it('should return zero score for zero emails sent', () => {
      const result = service.calculateEngagementScore(0, 0, 0, 0, 0);

      expect(result.score).toBe(0);
      expect(result.openRate).toBe(0);
      expect(result.clickRate).toBe(0);
      expect(result.replyRate).toBe(0);
      expect(result.bounceRate).toBe(0);
    });
  });

  describe('Email Sending', () => {
    it('should send email via stub provider', async () => {
      const result = await service.sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        bodyHtml: '<p>Test body</p>',
        bodyText: 'Test body',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBeTruthy();
      expect(result.provider).toBe('stub');
    });

    it('should fail when no provider configured', async () => {
      const serviceWithoutProvider = createOutreachDeliverabilityService({ supabase });

      const result = await serviceWithoutProvider.sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        bodyHtml: '<p>Test body</p>',
        bodyText: 'Test body',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('Webhook Processing', () => {
    it('should process stub webhook event', async () => {
      const mockMessage = {
        id: messageId,
        org_id: orgId,
        journalist_id: journalistId,
        provider_message_id: 'stub-123',
        send_status: 'sent',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: mockMessage, error: null }),
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockMessage, error: null }),
              }),
            }),
          }),
        }),
      } as any);

      vi.spyOn(supabase, 'rpc').mockResolvedValue({ error: null });

      const result = await service.processWebhookEvent(
        orgId,
        'stub',
        {
          messageId: 'stub-123',
          eventType: 'opened',
          timestamp: new Date(),
          recipientEmail: 'test@example.com',
        },
        undefined
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe(messageId);
    });

    it('should fail webhook processing for unknown message', async () => {
      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      } as any);

      const result = await service.processWebhookEvent(
        orgId,
        'stub',
        {
          messageId: 'unknown-123',
          eventType: 'opened',
          timestamp: new Date(),
          recipientEmail: 'test@example.com',
        },
        undefined
      );

      expect(result.success).toBe(false);
    });
  });

  describe('Statistics', () => {
    it('should get deliverability summary', async () => {
      const mockSummary = {
        total_messages: 100,
        total_sent: 95,
        total_delivered: 90,
        total_opened: 60,
        total_clicked: 30,
        total_bounced: 5,
        total_complained: 2,
        total_failed: 3,
        delivery_rate: 0.95,
        open_rate: 0.63,
        click_rate: 0.32,
        bounce_rate: 0.05,
      };

      vi.spyOn(supabase, 'rpc').mockResolvedValue({ data: mockSummary, error: null });

      const result = await service.getDeliverabilitySummary(orgId);

      expect(result.totalMessages).toBe(100);
      expect(result.deliveryRate).toBe(0.95);
      expect(result.openRate).toBe(0.63);
    });

    it('should get top engaged journalists', async () => {
      const mockMetrics = [
        {
          id: 'metrics-1',
          org_id: orgId,
          journalist_id: journalistId,
          total_sent: 10,
          engagement_score: 0.8,
          journalists: {
            id: journalistId,
            name: 'John Doe',
            email: 'john@example.com',
            outlet: null,
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({
            data: mockMetrics,
            count: 1,
            error: null,
          }),
        }),
      } as any);

      const result = await service.getTopEngagedJournalists(orgId, 10);

      expect(result).toHaveLength(1);
      expect(result[0].engagementScore).toBe(0.8);
    });

    it('should get journalist engagement with details', async () => {
      const mockEngagement = {
        id: 'metrics-123',
        org_id: orgId,
        journalist_id: journalistId,
        total_sent: 10,
        total_opened: 7,
        engagement_score: 0.5,
        journalists: {
          id: journalistId,
          name: 'John Doe',
          email: 'john@example.com',
          outlet: 'TechCrunch',
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: mockEngagement, error: null }),
            }),
          }),
        }),
      } as any);

      const result = await service.getJournalistEngagement(journalistId, orgId);

      expect(result).not.toBeNull();
      expect(result?.journalist.name).toBe('John Doe');
      expect(result?.engagementScore).toBe(0.5);
    });
  });
});
