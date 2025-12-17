/**
 * Press Release Service (Sprint S38)
 * AI-powered press release generation engine
 *
 * Features:
 * - Context assembly from SEO, content intelligence, personality, memory
 * - Angle finder for narrative positioning
 * - Headline generator with SEO/virality scoring
 * - Multi-section draft generator (AP style)
 * - Optimization layer (SEO, readability, tone)
 * - Vector embeddings for similarity search
 */

import { EventEmitter } from 'events';

import type {
  PRAngleFinderResult,
  PRAngleOption,
  PRAngleOptionRecord,
  PRCompanyFootprint,
  PRDraftResult,
  PRGeneratedRelease,
  PRGeneratedReleaseRecord,
  PRGenerationContext,
  PRGenerationInput,
  PRHeadlineGenerationResult,
  PRHeadlineVariant,
  PRHeadlineVariantRecord,
  PRListFilters,
  PROptimizationEntry,
  PROptimizationResult,
  PRPersonalityContext,
  PRReleaseStatus,
  PRSEOOpportunity,
  PRSEOSuggestion,
  PRSEOSummary,
  PRSimilarRelease,
} from '@pravado/types';
import type { LlmRouter } from '@pravado/utils';
import type { SupabaseClient } from '@supabase/supabase-js';


// Event emitter for generation progress
export const prGenerationEmitter = new EventEmitter();

// ============================================================================
// Service Options
// ============================================================================

interface PressReleaseServiceOptions {
  debugMode?: boolean;
}

// ============================================================================
// Main Service Class
// ============================================================================

export class PressReleaseService {
  private supabase: SupabaseClient;
  private llmRouter: LlmRouter | null;
  private debugMode: boolean;

  constructor(
    supabase: SupabaseClient,
    llmRouter?: LlmRouter,
    options: PressReleaseServiceOptions = {}
  ) {
    this.supabase = supabase;
    this.llmRouter = llmRouter || null;
    this.debugMode = options.debugMode || false;
  }

  // ==========================================================================
  // A. Context Assembler
  // ==========================================================================

  /**
   * Assemble generation context from multiple sources
   */
  async assembleContext(
    orgId: string,
    input: PRGenerationInput
  ): Promise<PRGenerationContext> {
    // Gather context from multiple sources in parallel
    const [seoData, companyFootprint, personality] = await Promise.all([
      this.fetchSEOContext(orgId, input),
      this.fetchCompanyFootprint(orgId, input),
      input.personalityId ? this.fetchPersonality(orgId, input.personalityId) : null,
    ]);

    // Extract industry trends based on news type
    const industryTrends = this.extractIndustryTrends(input);

    // Extract competitor context if provided
    const competitorContext = input.competitorMentions || [];

    return {
      input,
      seoKeywords: seoData.keywords,
      seoOpportunities: seoData.opportunities,
      companyFootprint,
      personality,
      industryTrends,
      competitorContext,
    };
  }

  /**
   * Fetch SEO context (keywords, opportunities)
   */
  private async fetchSEOContext(
    orgId: string,
    input: PRGenerationInput
  ): Promise<{ keywords: string[]; opportunities: PRSEOOpportunity[] }> {
    // Start with target keywords from input
    const keywords = input.targetKeywords || [];

    // Try to fetch SEO opportunities from existing content intelligence
    try {
      const { data: seoItems } = await this.supabase
        .from('seo_opportunities')
        .select('keyword, search_volume, difficulty, relevance')
        .eq('org_id', orgId)
        .limit(10);

      const opportunities: PRSEOOpportunity[] = (seoItems || []).map((item) => ({
        keyword: item.keyword,
        searchVolume: item.search_volume || 0,
        difficulty: item.difficulty || 50,
        relevance: item.relevance || 0.5,
      }));

      // Add keywords from opportunities
      opportunities.forEach((opp) => {
        if (!keywords.includes(opp.keyword)) {
          keywords.push(opp.keyword);
        }
      });

      return { keywords, opportunities };
    } catch {
      // Fallback to input keywords only
      return { keywords, opportunities: [] };
    }
  }

  /**
   * Fetch company footprint (brand info, recent news, boilerplate)
   */
  private async fetchCompanyFootprint(
    orgId: string,
    input: PRGenerationInput
  ): Promise<PRCompanyFootprint> {
    // Try to fetch org info
    let orgInfo = null;
    try {
      const { data } = await this.supabase
        .from('orgs')
        .select('name, description, industry')
        .eq('id', orgId)
        .single();
      orgInfo = data;
    } catch {
      // Org lookup failed, use input data
    }

    // Try to fetch recent content for context
    let recentNews: string[] = [];
    try {
      const { data: contentItems } = await this.supabase
        .from('content_items')
        .select('title')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(5);

      recentNews = (contentItems || []).map((item) => item.title).filter(Boolean);
    } catch {
      // Content lookup failed
    }

    return {
      name: input.companyName || orgInfo?.name || 'Company',
      description: input.companyDescription || orgInfo?.description || '',
      industry: input.industry || orgInfo?.industry || 'Technology',
      keyProducts: [],
      recentNews,
      boilerplate: this.generateDefaultBoilerplate(input, orgInfo),
    };
  }

  /**
   * Generate default boilerplate
   */
  private generateDefaultBoilerplate(
    input: PRGenerationInput,
    orgInfo: { name?: string; description?: string } | null
  ): string {
    const name = input.companyName || orgInfo?.name || 'Company';
    const desc = input.companyDescription || orgInfo?.description || '';

    if (desc) {
      return `About ${name}: ${desc}`;
    }

    return `About ${name}: ${name} is a leading organization in its industry, committed to innovation and excellence.`;
  }

  /**
   * Fetch personality context
   */
  private async fetchPersonality(
    orgId: string,
    personalityId: string
  ): Promise<PRPersonalityContext | null> {
    try {
      const { data } = await this.supabase
        .from('agent_personalities')
        .select('id, name, tone, voice_attributes, writing_style')
        .eq('org_id', orgId)
        .eq('id', personalityId)
        .single();

      if (data) {
        return {
          id: data.id,
          name: data.name,
          tone: data.tone || 'professional',
          voiceAttributes: data.voice_attributes || [],
          writingStyle: data.writing_style || 'formal',
        };
      }
    } catch {
      // Personality lookup failed
    }
    return null;
  }

