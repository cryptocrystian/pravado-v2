/**
 * MediaListService tests (Sprint S47)
 * Tests for AI media list generation and fit scoring engine
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMediaListService } from '../src/services/mediaListService';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createMockSupabaseClient, createMockQueryBuilder, createMockSuccess, createMockError } from './helpers/supabaseMock';
import type { MediaListGenerationInput, MediaListCreateInput } from '@pravado/types';

describe('MediaListService', () => {
  let mockSupabase: SupabaseClient;
  let service: ReturnType<typeof createMediaListService>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    service = createMediaListService(mockSupabase);
  });

  describe('generateMediaList', () => {
    it('should generate media list with fit scoring', async () => {
      const orgId = '123e4567-e89b-12d3-a456-426614174000';
      const input: MediaListGenerationInput = {
        topic: 'AI in healthcare',
        keywords: ['machine learning', 'medical diagnosis'],
        market: 'Healthcare Tech',
        targetCount: 10,
        minFitScore: 0.3,
        includeTiers: ['A', 'B', 'C', 'D'],
      };

      // Mock journalist profiles query
      const mockJournalists = [
        {
          id: 'j1',
          org_id: orgId,
          full_name: 'Jane Smith',
          primary_email: 'jane@example.com',
          primary_outlet: 'TechCrunch',
          beat: 'Healthcare Technology',
          bio: 'Covering AI and machine learning in healthcare',
          engagement_score: 0.8,
          responsiveness_score: 0.7,
          relevance_score: 0.9,
          tier: 'tier1',
        },
        {
          id: 'j2',
          org_id: orgId,
          full_name: 'John Doe',
          primary_email: 'john@example.com',
          primary_outlet: 'Forbes',
          beat: 'Technology',
          bio: 'Tech journalist',
          engagement_score: 0.6,
          responsiveness_score: 0.5,
          relevance_score: 0.7,
          tier: 'tier2',
        },
      ];

      // Mock journalist_activity_log query for coverage analysis
      const mockActivities = [
        {
          id: 'a1',
          journalist_id: 'j1',
          org_id: orgId,
          activity_type: 'coverage_published',
          activity_data: {
            title: 'AI revolutionizes healthcare diagnosis',
            content: 'Machine learning algorithms improve medical diagnosis accuracy',
          },
          occurred_at: new Date().toISOString(),
        },
      ];

      const mockProfilesQuery = createMockQueryBuilder(createMockSuccess(mockJournalists));
      const mockActivitiesQuery = createMockQueryBuilder(createMockSuccess(mockActivities));

      (mockSupabase.from as any)
        .mockReturnValueOnce(mockProfilesQuery) // Journalist profiles query
        .mockReturnValueOnce(mockActivitiesQuery) // First journalist activities
        .mockReturnValueOnce(createMockQueryBuilder(createMockSuccess([]))); // Second journalist activities

      const result = await service.generateMediaList(orgId, input);

      expect(result.matches).toBeDefined();
      expect(result.matches.length).toBeGreaterThan(0);
      expect(result.matches[0].journalistId).toBe('j1');
      expect(result.matches[0].fitScore).toBeGreaterThan(0);
      expect(result.matches[0].tier).toMatch(/^[ABCD]$/);
      expect(result.matches[0].reason).toBeDefined();
      expect(result.matches[0].fitBreakdown).toBeDefined();
      expect(result.metadata.totalCandidates).toBe(2);
      expect(result.metadata.totalMatches).toBe(result.matches.length);
    });

    it('should filter by minimum fit score', async () => {
      const orgId = '123e4567-e89b-12d3-a456-426614174000';
      const input: MediaListGenerationInput = {
        topic: 'blockchain',
        keywords: [],
        minFitScore: 0.8, // High threshold
        targetCount: 10,
        includeTiers: ['A', 'B', 'C', 'D'],
      };

      const mockJournalists = [
        {
          id: 'j1',
          org_id: orgId,
          full_name: 'Low Fit Journalist',
          primary_email: 'low@example.com',
          beat: 'Fashion',
          bio: 'Fashion writer',
          engagement_score: 0.3,
          responsiveness_score: 0.3,
          relevance_score: 0.3,
          tier: 'tier3',
        },
      ];

      const mockProfilesQuery = createMockQueryBuilder(createMockSuccess(mockJournalists));
      const mockActivitiesQuery = createMockQueryBuilder(createMockSuccess([]));

      (mockSupabase.from as any)
        .mockReturnValueOnce(mockProfilesQuery)
        .mockReturnValueOnce(mockActivitiesQuery);

      const result = await service.generateMediaList(orgId, input);

      // Should have no matches due to high fit score threshold
      expect(result.matches).toHaveLength(0);
      expect(result.metadata.totalCandidates).toBe(1);
    });

    it('should filter by tier', async () => {
      const orgId = '123e4567-e89b-12d3-a456-426614174000';
      const input: MediaListGenerationInput = {
        topic: 'AI',
        keywords: [],
        minFitScore: 0.1,
        targetCount: 10,
        includeTiers: ['A', 'B'], // Only A and B tiers
      };

      const mockJournalists = [
        {
          id: 'j1',
          org_id: orgId,
          full_name: 'High Fit Journalist',
          primary_email: 'high@example.com',
          beat: 'AI Technology',
          bio: 'AI expert',
          engagement_score: 0.9,
          responsiveness_score: 0.9,
          relevance_score: 0.9,
          tier: 'tier1',
        },
      ];

      const mockProfilesQuery = createMockQueryBuilder(createMockSuccess(mockJournalists));
      const mockActivitiesQuery = createMockQueryBuilder(createMockSuccess([]));

      (mockSupabase.from as any)
        .mockReturnValueOnce(mockProfilesQuery)
        .mockReturnValueOnce(mockActivitiesQuery);

      const result = await service.generateMediaList(orgId, input);

      // Should have matches in A/B tiers only
      result.matches.forEach((match) => {
        expect(['A', 'B']).toContain(match.tier);
      });
    });
  });

  describe('saveMediaList', () => {
    it('should save media list with entries', async () => {
      const orgId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = 'user123';
      const input: MediaListCreateInput = {
        name: 'Healthcare AI List',
        description: 'Journalists covering AI in healthcare',
        inputTopic: 'AI in healthcare',
        inputKeywords: ['machine learning', 'diagnosis'],
        inputMarket: 'Healthcare Tech',
      };

      const entries = [
        {
          journalistId: 'j1',
          fitScore: 0.85,
          tier: 'A' as const,
          reason: 'Strong topic relevance',
          fitBreakdown: {
            topicRelevance: 0.9,
            pastCoverage: 0.8,
            engagement: 0.85,
            responsiveness: 0.8,
            outletTier: 1.0,
            totalScore: 0.85,
          },
          position: 0,
        },
      ];

      const mockListId = 'list123';

      // Mock list insert
      const mockListInsert = createMockQueryBuilder(
        createMockSuccess([{ id: mockListId, org_id: orgId, ...input }])
      );

      // Mock entries insert
      const mockEntriesInsert = createMockQueryBuilder(
        createMockSuccess([{ id: 'entry1', list_id: mockListId, journalist_id: 'j1' }])
      );

      // Mock getMediaList call
      const mockGetQuery = createMockQueryBuilder(
        createMockSuccess([{
          ...input,
          id: mockListId,
          org_id: orgId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          entries: [{
            id: 'entry1',
            list_id: mockListId,
            journalist_id: 'j1',
            fit_score: 0.85,
            tier: 'A',
            reason: 'Strong topic relevance',
            fit_breakdown: entries[0].fitBreakdown,
            position: 0,
            created_at: new Date().toISOString(),
            journalist: {
              id: 'j1',
              full_name: 'Jane Smith',
              primary_email: 'jane@example.com',
              primary_outlet: 'TechCrunch',
              beat: 'Healthcare Tech',
              engagement_score: 0.8,
              responsiveness_score: 0.7,
              relevance_score: 0.9,
              tier: 'tier1',
            },
          }],
        }])
      );

      (mockSupabase.from as any)
        .mockReturnValueOnce(mockListInsert)
        .mockReturnValueOnce(mockEntriesInsert)
        .mockReturnValueOnce(mockGetQuery);

      const result = await service.saveMediaList(orgId, input, entries, userId);

      expect(result).toBeDefined();
      expect(result.name).toBe(input.name);
      expect(result.entries).toBeDefined();
    });
  });

  describe('getMediaList', () => {
    it('should retrieve media list with entries and journalist details', async () => {
      const listId = 'list123';
      const orgId = '123e4567-e89b-12d3-a456-426614174000';

      const mockListData = {
        id: listId,
        org_id: orgId,
        name: 'AI Healthcare List',
        description: 'Top journalists',
        input_topic: 'AI in healthcare',
        input_keywords: ['machine learning'],
        input_market: 'Healthcare',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        entries: [
          {
            id: 'entry1',
            list_id: listId,
            journalist_id: 'j1',
            fit_score: 0.85,
            tier: 'A',
            reason: 'Strong fit',
            fit_breakdown: { topicRelevance: 0.9, pastCoverage: 0.8, engagement: 0.85, responsiveness: 0.8, outletTier: 1.0, totalScore: 0.85 },
            position: 0,
            created_at: new Date().toISOString(),
            journalist: {
              id: 'j1',
              full_name: 'Jane Smith',
              primary_email: 'jane@example.com',
              primary_outlet: 'TechCrunch',
              beat: 'Healthcare Tech',
              engagement_score: 0.8,
              responsiveness_score: 0.7,
              relevance_score: 0.9,
            },
          },
        ],
      };

      const mockQuery = createMockQueryBuilder(createMockSuccess([mockListData]));
      (mockSupabase.from as any).mockReturnValue(mockQuery);

      const result = await service.getMediaList(listId, orgId);

      expect(result).toBeDefined();
      expect(result?.id).toBe(listId);
      expect(result?.name).toBe('AI Healthcare List');
      expect(result?.entries).toHaveLength(1);
      expect(result?.entries[0].journalist.fullName).toBe('Jane Smith');
    });

    it('should return null when list not found', async () => {
      const listId = 'nonexistent';
      const orgId = '123e4567-e89b-12d3-a456-426614174000';

      const mockQuery = createMockQueryBuilder(createMockSuccess([]));
      (mockSupabase.from as any).mockReturnValue(mockQuery);

      const result = await service.getMediaList(listId, orgId);

      expect(result).toBeNull();
    });
  });

  describe('listMediaLists', () => {
    it('should list media lists with pagination', async () => {
      const orgId = '123e4567-e89b-12d3-a456-426614174000';

      const mockLists = [
        {
          id: 'list1',
          org_id: orgId,
          name: 'List 1',
          input_topic: 'AI',
          input_keywords: ['ml'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const mockQuery = createMockQueryBuilder(createMockSuccess(mockLists, 1));
      (mockSupabase.from as any).mockReturnValue(mockQuery);

      const result = await service.listMediaLists(orgId, {
        limit: 20,
        offset: 0,
        sortBy: 'created_at',
        sortOrder: 'desc',
      });

      expect(result.lists).toHaveLength(1);
      expect(result.lists[0].name).toBe('List 1');
      expect(result.pagination.total).toBe(1);
    });

    it('should filter by topic', async () => {
      const orgId = '123e4567-e89b-12d3-a456-426614174000';

      const mockQuery = createMockQueryBuilder(createMockSuccess([], 0));
      (mockSupabase.from as any).mockReturnValue(mockQuery);

      const result = await service.listMediaLists(orgId, {
        topic: 'AI',
        limit: 20,
        offset: 0,
      });

      expect(result.lists).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('updateMediaList', () => {
    it('should update media list metadata', async () => {
      const listId = 'list123';
      const orgId = '123e4567-e89b-12d3-a456-426614174000';

      const mockUpdatedList = {
        id: listId,
        org_id: orgId,
        name: 'Updated Name',
        description: 'Updated Description',
        input_topic: 'AI',
        input_keywords: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockQuery = createMockQueryBuilder(createMockSuccess([mockUpdatedList]));
      (mockSupabase.from as any).mockReturnValue(mockQuery);

      const result = await service.updateMediaList(listId, orgId, {
        name: 'Updated Name',
        description: 'Updated Description',
      });

      expect(result).toBeDefined();
      expect(result?.name).toBe('Updated Name');
      expect(result?.description).toBe('Updated Description');
    });
  });

  describe('deleteMediaList', () => {
    it('should delete media list', async () => {
      const listId = 'list123';
      const orgId = '123e4567-e89b-12d3-a456-426614174000';

      const mockQuery = createMockQueryBuilder(createMockSuccess(null));
      (mockSupabase.from as any).mockReturnValue(mockQuery);

      const result = await service.deleteMediaList(listId, orgId);

      expect(result).toBe(true);
    });

    it('should handle delete errors', async () => {
      const listId = 'list123';
      const orgId = '123e4567-e89b-12d3-a456-426614174000';

      const mockQuery = createMockQueryBuilder(createMockError('Delete failed'));
      (mockSupabase.from as any).mockReturnValue(mockQuery);

      const result = await service.deleteMediaList(listId, orgId);

      expect(result).toBe(false);
    });
  });

  describe('getMediaListEntries', () => {
    it('should retrieve entries with filtering', async () => {
      const listId = 'list123';

      const mockEntries = [
        {
          id: 'entry1',
          list_id: listId,
          journalist_id: 'j1',
          fit_score: 0.85,
          tier: 'A',
          reason: 'Strong fit',
          fit_breakdown: {},
          position: 0,
          created_at: new Date().toISOString(),
          journalist: {
            id: 'j1',
            full_name: 'Jane Smith',
            primary_email: 'jane@example.com',
            engagement_score: 0.8,
            responsiveness_score: 0.7,
            relevance_score: 0.9,
          },
        },
      ];

      const mockQuery = createMockQueryBuilder(createMockSuccess(mockEntries, 1));
      (mockSupabase.from as any).mockReturnValue(mockQuery);

      const result = await service.getMediaListEntries({
        listId,
        tier: ['A', 'B'],
        minFitScore: 0.5,
        sortBy: 'fit_score',
        sortOrder: 'desc',
        limit: 20,
        offset: 0,
      });

      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].tier).toBe('A');
      expect(result.pagination.total).toBe(1);
    });
  });
});
