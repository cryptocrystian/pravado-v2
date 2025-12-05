/**
 * Brief Generator Service (Sprint S13)
 * Orchestrates AI-assisted content brief generation using:
 * - Playbook Runtime (S7+)
 * - Personality Engine (S11)
 * - Memory V2 (S10)
 * - Content Intelligence (S12)
 * - SEO Intelligence (S4-S5)
 */

import type {
  BriefGenerationInput,
  BriefGenerationResult,
  GeneratedBrief,
  ContentItem,
} from '@pravado/types';
import { LlmRouter, createLogger } from '@pravado/utils';
import type { SupabaseClient } from '@supabase/supabase-js';

import { BillingService } from './billingService';
import { ContentService } from './contentService';
import { PersonalityStore } from './personality/personalityStore';
import { SEOKeywordService } from './seoKeywordService';

const logger = createLogger('brief-generator-service');

export class BriefGeneratorService {
  private llmRouter: LlmRouter | null = null;

  constructor(
    private supabase: SupabaseClient,
    private billingService: BillingService,
    llmRouter?: LlmRouter
  ) {
    this.llmRouter = llmRouter || null;
  }

  /**
   * Generate a content brief using AI-assisted orchestration
   */
  async generateBrief(
    orgId: string,
    userId: string,
    input: BriefGenerationInput
  ): Promise<BriefGenerationResult> {
    // Sprint S29: Enforce billing quota before generating brief
    // Estimate: Brief generation typically uses ~10,000 tokens (context + generation)
    await this.billingService.enforceOrgQuotaOrThrow(orgId, {
      tokensToConsume: 10000,
    });

    // Step 1: Gather all context
    const context = await this.buildGenerationContext(orgId, userId, input);

    // Step 2: Run the brief generation playbook
    const playbookRun = await this.runBriefGenerationPlaybook(orgId, userId, context);

    // Step 3: Extract the generated brief from playbook output
    const generatedBrief = this.extractBriefFromPlaybookOutput(playbookRun.output);

    // Step 4: Save the generated brief
    const savedBrief = await this.saveBrief(orgId, {
      contentItemId: input.contentItemId || null,
      playbookRunId: playbookRun.id,
      brief: generatedBrief.brief,
      outline: generatedBrief.outline,
      seoContext: context.seoContext,
      personalityUsed: context.personality?.configuration || null,
    });

    return {
      runId: playbookRun.id,
      generatedBriefId: savedBrief.id,
      brief: generatedBrief.brief,
      outline: generatedBrief.outline,
      seoContext: context.seoContext,
    };
  }

  /**
   * Get a generated brief by ID
   */
  async getGeneratedBrief(orgId: string, id: string): Promise<GeneratedBrief | null> {
    const { data, error } = await this.supabase
      .from('content_generated_briefs')
      .select('*')
      .eq('id', id)
      .eq('org_id', orgId)
      .single();

    if (error || !data) {
      return null;
    }

    return this.mapGeneratedBriefFromDb(data);
  }

  /**
   * List generated briefs for an org
   */
  async listGeneratedBriefs(
    orgId: string,
    filters: {
      limit?: number;
      offset?: number;
      contentItemId?: string;
    }
  ): Promise<GeneratedBrief[]> {
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;

    let query = this.supabase
      .from('content_generated_briefs')
      .select('*')
      .eq('org_id', orgId);

    if (filters.contentItemId) {
      query = query.eq('content_item_id', filters.contentItemId);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error || !data) {
      return [];
    }

    return data.map((item) => this.mapGeneratedBriefFromDb(item));
  }

  // ========================================
  // PRIVATE METHODS - CONTEXT BUILDING
  // ========================================

  /**
   * Build comprehensive generation context
   */
  private async buildGenerationContext(
    orgId: string,
    _userId: string,
    input: BriefGenerationInput
  ): Promise<{
    contentItem: ContentItem | null;
    seoContext: Record<string, unknown>;
    memoryContext: Record<string, unknown>;
    contentContext: Record<string, unknown>;
    personality: { configuration: Record<string, unknown> } | null;
    targetKeyword: string | null;
    targetIntent: string | null;
  }> {
    // Parallel fetch of all context data
    const [contentItem, seoContext, memoryContext, contentContext, personality] =
      await Promise.all([
        this.getContentItem(orgId, input.contentItemId),
        this.assembleSEOContext(orgId, input.targetKeyword, input.targetIntent),
        this.assembleMemoryContext(orgId, _userId),
        this.assembleContentContext(orgId),
        this.getPersonality(orgId, input.personalityId),
      ]);

    return {
      contentItem,
      seoContext,
      memoryContext,
      contentContext,
      personality,
      targetKeyword: input.targetKeyword || null,
      targetIntent: input.targetIntent || null,
    };
  }

