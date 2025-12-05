/**
 * PR Pitch Service Tests (Sprint S39)
 * Unit tests for PR pitch and outreach sequence functionality
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  CreatePRPitchSequenceInput,
  GeneratePitchPreviewInput,
  PRPitchContactRecord,
  PRPitchEventRecord,
  PRPitchSequenceRecord,
  PRPitchStepRecord,
} from '@pravado/types';

import { PRPitchService } from '../src/services/prPitchService';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  upsert: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  ilike: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  single: vi.fn(),
  rpc: vi.fn(),
};

// Mock LLM Router
const mockLlmRouter = {
  complete: vi.fn(),
};

// Sample data
const sampleOrgId = '00000000-0000-0000-0000-000000000001';
const sampleUserId = '00000000-0000-0000-0000-000000000002';
const sampleSequenceId = '00000000-0000-0000-0000-000000000003';
const sampleJournalistId = '00000000-0000-0000-0000-000000000004';
const sampleContactId = '00000000-0000-0000-0000-000000000005';
const samplePressReleaseId = '00000000-0000-0000-0000-000000000006';

const sampleSequenceRecord: PRPitchSequenceRecord = {
  id: sampleSequenceId,
  org_id: sampleOrgId,
  user_id: sampleUserId,
  name: 'Test Sequence',
  press_release_id: samplePressReleaseId,
  status: 'draft',
  default_subject: 'Test Subject',
  default_preview_text: 'Preview text',
  settings: {
    sendWindow: { startHour: 9, endHour: 17, timezone: 'America/New_York' },
    followUpDelayDays: 3,
    maxAttempts: 3,
    excludeWeekends: true,
  },
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const sampleStepRecord: PRPitchStepRecord = {
  id: '00000000-0000-0000-0000-000000000010',
  org_id: sampleOrgId,
  sequence_id: sampleSequenceId,
  position: 1,
  step_type: 'email',
  subject_template: 'Subject for {{journalist.name}}',
  body_template: 'Hello {{journalist.firstName}}, I have a story for you.',
  wait_days: 0,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const sampleContactRecord: PRPitchContactRecord = {
  id: sampleContactId,
  org_id: sampleOrgId,
  sequence_id: sampleSequenceId,
  journalist_id: sampleJournalistId,
  status: 'queued',
  current_step_position: 1,
  last_event_at: null,
  metadata: {},
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const sampleEventRecord: PRPitchEventRecord = {
  id: '00000000-0000-0000-0000-000000000020',
  org_id: sampleOrgId,
  contact_id: sampleContactId,
  step_position: 1,
  event_type: 'queued',
  payload: {},
  created_at: '2024-01-01T00:00:00Z',
};

describe('PRPitchService', () => {
  let service: PRPitchService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PRPitchService(mockSupabase as any, mockLlmRouter as any);
  });

  // ==========================================================================
  // Context Assembly Tests
  // ==========================================================================
  describe('Context Assembly', () => {
    it('should assemble context from press release and journalist', async () => {
      // Mock press release fetch
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: samplePressReleaseId,
          headline: 'Test Headline',
          angle: 'Test Angle',
          body: 'Test body content with multiple paragraphs.\n\nSecond paragraph here.',
          input_json: { newsType: 'product_launch' },
        },
      });

      // Mock journalist fetch
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: sampleJournalistId,
          name: 'John Doe',
          email: 'john@example.com',
          beat: 'technology',
          bio: 'Tech journalist',
          location: 'San Francisco',
          media_outlets: { name: 'TechCrunch', tier: 'tier1' },
        },
      });

      // Mock organization fetch
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: sampleOrgId,
          name: 'TestCorp',
          metadata: { industry: 'Technology' },
        },
      });

      // Mock personality fetch
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          tone: 'professional',
          voice_attributes: ['friendly', 'knowledgeable'],
        },
      });

      // Mock interactions fetch
      mockSupabase.limit.mockResolvedValueOnce({ data: [] });

      const context = await service.assemblePitchContext(
        sampleOrgId,
        samplePressReleaseId,
        sampleJournalistId
      );

      expect(context.journalist.name).toBe('John Doe');
      expect(context.journalist.beat).toBe('technology');
      expect(context.pressRelease?.headline).toBe('Test Headline');
      expect(context.organization.name).toBe('TestCorp');
    });

    it('should handle missing press release gracefully', async () => {
      // Mock journalist fetch
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: sampleJournalistId,
          name: 'Jane Smith',
          email: 'jane@example.com',
          beat: 'finance',
          bio: null,
          location: null,
          media_outlets: null,
        },
      });

      // Mock organization fetch
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: sampleOrgId,
          name: 'TestCorp',
          metadata: {},
        },
      });

      // Mock personality fetch (not found)
      mockSupabase.single.mockResolvedValueOnce({ data: null });

      // Mock interactions fetch
      mockSupabase.limit.mockResolvedValueOnce({ data: [] });

      const context = await service.assemblePitchContext(
        sampleOrgId,
        null,
        sampleJournalistId
      );

      expect(context.pressRelease).toBeNull();
      expect(context.journalist.name).toBe('Jane Smith');
    });
  });

  // ==========================================================================
  // Sequence Management Tests
  // ==========================================================================
  describe('Sequence Management', () => {
    it('should create a new sequence with steps', async () => {
      const input: CreatePRPitchSequenceInput = {
        name: 'New Campaign',
        pressReleaseId: samplePressReleaseId,
        defaultSubject: 'Breaking News',
        steps: [
          {
            position: 1,
            stepType: 'email',
            subjectTemplate: 'Subject',
            bodyTemplate: 'Hello!',
            waitDays: 0,
          },
        ],
      };

      // Mock sequence insert
      mockSupabase.single.mockResolvedValueOnce({
        data: { ...sampleSequenceRecord, name: input.name },
      });

      // Mock steps insert
      mockSupabase.select.mockResolvedValueOnce({
        data: [{ ...sampleStepRecord, body_template: 'Hello!' }],
      });

      const sequence = await service.createSequence(sampleOrgId, sampleUserId, input);

      expect(sequence.name).toBe('New Campaign');
      expect(sequence.steps).toHaveLength(1);
      expect(mockSupabase.from).toHaveBeenCalledWith('pr_pitch_sequences');
    });

    it('should list sequences with filters', async () => {
      mockSupabase.range.mockResolvedValueOnce({
        data: [sampleSequenceRecord],
        count: 1,
      });

      const result = await service.listSequences(sampleOrgId, {
        status: 'draft',
        limit: 10,
        offset: 0,
      });

      expect(result.sequences).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should get sequence with steps and stats', async () => {
      // Mock sequence fetch
      mockSupabase.single.mockResolvedValueOnce({
        data: sampleSequenceRecord,
      });

      // Mock steps fetch
      mockSupabase.order.mockResolvedValueOnce({
        data: [sampleStepRecord],
      });

      // Mock stats RPC
      mockSupabase.rpc.mockResolvedValueOnce({
        data: [{
          total_contacts: 10,
          queued_count: 5,
          sent_count: 3,
          opened_count: 2,
          replied_count: 1,
          bounced_count: 0,
          failed_count: 0,
        }],
      });

      const sequence = await service.getSequenceWithSteps(sampleSequenceId, sampleOrgId);

      expect(sequence).not.toBeNull();
      expect(sequence?.steps).toHaveLength(1);
      expect(sequence?.stats?.totalContacts).toBe(10);
    });

    it('should archive (soft delete) a sequence', async () => {
      mockSupabase.eq.mockResolvedValueOnce({ error: null });

      await service.deleteSequence(sampleSequenceId, sampleOrgId);

      expect(mockSupabase.update).toHaveBeenCalledWith({ status: 'archived' });
    });
  });

  // ==========================================================================
  // Contact Management Tests
  // ==========================================================================
  describe('Contact Management', () => {
    it('should attach contacts to sequence', async () => {
      // Mock sequence check
      mockSupabase.single.mockResolvedValueOnce({
        data: sampleSequenceRecord,
      });
      mockSupabase.order.mockResolvedValueOnce({ data: [] });
      mockSupabase.rpc.mockResolvedValueOnce({ data: [{ total_contacts: 0 }] });

      // Mock contacts upsert
      mockSupabase.select.mockResolvedValueOnce({
        data: [sampleContactRecord],
      });

      const contacts = await service.attachContactsToSequence(
        sampleSequenceId,
        sampleOrgId,
        [sampleJournalistId]
      );

      expect(contacts).toHaveLength(1);
      expect(contacts[0].journalistId).toBe(sampleJournalistId);
    });

    it('should list contacts with journalist info', async () => {
      mockSupabase.range.mockResolvedValueOnce({
        data: [{
          ...sampleContactRecord,
          journalists: {
            id: sampleJournalistId,
            name: 'Test Journalist',
            email: 'test@example.com',
            beat: 'tech',
            media_outlets: { name: 'Outlet', tier: 'tier2' },
          },
        }],
        count: 1,
      });

      const result = await service.listContacts(sampleSequenceId, sampleOrgId);

      expect(result.contacts).toHaveLength(1);
      expect(result.contacts[0].journalist.name).toBe('Test Journalist');
    });

    it('should enforce org scoping on contacts', async () => {
      // Mock sequence not found for different org
      mockSupabase.single.mockResolvedValueOnce({ data: null });
      mockSupabase.order.mockResolvedValueOnce({ data: [] });
      mockSupabase.rpc.mockResolvedValueOnce({ data: [] });

      await expect(
        service.attachContactsToSequence(sampleSequenceId, 'wrong-org', [sampleJournalistId])
      ).rejects.toThrow('Sequence not found');
    });
  });

  // ==========================================================================
  // Pitch Generation Tests
  // ==========================================================================
  describe('Pitch Generation', () => {
    it('should generate pitch preview with LLM', async () => {
      // Mock sequence fetch
      mockSupabase.single.mockResolvedValueOnce({
        data: sampleSequenceRecord,
      });
      mockSupabase.order.mockResolvedValueOnce({
        data: [sampleStepRecord],
      });
      mockSupabase.rpc.mockResolvedValueOnce({ data: [{ total_contacts: 0 }] });

      // Mock context assembly
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: samplePressReleaseId,
          headline: 'Test',
          angle: 'Test angle',
          body: 'Body',
          input_json: {},
        },
      });
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: sampleJournalistId,
          name: 'John Doe',
          email: 'john@test.com',
          beat: 'tech',
          bio: 'Tech writer',
          location: 'NYC',
          media_outlets: { name: 'TechNews', tier: 'tier1' },
        },
      });
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: sampleOrgId, name: 'TestCorp', metadata: {} },
      });
      mockSupabase.single.mockResolvedValueOnce({ data: null });
      mockSupabase.limit.mockResolvedValueOnce({ data: [] });

      // Mock LLM response
      mockLlmRouter.complete.mockResolvedValueOnce({
        content: JSON.stringify({
          subject: 'Personalized Subject for John',
          body: 'Hello John, I have an exciting story...',
          personalizationScore: 85,
          suggestions: [],
        }),
      });

      const input: GeneratePitchPreviewInput = {
        sequenceId: sampleSequenceId,
        journalistId: sampleJournalistId,
        stepPosition: 1,
      };

      const preview = await service.generatePitchPreview(sampleOrgId, sampleUserId, input);

      expect(preview.subject).toBe('Personalized Subject for John');
      expect(preview.personalizationScore).toBe(85);
      expect(mockLlmRouter.complete).toHaveBeenCalled();
    });

    it('should generate fallback pitch when LLM disabled', async () => {
      const serviceNoLlm = new PRPitchService(mockSupabase as any);

      // Mock sequence fetch
      mockSupabase.single.mockResolvedValueOnce({
        data: sampleSequenceRecord,
      });
      mockSupabase.order.mockResolvedValueOnce({
        data: [sampleStepRecord],
      });
      mockSupabase.rpc.mockResolvedValueOnce({ data: [{ total_contacts: 0 }] });

      // Mock context assembly
      mockSupabase.single.mockResolvedValueOnce({ data: null }); // No press release
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: sampleJournalistId,
          name: 'Jane Smith',
          email: 'jane@test.com',
          beat: 'finance',
          bio: null,
          location: null,
          media_outlets: null,
        },
      });
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: sampleOrgId, name: 'TestCorp', metadata: {} },
      });
      mockSupabase.single.mockResolvedValueOnce({ data: null });
      mockSupabase.limit.mockResolvedValueOnce({ data: [] });

      const input: GeneratePitchPreviewInput = {
        sequenceId: sampleSequenceId,
        journalistId: sampleJournalistId,
      };

      const preview = await serviceNoLlm.generatePitchPreview(sampleOrgId, sampleUserId, input);

      expect(preview.subject).toBeDefined();
      expect(preview.body).toContain('Jane');
      expect(preview.personalizationScore).toBe(30); // Fallback score
    });
  });

  // ==========================================================================
  // Event & Status Handling Tests
  // ==========================================================================
  describe('Event Handling', () => {
    it('should queue pitch and record event', async () => {
      // Mock contact update
      mockSupabase.single.mockResolvedValueOnce({
        data: { ...sampleContactRecord, status: 'queued' },
      });

      // Mock event insert
      mockSupabase.single.mockResolvedValueOnce({
        data: sampleEventRecord,
      });

      // Mock contact update (last_event_at)
      mockSupabase.eq.mockResolvedValueOnce({ error: null });

      const contact = await service.queuePitchForContact(sampleContactId, sampleOrgId);

      expect(contact.status).toBe('queued');
      expect(mockSupabase.from).toHaveBeenCalledWith('pr_pitch_events');
    });

    it('should record events with correct type', async () => {
      // Mock event insert
      mockSupabase.single.mockResolvedValueOnce({
        data: { ...sampleEventRecord, event_type: 'sent' },
      });

      // Mock contact update
      mockSupabase.eq.mockResolvedValueOnce({ error: null });

      const event = await service.recordEvent(
        sampleContactId,
        sampleOrgId,
        1,
        'sent',
        { messageId: 'msg-123' }
      );

      expect(event.eventType).toBe('sent');
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'sent',
          payload: { messageId: 'msg-123' },
        })
      );
    });

    it('should update contact status', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { ...sampleContactRecord, status: 'sent' },
      });

      const contact = await service.updateContactStatus(
        sampleContactId,
        sampleOrgId,
        'sent'
      );

      expect(contact.status).toBe('sent');
    });
  });

  // ==========================================================================
  // Error Handling Tests
  // ==========================================================================
  describe('Error Handling', () => {
    it('should throw on journalist not found', async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: null });

      await expect(
        service.assemblePitchContext(sampleOrgId, null, 'nonexistent')
      ).rejects.toThrow('Journalist not found');
    });

    it('should throw on sequence creation failure', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(
        service.createSequence(sampleOrgId, sampleUserId, { name: 'Test' })
      ).rejects.toThrow();
    });
  });
});
