/**
 * Media Briefing Service (Sprint S54)
 *
 * Comprehensive service for AI-powered media briefing generation including:
 * - Briefing CRUD operations
 * - Section management
 * - Source reference management
 * - Talking point CRUD and generation
 * - LLM-driven content generation
 * - Intelligence context assembly from S38-S53
 * - Audit logging for all generation events
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  MediaBriefing,
  BriefingSection,
  SourceReference,
  TalkingPoint,
  BriefingSectionType,
  TalkingPointCategory,
  InsightStrength,
  BriefFormatType,
  BriefingStatus,
  BriefingSourceType,
  CreateBriefingRequest,
  UpdateBriefingRequest,
  GenerateBriefingRequest,
  RegenerateSectionRequest,
  CreateTalkingPointRequest,
  UpdateTalkingPointRequest,
  GenerateTalkingPointsRequest,
  UpdateSectionRequest,
  BriefingFilters,
  TalkingPointFilters,
  GetBriefingsResponse,
  GetTalkingPointsResponse,
  BriefingGenerationResponse,
  SectionRegenerationResponse,
  TalkingPointsGenerationResponse,
  BriefingIntelligenceContext,
  BriefingKeyTakeaway,
  SectionBulletPoint,
  TalkingPointFact,
  SECTION_TYPE_CONFIGS,
} from '@pravado/types';
import { LlmRouter, createLogger } from '@pravado/utils';

const logger = createLogger('media-briefing-service');

// ============================================================================
// LLM PROMPTS
// ============================================================================

const BRIEFING_SYSTEM_PROMPT = `You are an expert PR and communications strategist helping executives prepare for media interactions. Generate professional, actionable content based on the intelligence provided. Be concise and strategic.`;

const SECTION_PROMPTS: Record<BriefingSectionType, string> = {
  [BriefingSectionType.EXECUTIVE_SUMMARY]: `Generate a concise executive summary (2-3 paragraphs) that highlights:
1. Key context and timing
2. Main objectives of this media engagement
3. Critical points to remember
Be direct and executive-friendly.`,

  [BriefingSectionType.KEY_MESSAGES]: `Generate 3-5 key messages that the executive should communicate. Each message should:
1. Be memorable and quotable
2. Support the overall narrative
3. Address likely audience concerns
Format as clear, punchy statements.`,

  [BriefingSectionType.MEDIA_LANDSCAPE]: `Analyze the current media landscape based on the intelligence provided:
1. Recent coverage trends
2. Key journalists and outlets to be aware of
3. Sentiment patterns
4. Potential angles media might pursue`,

  [BriefingSectionType.COMPETITIVE_ANALYSIS]: `Provide competitive intelligence summary:
1. Key competitor activity
2. Comparative positioning
3. Differentiation opportunities
4. Threats to address`,

  [BriefingSectionType.JOURNALIST_INTELLIGENCE]: `Summarize relevant journalist intelligence:
1. Key journalist profiles and interests
2. Recent coverage patterns
3. Relationship status
4. Approach recommendations`,

  [BriefingSectionType.AUDIENCE_INSIGHTS]: `Provide audience analysis:
1. Target persona characteristics
2. Key concerns and interests
3. Message resonance factors
4. Engagement recommendations`,

  [BriefingSectionType.PERFORMANCE_METRICS]: `Summarize recent media performance:
1. Key metrics and trends
2. Notable achievements
3. Areas for improvement
4. Benchmark comparisons`,

  [BriefingSectionType.RECOMMENDED_ACTIONS]: `Provide strategic recommendations:
1. Immediate action items
2. Talking point priorities
3. Opportunities to leverage
4. Risks to mitigate`,

  [BriefingSectionType.QA_PREPARATION]: `Generate anticipated Q&A preparation:
1. Likely questions from media
2. Recommended responses
3. Bridge statements for difficult topics
4. Key facts to reference`,

  [BriefingSectionType.APPENDIX]: `Compile supporting materials summary:
1. Reference documents
2. Data sources used
3. Contact information
4. Additional resources`,
};

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class MediaBriefingService {
  private llmRouter: LlmRouter | null = null;

  constructor(
    private supabase: SupabaseClient,
    llmRouter?: LlmRouter
  ) {
    this.llmRouter = llmRouter || null;
  }

  // =========================================================================
  // BRIEFING CRUD
  // =========================================================================

  /**
   * Create a new media briefing
   */
  async createBriefing(
    orgId: string,
    userId: string,
    data: CreateBriefingRequest
  ): Promise<MediaBriefing> {
    const row = {
      org_id: orgId,
      title: data.title,
      subtitle: data.subtitle || null,
      format: data.format || BriefFormatType.FULL_BRIEF,
      status: BriefingStatus.DRAFT,
      story_id: data.storyId || null,
      journalist_ids: data.journalistIds || [],
      outlet_ids: data.outletIds || [],
      persona_ids: data.personaIds || [],
      competitor_ids: data.competitorIds || [],
      tone: data.tone || 'professional',
      focus_areas: data.focusAreas || [],
      excluded_topics: data.excludedTopics || [],
      custom_instructions: data.customInstructions || null,
      key_takeaways: [],
      generated_insights: [],
      created_by: userId,
    };

    const { data: briefing, error } = await this.supabase
      .from('media_briefings')
      .insert(row)
      .select()
      .single();

    if (error) throw new Error(`Failed to create briefing: ${error.message}`);

    await this.logAuditEvent(orgId, userId, briefing.id, null, null, 'create', {
      title: data.title,
      format: data.format,
    });

    return this.mapBriefingFromDb(briefing);
  }

  /**
   * Get single briefing by ID
   */
  async getBriefing(orgId: string, briefingId: string): Promise<MediaBriefing> {
    const { data: briefing, error } = await this.supabase
      .from('media_briefings')
      .select('*')
      .eq('id', briefingId)
      .eq('org_id', orgId)
      .single();

    if (error || !briefing) {
      throw new Error(`Briefing not found: ${briefingId}`);
    }

    // Load sections
    const { data: sections } = await this.supabase
      .from('media_briefing_sections')
      .select('*')
      .eq('briefing_id', briefingId)
      .order('order_index', { ascending: true });

    // Load talking points
    const { data: talkingPoints } = await this.supabase
      .from('media_talking_points')
      .select('*')
      .eq('briefing_id', briefingId)
      .order('priority_score', { ascending: false });

    // Load sources
    const { data: sources } = await this.supabase
      .from('media_briefing_sources')
      .select('*')
      .eq('briefing_id', briefingId);

    const mapped = this.mapBriefingFromDb(briefing);
    mapped.sections = sections?.map((s) => this.mapSectionFromDb(s)) || [];
    mapped.talkingPoints = talkingPoints?.map((t) => this.mapTalkingPointFromDb(t)) || [];
    mapped.sources = sources?.map((s) => this.mapSourceFromDb(s)) || [];

    return mapped;
  }

  /**
   * Get briefings with filters and pagination
   */
  async getBriefings(
    orgId: string,
    filters: BriefingFilters = {},
    limit: number = 20,
    offset: number = 0
  ): Promise<GetBriefingsResponse> {
    let query = this.supabase
      .from('media_briefings')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId);

    // Apply filters
    if (filters.format) query = query.eq('format', filters.format);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.storyId) query = query.eq('story_id', filters.storyId);
    if (filters.createdBy) query = query.eq('created_by', filters.createdBy);
    if (filters.createdStart) query = query.gte('created_at', filters.createdStart.toISOString());
    if (filters.createdEnd) query = query.lte('created_at', filters.createdEnd.toISOString());
    if (filters.searchQuery) {
      query = query.or(`title.ilike.%${filters.searchQuery}%,subtitle.ilike.%${filters.searchQuery}%`);
    }
    if (filters.journalistId) query = query.contains('journalist_ids', [filters.journalistId]);
    if (filters.personaId) query = query.contains('persona_ids', [filters.personaId]);
    if (filters.competitorId) query = query.contains('competitor_ids', [filters.competitorId]);

    // Pagination
    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data: briefings, count, error } = await query;

    if (error) throw new Error(`Failed to fetch briefings: ${error.message}`);

    return {
      briefings: briefings?.map((b) => this.mapBriefingFromDb(b)) || [],
      total: count || 0,
      limit,
      offset,
    };
  }

  /**
   * Update existing briefing
   */
  async updateBriefing(
    orgId: string,
    userId: string,
    briefingId: string,
    data: UpdateBriefingRequest
  ): Promise<MediaBriefing> {
    const updates: any = {};
    if (data.title !== undefined) updates.title = data.title;
    if (data.subtitle !== undefined) updates.subtitle = data.subtitle;
    if (data.format !== undefined) updates.format = data.format;
    if (data.status !== undefined) updates.status = data.status;
    if (data.storyId !== undefined) updates.story_id = data.storyId;
    if (data.journalistIds !== undefined) updates.journalist_ids = data.journalistIds;
    if (data.outletIds !== undefined) updates.outlet_ids = data.outletIds;
    if (data.personaIds !== undefined) updates.persona_ids = data.personaIds;
    if (data.competitorIds !== undefined) updates.competitor_ids = data.competitorIds;
    if (data.tone !== undefined) updates.tone = data.tone;
    if (data.focusAreas !== undefined) updates.focus_areas = data.focusAreas;
    if (data.excludedTopics !== undefined) updates.excluded_topics = data.excludedTopics;
    if (data.customInstructions !== undefined) updates.custom_instructions = data.customInstructions;
    if (data.executiveSummary !== undefined) updates.executive_summary = data.executiveSummary;

    const { data: briefing, error } = await this.supabase
      .from('media_briefings')
      .update(updates)
      .eq('id', briefingId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update briefing: ${error.message}`);

    await this.logAuditEvent(orgId, userId, briefingId, null, null, 'update', { updates: Object.keys(updates) });

    return this.mapBriefingFromDb(briefing);
  }

  /**
   * Delete briefing
   */
  async deleteBriefing(orgId: string, userId: string, briefingId: string): Promise<void> {
    await this.logAuditEvent(orgId, userId, briefingId, null, null, 'delete', {});

    const { error } = await this.supabase
      .from('media_briefings')
      .delete()
      .eq('id', briefingId)
      .eq('org_id', orgId);

    if (error) throw new Error(`Failed to delete briefing: ${error.message}`);
  }

  /**
   * Review briefing
   */
  async reviewBriefing(
    orgId: string,
    userId: string,
    briefingId: string
  ): Promise<MediaBriefing> {
    const { data: briefing, error } = await this.supabase
      .from('media_briefings')
      .update({
        status: BriefingStatus.REVIEWED,
        reviewed_by: userId,
        reviewed_at: new Date(),
      })
      .eq('id', briefingId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) throw new Error(`Failed to review briefing: ${error.message}`);

    await this.logAuditEvent(orgId, userId, briefingId, null, null, 'review', {});

    return this.mapBriefingFromDb(briefing);
  }

  /**
   * Approve briefing
   */
  async approveBriefing(
    orgId: string,
    userId: string,
    briefingId: string
  ): Promise<MediaBriefing> {
    const { data: briefing, error } = await this.supabase
      .from('media_briefings')
      .update({
        status: BriefingStatus.APPROVED,
        approved_by: userId,
        approved_at: new Date(),
      })
      .eq('id', briefingId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) throw new Error(`Failed to approve briefing: ${error.message}`);

    await this.logAuditEvent(orgId, userId, briefingId, null, null, 'approve', {});

    return this.mapBriefingFromDb(briefing);
  }

  /**
   * Archive briefing
   */
  async archiveBriefing(
    orgId: string,
    userId: string,
    briefingId: string
  ): Promise<MediaBriefing> {
    const { data: briefing, error } = await this.supabase
      .from('media_briefings')
      .update({ status: BriefingStatus.ARCHIVED })
      .eq('id', briefingId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) throw new Error(`Failed to archive briefing: ${error.message}`);

    await this.logAuditEvent(orgId, userId, briefingId, null, null, 'archive', {});

    return this.mapBriefingFromDb(briefing);
  }

  // =========================================================================
  // SECTION MANAGEMENT
  // =========================================================================

  /**
   * Get section by ID
   */
  async getSection(orgId: string, briefingId: string, sectionId: string): Promise<BriefingSection> {
    const { data: section, error } = await this.supabase
      .from('media_briefing_sections')
      .select('*')
      .eq('id', sectionId)
      .eq('briefing_id', briefingId)
      .eq('org_id', orgId)
      .single();

    if (error || !section) {
      throw new Error(`Section not found: ${sectionId}`);
    }

    return this.mapSectionFromDb(section);
  }

  /**
   * Update section content
   */
  async updateSection(
    orgId: string,
    userId: string,
    briefingId: string,
    sectionId: string,
    data: UpdateSectionRequest
  ): Promise<BriefingSection> {
    // Get original content for tracking
    const original = await this.getSection(orgId, briefingId, sectionId);

    const updates: any = {
      is_manually_edited: true,
      edited_by: userId,
      edited_at: new Date(),
    };

    if (!original.originalContent && original.content) {
      updates.original_content = original.content;
    }

    if (data.title !== undefined) updates.title = data.title;
    if (data.content !== undefined) updates.content = data.content;
    if (data.bulletPoints !== undefined) updates.bullet_points = data.bulletPoints;
    if (data.supportingData !== undefined) updates.supporting_data = data.supportingData;

    const { data: section, error } = await this.supabase
      .from('media_briefing_sections')
      .update(updates)
      .eq('id', sectionId)
      .eq('briefing_id', briefingId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update section: ${error.message}`);

    await this.logAuditEvent(orgId, userId, briefingId, sectionId, null, 'edit_section', {
      sectionType: original.sectionType,
    });

    return this.mapSectionFromDb(section);
  }

  /**
   * Reorder sections
   */
  async reorderSections(
    orgId: string,
    briefingId: string,
    sectionIds: string[]
  ): Promise<BriefingSection[]> {
    const updates = sectionIds.map((id, index) => ({
      id,
      order_index: index,
    }));

    for (const update of updates) {
      await this.supabase
        .from('media_briefing_sections')
        .update({ order_index: update.order_index })
        .eq('id', update.id)
        .eq('briefing_id', briefingId)
        .eq('org_id', orgId);
    }

    const { data: sections } = await this.supabase
      .from('media_briefing_sections')
      .select('*')
      .eq('briefing_id', briefingId)
      .eq('org_id', orgId)
      .order('order_index', { ascending: true });

    return sections?.map((s) => this.mapSectionFromDb(s)) || [];
  }

  // =========================================================================
  // TALKING POINT CRUD
  // =========================================================================

  /**
   * Create a talking point
   */
  async createTalkingPoint(
    orgId: string,
    userId: string,
    data: CreateTalkingPointRequest
  ): Promise<TalkingPoint> {
    const row = {
      org_id: orgId,
      briefing_id: data.briefingId || null,
      category: data.category,
      headline: data.headline,
      content: data.content,
      supporting_facts: data.supportingFacts || [],
      target_audience: data.targetAudience || null,
      use_case: data.useCase || null,
      context_notes: data.contextNotes || null,
      journalist_ids: data.journalistIds || [],
      persona_ids: data.personaIds || [],
      competitor_ids: data.competitorIds || [],
      priority_score: data.priorityScore || 50,
      is_generated: false,
      is_approved: false,
      is_archived: false,
    };

    const { data: talkingPoint, error } = await this.supabase
      .from('media_talking_points')
      .insert(row)
      .select()
      .single();

    if (error) throw new Error(`Failed to create talking point: ${error.message}`);

    if (data.briefingId) {
      await this.logAuditEvent(orgId, userId, data.briefingId, null, talkingPoint.id, 'create_talking_point', {
        category: data.category,
      });
    }

    return this.mapTalkingPointFromDb(talkingPoint);
  }

  /**
   * Get talking point by ID
   */
  async getTalkingPoint(orgId: string, talkingPointId: string): Promise<TalkingPoint> {
    const { data: talkingPoint, error } = await this.supabase
      .from('media_talking_points')
      .select('*')
      .eq('id', talkingPointId)
      .eq('org_id', orgId)
      .single();

    if (error || !talkingPoint) {
      throw new Error(`Talking point not found: ${talkingPointId}`);
    }

    return this.mapTalkingPointFromDb(talkingPoint);
  }

  /**
   * Get talking points with filters and pagination
   */
  async getTalkingPoints(
    orgId: string,
    filters: TalkingPointFilters = {},
    limit: number = 20,
    offset: number = 0
  ): Promise<GetTalkingPointsResponse> {
    let query = this.supabase
      .from('media_talking_points')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId);

    // Apply filters
    if (filters.briefingId) query = query.eq('briefing_id', filters.briefingId);
    if (filters.category) query = query.eq('category', filters.category);
    if (filters.isApproved !== undefined) query = query.eq('is_approved', filters.isApproved);
    if (filters.isArchived !== undefined) query = query.eq('is_archived', filters.isArchived);
    if (filters.minPriority !== undefined) query = query.gte('priority_score', filters.minPriority);
    if (filters.journalistId) query = query.contains('journalist_ids', [filters.journalistId]);
    if (filters.personaId) query = query.contains('persona_ids', [filters.personaId]);
    if (filters.competitorId) query = query.contains('competitor_ids', [filters.competitorId]);
    if (filters.searchQuery) {
      query = query.or(`headline.ilike.%${filters.searchQuery}%,content.ilike.%${filters.searchQuery}%`);
    }

    // Pagination
    query = query.order('priority_score', { ascending: false }).range(offset, offset + limit - 1);

    const { data: talkingPoints, count, error } = await query;

    if (error) throw new Error(`Failed to fetch talking points: ${error.message}`);

    return {
      talkingPoints: talkingPoints?.map((t) => this.mapTalkingPointFromDb(t)) || [],
      total: count || 0,
      limit,
      offset,
    };
  }

  /**
   * Update talking point
   */
  async updateTalkingPoint(
    orgId: string,
    userId: string,
    talkingPointId: string,
    data: UpdateTalkingPointRequest
  ): Promise<TalkingPoint> {
    const updates: any = {};
    if (data.category !== undefined) updates.category = data.category;
    if (data.headline !== undefined) updates.headline = data.headline;
    if (data.content !== undefined) updates.content = data.content;
    if (data.supportingFacts !== undefined) updates.supporting_facts = data.supportingFacts;
    if (data.targetAudience !== undefined) updates.target_audience = data.targetAudience;
    if (data.useCase !== undefined) updates.use_case = data.useCase;
    if (data.contextNotes !== undefined) updates.context_notes = data.contextNotes;
    if (data.journalistIds !== undefined) updates.journalist_ids = data.journalistIds;
    if (data.personaIds !== undefined) updates.persona_ids = data.personaIds;
    if (data.competitorIds !== undefined) updates.competitor_ids = data.competitorIds;
    if (data.priorityScore !== undefined) updates.priority_score = data.priorityScore;
    if (data.isArchived !== undefined) updates.is_archived = data.isArchived;

    if (data.isApproved !== undefined) {
      updates.is_approved = data.isApproved;
      if (data.isApproved) {
        updates.approved_by = userId;
        updates.approved_at = new Date();
      }
    }

    const { data: talkingPoint, error } = await this.supabase
      .from('media_talking_points')
      .update(updates)
      .eq('id', talkingPointId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update talking point: ${error.message}`);

    if (talkingPoint.briefing_id) {
      await this.logAuditEvent(orgId, userId, talkingPoint.briefing_id, null, talkingPointId, 'update_talking_point', {
        updates: Object.keys(updates),
      });
    }

    return this.mapTalkingPointFromDb(talkingPoint);
  }

  /**
   * Delete talking point
   */
  async deleteTalkingPoint(orgId: string, talkingPointId: string): Promise<void> {
    const { error } = await this.supabase
      .from('media_talking_points')
      .delete()
      .eq('id', talkingPointId)
      .eq('org_id', orgId);

    if (error) throw new Error(`Failed to delete talking point: ${error.message}`);
  }

  // =========================================================================
  // BRIEFING GENERATION
  // =========================================================================

  /**
   * Generate briefing content using LLM
   */
  async generateBriefing(
    orgId: string,
    userId: string,
    data: GenerateBriefingRequest
  ): Promise<BriefingGenerationResponse> {
    const startTime = Date.now();
    let totalTokens = 0;

    // Update status to generating
    await this.supabase
      .from('media_briefings')
      .update({ status: BriefingStatus.GENERATING })
      .eq('id', data.briefingId)
      .eq('org_id', orgId);

    try {
      // Get briefing with full context
      const briefing = await this.getBriefing(orgId, data.briefingId);

      // Assemble intelligence context from S38-S53
      const intelligence = await this.assembleIntelligenceContext(orgId, briefing);

      // Determine which sections to generate
      const sectionsToGenerate = data.sectionsToGenerate ||
        this.getDefaultSectionsForFormat(briefing.format);

      // Delete existing sections if regenerating
      if (data.regenerateExisting) {
        await this.supabase
          .from('media_briefing_sections')
          .delete()
          .eq('briefing_id', data.briefingId)
          .eq('org_id', orgId);
      }

      // Generate each section
      let sectionsGenerated = 0;
      for (let i = 0; i < sectionsToGenerate.length; i++) {
        const sectionType = sectionsToGenerate[i];

        // Skip if section exists and not regenerating
        if (!data.regenerateExisting) {
          const existingSection = briefing.sections?.find((s) => s.sectionType === sectionType);
          if (existingSection) continue;
        }

        const sectionResult = await this.generateSection(
          orgId,
          userId,
          data.briefingId,
          sectionType,
          intelligence,
          briefing,
          i,
          data.maxTokensPerSection
        );

        totalTokens += sectionResult.tokensUsed;
        sectionsGenerated++;
      }

      // Generate executive summary
      const summaryResult = await this.generateExecutiveSummary(
        orgId,
        userId,
        data.briefingId,
        intelligence,
        briefing
      );
      totalTokens += summaryResult.tokensUsed;

      // Generate key takeaways
      const takeawaysResult = await this.generateKeyTakeaways(
        orgId,
        data.briefingId,
        intelligence,
        briefing
      );
      totalTokens += takeawaysResult.tokensUsed;

      // Update briefing status
      const durationMs = Date.now() - startTime;
      const { data: _updatedBriefing, error } = await this.supabase
        .from('media_briefings')
        .update({
          status: BriefingStatus.GENERATED,
          executive_summary: summaryResult.content,
          key_takeaways: takeawaysResult.takeaways,
          confidence_score: this.calculateConfidenceScore(intelligence),
          relevance_score: this.calculateRelevanceScore(intelligence, briefing),
          completeness_score: this.calculateCompletenessScore(sectionsGenerated, sectionsToGenerate.length),
          generation_tokens_used: totalTokens,
          generation_duration_ms: durationMs,
          last_generated_at: new Date(),
        })
        .eq('id', data.briefingId)
        .eq('org_id', orgId)
        .select()
        .single();

      if (error) throw new Error(`Failed to update briefing after generation: ${error.message}`);

      await this.logAuditEvent(orgId, userId, data.briefingId, null, null, 'generate', {
        sectionsGenerated,
        totalTokens,
        durationMs,
      }, totalTokens, durationMs);

      return {
        briefing: await this.getBriefing(orgId, data.briefingId),
        sectionsGenerated,
        tokensUsed: totalTokens,
        durationMs,
      };
    } catch (error) {
      // Revert status on failure
      await this.supabase
        .from('media_briefings')
        .update({ status: BriefingStatus.DRAFT })
        .eq('id', data.briefingId)
        .eq('org_id', orgId);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.logAuditEvent(orgId, userId, data.briefingId, null, null, 'generate_failed', {
        error: errorMessage,
      }, totalTokens, Date.now() - startTime, false, errorMessage);

      throw error;
    }
  }

  /**
   * Regenerate a single section
   */
  async regenerateSection(
    orgId: string,
    userId: string,
    data: RegenerateSectionRequest
  ): Promise<SectionRegenerationResponse> {
    const startTime = Date.now();

    const briefing = await this.getBriefing(orgId, data.briefingId);
    const existingSection = briefing.sections?.find((s) => s.id === data.sectionId);

    if (!existingSection) {
      throw new Error(`Section not found: ${data.sectionId}`);
    }

    const previousContent = existingSection.content || undefined;

    // Preserve manual edits if requested
    if (data.preserveManualEdits && existingSection.isManuallyEdited) {
      throw new Error('Section has manual edits. Set preserveManualEdits=false to overwrite.');
    }

    const intelligence = await this.assembleIntelligenceContext(orgId, briefing);

    const result = await this.generateSection(
      orgId,
      userId,
      data.briefingId,
      existingSection.sectionType,
      intelligence,
      briefing,
      existingSection.orderIndex,
      undefined,
      data.customInstructions,
      data.sectionId
    );

    const section = await this.getSection(orgId, data.briefingId, data.sectionId);

    await this.logAuditEvent(orgId, userId, data.briefingId, data.sectionId, null, 'regenerate_section', {
      sectionType: existingSection.sectionType,
      customInstructions: !!data.customInstructions,
    }, result.tokensUsed, Date.now() - startTime);

    return {
      section,
      tokensUsed: result.tokensUsed,
      durationMs: Date.now() - startTime,
      previousContent,
    };
  }

  /**
   * Generate talking points for a briefing
   */
  async generateTalkingPoints(
    orgId: string,
    userId: string,
    data: GenerateTalkingPointsRequest
  ): Promise<TalkingPointsGenerationResponse> {
    const startTime = Date.now();
    let totalTokens = 0;

    const briefing = await this.getBriefing(orgId, data.briefingId);
    const intelligence = await this.assembleIntelligenceContext(orgId, briefing);

    const categories = data.categories || [
      TalkingPointCategory.PRIMARY_MESSAGE,
      TalkingPointCategory.SUPPORTING_POINT,
      TalkingPointCategory.DEFENSIVE_POINT,
    ];

    const count = data.count || 5;
    const generatedPoints: TalkingPoint[] = [];

    if (!this.llmRouter) {
      throw new Error('LLM router not configured for talking point generation');
    }

    const prompt = this.buildTalkingPointsPrompt(briefing, intelligence, categories, count, data.customInstructions);

    const llmResponse = await this.llmRouter.generate({
      userPrompt: prompt,
      maxTokens: 2000,
      temperature: 0.7,
      systemPrompt: BRIEFING_SYSTEM_PROMPT,
    });

    totalTokens = (llmResponse.usage?.promptTokens || 0) + (llmResponse.usage?.completionTokens || 0);

    // Parse LLM response into talking points
    const parsedPoints = this.parseTalkingPointsResponse(llmResponse.completion, categories);

    // Store each talking point
    for (const point of parsedPoints) {
      const talkingPoint = await this.createTalkingPoint(orgId, userId, {
        briefingId: data.briefingId,
        category: point.category,
        headline: point.headline,
        content: point.content,
        supportingFacts: point.supportingFacts,
        priorityScore: point.priorityScore,
      });
      generatedPoints.push(talkingPoint);

      // Mark as generated
      await this.supabase
        .from('media_talking_points')
        .update({
          is_generated: true,
          llm_model: llmResponse.model,
          generation_prompt: prompt.substring(0, 500),
        })
        .eq('id', talkingPoint.id);
    }

    await this.logAuditEvent(orgId, userId, data.briefingId, null, null, 'generate_talking_points', {
      count: generatedPoints.length,
      categories,
    }, totalTokens, Date.now() - startTime);

    return {
      talkingPoints: generatedPoints,
      tokensUsed: totalTokens,
      durationMs: Date.now() - startTime,
    };
  }

  // =========================================================================
  // SOURCE MANAGEMENT
  // =========================================================================

  /**
   * Add source reference to briefing
   */
  async addSourceReference(
    orgId: string,
    briefingId: string,
    sourceType: BriefingSourceType,
    sourceId?: string,
    sourceUrl?: string,
    metadata?: {
      title?: string;
      excerpt?: string;
      relevanceScore?: number;
      insightStrength?: InsightStrength;
      sourceDate?: Date;
      authorName?: string;
      outletName?: string;
    }
  ): Promise<SourceReference> {
    const row = {
      org_id: orgId,
      briefing_id: briefingId,
      source_type: sourceType,
      source_id: sourceId || null,
      source_url: sourceUrl || null,
      title: metadata?.title || null,
      excerpt: metadata?.excerpt || null,
      relevance_score: metadata?.relevanceScore || null,
      insight_strength: metadata?.insightStrength || null,
      source_date: metadata?.sourceDate || null,
      author_name: metadata?.authorName || null,
      outlet_name: metadata?.outletName || null,
      is_cited: false,
      used_in_sections: [],
    };

    const { data: source, error } = await this.supabase
      .from('media_briefing_sources')
      .insert(row)
      .select()
      .single();

    if (error) throw new Error(`Failed to add source reference: ${error.message}`);
    return this.mapSourceFromDb(source);
  }

  /**
   * Get sources for briefing
   */
  async getBriefingSources(
    orgId: string,
    briefingId: string,
    sourceType?: BriefingSourceType
  ): Promise<SourceReference[]> {
    let query = this.supabase
      .from('media_briefing_sources')
      .select('*')
      .eq('briefing_id', briefingId)
      .eq('org_id', orgId);

    if (sourceType) {
      query = query.eq('source_type', sourceType);
    }

    const { data: sources, error } = await query.order('relevance_score', { ascending: false });

    if (error) throw new Error(`Failed to fetch sources: ${error.message}`);
    return sources?.map((s) => this.mapSourceFromDb(s)) || [];
  }

  // =========================================================================
  // INTELLIGENCE CONTEXT ASSEMBLY
  // =========================================================================

  /**
   * Assemble intelligence context from S38-S53 modules
   */
  async assembleIntelligenceContext(
    orgId: string,
    briefing: MediaBriefing
  ): Promise<BriefingIntelligenceContext> {
    const context: BriefingIntelligenceContext = {};

    // S38: Press Releases - Get recent or related press releases
    if (briefing.storyId) {
      const { data: pressReleases } = await this.supabase
        .from('pr_generated_releases')
        .select('id, title, content, created_at')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (pressReleases) {
        context.pressReleases = pressReleases.map((pr) => ({
          id: pr.id,
          title: pr.title,
          content: pr.content,
          publishedAt: pr.created_at ? new Date(pr.created_at) : undefined,
        }));
      }
    }

    // S39: Pitches - Get recent pitches
    const { data: pitches } = await this.supabase
      .from('pr_pitches')
      .select('id, subject, body_html, status')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (pitches) {
      context.pitches = pitches.map((p) => ({
        id: p.id,
        subject: p.subject,
        content: p.body_html || '',
        status: p.status,
      }));
    }

    // S46: Journalist Graph - Get journalist profiles for targeted journalists
    if (briefing.journalistIds.length > 0) {
      const { data: journalists } = await this.supabase
        .from('journalist_identities')
        .select('id, name, primary_outlet, beats')
        .in('id', briefing.journalistIds);

      if (journalists) {
        context.journalistProfiles = journalists.map((j) => ({
          id: j.id,
          name: j.name,
          outlet: j.primary_outlet || '',
          beats: j.beats || [],
          recentCoverage: [],
        }));
      }
    }

    // S51: Audience Personas - Get targeted personas
    if (briefing.personaIds.length > 0) {
      const { data: personas } = await this.supabase
        .from('audience_personas')
        .select('id, name, role_title, interests, pain_points')
        .in('id', briefing.personaIds);

      if (personas) {
        context.personas = personas.map((p) => ({
          id: p.id,
          name: p.name,
          role: p.role_title || '',
          interests: p.interests || [],
          painPoints: p.pain_points || [],
        }));
      }
    }

    // S53: Competitive Intelligence - Get competitor insights
    if (briefing.competitorIds.length > 0) {
      const { data: competitors } = await this.supabase
        .from('ci_competitors')
        .select('id, name, tier')
        .in('id', briefing.competitorIds);

      if (competitors) {
        context.competitorIntel = competitors.map((c) => ({
          id: c.id,
          name: c.name,
          tier: c.tier,
          recentMentions: 0,
          avgSentiment: 0,
          advantageAreas: [],
          threatAreas: [],
        }));
      }
    }

    // S52: Media Performance - Get recent performance metrics
    const { data: performanceData } = await this.supabase
      .from('media_performance_snapshots')
      .select('*')
      .eq('org_id', orgId)
      .order('snapshot_at', { ascending: false })
      .limit(1)
      .single();

    if (performanceData) {
      context.performanceMetrics = {
        mentionVolume: performanceData.mention_count || 0,
        avgSentiment: performanceData.avg_sentiment || 0,
        eviScore: performanceData.evi_score || 0,
        shareOfVoice: performanceData.share_of_voice || 0,
        topJournalists: (performanceData.top_journalists || []).slice(0, 5),
      };
    }

    // Store source references
    await this.storeSourceReferences(orgId, briefing.id, context);

    return context;
  }

  /**
   * Store source references from intelligence context
   */
  private async storeSourceReferences(
    orgId: string,
    briefingId: string,
    context: BriefingIntelligenceContext
  ): Promise<void> {
    const sources: Array<{
      sourceType: BriefingSourceType;
      sourceId?: string;
      title?: string;
      relevanceScore: number;
    }> = [];

    if (context.pressReleases) {
      context.pressReleases.forEach((pr) => {
        sources.push({
          sourceType: BriefingSourceType.PRESS_RELEASE,
          sourceId: pr.id,
          title: pr.title,
          relevanceScore: 90,
        });
      });
    }

    if (context.pitches) {
      context.pitches.forEach((p) => {
        sources.push({
          sourceType: BriefingSourceType.PITCH,
          sourceId: p.id,
          title: p.subject,
          relevanceScore: 85,
        });
      });
    }

    if (context.journalistProfiles) {
      context.journalistProfiles.forEach((j) => {
        sources.push({
          sourceType: BriefingSourceType.JOURNALIST_PROFILE,
          sourceId: j.id,
          title: j.name,
          relevanceScore: 80,
        });
      });
    }

    if (context.personas) {
      context.personas.forEach((p) => {
        sources.push({
          sourceType: BriefingSourceType.AUDIENCE_PERSONA,
          sourceId: p.id,
          title: p.name,
          relevanceScore: 75,
        });
      });
    }

    if (context.competitorIntel) {
      context.competitorIntel.forEach((c) => {
        sources.push({
          sourceType: BriefingSourceType.COMPETITIVE_INTEL,
          sourceId: c.id,
          title: c.name,
          relevanceScore: 80,
        });
      });
    }

    // Insert sources
    for (const source of sources) {
      await this.addSourceReference(
        orgId,
        briefingId,
        source.sourceType,
        source.sourceId,
        undefined,
        {
          title: source.title,
          relevanceScore: source.relevanceScore,
        }
      );
    }
  }

  // =========================================================================
  // PRIVATE GENERATION HELPERS
  // =========================================================================

  /**
   * Generate a single section
   */
  private async generateSection(
    orgId: string,
    _userId: string,
    briefingId: string,
    sectionType: BriefingSectionType,
    intelligence: BriefingIntelligenceContext,
    briefing: MediaBriefing,
    orderIndex: number,
    maxTokens?: number,
    customInstructions?: string,
    existingSectionId?: string
  ): Promise<{ tokensUsed: number }> {
    const prompt = this.buildSectionPrompt(sectionType, intelligence, briefing, customInstructions);

    if (!this.llmRouter) {
      // Create placeholder section if LLM not available
      const sectionRow = {
        org_id: orgId,
        briefing_id: briefingId,
        section_type: sectionType,
        title: SECTION_TYPE_CONFIGS.find((c) => c.type === sectionType)?.label || sectionType,
        order_index: orderIndex,
        content: `[Placeholder: ${sectionType} content would be generated here]`,
        bullet_points: [],
        supporting_data: {},
        source_ids: [],
        is_generated: false,
      };

      if (existingSectionId) {
        await this.supabase
          .from('media_briefing_sections')
          .update(sectionRow)
          .eq('id', existingSectionId);
      } else {
        await this.supabase.from('media_briefing_sections').insert(sectionRow);
      }

      return { tokensUsed: 0 };
    }

    const llmResponse = await this.llmRouter.generate({
      userPrompt: prompt,
      maxTokens: maxTokens || 1000,
      temperature: 0.7,
      systemPrompt: BRIEFING_SYSTEM_PROMPT,
    });

    const tokensUsed = (llmResponse.usage?.promptTokens || 0) + (llmResponse.usage?.completionTokens || 0);

    // Parse response
    const { content, bulletPoints } = this.parseSectionResponse(llmResponse.completion);

    const sectionRow = {
      org_id: orgId,
      briefing_id: briefingId,
      section_type: sectionType,
      title: SECTION_TYPE_CONFIGS.find((c) => c.type === sectionType)?.label || sectionType,
      order_index: orderIndex,
      content,
      bullet_points: bulletPoints,
      supporting_data: {},
      source_ids: [],
      is_generated: true,
      generation_prompt: prompt.substring(0, 500),
      llm_model: llmResponse.model,
      tokens_used: tokensUsed,
      generation_duration_ms: 0, // Duration not tracked in this code path
    };

    if (existingSectionId) {
      await this.supabase
        .from('media_briefing_sections')
        .update(sectionRow)
        .eq('id', existingSectionId);
    } else {
      await this.supabase.from('media_briefing_sections').insert(sectionRow);
    }

    return { tokensUsed };
  }

  /**
   * Generate executive summary
   */
  private async generateExecutiveSummary(
    _orgId: string,
    _userId: string,
    _briefingId: string,
    intelligence: BriefingIntelligenceContext,
    briefing: MediaBriefing
  ): Promise<{ content: string; tokensUsed: number }> {
    if (!this.llmRouter) {
      return {
        content: `Executive briefing for: ${briefing.title}`,
        tokensUsed: 0,
      };
    }

    const prompt = `Generate a concise executive summary (2-3 paragraphs) for this media briefing:

Title: ${briefing.title}
${briefing.subtitle ? `Subtitle: ${briefing.subtitle}` : ''}
Format: ${briefing.format}
Tone: ${briefing.tone}
Focus Areas: ${briefing.focusAreas.join(', ') || 'General'}

${this.formatIntelligenceForPrompt(intelligence)}

Provide a high-level overview that an executive can scan in 30 seconds.`;

    const llmResponse = await this.llmRouter.generate({
      userPrompt: prompt,
      maxTokens: 500,
      temperature: 0.7,
      systemPrompt: BRIEFING_SYSTEM_PROMPT,
    });

    return {
      content: llmResponse.completion,
      tokensUsed: (llmResponse.usage?.promptTokens || 0) + (llmResponse.usage?.completionTokens || 0),
    };
  }

  /**
   * Generate key takeaways
   */
  private async generateKeyTakeaways(
    _orgId: string,
    _briefingId: string,
    intelligence: BriefingIntelligenceContext,
    briefing: MediaBriefing
  ): Promise<{ takeaways: BriefingKeyTakeaway[]; tokensUsed: number }> {
    if (!this.llmRouter) {
      return {
        takeaways: [
          {
            title: 'Key Message',
            description: 'Primary talking point for this briefing',
            importance: 'high' as const,
          },
        ],
        tokensUsed: 0,
      };
    }

    const prompt = `Generate 3-5 key takeaways for this media briefing. Format as JSON array:

Title: ${briefing.title}
Focus Areas: ${briefing.focusAreas.join(', ') || 'General'}

${this.formatIntelligenceForPrompt(intelligence)}

Return JSON array with objects having: title, description, importance (high/medium/low)`;

    const llmResponse = await this.llmRouter.generate({
      userPrompt: prompt,
      maxTokens: 600,
      temperature: 0.7,
      systemPrompt: 'You are a JSON generator. Return only valid JSON.',
    });

    let takeaways: BriefingKeyTakeaway[] = [];
    try {
      const parsed = JSON.parse(llmResponse.completion);
      if (Array.isArray(parsed)) {
        takeaways = parsed.map((t: any) => ({
          title: t.title || 'Key Point',
          description: t.description || '',
          importance: (['high', 'medium', 'low'].includes(t.importance) ? t.importance : 'medium') as 'high' | 'medium' | 'low',
        }));
      }
    } catch {
      logger.warn('Failed to parse key takeaways JSON');
      takeaways = [
        {
          title: 'Key Message',
          description: briefing.title,
          importance: 'high',
        },
      ];
    }

    return {
      takeaways,
      tokensUsed: (llmResponse.usage?.promptTokens || 0) + (llmResponse.usage?.completionTokens || 0),
    };
  }

  /**
   * Build section generation prompt
   */
  private buildSectionPrompt(
    sectionType: BriefingSectionType,
    intelligence: BriefingIntelligenceContext,
    briefing: MediaBriefing,
    customInstructions?: string
  ): string {
    const basePrompt = SECTION_PROMPTS[sectionType] || `Generate content for section: ${sectionType}`;

    return `${basePrompt}

Context:
- Briefing Title: ${briefing.title}
- Format: ${briefing.format}
- Tone: ${briefing.tone}
- Focus Areas: ${briefing.focusAreas.join(', ') || 'General'}
${briefing.excludedTopics.length > 0 ? `- Avoid Topics: ${briefing.excludedTopics.join(', ')}` : ''}

${this.formatIntelligenceForPrompt(intelligence)}

${customInstructions ? `Additional Instructions: ${customInstructions}` : ''}`;
  }

  /**
   * Build talking points generation prompt
   */
  private buildTalkingPointsPrompt(
    briefing: MediaBriefing,
    intelligence: BriefingIntelligenceContext,
    categories: TalkingPointCategory[],
    count: number,
    customInstructions?: string
  ): string {
    return `Generate ${count} talking points for this media briefing.

Categories to include: ${categories.join(', ')}

Briefing Context:
- Title: ${briefing.title}
- Tone: ${briefing.tone}
- Focus Areas: ${briefing.focusAreas.join(', ') || 'General'}

${this.formatIntelligenceForPrompt(intelligence)}

${customInstructions ? `Additional Instructions: ${customInstructions}` : ''}

For each talking point, provide:
1. Category (from the list above)
2. Headline (short, punchy - 10 words max)
3. Content (full talking point - 2-3 sentences)
4. Supporting facts (if applicable)
5. Priority score (1-100)

Format as JSON array.`;
  }

  /**
   * Format intelligence context for LLM prompt
   */
  private formatIntelligenceForPrompt(intelligence: BriefingIntelligenceContext): string {
    const parts: string[] = [];

    if (intelligence.pressReleases?.length) {
      parts.push(`Recent Press Releases:\n${intelligence.pressReleases.map((pr) => `- ${pr.title}`).join('\n')}`);
    }

    if (intelligence.journalistProfiles?.length) {
      parts.push(`Target Journalists:\n${intelligence.journalistProfiles.map((j) => `- ${j.name} (${j.outlet}): ${j.beats.join(', ')}`).join('\n')}`);
    }

    if (intelligence.personas?.length) {
      parts.push(`Target Audiences:\n${intelligence.personas.map((p) => `- ${p.name} (${p.role}): Interests: ${p.interests.slice(0, 3).join(', ')}`).join('\n')}`);
    }

    if (intelligence.competitorIntel?.length) {
      parts.push(`Competitors:\n${intelligence.competitorIntel.map((c) => `- ${c.name} (${c.tier})`).join('\n')}`);
    }

    if (intelligence.performanceMetrics) {
      parts.push(`Performance Metrics:\n- EVI Score: ${intelligence.performanceMetrics.eviScore}\n- Mention Volume: ${intelligence.performanceMetrics.mentionVolume}\n- Avg Sentiment: ${intelligence.performanceMetrics.avgSentiment.toFixed(2)}`);
    }

    return parts.length > 0 ? `Intelligence Context:\n${parts.join('\n\n')}` : 'No specific intelligence context available.';
  }

  /**
   * Parse section LLM response
   */
  private parseSectionResponse(response: string): {
    content: string;
    bulletPoints: SectionBulletPoint[];
  } {
    const lines = response.split('\n').filter((l) => l.trim());
    const bulletPoints: SectionBulletPoint[] = [];
    const contentLines: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.match(/^\d+\./)) {
        bulletPoints.push({
          text: trimmed.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, ''),
        });
      } else {
        contentLines.push(trimmed);
      }
    }

    return {
      content: contentLines.join('\n\n'),
      bulletPoints,
    };
  }

  /**
   * Parse talking points LLM response
   */
  private parseTalkingPointsResponse(
    response: string,
    categories: TalkingPointCategory[]
  ): Array<{
    category: TalkingPointCategory;
    headline: string;
    content: string;
    supportingFacts: TalkingPointFact[];
    priorityScore: number;
  }> {
    try {
      const parsed = JSON.parse(response);
      if (Array.isArray(parsed)) {
        return parsed.map((tp: any) => ({
          category: categories.includes(tp.category) ? tp.category : categories[0],
          headline: tp.headline || 'Talking Point',
          content: tp.content || '',
          supportingFacts: (tp.supportingFacts || []).map((f: any) => ({
            fact: f.fact || f,
            verifiable: true,
          })),
          priorityScore: Math.min(100, Math.max(1, tp.priorityScore || 50)),
        }));
      }
    } catch {
      logger.warn('Failed to parse talking points JSON, using fallback');
    }

    // Fallback: extract from text
    return [
      {
        category: categories[0],
        headline: 'Key Message',
        content: response.substring(0, 200),
        supportingFacts: [],
        priorityScore: 50,
      },
    ];
  }

  /**
   * Get default sections for briefing format
   */
  private getDefaultSectionsForFormat(format: BriefFormatType): BriefingSectionType[] {
    switch (format) {
      case BriefFormatType.FULL_BRIEF:
        return [
          BriefingSectionType.EXECUTIVE_SUMMARY,
          BriefingSectionType.KEY_MESSAGES,
          BriefingSectionType.MEDIA_LANDSCAPE,
          BriefingSectionType.COMPETITIVE_ANALYSIS,
          BriefingSectionType.JOURNALIST_INTELLIGENCE,
          BriefingSectionType.AUDIENCE_INSIGHTS,
          BriefingSectionType.PERFORMANCE_METRICS,
          BriefingSectionType.RECOMMENDED_ACTIONS,
          BriefingSectionType.QA_PREPARATION,
        ];
      case BriefFormatType.EXECUTIVE_SUMMARY:
        return [
          BriefingSectionType.EXECUTIVE_SUMMARY,
          BriefingSectionType.KEY_MESSAGES,
          BriefingSectionType.RECOMMENDED_ACTIONS,
        ];
      case BriefFormatType.TALKING_POINTS_ONLY:
        return [BriefingSectionType.KEY_MESSAGES];
      case BriefFormatType.MEDIA_PREP:
        return [
          BriefingSectionType.MEDIA_LANDSCAPE,
          BriefingSectionType.JOURNALIST_INTELLIGENCE,
          BriefingSectionType.QA_PREPARATION,
        ];
      case BriefFormatType.CRISIS_BRIEF:
        return [
          BriefingSectionType.EXECUTIVE_SUMMARY,
          BriefingSectionType.KEY_MESSAGES,
          BriefingSectionType.QA_PREPARATION,
          BriefingSectionType.RECOMMENDED_ACTIONS,
        ];
      case BriefFormatType.INTERVIEW_PREP:
        return [
          BriefingSectionType.JOURNALIST_INTELLIGENCE,
          BriefingSectionType.KEY_MESSAGES,
          BriefingSectionType.QA_PREPARATION,
        ];
      default:
        return [
          BriefingSectionType.EXECUTIVE_SUMMARY,
          BriefingSectionType.KEY_MESSAGES,
          BriefingSectionType.RECOMMENDED_ACTIONS,
        ];
    }
  }

  /**
   * Calculate confidence score based on intelligence quality
   */
  private calculateConfidenceScore(intelligence: BriefingIntelligenceContext): number {
    let score = 50; // Base score

    if (intelligence.pressReleases?.length) score += 10;
    if (intelligence.pitches?.length) score += 5;
    if (intelligence.journalistProfiles?.length) score += 10;
    if (intelligence.personas?.length) score += 10;
    if (intelligence.competitorIntel?.length) score += 10;
    if (intelligence.performanceMetrics) score += 5;

    return Math.min(100, score);
  }

  /**
   * Calculate relevance score
   */
  private calculateRelevanceScore(
    intelligence: BriefingIntelligenceContext,
    briefing: MediaBriefing
  ): number {
    let score = 60; // Base score

    // Higher relevance if targeted entities have data
    if (briefing.journalistIds.length > 0 && intelligence.journalistProfiles?.length) {
      score += 15;
    }
    if (briefing.personaIds.length > 0 && intelligence.personas?.length) {
      score += 15;
    }
    if (briefing.competitorIds.length > 0 && intelligence.competitorIntel?.length) {
      score += 10;
    }

    return Math.min(100, score);
  }

  /**
   * Calculate completeness score
   */
  private calculateCompletenessScore(generated: number, total: number): number {
    if (total === 0) return 100;
    return Math.round((generated / total) * 100);
  }

  // =========================================================================
  // AUDIT LOGGING
  // =========================================================================

  /**
   * Log audit event
   */
  private async logAuditEvent(
    orgId: string,
    userId: string,
    briefingId: string | null,
    sectionId: string | null,
    talkingPointId: string | null,
    action: string,
    details: Record<string, unknown>,
    totalTokens?: number,
    durationMs?: number,
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    try {
      await this.supabase.from('media_briefing_audit_log').insert({
        org_id: orgId,
        user_id: userId,
        briefing_id: briefingId,
        section_id: sectionId,
        talking_point_id: talkingPointId,
        action,
        action_details: details,
        total_tokens: totalTokens || null,
        duration_ms: durationMs || null,
        success,
        error_message: errorMessage || null,
      });
    } catch (error) {
      logger.error('Failed to log audit event', { error, action });
    }
  }

  // =========================================================================
  // DATABASE MAPPERS
  // =========================================================================

  private mapBriefingFromDb(row: any): MediaBriefing {
    return {
      id: row.id,
      orgId: row.org_id,
      title: row.title,
      subtitle: row.subtitle,
      format: row.format as BriefFormatType,
      status: row.status as BriefingStatus,
      storyId: row.story_id,
      journalistIds: row.journalist_ids || [],
      outletIds: row.outlet_ids || [],
      personaIds: row.persona_ids || [],
      competitorIds: row.competitor_ids || [],
      pressReleaseIds: row.press_release_ids || [],
      tone: row.tone || 'professional',
      focusAreas: row.focus_areas || [],
      excludedTopics: row.excluded_topics || [],
      customInstructions: row.custom_instructions,
      executiveSummary: row.executive_summary,
      keyTakeaways: row.key_takeaways || [],
      generatedInsights: row.generated_insights || [],
      confidenceScore: row.confidence_score,
      relevanceScore: row.relevance_score,
      completenessScore: row.completeness_score,
      llmModel: row.llm_model,
      generationTokensUsed: row.generation_tokens_used,
      generationDurationMs: row.generation_duration_ms,
      lastGeneratedAt: row.last_generated_at ? new Date(row.last_generated_at) : null,
      createdBy: row.created_by,
      reviewedBy: row.reviewed_by,
      approvedBy: row.approved_by,
      reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : null,
      approvedAt: row.approved_at ? new Date(row.approved_at) : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapSectionFromDb(row: any): BriefingSection {
    return {
      id: row.id,
      orgId: row.org_id,
      briefingId: row.briefing_id,
      sectionType: row.section_type as BriefingSectionType,
      title: row.title,
      orderIndex: row.order_index,
      content: row.content,
      bulletPoints: row.bullet_points || [],
      supportingData: row.supporting_data || {},
      sourceIds: row.source_ids || [],
      sourceSummary: row.source_summary,
      isGenerated: row.is_generated,
      generationPrompt: row.generation_prompt,
      llmModel: row.llm_model,
      tokensUsed: row.tokens_used,
      generationDurationMs: row.generation_duration_ms,
      isManuallyEdited: row.is_manually_edited,
      originalContent: row.original_content,
      editedBy: row.edited_by,
      editedAt: row.edited_at ? new Date(row.edited_at) : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapSourceFromDb(row: any): SourceReference {
    return {
      id: row.id,
      orgId: row.org_id,
      briefingId: row.briefing_id,
      sectionId: row.section_id,
      sourceType: row.source_type as BriefingSourceType,
      sourceId: row.source_id,
      sourceUrl: row.source_url,
      title: row.title,
      excerpt: row.excerpt,
      relevanceScore: row.relevance_score,
      insightStrength: row.insight_strength as InsightStrength | null,
      sourceDate: row.source_date ? new Date(row.source_date) : null,
      authorName: row.author_name,
      outletName: row.outlet_name,
      isCited: row.is_cited,
      citationText: row.citation_text,
      usedInSections: row.used_in_sections || [],
      createdAt: new Date(row.created_at),
    };
  }

  private mapTalkingPointFromDb(row: any): TalkingPoint {
    return {
      id: row.id,
      orgId: row.org_id,
      briefingId: row.briefing_id,
      category: row.category as TalkingPointCategory,
      headline: row.headline,
      content: row.content,
      supportingFacts: row.supporting_facts || [],
      targetAudience: row.target_audience,
      useCase: row.use_case,
      contextNotes: row.context_notes,
      journalistIds: row.journalist_ids || [],
      personaIds: row.persona_ids || [],
      competitorIds: row.competitor_ids || [],
      priorityScore: row.priority_score,
      confidenceScore: row.confidence_score,
      effectivenessScore: row.effectiveness_score,
      isGenerated: row.is_generated,
      llmModel: row.llm_model,
      generationPrompt: row.generation_prompt,
      isApproved: row.is_approved,
      approvedBy: row.approved_by,
      approvedAt: row.approved_at ? new Date(row.approved_at) : null,
      isArchived: row.is_archived,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