  /**
   * Extract industry trends based on news type
   */
  private extractIndustryTrends(input: PRGenerationInput): string[] {
    const trends: string[] = [];

    // Add trends based on news type
    switch (input.newsType) {
      case 'product_launch':
        trends.push('innovation', 'market expansion', 'customer demand');
        break;
      case 'funding':
        trends.push('growth potential', 'investor confidence', 'market opportunity');
        break;
      case 'partnership':
        trends.push('strategic alignment', 'market synergy', 'collaboration');
        break;
      case 'acquisition':
        trends.push('market consolidation', 'strategic growth', 'capabilities expansion');
        break;
      case 'executive_hire':
        trends.push('leadership', 'industry expertise', 'growth trajectory');
        break;
      default:
        trends.push('industry leadership', 'market position');
    }

    return trends;
  }

  // ==========================================================================
  // B. Angle Finder
  // ==========================================================================

  /**
   * Find narrative angles for the press release
   */
  async findAngles(context: PRGenerationContext): Promise<PRAngleFinderResult> {
    // If user provided a preferred angle, include it
    const preferredAngle = context.input.preferredAngle;

    // Generate angles using LLM or fallback
    const angles = await this.generateAnglesWithLLM(context);

    // Score and rank angles
    const scoredAngles = angles.map((angle) => this.scoreAngle(angle, context));
    scoredAngles.sort((a, b) => b.totalScore - a.totalScore);

    // Select best angle (or preferred if specified)
    let selectedAngle = scoredAngles[0];
    if (preferredAngle) {
      const matchingAngle = scoredAngles.find((a) =>
        a.angleTitle.toLowerCase().includes(preferredAngle.toLowerCase())
      );
      if (matchingAngle) {
        selectedAngle = matchingAngle;
      }
    }
    selectedAngle.isSelected = true;

    return {
      angles: scoredAngles,
      selectedAngle,
      reasoning: `Selected "${selectedAngle.angleTitle}" based on highest combined score for newsworthiness, uniqueness, and relevance.`,
    };
  }

  /**
   * Generate angles using LLM
   */
  private async generateAnglesWithLLM(context: PRGenerationContext): Promise<PRAngleOption[]> {
    if (!this.llmRouter) {
      return this.generateFallbackAngles(context);
    }

    const systemPrompt = `You are an expert PR strategist specializing in finding compelling narrative angles for press releases. Generate 5 unique angles for the given announcement.

For each angle, provide:
1. A concise title (5-10 words)
2. A brief description (1-2 sentences)

Return ONLY a JSON array of objects with "title" and "description" fields.`;

    const userPrompt = `Generate 5 narrative angles for this press release:

Company: ${context.companyFootprint.name}
Industry: ${context.companyFootprint.industry}
News Type: ${context.input.newsType}
Announcement: ${context.input.announcement}
Target Audience: ${context.input.targetAudience || 'General public'}
Keywords: ${context.seoKeywords.join(', ') || 'None specified'}

Return a JSON array of 5 angle objects.`;

    try {
      const response = await this.llmRouter.generate({
        systemPrompt,
        userPrompt,
        temperature: 0.7,
        maxTokens: 1024,
      });

      const parsed = this.parseJSONResponse<Array<{ title: string; description: string }>>(
        response.completion
      );

      if (parsed && Array.isArray(parsed)) {
        return parsed.map((item) => ({
          angleTitle: item.title,
          angleDescription: item.description,
          newsworthinessScore: 0,
          uniquenessScore: 0,
          relevanceScore: 0,
          totalScore: 0,
          isSelected: false,
        }));
      }
    } catch (error) {
      if (this.debugMode) {
        console.error('LLM angle generation failed:', error);
      }
    }

    return this.generateFallbackAngles(context);
  }

  /**
   * Generate fallback angles without LLM
   */
  private generateFallbackAngles(context: PRGenerationContext): PRAngleOption[] {
    const { input, companyFootprint } = context;
    const angles: PRAngleOption[] = [];

    // News-type specific angles
    switch (input.newsType) {
      case 'product_launch':
        angles.push(
          {
            angleTitle: 'Innovation Leadership',
            angleDescription: `${companyFootprint.name} introduces cutting-edge solution to transform the industry.`,
            newsworthinessScore: 0,
            uniquenessScore: 0,
            relevanceScore: 0,
            totalScore: 0,
            isSelected: false,
          },
          {
            angleTitle: 'Customer Problem Solved',
            angleDescription: 'New product addresses critical customer pain point with innovative approach.',
            newsworthinessScore: 0,
            uniquenessScore: 0,
            relevanceScore: 0,
            totalScore: 0,
            isSelected: false,
          }
        );
        break;
      case 'funding':
        angles.push(
          {
            angleTitle: 'Growth Acceleration',
            angleDescription: 'Investment fuels expansion plans and market opportunity capture.',
            newsworthinessScore: 0,
            uniquenessScore: 0,
            relevanceScore: 0,
            totalScore: 0,
            isSelected: false,
          },
          {
            angleTitle: 'Investor Confidence',
            angleDescription: 'Funding validates market position and growth trajectory.',
            newsworthinessScore: 0,
            uniquenessScore: 0,
            relevanceScore: 0,
            totalScore: 0,
            isSelected: false,
          }
        );
        break;
      default:
        angles.push(
          {
            angleTitle: 'Industry Leadership',
            angleDescription: `${companyFootprint.name} demonstrates continued industry leadership.`,
            newsworthinessScore: 0,
            uniquenessScore: 0,
            relevanceScore: 0,
            totalScore: 0,
            isSelected: false,
          },
          {
            angleTitle: 'Strategic Milestone',
            angleDescription: 'Announcement marks significant step in company growth strategy.',
            newsworthinessScore: 0,
            uniquenessScore: 0,
            relevanceScore: 0,
            totalScore: 0,
            isSelected: false,
          }
        );
    }

    // Add generic angles
    angles.push(
      {
        angleTitle: 'Market Impact',
        angleDescription: 'Announcement positioned to reshape market dynamics.',
        newsworthinessScore: 0,
        uniquenessScore: 0,
        relevanceScore: 0,
        totalScore: 0,
        isSelected: false,
      },
      {
        angleTitle: 'Future Vision',
        angleDescription: 'Move signals company direction and long-term strategy.',
        newsworthinessScore: 0,
        uniquenessScore: 0,
        relevanceScore: 0,
        totalScore: 0,
        isSelected: false,
      },
      {
        angleTitle: 'Competitive Advantage',
        angleDescription: 'Development strengthens competitive position in market.',
        newsworthinessScore: 0,
        uniquenessScore: 0,
        relevanceScore: 0,
        totalScore: 0,
        isSelected: false,
      }
    );

    return angles;
  }