  /**
   * Get content item if provided
   */
  private async getContentItem(
    orgId: string,
    contentItemId?: string
  ): Promise<ContentItem | null> {
    if (!contentItemId) {
      return null;
    }

    const contentService = new ContentService(this.supabase);
    return contentService.getContentItemById(orgId, contentItemId);
  }

  /**
   * Assemble SEO context (keywords, SERP data, opportunities)
   */
  private async assembleSEOContext(
    orgId: string,
    targetKeyword?: string,
    targetIntent?: string
  ): Promise<Record<string, unknown>> {
    const seoKeywordService = new SEOKeywordService(this.supabase);

    // Get related keywords
    const keywords = await seoKeywordService.listKeywords(orgId, {
      q: targetKeyword,
      intent: targetIntent as any,
      page: 1,
      pageSize: 10,
    });

    // Get top opportunities
    const { data: opportunitiesData } = await this.supabase
      .from('seo_opportunities')
      .select('*')
      .eq('org_id', orgId)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(5);

    return {
      targetKeyword: targetKeyword || null,
      targetIntent: targetIntent || null,
      relatedKeywords: keywords.items.map((kw) => ({
        keyword: kw.keyword.keyword,
        searchVolume: kw.metrics?.searchVolume || null,
        difficulty: kw.metrics?.difficulty || null,
        intent: kw.keyword.intent,
      })),
      opportunities: (opportunitiesData || []).map((opp) => ({
        type: opp.opportunity_type,
        title: opp.title,
        priority: opp.priority,
      })),
    };
  }

  /**
   * Assemble memory context (recent interactions, preferences)
   */
  private async assembleMemoryContext(
    _orgId: string,
    _userId: string
  ): Promise<Record<string, unknown>> {
    // V1: Stub - return empty memory context
    // Future: Use MemoryStore to fetch recent interactions
    // const memoryStore = new MemoryStore(this.supabase);
    // const recentMemories = await memoryStore.getMemoriesByEntity('org', _orgId);

    return {
      recentInteractions: [],
      contentPreferences: {
        preferredTone: null,
        preferredLength: null,
        preferredFormat: null,
      },
    };
  }

  /**
   * Assemble content context (recent content, clusters, gaps)
   */
  private async assembleContentContext(orgId: string): Promise<Record<string, unknown>> {
    const contentService = new ContentService(this.supabase);

    // Get recent content items
    const recentContent = await contentService.listContentItems(orgId, {
      page: 1,
      pageSize: 5,
    });

    // Get content clusters
    const clusters = await contentService.listContentClusters(orgId);

    // Get content gaps
    const gaps = await contentService.listContentGaps(orgId, { limit: 5 });

    return {
      recentContent: recentContent.items.map((item) => ({
        title: item.title,
        type: item.contentType,
        wordCount: item.wordCount,
      })),
      clusters: clusters.map((cluster) => ({
        name: cluster.cluster.name,
        topicCount: cluster.topics.length,
      })),
      gaps: gaps.map((gap) => ({
        keyword: gap.keyword,
        score: gap.seoOpportunityScore,
      })),
    };
  }

  /**
   * Get personality profile
   */
  private async getPersonality(
    orgId: string,
    personalityId?: string
  ): Promise<{ configuration: Record<string, unknown> } | null> {
    const personalityStore = new PersonalityStore(this.supabase);

    let personality;
    if (personalityId) {
      personality = await personalityStore.getPersonality(orgId, personalityId);
    } else {
      // Get default personality for content generation
      const personalities = await personalityStore.listPersonalities(orgId, 50, 0);

      // Filter for personalities tagged with 'content' or 'writing'
      const contentPersonalities = personalities.filter(
        (p) => p.slug.includes('content') || p.slug.includes('writer')
      );

      personality = contentPersonalities.length > 0 ? contentPersonalities[0] : null;
    }

    // Cast AgentPersonality to our simplified type
    return personality
      ? {
          configuration: personality.configuration as unknown as Record<string, unknown>,
        }
      : null;
  }


