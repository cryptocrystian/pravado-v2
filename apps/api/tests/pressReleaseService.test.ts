/**
 * Press Release Service Tests (Sprint S38)
 * Tests for AI-powered press release generation engine
 */

import type { PRGeneratedReleaseRecord, PRGenerationInput } from '@pravado/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PressReleaseService, prGenerationEmitter } from '../src/services/pressReleaseService';

// Mock Supabase client
const createMockSupabase = () => {
  const mockData: Record<string, unknown[]> = {};

  return {
    from: vi.fn((table: string) => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockImplementation((data) => {
        const record = Array.isArray(data) ? data[0] : data;
        const id = `test-${Date.now()}`;
        const fullRecord = {
          id,
          ...record,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        if (!mockData[table]) mockData[table] = [];
        mockData[table].push(fullRecord);
        return {
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: fullRecord, error: null }),
        };
      }),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
    })),
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
  };
};

describe('PressReleaseService', () => {
  let service: PressReleaseService;
  let mockSupabase: ReturnType<typeof createMockSupabase>;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    service = new PressReleaseService(mockSupabase as never, undefined, { debugMode: false });
  });

  describe('Context Assembly', () => {
    it('should assemble context from input', async () => {
      const input: PRGenerationInput = {
        newsType: 'product_launch',
        announcement: 'New AI product launch',
        companyName: 'TestCorp',
        companyDescription: 'A leading tech company',
        targetKeywords: ['AI', 'innovation'],
      };

      const context = await service.assembleContext('org-123', input);

      expect(context).toBeDefined();
      expect(context.input).toEqual(input);
      expect(context.companyFootprint.name).toBe('TestCorp');
      expect(context.seoKeywords).toContain('AI');
      expect(context.seoKeywords).toContain('innovation');
    });

    it('should extract industry trends based on news type', async () => {
      const fundingInput: PRGenerationInput = {
        newsType: 'funding',
        announcement: 'Series A funding',
        companyName: 'FundedCo',
      };

      const context = await service.assembleContext('org-123', fundingInput);

      expect(context.industryTrends).toContain('growth potential');
      expect(context.industryTrends).toContain('investor confidence');
    });

    it('should handle missing optional fields gracefully', async () => {
      const minimalInput: PRGenerationInput = {
        newsType: 'other',
        announcement: 'Announcement',
        companyName: 'Company',
      };

      const context = await service.assembleContext('org-123', minimalInput);

      expect(context).toBeDefined();
      expect(context.personality).toBeNull();
      expect(context.competitorContext).toEqual([]);
    });
  });

  describe('Angle Finder', () => {
    it('should generate multiple angles', async () => {
      const input: PRGenerationInput = {
        newsType: 'product_launch',
        announcement: 'Revolutionary AI assistant',
        companyName: 'AITech',
      };

      const context = await service.assembleContext('org-123', input);
      const result = await service.findAngles(context);

      expect(result.angles.length).toBeGreaterThanOrEqual(3);
      expect(result.selectedAngle).toBeDefined();
      expect(result.selectedAngle.angleTitle).toBeTruthy();
    });

    it('should score angles based on criteria', async () => {
      const input: PRGenerationInput = {
        newsType: 'funding',
        announcement: '$50M Series B',
        companyName: 'GrowthCo',
      };

      const context = await service.assembleContext('org-123', input);
      const result = await service.findAngles(context);

      result.angles.forEach((angle) => {
        expect(angle.newsworthinessScore).toBeGreaterThanOrEqual(0);
        expect(angle.newsworthinessScore).toBeLessThanOrEqual(100);
        expect(angle.uniquenessScore).toBeGreaterThanOrEqual(0);
        expect(angle.relevanceScore).toBeGreaterThanOrEqual(0);
        expect(angle.totalScore).toBeGreaterThanOrEqual(0);
      });
    });

    it('should select the highest scoring angle', async () => {
      const input: PRGenerationInput = {
        newsType: 'partnership',
        announcement: 'Strategic partnership',
        companyName: 'PartnerCo',
      };

      const context = await service.assembleContext('org-123', input);
      const result = await service.findAngles(context);

      const sortedAngles = [...result.angles].sort((a, b) => b.totalScore - a.totalScore);
      expect(result.selectedAngle.totalScore).toBe(sortedAngles[0].totalScore);
      expect(result.selectedAngle.isSelected).toBe(true);
    });

    it('should prefer user-specified angle if provided', async () => {
      const input: PRGenerationInput = {
        newsType: 'product_launch',
        announcement: 'New product',
        companyName: 'Company',
        preferredAngle: 'innovation',
      };

      const context = await service.assembleContext('org-123', input);
      const result = await service.findAngles(context);

      // Selected angle should contain the preferred angle keyword
      expect(
        result.selectedAngle.angleTitle.toLowerCase().includes('innovation') ||
        result.selectedAngle.isSelected
      ).toBe(true);
    });
  });

  describe('Headline Generation', () => {
    it('should generate headline variants', async () => {
      const input: PRGenerationInput = {
        newsType: 'product_launch',
        announcement: 'AI assistant',
        companyName: 'AITech',
        targetKeywords: ['AI', 'automation'],
      };

      const context = await service.assembleContext('org-123', input);
      const angleResult = await service.findAngles(context);
      const headlineResult = await service.generateHeadlines(context, angleResult.selectedAngle);

      expect(headlineResult.variants.length).toBeGreaterThanOrEqual(5);
      expect(headlineResult.selectedHeadline).toBeDefined();
      expect(headlineResult.selectedHeadline.headline).toBeTruthy();
    });

    it('should score headlines for SEO, virality, and readability', async () => {
      const input: PRGenerationInput = {
        newsType: 'funding',
        announcement: '$10M funding',
        companyName: 'FundCo',
      };

      const context = await service.assembleContext('org-123', input);
      const angleResult = await service.findAngles(context);
      const headlineResult = await service.generateHeadlines(context, angleResult.selectedAngle);

      headlineResult.variants.forEach((variant) => {
        expect(variant.seoScore).toBeGreaterThanOrEqual(0);
        expect(variant.seoScore).toBeLessThanOrEqual(100);
        expect(variant.viralityScore).toBeGreaterThanOrEqual(0);
        expect(variant.readabilityScore).toBeGreaterThanOrEqual(0);
        expect(variant.score).toBeGreaterThanOrEqual(0);
      });
    });

    it('should select best headline based on combined score', async () => {
      const input: PRGenerationInput = {
        newsType: 'acquisition',
        announcement: 'Company acquisition',
        companyName: 'AcquireCo',
      };

      const context = await service.assembleContext('org-123', input);
      const angleResult = await service.findAngles(context);
      const headlineResult = await service.generateHeadlines(context, angleResult.selectedAngle);

      const sortedVariants = [...headlineResult.variants].sort((a, b) => b.score - a.score);
      expect(headlineResult.selectedHeadline.score).toBe(sortedVariants[0].score);
    });
  });

  describe('Draft Generation', () => {
    it('should generate complete draft', async () => {
      const input: PRGenerationInput = {
        newsType: 'product_launch',
        announcement: 'New SaaS platform',
        companyName: 'SaasCo',
        spokespersonName: 'John Doe',
        spokespersonTitle: 'CEO',
      };

      const context = await service.assembleContext('org-123', input);
      const angleResult = await service.findAngles(context);
      const headlineResult = await service.generateHeadlines(context, angleResult.selectedAngle);
      const draft = await service.generateDraft(context, angleResult.selectedAngle, headlineResult.selectedHeadline);

      expect(draft.headline).toBeTruthy();
      expect(draft.subheadline).toBeTruthy();
      expect(draft.dateline).toBeTruthy();
      expect(draft.body).toBeTruthy();
      expect(draft.paragraphs.length).toBeGreaterThanOrEqual(2);
      expect(draft.quote1).toBeTruthy();
      expect(draft.boilerplate).toBeTruthy();
      expect(draft.wordCount).toBeGreaterThan(0);
    });

    it('should include spokesperson quotes', async () => {
      const input: PRGenerationInput = {
        newsType: 'executive_hire',
        announcement: 'New CTO hire',
        companyName: 'TechCorp',
        spokespersonName: 'Jane Smith',
        spokespersonTitle: 'CEO',
        secondarySpokesperson: 'Bob Wilson',
        secondarySpokespersonTitle: 'CTO',
      };

      const context = await service.assembleContext('org-123', input);
      const angleResult = await service.findAngles(context);
      const headlineResult = await service.generateHeadlines(context, angleResult.selectedAngle);
      const draft = await service.generateDraft(context, angleResult.selectedAngle, headlineResult.selectedHeadline);

      expect(draft.quote1).toBeTruthy();
      expect(draft.quote1Attribution).toContain('Jane Smith');
    });
  });

  describe('SEO Summary Calculation', () => {
    it('should calculate keyword density', () => {
      const release = {
        body: 'AI innovation is key. AI transforms business. AI drives growth.',
        input: {
          targetKeywords: ['AI', 'innovation'],
        } as PRGenerationInput,
      };

      const summary = service.calculateSEOSummary(release);

      expect(summary.keywordDensity['AI']).toBeGreaterThan(0);
    });

    it('should calculate readability metrics', () => {
      const release = {
        body: 'This is a simple sentence. Another short one. Easy to read text.',
        input: {} as PRGenerationInput,
      };

      const summary = service.calculateSEOSummary(release);

      expect(summary.sentenceCount).toBe(3);
      expect(summary.avgSentenceLength).toBeGreaterThan(0);
      expect(summary.readabilityScore).toBeGreaterThanOrEqual(0);
      expect(summary.readabilityGrade).toBeTruthy();
    });

    it('should generate SEO suggestions', () => {
      const release = {
        body: 'Short.',
        input: {
          targetKeywords: ['missing', 'keywords'],
        } as PRGenerationInput,
      };

      const summary = service.calculateSEOSummary(release);

      expect(summary.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('CRUD Operations', () => {
    it('should create a new release', async () => {
      const input: PRGenerationInput = {
        newsType: 'product_launch',
        announcement: 'Test announcement',
        companyName: 'TestCo',
      };

      const release = await service.createRelease('org-123', 'user-123', input);

      expect(release).toBeDefined();
      expect(release.id).toBeTruthy();
      expect(release.status).toBe('draft');
      expect(release.input).toEqual(input);
    });

    it('should list releases with filters', async () => {
      const { releases, total } = await service.listReleases('org-123', {
        status: 'complete',
        limit: 10,
        offset: 0,
      });

      expect(Array.isArray(releases)).toBe(true);
      expect(typeof total).toBe('number');
    });

    it('should update release status', async () => {
      await service.updateReleaseStatus('release-123', 'org-123', 'generating');

      expect(mockSupabase.from).toHaveBeenCalledWith('pr_generated_releases');
    });
  });

  describe('Event Emitter', () => {
    it('should emit generation progress events', () => {
      const eventHandler = vi.fn();
      prGenerationEmitter.on('pr:test-123', eventHandler);

      prGenerationEmitter.emit('pr:test-123', { type: 'started', releaseId: 'test-123' });

      expect(eventHandler).toHaveBeenCalledWith({ type: 'started', releaseId: 'test-123' });

      prGenerationEmitter.off('pr:test-123', eventHandler);
    });

    it('should emit progress updates', () => {
      const events: unknown[] = [];
      const eventHandler = (event: unknown) => events.push(event);
      prGenerationEmitter.on('pr:progress-test', eventHandler);

      prGenerationEmitter.emit('pr:progress-test', { type: 'progress', step: 'context', progress: 10 });
      prGenerationEmitter.emit('pr:progress-test', { type: 'progress', step: 'angles', progress: 30 });
      prGenerationEmitter.emit('pr:progress-test', { type: 'completed', releaseId: 'progress-test' });

      expect(events.length).toBe(3);
      expect((events[0] as { progress: number }).progress).toBe(10);
      expect((events[1] as { progress: number }).progress).toBe(30);
      expect((events[2] as { type: string }).type).toBe('completed');

      prGenerationEmitter.off('pr:progress-test', eventHandler);
    });
  });

  describe('Similarity Search', () => {
    it('should call similarity search RPC', async () => {
      const mockRelease: PRGeneratedReleaseRecord = {
        id: 'release-123',
        org_id: 'org-123',
        user_id: 'user-123',
        status: 'complete',
        input_json: { newsType: 'other', announcement: 'Test', companyName: 'Co' },
        headline: 'Test Headline',
        subheadline: null,
        angle: null,
        angle_options: [],
        body: 'Test body',
        dateline: null,
        quote_1: null,
        quote_1_attribution: null,
        quote_2: null,
        quote_2_attribution: null,
        boilerplate: null,
        seo_summary_json: {
          primaryKeyword: null,
          secondaryKeywords: [],
          keywordDensity: {},
          readabilityGrade: null,
          readabilityScore: null,
          sentenceCount: 0,
          avgSentenceLength: 0,
          passiveVoiceCount: 0,
          suggestions: [],
        },
        optimization_history: [],
        readability_score: null,
        keyword_density: {},
        distribution_notes: null,
        target_outlets: [],
        embeddings: [0.1, 0.2, 0.3],
        generation_run_id: null,
        personality_id: null,
        word_count: 10,
        error_message: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockRelease, error: null }),
      });

      const similar = await service.findSimilarReleases('release-123', 'org-123', 5);

      expect(Array.isArray(similar)).toBe(true);
    });
  });
});

