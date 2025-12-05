/**
 * Content Quality Service (Sprint S14)
 * Analyzes content quality, readability, and semantic similarity
 *
 * Provides:
 * - Quality scoring (readability, topic alignment, keyword alignment)
 * - Thin content detection
 * - Duplicate/similar content detection via vector similarity
 * - Suggested improvements
 */

import type {
  ContentItem,
  ContentQualityScore,
  ContentQualityAnalysisResult,
} from '@pravado/types';
import type { SupabaseClient } from '@supabase/supabase-js';

export class ContentQualityService {
  private readonly SIMILARITY_THRESHOLD = 0.85; // Cosine similarity threshold for duplicates
  private readonly THIN_CONTENT_THRESHOLD = 300; // Words
  private readonly MIN_WORD_COUNT = 800;
  private readonly MAX_WORD_COUNT = 1200;

  constructor(private supabase: SupabaseClient) {}

  /**
   * Analyze content quality and return comprehensive results
   */
  async analyzeQuality(
    orgId: string,
    contentItemId: string
  ): Promise<ContentQualityAnalysisResult> {
    // Fetch content item
    const { data: item, error: itemError } = await this.supabase
      .from('content_items')
      .select('*')
      .eq('id', contentItemId)
      .eq('org_id', orgId)
      .single();

    if (itemError || !item) {
      throw new Error('Content item not found');
    }

    const contentItem = this.mapContentItemFromDb(item);

    // Perform all quality checks
    const readability = this.computeReadability(contentItem.body || '');
    const topicAlignment = await this.computeTopicAlignment(contentItem);
    const keywordAlignment = this.computeKeywordAlignment(contentItem);
    const thinContent = this.detectThinContent(contentItem.body || '');
    const similarItems = await this.detectSimilarContent(orgId, contentItem);
    const duplicateFlag = similarItems.length > 0;

    // Calculate overall score
    const score = this.calculateOverallScore({
      readability,
      topicAlignment,
      keywordAlignment,
      thinContent,
      duplicateFlag,
    });

    // Generate warnings
    const warnings = this.generateWarnings({
      readability,
      topicAlignment,
      keywordAlignment,
      thinContent,
      duplicateFlag,
      wordCount: contentItem.wordCount || 0,
    });

    // Save quality score
    const qualityScore = await this.saveScore(orgId, {
      contentItemId,
      score,
      readability,
      topicAlignment,
      keywordAlignment,
      thinContent,
      duplicateFlag,
      warnings,
    });

    // Generate suggested improvements
    const suggestedImprovements = this.generateImprovements({
      readability,
      topicAlignment,
      keywordAlignment,
      thinContent,
      duplicateFlag,
      wordCount: contentItem.wordCount || 0,
      similarItems,
    });

    return {
      item: contentItem,
      score: qualityScore,
      similarItems,
      suggestedImprovements,
    };
  }

  /**
   * Get latest quality score for a content item
   */
  async getQualityScore(
    orgId: string,
    contentItemId: string
  ): Promise<ContentQualityScore | null> {
    const { data, error } = await this.supabase
      .from('content_quality_scores')
      .select('*')
      .eq('org_id', orgId)
      .eq('content_item_id', contentItemId)
      .single();

    if (error || !data) {
      return null;
    }

    return this.mapQualityScoreFromDb(data);
  }

  /**
   * Compute readability score using Flesch-Kincaid Reading Ease formula
   * Returns 0-100 (higher = more readable)
   */
  computeReadability(text: string): number {
    if (!text || text.trim().length === 0) {
      return 0;
    }

    // Count sentences (approximation using . ! ?)
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const sentenceCount = sentences.length || 1;

    // Count words (split by whitespace)
    const words = text.split(/\s+/).filter((w) => w.trim().length > 0);
    const wordCount = words.length || 1;

    // Count syllables (approximation)
    let syllableCount = 0;
    words.forEach((word) => {
      syllableCount += this.countSyllables(word);
    });

    // Flesch Reading Ease formula:
    // 206.835 - 1.015 * (words/sentences) - 84.6 * (syllables/words)
    const avgWordsPerSentence = wordCount / sentenceCount;
    const avgSyllablesPerWord = syllableCount / wordCount;

    let readingEase = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

    // Clamp to 0-100
    readingEase = Math.max(0, Math.min(100, readingEase));

    return Math.round(readingEase);
  }

