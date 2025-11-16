/**
 * PlaybookService tests (Sprint S7)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlaybookService } from '../src/services/playbookService';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock Supabase client
const createMockSupabase = () => {
  const mockSupabase = {
    from: vi.fn(),
  } as unknown as SupabaseClient;

  return mockSupabase;
};

describe('PlaybookService', () => {
  let service: PlaybookService;
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    service = new PlaybookService(mockSupabase);
  });

  describe('getPlaybookById', () => {
    it('should return playbook with steps', async () => {
      const orgId = 'org-123';
      const playbookId = 'playbook-456';

      const mockPlaybook = {
        id: playbookId,
        org_id: orgId,
        name: 'Test Playbook',
        version: 1,
        status: 'ACTIVE',
        input_schema: null,
        output_schema: null,
        timeout_seconds: null,
        max_retries: 0,
        tags: ['test'],
        created_by: 'user-789',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockSteps = [
        {
          id: 'step-1',
          org_id: orgId,
          playbook_id: playbookId,
          key: 'step1',
          name: 'Step 1',
          type: 'AGENT',
          config: { agentId: 'test-agent' },
          position: 0,
          next_step_key: 'step2',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'step-2',
          org_id: orgId,
          playbook_id: playbookId,
          key: 'step2',
          name: 'Step 2',
          type: 'DATA',
          config: { operation: 'pluck', fields: ['name'] },
          position: 1,
          next_step_key: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      // Mock playbook query
      const mockPlaybookQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockPlaybook,
          error: null,
        }),
      };

      // Mock steps query
      const mockStepsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockSteps,
          error: null,
        }),
      };

      (mockSupabase.from as any)
        .mockReturnValueOnce(mockPlaybookQuery)
        .mockReturnValueOnce(mockStepsQuery);

      const result = await service.getPlaybookById(orgId, playbookId);

      expect(result).not.toBeNull();
      expect(result?.playbook.id).toBe(playbookId);
      expect(result?.steps).toHaveLength(2);
      expect(result?.steps[0].key).toBe('step1');
    });

    it('should return null when playbook not found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      };

      (mockSupabase.from as any).mockReturnValue(mockQuery);

      const result = await service.getPlaybookById('org-123', 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('validatePlaybookDefinition', () => {
    it('should accept valid playbook with sequential positions', () => {
      const steps = [
        {
          key: 'step1',
          name: 'Step 1',
          type: 'AGENT' as const,
          config: { agentId: 'test' },
          position: 0,
          nextStepKey: 'step2',
        },
        {
          key: 'step2',
          name: 'Step 2',
          type: 'DATA' as const,
          config: { operation: 'pluck', fields: ['name'] },
          position: 1,
          nextStepKey: null,
        },
      ];

      expect(() => service.validatePlaybookDefinition(steps)).not.toThrow();
    });

    it('should reject playbook with duplicate step keys', () => {
      const steps = [
        {
          key: 'step1',
          name: 'Step 1',
          type: 'AGENT' as const,
          config: { agentId: 'test' },
          position: 0,
          nextStepKey: null,
        },
        {
          key: 'step1', // Duplicate
          name: 'Step 1 Copy',
          type: 'DATA' as const,
          config: { operation: 'pluck', fields: ['name'] },
          position: 1,
          nextStepKey: null,
        },
      ];

      expect(() => service.validatePlaybookDefinition(steps)).toThrow(
        /Step keys must be unique/
      );
    });

    it('should reject playbook with dangling nextStepKey', () => {
      const steps = [
        {
          key: 'step1',
          name: 'Step 1',
          type: 'AGENT' as const,
          config: { agentId: 'test' },
          position: 0,
          nextStepKey: 'nonexistent',
        },
      ];

      expect(() => service.validatePlaybookDefinition(steps)).toThrow(
        /references non-existent nextStepKey/
      );
    });

    it('should reject playbook with non-sequential positions', () => {
      const steps = [
        {
          key: 'step1',
          name: 'Step 1',
          type: 'AGENT' as const,
          config: { agentId: 'test' },
          position: 0,
          nextStepKey: 'step2',
        },
        {
          key: 'step2',
          name: 'Step 2',
          type: 'DATA' as const,
          config: { operation: 'pluck', fields: ['name'] },
          position: 5, // Should be 1
          nextStepKey: null,
        },
      ];

      expect(() => service.validatePlaybookDefinition(steps)).toThrow(
        /positions must be sequential/
      );
    });

    it('should reject empty playbook', () => {
      const steps: any[] = [];

      expect(() => service.validatePlaybookDefinition(steps)).toThrow(
        /at least one step/
      );
    });

    it('should validate BRANCH step references', () => {
      const steps = [
        {
          key: 'step1',
          name: 'Step 1',
          type: 'BRANCH' as const,
          config: {
            sourceKey: 'step0',
            conditions: [
              {
                operator: 'equals' as const,
                value: 'yes',
                nextStepKey: 'nonexistent', // Invalid reference
              },
            ],
          },
          position: 0,
          nextStepKey: null,
        },
      ];

      expect(() => service.validatePlaybookDefinition(steps)).toThrow(
        /references non-existent nextStepKey/
      );
    });
  });

  describe('createPlaybook', () => {
    it('should create playbook with steps', async () => {
      const orgId = 'org-123';
      const userId = 'user-456';

      const data = {
        name: 'New Playbook',
        version: 1,
        status: 'DRAFT' as const,
        steps: [
          {
            key: 'step1',
            name: 'Step 1',
            type: 'AGENT' as const,
            config: { agentId: 'test' },
            position: 0,
            nextStepKey: null,
          },
        ],
      };

      const mockPlaybook = {
        id: 'playbook-789',
        org_id: orgId,
        name: data.name,
        version: data.version,
        status: data.status,
        input_schema: null,
        output_schema: null,
        timeout_seconds: null,
        max_retries: 0,
        tags: null,
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockSteps = [
        {
          id: 'step-1',
          org_id: orgId,
          playbook_id: mockPlaybook.id,
          key: 'step1',
          name: 'Step 1',
          type: 'AGENT',
          config: { agentId: 'test' },
          position: 0,
          next_step_key: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      // Mock playbook insert
      const mockPlaybookInsert = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockPlaybook,
          error: null,
        }),
      };

      // Mock steps insert
      const mockStepsInsert = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({
          data: mockSteps,
          error: null,
        }),
      };

      (mockSupabase.from as any)
        .mockReturnValueOnce(mockPlaybookInsert)
        .mockReturnValueOnce(mockStepsInsert);

      const result = await service.createPlaybook(orgId, userId, data);

      expect(result.playbook.id).toBe('playbook-789');
      expect(result.steps).toHaveLength(1);
      expect(mockPlaybookInsert.insert).toHaveBeenCalled();
      expect(mockStepsInsert.insert).toHaveBeenCalled();
    });

    it('should rollback on step insert failure', async () => {
      const orgId = 'org-123';
      const userId = 'user-456';

      const data = {
        name: 'New Playbook',
        steps: [
          {
            key: 'step1',
            name: 'Step 1',
            type: 'AGENT' as const,
            config: { agentId: 'test' },
            position: 0,
            nextStepKey: null,
          },
        ],
      };

      const mockPlaybook = { id: 'playbook-789', org_id: orgId };

      // Mock playbook insert (succeeds)
      const mockPlaybookInsert = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockPlaybook,
          error: null,
        }),
      };

      // Mock steps insert (fails)
      const mockStepsInsert = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Insert failed' },
        }),
      };

      // Mock playbook delete (rollback)
      const mockDelete = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      };

      (mockSupabase.from as any)
        .mockReturnValueOnce(mockPlaybookInsert)
        .mockReturnValueOnce(mockStepsInsert)
        .mockReturnValueOnce(mockDelete);

      await expect(service.createPlaybook(orgId, userId, data)).rejects.toThrow(
        /Failed to create playbook steps/
      );

      expect(mockDelete.delete).toHaveBeenCalled();
    });
  });

  describe('updatePlaybook', () => {
    it('should update playbook metadata and steps', async () => {
      const orgId = 'org-123';
      const playbookId = 'playbook-456';

      const data = {
        name: 'Updated Name',
        status: 'ACTIVE' as const,
        steps: [
          {
            key: 'new-step',
            name: 'New Step',
            type: 'DATA' as const,
            config: { operation: 'pluck', fields: ['id'] },
            position: 0,
            nextStepKey: null,
          },
        ],
      };

      // Mock playbook update (needs to chain .eq() twice)
      const mockUpdate = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        })),
      };

      // Mock delete old steps (needs to chain .eq() twice)
      const mockDelete = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        })),
      };

      // Mock insert new steps
      const mockInsert = {
        insert: vi.fn().mockResolvedValue({
          error: null,
        }),
      };

      // Mock getPlaybookById
      const mockPlaybook = {
        playbook: {
          id: playbookId,
          orgId,
          name: 'Updated Name',
          version: 1,
          status: 'ACTIVE',
          inputSchema: null,
          outputSchema: null,
          timeoutSeconds: null,
          maxRetries: 0,
          tags: null,
          createdBy: 'user-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        steps: [
          {
            id: 'step-1',
            orgId,
            playbookId,
            key: 'new-step',
            name: 'New Step',
            type: 'DATA',
            config: { operation: 'pluck', fields: ['id'] },
            position: 0,
            nextStepKey: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      };

      (mockSupabase.from as any)
        .mockReturnValueOnce(mockUpdate)
        .mockReturnValueOnce(mockDelete)
        .mockReturnValueOnce(mockInsert);

      // Mock getPlaybookById call
      vi.spyOn(service, 'getPlaybookById').mockResolvedValue(mockPlaybook as any);

      const result = await service.updatePlaybook(orgId, playbookId, data);

      expect(result.playbook.name).toBe('Updated Name');
      expect(result.steps).toHaveLength(1);
      expect(mockUpdate.update).toHaveBeenCalled();
      expect(mockDelete.delete).toHaveBeenCalled();
      expect(mockInsert.insert).toHaveBeenCalled();
    });
  });
});