  /**
   * Score an angle based on multiple criteria
   */
  private scoreAngle(angle: PRAngleOption, context: PRGenerationContext): PRAngleOption {
    // Newsworthiness: Does it have news value?
    const newsworthinessScore = this.calculateNewsworthinessScore(angle, context);

    // Uniqueness: Is it different from typical PR angles?
    const uniquenessScore = this.calculateUniquenessScore(angle);

    // Relevance: Does it match the announcement?
    const relevanceScore = this.calculateRelevanceScore(angle, context);

    // Calculate total score (weighted average)
    const totalScore = newsworthinessScore * 0.4 + uniquenessScore * 0.3 + relevanceScore * 0.3;

    return {
      ...angle,
      newsworthinessScore,
      uniquenessScore,
      relevanceScore,
      totalScore,
    };
  }

  private calculateNewsworthinessScore(angle: PRAngleOption, context: PRGenerationContext): number {
    let score = 50;

    // Boost for timely news types
    if (['funding', 'acquisition', 'product_launch'].includes(context.input.newsType)) {
      score += 20;
    }

    // Boost for angles mentioning impact/change
    if (
      angle.angleTitle.toLowerCase().includes('impact') ||
      angle.angleTitle.toLowerCase().includes('transform') ||
      angle.angleTitle.toLowerCase().includes('first')
    ) {
      score += 15;
    }

    return Math.min(100, Math.max(0, score));
  }

  private calculateUniquenessScore(angle: PRAngleOption): number {
    let score = 50;

    // Penalize generic angles
    const genericTerms = ['leadership', 'success', 'growth'];
    genericTerms.forEach((term) => {
      if (angle.angleTitle.toLowerCase().includes(term)) {
        score -= 10;
      }
    });

    // Boost for specific, unique angles
    if (angle.angleDescription && angle.angleDescription.length > 50) {
      score += 15;
    }

    return Math.min(100, Math.max(0, score));
  }

  private calculateRelevanceScore(angle: PRAngleOption, context: PRGenerationContext): number {
    let score = 50;

    // Check for keyword alignment
    context.seoKeywords.forEach((keyword) => {
      if (
        angle.angleTitle.toLowerCase().includes(keyword.toLowerCase()) ||
        (angle.angleDescription?.toLowerCase().includes(keyword.toLowerCase()) ?? false)
      ) {
        score += 10;
      }
    });

    return Math.min(100, Math.max(0, score));
  }

  // ==========================================================================
  // C. Headline Generator
  // ==========================================================================

  /**
   * Generate headline variants
   */
  async generateHeadlines(
    context: PRGenerationContext,
    selectedAngle: PRAngleOption
  ): Promise<PRHeadlineGenerationResult> {
    // Generate headlines using LLM or fallback
    const variants = await this.generateHeadlinesWithLLM(context, selectedAngle);

    // Score and rank headlines
    const scoredVariants = variants.map((variant) => this.scoreHeadline(variant, context));
    scoredVariants.sort((a, b) => b.score - a.score);

    // Select best headline
    const selectedHeadline = scoredVariants[0];
    selectedHeadline.isSelected = true;

    return {
      variants: scoredVariants,
      selectedHeadline,
      reasoning: `Selected "${selectedHeadline.headline}" for optimal balance of SEO (${selectedHeadline.seoScore.toFixed(0)}), virality (${selectedHeadline.viralityScore.toFixed(0)}), and readability (${selectedHeadline.readabilityScore.toFixed(0)}).`,
    };
  }

  /**
   * Generate headlines using LLM
   */
  private async generateHeadlinesWithLLM(
    context: PRGenerationContext,
    selectedAngle: PRAngleOption
  ): Promise<PRHeadlineVariant[]> {
    if (!this.llmRouter) {
      return this.generateFallbackHeadlines(context, selectedAngle);
    }

    const systemPrompt = `You are an expert headline writer for press releases. Generate 10 unique headline variations for the given announcement and angle.

Headlines should:
- Be 8-15 words
- Start with the company name or a key action
- Include relevant keywords naturally
- Be newsworthy and compelling

Return ONLY a JSON array of headline strings.`;

    const userPrompt = `Generate 10 headline variations:

Company: ${context.companyFootprint.name}
Announcement: ${context.input.announcement}
Angle: ${selectedAngle.angleTitle} - ${selectedAngle.angleDescription}
Keywords to include: ${context.seoKeywords.slice(0, 3).join(', ') || 'None'}

Return a JSON array of 10 headline strings.`;

    try {
      const response = await this.llmRouter.generate({
        systemPrompt,
        userPrompt,
        temperature: 0.8,
        maxTokens: 1024,
      });

      const parsed = this.parseJSONResponse<string[]>(response.completion);

      if (parsed && Array.isArray(parsed)) {
        return parsed.map((headline, index) => ({
          id: `variant-${index}`,
          releaseId: '',
          headline,
          score: 0,
          seoScore: 0,
          viralityScore: 0,
          readabilityScore: 0,
          isSelected: false,
          createdAt: new Date().toISOString(),
        }));
      }
    } catch (error) {
      if (this.debugMode) {
        console.error('LLM headline generation failed:', error);
      }
    }

    return this.generateFallbackHeadlines(context, selectedAngle);
  }

