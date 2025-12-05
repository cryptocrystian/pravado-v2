/**
 * PersonalityStore tests (Sprint S11)
 * Updated in Sprint S26 to use comprehensive Supabase mock
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PersonalityStore } from '../src/services/personality/personalityStore';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { PersonalityProfile } from '@pravado/types';
import { createMockSupabaseClient, createMockQueryBuilder, createMockSuccess } from './helpers/supabaseMock';

describe('PersonalityStore', () => {
  let store: PersonalityStore;
  let mockSupabase: SupabaseClient;

  const testPersonalityConfig: PersonalityProfile = {
    tone: 'professional',
    style: 'concise',
    riskTolerance: 'medium',
    domainSpecialty: ['pr', 'media'],
    biasModifiers: {
      optimism: 0.3,
      assertiveness: 0.4,
    },
    memoryWeight: 0.7,
    escalationSensitivity: 0.6,
    collaborationStyle: 'balanced',
    constraints: {
      require: ['validation'],
      forbid: ['spam'],
    },
  };

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    store = new PersonalityStore(mockSupabase);
  });

  describe('createPersonality', () => {
    it('should create a new personality', async () => {
      const orgId = 'org-123';
      const userId = 'user-456';

      const mockPersonality = {
        id: 'personality-789',
        org_id: orgId,
        slug: 'test-personality',
        name: 'Test Personality',
        description: 'Test description',
        configuration: testPersonalityConfig,
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockPersonality,
          error: null,
        }),
      };

      (mockSupabase.from as any).mockReturnValue(mockQuery);

      const result = await store.createPersonality(orgId, userId, {
        slug: 'test-personality',
        name: 'Test Personality',
        description: 'Test description',
        configuration: testPersonalityConfig,
      });

      expect(result.id).toBe('personality-789');
      expect(result.slug).toBe('test-personality');
      expect(result.name).toBe('Test Personality');
      expect(result.configuration).toEqual(testPersonalityConfig);
      expect(mockSupabase.from).toHaveBeenCalledWith('agent_personalities');
    });

    it('should throw error if creation fails', async () => {
      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      };

      (mockSupabase.from as any).mockReturnValue(mockQuery);

      await expect(
        store.createPersonality('org-123', 'user-456', {
          slug: 'test',
          name: 'Test',
          description: '',
          configuration: testPersonalityConfig,
        })
      ).rejects.toThrow('Failed to create personality');
    });
  });

  describe('updatePersonality', () => {
    it('should update an existing personality', async () => {
      const orgId = 'org-123';
      const personalityId = 'personality-789';

      const mockUpdatedPersonality = {
        id: personalityId,
        org_id: orgId,
        slug: 'test-personality',
        name: 'Updated Name',
        description: 'Updated description',
        configuration: testPersonalityConfig,
        created_by: 'user-456',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockUpdatedPersonality,
          error: null,
        }),
      };

      (mockSupabase.from as any).mockReturnValue(mockQuery);

      const result = await store.updatePersonality(orgId, personalityId, {
        name: 'Updated Name',
        description: 'Updated description',
      });

      expect(result.name).toBe('Updated Name');
      expect(result.description).toBe('Updated description');
      expect(mockSupabase.from).toHaveBeenCalledWith('agent_personalities');
    });
  });

  describe('listPersonalities', () => {
    it('should list personalities for an organization', async () => {
      const orgId = 'org-123';

      const mockPersonalities = [
        {
          id: 'personality-1',
          org_id: orgId,
          slug: 'personality-1',
          name: 'Personality 1',
          description: 'First personality',
          configuration: testPersonalityConfig,
          created_by: 'user-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'personality-2',
          org_id: orgId,
          slug: 'personality-2',
          name: 'Personality 2',
          description: 'Second personality',
          configuration: testPersonalityConfig,
          created_by: 'user-2',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockPersonalities,
          error: null,
        }),
      };

      (mockSupabase.from as any).mockReturnValue(mockQuery);

      const result = await store.listPersonalities(orgId, 50, 0);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('personality-1');
      expect(result[1].id).toBe('personality-2');
      expect(mockSupabase.from).toHaveBeenCalledWith('agent_personalities');
    });
  });

  describe('getPersonality', () => {
    it('should get a specific personality by ID', async () => {
      const orgId = 'org-123';
      const personalityId = 'personality-789';

      const mockPersonality = {
        id: personalityId,
        org_id: orgId,
        slug: 'test-personality',
        name: 'Test Personality',
        description: 'Test description',
        configuration: testPersonalityConfig,
        created_by: 'user-456',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockPersonality,
          error: null,
        }),
      };

      (mockSupabase.from as any).mockReturnValue(mockQuery);

      const result = await store.getPersonality(orgId, personalityId);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(personalityId);
      expect(result?.slug).toBe('test-personality');
    });

    it('should return null if personality not found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      };

      (mockSupabase.from as any).mockReturnValue(mockQuery);

      const result = await store.getPersonality('org-123', 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getPersonalityBySlug', () => {
    it('should get a personality by slug', async () => {
      const orgId = 'org-123';
      const slug = 'pr-strategist';

      const mockPersonality = {
        id: 'personality-789',
        org_id: orgId,
        slug,
        name: 'PR Strategist',
        description: 'PR expert',
        configuration: testPersonalityConfig,
        created_by: 'user-456',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockPersonality,
          error: null,
        }),
      };

      (mockSupabase.from as any).mockReturnValue(mockQuery);

      const result = await store.getPersonalityBySlug(orgId, slug);

      expect(result).not.toBeNull();
      expect(result?.slug).toBe(slug);
    });
  });

  describe('assignPersonalityToAgent', () => {
    it('should create new assignment if none exists', async () => {
      const orgId = 'org-123';
      const agentId = 'agent-456';
      const personalityId = 'personality-789';

      // Mock query to check for existing assignment (returns null)
      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      // Mock query to insert new assignment
      const mockInsertQuery = {
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      (mockSupabase.from as any)
        .mockReturnValueOnce(mockSelectQuery)
        .mockReturnValueOnce(mockInsertQuery);

      await store.assignPersonalityToAgent(orgId, agentId, personalityId);

      expect(mockSupabase.from).toHaveBeenCalledWith('agent_personality_assignments');
    });

    it('should update existing assignment', async () => {
      const orgId = 'org-123';
      const agentId = 'agent-456';
      const personalityId = 'personality-789';

      // Mock query to check for existing assignment (returns existing)
      const mockSelectQuery = createMockQueryBuilder(createMockSuccess({ id: 'assignment-1' }));

      // Mock query to update existing assignment - supports chaining .eq().eq()
      const mockUpdateQuery = createMockQueryBuilder(createMockSuccess(null));

      (mockSupabase.from as any)
        .mockReturnValueOnce(mockSelectQuery)
        .mockReturnValueOnce(mockUpdateQuery);

      await store.assignPersonalityToAgent(orgId, agentId, personalityId);

      expect(mockSupabase.from).toHaveBeenCalledWith('agent_personality_assignments');
    });
  });

  describe('getPersonalityForAgent', () => {
    it('should get assigned personality for an agent', async () => {
      const orgId = 'org-123';
      const agentId = 'agent-456';
      const personalityId = 'personality-789';

      const mockPersonality = {
        id: personalityId,
        org_id: orgId,
        slug: 'test-personality',
        name: 'Test Personality',
        description: 'Test description',
        configuration: testPersonalityConfig,
        created_by: 'user-456',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock assignment query
      const mockAssignmentQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { personality_id: personalityId },
          error: null,
        }),
      };

      // Mock personality query
      const mockPersonalityQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockPersonality,
          error: null,
        }),
      };

      (mockSupabase.from as any)
        .mockReturnValueOnce(mockAssignmentQuery)
        .mockReturnValueOnce(mockPersonalityQuery);

      const result = await store.getPersonalityForAgent(orgId, agentId);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(personalityId);
    });

    it('should return null if no assignment exists', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      };

      (mockSupabase.from as any).mockReturnValue(mockQuery);

      const result = await store.getPersonalityForAgent('org-123', 'agent-456');

      expect(result).toBeNull();
    });
  });

  describe('removePersonalityFromAgent', () => {
    it('should remove personality assignment', async () => {
      const orgId = 'org-123';
      const agentId = 'agent-456';

      // Mock delete query - supports chaining .eq().eq()
      const mockQuery = createMockQueryBuilder(createMockSuccess(null));

      (mockSupabase.from as any).mockReturnValue(mockQuery);

      await store.removePersonalityFromAgent(orgId, agentId);

      expect(mockSupabase.from).toHaveBeenCalledWith('agent_personality_assignments');
    });
  });

  describe('listAssignments', () => {
    it('should list all personality assignments for an org', async () => {
      const orgId = 'org-123';

      const mockAssignments = [
        {
          id: 'assignment-1',
          org_id: orgId,
          agent_id: 'agent-1',
          personality_id: 'personality-1',
          created_at: new Date().toISOString(),
        },
        {
          id: 'assignment-2',
          org_id: orgId,
          agent_id: 'agent-2',
          personality_id: 'personality-2',
          created_at: new Date().toISOString(),
        },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: mockAssignments,
          error: null,
        }),
      };

      (mockSupabase.from as any).mockReturnValue(mockQuery);

      const result = await store.listAssignments(orgId);

      expect(result).toHaveLength(2);
      expect(result[0].agentId).toBe('agent-1');
      expect(result[1].agentId).toBe('agent-2');
    });
  });
});
