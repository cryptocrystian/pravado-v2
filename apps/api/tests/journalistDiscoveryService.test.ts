/**
 * Journalist Discovery Service Tests (Sprint S48)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JournalistDiscoveryService } from '../src/services/journalistDiscoveryService';
import type { DiscoveredJournalistInput } from '@pravado/types';

// Helper to create chainable mock
function createChainableMock(finalResult: any) {
  const chain: any = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    neq: vi.fn(),
    gt: vi.fn(),
    gte: vi.fn(),
    lt: vi.fn(),
    lte: vi.fn(),
    like: vi.fn(),
    ilike: vi.fn(),
    is: vi.fn(),
    in: vi.fn(),
    contains: vi.fn(),
    containedBy: vi.fn(),
    not: vi.fn(),
    or: vi.fn(),
    filter: vi.fn(),
    match: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    range: vi.fn(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
    // Make the chain thenable so it can be awaited directly
    then: vi.fn((resolve) => resolve(finalResult)),
  };

  // Make each method return the chain to support chaining
  Object.keys(chain).forEach((key) => {
    if (key === 'then') {
      // Skip the then method - it's already set up
      return;
    }
    if (key === 'range' || key === 'single' || key === 'maybeSingle') {
      chain[key].mockResolvedValue(finalResult);
    } else {
      chain[key].mockReturnValue(chain);
    }
  });

  return chain;
}

describe('JournalistDiscoveryService', () => {
  let service: JournalistDiscoveryService;
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn(),
      rpc: vi.fn(),
    };
    service = new JournalistDiscoveryService(mockSupabase);
  });

  describe('Discovery Creation', () => {
    it('should create a new discovery with confidence scoring', async () => {
      const mockDiscovery = {
        id: 'discovery-123',
        org_id: 'org-123',
        full_name: 'Jane Reporter',
        email: 'jane@techcrunch.com',
        outlet: 'TechCrunch',
        social_links: { twitter: '@janereporter' },
        beats: ['technology', 'startups'],
        bio: 'Senior tech reporter',
        confidence_score: 0.85,
        confidence_breakdown: {
          nameConfidence: 0.9,
          emailConfidence: 0.9,
          outletConfidence: 0.95,
          socialConfidence: 0.3,
          beatConfidence: 0.65,
          overallScore: 0.85,
        },
        source_type: 'article_author',
        source_url: 'https://techcrunch.com/article',
        raw_payload: {},
        status: 'pending',
        suggested_matches: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabase.rpc.mockResolvedValue({ data: [], error: null });

      const profilesChain = createChainableMock({ data: [], error: null });
      const insertChain = createChainableMock({ data: mockDiscovery, error: null });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'journalist_profiles') return profilesChain;
        if (table === 'discovered_journalists') return insertChain;
        return createChainableMock({ data: null, error: null });
      });

      const input: DiscoveredJournalistInput = {
        fullName: 'Jane Reporter',
        email: 'jane@techcrunch.com',
        outlet: 'TechCrunch',
        socialLinks: { twitter: '@janereporter' },
        beats: ['technology', 'startups'],
        bio: 'Senior tech reporter',
        sourceType: 'article_author',
        sourceUrl: 'https://techcrunch.com/article',
      };

      const result = await service.createDiscovery('org-123', input);

      expect(result.fullName).toBe('Jane Reporter');
      expect(result.email).toBe('jane@techcrunch.com');
      expect(result.confidenceScore).toBeGreaterThan(0.7);
      expect(result.status).toBe('pending');
    });

    it('should calculate correct confidence scores for high-quality data', async () => {
      const mockDiscovery = {
        id: 'discovery-123',
        org_id: 'org-123',
        full_name: 'Test Author',
        email: 'author@forbes.com',
        outlet: 'Forbes',
        confidence_score: 0.9,
        confidence_breakdown: {
          nameConfidence: 0.9,
          emailConfidence: 0.9,
          outletConfidence: 0.95,
          socialConfidence: 0,
          beatConfidence: 0,
          overallScore: 0.9,
        },
        source_type: 'article_author',
        status: 'pending',
        social_links: {},
        beats: [],
        raw_payload: {},
        suggested_matches: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabase.rpc.mockResolvedValue({ data: [], error: null });

      const profilesChain = createChainableMock({ data: [], error: null });
      const insertChain = createChainableMock({ data: mockDiscovery, error: null });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'journalist_profiles') return profilesChain;
        if (table === 'discovered_journalists') return insertChain;
        return createChainableMock({ data: null, error: null });
      });

      const input: DiscoveredJournalistInput = {
        fullName: 'Test Author',
        email: 'author@forbes.com',
        outlet: 'Forbes',
        sourceType: 'article_author',
      };

      const result = await service.createDiscovery('org-123', input);

      expect(result.confidenceScore).toBeGreaterThan(0.85);
    });

    it('should calculate lower confidence for incomplete data', async () => {
      const mockDiscovery = {
        id: 'discovery-123',
        org_id: 'org-123',
        full_name: 'Unknown',
        confidence_score: 0.3,
        confidence_breakdown: {
          nameConfidence: 0.5,
          emailConfidence: 0,
          outletConfidence: 0,
          socialConfidence: 0,
          beatConfidence: 0,
          overallScore: 0.3,
        },
        source_type: 'social_profile',
        status: 'pending',
        email: null,
        outlet: null,
        social_links: {},
        beats: [],
        raw_payload: {},
        suggested_matches: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabase.rpc.mockResolvedValue({ data: [], error: null });

      const profilesChain = createChainableMock({ data: [], error: null });
      const insertChain = createChainableMock({ data: mockDiscovery, error: null });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'journalist_profiles') return profilesChain;
        if (table === 'discovered_journalists') return insertChain;
        return createChainableMock({ data: null, error: null });
      });

      const input: DiscoveredJournalistInput = {
        fullName: 'Unknown',
        sourceType: 'social_profile',
      };

      const result = await service.createDiscovery('org-123', input);

      expect(result.confidenceScore).toBeLessThan(0.5);
    });
  });

  describe('Discovery Listing and Filtering', () => {
    it('should list discoveries with filters', async () => {
      const mockDiscoveries = [
        {
          id: 'discovery-1',
          org_id: 'org-123',
          full_name: 'Alice Writer',
          email: 'alice@wired.com',
          outlet: 'Wired',
          confidence_score: 0.9,
          status: 'pending',
          source_type: 'article_author',
          social_links: {},
          beats: ['technology'],
          raw_payload: {},
          confidence_breakdown: {},
          suggested_matches: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const listChain = createChainableMock({
        data: mockDiscoveries,
        count: 1,
        error: null,
      });

      mockSupabase.from.mockReturnValue(listChain);
      mockSupabase.rpc.mockResolvedValue({
        data: [
          {
            total_discoveries: 1,
            pending_count: 1,
            confirmed_count: 0,
            merged_count: 0,
            rejected_count: 0,
            avg_confidence_score: 0.9,
            source_type_distribution: { article_author: 1 },
          },
        ],
        error: null,
      });

      const result = await service.listDiscoveries('org-123', {
        status: 'pending',
        minConfidenceScore: 0.8,
        limit: 20,
        offset: 0,
      });

      expect(result.discoveries).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe('Author Extraction', () => {
    it('should extract author from article byline', async () => {
      const profilesChain = createChainableMock({ data: [], error: null });
      mockSupabase.from.mockReturnValue(profilesChain);

      const result = await service.extractAuthorsFromArticle('org-123', {
        articleTitle: 'Breaking Tech News',
        articleContent: 'By John Smith\n\nThis is the article content...',
        articleUrl: 'https://example.com/article',
        outlet: 'TechCrunch',
      });

      expect(result.authors).toHaveLength(1);
      expect(result.authors[0].fullName).toBe('John Smith');
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.extractionMethod).toBe('byline_pattern_match');
    });

    it('should return empty authors when no byline found', async () => {
      const profilesChain = createChainableMock({ data: [], error: null });
      mockSupabase.from.mockReturnValue(profilesChain);

      const result = await service.extractAuthorsFromArticle('org-123', {
        articleTitle: 'Article Without Byline',
        articleContent: 'Just content without author attribution',
        articleUrl: 'https://example.com/article',
      });

      expect(result.authors).toHaveLength(0);
      expect(result.confidence).toBe(0);
      expect(result.extractionMethod).toBe('no_author_found');
    });

    it('should infer email from outlet domain', async () => {
      const profilesChain = createChainableMock({ data: [], error: null });
      mockSupabase.from.mockReturnValue(profilesChain);

      const result = await service.extractAuthorsFromArticle('org-123', {
        articleTitle: 'Tech News',
        articleContent: 'By Sarah Johnson\n\nArticle content',
        articleUrl: 'https://techcrunch.com/article',
        outlet: 'TechCrunch',
      });

      expect(result.authors[0].email).toBe('sarah.johnson@techcrunch.com');
    });
  });

  describe('Deduplication', () => {
    it('should detect duplicate by exact email match', async () => {
      const mockProfiles = [
        {
          id: 'profile-123',
          full_name: 'John Doe',
          primary_email: 'john@example.com',
          primary_outlet: 'TechCrunch',
        },
      ];

      const profilesChain = createChainableMock({ data: mockProfiles, error: null });
      mockSupabase.from.mockReturnValue(profilesChain);

      const result = await service.checkDuplication('org-123', {
        fullName: 'John Doe',
        email: 'john@example.com',
        outlet: 'TechCrunch',
        sourceType: 'article_author',
      });

      expect(result.isDuplicate).toBe(true);
      expect(result.similarityScore).toBeGreaterThan(0.9);
      expect(result.recommendation).toBe('merge');
    });

    it('should detect duplicate by name similarity', async () => {
      const mockProfiles = [
        {
          id: 'profile-123',
          full_name: 'Jane Reporter',
          primary_email: 'jane.reporter@wired.com',
          primary_outlet: 'Wired',
        },
      ];

      const profilesChain = createChainableMock({ data: mockProfiles, error: null });
      mockSupabase.from.mockReturnValue(profilesChain);

      const result = await service.checkDuplication('org-123', {
        fullName: 'Jane Reporter',
        email: 'jane.reporter@wired.com',
        outlet: 'Wired',
        sourceType: 'social_profile',
      });

      expect(result.isDuplicate).toBe(true);
      expect(result.similarityScore).toBeGreaterThan(0.9);
    });

    it('should recommend create_new for unique journalists', async () => {
      const profilesChain = createChainableMock({ data: [], error: null });
      mockSupabase.from.mockReturnValue(profilesChain);

      const result = await service.checkDuplication('org-123', {
        fullName: 'Unique Author',
        email: 'unique@example.com',
        sourceType: 'article_author',
      });

      expect(result.isDuplicate).toBe(false);
      expect(result.recommendation).toBe('create_new');
    });
  });

  describe('Discovery Resolution', () => {
    it('should resolve discovery as confirmed', async () => {
      const mockDiscovery = {
        id: 'discovery-123',
        org_id: 'org-123',
        full_name: 'Test Author',
        status: 'confirmed',
        resolved_by: 'user-123',
        resolved_at: new Date().toISOString(),
        email: 'test@example.com',
        outlet: null,
        confidence_score: 0.8,
        confidence_breakdown: {},
        source_type: 'article_author',
        social_links: {},
        beats: [],
        raw_payload: {},
        suggested_matches: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const getChain = createChainableMock({
        data: {
          id: 'discovery-123',
          org_id: 'org-123',
          full_name: 'Test Author',
          status: 'pending',
          email: 'test@example.com',
          confidence_score: 0.8,
          confidence_breakdown: {},
          source_type: 'article_author',
          social_links: {},
          beats: [],
          raw_payload: {},
          suggested_matches: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      const updateChain = createChainableMock({ data: mockDiscovery, error: null });

      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;
        return callCount === 1 ? getChain : updateChain;
      });

      const result = await service.resolveDiscovery(
        'discovery-123',
        'org-123',
        'user-123',
        { action: 'confirm' }
      );

      expect(result.status).toBe('confirmed');
      expect(result.resolvedBy).toBe('user-123');
    });

    it('should reject a discovery', async () => {
      const mockDiscovery = {
        id: 'discovery-123',
        org_id: 'org-123',
        full_name: 'Test Author',
        status: 'rejected',
        resolved_by: 'user-123',
        resolved_at: new Date().toISOString(),
        resolution_notes: 'Not a journalist',
        email: null,
        outlet: null,
        confidence_score: 0.3,
        confidence_breakdown: {},
        source_type: 'social_profile',
        social_links: {},
        beats: [],
        raw_payload: {},
        suggested_matches: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const getChain = createChainableMock({
        data: {
          id: 'discovery-123',
          org_id: 'org-123',
          full_name: 'Test Author',
          status: 'pending',
          email: null,
          confidence_score: 0.3,
          confidence_breakdown: {},
          source_type: 'social_profile',
          social_links: {},
          beats: [],
          raw_payload: {},
          suggested_matches: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      const updateChain = createChainableMock({ data: mockDiscovery, error: null });

      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;
        return callCount === 1 ? getChain : updateChain;
      });

      const result = await service.resolveDiscovery(
        'discovery-123',
        'org-123',
        'user-123',
        {
          action: 'reject',
          notes: 'Not a journalist',
        }
      );

      expect(result.status).toBe('rejected');
      expect(result.resolutionNotes).toBe('Not a journalist');
    });
  });

  describe('Statistics', () => {
    it('should return discovery statistics', async () => {
      const mockStats = {
        total_discoveries: 100,
        pending_count: 50,
        confirmed_count: 30,
        merged_count: 15,
        rejected_count: 5,
        avg_confidence_score: 0.75,
        source_type_distribution: {
          article_author: 60,
          rss_feed: 20,
          social_profile: 15,
          staff_directory: 5,
        },
      };

      mockSupabase.rpc.mockResolvedValue({ data: [mockStats], error: null });

      const result = await service.getDiscoveryStats('org-123');

      expect(result.totalDiscoveries).toBe(100);
      expect(result.pendingCount).toBe(50);
      expect(result.avgConfidenceScore).toBe(0.75);
      expect(result.sourceTypeDistribution.article_author).toBe(60);
    });

    it('should handle empty statistics gracefully', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: [], error: null });

      const result = await service.getDiscoveryStats('org-123');

      expect(result.totalDiscoveries).toBe(0);
      expect(result.pendingCount).toBe(0);
      expect(result.avgConfidenceScore).toBe(0);
    });
  });

  describe('Social Profile Ingestion', () => {
    it('should ingest social profile as discovery', async () => {
      const mockDiscovery = {
        id: 'discovery-123',
        org_id: 'org-123',
        full_name: '@techwriter',
        social_links: { twitter: 'https://twitter.com/techwriter' },
        bio: 'Tech journalist',
        confidence_score: 0.5,
        confidence_breakdown: {},
        source_type: 'social_profile',
        source_url: 'https://twitter.com/techwriter',
        raw_payload: { platform: 'twitter', handle: '@techwriter' },
        status: 'pending',
        email: null,
        outlet: null,
        beats: [],
        suggested_matches: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabase.rpc.mockResolvedValue({ data: [], error: null });

      const profilesChain = createChainableMock({ data: [], error: null });
      const insertChain = createChainableMock({ data: mockDiscovery, error: null });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'journalist_profiles') return profilesChain;
        if (table === 'discovered_journalists') return insertChain;
        return createChainableMock({ data: null, error: null });
      });

      const result = await service.ingestSocialProfile('org-123', {
        platform: 'twitter',
        handle: '@techwriter',
        profileUrl: 'https://twitter.com/techwriter',
        bio: 'Tech journalist',
      });

      expect(result.sourceType).toBe('social_profile');
      expect(result.socialLinks.twitter).toBe('https://twitter.com/techwriter');
    });
  });

  describe('Batch Processing', () => {
    it('should process multiple articles in batch', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: [], error: null });

      const profilesChain = createChainableMock({ data: [], error: null });
      const insertChain = createChainableMock({
        data: {
          id: 'discovery-123',
          org_id: 'org-123',
          full_name: 'Test',
          status: 'pending',
          email: null,
          confidence_score: 0.7,
          confidence_breakdown: {},
          source_type: 'article_author',
          social_links: {},
          beats: [],
          raw_payload: {},
          suggested_matches: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'journalist_profiles') return profilesChain;
        if (table === 'discovered_journalists') return insertChain;
        return createChainableMock({ data: null, error: null });
      });

      const articles = [
        {
          articleTitle: 'Article 1',
          articleContent: 'By Alice Writer\n\nContent...',
          articleUrl: 'https://example.com/1',
          outlet: 'TechCrunch',
        },
        {
          articleTitle: 'Article 2',
          articleContent: 'By Bob Reporter\n\nContent...',
          articleUrl: 'https://example.com/2',
          outlet: 'Wired',
        },
      ];

      const result = await service.processArticleBatch('org-123', articles);

      expect(result.created + result.merged + result.skipped).toBeGreaterThan(0);
      expect(result.errors).toHaveLength(0);
    });
  });
});