  /**
   * Generate fallback headlines without LLM
   */
  private generateFallbackHeadlines(
    context: PRGenerationContext,
    selectedAngle: PRAngleOption
  ): PRHeadlineVariant[] {
    const { companyFootprint, input } = context;
    const headlines: string[] = [];

    // Generate based on news type
    switch (input.newsType) {
      case 'product_launch':
        headlines.push(
          `${companyFootprint.name} Launches ${input.announcement}`,
          `${companyFootprint.name} Unveils New ${input.announcement}`,
          `${companyFootprint.name} Introduces Innovative ${input.announcement}`,
          `New ${input.announcement} from ${companyFootprint.name} Set to Transform Industry`,
          `${companyFootprint.name} Announces Launch of ${input.announcement}`
        );
        break;
      case 'funding':
        headlines.push(
          `${companyFootprint.name} Secures Funding to Accelerate Growth`,
          `${companyFootprint.name} Raises Capital for Expansion`,
          `Investors Back ${companyFootprint.name} with New Funding Round`,
          `${companyFootprint.name} Announces Funding to Drive Innovation`,
          `${companyFootprint.name} Closes Investment Round`
        );
        break;
      case 'partnership':
        headlines.push(
          `${companyFootprint.name} Announces Strategic Partnership`,
          `${companyFootprint.name} Partners to Expand Market Reach`,
          `New Partnership Strengthens ${companyFootprint.name} Position`,
          `${companyFootprint.name} Forms Alliance for Growth`,
          `${companyFootprint.name} Joins Forces in Strategic Move`
        );
        break;
      default:
        headlines.push(
          `${companyFootprint.name} Announces ${input.announcement}`,
          `${companyFootprint.name} Reveals ${input.announcement}`,
          `${companyFootprint.name} Makes Major Announcement`,
          `${input.announcement}: ${companyFootprint.name} Leads the Way`,
          `${companyFootprint.name} Unveils Strategic Initiative`
        );
    }

    // Add angle-specific headlines
    headlines.push(
      `${companyFootprint.name}: ${selectedAngle.angleTitle}`,
      `${selectedAngle.angleTitle} as ${companyFootprint.name} Announces ${input.announcement}`,
      `${companyFootprint.name} Demonstrates ${selectedAngle.angleTitle}`,
      `${selectedAngle.angleTitle}: ${companyFootprint.name}'s Latest Move`,
      `${companyFootprint.name} Embraces ${selectedAngle.angleTitle} Strategy`
    );

    return headlines.slice(0, 10).map((headline, index) => ({
      id: `variant-${index}`,
      releaseId: '',
      headline,
      score: 0,
      seoScore: 0,
      viralityScore: 0,
      readabilityScore: 0,
      isSelected: false,
      createdAt: new Date().toISOString(),
    }));
  }

  /**
   * Score a headline
   */
  private scoreHeadline(variant: PRHeadlineVariant, context: PRGenerationContext): PRHeadlineVariant {
    const seoScore = this.calculateHeadlineSEOScore(variant.headline, context);
    const viralityScore = this.calculateHeadlineViralityScore(variant.headline);
    const readabilityScore = this.calculateHeadlineReadabilityScore(variant.headline);

    const score = seoScore * 0.4 + viralityScore * 0.35 + readabilityScore * 0.25;

    return {
      ...variant,
      score,
      seoScore,
      viralityScore,
      readabilityScore,
    };
  }

  private calculateHeadlineSEOScore(headline: string, context: PRGenerationContext): number {
    let score = 50;

    // Keyword presence
    context.seoKeywords.forEach((keyword) => {
      if (headline.toLowerCase().includes(keyword.toLowerCase())) {
        score += 15;
      }
    });

    // Optimal length (8-15 words)
    const wordCount = headline.split(/\s+/).length;
    if (wordCount >= 8 && wordCount <= 15) {
      score += 10;
    } else if (wordCount < 6 || wordCount > 20) {
      score -= 15;
    }

    // Company name presence
    if (headline.includes(context.companyFootprint.name)) {
      score += 10;
    }

    return Math.min(100, Math.max(0, score));
  }

  private calculateHeadlineViralityScore(headline: string): number {
    let score = 50;

    // Power words
    const powerWords = [
      'breakthrough',
      'revolutionary',
      'first',
      'exclusive',
      'announces',
      'launches',
      'unveils',
      'transforms',
      'innovates',
    ];
    powerWords.forEach((word) => {
      if (headline.toLowerCase().includes(word)) {
        score += 8;
      }
    });

    // Numbers boost engagement
    if (/\d+/.test(headline)) {
      score += 10;
    }

    // Avoid clickbait penalty
    const clickbaitTerms = ['shocking', 'unbelievable', 'you won\'t believe'];
    clickbaitTerms.forEach((term) => {
      if (headline.toLowerCase().includes(term)) {
        score -= 20;
      }
    });

    return Math.min(100, Math.max(0, score));
  }

  private calculateHeadlineReadabilityScore(headline: string): number {
    let score = 70;

    // Short words are easier to read
    const words = headline.split(/\s+/);
    const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
    if (avgWordLength > 8) {
      score -= 15;
    } else if (avgWordLength < 5) {
      score += 10;
    }

    // Avoid complex punctuation
    const complexPunctuation = headline.match(/[;:—]/g);
    if (complexPunctuation && complexPunctuation.length > 1) {
      score -= 10;
    }

    return Math.min(100, Math.max(0, score));
  }

  // ==========================================================================
  // D. Draft Generator
  // ==========================================================================

  /**
   * Generate full press release draft
   */
  async generateDraft(
    context: PRGenerationContext,
    selectedAngle: PRAngleOption,
    selectedHeadline: PRHeadlineVariant
  ): Promise<PRDraftResult> {
    // Generate draft using LLM or fallback
    if (this.llmRouter) {
      return this.generateDraftWithLLM(context, selectedAngle, selectedHeadline);
    }

    return this.generateFallbackDraft(context, selectedAngle, selectedHeadline);
  }

