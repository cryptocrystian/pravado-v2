/**
 * Audience Persona Service (Sprint S51)
 * Multi-source persona building and intelligence engine
 *
 * Features:
 * - Persona creation & updating
 * - LLM-assisted persona generation
 * - Trait extraction (skills, demographics, psychographics)
 * - Multi-source insight aggregation from S38-S50 systems
 * - Persona scoring: relevance, engagement, alignment
 * - Historical snapshot tracking
 * - Persona comparison & merging
 * - Trend analytics (6 dimensions)
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AudiencePersona,
  AudiencePersonaTrait,
  AudiencePersonaInsight,
  AudiencePersonaHistory,
  CreatePersonaInput,
  UpdatePersonaInput,
  GenerationContext,
  ExtractionResult,
  PersonasQuery,
  PersonasListResponse,
  PersonaDetailResponse,
  PersonaInsightsResponse,
  PersonaHistoryResponse,
  PersonaComparisonResult,
  AddTraitRequest,
  AddInsightRequest,
  PersonaTrendsResponse,
  TraitDistribution,
  InsightSummary,
  PersonaTrend,
} from '@pravado/types';
import { createLogger, callLLM } from '@pravado/utils';

const logger = createLogger('audience-persona-service');

// ========================================
// Service Configuration
// ========================================

const DEFAULT_LLM_MODEL = 'gpt-4';
const DEFAULT_TEMPERATURE = 0.3;
const DEFAULT_MAX_TOKENS = 2000;

// ========================================
// Audience Persona Service
// ========================================

export class AudiencePersonaService {
  constructor(private supabase: SupabaseClient) {}

  // ========================================
  // Persona CRUD Operations
  // ========================================

  /**
   * Create a new persona manually
   */
  async createPersona(
    orgId: string,
    input: CreatePersonaInput,
    userId?: string
  ): Promise<AudiencePersona> {
    logger.info('Creating persona', { orgId, name: input.name });

    // Validate required fields
    if (!input.name || input.name.trim().length === 0) {
      throw new Error('Persona name is required');
    }

    // Build insert data
    const insertData = {
      org_id: orgId,
      name: input.name.trim(),
      description: input.description,
      persona_type: input.personaType,
      role: input.role,
      industry: input.industry,
      company_size: input.companySize,
      seniority_level: input.seniorityLevel,
      location: input.location,
      tags: input.tags || [],
      custom_fields: input.customFields || {},
      generation_method: input.generationMethod || 'manual',
      relevance_score: 0,
      engagement_score: 0,
      alignment_score: 0,
      overall_score: 0,
      source_count: 0,
      status: 'active',
      is_validated: false,
      created_by: userId,
    };

    const { data, error } = await this.supabase
      .from('audience_personas')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      logger.error('Failed to create persona', { error: error.message });
      throw new Error(`Failed to create persona: ${error.message}`);
    }

    return this.mapPersonaFromDb(data);
  }

  /**
   * Update an existing persona
   */
  async updatePersona(
    orgId: string,
    personaId: string,
    input: UpdatePersonaInput,
    _userId?: string
  ): Promise<AudiencePersona> {
    logger.info('Updating persona', { orgId, personaId });

    // Build update data
    const updateData: any = {};

    if (input.name !== undefined) updateData.name = input.name.trim();
    if (input.description !== undefined) updateData.description = input.description;
    if (input.personaType !== undefined) updateData.persona_type = input.personaType;
    if (input.role !== undefined) updateData.role = input.role;
    if (input.industry !== undefined) updateData.industry = input.industry;
    if (input.companySize !== undefined) updateData.company_size = input.companySize;
    if (input.seniorityLevel !== undefined) updateData.seniority_level = input.seniorityLevel;
    if (input.location !== undefined) updateData.location = input.location;
    if (input.tags !== undefined) updateData.tags = input.tags;
    if (input.customFields !== undefined) updateData.custom_fields = input.customFields;
    if (input.relevanceScore !== undefined) updateData.relevance_score = input.relevanceScore;
    if (input.engagementScore !== undefined) updateData.engagement_score = input.engagementScore;
    if (input.alignmentScore !== undefined) updateData.alignment_score = input.alignmentScore;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.isValidated !== undefined) updateData.is_validated = input.isValidated;

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await this.supabase
      .from('audience_personas')
      .update(updateData)
      .eq('id', personaId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update persona', { error: error.message });
      throw new Error(`Failed to update persona: ${error.message}`);
    }

    if (!data) {
      throw new Error('Persona not found');
    }

    return this.mapPersonaFromDb(data);
  }

  /**
   * Get a single persona by ID
   */
  async getPersona(orgId: string, personaId: string): Promise<AudiencePersona | null> {
    const { data, error } = await this.supabase
      .from('audience_personas')
      .select('*')
      .eq('id', personaId)
      .eq('org_id', orgId)
      .single();

    if (error || !data) {
      return null;
    }

    return this.mapPersonaFromDb(data);
  }

  /**
   * Get persona detail with traits, insights, and history
   */
  async getPersonaDetail(orgId: string, personaId: string): Promise<PersonaDetailResponse> {
    const persona = await this.getPersona(orgId, personaId);
    if (!persona) {
      throw new Error('Persona not found');
    }

    // Get traits
    const traits = await this.getPersonaTraits(orgId, personaId);

    // Get trait distribution
    const traitDistribution = await this.getTraitDistribution(orgId, personaId);

    // Get insights
    const insights = await this.getPersonaInsights(orgId, personaId, {});

    // Get insight summary
    const insightSummary = await this.getInsightSummary(orgId, personaId);

    // Get recent history (last 10 snapshots)
    const historyResponse = await this.getPersonaHistory(orgId, personaId, { limit: 10 });

    return {
      persona,
      traits,
      traitDistribution,
      insights: insights.insights,
      insightSummary,
      recentHistory: historyResponse.history,
    };
  }

  /**
   * List personas with filtering and pagination
   */
  async listPersonas(orgId: string, query: PersonasQuery): Promise<PersonasListResponse> {
    let dbQuery = this.supabase
      .from('audience_personas')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId);

    // Apply filters
    if (query.personaType && query.personaType.length > 0) {
      dbQuery = dbQuery.in('persona_type', query.personaType);
    }

    if (query.role) {
      dbQuery = dbQuery.eq('role', query.role);
    }

    if (query.industry) {
      dbQuery = dbQuery.eq('industry', query.industry);
    }

    if (query.seniorityLevel && query.seniorityLevel.length > 0) {
      dbQuery = dbQuery.in('seniority_level', query.seniorityLevel);
    }

    if (query.minRelevanceScore !== undefined) {
      dbQuery = dbQuery.gte('relevance_score', query.minRelevanceScore);
    }

    if (query.minEngagementScore !== undefined) {
      dbQuery = dbQuery.gte('engagement_score', query.minEngagementScore);
    }

    if (query.minAlignmentScore !== undefined) {
      dbQuery = dbQuery.gte('alignment_score', query.minAlignmentScore);
    }

    if (query.minOverallScore !== undefined) {
      dbQuery = dbQuery.gte('overall_score', query.minOverallScore);
    }

    if (query.status && query.status.length > 0) {
      dbQuery = dbQuery.in('status', query.status);
    }

    if (query.tags && query.tags.length > 0) {
      dbQuery = dbQuery.contains('tags', query.tags);
    }

    if (query.searchQuery) {
      dbQuery = dbQuery.textSearch('fts', query.searchQuery, {
        type: 'websearch',
      });
    }

    // Apply sorting
    const sortBy = query.sortBy || 'created_at';
    const sortOrder = query.sortOrder || 'desc';
    dbQuery = dbQuery.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const limit = query.limit || 20;
    const offset = query.offset || 0;
    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data, error, count } = await dbQuery;

    if (error) {
      logger.error('Failed to list personas', { error: error.message });
      throw new Error(`Failed to list personas: ${error.message}`);
    }

    const personas = (data || []).map((row) => this.mapPersonaFromDb(row));

    return {
      personas,
      total: count || 0,
      hasMore: (count || 0) > offset + personas.length,
    };
  }

  /**
   * Delete a persona
   */
  async deletePersona(orgId: string, personaId: string): Promise<void> {
    logger.info('Deleting persona', { orgId, personaId });

    const { error } = await this.supabase
      .from('audience_personas')
      .delete()
      .eq('id', personaId)
      .eq('org_id', orgId);

    if (error) {
      logger.error('Failed to delete persona', { error: error.message });
      throw new Error(`Failed to delete persona: ${error.message}`);
    }
  }

  // ========================================
  // LLM-Assisted Generation
  // ========================================

  /**
   * Generate a persona using LLM from source text
   */
  async generatePersona(
    orgId: string,
    context: GenerationContext,
    userId?: string
  ): Promise<{
    persona: AudiencePersona;
    traits: AudiencePersonaTrait[];
    insights: AudiencePersonaInsight[];
    extraction: ExtractionResult;
  }> {
    logger.info('Generating persona with LLM', { orgId, sourceType: context.sourceType });

    // Extract persona attributes using LLM
    const extraction = await this.extractWithLLM(context);

    // Create persona
    const personaInput: CreatePersonaInput = {
      name: context.suggestedName || this.generateDefaultPersonaName(extraction),
      description: this.generatePersonaDescription(extraction),
      personaType: context.personaType || 'primary_audience',
      role: extraction.traits.find((t) => t.traitType === 'demographic')?.traitValue,
      industry: extraction.traits.find((t) => t.traitName === 'industry')?.traitValue,
      generationMethod: 'llm_assisted',
    };

    const persona = await this.createPersona(orgId, personaInput, userId);

    // Add traits
    const traits: AudiencePersonaTrait[] = [];
    if (context.extractTraits !== false) {
      for (const traitData of extraction.traits) {
        const trait = await this.addTrait(
          orgId,
          persona.id,
          {
            traitCategory: traitData.traitCategory,
            traitType: traitData.traitType,
            traitName: traitData.traitName,
            traitValue: traitData.traitValue,
            traitStrength: traitData.traitStrength,
            sourceType: context.sourceType,
            sourceId: context.sourceId,
            extractionMethod: 'llm',
            contextSnippet: traitData.contextSnippet,
          },
          userId
        );
        traits.push(trait);
      }
    }

    // Add insights
    const insights: AudiencePersonaInsight[] = [];
    if (context.extractInsights !== false) {
      for (const insightData of extraction.insights) {
        const insight = await this.addInsight(
          orgId,
          persona.id,
          {
            insightType: insightData.insightType,
            insightCategory: insightData.insightCategory,
            insightTitle: insightData.insightTitle,
            insightDescription: insightData.insightDescription,
            insightData: insightData.insightData,
            sourceSystem: this.mapSourceTypeToSystem(context.sourceType),
            sourceId: context.sourceId,
            confidenceScore: insightData.confidenceScore,
            impactScore: insightData.impactScore,
            supportingEvidence: insightData.supportingEvidence,
          },
          userId
        );
        insights.push(insight);
      }
    }

    // Calculate initial scores
    await this.recalculatePersonaScores(orgId, persona.id);

    // Fetch updated persona
    const updatedPersona = await this.getPersona(orgId, persona.id);

    return {
      persona: updatedPersona!,
      traits,
      insights,
      extraction,
    };
  }

  /**
   * Extract persona attributes using LLM
   */
  private async extractWithLLM(context: GenerationContext): Promise<ExtractionResult> {
    logger.info('Extracting persona attributes with LLM');

    const systemPrompt = `You are an expert audience analyst. Extract persona attributes from the provided text.

Analyze the text to identify:
1. **Traits**: Skills, demographics, psychographics, behaviors, interests
2. **Insights**: Content preferences, media consumption, engagement patterns, pain points, opportunities

Return a JSON object with this exact structure:
{
  "traits": [
    {
      "traitCategory": "skill|demographic|psychographic|behavioral|interest",
      "traitType": "hard_skill|soft_skill|goal|pain_point|motivation|value|preference",
      "traitName": "Name of the trait",
      "traitValue": "Specific value or description",
      "traitStrength": 0.8,
      "extractionConfidence": 0.9,
      "contextSnippet": "Supporting text from source"
    }
  ],
  "insights": [
    {
      "insightType": "content_preference|media_consumption|engagement_pattern|pain_point|opportunity",
      "insightCategory": "behavioral|attitudinal|contextual",
      "insightTitle": "Brief insight title",
      "insightDescription": "Detailed description",
      "insightData": {},
      "confidenceScore": 0.85,
      "impactScore": 0.75,
      "supportingEvidence": ["Evidence 1", "Evidence 2"]
    }
  ]
}`;

    const userPrompt = `Extract persona attributes from this ${context.sourceType} content:

${context.sourceText}

${context.additionalContext ? `\nAdditional context: ${context.additionalContext}` : ''}

Return ONLY the JSON object, no other text.`;

    try {
      const llmModel = context.llmModel || DEFAULT_LLM_MODEL;
      const temperature = context.temperature ?? DEFAULT_TEMPERATURE;
      const maxTokens = context.maxTokens || DEFAULT_MAX_TOKENS;

      const response = await callLLM({
        model: llmModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature,
        max_tokens: maxTokens,
      });

      const content = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);

      return {
        traits: parsed.traits || [],
        insights: parsed.insights || [],
        extractionMethod: 'llm',
        llmModel,
        extractionMetadata: {
          tokensUsed: response.usage?.total_tokens,
          temperature,
          maxTokens,
        },
      };
    } catch (error: any) {
      logger.error('LLM extraction failed', { error: error.message });

      // Fallback to deterministic extraction
      return this.extractDeterministic(context);
    }
  }

  /**
   * Deterministic fallback extraction (when LLM fails)
   */
  private extractDeterministic(context: GenerationContext): ExtractionResult {
    logger.info('Using deterministic extraction fallback');

    const traits: any[] = [];
    const insights: any[] = [];

    // Simple keyword-based extraction
    const text = context.sourceText.toLowerCase();

    // Extract role keywords
    const roleKeywords = ['ceo', 'cto', 'manager', 'director', 'engineer', 'analyst', 'designer'];
    for (const keyword of roleKeywords) {
      if (text.includes(keyword)) {
        traits.push({
          traitCategory: 'demographic',
          traitType: 'demographic',
          traitName: 'role',
          traitValue: keyword,
          traitStrength: 0.6,
          extractionConfidence: 0.5,
        });
        break;
      }
    }

    // Extract pain point keywords
    const painPointKeywords = ['challenge', 'problem', 'difficulty', 'struggle', 'issue'];
    for (const keyword of painPointKeywords) {
      if (text.includes(keyword)) {
        insights.push({
          insightType: 'pain_point',
          insightCategory: 'attitudinal',
          insightTitle: `Identified ${keyword}`,
          insightDescription: `Source mentions ${keyword}`,
          insightData: {},
          confidenceScore: 0.4,
          impactScore: 0.5,
          supportingEvidence: [],
        });
        break;
      }
    }

    return {
      traits,
      insights,
      extractionMethod: 'deterministic',
      extractionMetadata: {
        fallbackUsed: true,
      },
    };
  }

  /**
   * Generate default persona name from extraction
   */
  private generateDefaultPersonaName(extraction: ExtractionResult): string {
    const roleTrait = extraction.traits.find((t) => t.traitName === 'role');
    const industryTrait = extraction.traits.find((t) => t.traitName === 'industry');

    if (roleTrait?.traitValue && industryTrait?.traitValue) {
      return `${roleTrait.traitValue} in ${industryTrait.traitValue}`;
    } else if (roleTrait?.traitValue) {
      return roleTrait.traitValue;
    } else {
      return 'Generated Persona';
    }
  }

  /**
   * Generate persona description from extraction
   */
  private generatePersonaDescription(extraction: ExtractionResult): string {
    const traits = extraction.traits.slice(0, 5).map((t) => t.traitName);
    const insights = extraction.insights.slice(0, 3).map((i) => i.insightTitle);

    let description = 'Auto-generated persona with ';
    description += `${traits.length} traits`;
    if (insights.length > 0) {
      description += ` and ${insights.length} insights`;
    }
    description += '.';

    return description;
  }

  /**
   * Map source type to source system
   */
  private mapSourceTypeToSystem(sourceType: string): any {
    const mapping: Record<string, string> = {
      press_release: 'press_release_gen',
      pitch: 'pr_pitch',
      media_mention: 'media_monitoring',
      journalist_interaction: 'journalist_discovery',
      content: 'content_analysis',
    };

    return mapping[sourceType] || 'content_analysis';
  }

  // ========================================
  // Trait Management
  // ========================================

  /**
   * Add a trait to a persona
   */
  async addTrait(
    orgId: string,
    personaId: string,
    input: AddTraitRequest,
    _userId?: string
  ): Promise<AudiencePersonaTrait> {
    logger.info('Adding trait to persona', { orgId, personaId, traitName: input.traitName });

    const insertData = {
      org_id: orgId,
      persona_id: personaId,
      trait_category: input.traitCategory,
      trait_type: input.traitType,
      trait_name: input.traitName,
      trait_value: input.traitValue,
      trait_strength: input.traitStrength ?? 0.5,
      source_type: input.sourceType,
      source_id: input.sourceId,
      extraction_method: input.extractionMethod || 'manual',
      extraction_confidence: input.traitStrength,
      context_snippet: input.contextSnippet,
      metadata: {},
      is_verified: false,
      is_primary: input.isPrimary || false,
    };

    const { data, error } = await this.supabase
      .from('audience_persona_traits')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      logger.error('Failed to add trait', { error: error.message });
      throw new Error(`Failed to add trait: ${error.message}`);
    }

    return this.mapTraitFromDb(data);
  }

  /**
   * Get all traits for a persona
   */
  async getPersonaTraits(orgId: string, personaId: string): Promise<AudiencePersonaTrait[]> {
    const { data, error } = await this.supabase
      .from('audience_persona_traits')
      .select('*')
      .eq('org_id', orgId)
      .eq('persona_id', personaId)
      .order('trait_strength', { ascending: false });

    if (error) {
      logger.error('Failed to get persona traits', { error: error.message });
      return [];
    }

    return (data || []).map((row) => this.mapTraitFromDb(row));
  }

  /**
   * Get trait distribution for a persona
   */
  async getTraitDistribution(_orgId: string, personaId: string): Promise<TraitDistribution[]> {
    const { data, error } = await this.supabase.rpc('get_persona_trait_distribution', {
      p_persona_id: personaId,
    });

    if (error) {
      logger.error('Failed to get trait distribution', { error: error.message });
      return [];
    }

    return (data || []).map((row: any) => ({
      traitCategory: row.trait_category,
      traitCount: row.trait_count,
      avgStrength: row.avg_strength,
      verifiedCount: row.verified_count,
    }));
  }

  // ========================================
  // Insight Management
  // ========================================

  /**
   * Add an insight to a persona
   */
  async addInsight(
    orgId: string,
    personaId: string,
    input: AddInsightRequest,
    _userId?: string
  ): Promise<AudiencePersonaInsight> {
    logger.info('Adding insight to persona', { orgId, personaId, insightTitle: input.insightTitle });

    const insertData = {
      org_id: orgId,
      persona_id: personaId,
      insight_type: input.insightType,
      insight_category: input.insightCategory,
      insight_title: input.insightTitle,
      insight_description: input.insightDescription,
      insight_data: input.insightData || {},
      source_system: input.sourceSystem,
      source_id: input.sourceId,
      source_reference: input.sourceReference,
      confidence_score: input.confidenceScore ?? 0.5,
      impact_score: input.impactScore ?? 0.5,
      freshness_score: 1.0,
      observed_at: new Date().toISOString(),
      supporting_evidence: input.supportingEvidence || [],
      evidence_count: (input.supportingEvidence || []).length,
      is_validated: false,
      is_actionable: input.isActionable || false,
    };

    const { data, error } = await this.supabase
      .from('audience_persona_insights')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      logger.error('Failed to add insight', { error: error.message });
      throw new Error(`Failed to add insight: ${error.message}`);
    }

    return this.mapInsightFromDb(data);
  }

  /**
   * Get insights for a persona with filtering
   */
  async getPersonaInsights(
    orgId: string,
    personaId: string,
    query: any
  ): Promise<PersonaInsightsResponse> {
    let dbQuery = this.supabase
      .from('audience_persona_insights')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .eq('persona_id', personaId);

    // Apply filters
    if (query.insightType && query.insightType.length > 0) {
      dbQuery = dbQuery.in('insight_type', query.insightType);
    }

    if (query.insightCategory && query.insightCategory.length > 0) {
      dbQuery = dbQuery.in('insight_category', query.insightCategory);
    }

    if (query.sourceSystem && query.sourceSystem.length > 0) {
      dbQuery = dbQuery.in('source_system', query.sourceSystem);
    }

    if (query.minConfidence !== undefined) {
      dbQuery = dbQuery.gte('confidence_score', query.minConfidence);
    }

    if (query.minImpact !== undefined) {
      dbQuery = dbQuery.gte('impact_score', query.minImpact);
    }

    if (query.isActionable !== undefined) {
      dbQuery = dbQuery.eq('is_actionable', query.isActionable);
    }

    // Apply sorting
    const sortBy = query.sortBy || 'created_at';
    const sortOrder = query.sortOrder || 'desc';
    dbQuery = dbQuery.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const limit = query.limit || 20;
    const offset = query.offset || 0;
    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data, error, count } = await dbQuery;

    if (error) {
      logger.error('Failed to get persona insights', { error: error.message });
      throw new Error(`Failed to get persona insights: ${error.message}`);
    }

    const insights = (data || []).map((row) => this.mapInsightFromDb(row));

    // Get summary by source system
    const bySourceSystem = await this.getInsightSummary(orgId, personaId);

    return {
      insights,
      total: count || 0,
      bySourceSystem,
      hasMore: (count || 0) > offset + insights.length,
    };
  }

  /**
   * Get insight summary by source system
   */
  async getInsightSummary(_orgId: string, personaId: string): Promise<InsightSummary[]> {
    const { data, error } = await this.supabase.rpc('get_persona_insights_summary', {
      p_persona_id: personaId,
    });

    if (error) {
      logger.error('Failed to get insight summary', { error: error.message });
      return [];
    }

    return (data || []).map((row: any) => ({
      sourceSystem: row.source_system,
      insightCount: row.insight_count,
      avgConfidence: row.avg_confidence,
      avgImpact: row.avg_impact,
      actionableCount: row.actionable_count,
    }));
  }

  /**
   * Aggregate persona insights from all sources
   * Updates persona scores based on insights
   */
  async aggregateInsights(orgId: string, personaId: string): Promise<void> {
    logger.info('Aggregating persona insights', { orgId, personaId });

    const { error } = await this.supabase.rpc('aggregate_persona_insights', {
      p_persona_id: personaId,
    });

    if (error) {
      logger.error('Failed to aggregate insights', { error: error.message });
      throw new Error(`Failed to aggregate insights: ${error.message}`);
    }
  }

  // ========================================
  // Scoring
  // ========================================

  /**
   * Recalculate all scores for a persona
   */
  async recalculatePersonaScores(orgId: string, personaId: string): Promise<void> {
    logger.info('Recalculating persona scores', { orgId, personaId });

    // Get persona
    const persona = await this.getPersona(orgId, personaId);
    if (!persona) {
      throw new Error('Persona not found');
    }

    // Get all insights
    const insightsResponse = await this.getPersonaInsights(orgId, personaId, {});
    const insights = insightsResponse.insights;

    // Calculate relevance score (based on actionable insights)
    const actionableInsights = insights.filter((i) => i.isActionable);
    const relevanceScore = Math.min(
      100,
      (actionableInsights.length / Math.max(1, insights.length)) * 100
    );

    // Calculate engagement score (based on confidence)
    const avgConfidence = insights.length > 0
      ? insights.reduce((sum, i) => sum + i.confidenceScore, 0) / insights.length
      : 0;
    const engagementScore = Math.min(100, avgConfidence * 100);

    // Calculate alignment score (based on impact)
    const avgImpact = insights.length > 0
      ? insights.reduce((sum, i) => sum + i.impactScore, 0) / insights.length
      : 0;
    const alignmentScore = Math.min(100, avgImpact * 100);

    // Update persona scores
    await this.updatePersona(orgId, personaId, {
      relevanceScore,
      engagementScore,
      alignmentScore,
    });
  }

  // ========================================
  // History & Trends
  // ========================================

  /**
   * Get persona history snapshots
   */
  async getPersonaHistory(
    orgId: string,
    personaId: string,
    query: any
  ): Promise<PersonaHistoryResponse> {
    let dbQuery = this.supabase
      .from('audience_persona_history')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .eq('persona_id', personaId);

    // Apply filters
    if (query.snapshotType && query.snapshotType.length > 0) {
      dbQuery = dbQuery.in('snapshot_type', query.snapshotType);
    }

    if (query.minChangeMagnitude !== undefined) {
      dbQuery = dbQuery.gte('change_magnitude', query.minChangeMagnitude);
    }

    if (query.startDate) {
      dbQuery = dbQuery.gte('created_at', query.startDate);
    }

    if (query.endDate) {
      dbQuery = dbQuery.lte('created_at', query.endDate);
    }

    // Apply sorting
    const sortBy = query.sortBy || 'created_at';
    const sortOrder = query.sortOrder || 'desc';
    dbQuery = dbQuery.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const limit = query.limit || 20;
    const offset = query.offset || 0;
    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data, error, count } = await dbQuery;

    if (error) {
      logger.error('Failed to get persona history', { error: error.message });
      throw new Error(`Failed to get persona history: ${error.message}`);
    }

    const history = (data || []).map((row) => this.mapHistoryFromDb(row));

    return {
      history,
      total: count || 0,
      hasMore: (count || 0) > offset + history.length,
    };
  }

  /**
   * Get persona trends over time
   */
  async getPersonaTrends(
    orgId: string,
    personaId: string,
    daysBack: number = 90
  ): Promise<PersonaTrendsResponse> {
    logger.info('Getting persona trends', { orgId, personaId, daysBack });

    const { data, error } = await this.supabase.rpc('get_persona_trends', {
      p_persona_id: personaId,
      p_days_back: daysBack,
    });

    if (error) {
      logger.error('Failed to get persona trends', { error: error.message });
      throw new Error(`Failed to get persona trends: ${error.message}`);
    }

    const trends: PersonaTrend[] = (data || []).map((row: any) => ({
      snapshotDate: row.snapshot_date,
      relevanceScore: row.relevance_score,
      engagementScore: row.engagement_score,
      alignmentScore: row.alignment_score,
      overallScore: row.overall_score,
      traitCount: row.trait_count,
      insightCount: row.insight_count,
    }));

    // Calculate summary
    const summary = {
      relevanceChange: this.calculatePercentChange(trends, 'relevanceScore'),
      engagementChange: this.calculatePercentChange(trends, 'engagementScore'),
      alignmentChange: this.calculatePercentChange(trends, 'alignmentScore'),
      overallChange: this.calculatePercentChange(trends, 'overallScore'),
      traitGrowth: this.calculateGrowth(trends, 'traitCount'),
      insightGrowth: this.calculateGrowth(trends, 'insightCount'),
    };

    return {
      trends,
      dimensions: ['relevance', 'engagement', 'alignment', 'overall', 'traits', 'insights'],
      summary,
    };
  }

  /**
   * Calculate percent change between first and last trend data point
   */
  private calculatePercentChange(trends: PersonaTrend[], field: keyof PersonaTrend): number {
    if (trends.length < 2) return 0;

    const first = trends[trends.length - 1][field] as number;
    const last = trends[0][field] as number;

    if (first === 0) return 0;

    return ((last - first) / first) * 100;
  }

  /**
   * Calculate absolute growth
   */
  private calculateGrowth(trends: PersonaTrend[], field: keyof PersonaTrend): number {
    if (trends.length < 2) return 0;

    const first = trends[trends.length - 1][field] as number;
    const last = trends[0][field] as number;

    return last - first;
  }

  // ========================================
  // Comparison & Merging
  // ========================================

  /**
   * Compare two personas
   */
  async comparePersonas(
    orgId: string,
    personaId1: string,
    personaId2: string
  ): Promise<PersonaComparisonResult> {
    logger.info('Comparing personas', { orgId, personaId1, personaId2 });

    // Get personas
    const [persona1, persona2] = await Promise.all([
      this.getPersona(orgId, personaId1),
      this.getPersona(orgId, personaId2),
    ]);

    if (!persona1 || !persona2) {
      throw new Error('One or both personas not found');
    }

    // Calculate similarity using SQL function
    const { data: similarityData, error: similarityError } = await this.supabase.rpc(
      'calculate_persona_similarity',
      {
        p_persona_id_1: personaId1,
        p_persona_id_2: personaId2,
      }
    );

    if (similarityError) {
      logger.error('Failed to calculate similarity', { error: similarityError.message });
      throw new Error(`Failed to calculate similarity: ${similarityError.message}`);
    }

    const similarityScore = similarityData || 0;

    // Get traits
    const [traits1, traits2] = await Promise.all([
      this.getPersonaTraits(orgId, personaId1),
      this.getPersonaTraits(orgId, personaId2),
    ]);

    // Find common and unique traits
    const trait1Names = new Set(traits1.map((t) => t.traitName));
    const trait2Names = new Set(traits2.map((t) => t.traitName));

    const commonTraits: any[] = [];
    const uniqueTraits1: AudiencePersonaTrait[] = [];
    const uniqueTraits2: AudiencePersonaTrait[] = [];

    for (const trait of traits1) {
      if (trait2Names.has(trait.traitName)) {
        const trait2 = traits2.find((t) => t.traitName === trait.traitName)!;
        commonTraits.push({
          traitName: trait.traitName,
          traitCategory: trait.traitCategory,
          strength1: trait.traitStrength,
          strength2: trait2.traitStrength,
        });
      } else {
        uniqueTraits1.push(trait);
      }
    }

    for (const trait of traits2) {
      if (!trait1Names.has(trait.traitName)) {
        uniqueTraits2.push(trait);
      }
    }

    // Get insights counts
    const [insights1Response, insights2Response] = await Promise.all([
      this.getPersonaInsights(orgId, personaId1, {}),
      this.getPersonaInsights(orgId, personaId2, {}),
    ]);

    const commonInsights = 0; // Would need more complex logic to determine common insights
    const uniqueInsights1 = insights1Response.total;
    const uniqueInsights2 = insights2Response.total;

    // Calculate score differences
    const scoreDifferences = {
      relevance: Math.abs(persona1.relevanceScore - persona2.relevanceScore),
      engagement: Math.abs(persona1.engagementScore - persona2.engagementScore),
      alignment: Math.abs(persona1.alignmentScore - persona2.alignmentScore),
      overall: Math.abs(persona1.overallScore - persona2.overallScore),
    };

    // Merge recommendation (if similarity > 80%)
    const mergeRecommendation = similarityScore > 80;
    const mergeSuggestion = mergeRecommendation
      ? `These personas are ${similarityScore.toFixed(1)}% similar. Consider merging to reduce duplication.`
      : undefined;

    return {
      persona1,
      persona2,
      similarityScore,
      scoreDifferences,
      commonTraits,
      uniqueTraits1,
      uniqueTraits2,
      commonInsights,
      uniqueInsights1,
      uniqueInsights2,
      mergeRecommendation,
      mergeSuggestion,
    };
  }

  /**
   * Merge two personas
   */
  async mergePersonas(
    orgId: string,
    sourcePersonaId: string,
    targetPersonaId: string,
    mergeTraits: boolean,
    mergeInsights: boolean,
    archiveSource: boolean,
    _userId?: string
  ): Promise<{
    mergedPersona: AudiencePersona;
    traitsAdded: number;
    insightsAdded: number;
  }> {
    logger.info('Merging personas', {
      orgId,
      sourcePersonaId,
      targetPersonaId,
      mergeTraits,
      mergeInsights,
      archiveSource,
    });

    // Get personas
    const [sourcePersona, targetPersona] = await Promise.all([
      this.getPersona(orgId, sourcePersonaId),
      this.getPersona(orgId, targetPersonaId),
    ]);

    if (!sourcePersona || !targetPersona) {
      throw new Error('One or both personas not found');
    }

    let traitsAdded = 0;
    let insightsAdded = 0;

    // Merge traits
    if (mergeTraits) {
      const sourceTraits = await this.getPersonaTraits(orgId, sourcePersonaId);
      const targetTraits = await this.getPersonaTraits(orgId, targetPersonaId);
      const targetTraitNames = new Set(targetTraits.map((t) => t.traitName));

      for (const trait of sourceTraits) {
        if (!targetTraitNames.has(trait.traitName)) {
          await this.supabase
            .from('audience_persona_traits')
            .update({ persona_id: targetPersonaId })
            .eq('id', trait.id);
          traitsAdded++;
        }
      }
    }

    // Merge insights
    if (mergeInsights) {
      const sourceInsightsResponse = await this.getPersonaInsights(orgId, sourcePersonaId, {});
      const targetInsightsResponse = await this.getPersonaInsights(orgId, targetPersonaId, {});
      const targetInsightTitles = new Set(
        targetInsightsResponse.insights.map((i) => i.insightTitle)
      );

      for (const insight of sourceInsightsResponse.insights) {
        if (!targetInsightTitles.has(insight.insightTitle)) {
          await this.supabase
            .from('audience_persona_insights')
            .update({ persona_id: targetPersonaId })
            .eq('id', insight.id);
          insightsAdded++;
        }
      }
    }

    // Archive source persona
    if (archiveSource) {
      await this.updatePersona(orgId, sourcePersonaId, {
        status: 'merged',
      });

      await this.supabase
        .from('audience_personas')
        .update({ merged_into_id: targetPersonaId })
        .eq('id', sourcePersonaId);
    }

    // Recalculate scores
    await this.recalculatePersonaScores(orgId, targetPersonaId);

    const mergedPersona = await this.getPersona(orgId, targetPersonaId);

    return {
      mergedPersona: mergedPersona!,
      traitsAdded,
      insightsAdded,
    };
  }

  // ========================================
  // Mapping Helpers
  // ========================================

  private mapPersonaFromDb(row: any): AudiencePersona {
    return {
      id: row.id,
      orgId: row.org_id,
      name: row.name,
      description: row.description,
      personaType: row.persona_type,
      role: row.role,
      industry: row.industry,
      companySize: row.company_size,
      seniorityLevel: row.seniority_level,
      location: row.location,
      tags: row.tags || [],
      customFields: row.custom_fields || {},
      relevanceScore: row.relevance_score || 0,
      engagementScore: row.engagement_score || 0,
      alignmentScore: row.alignment_score || 0,
      overallScore: row.overall_score || 0,
      generationMethod: row.generation_method,
      llmModel: row.llm_model,
      sourceCount: row.source_count || 0,
      lastEnrichedAt: row.last_enriched_at ? new Date(row.last_enriched_at) : undefined,
      status: row.status,
      isValidated: row.is_validated || false,
      mergedIntoId: row.merged_into_id,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapTraitFromDb(row: any): AudiencePersonaTrait {
    return {
      id: row.id,
      orgId: row.org_id,
      personaId: row.persona_id,
      traitCategory: row.trait_category,
      traitType: row.trait_type,
      traitName: row.trait_name,
      traitValue: row.trait_value,
      traitStrength: row.trait_strength || 0.5,
      sourceType: row.source_type,
      sourceId: row.source_id,
      extractionMethod: row.extraction_method,
      extractionConfidence: row.extraction_confidence,
      contextSnippet: row.context_snippet,
      metadata: row.metadata || {},
      isVerified: row.is_verified || false,
      isPrimary: row.is_primary || false,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapInsightFromDb(row: any): AudiencePersonaInsight {
    return {
      id: row.id,
      orgId: row.org_id,
      personaId: row.persona_id,
      insightType: row.insight_type,
      insightCategory: row.insight_category,
      insightTitle: row.insight_title,
      insightDescription: row.insight_description,
      insightData: row.insight_data || {},
      sourceSystem: row.source_system,
      sourceId: row.source_id,
      sourceReference: row.source_reference,
      confidenceScore: row.confidence_score || 0.5,
      impactScore: row.impact_score || 0.5,
      freshnessScore: row.freshness_score || 1.0,
      observedAt: row.observed_at ? new Date(row.observed_at) : undefined,
      validUntil: row.valid_until ? new Date(row.valid_until) : undefined,
      supportingEvidence: row.supporting_evidence || [],
      evidenceCount: row.evidence_count || 0,
      isValidated: row.is_validated || false,
      isActionable: row.is_actionable || false,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapHistoryFromDb(row: any): AudiencePersonaHistory {
    return {
      id: row.id,
      orgId: row.org_id,
      personaId: row.persona_id,
      snapshotType: row.snapshot_type,
      snapshotData: row.snapshot_data || {},
      changedFields: row.changed_fields || [],
      changeSummary: row.change_summary,
      changeMagnitude: row.change_magnitude || 0,
      previousRelevanceScore: row.previous_relevance_score,
      newRelevanceScore: row.new_relevance_score,
      previousEngagementScore: row.previous_engagement_score,
      newEngagementScore: row.new_engagement_score,
      previousAlignmentScore: row.previous_alignment_score,
      newAlignmentScore: row.new_alignment_score,
      previousOverallScore: row.previous_overall_score,
      newOverallScore: row.new_overall_score,
      triggerEvent: row.trigger_event,
      triggerSource: row.trigger_source,
      metadata: row.metadata || {},
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
    };
  }
}