  // ========================================
  // PRIVATE METHODS - PLAYBOOK EXECUTION
  // ========================================

  /**
   * Run the brief generation playbook
   */
  private async runBriefGenerationPlaybook(
    orgId: string,
    userId: string,
    context: Record<string, unknown>
  ): Promise<{ id: string; output: Record<string, unknown> }> {
    // Build the playbook input
    const playbookInput = this.buildPlaybookInput(context);

    // Execute the CONTENT_BRIEF_GENERATION_V1 playbook
    // In S13, we manually create the run since the playbook doesn't exist in DB yet
    const { data: run, error: runError } = await this.supabase
      .from('playbook_runs')
      .insert({
        playbook_id: 'CONTENT_BRIEF_GENERATION_V1',
        org_id: orgId,
        status: 'RUNNING',
        triggered_by: userId,
        input: playbookInput,
        is_simulation: true,
      })
      .select()
      .single();

    if (runError || !run) {
      throw new Error(`Failed to create playbook run: ${runError?.message}`);
    }

    // For S13, we simulate playbook completion with stub data
    // In S16, updated to use LLM when available with fallback to stub
    const simulatedOutput = await this.generateStubBriefOutput(context);

    // Update run with completion
    await this.supabase
      .from('playbook_runs')
      .update({
        status: 'COMPLETED',
        output: simulatedOutput,
        completed_at: new Date().toISOString(),
      })
      .eq('id', run.id);

    return {
      id: run.id,
      output: simulatedOutput,
    };
  }

  /**
   * Build playbook input from context
   */
  private buildPlaybookInput(context: any): Record<string, unknown> {
    return {
      targetKeyword: context.targetKeyword,
      targetIntent: context.targetIntent,
      contentItem: context.contentItem
        ? {
            title: context.contentItem.title,
            type: context.contentItem.contentType,
            wordCount: context.contentItem.wordCount,
          }
        : null,
      seoContext: context.seoContext,
      memoryContext: context.memoryContext,
      contentContext: context.contentContext,
      personality: context.personality
        ? {
            tone: context.personality.tone,
            style: context.personality.style,
          }
        : null,
    };
  }

  /**
   * Generate outline using LLM (S16)
   */
  private async generateOutlineWithLLM(context: any): Promise<Record<string, unknown> | null> {
    if (!this.llmRouter) {
      return null;
    }

    const keyword = context.targetKeyword || 'content strategy';
    const intent = context.targetIntent || 'informational';

    // Build system prompt
    const systemPrompt = this.buildOutlineSystemPrompt(context);

    // Build user prompt
    const userPrompt = `Generate a content outline for the following:

Target Keyword: ${keyword}
Search Intent: ${intent}

SEO Context:
${JSON.stringify(context.seoContext, null, 2)}

Content Context:
${JSON.stringify(context.contentContext, null, 2)}

Please provide a JSON response with the following structure:
{
  "title": "Article title",
  "sections": [
    {
      "heading": "Section heading",
      "description": "Brief description of what this section covers",
      "wordCount": 200
    }
  ],
  "estimatedWordCount": 1500
}`;

    try {
      const response = await this.llmRouter.generate({
        systemPrompt,
        userPrompt,
        temperature: 0.7,
      });

      // Parse JSON response
      const outline = JSON.parse(response.completion);
      logger.info('Generated outline using LLM', { provider: response.provider });

      return { outline };
    } catch (error) {
      logger.warn('Failed to generate outline with LLM, will use stub', { error });
      return null;
    }
  }