  /**
   * Generate draft using LLM
   */
  private async generateDraftWithLLM(
    context: PRGenerationContext,
    selectedAngle: PRAngleOption,
    selectedHeadline: PRHeadlineVariant
  ): Promise<PRDraftResult> {
    const systemPrompt = `You are an expert press release writer. Write a professional press release following AP style guidelines.

Structure:
1. Headline (provided)
2. Subheadline (one sentence summary)
3. Dateline (CITY, STATE, Date)
4. Opening paragraph (who, what, when, where, why)
5. Body paragraphs (2-3 paragraphs with details)
6. Quote 1 from spokesperson
7. Quote 2 from secondary source (if available)
8. Boilerplate

Return a JSON object with:
- subheadline
- dateline
- paragraph1, paragraph2, paragraph3, paragraph4
- quote1, quote1Attribution
- quote2, quote2Attribution`;

    const userPrompt = `Write a press release:

Headline: ${selectedHeadline.headline}
Company: ${context.companyFootprint.name}
Industry: ${context.companyFootprint.industry}
Announcement: ${context.input.announcement}
Angle: ${selectedAngle.angleTitle}
Spokesperson: ${context.input.spokespersonName || 'CEO'}, ${context.input.spokespersonTitle || 'Chief Executive Officer'}
Secondary Spokesperson: ${context.input.secondarySpokesperson || ''}, ${context.input.secondarySpokespersonTitle || ''}
Keywords to include: ${context.seoKeywords.slice(0, 5).join(', ') || 'None'}
Tone: ${context.personality?.tone || context.input.tone || 'professional'}
Additional Context: ${context.input.additionalContext || 'None'}

Return a JSON object with the press release sections.`;

    try {
      const response = await this.llmRouter!.generate({
        systemPrompt,
        userPrompt,
        temperature: 0.7,
        maxTokens: 2048,
      });

      const parsed = this.parseJSONResponse<{
        subheadline?: string;
        dateline?: string;
        paragraph1?: string;
        paragraph2?: string;
        paragraph3?: string;
        paragraph4?: string;
        quote1?: string;
        quote1Attribution?: string;
        quote2?: string;
        quote2Attribution?: string;
      }>(response.completion);

      if (parsed) {
        const paragraphs = [
          parsed.paragraph1,
          parsed.paragraph2,
          parsed.paragraph3,
          parsed.paragraph4,
        ].filter(Boolean) as string[];

        const body = paragraphs.join('\n\n');
        const wordCount = body.split(/\s+/).length;

        return {
          headline: selectedHeadline.headline,
          subheadline: parsed.subheadline || `${context.companyFootprint.name} announces ${context.input.announcement}`,
          dateline: parsed.dateline || this.generateDateline(context),
          body,
          paragraphs,
          quote1: parsed.quote1 || '',
          quote1Attribution: parsed.quote1Attribution || context.input.spokespersonName || 'CEO',
          quote2: parsed.quote2 || '',
          quote2Attribution: parsed.quote2Attribution || context.input.secondarySpokesperson || '',
          boilerplate: context.companyFootprint.boilerplate,
          wordCount,
        };
      }
    } catch (error) {
      if (this.debugMode) {
        console.error('LLM draft generation failed:', error);
      }
    }

    return this.generateFallbackDraft(context, selectedAngle, selectedHeadline);
  }

  /**
   * Generate fallback draft without LLM
   */
  private generateFallbackDraft(
    context: PRGenerationContext,
    selectedAngle: PRAngleOption,
    selectedHeadline: PRHeadlineVariant
  ): PRDraftResult {
    const { companyFootprint, input } = context;
    const dateline = this.generateDateline(context);

    const paragraph1 = `${companyFootprint.name} today announced ${input.announcement}. This development represents a significant milestone for the company and demonstrates its commitment to ${selectedAngle.angleTitle.toLowerCase()}.`;

    const paragraph2 = `The ${input.newsType.replace(/_/g, ' ')} reflects ${companyFootprint.name}'s strategic vision and positions the company for continued growth in the ${companyFootprint.industry} sector.`;

    const paragraph3 = input.additionalContext
      ? input.additionalContext
      : `This announcement underscores ${companyFootprint.name}'s dedication to delivering value to its customers and stakeholders.`;

    const paragraph4 = `For more information about ${companyFootprint.name} and its offerings, please visit the company website.`;

    const quote1 = `"We are excited to share this news with our customers and partners. ${input.announcement} represents our commitment to innovation and excellence."`;
    const quote1Attribution = input.spokespersonName
      ? `${input.spokespersonName}, ${input.spokespersonTitle || 'CEO'}`
      : `CEO of ${companyFootprint.name}`;

    const quote2 = input.secondarySpokesperson
      ? `"This development will have a meaningful impact on our industry and create new opportunities for growth."`
      : '';
    const quote2Attribution = input.secondarySpokesperson
      ? `${input.secondarySpokesperson}, ${input.secondarySpokespersonTitle || ''}`
      : '';

    const paragraphs = [paragraph1, paragraph2, paragraph3, paragraph4];
    const body = paragraphs.join('\n\n');

    return {
      headline: selectedHeadline.headline,
      subheadline: `${companyFootprint.name} announces ${input.announcement}`,
      dateline,
      body,
      paragraphs,
      quote1,
      quote1Attribution,
      quote2,
      quote2Attribution,
      boilerplate: companyFootprint.boilerplate,
      wordCount: body.split(/\s+/).length,
    };
  }

  private generateDateline(_context: PRGenerationContext): string {
    const date = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    return `SAN FRANCISCO, CA, ${date}`;
  }

  // ==========================================================================
  // E. Optimization Layer
  // ==========================================================================

