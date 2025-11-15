/**
 * PRMediaService tests
 * Tests for journalist search, list CRUD, and membership operations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PRMediaService } from '../src/services/prMediaService';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock Supabase client
const createMockSupabase = () => {
  const mockSupabase = {
    from: vi.fn(),
  } as unknown as SupabaseClient;

  return mockSupabase;
};

describe('PRMediaService', () => {
  let service: PRMediaService;
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    service = new PRMediaService(mockSupabase);
  });

  describe('searchJournalists', () => {
    it('should search journalists with basic query', async () => {
      const orgId = '123e4567-e89b-12d3-a456-426614174000';

      // Mock journalists query
      const mockJournalists = [
        {
          id: 'j1',
          org_id: orgId,
          first_name: 'Jane',
          last_name: 'Doe',
          full_name: 'Jane Doe',
          email: 'jane@example.com',
          primary_outlet_id: 'o1',
          location: 'San Francisco',
          is_freelancer: false,
          bio: 'Tech journalist',
        },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
      };

      (mockSupabase.from as any).mockReturnValue(mockQuery);

      // First call: journalists query
      mockQuery.select.mockReturnValueOnce(mockQuery);
      mockQuery.eq.mockReturnValueOnce(mockQuery);
      mockQuery.or.mockReturnValueOnce(mockQuery);
      mockQuery.range.mockResolvedValueOnce({
        data: mockJournalists,
        error: null,
        count: 1,
      });

      // Second call: outlets query
      const mockOutlets = [
        {
          id: 'o1',
          org_id: orgId,
          name: 'TechCrunch',
          tier: 'trade',
          country: 'USA',
        },
      ];

      const mockOutletsQuery = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          data: mockOutlets,
          error: null,
        }),
      };

      (mockSupabase.from as any).mockReturnValueOnce(mockOutletsQuery);

      // Third call: journalist_beats query
      const mockJournalistBeatsQuery = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          data: [{ journalist_id: 'j1', beat_id: 'b1' }],
          error: null,
        }),
      };

      (mockSupabase.from as any).mockReturnValueOnce(mockJournalistBeatsQuery);

      // Fourth call: beats query
      const mockBeatsQuery = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          data: [{ id: 'b1', org_id: orgId, name: 'Technology' }],
          error: null,
        }),
      };

      (mockSupabase.from as any).mockReturnValueOnce(mockBeatsQuery);

      const result = await service.searchJournalists(orgId, {
        q: 'tech',
        limit: 20,
        offset: 0,
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].journalist.fullName).toBe('Jane Doe');
      expect(result.items[0].outlet?.name).toBe('TechCrunch');
      expect(result.items[0].beats).toHaveLength(1);
      expect(result.items[0].beats[0].name).toBe('Technology');
      expect(result.total).toBe(1);
    });

    it('should return empty array when no journalists found', async () => {
      const orgId = '123e4567-e89b-12d3-a456-426614174000';

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      (mockSupabase.from as any).mockReturnValue(mockQuery);

      const result = await service.searchJournalists(orgId, {
        q: 'nonexistent',
      });

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should filter by outlet ID', async () => {
      const orgId = '123e4567-e89b-12d3-a456-426614174000';
      const outletId = 'o1';

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      (mockSupabase.from as any).mockReturnValue(mockQuery);

      await service.searchJournalists(orgId, {
        outletId,
      });

      expect(mockQuery.eq).toHaveBeenCalledWith('org_id', orgId);
      expect(mockQuery.eq).toHaveBeenCalledWith('primary_outlet_id', outletId);
    });

    it('should filter by country', async () => {
      const orgId = '123e4567-e89b-12d3-a456-426614174000';

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      (mockSupabase.from as any).mockReturnValue(mockQuery);

      await service.searchJournalists(orgId, {
        country: 'USA',
      });

      expect(mockQuery.eq).toHaveBeenCalledWith('location', 'USA');
    });

    it('should throw error on database failure', async () => {
      const orgId = '123e4567-e89b-12d3-a456-426614174000';

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
          count: null,
        }),
      };

      (mockSupabase.from as any).mockReturnValue(mockQuery);

      await expect(
        service.searchJournalists(orgId, { q: 'test' })
      ).rejects.toThrow('Failed to search journalists: Database error');
    });
  });

  describe('listPRLists', () => {
    it('should return all lists for an org', async () => {
      const orgId = '123e4567-e89b-12d3-a456-426614174000';

      const mockLists = [
        {
          id: 'l1',
          org_id: orgId,
          name: 'Tech Journalists',
          description: 'All tech journalists',
          is_default: false,
          created_by: 'u1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'l2',
          org_id: orgId,
          name: 'Finance Journalists',
          description: null,
          is_default: false,
          created_by: 'u1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockLists,
          error: null,
        }),
      };

      (mockSupabase.from as any).mockReturnValue(mockQuery);

      const result = await service.listPRLists(orgId);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Tech Journalists');
      expect(result[1].name).toBe('Finance Journalists');
      expect(mockQuery.eq).toHaveBeenCalledWith('org_id', orgId);
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', {
        ascending: false,
      });
    });

    it('should return empty array when org has no lists', async () => {
      const orgId = '123e4567-e89b-12d3-a456-426614174000';

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      (mockSupabase.from as any).mockReturnValue(mockQuery);

      const result = await service.listPRLists(orgId);

      expect(result).toHaveLength(0);
    });

    it('should throw error on database failure', async () => {
      const orgId = '123e4567-e89b-12d3-a456-426614174000';

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      };

      (mockSupabase.from as any).mockReturnValue(mockQuery);

      await expect(service.listPRLists(orgId)).rejects.toThrow(
        'Failed to list PR lists: Database error'
      );
    });
  });

  describe('getPRListWithMembers', () => {
    it('should return list with members', async () => {
      const orgId = '123e4567-e89b-12d3-a456-426614174000';
      const listId = 'l1';

      // Mock list query
      const mockList = {
        id: listId,
        org_id: orgId,
        name: 'Tech Journalists',
        description: 'All tech journalists',
        is_default: false,
        created_by: 'u1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockListQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockList,
          error: null,
        }),
      };

      // Mock members query
      const mockMembersQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };

      mockMembersQuery.eq.mockReturnThis();
      mockMembersQuery.eq.mockResolvedValueOnce({
        data: [{ journalist_id: 'j1' }],
        error: null,
      });

      // Mock journalists query
      const mockJournalistsQuery = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'j1',
              org_id: orgId,
              full_name: 'Jane Doe',
              email: 'jane@example.com',
              primary_outlet_id: null,
            },
          ],
          error: null,
        }),
      };

      // Mock outlets query (empty since no primary_outlet_id)
      const mockOutletsQuery = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      // Mock journalist_beats query
      const mockJournalistBeatsQuery = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      (mockSupabase.from as any)
        .mockReturnValueOnce(mockListQuery)
        .mockReturnValueOnce(mockMembersQuery)
        .mockReturnValueOnce(mockJournalistsQuery)
        .mockReturnValueOnce(mockOutletsQuery)
        .mockReturnValueOnce(mockJournalistBeatsQuery);

      const result = await service.getPRListWithMembers(orgId, listId);

      expect(result).not.toBeNull();
      expect(result?.list.name).toBe('Tech Journalists');
      expect(result?.members).toHaveLength(1);
      expect(result?.members[0].journalist.fullName).toBe('Jane Doe');
      expect(result?.memberCount).toBe(1);
    });

    it('should return null when list not found', async () => {
      const orgId = '123e4567-e89b-12d3-a456-426614174000';
      const listId = 'nonexistent';

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      };

      (mockSupabase.from as any).mockReturnValue(mockQuery);

      const result = await service.getPRListWithMembers(orgId, listId);

      expect(result).toBeNull();
    });

    it('should return list with empty members array when no members', async () => {
      const orgId = '123e4567-e89b-12d3-a456-426614174000';
      const listId = 'l1';

      const mockList = {
        id: listId,
        org_id: orgId,
        name: 'Empty List',
        description: null,
        is_default: false,
        created_by: 'u1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockListQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockList,
          error: null,
        }),
      };

      const mockMembersQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };

      mockMembersQuery.eq.mockReturnThis();
      mockMembersQuery.eq.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      (mockSupabase.from as any)
        .mockReturnValueOnce(mockListQuery)
        .mockReturnValueOnce(mockMembersQuery);

      const result = await service.getPRListWithMembers(orgId, listId);

      expect(result).not.toBeNull();
      expect(result?.list.name).toBe('Empty List');
      expect(result?.members).toHaveLength(0);
      expect(result?.memberCount).toBe(0);
    });
  });

  describe('createPRList', () => {
    it('should create a new list', async () => {
      const orgId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = 'u1';
      const name = 'New List';
      const description = 'Test description';

      const mockList = {
        id: 'l1',
        org_id: orgId,
        name,
        description,
        is_default: false,
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockList,
          error: null,
        }),
      };

      (mockSupabase.from as any).mockReturnValue(mockQuery);

      const result = await service.createPRList(orgId, userId, name, description);

      expect(result.name).toBe(name);
      expect(result.description).toBe(description);
      expect(result.createdBy).toBe(userId);
      expect(mockQuery.insert).toHaveBeenCalledWith({
        org_id: orgId,
        name,
        description,
        created_by: userId,
      });
    });

    it('should create list without description', async () => {
      const orgId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = 'u1';
      const name = 'New List';

      const mockList = {
        id: 'l1',
        org_id: orgId,
        name,
        description: null,
        is_default: false,
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockList,
          error: null,
        }),
      };

      (mockSupabase.from as any).mockReturnValue(mockQuery);

      const result = await service.createPRList(orgId, userId, name);

      expect(result.name).toBe(name);
      expect(result.description).toBeNull();
      expect(mockQuery.insert).toHaveBeenCalledWith({
        org_id: orgId,
        name,
        description: null,
        created_by: userId,
      });
    });

    it('should throw error on database failure', async () => {
      const orgId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = 'u1';
      const name = 'New List';

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Constraint violation' },
        }),
      };

      (mockSupabase.from as any).mockReturnValue(mockQuery);

      await expect(
        service.createPRList(orgId, userId, name)
      ).rejects.toThrow('Failed to create PR list: Constraint violation');
    });
  });

  describe('addMembersToList', () => {
    it('should add members to a list', async () => {
      const orgId = '123e4567-e89b-12d3-a456-426614174000';
      const listId = 'l1';
      const journalistIds = ['j1', 'j2'];
      const userId = 'u1';

      // Mock list verification query
      const mockListQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: listId },
          error: null,
        }),
      };

      // Mock upsert query
      const mockUpsertQuery = {
        upsert: vi.fn().mockResolvedValue({
          error: null,
        }),
      };

      (mockSupabase.from as any)
        .mockReturnValueOnce(mockListQuery)
        .mockReturnValueOnce(mockUpsertQuery);

      await service.addMembersToList(orgId, listId, journalistIds, userId);

      expect(mockUpsertQuery.upsert).toHaveBeenCalledWith(
        [
          {
            org_id: orgId,
            list_id: listId,
            journalist_id: 'j1',
            added_by: userId,
          },
          {
            org_id: orgId,
            list_id: listId,
            journalist_id: 'j2',
            added_by: userId,
          },
        ],
        {
          onConflict: 'list_id,journalist_id',
          ignoreDuplicates: true,
        }
      );
    });

    it('should throw error when list not found', async () => {
      const orgId = '123e4567-e89b-12d3-a456-426614174000';
      const listId = 'nonexistent';
      const journalistIds = ['j1'];
      const userId = 'u1';

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      };

      (mockSupabase.from as any).mockReturnValue(mockQuery);

      await expect(
        service.addMembersToList(orgId, listId, journalistIds, userId)
      ).rejects.toThrow('List not found or access denied');
    });

    it('should throw error on upsert failure', async () => {
      const orgId = '123e4567-e89b-12d3-a456-426614174000';
      const listId = 'l1';
      const journalistIds = ['j1'];
      const userId = 'u1';

      const mockListQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: listId },
          error: null,
        }),
      };

      const mockUpsertQuery = {
        upsert: vi.fn().mockResolvedValue({
          error: { message: 'Foreign key violation' },
        }),
      };

      (mockSupabase.from as any)
        .mockReturnValueOnce(mockListQuery)
        .mockReturnValueOnce(mockUpsertQuery);

      await expect(
        service.addMembersToList(orgId, listId, journalistIds, userId)
      ).rejects.toThrow('Failed to add members: Foreign key violation');
    });
  });

  describe('removeMembersFromList', () => {
    it('should remove members from a list', async () => {
      const orgId = '123e4567-e89b-12d3-a456-426614174000';
      const listId = 'l1';
      const journalistIds = ['j1', 'j2'];

      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          error: null,
        }),
      };

      (mockSupabase.from as any).mockReturnValue(mockQuery);

      await service.removeMembersFromList(orgId, listId, journalistIds);

      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('list_id', listId);
      expect(mockQuery.eq).toHaveBeenCalledWith('org_id', orgId);
      expect(mockQuery.in).toHaveBeenCalledWith('journalist_id', journalistIds);
    });

    it('should throw error on database failure', async () => {
      const orgId = '123e4567-e89b-12d3-a456-426614174000';
      const listId = 'l1';
      const journalistIds = ['j1'];

      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          error: { message: 'Delete failed' },
        }),
      };

      (mockSupabase.from as any).mockReturnValue(mockQuery);

      await expect(
        service.removeMembersFromList(orgId, listId, journalistIds)
      ).rejects.toThrow('Failed to remove members: Delete failed');
    });

    it('should handle removing non-existent members gracefully', async () => {
      const orgId = '123e4567-e89b-12d3-a456-426614174000';
      const listId = 'l1';
      const journalistIds = ['nonexistent'];

      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          error: null,
        }),
      };

      (mockSupabase.from as any).mockReturnValue(mockQuery);

      // Should not throw error
      await expect(
        service.removeMembersFromList(orgId, listId, journalistIds)
      ).resolves.toBeUndefined();
    });
  });
});
