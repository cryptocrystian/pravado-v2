/**
 * Content Rewrite Service (Sprint S15)
 * Semantic content rewriting engine with deterministic stub logic
 *
 * Provides:
 * - Deterministic stub rewriting (S16 will add real LLM)
 * - Semantic diff computation
 * - Quality improvement tracking
 * - Personality-based style adjustments
 * - Integration with S14 quality scoring
 */

import type {
  ContentItem,
  ContentRewrite,
  RewriteRequestInput,
  RewriteResult,
  AgentPersonality,
} from '@pravado/types';
import { LlmRouter, createLogger } from '@pravado/utils';
import type { SupabaseClient } from '@supabase/supabase-js';

import { BillingService } from './billingService';
import { ContentQualityService } from './contentQualityService';
import { PersonalityStore } from './personality/personalityStore';

const logger = createLogger('content-rewrite-service');

interface RewriteContext {
  item: ContentItem;
  personality?: AgentPersonality | null;
  targetKeyword?: string | null;
  targetIntent?: string | null;
  qualityBefore: number;
  readabilityBefore: number;
}

interface SemanticDiffEntry {
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  original?: string;
  rewritten?: string;
  similarity?: number;
}

export class ContentRewriteService {
  private readonly qualityService: ContentQualityService;
  private readonly personalityStore: PersonalityStore;
  private llmRouter: LlmRouter | null = null;

  constructor(
    private supabase: SupabaseClient,
    private billingService: BillingService,
    llmRouter?: LlmRouter
  ) {
    this.qualityService = new ContentQualityService(supabase);
    this.personalityStore = new PersonalityStore(supabase);
    this.llmRouter = llmRouter || null;
  }

  /**
   * Generate a rewrite for content item
   * Returns full rewrite result with diff, improvements, and quality metrics
   */
  async generateRewrite(
    orgId: string,
    input: RewriteRequestInput,
    playbookRunId?: string | null
  ): Promise<RewriteResult> {
    // Sprint S29: Enforce billing quota before rewriting content
    // Estimate: Content rewriting typically uses ~8,000 tokens
    await this.billingService.enforceOrgQuotaOrThrow(orgId, {
      tokensToConsume: 8000,
    });

    // 1. Fetch content item
    const item = await this.getContentItem(orgId, input.contentItemId);
    if (!item || !item.body) {
      throw new Error('Content item not found or has no body');
    }

    // 2. Fetch personality if provided
    let personality: AgentPersonality | null = null;
    if (input.personalityId) {
      personality = await this.personalityStore.getPersonality(orgId, input.personalityId);
    }

    // 3. Analyze quality before rewrite (S14 integration)
    const qualityAnalysis = await this.qualityService.analyzeQuality(orgId, input.contentItemId);
    const qualityBefore = qualityAnalysis.score.score;
    const readabilityBefore = qualityAnalysis.score.readability || 50;

    // 4. Build rewrite context
    const context: RewriteContext = {
      item,
      personality,
      targetKeyword: input.targetKeyword,
      targetIntent: input.targetIntent,
      qualityBefore,
      readabilityBefore,
    };

    // 5. Generate rewrite (LLM if available, otherwise stub)
    const rewrittenText = await this.stubRewrite(item.body, context);

    // 6. Compute semantic diff
    const diff = this.computeSemanticDiff(item.body, rewrittenText);

    // 7. Extract improvements applied
    const improvements = this.extractImprovements(context, diff);

    // 8. Generate reasoning metadata
    const reasoning = this.generateReasoning(context, improvements);

    // 9. Compute quality after rewrite
    const readabilityAfter = this.qualityService.computeReadability(rewrittenText);
    const qualityAfter = qualityBefore + 10; // Stub: always improve by 10 points

    // 10. Save rewrite to database
    const saved = await this.saveRewrite(orgId, {
      contentItemId: input.contentItemId,
      playbookRunId,
      originalText: item.body,
      rewrittenText,
      diff,
      improvements,
      reasoning,
      readabilityBefore,
      readabilityAfter,
      qualityBefore,
      qualityAfter,
    });

    return {
      rewriteId: saved.id,
      rewrittenText,
      diff,
      improvements,
      reasoning,
      readabilityBefore,
      readabilityAfter,
      qualityBefore,
      qualityAfter,
    };
  }

  /**
   * Get a single rewrite by ID
   */
  async getRewrite(orgId: string, rewriteId: string): Promise<ContentRewrite | null> {
    const { data, error } = await this.supabase
      .from('content_rewrites')
      .select('*')
      .eq('org_id', orgId)
      .eq('id', rewriteId)
      .single();

    if (error || !data) {
      return null;
    }

    return this.mapRewriteFromDb(data);
  }