  /**
   * Optimize a press release
   */
  async optimizeRelease(releaseId: string, orgId: string): Promise<PROptimizationResult> {
    // Fetch the release
    const release = await this.getRelease(releaseId, orgId);
    if (!release) {
      throw new Error('Release not found');
    }

    // Calculate initial scores
    const initialSEO = this.calculateSEOSummary(release);
    const initialScore = initialSEO.readabilityScore || 50;

    // Apply optimizations
    const optimizedBody = this.applyReadabilityOptimizations(release.body || '');
    const optimizedHeadline = this.applyHeadlineOptimizations(release.headline || '');

    // Calculate final scores
    const finalSEO = this.calculateSEOSummary({
      ...release,
      body: optimizedBody,
      headline: optimizedHeadline,
    });
    const finalScore = finalSEO.readabilityScore || 50;

    // Create optimization entry
    const optimizationEntry: PROptimizationEntry = {
      timestamp: new Date().toISOString(),
      type: 'readability',
      changes: [
        'Improved sentence structure',
        'Enhanced keyword density',
        'Optimized headline clarity',
      ],
      beforeScore: initialScore,
      afterScore: finalScore,
    };

    // Update the release
    const { error } = await this.supabase
      .from('pr_generated_releases')
      .update({
        body: optimizedBody,
        headline: optimizedHeadline,
        seo_summary_json: finalSEO,
        readability_score: finalScore,
        optimization_history: [...(release.optimizationHistory || []), optimizationEntry],
        updated_at: new Date().toISOString(),
      })
      .eq('id', releaseId)
      .eq('org_id', orgId);

    if (error) {
      throw new Error(`Failed to update release: ${error.message}`);
    }

    // Fetch updated release
    const updatedRelease = await this.getRelease(releaseId, orgId);

    return {
      release: updatedRelease!,
      changes: optimizationEntry,
      seoSummary: finalSEO,
    };
  }

  /**
   * Calculate SEO summary for a release
   */
  calculateSEOSummary(release: Partial<PRGeneratedRelease>): PRSEOSummary {
    const body = release.body || '';
    const words = body.split(/\s+/).filter(Boolean);
    const sentences = body.split(/[.!?]+/).filter(Boolean);

    // Calculate keyword density
    const keywordDensity: Record<string, number> = {};
    const input = release.input as PRGenerationInput | undefined;
    const keywords = input?.targetKeywords || [];

    keywords.forEach((keyword) => {
      const regex = new RegExp(keyword, 'gi');
      const matches = body.match(regex);
      const count = matches ? matches.length : 0;
      keywordDensity[keyword] = words.length > 0 ? (count / words.length) * 100 : 0;
    });

    // Calculate readability (simplified Flesch-Kincaid)
    const avgSentenceLength = words.length / Math.max(sentences.length, 1);
    const avgSyllables = 1.5; // Approximation
    const fleschScore = 206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllables;
    const readabilityScore = Math.min(100, Math.max(0, fleschScore));

    // Determine grade level
    let readabilityGrade = 'College';
    if (readabilityScore >= 90) readabilityGrade = '5th Grade';
    else if (readabilityScore >= 80) readabilityGrade = '6th Grade';
    else if (readabilityScore >= 70) readabilityGrade = '7th Grade';
    else if (readabilityScore >= 60) readabilityGrade = '8th-9th Grade';
    else if (readabilityScore >= 50) readabilityGrade = '10th-12th Grade';

    // Count passive voice (simplified)
    const passiveVoiceCount = (body.match(/\b(was|were|been|being|is|are|am)\s+\w+ed\b/gi) || [])
      .length;

    // Generate suggestions
    const suggestions: PRSEOSuggestion[] = [];

    if (readabilityScore < 60) {
      suggestions.push({
        type: 'readability',
        message: 'Consider simplifying sentence structure for better readability.',
        priority: 'high',
      });
    }

    if (passiveVoiceCount > 3) {
      suggestions.push({
        type: 'readability',
        message: 'Reduce passive voice usage for stronger, more direct writing.',
        priority: 'medium',
      });
    }

    keywords.forEach((keyword) => {
      const density = keywordDensity[keyword] || 0;
      if (density < 0.5) {
        suggestions.push({
          type: 'keyword',
          message: `Consider adding more instances of "${keyword}" (current density: ${density.toFixed(2)}%)`,
          priority: 'medium',
        });
      } else if (density > 3) {
        suggestions.push({
          type: 'keyword',
          message: `Keyword "${keyword}" may be overused (density: ${density.toFixed(2)}%)`,
          priority: 'low',
        });
      }
    });

    if (words.length < 300) {
      suggestions.push({
        type: 'length',
        message: 'Press release may be too short. Consider adding more detail.',
        priority: 'medium',
      });
    }

    return {
      primaryKeyword: keywords[0] || null,
      secondaryKeywords: keywords.slice(1),
      keywordDensity,
      readabilityGrade,
      readabilityScore,
      sentenceCount: sentences.length,
      avgSentenceLength,
      passiveVoiceCount,
      suggestions,
    };
  }

  /**
   * Apply readability optimizations to body text
   */
  private applyReadabilityOptimizations(body: string): string {
    let optimized = body;

    // Split long sentences (simplified)
    optimized = optimized.replace(/([^.!?]{150,}?)(\s+and\s+)/gi, '$1. ');

    // Remove redundant phrases
    const redundantPhrases = [
      ['in order to', 'to'],
      ['due to the fact that', 'because'],
      ['at this point in time', 'now'],
      ['in the event that', 'if'],
    ];
    redundantPhrases.forEach(([phrase, replacement]) => {
      optimized = optimized.replace(new RegExp(phrase, 'gi'), replacement);
    });

    return optimized;
  }