  /**
   * Count syllables in a word (approximation)
   */
  private countSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;

    // Count vowel groups
    const vowels = word.match(/[aeiouy]+/g);
    let syllables = vowels ? vowels.length : 1;

    // Adjust for silent 'e'
    if (word.endsWith('e')) {
      syllables--;
    }

    // Minimum of 1 syllable
    return Math.max(1, syllables);
  }

  /**
   * Compute topic alignment using vector similarity
   * Returns 0-100 (higher = better alignment with primary topic)
   */
  async computeTopicAlignment(item: ContentItem): Promise<number | null> {
    // If no primary topic or no embeddings, return null
    if (!item.primaryTopicId || !item.embeddings) {
      return null;
    }

    // Fetch primary topic's representative embedding
    // In V1, we'll use a simplified approach: check if topic exists
    const { data: topic } = await this.supabase
      .from('content_topics')
      .select('id')
      .eq('id', item.primaryTopicId)
      .single();

    if (!topic) {
      return null;
    }

    // For V1, return a placeholder score based on whether topic is assigned
    // Future: Calculate actual vector similarity with topic centroid
    return 85;
  }

  /**
   * Compute keyword alignment
   * Returns 0-100 (higher = better keyword usage)
   */
  computeKeywordAlignment(item: ContentItem): number {
    // If no metadata or keyword, return neutral score
    const metadata = item.metadata as Record<string, unknown>;
    const targetKeyword = metadata?.targetKeyword as string | undefined;

    if (!targetKeyword) {
      return 50; // Neutral score if no target keyword
    }

    const keyword = targetKeyword.toLowerCase();
    const title = (item.title || '').toLowerCase();
    const body = (item.body || '').toLowerCase();

    // Get first 200 words
    const firstWords = body.split(/\s+/).slice(0, 200).join(' ');

    let score = 0;

    // Keyword in title: +50
    if (title.includes(keyword)) {
      score += 50;
    }

    // Keyword in first 200 words: +50
    if (firstWords.includes(keyword)) {
      score += 50;
    }

    return Math.min(100, score);
  }

  /**
   * Detect thin content (< 300 words)
   */
  detectThinContent(text: string): boolean {
    const words = text.split(/\s+/).filter((w) => w.trim().length > 0);
    return words.length < this.THIN_CONTENT_THRESHOLD;
  }

  /**
   * Detect similar/duplicate content using vector similarity
   */
  async detectSimilarContent(
    orgId: string,
    item: ContentItem
  ): Promise<ContentItem[]> {
    // If no embeddings, can't detect similarity
    if (!item.embeddings) {
      return [];
    }

    // Use pgvector to find similar content
    // In Supabase, we can use the <-> operator for cosine distance
    const { data: similarItems } = await this.supabase.rpc('find_similar_content', {
      p_org_id: orgId,
      p_content_item_id: item.id,
      p_embedding: item.embeddings,
      p_threshold: 1 - this.SIMILARITY_THRESHOLD, // Convert similarity to distance
      p_limit: 5,
    });

    if (!similarItems || similarItems.length === 0) {
      return [];
    }

    return similarItems.map((row: Record<string, unknown>) =>
      this.mapContentItemFromDb(row)
    );
  }

  /**
   * Calculate overall quality score
   */
  private calculateOverallScore(metrics: {
    readability: number;
    topicAlignment: number | null;
    keywordAlignment: number;
    thinContent: boolean;
    duplicateFlag: boolean;
  }): number {
    let score = 0;

    // Readability: 20%
    score += metrics.readability * 0.2;

    // Topic alignment: 30% (if available)
    if (metrics.topicAlignment !== null) {
      score += metrics.topicAlignment * 0.3;
    } else {
      // If no topic, redistribute weight to keyword
      score += metrics.keywordAlignment * 0.3;
    }

    // Keyword alignment: 30%
    score += metrics.keywordAlignment * 0.3;

    // Penalties
    if (metrics.thinContent) {
      score -= 20;
    }

    if (metrics.duplicateFlag) {
      score -= 30;
    }

    // Clamp to 0-100
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Generate warnings object
   */
  private generateWarnings(metrics: {
    readability: number;
    topicAlignment: number | null;
    keywordAlignment: number;
    thinContent: boolean;
    duplicateFlag: boolean;
    wordCount: number;
  }): Record<string, unknown> {
    const warnings: Record<string, unknown> = {};

    if (metrics.thinContent) {
      warnings.thinContent = `Content has only ${metrics.wordCount} words`;
    }

    if (metrics.duplicateFlag) {
      warnings.duplicate = 'Similar content detected';
    }

    if (metrics.readability < 40) {
      warnings.readability = 'Low readability score';
    }

    if (metrics.keywordAlignment < 50) {
      warnings.keyword = 'Target keyword not prominently featured';
    }

    if (metrics.topicAlignment !== null && metrics.topicAlignment < 60) {
      warnings.topic = 'Weak alignment with primary topic';
    }

    return warnings;
  }

  /**
   * Generate suggested improvements
   */
  private generateImprovements(params: {
    readability: number;
    topicAlignment: number | null;
    keywordAlignment: number;
    thinContent: boolean;
    duplicateFlag: boolean;
    wordCount: number;
    similarItems: ContentItem[];
  }): string[] {
    const improvements: string[] = [];

    if (params.thinContent) {
      improvements.push(
        `Expand content to exceed ${this.MIN_WORD_COUNT}–${this.MAX_WORD_COUNT} words for better depth and SEO.`
      );
    }

    if (params.keywordAlignment < 50) {
      improvements.push(
        'Add primary keyword to title or introduction for better keyword alignment.'
      );
    }

    if (params.duplicateFlag && params.similarItems.length > 0) {
      const firstSimilar = params.similarItems[0];
      improvements.push(
        `Differentiate this content from "${firstSimilar.title}" to avoid duplicate content issues.`
      );
    }

    if (params.readability < 40) {
      improvements.push(
        'Rewrite sentences to improve clarity and readability. Aim for shorter sentences and simpler words.'
      );
    }

    if (params.topicAlignment !== null && params.topicAlignment < 60) {
      improvements.push(
        'Strengthen alignment with primary topic by adding more relevant keywords and concepts.'
      );
    }

    if (!params.thinContent && params.wordCount > this.MAX_WORD_COUNT * 2) {
      improvements.push(
        'Consider breaking this into multiple pieces for better user experience and focused topics.'
      );
    }

    if (improvements.length === 0) {
      improvements.push('Content quality is good! No major improvements needed.');
    }

    return improvements;
  }

  /**
   * Save quality score to database
   */
  private async saveScore(
    orgId: string,
    data: {
      contentItemId: string;
      score: number;
      readability: number;
      topicAlignment: number | null;
      keywordAlignment: number;
      thinContent: boolean;
      duplicateFlag: boolean;
      warnings: Record<string, unknown>;
    }
  ): Promise<ContentQualityScore> {
    // Upsert (insert or update if exists)
    const { data: savedData, error } = await this.supabase
      .from('content_quality_scores')
      .upsert(
        {
          org_id: orgId,
          content_item_id: data.contentItemId,
          score: data.score,
          readability: data.readability,
          topic_alignment: data.topicAlignment,
          keyword_alignment: data.keywordAlignment,
          thin_content: data.thinContent,
          duplicate_flag: data.duplicateFlag,
          warnings: data.warnings,
        },
        {
          onConflict: 'content_item_id',
        }
      )
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save quality score: ${error.message}`);
    }

    return this.mapQualityScoreFromDb(savedData);
  }

  /**
   * Map database record to ContentItem type
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
   * Map database record to ContentQualityScore type
   */
  private mapQualityScoreFromDb(data: Record<string, unknown>): ContentQualityScore {
    return {
      id: data.id as string,
      orgId: data.org_id as string,
      contentItemId: data.content_item_id as string,
      score: Number(data.score),
      readability: data.readability !== null ? Number(data.readability) : null,
      topicAlignment: data.topic_alignment !== null ? Number(data.topic_alignment) : null,
      keywordAlignment: data.keyword_alignment !== null ? Number(data.keyword_alignment) : null,
      thinContent: data.thin_content as boolean,
      duplicateFlag: data.duplicate_flag as boolean,
      warnings: (data.warnings as Record<string, unknown>) || {},
      createdAt: data.created_at as string,
      updatedAt: data.updated_at as string,
    };
  }
}