  /**
   * Generate brief using LLM (S16)
   */
  private async generateBriefWithLLM(
    context: any,
    outline: Record<string, unknown>
  ): Promise<Record<string, unknown> | null> {
    if (!this.llmRouter) {
      return null;
    }

    const keyword = context.targetKeyword || 'content strategy';
    const intent = context.targetIntent || 'informational';

    // Build system prompt
    const systemPrompt = this.buildBriefSystemPrompt(context);

    // Build user prompt
    const userPrompt = `Generate a comprehensive content brief for the following:

Target Keyword: ${keyword}
Search Intent: ${intent}

Outline:
${JSON.stringify(outline, null, 2)}

SEO Context:
${JSON.stringify(context.seoContext, null, 2)}

Please provide a JSON response with the following structure:
{
  "title": "Article title",
  "targetKeyword": "${keyword}",
  "targetIntent": "${intent}",
  "targetAudience": "Description of target audience",
  "tone": "professional/casual/authoritative/etc",
  "minWordCount": 1500,
  "maxWordCount": 2500,
  "outline": {
    "introduction": {
      "hook": "Opening hook",
      "context": "Context setting",
      "thesis": "Main thesis"
    },
    "mainSections": [
      {
        "title": "Section title",
        "keyPoints": ["point 1", "point 2", "point 3"]
      }
    ],
    "conclusion": {
      "summary": "Summary points",
      "cta": "Call to action"
    }
  },
  "seoGuidelines": {
    "primaryKeyword": "${keyword}",
    "secondaryKeywords": ["keyword1", "keyword2"],
    "metaDescription": "Meta description",
    "targetSearchVolume": 1000
  },
  "createdBy": "AI Brief Generator V1",
  "createdAt": "${new Date().toISOString()}"
}`;

    try {
      const response = await this.llmRouter.generate({
        systemPrompt,
        userPrompt,
        temperature: 0.7,
      });

      // Parse JSON response
      const brief = JSON.parse(response.completion);
      logger.info('Generated brief using LLM', { provider: response.provider });

      return { brief };
    } catch (error) {
      logger.warn('Failed to generate brief with LLM, will use stub', { error });
      return null;
    }
  }

  /**
   * Build system prompt for outline generation
   */
  private buildOutlineSystemPrompt(context: any): string {
    const personality = context.personality?.configuration;
    const tone = personality?.tone || 'professional';
    const style = personality?.style || 'clear and informative';

    return `You are an expert content strategist and SEO specialist. Your role is to create comprehensive content outlines that balance user intent with search engine optimization.

Personality and Style:
- Tone: ${tone}
- Writing Style: ${style}

Your outlines should:
1. Directly address the user's search intent
2. Include strategic keyword placement opportunities
3. Follow logical information architecture
4. Balance depth with readability
5. Consider the target audience's knowledge level

Always respond with valid JSON matching the requested structure.`;
  }

  /**
   * Build system prompt for brief generation
   */
  private buildBriefSystemPrompt(context: any): string {
    const personality = context.personality?.configuration;
    const tone = personality?.tone || 'professional';
    const style = personality?.style || 'clear and informative';

    return `You are an expert content strategist and brief writer. Your role is to create detailed content briefs that guide writers to produce high-quality, SEO-optimized content.

Personality and Style:
- Tone: ${tone}
- Writing Style: ${style}

Your briefs should:
1. Provide clear direction for content creation
2. Include specific SEO guidelines
3. Define target audience and their needs
4. Outline key talking points and structure
5. Set appropriate word count targets
6. Include actionable writing guidelines

Always respond with valid JSON matching the requested structure.`;
  }