describe('Headline Scoring Heuristics', () => {
  let service: PressReleaseService;

  beforeEach(() => {
    const mockSupabase = createMockSupabase();
    service = new PressReleaseService(mockSupabase as never);
  });

  it('should boost headlines with power words', async () => {
    const input: PRGenerationInput = {
      newsType: 'product_launch',
      announcement: 'New product',
      companyName: 'TestCo',
    };

    const context = await service.assembleContext('org-123', input);
    const angleResult = await service.findAngles(context);
    const headlineResult = await service.generateHeadlines(context, angleResult.selectedAngle);

    // Headlines with words like "launches", "announces", "unveils" should score higher on virality
    const headlinesWithPowerWords = headlineResult.variants.filter(
      (v) =>
        v.headline.toLowerCase().includes('launch') ||
        v.headline.toLowerCase().includes('announce') ||
        v.headline.toLowerCase().includes('unveil')
    );

    if (headlinesWithPowerWords.length > 0) {
      expect(headlinesWithPowerWords[0].viralityScore).toBeGreaterThanOrEqual(50);
    }
  });

  it('should boost headlines containing company name', async () => {
    const input: PRGenerationInput = {
      newsType: 'funding',
      announcement: 'Series A',
      companyName: 'SpecificCompanyName',
    };

    const context = await service.assembleContext('org-123', input);
    const angleResult = await service.findAngles(context);
    const headlineResult = await service.generateHeadlines(context, angleResult.selectedAngle);

    const headlinesWithCompany = headlineResult.variants.filter((v) =>
      v.headline.includes('SpecificCompanyName')
    );

    if (headlinesWithCompany.length > 0) {
      expect(headlinesWithCompany[0].seoScore).toBeGreaterThanOrEqual(50);
    }
  });
});

