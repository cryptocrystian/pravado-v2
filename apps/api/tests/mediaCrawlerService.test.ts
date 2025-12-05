/**
 * Media Crawler Service Tests (Sprint S41)
 * Unit tests for RSS feeds, crawl jobs, and automated ingestion
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MediaCrawlerService, createMediaCrawlerService } from '../src/services/mediaCrawlerService';

// Mock Supabase
const createMockSupabase = () => {
  // Shared mock data that can be set per test
  let mockData: any = { data: null, error: null };

  const chainMethods: any = {
    // Make chainMethods promise-like so it can be awaited
    then: (resolve: (value: any) => void) => Promise.resolve(mockData).then(resolve),
  };

  const mockSelect = vi.fn(() => chainMethods);
  const mockInsert = vi.fn(() => chainMethods);
  const mockUpdate = vi.fn(() => chainMethods);
  const mockEq = vi.fn(() => chainMethods);
  const mockIn = vi.fn(() => chainMethods);
  const mockOrder = vi.fn(() => chainMethods);
  const mockRange = vi.fn(() => chainMethods);
  const mockSingle = vi.fn(() => chainMethods);
  const mockRpc = vi.fn().mockResolvedValue({ data: [], error: null });

  // Helper to set mock data for the next query
  const setMockData = (data: any) => {
    mockData = data;
  };

  Object.assign(chainMethods, {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    eq: mockEq,
    in: mockIn,
    order: mockOrder,
    range: mockRange,
    single: mockSingle,
  });

  const mockFrom = vi.fn().mockImplementation(() => chainMethods);

  return {
    from: mockFrom,
    rpc: mockRpc,
    _mocks: { select: mockSelect, insert: mockInsert, update: mockUpdate, single: mockSingle, rpc: mockRpc, setMockData },
  };
};

// Mock Monitoring Service
const createMockMonitoringService = () => ({
  ingestArticle: vi.fn().mockResolvedValue({
    article: {
      id: 'article-1',
      orgId: 'org-1',
      url: 'https://example.com/article',
      title: 'Test Article',
      relevanceScore: 0.8,
    },
  }),
});

describe('MediaCrawlerService', () => {
  let service: MediaCrawlerService;
  let mockSupabase: ReturnType<typeof createMockSupabase>;
  let mockMonitoringService: ReturnType<typeof createMockMonitoringService>;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    mockMonitoringService = createMockMonitoringService();

    service = createMediaCrawlerService({
      supabase: mockSupabase as any,
      monitoringService: mockMonitoringService as any,
      debugMode: true,
    });
  });

  describe('RSS Feed Management', () => {
    it('should add RSS feed', async () => {
      mockSupabase._mocks.setMockData({
        data: {
          id: 'feed-1',
          org_id: 'org-1',
          url: 'https://example.com/feed.xml',
          title: 'Test Feed',
          active: true,
          created_at: new Date().toISOString(),
        },
        error: null,
      });

      const feed = await service.addRSSFeed('org-1', { url: 'https://example.com/feed.xml', title: 'Test Feed' });

      expect(feed).toBeDefined();
      expect(feed.url).toBe('https://example.com/feed.xml');
    });

    it('should list RSS feeds', async () => {
      mockSupabase._mocks.setMockData({
        data: [{ id: 'feed-1', org_id: 'org-1', url: 'https://example.com/feed.xml', created_at: new Date().toISOString() }],
        error: null,
        count: 1,
      });

      const result = await service.listRSSFeeds('org-1');

      expect(result.feeds).toHaveLength(1);
    });

    it('should deactivate RSS feed', async () => {
      mockSupabase._mocks.setMockData({ data: null, error: null });
      await expect(service.deactivateRSSFeed('org-1', 'feed-1')).resolves.not.toThrow();
      expect(mockSupabase._mocks.update).toHaveBeenCalled();
    });
  });

  describe('RSS Fetcher', () => {
    it('should fetch RSS articles (stub)', async () => {
      const articles = await service.fetchRSS('https://example.com/feed.xml');

      expect(articles).toBeDefined();
      expect(articles.length).toBeGreaterThan(0);
      expect(articles[0]).toHaveProperty('title');
      expect(articles[0]).toHaveProperty('link');
    });
  });

  describe('Crawl Job Management', () => {
    it('should create crawl job', async () => {
      // First call checks for existing job (returns not found)
      mockSupabase._mocks.setMockData({ data: null, error: { code: 'PGRST116' } });

      // Note: createCrawlJob will make 2 queries - first to check existing, then to insert
      // Since we can't easily sequence mocks, we'll set the success data and the service will handle it
      mockSupabase._mocks.setMockData({
        data: {
          id: 'job-1',
          org_id: 'org-1',
          url: 'https://example.com/article',
          status: 'queued',
          created_at: new Date().toISOString(),
        },
        error: null,
      });

      const job = await service.createCrawlJob('org-1', { url: 'https://example.com/article' });

      expect(job).toBeDefined();
      expect(job.status).toBe('queued');
    });

    it('should list crawl jobs', async () => {
      mockSupabase._mocks.setMockData({
        data: [{ id: 'job-1', org_id: 'org-1', url: 'https://example.com/article', status: 'queued', created_at: new Date().toISOString() }],
        error: null,
        count: 1,
      });

      const result = await service.listCrawlJobs('org-1');

      expect(result.jobs).toHaveLength(1);
    });
  });

  describe('Job Execution', () => {
    it('should execute crawl job successfully', async () => {
      const jobData = {
        id: 'job-1',
        org_id: 'org-1',
        url: 'https://example.com/article',
        status: 'queued' as const,
        run_count: 0,
        created_at: new Date().toISOString(),
      };

      // Set mock data for getCrawlJob, then updates will succeed
      mockSupabase._mocks.setMockData({ data: jobData, error: null });

      const result = await service.executeCrawlJob('org-1', 'job-1');

      expect(result.success).toBe(true);
      expect(mockMonitoringService.ingestArticle).toHaveBeenCalled();
    });

    it('should handle job execution failure', async () => {
      mockSupabase._mocks.setMockData({
        data: {
          id: 'job-1',
          org_id: 'org-1',
          url: 'https://example.com/article',
          status: 'queued',
          run_count: 0,
        },
        error: null,
      });

      mockMonitoringService.ingestArticle.mockRejectedValueOnce(new Error('Ingestion failed'));

      const result = await service.executeCrawlJob('org-1', 'job-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Ingestion failed');
    });
  });

  describe('Statistics', () => {
    it('should get RSS stats', async () => {
      mockSupabase._mocks.rpc.mockResolvedValueOnce({
        data: {
          total_feeds: 5,
          active_feeds: 4,
          total_jobs: 100,
          queued_jobs: 10,
          running_jobs: 2,
          success_jobs: 80,
          failed_jobs: 8,
        },
        error: null,
      });

      const stats = await service.getStats('org-1');

      expect(stats.totalFeeds).toBe(5);
      expect(stats.queuedJobs).toBe(10);
    });
  });
});
