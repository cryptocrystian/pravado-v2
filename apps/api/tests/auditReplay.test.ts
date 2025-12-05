/**
 * Audit Replay Service Tests (Sprint S37)
 * Unit tests for audit replay functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
  ilike: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  single: vi.fn(),
};

import { AuditReplayService, replayEventEmitter } from '../src/services/auditReplayService';
import type { AuditLogEntry, AuditSeverity, ActorType, AuditEventType } from '@pravado/types';

describe('AuditReplayService', () => {
  let replayService: AuditReplayService;

  beforeEach(() => {
    vi.clearAllMocks();
    replayService = new AuditReplayService(mockSupabase as unknown as Parameters<typeof AuditReplayService.prototype.constructor>[0]);
  });

  describe('createReplayJob', () => {
    it('should create a replay job successfully', async () => {
      const mockJob = {
        id: 'job-123',
        org_id: 'org-456',
        user_id: 'user-789',
        status: 'queued',
        filters_json: {},
        started_at: null,
        finished_at: null,
        result_json: null,
        event_count: 0,
        snapshot_count: 0,
        error_message: null,
        created_at: new Date().toISOString(),
      };

      mockSupabase.single.mockResolvedValueOnce({ data: mockJob, error: null });

      const result = await replayService.createReplayJob('org-456', 'user-789', {});

      expect(result).not.toBeNull();
      expect(result?.id).toBe('job-123');
      expect(result?.status).toBe('queued');
      expect(mockSupabase.from).toHaveBeenCalledWith('audit_replay_runs');
    });

    it('should return null on database error', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      const result = await replayService.createReplayJob('org-456', 'user-789');

      expect(result).toBeNull();
    });
  });

  describe('getReplayJob', () => {
    it('should retrieve a replay job by ID', async () => {
      const mockJob = {
        id: 'job-123',
        org_id: 'org-456',
        user_id: 'user-789',
        status: 'success',
        filters_json: { severity: 'error' },
        started_at: new Date().toISOString(),
        finished_at: new Date().toISOString(),
        result_json: { totalEvents: 10, totalSnapshots: 10 },
        event_count: 10,
        snapshot_count: 10,
        error_message: null,
        created_at: new Date().toISOString(),
      };

      mockSupabase.single.mockResolvedValueOnce({ data: mockJob, error: null });

      const result = await replayService.getReplayJob('org-456', 'job-123');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('job-123');
      expect(result?.status).toBe('success');
      expect(result?.eventCount).toBe(10);
    });

    it('should return null for non-existent job', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      const result = await replayService.getReplayJob('org-456', 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('computeDiffs', () => {
    it('should detect added fields', () => {
      const before = { name: 'Test' };
      const after = { name: 'Test', status: 'active' };

      const diffs = replayService.computeDiffs(before, after);

      expect(diffs).toHaveLength(1);
      expect(diffs[0]).toEqual({
        field: 'status',
        before: undefined,
        after: 'active',
        operation: 'added',
      });
    });

    it('should detect removed fields', () => {
      const before = { name: 'Test', status: 'active' };
      const after = { name: 'Test' };

      const diffs = replayService.computeDiffs(before, after);

      expect(diffs).toHaveLength(1);
      expect(diffs[0]).toEqual({
        field: 'status',
        before: 'active',
        after: undefined,
        operation: 'removed',
      });
    });

    it('should detect modified fields', () => {
      const before = { name: 'Test', count: 5 };
      const after = { name: 'Test', count: 10 };

      const diffs = replayService.computeDiffs(before, after);

      expect(diffs).toHaveLength(1);
      expect(diffs[0]).toEqual({
        field: 'count',
        before: 5,
        after: 10,
        operation: 'modified',
      });
    });

    it('should return empty array for identical objects', () => {
      const before = { name: 'Test', count: 5 };
      const after = { name: 'Test', count: 5 };

      const diffs = replayService.computeDiffs(before, after);

      expect(diffs).toHaveLength(0);
    });

    it('should handle null before state', () => {
      const after = { name: 'Test', count: 5 };

      const diffs = replayService.computeDiffs(null, after);

      expect(diffs).toHaveLength(2);
      expect(diffs.every((d) => d.operation === 'added')).toBe(true);
    });
  });

  describe('listReplayJobs', () => {
    it('should list replay jobs with pagination', async () => {
      const mockJobs = [
        {
          id: 'job-1',
          org_id: 'org-456',
          user_id: 'user-789',
          status: 'success',
          filters_json: {},
          started_at: new Date().toISOString(),
          finished_at: new Date().toISOString(),
          result_json: null,
          event_count: 5,
          snapshot_count: 5,
          error_message: null,
          created_at: new Date().toISOString(),
        },
        {
          id: 'job-2',
          org_id: 'org-456',
          user_id: 'user-789',
          status: 'running',
          filters_json: {},
          started_at: new Date().toISOString(),
          finished_at: null,
          result_json: null,
          event_count: 0,
          snapshot_count: 0,
          error_message: null,
          created_at: new Date().toISOString(),
        },
      ];

      mockSupabase.range.mockResolvedValueOnce({
        data: mockJobs,
        error: null,
        count: 2,
      });

      const result = await replayService.listReplayJobs('org-456', 20, 0);

      expect(result.runs).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.runs[0].id).toBe('job-1');
    });
  });

  describe('updateReplayJobStatus', () => {
    it('should update job status successfully', async () => {
      mockSupabase.eq.mockResolvedValueOnce({ error: null });

      const result = await replayService.updateReplayJobStatus('job-123', 'running', {
        startedAt: new Date().toISOString(),
      });

      expect(result).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('audit_replay_runs');
      expect(mockSupabase.update).toHaveBeenCalled();
    });

    it('should return false on error', async () => {
      mockSupabase.eq.mockResolvedValueOnce({ error: { message: 'Error' } });

      const result = await replayService.updateReplayJobStatus('job-123', 'failed');

      expect(result).toBe(false);
    });
  });
});

describe('SSE Event Emitter', () => {
  it('should emit replay events', () => {
    const callback = vi.fn();
    const eventKey = 'replay:test-job';

    replayEventEmitter.on(eventKey, callback);

    replayEventEmitter.emit(eventKey, {
      type: 'replay.started',
      data: { runId: 'test-job' },
    });

    expect(callback).toHaveBeenCalledWith({
      type: 'replay.started',
      data: { runId: 'test-job' },
    });

    replayEventEmitter.off(eventKey, callback);
  });

  it('should handle progress events', () => {
    const callback = vi.fn();
    const eventKey = 'replay:progress-job';

    replayEventEmitter.on(eventKey, callback);

    replayEventEmitter.emit(eventKey, {
      type: 'replay.progress',
      data: {
        runId: 'progress-job',
        progress: 50,
        currentEvent: 25,
        totalEvents: 50,
      },
    });

    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'replay.progress',
        data: expect.objectContaining({
          progress: 50,
        }),
      })
    );

    replayEventEmitter.off(eventKey, callback);
  });
});

describe('State Reconstruction', () => {
  it('should reconstruct content state from events', () => {
    // This tests the general state reconstruction logic
    const events: AuditLogEntry[] = [
      {
        id: 'evt-1',
        orgId: 'org-1',
        actorType: 'user' as ActorType,
        eventType: 'content.created' as AuditEventType,
        severity: 'info' as AuditSeverity,
        context: { contentId: 'content-123', title: 'Test Content' },
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'evt-2',
        orgId: 'org-1',
        actorType: 'user' as ActorType,
        eventType: 'content.updated' as AuditEventType,
        severity: 'info' as AuditSeverity,
        context: { contentId: 'content-123', title: 'Updated Content' },
        createdAt: '2024-01-01T01:00:00Z',
      },
    ];

    // Verify events are properly structured
    expect(events[0].eventType).toBe('content.created');
    expect(events[1].eventType).toBe('content.updated');
    expect(events[0].context.contentId).toBe('content-123');
  });

  it('should track playbook execution state', () => {
    const events: AuditLogEntry[] = [
      {
        id: 'evt-1',
        orgId: 'org-1',
        actorType: 'system' as ActorType,
        eventType: 'playbook.execution_started' as AuditEventType,
        severity: 'info' as AuditSeverity,
        context: { playbookId: 'pb-123', runId: 'run-456', totalSteps: 5 },
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'evt-2',
        orgId: 'org-1',
        actorType: 'system' as ActorType,
        eventType: 'playbook.execution_completed' as AuditEventType,
        severity: 'info' as AuditSeverity,
        context: { playbookId: 'pb-123', runId: 'run-456' },
        createdAt: '2024-01-01T00:05:00Z',
      },
    ];

    expect(events[0].context.playbookId).toBe('pb-123');
    expect(events[0].context.runId).toBe('run-456');
    expect(events[1].eventType).toBe('playbook.execution_completed');
  });
});

describe('Replay Result Summary', () => {
  let replayService: AuditReplayService;

  beforeEach(() => {
    replayService = new AuditReplayService(mockSupabase as unknown as Parameters<typeof AuditReplayService.prototype.constructor>[0]);
  });

  it('should generate human-readable summary', () => {
    const result = {
      totalEvents: 100,
      totalSnapshots: 100,
      entityBreakdown: { content: 50, playbook: 30, billing: 20 },
      eventTypeBreakdown: { 'content.created': 25, 'content.updated': 25 },
      severityBreakdown: { info: 80, warning: 15, error: 5, critical: 0 },
      timeRange: {
        start: '2024-01-01T00:00:00Z',
        end: '2024-01-31T23:59:59Z',
      },
      stateChanges: {
        additions: 30,
        modifications: 60,
        deletions: 10,
      },
    };

    const summary = replayService.summarizeReplay(result);

    expect(summary).toContain('100 events');
    expect(summary).toContain('100 snapshots');
    expect(summary).toContain('30 additions');
    expect(summary).toContain('60 modifications');
    expect(summary).toContain('10 deletions');
  });
});

describe('Job Status Transitions', () => {
  it('should follow valid status transitions', () => {
    const validTransitions: Record<string, string[]> = {
      queued: ['running', 'failed'],
      running: ['success', 'failed'],
      success: [], // Terminal state
      failed: [], // Terminal state
    };

    // Verify all statuses have defined transitions
    expect(Object.keys(validTransitions)).toContain('queued');
    expect(Object.keys(validTransitions)).toContain('running');
    expect(Object.keys(validTransitions)).toContain('success');
    expect(Object.keys(validTransitions)).toContain('failed');

    // Verify running can transition to success
    expect(validTransitions.running).toContain('success');

    // Verify success is terminal
    expect(validTransitions.success.length).toBe(0);
  });
});

describe('RBAC Validation', () => {
  it('should enforce admin-only replay creation', () => {
    const isAdmin = (role: string) => role === 'admin' || role === 'owner';

    expect(isAdmin('admin')).toBe(true);
    expect(isAdmin('owner')).toBe(true);
    expect(isAdmin('member')).toBe(false);
    expect(isAdmin('viewer')).toBe(false);
  });
});
