/**
 * Content Quality Service Tests (Sprint S14)
 * Tests for content quality analysis, scoring, and semantic similarity
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContentQualityService } from '../src/services/contentQualityService';
import type { ContentItem } from '@pravado/types';

// Mock Supabase client
const createMockSupabase = () => {
  return {
    from: vi.fn(),
    rpc: vi.fn(),
  };
};

describe('ContentQualityService', () => {
  let service: ContentQualityService;
  let mockSupabase: ReturnType<typeof createMockSupabase>;

  beforeEach(() => {
    mockSupabase = createMockSupabase() as any;
    service = new ContentQualityService(mockSupabase as any);
  });

  // ========================================
  // Thin Content Detection
  // ========================================

  describe('detectThinContent', () => {
    it('should detect thin content (< 300 words)', () => {
      const thinText = 'This is a very short article. It has only a few words. Not enough for quality content.';
      const result = service.detectThinContent(thinText);
      expect(result).toBe(true);
    });

    it('should not flag content with >= 300 words', () => {
      const words = Array(300).fill('word').join(' ');
      const result = service.detectThinContent(words);
      expect(result).toBe(false);
    });

    it('should handle empty text', () => {
      const result = service.detectThinContent('');
      expect(result).toBe(true);
    });

    it('should handle text with only whitespace', () => {
      const result = service.detectThinContent('   \n\n   \t\t   ');
      expect(result).toBe(true);
    });

    it('should count words correctly (ignoring extra whitespace)', () => {
      const text = 'word1    word2\n\nword3\t\tword4';
      const result = service.detectThinContent(text);
      expect(result).toBe(true); // 4 words < 300
    });
  });

  // ========================================
  // Readability Scoring (Flesch-Kincaid)
  // ========================================

  describe('computeReadability', () => {
    it('should return 0 for empty text', () => {
      const score = service.computeReadability('');
      expect(score).toBe(0);
    });

    it('should return 0 for whitespace-only text', () => {
      const score = service.computeReadability('   \n\n   ');
      expect(score).toBe(0);
    });

    it('should compute readability for simple text (high score)', () => {
      const simpleText = 'The cat sat on the mat. It was a nice day. The sun was warm.';
      const score = service.computeReadability(simpleText);
      expect(score).toBeGreaterThan(60); // Simple text should be readable
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should compute readability for complex text (lower score)', () => {
      const complexText =
        'The implementation of sophisticated methodologies necessitates comprehensive evaluation procedures. ' +
        'Organizational restructuring paradigms facilitate multidimensional strategic initiatives. ' +
        'Interdepartmental synergistic collaboration frameworks optimize cross-functional deliverables.';
      const score = service.computeReadability(complexText);
      expect(score).toBeLessThan(60); // Complex text should be harder to read
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should clamp scores to 0-100 range', () => {
      // Test with extremely simple text (might exceed 100 before clamping)
      const verySimpleText = 'I go. You go. We go. He goes. She goes. They go.';
      const score = service.computeReadability(verySimpleText);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should handle single sentence', () => {
      const text = 'This is a single sentence with multiple words in it.';
      const score = service.computeReadability(text);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should handle text with multiple sentence terminators', () => {
      const text = 'First sentence! Second sentence? Third sentence.';
      const score = service.computeReadability(text);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  // ========================================
  // Keyword Alignment
  // ========================================

  describe('computeKeywordAlignment', () => {
    it('should return 50 (neutral) when no target keyword set', () => {
      const item: Partial<ContentItem> = {
        title: 'Test Article',
        body: 'Article content here',
        metadata: {},
      };
      const score = service.computeKeywordAlignment(item as ContentItem);
      expect(score).toBe(50);
    });

    it('should return 100 when keyword in both title and opening', () => {
      const item: Partial<ContentItem> = {
        title: 'Content Quality Best Practices',
        body: 'Content quality is essential for SEO success. This article discusses content quality metrics...',
        metadata: {
          targetKeyword: 'content quality',
        },
      };
      const score = service.computeKeywordAlignment(item as ContentItem);
      expect(score).toBe(100);
    });

    it('should return 50 when keyword only in title', () => {
      const item: Partial<ContentItem> = {
        title: 'Content Quality Guide',
        body: 'This article discusses best practices for SEO and writing. It covers various topics...',
        metadata: {
          targetKeyword: 'content quality',
        },
      };
      const score = service.computeKeywordAlignment(item as ContentItem);
      expect(score).toBe(50);
    });

    it('should return 50 when keyword only in first 200 words', () => {
      const item: Partial<ContentItem> = {
        title: 'SEO Best Practices',
        body: 'Content quality is crucial for online success. ' + 'Additional content here. '.repeat(50),
        metadata: {
          targetKeyword: 'content quality',
        },
      };
      const score = service.computeKeywordAlignment(item as ContentItem);
      expect(score).toBe(50);
    });

    it('should return 0 when keyword not found', () => {
      const item: Partial<ContentItem> = {
        title: 'SEO Best Practices',
        body: 'This article covers various topics. ' + 'More content. '.repeat(50),
        metadata: {
          targetKeyword: 'content quality',
        },
      };
      const score = service.computeKeywordAlignment(item as ContentItem);
      expect(score).toBe(0);
    });

    it('should be case-insensitive', () => {
      const item: Partial<ContentItem> = {
        title: 'CONTENT QUALITY GUIDE',
        body: 'CoNtEnT QuAlItY is important. Additional text here...',
        metadata: {
          targetKeyword: 'content quality',
        },
      };
      const score = service.computeKeywordAlignment(item as ContentItem);
      expect(score).toBe(100);
    });

    it('should only check first 200 words of body', () => {
      const firstPart = 'Some introduction text. '.repeat(75); // 225 words without keyword
      const secondPart = 'content quality is mentioned here. '.repeat(50); // After 200 words
      const item: Partial<ContentItem> = {
        title: 'SEO Guide',
        body: firstPart + secondPart,
        metadata: {
          targetKeyword: 'content quality',
        },
      };
      const score = service.computeKeywordAlignment(item as ContentItem);
      expect(score).toBe(0); // Keyword beyond first 200 words shouldn't count
    });

    it('should handle null body gracefully', () => {
      const item: Partial<ContentItem> = {
        title: 'Content Quality',
        body: null,
        metadata: {
          targetKeyword: 'content quality',
        },
      };
      const score = service.computeKeywordAlignment(item as ContentItem);
      expect(score).toBe(50); // Keyword in title only
    });
  });

  // ========================================
  // Topic Alignment (V1 Placeholder)
  // ========================================

  describe('computeTopicAlignment', () => {
    it('should return null when no primary topic assigned', async () => {
      const item: Partial<ContentItem> = {
        id: 'test-id',
        primaryTopicId: null,
        embeddings: [0.1, 0.2, 0.3],
      };
      const score = await service.computeTopicAlignment(item as ContentItem);
      expect(score).toBeNull();
    });

    it('should return null when no embeddings', async () => {
      const item: Partial<ContentItem> = {
        id: 'test-id',
        primaryTopicId: 'topic-id',
        embeddings: null,
      };
      const score = await service.computeTopicAlignment(item as ContentItem);
      expect(score).toBeNull();
    });

    it('should return null when topic not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null }),
          }),
        }),
      });

      const item: Partial<ContentItem> = {
        id: 'test-id',
        primaryTopicId: 'topic-id',
        embeddings: [0.1, 0.2, 0.3],
      };
      const score = await service.computeTopicAlignment(item as ContentItem);
      expect(score).toBeNull();
    });

    it('should return 85 (V1 placeholder) when topic exists', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'topic-id' } }),
          }),
        }),
      });

      const item: Partial<ContentItem> = {
        id: 'test-id',
        primaryTopicId: 'topic-id',
        embeddings: [0.1, 0.2, 0.3],
      };
      const score = await service.computeTopicAlignment(item as ContentItem);
      expect(score).toBe(85);
    });
  });

  // ========================================
  // Overall Score Calculation
  // ========================================

  describe('calculateOverallScore', () => {
    it('should calculate score with all metrics available', () => {
      // Use reflection to access private method for testing
      const calculateScore = (service as any).calculateOverallScore.bind(service);

      const score = calculateScore({
        readability: 80,
        topicAlignment: 85,
        keywordAlignment: 100,
        thinContent: false,
        duplicateFlag: false,
      });

      // Expected: 80*0.2 + 85*0.3 + 100*0.3 = 16 + 25.5 + 30 = 71.5 ≈ 72
      expect(score).toBeCloseTo(72, 0);
    });

    it('should redistribute topic weight when topic alignment is null', () => {
      const calculateScore = (service as any).calculateOverallScore.bind(service);

      const score = calculateScore({
        readability: 80,
        topicAlignment: null,
        keywordAlignment: 100,
        thinContent: false,
        duplicateFlag: false,
      });

      // Expected: 80*0.2 + 100*0.3 + 100*0.3 = 16 + 30 + 30 = 76
      expect(score).toBeCloseTo(76, 0);
    });

    it('should apply thin content penalty (-20)', () => {
      const calculateScore = (service as any).calculateOverallScore.bind(service);

      const score = calculateScore({
        readability: 80,
        topicAlignment: 85,
        keywordAlignment: 100,
        thinContent: true,
        duplicateFlag: false,
      });

      // Expected: 72 - 20 = 52
      expect(score).toBeCloseTo(52, 0);
    });

    it('should apply duplicate penalty (-30)', () => {
      const calculateScore = (service as any).calculateOverallScore.bind(service);

      const score = calculateScore({
        readability: 80,
        topicAlignment: 85,
        keywordAlignment: 100,
        thinContent: false,
        duplicateFlag: true,
      });

      // Expected: 72 - 30 = 42
      expect(score).toBeCloseTo(42, 0);
    });

    it('should apply both penalties', () => {
      const calculateScore = (service as any).calculateOverallScore.bind(service);

      const score = calculateScore({
        readability: 80,
        topicAlignment: 85,
        keywordAlignment: 100,
        thinContent: true,
        duplicateFlag: true,
      });

      // Expected: 72 - 20 - 30 = 22
      expect(score).toBeCloseTo(22, 0);
    });

    it('should clamp score to minimum 0', () => {
      const calculateScore = (service as any).calculateOverallScore.bind(service);

      const score = calculateScore({
        readability: 10,
        topicAlignment: 10,
        keywordAlignment: 10,
        thinContent: true,
        duplicateFlag: true,
      });

      // Expected: 10*0.2 + 10*0.3 + 10*0.3 = 8 - 20 - 30 = -42 → clamped to 0
      expect(score).toBe(0);
    });

    it('should calculate maximum achievable score (80)', () => {
      const calculateScore = (service as any).calculateOverallScore.bind(service);

      const score = calculateScore({
        readability: 100,
        topicAlignment: 100,
        keywordAlignment: 100,
        thinContent: false,
        duplicateFlag: false,
      });

      // Maximum: 100*0.2 + 100*0.3 + 100*0.3 = 80
      expect(score).toBe(80);
    });
  });

  // ========================================
  // Warnings Generation
  // ========================================

  describe('generateWarnings', () => {
    it('should generate thin content warning', () => {
      const generateWarnings = (service as any).generateWarnings.bind(service);

      const warnings = generateWarnings({
        readability: 80,
        topicAlignment: 85,
        keywordAlignment: 100,
        thinContent: true,
        duplicateFlag: false,
        wordCount: 245,
      });

      expect(warnings.thinContent).toContain('245 words');
    });

    it('should generate duplicate warning', () => {
      const generateWarnings = (service as any).generateWarnings.bind(service);

      const warnings = generateWarnings({
        readability: 80,
        topicAlignment: 85,
        keywordAlignment: 100,
        thinContent: false,
        duplicateFlag: true,
        wordCount: 850,
      });

      expect(warnings.duplicate).toBe('Similar content detected');
    });

    it('should generate readability warning when score < 40', () => {
      const generateWarnings = (service as any).generateWarnings.bind(service);

      const warnings = generateWarnings({
        readability: 35,
        topicAlignment: 85,
        keywordAlignment: 100,
        thinContent: false,
        duplicateFlag: false,
        wordCount: 850,
      });

      expect(warnings.readability).toBe('Low readability score');
    });

    it('should generate keyword warning when score < 50', () => {
      const generateWarnings = (service as any).generateWarnings.bind(service);

      const warnings = generateWarnings({
        readability: 80,
        topicAlignment: 85,
        keywordAlignment: 30,
        thinContent: false,
        duplicateFlag: false,
        wordCount: 850,
      });

      expect(warnings.keyword).toBe('Target keyword not prominently featured');
    });

    it('should generate topic warning when score < 60', () => {
      const generateWarnings = (service as any).generateWarnings.bind(service);

      const warnings = generateWarnings({
        readability: 80,
        topicAlignment: 50,
        keywordAlignment: 100,
        thinContent: false,
        duplicateFlag: false,
        wordCount: 850,
      });

      expect(warnings.topic).toBe('Weak alignment with primary topic');
    });

    it('should not generate topic warning when topicAlignment is null', () => {
      const generateWarnings = (service as any).generateWarnings.bind(service);

      const warnings = generateWarnings({
        readability: 80,
        topicAlignment: null,
        keywordAlignment: 100,
        thinContent: false,
        duplicateFlag: false,
        wordCount: 850,
      });

      expect(warnings.topic).toBeUndefined();
    });

    it('should generate no warnings for high-quality content', () => {
      const generateWarnings = (service as any).generateWarnings.bind(service);

      const warnings = generateWarnings({
        readability: 80,
        topicAlignment: 85,
        keywordAlignment: 100,
        thinContent: false,
        duplicateFlag: false,
        wordCount: 850,
      });

      expect(Object.keys(warnings)).toHaveLength(0);
    });
  });

  // ========================================
  // Suggested Improvements
  // ========================================

  describe('generateImprovements', () => {
    it('should suggest expanding thin content', () => {
      const generateImprovements = (service as any).generateImprovements.bind(service);

      const improvements = generateImprovements({
        readability: 80,
        topicAlignment: 85,
        keywordAlignment: 100,
        thinContent: true,
        duplicateFlag: false,
        wordCount: 245,
        similarItems: [],
      });

      expect(improvements).toContainEqual(expect.stringContaining('Expand content'));
      expect(improvements).toContainEqual(expect.stringContaining('800–1200 words'));
    });

    it('should suggest adding keyword to title or intro', () => {
      const generateImprovements = (service as any).generateImprovements.bind(service);

      const improvements = generateImprovements({
        readability: 80,
        topicAlignment: 85,
        keywordAlignment: 30,
        thinContent: false,
        duplicateFlag: false,
        wordCount: 850,
        similarItems: [],
      });

      expect(improvements).toContainEqual(expect.stringContaining('primary keyword'));
      expect(improvements).toContainEqual(expect.stringContaining('title or introduction'));
    });

    it('should suggest differentiation from similar content', () => {
      const generateImprovements = (service as any).generateImprovements.bind(service);

      const similarItems = [
        {
          id: 'similar-id',
          title: 'Similar Article Title',
          contentType: 'blog_post',
        } as ContentItem,
      ];

      const improvements = generateImprovements({
        readability: 80,
        topicAlignment: 85,
        keywordAlignment: 100,
        thinContent: false,
        duplicateFlag: true,
        wordCount: 850,
        similarItems,
      });

      expect(improvements).toContainEqual(expect.stringContaining('Similar Article Title'));
      expect(improvements).toContainEqual(expect.stringContaining('Differentiate'));
    });

    it('should suggest improving readability when score < 40', () => {
      const generateImprovements = (service as any).generateImprovements.bind(service);

      const improvements = generateImprovements({
        readability: 35,
        topicAlignment: 85,
        keywordAlignment: 100,
        thinContent: false,
        duplicateFlag: false,
        wordCount: 850,
        similarItems: [],
      });

      expect(improvements).toContainEqual(expect.stringContaining('Rewrite sentences'));
      expect(improvements).toContainEqual(expect.stringContaining('clarity and readability'));
    });

    it('should suggest strengthening topic alignment when score < 60', () => {
      const generateImprovements = (service as any).generateImprovements.bind(service);

      const improvements = generateImprovements({
        readability: 80,
        topicAlignment: 50,
        keywordAlignment: 100,
        thinContent: false,
        duplicateFlag: false,
        wordCount: 850,
        similarItems: [],
      });

      expect(improvements).toContainEqual(expect.stringContaining('Strengthen alignment'));
      expect(improvements).toContainEqual(expect.stringContaining('primary topic'));
    });

    it('should suggest breaking up very long content', () => {
      const generateImprovements = (service as any).generateImprovements.bind(service);

      const improvements = generateImprovements({
        readability: 80,
        topicAlignment: 85,
        keywordAlignment: 100,
        thinContent: false,
        duplicateFlag: false,
        wordCount: 3000, // > 1200*2
        similarItems: [],
      });

      expect(improvements).toContainEqual(expect.stringContaining('breaking this into multiple pieces'));
    });

    it('should return positive message for high-quality content', () => {
      const generateImprovements = (service as any).generateImprovements.bind(service);

      const improvements = generateImprovements({
        readability: 80,
        topicAlignment: 85,
        keywordAlignment: 100,
        thinContent: false,
        duplicateFlag: false,
        wordCount: 850,
        similarItems: [],
      });

      expect(improvements).toContainEqual(expect.stringContaining('Content quality is good'));
      expect(improvements).toHaveLength(1);
    });

    it('should provide multiple suggestions for low-quality content', () => {
      const generateImprovements = (service as any).generateImprovements.bind(service);

      const improvements = generateImprovements({
        readability: 35,
        topicAlignment: 50,
        keywordAlignment: 30,
        thinContent: true,
        duplicateFlag: true,
        wordCount: 245,
        similarItems: [{ title: 'Similar Article' } as ContentItem],
      });

      expect(improvements.length).toBeGreaterThan(3); // Multiple issues = multiple suggestions
    });
  });

  // ========================================
  // Semantic Similarity Detection
  // ========================================

  describe('detectSimilarContent', () => {
    it('should return empty array when no embeddings', async () => {
      const item: Partial<ContentItem> = {
        id: 'test-id',
        embeddings: null,
      };

      const similar = await service.detectSimilarContent('org-id', item as ContentItem);
      expect(similar).toEqual([]);
    });

    it('should return empty array when no similar items found', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: [], error: null });

      const item: Partial<ContentItem> = {
        id: 'test-id',
        embeddings: Array(1536).fill(0.1),
      };

      const similar = await service.detectSimilarContent('org-id', item as ContentItem);
      expect(similar).toEqual([]);
    });

    it('should call find_similar_content with correct parameters', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: [], error: null });

      const embeddings = Array(1536).fill(0.1);
      const item: Partial<ContentItem> = {
        id: 'test-id',
        embeddings,
      };

      await service.detectSimilarContent('org-id', item as ContentItem);

      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'find_similar_content',
        expect.objectContaining({
          p_org_id: 'org-id',
          p_content_item_id: 'test-id',
          p_embedding: embeddings,
          p_limit: 5,
        })
      );

      // Check threshold separately with floating point tolerance
      const callArgs = mockSupabase.rpc.mock.calls[0][1];
      expect(callArgs.p_threshold).toBeCloseTo(0.15, 10); // 1 - 0.85 (SIMILARITY_THRESHOLD)
    });

    it('should map returned similar items correctly', async () => {
      const mockSimilarData = [
        {
          id: 'similar-1',
          org_id: 'org-id',
          title: 'Similar Article 1',
          slug: 'similar-article-1',
          content_type: 'blog_post',
          status: 'published',
          body: 'Content here',
          url: 'https://example.com/similar-1',
          published_at: '2025-01-15T10:00:00Z',
          word_count: 850,
          reading_time_minutes: 4,
          performance_score: 75,
          primary_topic_id: 'topic-id',
          embeddings: Array(1536).fill(0.11),
          performance: {},
          metadata: {},
          created_at: '2025-01-10T08:00:00Z',
          updated_at: '2025-01-15T10:00:00Z',
          similarity: 0.92,
        },
      ];

      mockSupabase.rpc.mockResolvedValue({ data: mockSimilarData, error: null });

      const item: Partial<ContentItem> = {
        id: 'test-id',
        embeddings: Array(1536).fill(0.1),
      };

      const similar = await service.detectSimilarContent('org-id', item as ContentItem);

      expect(similar).toHaveLength(1);
      expect(similar[0].id).toBe('similar-1');
      expect(similar[0].title).toBe('Similar Article 1');
    });
  });

  // ========================================
  // Full Analysis Integration
  // ========================================

  describe('analyzeQuality', () => {
    it('should throw error when content item not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
            }),
          }),
        }),
      });

      await expect(service.analyzeQuality('org-id', 'content-id')).rejects.toThrow(
        'Content item not found'
      );
    });

    it('should perform complete analysis for valid content', async () => {
      const mockContent = {
        id: 'content-id',
        org_id: 'org-id',
        title: 'Content Quality Best Practices',
        slug: 'content-quality-best-practices',
        content_type: 'blog_post',
        status: 'published',
        body: 'Content quality is essential for SEO. '.repeat(100), // ~500 words
        url: 'https://example.com/content-quality',
        published_at: '2025-01-15T10:00:00Z',
        word_count: 500,
        reading_time_minutes: 3,
        performance_score: 75,
        primary_topic_id: 'topic-id',
        embeddings: Array(1536).fill(0.1),
        performance: {},
        metadata: { targetKeyword: 'content quality' },
        created_at: '2025-01-10T08:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
      };

      // Mock content fetch
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'content_items') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: mockContent, error: null }),
                }),
              }),
            }),
          };
        }
        if (table === 'content_topics') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: 'topic-id' }, error: null }),
              }),
            }),
          };
        }
        if (table === 'content_quality_scores') {
          return {
            upsert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'score-id',
                    org_id: 'org-id',
                    content_item_id: 'content-id',
                    score: 80,
                    readability: 65,
                    topic_alignment: 85,
                    keyword_alignment: 100,
                    thin_content: false,
                    duplicate_flag: false,
                    warnings: {},
                    created_at: '2025-01-16T12:00:00Z',
                    updated_at: '2025-01-16T12:00:00Z',
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      // Mock similar content search
      mockSupabase.rpc.mockResolvedValue({ data: [], error: null });

      const result = await service.analyzeQuality('org-id', 'content-id');

      expect(result).toBeDefined();
      expect(result.item).toBeDefined();
      expect(result.score).toBeDefined();
      expect(result.similarItems).toEqual([]);
      expect(result.suggestedImprovements).toBeDefined();

      expect(result.item.id).toBe('content-id');
      expect(result.score.score).toBeGreaterThan(0);
      expect(result.score.readability).toBeGreaterThan(0);
      expect(result.score.keywordAlignment).toBe(100); // Keyword in title
    });
  });
});