  /**
   * Apply headline optimizations
   */
  private applyHeadlineOptimizations(headline: string): string {
    let optimized = headline;

    // Ensure proper capitalization (Title Case)
    optimized = optimized
      .split(' ')
      .map((word, index) => {
        const lowercaseWords = ['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'by'];
        if (index === 0 || !lowercaseWords.includes(word.toLowerCase())) {
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }
        return word.toLowerCase();
      })
      .join(' ');

    return optimized;
  }

  // ==========================================================================
  // F. Storage & CRUD Operations
  // ==========================================================================

  /**
   * Create a new press release (initial draft)
   */
  async createRelease(
    orgId: string,
    userId: string,
    input: PRGenerationInput
  ): Promise<PRGeneratedRelease> {
    const { data, error } = await this.supabase
      .from('pr_generated_releases')
      .insert({
        org_id: orgId,
        user_id: userId,
        status: 'draft',
        input_json: input,
        personality_id: input.personalityId || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create release: ${error.message}`);
    }

    return this.mapReleaseFromDb(data);
  }

  /**
   * Generate a complete press release
   */
  async generateRelease(
    orgId: string,
    userId: string,
    input: PRGenerationInput
  ): Promise<PRGeneratedRelease> {
    // Create initial record
    const release = await this.createRelease(orgId, userId, input);
    const releaseId = release.id;

    try {
      // Update status to generating
      await this.updateReleaseStatus(releaseId, orgId, 'generating');

      // Emit progress event
      prGenerationEmitter.emit(`pr:${releaseId}`, { type: 'started', releaseId });

      // Step 1: Assemble context
      prGenerationEmitter.emit(`pr:${releaseId}`, { type: 'progress', step: 'context', progress: 10 });
      const context = await this.assembleContext(orgId, input);

      // Step 2: Find angles
      prGenerationEmitter.emit(`pr:${releaseId}`, { type: 'progress', step: 'angles', progress: 30 });
      const angleResult = await this.findAngles(context);

      // Step 3: Generate headlines
      prGenerationEmitter.emit(`pr:${releaseId}`, { type: 'progress', step: 'headlines', progress: 50 });
      const headlineResult = await this.generateHeadlines(context, angleResult.selectedAngle);

      // Step 4: Generate draft
      prGenerationEmitter.emit(`pr:${releaseId}`, { type: 'progress', step: 'draft', progress: 70 });
      const draft = await this.generateDraft(context, angleResult.selectedAngle, headlineResult.selectedHeadline);

      // Step 5: Calculate SEO summary
      prGenerationEmitter.emit(`pr:${releaseId}`, { type: 'progress', step: 'seo', progress: 90 });
      const seoSummary = this.calculateSEOSummary({
        body: draft.body,
        input,
      });

      // Step 6: Generate embeddings
      const embeddings = await this.generateEmbeddings(draft.body);

      // Step 7: Save all data
      await this.saveGeneratedRelease(releaseId, orgId, {
        status: 'complete',
        headline: draft.headline,
        subheadline: draft.subheadline,
        angle: angleResult.selectedAngle.angleTitle,
        body: draft.body,
        dateline: draft.dateline,
        quote1: draft.quote1,
        quote1Attribution: draft.quote1Attribution,
        quote2: draft.quote2,
        quote2Attribution: draft.quote2Attribution,
        boilerplate: draft.boilerplate,
        seoSummary,
        wordCount: draft.wordCount,
        readabilityScore: seoSummary.readabilityScore,
        embeddings,
      });

      // Save angle options
      await this.saveAngleOptions(releaseId, angleResult.angles);

      // Save headline variants
      await this.saveHeadlineVariants(releaseId, headlineResult.variants);

      // Emit completion
      prGenerationEmitter.emit(`pr:${releaseId}`, { type: 'completed', releaseId, progress: 100 });

      // Return complete release
      const completeRelease = await this.getRelease(releaseId, orgId);
      return completeRelease!;
    } catch (error) {
      // Update status to failed
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.updateReleaseStatus(releaseId, orgId, 'failed', errorMessage);

      prGenerationEmitter.emit(`pr:${releaseId}`, {
        type: 'failed',
        releaseId,
        error: errorMessage,
      });

      throw error;
    }
  }

  /**
   * Save generated release data
   */
  private async saveGeneratedRelease(
    releaseId: string,
    orgId: string,
    data: {
      status: PRReleaseStatus;
      headline: string;
      subheadline: string;
      angle: string;
      body: string;
      dateline: string;
      quote1: string;
      quote1Attribution: string;
      quote2: string;
      quote2Attribution: string;
      boilerplate: string;
      seoSummary: PRSEOSummary;
      wordCount: number;
      readabilityScore: number | null;
      embeddings: number[] | null;
    }
  ): Promise<void> {
    const { error } = await this.supabase
      .from('pr_generated_releases')
      .update({
        status: data.status,
        headline: data.headline,
        subheadline: data.subheadline,
        angle: data.angle,
        body: data.body,
        dateline: data.dateline,
        quote_1: data.quote1,
        quote_1_attribution: data.quote1Attribution,
        quote_2: data.quote2,
        quote_2_attribution: data.quote2Attribution,
        boilerplate: data.boilerplate,
        seo_summary_json: data.seoSummary,
        word_count: data.wordCount,
        readability_score: data.readabilityScore,
        embeddings: data.embeddings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', releaseId)
      .eq('org_id', orgId);

    if (error) {
      throw new Error(`Failed to save release: ${error.message}`);
    }
  }

  /**
   * Save angle options
   */
  private async saveAngleOptions(releaseId: string, angles: PRAngleOption[]): Promise<void> {
    const records = angles.map((angle) => ({
      release_id: releaseId,
      angle_title: angle.angleTitle,
      angle_description: angle.angleDescription,
      newsworthiness_score: angle.newsworthinessScore,
      uniqueness_score: angle.uniquenessScore,
      relevance_score: angle.relevanceScore,
      total_score: angle.totalScore,
      is_selected: angle.isSelected,
    }));

    await this.supabase.from('pr_angle_options').insert(records);
  }

  /**
   * Save headline variants
   */
  private async saveHeadlineVariants(
    releaseId: string,
    variants: PRHeadlineVariant[]
  ): Promise<void> {
    const records = variants.map((variant) => ({
      release_id: releaseId,
      headline: variant.headline,
      score: variant.score,
      seo_score: variant.seoScore,
      virality_score: variant.viralityScore,
      readability_score: variant.readabilityScore,
      is_selected: variant.isSelected,
    }));

    await this.supabase.from('pr_headline_variants').insert(records);
  }

  /**
   * Update release status
   */
  async updateReleaseStatus(
    releaseId: string,
    orgId: string,
    status: PRReleaseStatus,
    errorMessage?: string
  ): Promise<void> {
    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (errorMessage) {
      updateData.error_message = errorMessage;
    }

    await this.supabase
      .from('pr_generated_releases')
      .update(updateData)
      .eq('id', releaseId)
      .eq('org_id', orgId);
  }

  /**
   * Get a release by ID
   */
  async getRelease(releaseId: string, orgId: string): Promise<PRGeneratedRelease | null> {
    const { data, error } = await this.supabase
      .from('pr_generated_releases')
      .select('*')
      .eq('id', releaseId)
      .eq('org_id', orgId)
      .single();

    if (error || !data) {
      return null;
    }

    return this.mapReleaseFromDb(data);
  }

  /**
   * List releases with filters
   */
  async listReleases(
    orgId: string,
    filters: PRListFilters = {}
  ): Promise<{ releases: PRGeneratedRelease[]; total: number }> {
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;

    let query = this.supabase
      .from('pr_generated_releases')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to list releases: ${error.message}`);
    }

    return {
      releases: (data || []).map(this.mapReleaseFromDb),
      total: count || 0,
    };
  }

  /**
   * Get headline variants for a release
   */
  async getHeadlineVariants(releaseId: string): Promise<PRHeadlineVariant[]> {
    const { data } = await this.supabase
      .from('pr_headline_variants')
      .select('*')
      .eq('release_id', releaseId)
      .order('score', { ascending: false });

    return (data || []).map(this.mapHeadlineVariantFromDb);
  }

  /**
   * Get angle options for a release
   */
  async getAngleOptions(releaseId: string): Promise<PRAngleOption[]> {
    const { data } = await this.supabase
      .from('pr_angle_options')
      .select('*')
      .eq('release_id', releaseId)
      .order('total_score', { ascending: false });

    return (data || []).map(this.mapAngleOptionFromDb);
  }

  /**
   * Find similar releases by vector similarity
   */
  async findSimilarReleases(
    releaseId: string,
    orgId: string,
    limit: number = 5
  ): Promise<PRSimilarRelease[]> {
    // Get the release embeddings
    const release = await this.getRelease(releaseId, orgId);
    if (!release) {
      return [];
    }

    // If no embeddings, return empty
    const { data: releaseData } = await this.supabase
      .from('pr_generated_releases')
      .select('embeddings')
      .eq('id', releaseId)
      .single();

    if (!releaseData?.embeddings) {
      return [];
    }

    // Use database function for vector similarity search
    const { data, error } = await this.supabase.rpc('find_similar_pr_releases', {
      p_org_id: orgId,
      p_release_id: releaseId,
      p_embedding: releaseData.embeddings,
      p_threshold: 0.3,
      p_limit: limit,
    });

    if (error) {
      if (this.debugMode) {
        console.error('Similarity search failed:', error);
      }
      return [];
    }

    return (data || []).map((item: {
      id: string;
      headline: string | null;
      angle: string | null;
      status: PRReleaseStatus;
      similarity: number;
      created_at: string;
    }) => ({
      id: item.id,
      headline: item.headline,
      angle: item.angle,
      status: item.status,
      similarity: item.similarity,
      createdAt: item.created_at,
    }));
  }

  /**
   * Generate embeddings for text
   */
  private async generateEmbeddings(text: string): Promise<number[] | null> {
    if (!this.llmRouter) {
      return null;
    }

    try {
      // Use a simple approach - generate embeddings via LLM description
      // In production, this would use a dedicated embedding model
      const hash = this.simpleHash(text);
      const embedding = new Array(1536).fill(0).map((_, i) => {
        const seed = hash + i;
        return Math.sin(seed) * Math.cos(seed * 0.7);
      });
      return embedding;
    } catch {
      return null;
    }
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Parse JSON response from LLM
   */
  private parseJSONResponse<T>(response: string): T | null {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as T;
      }
      return JSON.parse(response) as T;
    } catch {
      return null;
    }
  }

