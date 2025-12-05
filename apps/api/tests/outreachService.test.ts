/**
 * Outreach Service Tests (Sprint S44)
 * Unit tests for automated journalist outreach
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OutreachService } from '../src/services/outreachService';
import { createOutreachService } from '../src/services/outreachService';

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
  const mockOverlaps = vi.fn(() => chainMethods);
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
    overlaps: mockOverlaps,
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

describe('OutreachService', () => {
  let service: OutreachService;
  let mockSupabase: ReturnType<typeof createMockSupabase>;

  beforeEach(() => {
    mockSupabase = createMockSupabase();

    service = createOutreachService({
      supabase: mockSupabase as any,
      debugMode: true,
    });
  });

  describe('Sequence Management', () => {
    it('should create an outreach sequence', async () => {
      mockSupabase._mocks.setMockData({
        data: {
          id: 'seq-1',
          org_id: 'org-1',
          name: 'Product Launch',
          description: 'Summer product launch campaign',
          journalist_ids: [],
          outlet_ids: [],
          beat_filter: null,
          tier_filter: null,
          is_active: true,
          max_runs_per_day: 50,
          stop_on_reply: true,
          pitch_id: null,
          press_release_id: null,
          total_runs: 0,
          completed_runs: 0,
          active_runs: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      const sequence = await service.createSequence('org-1', {
        name: 'Product Launch',
        description: 'Summer product launch campaign',
      });

      expect(sequence).toBeDefined();
      expect(sequence.name).toBe('Product Launch');
      expect(sequence.isActive).toBe(true);
      expect(mockSupabase._mocks.insert).toHaveBeenCalled();
    });

    it('should list outreach sequences', async () => {
      mockSupabase._mocks.setMockData({
        data: [
          {
            id: 'seq-1',
            org_id: 'org-1',
            name: 'Campaign 1',
            description: null,
            journalist_ids: [],
            outlet_ids: [],
            beat_filter: null,
            tier_filter: null,
            is_active: true,
            max_runs_per_day: 50,
            stop_on_reply: true,
            pitch_id: null,
            press_release_id: null,
            total_runs: 5,
            completed_runs: 2,
            active_runs: 3,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        error: null,
        count: 1,
      });

      const result = await service.listSequences('org-1', { limit: 10 });

      expect(result.sequences).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockSupabase._mocks.select).toHaveBeenCalled();
    });

    it('should update a sequence', async () => {
      mockSupabase._mocks.setMockData({
        data: {
          id: 'seq-1',
          org_id: 'org-1',
          name: 'Updated Campaign',
          description: null,
          journalist_ids: [],
          outlet_ids: [],
          beat_filter: null,
          tier_filter: null,
          is_active: false,
          max_runs_per_day: 50,
          stop_on_reply: true,
          pitch_id: null,
          press_release_id: null,
          total_runs: 0,
          completed_runs: 0,
          active_runs: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      const sequence = await service.updateSequence('seq-1', 'org-1', {
        name: 'Updated Campaign',
        isActive: false,
      });

      expect(sequence.name).toBe('Updated Campaign');
      expect(sequence.isActive).toBe(false);
      expect(mockSupabase._mocks.update).toHaveBeenCalled();
    });

    it('should delete a sequence', async () => {
      // Mock active runs query
      mockSupabase._mocks.setMockData({ data: [], error: null });

      await expect(
        service.deleteSequence('seq-1', 'org-1')
      ).resolves.not.toThrow();

      expect(mockSupabase._mocks.delete).toHaveBeenCalled();
    });
  });

  describe('Step Management', () => {
    it('should create a sequence step', async () => {
      mockSupabase._mocks.setMockData({
        data: {
          id: 'step-1',
          sequence_id: 'seq-1',
          step_number: 1,
          delay_hours: 0,
          subject_template: 'Hi {{journalist_name}}',
          body_template: 'Hello...',
          template_variables: {},
          use_llm_generation: false,
          llm_prompt: null,
          llm_model: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      const step = await service.createStep('seq-1', {
        stepNumber: 1,
        delayHours: 0,
        subjectTemplate: 'Hi {{journalist_name}}',
        bodyTemplate: 'Hello...',
      });

      expect(step).toBeDefined();
      expect(step.stepNumber).toBe(1);
      expect(mockSupabase._mocks.insert).toHaveBeenCalled();
    });

    it('should update a step', async () => {
      mockSupabase._mocks.setMockData({
        data: {
          id: 'step-1',
          sequence_id: 'seq-1',
          step_number: 1,
          delay_hours: 24,
          subject_template: 'Updated subject',
          body_template: 'Updated body',
          template_variables: {},
          use_llm_generation: false,
          llm_prompt: null,
          llm_model: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      const step = await service.updateStep('step-1', {
        delayHours: 24,
        subjectTemplate: 'Updated subject',
      });

      expect(step.delayHours).toBe(24);
      expect(mockSupabase._mocks.update).toHaveBeenCalled();
    });

    it('should delete a step', async () => {
      mockSupabase._mocks.setMockData({ data: null, error: null });

      await expect(
        service.deleteStep('step-1')
      ).resolves.not.toThrow();

      expect(mockSupabase._mocks.delete).toHaveBeenCalled();
    });
  });

  describe('Run Management', () => {
    it('should create a run', async () => {
      mockSupabase._mocks.setMockData({
        data: {
          id: 'run-1',
          org_id: 'org-1',
          sequence_id: 'seq-1',
          journalist_id: 'journalist-1',
          status: 'running',
          current_step_number: 1,
          next_step_at: null,
          completed_at: null,
          stopped_at: null,
          stop_reason: null,
          total_steps_sent: 0,
          last_sent_at: null,
          replied_at: null,
          reply_step_number: null,
          last_error: null,
          retry_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      const run = await service.createRun('org-1', {
        sequenceId: 'seq-1',
        journalistId: 'journalist-1',
      });

      expect(run).toBeDefined();
      expect(run.status).toBe('running');
      expect(mockSupabase._mocks.insert).toHaveBeenCalled();
    });

    it('should list runs', async () => {
      mockSupabase._mocks.setMockData({
        data: [
          {
            id: 'run-1',
            org_id: 'org-1',
            sequence_id: 'seq-1',
            journalist_id: 'journalist-1',
            status: 'running',
            current_step_number: 2,
            next_step_at: new Date().toISOString(),
            completed_at: null,
            stopped_at: null,
            stop_reason: null,
            total_steps_sent: 1,
            last_sent_at: new Date().toISOString(),
            replied_at: null,
            reply_step_number: null,
            last_error: null,
            retry_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        error: null,
        count: 1,
      });

      const result = await service.listRuns('org-1', {
        sequenceId: 'seq-1',
        limit: 10,
      });

      expect(result.runs).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockSupabase._mocks.select).toHaveBeenCalled();
    });

    it('should stop a run', async () => {
      mockSupabase._mocks.setMockData({
        data: {
          id: 'run-1',
          org_id: 'org-1',
          sequence_id: 'seq-1',
          journalist_id: 'journalist-1',
          status: 'stopped',
          current_step_number: 2,
          next_step_at: null,
          completed_at: null,
          stopped_at: new Date().toISOString(),
          stop_reason: 'manual_stop',
          total_steps_sent: 1,
          last_sent_at: null,
          replied_at: null,
          reply_step_number: null,
          last_error: null,
          retry_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      const run = await service.stopRun('run-1', 'org-1', 'manual_stop');

      expect(run.status).toBe('stopped');
      expect(run.stopReason).toBe('manual_stop');
      expect(mockSupabase._mocks.update).toHaveBeenCalled();
    });
  });

  describe('Event Management', () => {
    it('should create an event', async () => {
      mockSupabase._mocks.setMockData({
        data: {
          id: 'event-1',
          org_id: 'org-1',
          run_id: 'run-1',
          sequence_id: 'seq-1',
          step_id: 'step-1',
          event_type: 'sent',
          step_number: 1,
          email_subject: 'Test email',
          email_body: 'Test body',
          recipient_email: 'journalist@example.com',
          sent_at: new Date().toISOString(),
          opened_at: null,
          clicked_at: null,
          replied_at: null,
          bounced_at: null,
          failed_at: null,
          metadata: {},
          error_message: null,
          created_at: new Date().toISOString(),
        },
        error: null,
      });

      const event = await service.createEvent('org-1', {
        runId: 'run-1',
        sequenceId: 'seq-1',
        stepId: 'step-1',
        eventType: 'sent',
        stepNumber: 1,
        emailSubject: 'Test email',
        emailBody: 'Test body',
        recipientEmail: 'journalist@example.com',
        sentAt: new Date(),
      });

      expect(event).toBeDefined();
      expect(event.eventType).toBe('sent');
      expect(mockSupabase._mocks.insert).toHaveBeenCalled();
    });

    it('should list events', async () => {
      mockSupabase._mocks.setMockData({
        data: [
          {
            id: 'event-1',
            org_id: 'org-1',
            run_id: 'run-1',
            sequence_id: 'seq-1',
            step_id: 'step-1',
            event_type: 'sent',
            step_number: 1,
            email_subject: null,
            email_body: null,
            recipient_email: 'journalist@example.com',
            sent_at: new Date().toISOString(),
            opened_at: null,
            clicked_at: null,
            replied_at: null,
            bounced_at: null,
            failed_at: null,
            metadata: {},
            error_message: null,
            created_at: new Date().toISOString(),
          },
        ],
        error: null,
        count: 1,
      });

      const result = await service.listEvents('org-1', {
        runId: 'run-1',
        limit: 10,
      });

      expect(result.events).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockSupabase._mocks.select).toHaveBeenCalled();
    });
  });

  describe('Stats', () => {
    it('should get outreach stats', async () => {
      mockSupabase._mocks.rpc.mockResolvedValueOnce({
        data: {
          total_sequences: 5,
          active_sequences: 3,
          total_runs: 100,
          active_runs: 20,
          completed_runs: 75,
          total_emails_sent: 250,
          total_opens: 150,
          total_clicks: 50,
          total_replies: 25,
        },
        error: null,
      });

      const stats = await service.getStats('org-1');

      expect(stats.totalSequences).toBe(5);
      expect(stats.activeSequences).toBe(3);
      expect(stats.totalReplies).toBe(25);
      expect(mockSupabase._mocks.rpc).toHaveBeenCalled();
    });
  });

  describe('Targeting', () => {
    it('should preview targeting', async () => {
      // Mock getting sequence
      mockSupabase._mocks.setMockData({
        data: {
          id: 'seq-1',
          org_id: 'org-1',
          name: 'Test',
          description: null,
          journalist_ids: ['j1', 'j2'],
          outlet_ids: [],
          beat_filter: null,
          tier_filter: null,
          is_active: true,
          max_runs_per_day: 50,
          stop_on_reply: true,
          pitch_id: null,
          press_release_id: null,
          total_runs: 0,
          completed_runs: 0,
          active_runs: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      // First call gets sequence
      await service.getSequence('seq-1', 'org-1');

      // Mock journalists query for preview
      mockSupabase._mocks.setMockData({
        data: [{ id: 'j1' }, { id: 'j2' }],
        error: null,
        count: 2,
      });

      const preview = await service.previewTargeting('seq-1', 'org-1');

      expect(preview.matchingJournalists).toBe(2);
      expect(preview.journalistIds).toHaveLength(2);
    });
  });
});