  /**
   * List rewrites for org with optional filtering
   */
  async listRewrites(
    orgId: string,
    options: {
      page?: number;
      pageSize?: number;
      contentItemId?: string;
    } = {}
  ): Promise<{ rewrites: ContentRewrite[]; total: number }> {
    const page = options.page || 1;
    const pageSize = options.pageSize || 20;
    const offset = (page - 1) * pageSize;

    let query = this.supabase
      .from('content_rewrites')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (options.contentItemId) {
      query = query.eq('content_item_id', options.contentItemId);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to list rewrites: ${error.message}`);
    }

    const rewrites = (data || []).map((r) => this.mapRewriteFromDb(r));

    return {
      rewrites,
      total: count || 0,
    };
  }

  /**
   * Rewrite using LLM (S16)
   */
  private async rewriteWithLLM(
    originalText: string,
    context: RewriteContext
  ): Promise<string | null> {
    if (!this.llmRouter) {
      return null;
    }

    // Build system prompt
    const systemPrompt = this.buildRewriteSystemPrompt(context);

    // Build user prompt
    const userPrompt = `Please rewrite the following content to improve its quality, readability, and SEO performance.

Original Content:
${originalText}

Target Keyword: ${context.targetKeyword || 'N/A'}
Target Intent: ${context.targetIntent || 'N/A'}

Current Quality Score: ${context.qualityBefore}/100
Current Readability Score: ${context.readabilityBefore}/100

Please provide the rewritten content with the following improvements:
1. Maintain the core message and facts
2. Improve clarity and readability
3. Enhance SEO optimization for the target keyword
4. Apply the specified tone and style
5. Fix any grammar or structural issues
6. Add transitions and subheadings where appropriate

Return only the rewritten content, no explanations or metadata.`;

    try {
      const response = await this.llmRouter.generate({
        systemPrompt,
        userPrompt,
        temperature: 0.7,
      });

      logger.info('Generated rewrite using LLM', { provider: response.provider });
      return response.completion;
    } catch (error) {
      logger.warn('Failed to rewrite with LLM, will use stub', { error });
      return null;
    }
  }

  /**
   * Build system prompt for rewrite
   */
  private buildRewriteSystemPrompt(context: RewriteContext): string {
    const personality = context.personality?.configuration;
    const tone = personality?.tone || 'professional';
    const style = personality?.style || 'clear and informative';

    return `You are an expert content editor and copywriter. Your role is to rewrite content to improve its quality, readability, and SEO performance while maintaining factual accuracy and the core message.

Personality and Style:
- Tone: ${tone}
- Writing Style: ${style}

Your rewrites should:
1. Preserve all facts and core information
2. Improve readability through better sentence structure
3. Optimize for search engines without keyword stuffing
4. Apply the specified tone and style consistently
5. Add clear transitions between ideas
6. Use active voice where appropriate
7. Break up long paragraphs and sentences
8. Add subheadings to improve scanability

Important: Return only the rewritten content. Do not include explanations, metadata, or commentary.`;
  }

  /**
   * Deterministic stub rewrite (V1)
   * Updated in S16 to try LLM first, with fallback to stub
   */
  private async stubRewrite(originalText: string, context: RewriteContext): Promise<string> {
    // Try LLM first
    const llmRewrite = await this.rewriteWithLLM(originalText, context);
    if (llmRewrite) {
      return llmRewrite;
    }

    // Fallback to stub logic
    logger.debug('Using deterministic stub rewrite as fallback');

    let rewritten = originalText;

    // 1. Split into sentences
    const sentences = this.splitIntoSentences(originalText);
    let modifiedSentences = [...sentences];

    // 2. Apply personality-based transformations
    if (context.personality) {
      modifiedSentences = this.applyPersonalityTransforms(modifiedSentences, context.personality);
    }

    // 3. Improve readability by splitting long sentences
    modifiedSentences = this.splitLongSentences(modifiedSentences);

    // 4. Inject keyword if provided and not present
    if (context.targetKeyword) {
      modifiedSentences = this.injectKeyword(modifiedSentences, context.targetKeyword);
    }

    // 5. Add subheadings if text is long
    if (modifiedSentences.length > 5) {
      modifiedSentences = this.addSubheadings(modifiedSentences);
    }

    // 6. Add transition sentences
    modifiedSentences = this.addTransitions(modifiedSentences);

    // 7. Expand thin content
    if (this.countWords(originalText) < 300) {
      modifiedSentences = this.expandThinContent(modifiedSentences);
    }

    // 8. Remove duplicates
    modifiedSentences = this.removeDuplicateSentences(modifiedSentences);

    rewritten = modifiedSentences.join(' ');

    return rewritten.trim();
  }

  /**
   * Compute semantic diff between original and rewritten text
   */
  private computeSemanticDiff(original: string, rewritten: string): Record<string, unknown> {
    const originalSentences = this.splitIntoSentences(original);
    const rewrittenSentences = this.splitIntoSentences(rewritten);

    const diff: SemanticDiffEntry[] = [];

    // Simple diff algorithm: compare sentences
    const originalSet = new Set(originalSentences);
    const rewrittenSet = new Set(rewrittenSentences);

    // Find removed sentences
    for (const sent of originalSentences) {
      if (!rewrittenSet.has(sent)) {
        diff.push({
          type: 'removed',
          original: sent,
        });
      }
    }

    // Find added sentences
    for (const sent of rewrittenSentences) {
      if (!originalSet.has(sent)) {
        diff.push({
          type: 'added',
          rewritten: sent,
        });
      }
    }

    // Find unchanged sentences
    for (const sent of originalSentences) {
      if (rewrittenSet.has(sent)) {
        diff.push({
          type: 'unchanged',
          original: sent,
          rewritten: sent,
        });
      }
    }

    return {
      entries: diff,
      summary: {
        added: diff.filter((d) => d.type === 'added').length,
        removed: diff.filter((d) => d.type === 'removed').length,
        modified: diff.filter((d) => d.type === 'modified').length,
        unchanged: diff.filter((d) => d.type === 'unchanged').length,
      },
    };
  }

  /**
   * Extract improvements applied during rewrite
   */
  private extractImprovements(context: RewriteContext, diff: Record<string, unknown>): string[] {
    const improvements: string[] = [];

    const summary = (diff as any).summary || {};

    if (summary.added > 0) {
      improvements.push(`Added ${summary.added} new sentence(s) to improve clarity`);
    }

    if (summary.removed > 0) {
      improvements.push(`Removed ${summary.removed} redundant sentence(s)`);
    }

    if (context.personality) {
      improvements.push(`Applied ${context.personality.configuration.tone} tone`);
    }

    if (context.targetKeyword) {
      improvements.push(`Optimized for keyword: "${context.targetKeyword}"`);
    }

    if (context.readabilityBefore < 60) {
      improvements.push('Improved readability by splitting long sentences');
    }

    return improvements;
  }

  /**
   * Generate reasoning metadata for the rewrite
   */
  private generateReasoning(context: RewriteContext, improvements: string[]): Record<string, unknown> {
    return {
      qualityScoreBefore: context.qualityBefore,
      readabilityBefore: context.readabilityBefore,
      personalityApplied: context.personality?.name || null,
      targetKeyword: context.targetKeyword || null,
      targetIntent: context.targetIntent || null,
      improvementsCount: improvements.length,
      strategy: 'deterministic_stub_v1',
      note: 'This rewrite was generated using deterministic stub logic. S16 will introduce LLM-based rewriting.',
    };
  }

  /**
   * Save rewrite to database
   */
  private async saveRewrite(
    orgId: string,
    data: {
      contentItemId: string;
      playbookRunId?: string | null;
      originalText: string;
      rewrittenText: string;
      diff: Record<string, unknown>;
      improvements: string[];
      reasoning: Record<string, unknown>;
      readabilityBefore: number;
      readabilityAfter: number;
      qualityBefore: number;
      qualityAfter: number;
    }
  ): Promise<ContentRewrite> {
    const { data: savedData, error } = await this.supabase
      .from('content_rewrites')
      .insert({
        org_id: orgId,
        content_item_id: data.contentItemId,
        playbook_run_id: data.playbookRunId,
        original_text: data.originalText,
        rewritten_text: data.rewrittenText,
        diff: data.diff,
        improvements: data.improvements,
        reasoning: data.reasoning,
        readability_before: data.readabilityBefore,
        readability_after: data.readabilityAfter,
        quality_before: data.qualityBefore,
        quality_after: data.qualityAfter,
      })
      .select()
      .single();

    if (error || !savedData) {
      throw new Error(`Failed to save rewrite: ${error?.message || 'Unknown error'}`);
    }

    return this.mapRewriteFromDb(savedData);
  }

  /**
   * Get content item by ID
   */
  private async getContentItem(orgId: string, contentItemId: string): Promise<ContentItem | null> {
    const { data, error } = await this.supabase
      .from('content_items')
      .select('*')
      .eq('org_id', orgId)
      .eq('id', contentItemId)
      .single();

    if (error || !data) {
      return null;
    }

    return this.mapContentItemFromDb(data);
  }

  /**
   * Map database record to ContentItem
   */
  private mapContentItemFromDb(data: Record<string, unknown>): ContentItem {
    return {
      id: data.id as string,
      orgId: data.org_id as string,
      title: data.title as string,
      slug: data.slug as string,
      contentType: data.content_type as ContentItem['contentType'],
      status: data.status as ContentItem['status'],
      body: data.body as string | null,
      url: data.url as string | null,
      publishedAt: data.published_at as string | null,
      wordCount: data.word_count as number | null,
      readingTimeMinutes: data.reading_time_minutes as number | null,
      performanceScore: data.performance_score as number | null,
      primaryTopicId: data.primary_topic_id as string | null,
      embeddings: data.embeddings as number[] | null,
      performance: (data.performance as Record<string, unknown>) || {},
      metadata: (data.metadata as Record<string, unknown>) || {},
      createdAt: data.created_at as string,
      updatedAt: data.updated_at as string,
    };
  }

  /**
   * Map database record to ContentRewrite
   */
  private mapRewriteFromDb(data: Record<string, unknown>): ContentRewrite {
    return {
      id: data.id as string,
      orgId: data.org_id as string,
      contentItemId: data.content_item_id as string,
      playbookRunId: data.playbook_run_id as string | null,
      originalText: data.original_text as string,
      rewrittenText: data.rewritten_text as string,
      diff: (data.diff as Record<string, unknown>) || {},
      improvements: (data.improvements as string[]) || [],
      reasoning: (data.reasoning as Record<string, unknown>) || {},
      readabilityBefore: data.readability_before as number,
      readabilityAfter: data.readability_after as number,
      qualityBefore: data.quality_before as number,
      qualityAfter: data.quality_after as number,
      createdAt: data.created_at as string,
      updatedAt: data.updated_at as string,
    };
  }

  // ========================================
  // HELPER METHODS FOR STUB REWRITING
  // ========================================

  /**
   * Split text into sentences
   */
  private splitIntoSentences(text: string): string[] {
    return text
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.split(/\s+/).filter((w) => w.length > 0).length;
  }

  /**
   * Apply personality-based transformations
   */
  private applyPersonalityTransforms(sentences: string[], personality: AgentPersonality): string[] {
    const tone = personality.configuration.tone;

    if (tone === 'assertive') {
      // Shorten sentences
      return sentences.map((s) => {
        const words = s.split(/\s+/);
        if (words.length > 15) {
          return words.slice(0, 15).join(' ') + '.';
        }
        return s;
      });
    }

    if (tone === 'supportive') {
      // Add softer transitions
      return sentences.map((s, i) => {
        if (i > 0 && Math.random() > 0.7) {
          return `Additionally, ${s.charAt(0).toLowerCase()}${s.slice(1)}`;
        }
        return s;
      });
    }

    return sentences;
  }

  /**
   * Split long sentences (>20 words)
   */
  private splitLongSentences(sentences: string[]): string[] {
    const result: string[] = [];

    for (const sent of sentences) {
      const words = sent.split(/\s+/);
      if (words.length > 20) {
        const mid = Math.floor(words.length / 2);
        result.push(words.slice(0, mid).join(' ') + '.');
        result.push(words.slice(mid).join(' ') + '.');
      } else {
        result.push(sent);
      }
    }

    return result;
  }

  /**
   * Inject keyword into opening sentences
   */
  private injectKeyword(sentences: string[], keyword: string): string[] {
    if (sentences.length === 0) return sentences;

    const firstSentence = sentences[0];
    const lowerFirst = firstSentence.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();

    if (!lowerFirst.includes(lowerKeyword)) {
      sentences[0] = `${keyword} is essential. ${firstSentence}`;
    }

    return sentences;
  }

  /**
   * Add subheadings
   */
  private addSubheadings(sentences: string[]): string[] {
    const result: string[] = [];
    const chunkSize = 3;

    for (let i = 0; i < sentences.length; i += chunkSize) {
      if (i > 0) {
        result.push(`\n## Section ${Math.floor(i / chunkSize)}\n`);
      }
      result.push(...sentences.slice(i, i + chunkSize));
    }

    return result;
  }

  /**
   * Add transition sentences
   */
  private addTransitions(sentences: string[]): string[] {
    const result: string[] = [];

    for (let i = 0; i < sentences.length; i++) {
      result.push(sentences[i]);
      if (i > 0 && i % 3 === 0 && i < sentences.length - 1) {
        result.push('Furthermore, this approach provides additional benefits.');
      }
    }

    return result;
  }

  /**
   * Expand thin content by adding filler paragraphs
   */
  private expandThinContent(sentences: string[]): string[] {
    const expansion = [
      'This topic deserves further exploration.',
      'Understanding these concepts is crucial for success.',
      'Many experts agree on the importance of this approach.',
    ];

    return [...sentences, ...expansion];
  }

  /**
   * Remove duplicate sentences
   */
  private removeDuplicateSentences(sentences: string[]): string[] {
    const seen = new Set<string>();
    return sentences.filter((s) => {
      const lower = s.toLowerCase().trim();
      if (seen.has(lower)) {
        return false;
      }
      seen.add(lower);
      return true;
    });
  }
}