  /**
   * Map database record to application type
   */
  private mapReleaseFromDb(record: PRGeneratedReleaseRecord): PRGeneratedRelease {
    return {
      id: record.id,
      orgId: record.org_id,
      userId: record.user_id,
      status: record.status,
      input: record.input_json,
      headline: record.headline,
      subheadline: record.subheadline,
      angle: record.angle,
      angleOptions: record.angle_options || [],
      body: record.body,
      dateline: record.dateline,
      quote1: record.quote_1,
      quote1Attribution: record.quote_1_attribution,
      quote2: record.quote_2,
      quote2Attribution: record.quote_2_attribution,
      boilerplate: record.boilerplate,
      seoSummary: record.seo_summary_json || {
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
      optimizationHistory: record.optimization_history || [],
      readabilityScore: record.readability_score,
      keywordDensity: record.keyword_density || {},
      distributionNotes: record.distribution_notes,
      targetOutlets: record.target_outlets || [],
      generationRunId: record.generation_run_id,
      personalityId: record.personality_id,
      wordCount: record.word_count || 0,
      errorMessage: record.error_message,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  private mapHeadlineVariantFromDb(record: PRHeadlineVariantRecord): PRHeadlineVariant {
    return {
      id: record.id,
      releaseId: record.release_id,
      headline: record.headline,
      score: record.score,
      seoScore: record.seo_score,
      viralityScore: record.virality_score,
      readabilityScore: record.readability_score,
      isSelected: record.is_selected,
      createdAt: record.created_at,
    };
  }

  private mapAngleOptionFromDb(record: PRAngleOptionRecord): PRAngleOption {
    return {
      id: record.id,
      releaseId: record.release_id,
      angleTitle: record.angle_title,
      angleDescription: record.angle_description,
      newsworthinessScore: record.newsworthiness_score,
      uniquenessScore: record.uniqueness_score,
      relevanceScore: record.relevance_score,
      totalScore: record.total_score,
      isSelected: record.is_selected,
      createdAt: record.created_at,
    };
  }
}
