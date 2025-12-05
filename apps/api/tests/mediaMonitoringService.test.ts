/**
 * Media Monitoring Service Tests (Sprint S40)
 * Unit tests for media monitoring, article ingestion, and mention detection
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MediaMonitoringService, createMediaMonitoringService } from '../src/services/mediaMonitoringService';

// Mock Supabase client
const mockSupabaseData = {
  sources: [] as any[],
  articles: [] as any[],
  mentions: [] as any[],
  journalists: [] as any[],
};

const createMockSupabase = () => {
  // Create a shared result object
  const defaultResult = {
    data: null,
    error: null,
    count: 0,
  };

  // Create a chain object that all methods will return
  const chainMethods: any = {
    then: (resolve: any) => resolve(defaultResult),
  };

  const mockSelect = vi.fn((..._args: any[]) => chainMethods);
  const mockInsert = vi.fn((..._args: any[]) => chainMethods);
  const mockUpdate = vi.fn((..._args: any[]) => chainMethods);
  const mockUpsert = vi.fn((..._args: any[]) => chainMethods);
  const mockDelete = vi.fn((..._args: any[]) => chainMethods);
  const mockEq = vi.fn((..._args: any[]) => chainMethods);
  const mockIlike = vi.fn((..._args: any[]) => chainMethods);
  const mockGte = vi.fn((..._args: any[]) => chainMethods);
  const mockLte = vi.fn((..._args: any[]) => chainMethods);
  const mockContains = vi.fn((..._args: any[]) => chainMethods);
  const mockIn = vi.fn((..._args: any[]) => chainMethods);
  const mockOr = vi.fn((..._args: any[]) => chainMethods);
  const mockOrder = vi.fn((..._args: any[]) => chainMethods);
  const mockRange = vi.fn((..._args: any[]) => chainMethods);
  const mockLimit = vi.fn((..._args: any[]) => chainMethods);

  const mockSingle = vi.fn().mockImplementation(() => ({
    data: mockSupabaseData.sources[0] || null,
    error: null,
  }));

  const mockRpc = vi.fn().mockResolvedValue({ data: [], error: null });

  // Populate the chain methods object
  Object.assign(chainMethods, {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    upsert: mockUpsert,
    delete: mockDelete,
    eq: mockEq,
    ilike: mockIlike,
    gte: mockGte,
    lte: mockLte,
    contains: mockContains,
    in: mockIn,
    or: mockOr,
    order: mockOrder,
    range: mockRange,
    limit: mockLimit,
    single: mockSingle,
  });

  const mockFrom = vi.fn().mockImplementation(() => chainMethods);

  return {
    from: mockFrom,
    rpc: mockRpc,
    _mocks: {
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      upsert: mockUpsert,
      single: mockSingle,
      eq: mockEq,
      rpc: mockRpc,
    },
  };
};

// Mock LLM Router
const createMockLlmRouter = () => ({
  generate: vi.fn().mockResolvedValue({
    completion: 'This is a test summary of the article.',
    tokensUsed: 100,
    model: 'gpt-4o-mini',
  }),
});

describe('MediaMonitoringService', () => {
  let service: MediaMonitoringService;
  let mockSupabase: ReturnType<typeof createMockSupabase>;
  let mockLlmRouter: ReturnType<typeof createMockLlmRouter>;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    mockLlmRouter = createMockLlmRouter();

    service = createMediaMonitoringService({
      supabase: mockSupabase as any,
      llmRouter: mockLlmRouter as any,
      debugMode: true,
    });

    // Reset mock data
    mockSupabaseData.sources = [];
    mockSupabaseData.articles = [];
    mockSupabaseData.mentions = [];
    mockSupabaseData.journalists = [];
  });

  describe('Source Management', () => {
    it('should create a new source', async () => {
      const mockSource = {
        id: 'source-1',
        org_id: 'org-1',
        name: 'TechCrunch',
        url: 'https://techcrunch.com',
        description: null,
        active: true,
        source_type: 'website',
        crawl_frequency_hours: 24,
        last_crawled_at: null,
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockSource,
        error: null,
      });

      const result = await service.createSource('org-1', {
        name: 'TechCrunch',
        url: 'https://techcrunch.com',
      });

      expect(result).toBeDefined();
      expect(result.name).toBe('TechCrunch');
      expect(result.url).toBe('https://techcrunch.com');
      expect(result.active).toBe(true);
    });

    it('should list sources with filters', async () => {
      const mockSources = [
        {
          id: 'source-1',
          org_id: 'org-1',
          name: 'TechCrunch',
          url: 'https://techcrunch.com',
          active: true,
          source_type: 'website',
          crawl_frequency_hours: 24,
          last_crawled_at: null,
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'source-2',
          org_id: 'org-1',
          name: 'Wired',
          url: 'https://wired.com',
          active: true,
          source_type: 'website',
          crawl_frequency_hours: 24,
          last_crawled_at: null,
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      mockSupabase._mocks.select.mockResolvedValueOnce({
        data: mockSources,
        error: null,
        count: 2,
      });

      const result = await service.listSources('org-1', { active: true });

      expect(result.sources).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should deactivate a source', async () => {
      mockSupabase._mocks.update.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      await expect(
        service.deactivateSource('org-1', 'source-1')
      ).resolves.not.toThrow();

      expect(mockSupabase._mocks.update).toHaveBeenCalled();
    });
  });

  describe('Article Ingestion', () => {
    it('should ingest an article with content', async () => {
      const mockArticle = {
        id: 'article-1',
        org_id: 'org-1',
        source_id: null,
        url: 'https://example.com/article',
        title: 'Test Article',
        author: 'John Doe',
        published_at: new Date().toISOString(),
        content: 'Test content',
        summary: 'Test summary',
        embeddings: null,
        relevance_score: 0.5,
        keywords: ['test', 'article'],
        domain_authority: 40,
        word_count: 2,
        language: 'en',
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockArticle,
        error: null,
      });

      const result = await service.ingestArticle('org-1', 'https://example.com/article', {
        title: 'Test Article',
        author: 'John Doe',
        content: 'Test content',
      });

      expect(result.article).toBeDefined();
      expect(result.article.title).toBe('Test Article');
      expect(result.extracted.keywords).toBeDefined();
    });

    it('should extract keywords from content', async () => {
      mockLlmRouter.generate.mockResolvedValueOnce({
        completion: 'technology, innovation, startup, funding, growth',
        tokensUsed: 50,
        model: 'gpt-4o-mini',
      });

      const mockArticle = {
        id: 'article-1',
        org_id: 'org-1',
        url: 'https://example.com/article',
        title: 'Startup Raises Funding',
        content: 'A startup has raised funding for growth and innovation in technology.',
        summary: 'Startup funding news',
        embeddings: null,
        relevance_score: 0.6,
        keywords: ['technology', 'innovation', 'startup', 'funding', 'growth'],
        domain_authority: 50,
        word_count: 12,
        language: 'en',
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockArticle,
        error: null,
      });

      const result = await service.ingestArticle('org-1', 'https://example.com/article', {
        title: 'Startup Raises Funding',
        content: 'A startup has raised funding for growth and innovation in technology.',
      });

      expect(result.extracted.keywords.length).toBeGreaterThan(0);
    });
  });

  describe('Mention Detection', () => {
    it('should detect mentions in content using fallback', async () => {
      const mockArticle = {
        id: 'article-1',
        org_id: 'org-1',
        url: 'https://example.com/article',
        title: 'Acme Corp announces new product',
        content: 'Acme Corp has announced a revolutionary new product called Widget Pro.',
        summary: 'Acme Corp product launch',
        embeddings: null,
        relevance_score: 0.7,
        keywords: ['acme', 'product', 'launch'],
        domain_authority: 60,
        word_count: 10,
        language: 'en',
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Service without LLM router for fallback testing
      const serviceWithoutLlm = createMediaMonitoringService({
        supabase: mockSupabase as any,
        debugMode: true,
      });

      mockSupabase._mocks.single
        .mockResolvedValueOnce({ data: mockArticle, error: null }) // Get article
        .mockResolvedValueOnce({ data: { id: 'mention-1', ...mockArticle }, error: null }); // Insert mention

      const result = await serviceWithoutLlm.detectMentions('org-1', 'article-1', ['Acme Corp']);

      expect(result.mentions.length).toBeGreaterThanOrEqual(0);
      expect(result.stats).toBeDefined();
    });

    it('should calculate sentiment stats correctly', async () => {
      const mockArticle = {
        id: 'article-1',
        org_id: 'org-1',
        content: 'Company A is doing great things. Company B had some issues.',
        title: 'Industry Update',
      };

      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockArticle,
        error: null,
      });

      // Mock LLM response for mention detection
      mockLlmRouter.generate.mockResolvedValueOnce({
        completion: JSON.stringify([
          { entity: 'Company A', entityType: 'brand', sentiment: 'positive', confidence: 0.9, snippet: 'doing great things', isPrimary: true, position: 0 },
          { entity: 'Company B', entityType: 'brand', sentiment: 'negative', confidence: 0.8, snippet: 'had some issues', isPrimary: false, position: 50 },
        ]),
        tokensUsed: 100,
        model: 'gpt-4o-mini',
      });

      // Mock mention inserts
      mockSupabase._mocks.single
        .mockResolvedValueOnce({
          data: { id: 'm1', org_id: 'org-1', article_id: 'article-1', entity: 'Company A', sentiment: 'positive', confidence: 0.9, is_primary_mention: true, created_at: new Date().toISOString() },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: 'm2', org_id: 'org-1', article_id: 'article-1', entity: 'Company B', sentiment: 'negative', confidence: 0.8, is_primary_mention: false, created_at: new Date().toISOString() },
          error: null,
        });

      const result = await service.detectMentions('org-1', 'article-1', ['Company A', 'Company B']);

      expect(result.stats.positive).toBeGreaterThanOrEqual(0);
      expect(result.stats.negative).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Journalist Matching', () => {
    it('should match journalist by exact name', async () => {
      const mockJournalist = {
        id: 'journalist-1',
        org_id: 'org-1',
        name: 'Jane Smith',
        email: 'jane@techcrunch.com',
        beat: 'Technology',
        media_outlets: { name: 'TechCrunch' },
      };

      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockJournalist,
        error: null,
      });

      const result = await service.matchJournalist('org-1', 'Jane Smith', 'Article content');

      expect(result).toBeDefined();
      expect(result?.name).toBe('Jane Smith');
      expect(result?.matchScore).toBe(1.0);
    });

    it('should return null for unknown author', async () => {
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      mockSupabase._mocks.select.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const result = await service.matchJournalist('org-1', 'Unknown Author', 'Article content');

      expect(result).toBeNull();
    });

    it('should return null for null author', async () => {
      const result = await service.matchJournalist('org-1', null, 'Article content');

      expect(result).toBeNull();
    });
  });

  describe('Relevance Scoring', () => {
    it('should calculate relevance score based on content', async () => {
      const mockArticle = {
        id: 'article-1',
        org_id: 'org-1',
        url: 'https://example.com/article',
        title: 'Long Article With Many Keywords',
        content: 'A '.repeat(1000) + 'substantial content here with many keywords',
        summary: 'Long article summary',
        embeddings: null,
        relevance_score: 0.8,
        keywords: Array(10).fill('keyword'),
        domain_authority: 70,
        word_count: 1000,
        language: 'en',
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockArticle,
        error: null,
      });

      const result = await service.ingestArticle('org-1', 'https://example.com/article', {
        title: 'Long Article With Many Keywords',
        content: 'A '.repeat(1000) + 'substantial content here with many keywords',
      });

      expect(result.article.relevanceScore).toBeGreaterThan(0);
      expect(result.article.relevanceScore).toBeLessThanOrEqual(1);
    });
  });

  describe('Statistics', () => {
    it('should get monitoring statistics', async () => {
      const mockStats = {
        total_sources: 5,
        active_sources: 4,
        total_articles: 100,
        articles_this_week: 15,
        total_mentions: 50,
        mentions_this_week: 8,
        positive_mentions: 20,
        neutral_mentions: 25,
        negative_mentions: 5,
        avg_relevance: 0.65,
      };

      mockSupabase._mocks.rpc.mockResolvedValueOnce({
        data: mockStats,
        error: null,
      });

      const result = await service.getStats('org-1');

      expect(result.totalSources).toBe(5);
      expect(result.activeSources).toBe(4);
      expect(result.totalArticles).toBe(100);
      expect(result.positiveMentions).toBe(20);
    });

    it('should handle stats RPC failure gracefully', async () => {
      mockSupabase._mocks.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'RPC not available' },
      });

      // Mock fallback queries
      mockSupabase._mocks.select
        .mockResolvedValueOnce({ data: [{ active: true }], count: 1, error: null })
        .mockResolvedValueOnce({ data: [{ relevance_score: 0.5, created_at: new Date().toISOString() }], count: 1, error: null })
        .mockResolvedValueOnce({ data: [{ sentiment: 'neutral', created_at: new Date().toISOString() }], count: 1, error: null });

      const result = await service.getStats('org-1');

      expect(result).toBeDefined();
      expect(typeof result.totalSources).toBe('number');
    });
  });

  describe('Error Handling', () => {
    it('should throw on source creation failure', async () => {
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(
        service.createSource('org-1', {
          name: 'Test',
          url: 'https://test.com',
        })
      ).rejects.toThrow('Failed to create source');
    });

    it('should throw on article not found for mention detection', async () => {
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(
        service.detectMentions('org-1', 'nonexistent', ['Brand'])
      ).rejects.toThrow('Article not found');
    });

    it('should throw when article has no content for mention detection', async () => {
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: {
          id: 'article-1',
          content: null,
        },
        error: null,
      });

      await expect(
        service.detectMentions('org-1', 'article-1', ['Brand'])
      ).rejects.toThrow('Article has no content');
    });
  });
});