  /**
   * Generate stub brief output (S13 - deterministic for testing)
   * Updated in S16 to use LLM when available, with fallback to stub
   */
  private async generateStubBriefOutput(context: any): Promise<Record<string, unknown>> {
    const keyword = context.targetKeyword || 'content strategy';
    const intent = context.targetIntent || 'informational';

    // Step 1: Try to generate outline with LLM
    let outlineOutput = await this.generateOutlineWithLLM(context);

    // Fallback to stub outline if LLM failed
    if (!outlineOutput) {
      outlineOutput = {
        outline: {
          title: `Complete Guide to ${keyword}`,
          sections: [
            {
              heading: 'Introduction',
              description: `Overview of ${keyword} and its importance`,
              wordCount: 200,
            },
            {
              heading: `Understanding ${keyword}`,
              description: 'Core concepts and fundamentals',
              wordCount: 500,
            },
            {
              heading: 'Best Practices',
              description: 'Proven strategies and techniques',
              wordCount: 600,
            },
            {
              heading: 'Common Mistakes',
              description: 'Pitfalls to avoid',
              wordCount: 400,
            },
            {
              heading: 'Conclusion',
              description: 'Summary and next steps',
              wordCount: 200,
            },
          ],
          estimatedWordCount: 1900,
        },
      };
    }

    // Step 2: Try to generate brief with LLM
    let briefOutput = await this.generateBriefWithLLM(
      context,
      outlineOutput.outline as Record<string, unknown>
    );

    // Fallback to stub brief if LLM failed
    if (!briefOutput) {
      briefOutput = {
        brief: {
          title: `Complete Guide to ${keyword}`,
          targetKeyword: keyword,
          targetIntent: intent,
          targetAudience: 'Marketing professionals and content creators',
          tone: context.personality?.configuration?.tone || 'professional',
          minWordCount: 1500,
          maxWordCount: 2500,
          outline: {
            introduction: {
              hook: `${keyword} has become essential in modern digital strategy`,
              context: 'Industry evolution and current landscape',
              thesis: 'Master these proven approaches to succeed',
            },
            mainSections: [
              {
                title: `Understanding ${keyword}`,
                keyPoints: [
                  'Core definitions and terminology',
                  'Historical context and evolution',
                  'Current industry standards',
                ],
              },
              {
                title: 'Best Practices',
                keyPoints: [
                  'Research-backed strategies',
                  'Implementation frameworks',
                  'Measurement and optimization',
                ],
              },
              {
                title: 'Common Mistakes',
                keyPoints: [
                  'Misconceptions to avoid',
                  'Tactical errors and fixes',
                  'Strategic pitfalls',
                ],
              },
            ],
            conclusion: {
              summary: 'Key takeaways and action items',
              cta: 'Next steps for implementation',
            },
          },
          seoGuidelines: {
            primaryKeyword: keyword,
            secondaryKeywords:
              context.seoContext.relatedKeywords?.slice(0, 5).map((kw: any) => kw.keyword) || [],
            metaDescription: `Learn everything about ${keyword}. Discover best practices, avoid common mistakes, and implement proven strategies.`,
            targetSearchVolume: context.seoContext.relatedKeywords?.[0]?.searchVolume || null,
          },
          createdBy: 'AI Brief Generator V1',
          createdAt: new Date().toISOString(),
        },
      };
    }

    return {
      steps: {
        GATHER_CONTEXT: {
          status: 'COMPLETED',
          output: {
            seoSignals: context.seoContext,
            contentSignals: context.contentContext,
            memorySignals: context.memoryContext,
          },
        },
        GENERATE_OUTLINE: {
          status: 'COMPLETED',
          output: outlineOutput,
        },
        GENERATE_BRIEF: {
          status: 'COMPLETED',
          output: briefOutput,
        },
      },
    };
  }

  /**
   * Extract brief from playbook output
   */
  private extractBriefFromPlaybookOutput(output: Record<string, unknown>): {
    brief: Record<string, unknown>;
    outline: Record<string, unknown>;
  } {
    const steps = output.steps as any;

    return {
      brief: steps.GENERATE_BRIEF?.output?.brief || {},
      outline: steps.GENERATE_OUTLINE?.output?.outline || {},
    };
  }

  // ========================================
  // PRIVATE METHODS - PERSISTENCE
  // ========================================

  /**
   * Save generated brief to database
   */
  private async saveBrief(
    orgId: string,
    data: {
      contentItemId: string | null;
      playbookRunId: string | null;
      brief: Record<string, unknown>;
      outline: Record<string, unknown>;
      seoContext: Record<string, unknown>;
      personalityUsed: Record<string, unknown> | null;
    }
  ): Promise<GeneratedBrief> {
    const { data: savedData, error } = await this.supabase
      .from('content_generated_briefs')
      .insert({
        org_id: orgId,
        content_item_id: data.contentItemId,
        playbook_run_id: data.playbookRunId,
        brief: data.brief,
        outline: data.outline,
        seo_context: data.seoContext,
        personality_used: data.personalityUsed,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save generated brief: ${error.message}`);
    }

    return this.mapGeneratedBriefFromDb(savedData);
  }

  /**
   * Map database record to GeneratedBrief type
   */
  private mapGeneratedBriefFromDb(data: any): GeneratedBrief {
    return {
      id: data.id,
      orgId: data.org_id,
      contentItemId: data.content_item_id,
      playbookRunId: data.playbook_run_id,
      brief: data.brief,
      outline: data.outline,
      seoContext: data.seo_context,
      personalityUsed: data.personality_used,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}
