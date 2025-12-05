/**
 * BriefGeneratorService tests (Sprint S13)
 * Tests for AI-assisted content brief generation
 * Updated in Sprint S26 to use comprehensive Supabase mock
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BriefGeneratorService } from '../src/services/briefGeneratorService';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createMockSupabaseClient, createMockQueryBuilder, createMockSuccess } from './helpers/supabaseMock';

describe('BriefGeneratorService', () => {
  let service: BriefGeneratorService;
  let mockSupabase: SupabaseClient;
  let mockBillingService: any;
  const orgId = 'org-123';
  const userId = 'user-456';

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();

    // S29: Mock BillingService
    mockBillingService = {
      enforceOrgQuotaOrThrow: vi.fn().mockResolvedValue(undefined),
      buildOrgBillingSummary: vi.fn(),
      checkOrgQuota: vi.fn(),
      updateUsageCounters: vi.fn(),
    };

    service = new BriefGeneratorService(mockSupabase, mockBillingService);
  });

  describe('generateBrief', () => {
    it('should generate a brief with stub outputs', async () => {
      // Mock all the dependencies using comprehensive mock pattern
      const mockContentQuery = createMockQueryBuilder(createMockSuccess(null));
      const mockKeywordsQuery = createMockQueryBuilder(
        createMockSuccess(
          [
            {
              id: 'kw-1',
              org_id: orgId,
              keyword: 'content marketing',
              search_volume: 5400,
              difficulty: 45,
              intent: 'informational',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
          1
        )
      );
      const mockOpportunitiesQuery = createMockQueryBuilder(createMockSuccess([]));
      const mockMemoriesQuery = createMockQueryBuilder(createMockSuccess([]));
      const mockContentItemsQuery = createMockQueryBuilder(createMockSuccess([], 0));
      const mockClustersQuery = createMockQueryBuilder(createMockSuccess([]));
      const mockGapsQuery = createMockQueryBuilder(createMockSuccess([]));
      const mockPersonalitiesQuery = createMockQueryBuilder(createMockSuccess(null));
      const mockPlaybookRunInsert = createMockQueryBuilder(
        createMockSuccess({
          id: 'run-123',
          org_id: orgId,
          playbook_id: 'CONTENT_BRIEF_GENERATION_V1',
          status: 'RUNNING',
          created_at: new Date().toISOString(),
        })
      );
      const mockPlaybookRunUpdate = createMockQueryBuilder(createMockSuccess(null));
      const mockBriefInsert = createMockQueryBuilder(
        createMockSuccess({
          id: 'brief-789',
          org_id: orgId,
          content_item_id: null,
          playbook_run_id: 'run-123',
          brief: {
            title: 'Complete Guide to test keyword',
            targetKeyword: 'test keyword',
            targetIntent: 'informational',
            targetAudience: 'Marketing professionals and content creators',
            tone: 'professional',
            minWordCount: 1500,
            maxWordCount: 2500,
          },
          outline: {},
          seo_context: {},
          personality_used: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      );

      // Mock the from() calls using mockImplementation to handle table-specific queries
      (mockSupabase.from as any).mockImplementation((table: string) => {
        if (table === 'seo_keywords') return mockKeywordsQuery;
        if (table === 'seo_opportunities') return mockOpportunitiesQuery;
        if (table === 'content_items') return mockContentItemsQuery;
        if (table === 'content_clusters') return mockClustersQuery;
        if (table === 'content_gaps') return mockGapsQuery;
        if (table === 'agent_personalities') return mockPersonalitiesQuery;
        if (table === 'playbook_runs') {
          // Return insert query first time, update query second time
          const callCount = (mockSupabase.from as any).mock.calls.filter(
            (c: any) => c[0] === 'playbook_runs'
          ).length;
          return callCount === 1 ? mockPlaybookRunInsert : mockPlaybookRunUpdate;
        }
        if (table === 'content_generated_briefs') return mockBriefInsert;
        return mockContentQuery;
      });

      const result = await service.generateBrief(orgId, userId, {
        targetKeyword: 'test keyword',
        targetIntent: 'informational',
      });

      expect(result.generatedBriefId).toBe('brief-789');
      expect(result.runId).toBe('run-123');
      expect(result.brief).toBeDefined();
      expect(result.brief.title).toContain('test keyword');
      expect(result.outline).toBeDefined();
    });

    it('should use personality override when provided', async () => {
      const personalityId = 'personality-999';

      // Mock queries using comprehensive mock pattern
      const mockEmptyQuery = createMockQueryBuilder(createMockSuccess(null));
      const mockEmptyArrayQuery = createMockQueryBuilder(createMockSuccess([], 0));
      const mockPersonalityQuery = createMockQueryBuilder(
        createMockSuccess({
          id: personalityId,
          org_id: orgId,
          slug: 'test-personality',
          name: 'Test Personality',
          configuration: {
            tone: 'casual',
            style: 'concise',
          },
        })
      );
      const mockPlaybookInsert = createMockQueryBuilder(
        createMockSuccess({ id: 'run-123', org_id: orgId })
      );
      const mockPlaybookUpdate = createMockQueryBuilder(createMockSuccess(null));
      const mockBriefInsert = createMockQueryBuilder(
        createMockSuccess({
          id: 'brief-789',
          org_id: orgId,
          personality_used: { tone: 'casual', style: 'concise' },
          brief: { tone: 'casual' },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      );

      // Mock the from() calls using mockImplementation to handle table-specific queries
      let playbookCallCount = 0;
      (mockSupabase.from as any).mockImplementation((table: string) => {
        if (table === 'seo_keywords') return mockEmptyArrayQuery;
        if (table === 'seo_opportunities') return mockEmptyArrayQuery;
        if (table === 'content_items') return mockEmptyArrayQuery;
        if (table === 'content_clusters') return mockEmptyArrayQuery;
        if (table === 'content_gaps') return mockEmptyArrayQuery;
        if (table === 'agent_personalities') return mockPersonalityQuery;
        if (table === 'playbook_runs') {
          playbookCallCount++;
          return playbookCallCount === 1 ? mockPlaybookInsert : mockPlaybookUpdate;
        }
        if (table === 'content_generated_briefs') return mockBriefInsert;
        return mockEmptyQuery;
      });

      const result = await service.generateBrief(orgId, userId, {
        targetKeyword: 'test',
        personalityId,
      });

      expect(result.generatedBriefId).toBe('brief-789');
      expect(mockPersonalityQuery.eq).toHaveBeenCalledWith('id', personalityId);
    });

    it('should include content item when contentItemId is provided', async () => {
      const contentItemId = 'content-item-123';

      // Mock content item using comprehensive mock pattern
      const mockContentQuery = createMockQueryBuilder(
        createMockSuccess({
          id: contentItemId,
          org_id: orgId,
          title: 'Existing Content',
          content_type: 'blog_post',
          word_count: 1200,
        })
      );
      const mockEmptyQuery = createMockQueryBuilder(createMockSuccess(null));
      const mockEmptyArrayQuery = createMockQueryBuilder(createMockSuccess([], 0));
      const mockPlaybookInsert = createMockQueryBuilder(
        createMockSuccess({ id: 'run-123', org_id: orgId })
      );
      const mockPlaybookUpdate = createMockQueryBuilder(createMockSuccess(null));
      const mockBriefInsert = createMockQueryBuilder(
        createMockSuccess({
          id: 'brief-789',
          org_id: orgId,
          content_item_id: contentItemId,
          brief: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      );

      // Mock the from() calls using mockImplementation to handle table-specific queries
      let playbookCallCount = 0;
      let contentItemCallCount = 0;
      (mockSupabase.from as any).mockImplementation((table: string) => {
        if (table === 'seo_keywords') return mockEmptyArrayQuery;
        if (table === 'seo_opportunities') return mockEmptyArrayQuery;
        if (table === 'content_items') {
          // First call is to get the specific content item, subsequent calls for listing
          contentItemCallCount++;
          return contentItemCallCount === 1 ? mockContentQuery : mockEmptyArrayQuery;
        }
        if (table === 'content_clusters') return mockEmptyArrayQuery;
        if (table === 'content_gaps') return mockEmptyArrayQuery;
        if (table === 'agent_personalities') return mockEmptyQuery;
        if (table === 'playbook_runs') {
          playbookCallCount++;
          return playbookCallCount === 1 ? mockPlaybookInsert : mockPlaybookUpdate;
        }
        if (table === 'content_generated_briefs') return mockBriefInsert;
        return mockEmptyQuery;
      });

      const result = await service.generateBrief(orgId, userId, {
        contentItemId,
        targetKeyword: 'test',
      });

      expect(result.generatedBriefId).toBe('brief-789');
      expect(mockContentQuery.eq).toHaveBeenCalledWith('id', contentItemId);
    });
  });

  describe('getGeneratedBrief', () => {
    it('should return a generated brief by ID', async () => {
      const briefId = 'brief-123';

      const mockQuery = createMockQueryBuilder(
        createMockSuccess({
          id: briefId,
          org_id: orgId,
          content_item_id: null,
          playbook_run_id: 'run-456',
          brief: {
            title: 'Test Brief',
            targetKeyword: 'test keyword',
          },
          outline: {},
          seo_context: {},
          personality_used: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      );

      (mockSupabase.from as any).mockReturnValue(mockQuery);

      const result = await service.getGeneratedBrief(orgId, briefId);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(briefId);
      expect(result?.brief).toBeDefined();
      expect((result?.brief as any).title).toBe('Test Brief');
      expect(mockQuery.eq).toHaveBeenCalledWith('id', briefId);
      expect(mockQuery.eq).toHaveBeenCalledWith('org_id', orgId);
    });

    it('should return null when brief not found', async () => {
      const mockQuery = createMockQueryBuilder({
        data: null,
        error: { message: 'Not found' },
      });

      (mockSupabase.from as any).mockReturnValue(mockQuery);

      const result = await service.getGeneratedBrief(orgId, 'nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('listGeneratedBriefs', () => {
    it('should return list of generated briefs', async () => {
      const mockBriefs = [
        {
          id: 'brief-1',
          org_id: orgId,
          content_item_id: null,
          playbook_run_id: 'run-1',
          brief: { title: 'Brief 1' },
          outline: {},
          seo_context: {},
          personality_used: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'brief-2',
          org_id: orgId,
          content_item_id: null,
          playbook_run_id: 'run-2',
          brief: { title: 'Brief 2' },
          outline: {},
          seo_context: {},
          personality_used: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const mockQuery = createMockQueryBuilder(createMockSuccess(mockBriefs));

      (mockSupabase.from as any).mockReturnValue(mockQuery);

      const result = await service.listGeneratedBriefs(orgId, {});

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('brief-1');
      expect(result[1].id).toBe('brief-2');
      expect(mockQuery.eq).toHaveBeenCalledWith('org_id', orgId);
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should apply contentItemId filter when provided', async () => {
      const contentItemId = 'content-123';

      const mockQuery = createMockQueryBuilder(createMockSuccess([]));

      (mockSupabase.from as any).mockReturnValue(mockQuery);

      await service.listGeneratedBriefs(orgId, { contentItemId });

      expect(mockQuery.eq).toHaveBeenCalledWith('org_id', orgId);
      expect(mockQuery.eq).toHaveBeenCalledWith('content_item_id', contentItemId);
    });

    it('should apply pagination with limit and offset', async () => {
      const mockQuery = createMockQueryBuilder(createMockSuccess([]));

      (mockSupabase.from as any).mockReturnValue(mockQuery);

      await service.listGeneratedBriefs(orgId, { limit: 10, offset: 20 });

      expect(mockQuery.range).toHaveBeenCalledWith(20, 29); // offset to offset + limit - 1
    });

    it('should use default limit of 20 when not specified', async () => {
      const mockQuery = createMockQueryBuilder(createMockSuccess([]));

      (mockSupabase.from as any).mockReturnValue(mockQuery);

      await service.listGeneratedBriefs(orgId, {});

      expect(mockQuery.range).toHaveBeenCalledWith(0, 19); // default limit of 20
    });
  });
});
