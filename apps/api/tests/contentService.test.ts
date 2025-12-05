/**
 * ContentService tests (Sprint S12)
 * Tests for Content Intelligence Engine V1
 * Updated in Sprint S26 to use comprehensive Supabase mock
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContentService } from '../src/services/contentService';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createMockSupabaseClient, createMockQueryBuilder, createMockSuccess, createMockError } from './helpers/supabaseMock';

describe('ContentService', () => {
  let service: ContentService;
  let mockSupabase: SupabaseClient;
  const orgId = 'org-123';

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    service = new ContentService(mockSupabase);
  });

  describe('listContentItems', () => {
    it('should return paginated content items', async () => {
      const mockItems = [
        {
          id: 'item-1',
          org_id: orgId,
          title: 'Test Article',
          slug: 'test-article',
          content_type: 'blog_post',
          status: 'published',
          body: 'Test content here',
          url: null,
          published_at: null,
          word_count: 3,
          reading_time_minutes: null,
          performance_score: null,
          primary_topic_id: null,
          embeddings: null,
          performance: {},
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockItems,
          error: null,
          count: 1,
        }),
      };

      (mockSupabase.from as any).mockReturnValue(mockQuery);

      const result = await service.listContentItems(orgId, { page: 1, pageSize: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe('Test Article');
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });

    it('should apply status filter', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      (mockSupabase.from as any).mockReturnValue(mockQuery);

      await service.listContentItems(orgId, { status: 'draft' });

      expect(mockQuery.eq).toHaveBeenCalledWith('org_id', orgId);
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'draft');
    });

    it('should apply search query filter', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      (mockSupabase.from as any).mockReturnValue(mockQuery);

      await service.listContentItems(orgId, { q: 'test' });

      expect(mockQuery.or).toHaveBeenCalledWith('title.ilike.%test%,body.ilike.%test%');
    });
  });

  describe('getContentItemById', () => {
    it('should return single content item', async () => {
      const mockItem = {
        id: 'item-1',
        org_id: orgId,
        title: 'Test Article',
        slug: 'test-article',
        content_type: 'blog_post',
        status: 'published',
        body: 'Test content',
        url: null,
        published_at: null,
        word_count: 2,
        reading_time_minutes: null,
        performance_score: null,
        primary_topic_id: null,
        embeddings: null,
        performance: {},
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockItem,
          error: null,
        }),
      };

      (mockSupabase.from as any).mockReturnValue(mockQuery);

      const result = await service.getContentItemById(orgId, 'item-1');

      expect(result).not.toBeNull();
      expect(result?.title).toBe('Test Article');
      expect(result?.id).toBe('item-1');
    });

    it('should return null when item not found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      };

      (mockSupabase.from as any).mockReturnValue(mockQuery);

      const result = await service.getContentItemById(orgId, 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('createContentItem', () => {
    it('should create content item with auto-generated fields', async () => {
      const inputData = {
        title: 'New Article',
        contentType: 'blog_post' as const,
        body: 'This is test content with multiple words',
        status: 'draft' as const,
      };

      const mockInsertedItem = {
        id: 'item-new',
        org_id: orgId,
        title: 'New Article',
        slug: 'new-article',
        content_type: 'blog_post',
        status: 'draft',
        body: 'This is test content with multiple words',
        url: null,
        published_at: null,
        word_count: 7,
        reading_time_minutes: null,
        performance_score: null,
        primary_topic_id: null,
        embeddings: expect.any(Array),
        performance: {},
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockInsertedItem,
          error: null,
        }),
      };

      (mockSupabase.from as any).mockReturnValue(mockQuery);

      const result = await service.createContentItem(orgId, inputData);

      expect(result.title).toBe('New Article');
      expect(result.slug).toBe('new-article');
      expect(result.wordCount).toBe(7);
    });

    it('should auto-generate slug from title', async () => {
      const inputData = {
        title: 'Hello World! This Is A Test',
        contentType: 'blog_post' as const,
        status: 'draft' as const,
      };

      const mockInsertedItem = {
        id: 'item-new',
        org_id: orgId,
        title: inputData.title,
        slug: 'hello-world-this-is-a-test',
        content_type: 'blog_post',
        status: 'draft',
        body: null,
        url: null,
        published_at: null,
        word_count: null,
        reading_time_minutes: null,
        performance_score: null,
        primary_topic_id: null,
        embeddings: null,
        performance: {},
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockInsertedItem,
          error: null,
        }),
      };

      (mockSupabase.from as any).mockReturnValue(mockQuery);

      const result = await service.createContentItem(orgId, inputData);

      expect(result.slug).toBe('hello-world-this-is-a-test');
    });
  });

  describe('updateContentItem', () => {
    it('should update content item and recalculate word count', async () => {
      const updates = {
        body: 'Updated content with new text',
      };

      const mockUpdatedItem = {
        id: 'item-1',
        org_id: orgId,
        title: 'Test Article',
        slug: 'test-article',
        content_type: 'blog_post',
        status: 'draft',
        body: 'Updated content with new text',
        url: null,
        published_at: null,
        word_count: 5,
        reading_time_minutes: null,
        performance_score: null,
        primary_topic_id: null,
        embeddings: expect.any(Array),
        performance: {},
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockUpdatedItem,
          error: null,
        }),
      };

      (mockSupabase.from as any).mockReturnValue(mockQuery);

      const result = await service.updateContentItem(orgId, 'item-1', updates);

      expect(result).not.toBeNull();
      expect(result?.wordCount).toBe(5);
    });

    it('should throw error when item not found', async () => {
      const mockQuery = createMockQueryBuilder(
        createMockError('Content item not found', 'PGRST116')
      );

      (mockSupabase.from as any).mockReturnValue(mockQuery);

      await expect(
        service.updateContentItem(orgId, 'nonexistent', { title: 'New Title' })
      ).rejects.toThrow('Failed to update content item: Content item not found');
    });
  });

  describe('listContentBriefs', () => {
    it('should return content briefs', async () => {
      const mockBriefs = [
        {
          id: 'brief-1',
          org_id: orgId,
          title: 'Test Brief',
          target_audience: 'Developers',
          target_keywords: ['test', 'content'],
          target_keyword: 'test',
          target_intent: 'informational',
          outline: { sections: ['intro', 'body', 'conclusion'] },
          tone: 'professional',
          min_word_count: 500,
          max_word_count: 1000,
          content_item_id: null,
          status: 'draft',
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockBriefs,
          error: null,
        }),
      };

      (mockSupabase.from as any).mockReturnValue(mockQuery);

      const result = await service.listContentBriefs(orgId, {});

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Test Brief');
      expect(result[0].targetKeyword).toBe('test');
    });

    it('should apply status filter', async () => {
      const mockQuery = createMockQueryBuilder(createMockSuccess([], 0));

      (mockSupabase.from as any).mockReturnValue(mockQuery);

      await service.listContentBriefs(orgId, { status: 'completed' });

      expect(mockQuery.eq).toHaveBeenCalledWith('org_id', orgId);
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'completed');
    });
  });

  describe('getContentBriefWithContext', () => {
    it('should return brief with context (topics and keywords)', async () => {
      const mockBrief = {
        id: 'brief-1',
        org_id: orgId,
        title: 'Test Brief',
        target_audience: 'Developers',
        target_keywords: ['test'],
        target_keyword: 'seo test',
        target_intent: 'informational',
        outline: {},
        tone: 'professional',
        min_word_count: 500,
        max_word_count: 1000,
        content_item_id: null,
        status: 'draft',
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockTopics = [
        {
          id: 'topic-1',
          org_id: orgId,
          name: 'SEO Basics',
          description: null,
          embeddings: null,
          content_item_id: null,
          relevance_score: null,
          cluster_id: null,
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const mockKeywords = [
        {
          id: 'kw-1',
          org_id: orgId,
          keyword: 'seo test keyword',
          search_volume: 1000,
          difficulty_score: 50,
          current_position: null,
          target_position: null,
          tracked_url: null,
          status: 'active',
          intent: 'informational',
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const mockBriefQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockBrief,
          error: null,
        }),
      };

      const mockTopicsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: mockTopics,
          error: null,
        }),
      };

      const mockKeywordsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: mockKeywords,
          error: null,
        }),
      };

      (mockSupabase.from as any)
        .mockReturnValueOnce(mockBriefQuery)
        .mockReturnValueOnce(mockTopicsQuery)
        .mockReturnValueOnce(mockKeywordsQuery);

      const result = await service.getContentBriefWithContext(orgId, 'brief-1');

      expect(result).not.toBeNull();
      expect(result?.brief.title).toBe('Test Brief');
      expect(result?.relatedTopics).toHaveLength(1);
      expect(result?.suggestedKeywords).toHaveLength(1);
      expect(result?.suggestedKeywords[0]).toBe('seo test keyword');
    });
  });

  describe('listContentClusters', () => {
    it('should return clusters with topics and content', async () => {
      const mockClusters = [
        {
          id: 'cluster-1',
          org_id: orgId,
          name: 'General Topics',
          description: 'Auto-generated cluster',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const mockTopics = [
        {
          id: 'topic-1',
          org_id: orgId,
          name: 'SEO',
          description: null,
          embeddings: null,
          content_item_id: null,
          relevance_score: null,
          cluster_id: 'cluster-1',
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const mockContent = [
        {
          id: 'item-1',
          org_id: orgId,
          title: 'SEO Guide',
          slug: 'seo-guide',
          content_type: 'blog_post',
          status: 'published',
          body: 'content',
          url: null,
          published_at: null,
          word_count: 1,
          reading_time_minutes: null,
          performance_score: null,
          primary_topic_id: 'topic-1',
          embeddings: null,
          performance: {},
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const mockClustersQuery = createMockQueryBuilder(createMockSuccess(mockClusters));
      const mockTopicsQuery = createMockQueryBuilder(createMockSuccess(mockTopics));
      const mockContentQuery = createMockQueryBuilder(createMockSuccess(mockContent));

      (mockSupabase.from as any)
        .mockReturnValueOnce(mockClustersQuery)
        .mockReturnValueOnce(mockTopicsQuery)
        .mockReturnValueOnce(mockContentQuery);

      const result = await service.listContentClusters(orgId);

      expect(result).toHaveLength(1);
      expect(result[0].cluster.name).toBe('General Topics');
      expect(result[0].topics).toHaveLength(1);
      expect(result[0].representativeContent).toHaveLength(1);
    });
  });

  describe('listContentGaps', () => {
    it('should identify content gaps from SEO keywords', async () => {
      const mockKeywords = [
        {
          id: 'kw-1',
          org_id: orgId,
          keyword: 'seo basics',
          search_volume: 5000,
          difficulty_score: 20,
          current_position: null,
          target_position: null,
          tracked_url: null,
          status: 'active',
          intent: 'informational',
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'kw-2',
          org_id: orgId,
          keyword: 'advanced seo',
          search_volume: 100,
          difficulty_score: 90,
          current_position: null,
          target_position: null,
          tracked_url: null,
          status: 'active',
          intent: 'commercial',
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const mockKeywordsQuery = createMockQueryBuilder(createMockSuccess(mockKeywords));
      const mockContentCountQuery = createMockQueryBuilder(createMockSuccess(null, 0));

      (mockSupabase.from as any)
        .mockReturnValueOnce(mockKeywordsQuery)
        .mockReturnValue(mockContentCountQuery);

      const result = await service.listContentGaps(orgId, {});

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('keyword');
      expect(result[0]).toHaveProperty('intent');
      expect(result[0]).toHaveProperty('existingContentCount');
      expect(result[0]).toHaveProperty('seoOpportunityScore');

      // First result should have higher opportunity score
      expect(result[0].seoOpportunityScore).toBeGreaterThan(result[1].seoOpportunityScore);
    });

    it('should filter gaps by minimum score', async () => {
      const mockKeywords = [
        {
          id: 'kw-1',
          org_id: orgId,
          keyword: 'test',
          search_volume: 1000,
          difficulty_score: 30,
          current_position: null,
          target_position: null,
          tracked_url: null,
          status: 'active',
          intent: 'informational',
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const mockKeywordsQuery = createMockQueryBuilder(createMockSuccess(mockKeywords));
      const mockContentCountQuery = createMockQueryBuilder(createMockSuccess(null, 0));

      (mockSupabase.from as any)
        .mockReturnValueOnce(mockKeywordsQuery)
        .mockReturnValue(mockContentCountQuery);

      const result = await service.listContentGaps(orgId, { minScore: 50 });

      // All results should have score >= 50
      result.forEach((gap) => {
        expect(gap.seoOpportunityScore).toBeGreaterThanOrEqual(50);
      });
    });
  });

  describe('createContentBrief', () => {
    it('should create content brief', async () => {
      const inputData = {
        title: 'SEO Guide Brief',
        targetKeyword: 'seo guide',
        targetAudience: 'Marketers',
        tone: 'professional' as const,
        minWordCount: 1000,
        maxWordCount: 2000,
        status: 'draft' as const,
      };

      const mockInsertedBrief = {
        id: 'brief-new',
        org_id: orgId,
        title: 'SEO Guide Brief',
        target_audience: 'Marketers',
        target_keywords: [],
        target_keyword: 'seo guide',
        target_intent: null,
        outline: null,
        tone: 'professional',
        min_word_count: 1000,
        max_word_count: 2000,
        content_item_id: null,
        status: 'draft',
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockInsertedBrief,
          error: null,
        }),
      };

      (mockSupabase.from as any).mockReturnValue(mockQuery);

      const result = await service.createContentBrief(orgId, inputData);

      expect(result.title).toBe('SEO Guide Brief');
      expect(result.targetKeyword).toBe('seo guide');
      expect(result.tone).toBe('professional');
    });
  });

  describe('updateContentBrief', () => {
    it('should update content brief', async () => {
      const updates = {
        status: 'completed' as const,
      };

      const mockUpdatedBrief = {
        id: 'brief-1',
        org_id: orgId,
        title: 'Test Brief',
        target_audience: null,
        target_keywords: [],
        target_keyword: null,
        target_intent: null,
        outline: null,
        tone: null,
        min_word_count: null,
        max_word_count: null,
        content_item_id: null,
        status: 'completed',
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockUpdatedBrief,
          error: null,
        }),
      };

      (mockSupabase.from as any).mockReturnValue(mockQuery);

      const result = await service.updateContentBrief(orgId, 'brief-1', updates);

      expect(result).not.toBeNull();
      expect(result?.status).toBe('completed');
    });
  });
});