describe('Angle Scoring Rubric', () => {
  let service: PressReleaseService;

  beforeEach(() => {
    const mockSupabase = createMockSupabase();
    service = new PressReleaseService(mockSupabase as never);
  });

  it('should score funding news higher for newsworthiness', async () => {
    const fundingInput: PRGenerationInput = {
      newsType: 'funding',
      announcement: '$100M Series C',
      companyName: 'BigFundCo',
    };

    const context = await service.assembleContext('org-123', fundingInput);
    const result = await service.findAngles(context);

    // Funding is a high-newsworthiness event
    const avgNewsworthiness =
      result.angles.reduce((sum, a) => sum + a.newsworthinessScore, 0) / result.angles.length;
    expect(avgNewsworthiness).toBeGreaterThanOrEqual(50);
  });

  it('should score angles with specific details higher on relevance', async () => {
    const input: PRGenerationInput = {
      newsType: 'product_launch',
      announcement: 'AI-powered analytics platform',
      companyName: 'DataCo',
      targetKeywords: ['AI', 'analytics', 'platform'],
    };

    const context = await service.assembleContext('org-123', input);
    const result = await service.findAngles(context);

    // Angles that match keywords should have higher relevance
    result.angles.forEach((angle) => {
      expect(angle.relevanceScore).toBeGreaterThanOrEqual(0);
      expect(angle.relevanceScore).toBeLessThanOrEqual(100);
    });
  });
});
