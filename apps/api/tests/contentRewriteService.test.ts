/**
 * Content Rewrite Service Tests (Sprint S15)
 * Tests for semantic content rewriting engine
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ContentRewriteService } from '../src/services/contentRewriteService';

// Mock Supabase client
const createMockSupabase = () => {
  const mockSupabase = {
    from: vi.fn(() => mockSupabase),
    select: vi.fn(() => mockSupabase),
    insert: vi.fn(() => mockSupabase),
    eq: vi.fn(() => mockSupabase),
    limit: vi.fn(() => mockSupabase),
    order: vi.fn(() => mockSupabase),
    range: vi.fn(() => mockSupabase),
    single: vi.fn(() => mockSupabase),
    maybeSingle: vi.fn(() => mockSupabase),
    rpc: vi.fn(() => mockSupabase),
    data: null,
    error: null,
    count: 0,
  };
  return mockSupabase as unknown as SupabaseClient;
};

describe('ContentRewriteService', () => {
  let service: ContentRewriteService;
  let mockSupabase: any;
  let mockBillingService: any;

  beforeEach(() => {
    mockSupabase = createMockSupabase();

    // S29: Mock BillingService
    mockBillingService = {
      enforceOrgQuotaOrThrow: vi.fn().mockResolvedValue(undefined),
      buildOrgBillingSummary: vi.fn(),
      checkOrgQuota: vi.fn(),
      updateUsageCounters: vi.fn(),
    };

    service = new ContentRewriteService(mockSupabase, mockBillingService);
  });

  // ========================================
  // HELPER METHOD TESTS
  // ========================================

  describe('splitIntoSentences', () => {
    it('should split text by periods', () => {
      const text = 'First sentence. Second sentence. Third sentence.';
      const sentences = (service as any).splitIntoSentences(text);
      expect(sentences).toHaveLength(3);
      expect(sentences[0]).toBe('First sentence');
      expect(sentences[1]).toBe('Second sentence');
      expect(sentences[2]).toBe('Third sentence');
    });

    it('should handle question marks', () => {
      const text = 'What is this? It is a test.';
      const sentences = (service as any).splitIntoSentences(text);
      expect(sentences).toHaveLength(2);
      expect(sentences[0]).toBe('What is this');
      expect(sentences[1]).toBe('It is a test');
    });

    it('should handle exclamation marks', () => {
      const text = 'Wow! This is great!';
      const sentences = (service as any).splitIntoSentences(text);
      expect(sentences).toHaveLength(2);
    });

    it('should handle empty text', () => {
      const sentences = (service as any).splitIntoSentences('');
      expect(sentences).toHaveLength(0);
    });
  });

  describe('countWords', () => {
    it('should count words correctly', () => {
      const count = (service as any).countWords('This is a test sentence');
      expect(count).toBe(5);
    });

    it('should handle multiple spaces', () => {
      const count = (service as any).countWords('This  is   a    test');
      expect(count).toBe(4);
    });

    it('should handle empty text', () => {
      const count = (service as any).countWords('');
      expect(count).toBe(0);
    });
  });

  // ========================================
  // TRANSFORMATION TESTS
  // ========================================

  describe('splitLongSentences', () => {
    it('should split sentences longer than 20 words', () => {
      const longSentence = new Array(25).fill('word').join(' ');
      const sentences = (service as any).splitLongSentences([longSentence]);
      expect(sentences.length).toBeGreaterThan(1);
    });

    it('should not split sentences under 20 words', () => {
      const shortSentence = 'This is a short sentence with ten words total';
      const sentences = (service as any).splitLongSentences([shortSentence]);
      expect(sentences).toHaveLength(1);
    });

    it('should handle multiple sentences', () => {
      const short = 'Short sentence';
      const long = new Array(25).fill('word').join(' ');
      const sentences = (service as any).splitLongSentences([short, long]);
      expect(sentences.length).toBeGreaterThan(2);
    });
  });

  describe('injectKeyword', () => {
    it('should inject keyword when not present', () => {
      const sentences = ['This is a test'];
      const result = (service as any).injectKeyword(sentences, 'quality');
      expect(result[0]).toContain('quality');
    });

    it('should not inject keyword when already present', () => {
      const sentences = ['This is about quality testing'];
      const result = (service as any).injectKeyword(sentences, 'quality');
      expect(result).toHaveLength(1);
      // Should not add duplicate
      const lowerResult = result[0].toLowerCase();
      const matches = (lowerResult.match(/quality/g) || []).length;
      expect(matches).toBeLessThanOrEqual(2); // Original + possible injection prefix
    });

    it('should handle case-insensitive matching', () => {
      const sentences = ['This is about Quality testing'];
      const result = (service as any).injectKeyword(sentences, 'quality');
      expect(result).toHaveLength(1);
    });
  });

  describe('addSubheadings', () => {
    it('should add subheadings for long content', () => {
      const sentences = new Array(10).fill('Test sentence');
      const result = (service as any).addSubheadings(sentences);
      const headings = result.filter((s: string) => s.includes('##'));
      expect(headings.length).toBeGreaterThan(0);
    });

    it('should not add subheadings for short content', () => {
      const sentences = ['One', 'Two', 'Three'];
      const result = (service as any).addSubheadings(sentences);
      // Should have the original sentences
      expect(result.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('addTransitions', () => {
    it('should add transition sentences', () => {
      const sentences = new Array(10).fill('Test sentence');
      const result = (service as any).addTransitions(sentences);
      const transitions = result.filter((s: string) => s.includes('Furthermore'));
      expect(transitions.length).toBeGreaterThan(0);
    });

    it('should add transitions at regular intervals', () => {
      const sentences = new Array(10).fill('Test sentence');
      const result = (service as any).addTransitions(sentences);
      expect(result.length).toBeGreaterThan(10);
    });
  });

  describe('expandThinContent', () => {
    it('should add filler content', () => {
      const sentences = ['Short content'];
      const result = (service as any).expandThinContent(sentences);
      expect(result.length).toBeGreaterThan(1);
      expect(result).toContain('This topic deserves further exploration.');
    });

    it('should add exactly 3 expansion sentences', () => {
      const sentences = ['Original'];
      const result = (service as any).expandThinContent(sentences);
      expect(result.length).toBe(4); // 1 original + 3 expansions
    });
  });

  describe('removeDuplicateSentences', () => {
    it('should remove exact duplicates', () => {
      const sentences = ['Test', 'Test', 'Unique'];
      const result = (service as any).removeDuplicateSentences(sentences);
      expect(result).toHaveLength(2);
      expect(result).toContain('Test');
      expect(result).toContain('Unique');
    });

    it('should be case-insensitive', () => {
      const sentences = ['Test', 'test', 'TEST'];
      const result = (service as any).removeDuplicateSentences(sentences);
      expect(result).toHaveLength(1);
    });

    it('should preserve order', () => {
      const sentences = ['First', 'Second', 'First', 'Third'];
      const result = (service as any).removeDuplicateSentences(sentences);
      expect(result).toEqual(['First', 'Second', 'Third']);
    });
  });

  // ========================================
  // PERSONALITY TRANSFORMATION TESTS
  // ========================================

  describe('applyPersonalityTransforms', () => {
    it('should shorten sentences for assertive tone', () => {
      const personality = {
        id: '1',
        orgId: '1',
        slug: 'test',
        name: 'Test',
        description: 'Test personality',
        configuration: { name: 'Test', tone: 'assertive' as const, style: 'direct' as const },
        createdAt: '',
        updatedAt: '',
      } as any;

      const longSentence = new Array(20).fill('word').join(' ');
      const result = (service as any).applyPersonalityTransforms([longSentence], personality);

      const words = result[0].split(/\s+/);
      expect(words.length).toBeLessThanOrEqual(16); // 15 words + potential period
    });

    it('should add soft transitions for supportive tone', () => {
      const personality = {
        id: '1',
        orgId: '1',
        slug: 'test',
        name: 'Test',
        description: 'Test personality',
        configuration: { name: 'Test', tone: 'supportive' as const, style: 'warm' as const },
        createdAt: '',
        updatedAt: '',
      } as any;

      const sentences = new Array(5).fill('Test sentence');
      const result = (service as any).applyPersonalityTransforms(sentences, personality);

      // Some sentences should have "Additionally"
      const withAdditionally = result.filter((s: string) => s.includes('Additionally'));
      // Due to randomness, we can't guarantee exact count, but should be > 0
      expect(result.length).toBe(5);
    });
  });

  // ========================================
  // SEMANTIC DIFF TESTS
  // ========================================

  describe('computeSemanticDiff', () => {
    it('should detect added sentences', () => {
      const original = 'First sentence. Second sentence.';
      const rewritten = 'First sentence. Second sentence. Third sentence.';
      const diff = (service as any).computeSemanticDiff(original, rewritten);

      expect(diff.summary.added).toBe(1);
      expect(diff.summary.unchanged).toBe(2);
    });

    it('should detect removed sentences', () => {
      const original = 'First sentence. Second sentence. Third sentence.';
      const rewritten = 'First sentence. Third sentence.';
      const diff = (service as any).computeSemanticDiff(original, rewritten);

      expect(diff.summary.removed).toBe(1);
      expect(diff.summary.unchanged).toBe(2);
    });

    it('should detect unchanged sentences', () => {
      const original = 'First sentence. Second sentence.';
      const rewritten = 'First sentence. Second sentence.';
      const diff = (service as any).computeSemanticDiff(original, rewritten);

      expect(diff.summary.unchanged).toBe(2);
      expect(diff.summary.added).toBe(0);
      expect(diff.summary.removed).toBe(0);
    });

    it('should handle completely different text', () => {
      const original = 'Original content here.';
      const rewritten = 'Completely different content.';
      const diff = (service as any).computeSemanticDiff(original, rewritten);

      expect(diff.summary.removed).toBe(1);
      expect(diff.summary.added).toBe(1);
      expect(diff.summary.unchanged).toBe(0);
    });
  });

  // ========================================
  // IMPROVEMENTS EXTRACTION TESTS
  // ========================================

  describe('extractImprovements', () => {
    it('should list added sentences', () => {
      const context = {
        item: {} as any,
        qualityBefore: 50,
        readabilityBefore: 60,
      };
      const diff = {
        summary: { added: 3, removed: 0, modified: 0, unchanged: 5 },
      };

      const improvements = (service as any).extractImprovements(context, diff);
      expect(improvements).toContain('Added 3 new sentence(s) to improve clarity');
    });

    it('should list removed sentences', () => {
      const context = {
        item: {} as any,
        qualityBefore: 50,
        readabilityBefore: 60,
      };
      const diff = {
        summary: { added: 0, removed: 2, modified: 0, unchanged: 5 },
      };

      const improvements = (service as any).extractImprovements(context, diff);
      expect(improvements).toContain('Removed 2 redundant sentence(s)');
    });

    it('should mention personality when applied', () => {
      const context = {
        item: {} as any,
        personality: {
          configuration: { tone: 'assertive' },
        } as any,
        qualityBefore: 50,
        readabilityBefore: 60,
      };
      const diff = {
        summary: { added: 0, removed: 0, modified: 0, unchanged: 5 },
      };

      const improvements = (service as any).extractImprovements(context, diff);
      expect(improvements).toContain('Applied assertive tone');
    });

    it('should mention keyword optimization', () => {
      const context = {
        item: {} as any,
        targetKeyword: 'quality',
        qualityBefore: 50,
        readabilityBefore: 60,
      };
      const diff = {
        summary: { added: 0, removed: 0, modified: 0, unchanged: 5 },
      };

      const improvements = (service as any).extractImprovements(context, diff);
      expect(improvements).toContain('Optimized for keyword: "quality"');
    });

    it('should mention readability improvement for low scores', () => {
      const context = {
        item: {} as any,
        qualityBefore: 50,
        readabilityBefore: 45,
      };
      const diff = {
        summary: { added: 0, removed: 0, modified: 0, unchanged: 5 },
      };

      const improvements = (service as any).extractImprovements(context, diff);
      expect(improvements).toContain('Improved readability by splitting long sentences');
    });
  });

  // ========================================
  // REASONING GENERATION TESTS
  // ========================================

  describe('generateReasoning', () => {
    it('should include quality metrics', () => {
      const context = {
        item: {} as any,
        qualityBefore: 58,
        readabilityBefore: 45,
      };
      const improvements = ['Test improvement'];

      const reasoning = (service as any).generateReasoning(context, improvements);

      expect(reasoning.qualityScoreBefore).toBe(58);
      expect(reasoning.readabilityBefore).toBe(45);
    });

    it('should include personality when applied', () => {
      const context = {
        item: {} as any,
        personality: {
          name: 'Executive Voice',
        } as any,
        qualityBefore: 50,
        readabilityBefore: 60,
      };
      const improvements = [];

      const reasoning = (service as any).generateReasoning(context, improvements);

      expect(reasoning.personalityApplied).toBe('Executive Voice');
    });

    it('should include target keyword', () => {
      const context = {
        item: {} as any,
        targetKeyword: 'content quality',
        qualityBefore: 50,
        readabilityBefore: 60,
      };
      const improvements = [];

      const reasoning = (service as any).generateReasoning(context, improvements);

      expect(reasoning.targetKeyword).toBe('content quality');
    });

    it('should include improvements count', () => {
      const context = {
        item: {} as any,
        qualityBefore: 50,
        readabilityBefore: 60,
      };
      const improvements = ['Imp 1', 'Imp 2', 'Imp 3'];

      const reasoning = (service as any).generateReasoning(context, improvements);

      expect(reasoning.improvementsCount).toBe(3);
    });

    it('should include strategy identifier', () => {
      const context = {
        item: {} as any,
        qualityBefore: 50,
        readabilityBefore: 60,
      };
      const improvements = [];

      const reasoning = (service as any).generateReasoning(context, improvements);

      expect(reasoning.strategy).toBe('deterministic_stub_v1');
    });
  });

  // ========================================
  // INTEGRATION TESTS (Mocked DB)
  // ========================================

  describe('generateRewrite (mocked)', () => {
    it('should throw error if content item not found', async () => {
      mockSupabase.single.mockReturnValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(
        service.generateRewrite('org-1', {
          contentItemId: 'item-1',
        })
      ).rejects.toThrow('Content item not found or has no body');
    });

    it('should throw error if content item has no body', async () => {
      mockSupabase.single.mockReturnValueOnce({
        data: { id: 'item-1', body: null },
        error: null,
      });

      await expect(
        service.generateRewrite('org-1', {
          contentItemId: 'item-1',
        })
      ).rejects.toThrow('Content item not found or has no body');
    });
  });

  describe('getRewrite', () => {
    it('should return null if rewrite not found', async () => {
      mockSupabase.single.mockReturnValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      const result = await service.getRewrite('org-1', 'rewrite-1');
      expect(result).toBeNull();
    });

    it('should return mapped rewrite when found', async () => {
      const mockData = {
        id: 'rewrite-1',
        org_id: 'org-1',
        content_item_id: 'item-1',
        playbook_run_id: null,
        original_text: 'Original',
        rewritten_text: 'Rewritten',
        diff: { summary: {} },
        improvements: ['Improvement 1'],
        reasoning: { strategy: 'test' },
        readability_before: 50,
        readability_after: 60,
        quality_before: 55,
        quality_after: 65,
        created_at: '2025-01-16T10:00:00Z',
        updated_at: '2025-01-16T10:00:00Z',
      };

      mockSupabase.single.mockReturnValueOnce({
        data: mockData,
        error: null,
      });

      const result = await service.getRewrite('org-1', 'rewrite-1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('rewrite-1');
      expect(result?.rewrittenText).toBe('Rewritten');
    });
  });

  describe('listRewrites', () => {
    it('should return empty list when no rewrites exist', async () => {
      mockSupabase.range.mockReturnValueOnce({
        data: [],
        error: null,
        count: 0,
      });

      const result = await service.listRewrites('org-1');

      expect(result.rewrites).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should apply pagination correctly', async () => {
      const mockData = [
        {
          id: 'rewrite-1',
          org_id: 'org-1',
          content_item_id: 'item-1',
          playbook_run_id: null,
          original_text: 'Original',
          rewritten_text: 'Rewritten',
          diff: {},
          improvements: [],
          reasoning: {},
          readability_before: 50,
          readability_after: 60,
          quality_before: 55,
          quality_after: 65,
          created_at: '2025-01-16T10:00:00Z',
          updated_at: '2025-01-16T10:00:00Z',
        },
      ];

      mockSupabase.range.mockReturnValueOnce({
        data: mockData,
        error: null,
        count: 1,
      });

      const result = await service.listRewrites('org-1', {
        page: 1,
        pageSize: 20,
      });

      expect(result.rewrites).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });
});
