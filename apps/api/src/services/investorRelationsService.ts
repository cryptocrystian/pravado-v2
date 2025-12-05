/**
 * Investor Relations Service (Sprint S64)
 * Investor Relations Pack & Earnings Narrative Engine V1
 *
 * Features:
 * - Investor pack CRUD with period configuration
 * - Cross-system data aggregation from S38-S63
 * - LLM-powered section and Q&A generation
 * - PDF/PPTX generation and storage
 * - Q&A bank management
 * - Approval workflow (draft -> generating -> review -> approved -> published)
 * - Comprehensive audit logging
 */

import type {
  InvestorPack,
  InvestorPackSection,
  InvestorPackSource,
  InvestorQnA,
  InvestorPackAuditLog,
  InvestorPackFormat,
  InvestorPackStatus,
  InvestorSectionType,
  InvestorSectionStatus,
  InvestorSourceSystem,
  InvestorQnACategory,
  InvestorEventType,
  InvestorPrimaryAudience,
  InvestorPackSummaryJson,
  CreateInvestorPackRequest,
  UpdateInvestorPackRequest,
  ListInvestorPacksQuery,
  GenerateInvestorPackRequest,
  GenerateInvestorPackResponse,
  UpdateInvestorSectionRequest,
  RegenerateInvestorSectionRequest,
  ReorderInvestorSectionsRequest,
  CreateInvestorQnARequest,
  UpdateInvestorQnARequest,
  GenerateInvestorQnARequest,
  GenerateInvestorQnAResponse,
  ListInvestorQnAQuery,
  ListInvestorQnAResponse,
  ApproveInvestorPackRequest,
  PublishInvestorPackRequest,
  PublishInvestorPackResponse,
  ArchiveInvestorPackRequest,
  ListInvestorAuditLogQuery,
  ListInvestorAuditLogResponse,
  InvestorPackStats,
  ListInvestorPacksResponse,
  InvestorPackWithSections,
} from '@pravado/types';
import {
  INVESTOR_SECTION_TYPE_LABELS,
  DEFAULT_QUARTERLY_EARNINGS_SECTIONS,
} from '@pravado/types';
import { createLogger } from '@pravado/utils';
import type { SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const logger = createLogger('investor-relations-service');

// ============================================================================
// Service Configuration
// ============================================================================

export interface InvestorRelationsServiceConfig {
  supabase: SupabaseClient;
  openaiApiKey: string;
  storageBucket?: string;
  debugMode?: boolean;
}

// ============================================================================
// Database Record Types (snake_case)
// ============================================================================

interface PackRecord {
  id: string;
  org_id: string;
  title: string;
  description: string | null;
  format: string;
  status: string;
  primary_audience: string;
  period_start: string;
  period_end: string;
  fiscal_quarter: string | null;
  fiscal_year: number | null;
  summary_json: Record<string, unknown>;
  section_types: string[];
  llm_model: string;
  tone: string;
  target_length: string;
  pdf_storage_path: string | null;
  pptx_storage_path: string | null;
  created_by: string | null;
  reviewed_by: string | null;
  approved_by: string | null;
  reviewed_at: string | null;
  approved_at: string | null;
  published_at: string | null;
  generation_started_at: string | null;
  generation_completed_at: string | null;
  generation_duration_ms: number | null;
  total_tokens_used: number;
  generation_error: string | null;
  meta: Record<string, unknown>;
  is_archived: boolean;
  archived_at: string | null;
  archived_by: string | null;
  created_at: string;
  updated_at: string;
}

interface SectionRecord {
  id: string;
  pack_id: string;
  org_id: string;
  section_type: string;
  title: string;
  order_index: number;
  content_md: string | null;
  content_html: string | null;
  summary: string | null;
  status: string;
  raw_llm_json: Record<string, unknown>;
  source_data: Record<string, unknown>;
  is_visible: boolean;
  edited_by: string | null;
  edited_at: string | null;
  original_content: string | null;
  created_at: string;
  updated_at: string;
}

interface SourceRecord {
  id: string;
  pack_id: string;
  org_id: string;
  section_id: string | null;
  source_system: string;
  source_ref_id: string | null;
  source_sprint: string | null;
  weight: number;
  relevance_score: number | null;
  data_snapshot: Record<string, unknown>;
  data_fetched_at: string;
  meta: Record<string, unknown>;
  created_at: string;
}

interface QnARecord {
  id: string;
  org_id: string;
  pack_id: string | null;
  question: string;
  answer_md: string;
  answer_html: string | null;
  category: string;
  tags: string[];
  confidence: number;
  is_llm_generated: boolean;
  source_summary_json: Record<string, unknown>;
  times_used: number;
  last_used_at: string | null;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

interface AuditLogRecord {
  id: string;
  org_id: string;
  pack_id: string | null;
  user_id: string | null;
  user_email: string | null;
  event_type: string;
  details_json: Record<string, unknown>;
  model: string | null;
  tokens_used: number | null;
  duration_ms: number | null;
  section_id: string | null;
  qna_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// ============================================================================
// Record to Entity Mappers
// ============================================================================

function mapPackRecord(record: PackRecord): InvestorPack {
  return {
    id: record.id,
    orgId: record.org_id,
    title: record.title,
    description: record.description,
    format: record.format as InvestorPackFormat,
    status: record.status as InvestorPackStatus,
    primaryAudience: record.primary_audience as InvestorPrimaryAudience,
    periodStart: record.period_start,
    periodEnd: record.period_end,
    fiscalQuarter: record.fiscal_quarter,
    fiscalYear: record.fiscal_year,
    summaryJson: record.summary_json as InvestorPackSummaryJson,
    sectionTypes: record.section_types as InvestorSectionType[],
    llmModel: record.llm_model,
    tone: record.tone,
    targetLength: record.target_length,
    pdfStoragePath: record.pdf_storage_path,
    pptxStoragePath: record.pptx_storage_path,
    createdBy: record.created_by,
    reviewedBy: record.reviewed_by,
    approvedBy: record.approved_by,
    reviewedAt: record.reviewed_at,
    approvedAt: record.approved_at,
    publishedAt: record.published_at,
    generationStartedAt: record.generation_started_at,
    generationCompletedAt: record.generation_completed_at,
    generationDurationMs: record.generation_duration_ms,
    totalTokensUsed: record.total_tokens_used,
    generationError: record.generation_error,
    meta: record.meta,
    isArchived: record.is_archived,
    archivedAt: record.archived_at,
    archivedBy: record.archived_by,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

function mapSectionRecord(record: SectionRecord): InvestorPackSection {
  return {
    id: record.id,
    packId: record.pack_id,
    orgId: record.org_id,
    sectionType: record.section_type as InvestorSectionType,
    title: record.title,
    orderIndex: record.order_index,
    contentMd: record.content_md,
    contentHtml: record.content_html,
    summary: record.summary,
    status: record.status as InvestorSectionStatus,
    rawLlmJson: record.raw_llm_json,
    sourceData: record.source_data,
    isVisible: record.is_visible,
    editedBy: record.edited_by,
    editedAt: record.edited_at,
    originalContent: record.original_content,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

function mapSourceRecord(record: SourceRecord): InvestorPackSource {
  return {
    id: record.id,
    packId: record.pack_id,
    orgId: record.org_id,
    sectionId: record.section_id,
    sourceSystem: record.source_system as InvestorSourceSystem,
    sourceRefId: record.source_ref_id,
    sourceSprint: record.source_sprint,
    weight: record.weight,
    relevanceScore: record.relevance_score,
    dataSnapshot: record.data_snapshot,
    dataFetchedAt: record.data_fetched_at,
    meta: record.meta,
    createdAt: record.created_at,
  };
}

function mapQnARecord(record: QnARecord): InvestorQnA {
  return {
    id: record.id,
    orgId: record.org_id,
    packId: record.pack_id,
    question: record.question,
    answerMd: record.answer_md,
    answerHtml: record.answer_html,
    category: record.category as InvestorQnACategory,
    tags: record.tags,
    confidence: record.confidence,
    isLlmGenerated: record.is_llm_generated,
    sourceSummaryJson: record.source_summary_json,
    timesUsed: record.times_used,
    lastUsedAt: record.last_used_at,
    status: record.status,
    approvedBy: record.approved_by,
    approvedAt: record.approved_at,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

function mapAuditLogRecord(record: AuditLogRecord): InvestorPackAuditLog {
  return {
    id: record.id,
    orgId: record.org_id,
    packId: record.pack_id,
    userId: record.user_id,
    userEmail: record.user_email,
    eventType: record.event_type as InvestorEventType,
    detailsJson: record.details_json,
    model: record.model,
    tokensUsed: record.tokens_used,
    durationMs: record.duration_ms,
    sectionId: record.section_id,
    qnaId: record.qna_id,
    ipAddress: record.ip_address,
    userAgent: record.user_agent,
    createdAt: record.created_at,
  };
}

// ============================================================================
// Default Sections by Format
// ============================================================================

function getDefaultSectionsForFormat(format: InvestorPackFormat): InvestorSectionType[] {
  switch (format) {
    case 'quarterly_earnings':
      return DEFAULT_QUARTERLY_EARNINGS_SECTIONS;
    case 'annual_review':
      return [
        'executive_summary',
        'highlights',
        'lowlights',
        'kpi_overview',
        'market_context',
        'competition',
        'product_updates',
        'go_to_market',
        'customer_stories',
        'risk_and_mitigations',
        'governance',
        'esg',
        'outlook',
      ];
    case 'investor_day':
      return [
        'executive_summary',
        'highlights',
        'kpi_overview',
        'market_context',
        'competition',
        'product_updates',
        'go_to_market',
        'outlook',
      ];
    case 'board_update':
      return [
        'executive_summary',
        'highlights',
        'lowlights',
        'kpi_overview',
        'risk_and_mitigations',
        'governance',
        'outlook',
      ];
    case 'fundraising_round':
      return [
        'executive_summary',
        'highlights',
        'market_context',
        'competition',
        'product_updates',
        'go_to_market',
        'customer_stories',
        'outlook',
      ];
    case 'custom':
    default:
      return ['executive_summary', 'highlights', 'lowlights', 'outlook'];
  }
}

// ============================================================================
// Service Factory
// ============================================================================

export function createInvestorRelationsService(config: InvestorRelationsServiceConfig) {
  const db = config.supabase as SupabaseClient;
  const openaiApiKey = config.openaiApiKey;
  const openai = new OpenAI({ apiKey: openaiApiKey });
  void config.storageBucket;
  void config.debugMode;

  // ==========================================================================
  // Audit Logging
  // ==========================================================================

  async function logPackAction(
    orgId: string,
    packId: string | null,
    userId: string | null,
    userEmail: string | null,
    eventType: InvestorEventType,
    details?: Record<string, unknown>,
    opts?: {
      model?: string;
      tokensUsed?: number;
      durationMs?: number;
      sectionId?: string;
      qnaId?: string;
    }
  ): Promise<void> {
    try {
      await db.from('investor_pack_audit_log').insert({
        org_id: orgId,
        pack_id: packId,
        user_id: userId,
        user_email: userEmail,
        event_type: eventType,
        details_json: details || {},
        model: opts?.model || null,
        tokens_used: opts?.tokensUsed || null,
        duration_ms: opts?.durationMs || null,
        section_id: opts?.sectionId || null,
        qna_id: opts?.qnaId || null,
      });
    } catch (error) {
      logger.warn('Failed to log pack action', { error, eventType, packId });
    }
  }

  // ==========================================================================
  // Pack CRUD
  // ==========================================================================

  async function createPack(
    orgId: string,
    userId: string | null,
    userEmail: string | null,
    input: CreateInvestorPackRequest
  ): Promise<InvestorPack> {
    const format = input.format || 'quarterly_earnings';
    const sectionTypes = input.sectionTypes || getDefaultSectionsForFormat(format);

    const { data, error } = await db
      .from('investor_packs')
      .insert({
        org_id: orgId,
        title: input.title,
        description: input.description || null,
        format,
        status: 'draft' as InvestorPackStatus,
        primary_audience: input.primaryAudience || 'investors',
        period_start: input.periodStart,
        period_end: input.periodEnd,
        fiscal_quarter: input.fiscalQuarter || null,
        fiscal_year: input.fiscalYear || null,
        section_types: sectionTypes,
        llm_model: input.llmModel || 'gpt-4o',
        tone: input.tone || 'professional',
        target_length: input.targetLength || 'comprehensive',
        meta: input.meta || {},
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create pack', { error, orgId });
      throw new Error(`Failed to create pack: ${error.message}`);
    }

    // Create initial empty sections based on section types
    const sectionsToInsert = sectionTypes.map((sectionType, index) => ({
      pack_id: data.id,
      org_id: orgId,
      section_type: sectionType,
      title: INVESTOR_SECTION_TYPE_LABELS[sectionType] || sectionType,
      order_index: index,
      status: 'draft' as InvestorSectionStatus,
      raw_llm_json: {},
      source_data: {},
    }));

    const { error: sectionsError } = await db
      .from('investor_pack_sections')
      .insert(sectionsToInsert);

    if (sectionsError) {
      logger.warn('Failed to create initial sections', { error: sectionsError, packId: data.id });
    }

    await logPackAction(orgId, data.id, userId, userEmail, 'created', { input });

    return mapPackRecord(data);
  }

  async function getPack(
    orgId: string,
    packId: string
  ): Promise<InvestorPackWithSections | null> {
    const { data: pack, error } = await db
      .from('investor_packs')
      .select('*')
      .eq('id', packId)
      .eq('org_id', orgId)
      .single();

    if (error || !pack) {
      return null;
    }

    // Fetch sections
    const { data: sections } = await db
      .from('investor_pack_sections')
      .select('*')
      .eq('pack_id', packId)
      .eq('org_id', orgId)
      .order('order_index', { ascending: true });

    return {
      ...mapPackRecord(pack),
      sections: (sections || []).map(mapSectionRecord),
    };
  }

  async function listPacks(
    orgId: string,
    query: ListInvestorPacksQuery
  ): Promise<ListInvestorPacksResponse> {
    let dbQuery = db
      .from('investor_packs')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (query.status) {
      const statuses = Array.isArray(query.status) ? query.status : [query.status];
      dbQuery = dbQuery.in('status', statuses);
    }

    if (query.format) {
      const formats = Array.isArray(query.format) ? query.format : [query.format];
      dbQuery = dbQuery.in('format', formats);
    }

    if (query.primaryAudience) {
      dbQuery = dbQuery.eq('primary_audience', query.primaryAudience);
    }

    if (query.fiscalYear) {
      dbQuery = dbQuery.eq('fiscal_year', query.fiscalYear);
    }

    if (query.fiscalQuarter) {
      dbQuery = dbQuery.eq('fiscal_quarter', query.fiscalQuarter);
    }

    if (!query.includeArchived) {
      dbQuery = dbQuery.eq('is_archived', false);
    }

    const limit = query.limit || 20;
    const offset = query.offset || 0;
    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data, error, count } = await dbQuery;

    if (error) {
      logger.error('Failed to list packs', { error, orgId });
      throw new Error(`Failed to list packs: ${error.message}`);
    }

    return {
      packs: (data || []).map(mapPackRecord),
      total: count || 0,
      hasMore: (count || 0) > offset + limit,
    };
  }

  async function updatePack(
    orgId: string,
    packId: string,
    userId: string | null,
    userEmail: string | null,
    input: UpdateInvestorPackRequest
  ): Promise<InvestorPack | null> {
    const updateData: Record<string, unknown> = {};

    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.format !== undefined) updateData.format = input.format;
    if (input.primaryAudience !== undefined) updateData.primary_audience = input.primaryAudience;
    if (input.periodStart !== undefined) updateData.period_start = input.periodStart;
    if (input.periodEnd !== undefined) updateData.period_end = input.periodEnd;
    if (input.fiscalQuarter !== undefined) updateData.fiscal_quarter = input.fiscalQuarter;
    if (input.fiscalYear !== undefined) updateData.fiscal_year = input.fiscalYear;
    if (input.sectionTypes !== undefined) updateData.section_types = input.sectionTypes;
    if (input.llmModel !== undefined) updateData.llm_model = input.llmModel;
    if (input.tone !== undefined) updateData.tone = input.tone;
    if (input.targetLength !== undefined) updateData.target_length = input.targetLength;
    if (input.meta !== undefined) updateData.meta = input.meta;

    if (Object.keys(updateData).length === 0) {
      const pack = await getPack(orgId, packId);
      return pack || null;
    }

    const { data, error } = await db
      .from('investor_packs')
      .update(updateData)
      .eq('id', packId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error || !data) {
      return null;
    }

    await logPackAction(orgId, packId, userId, userEmail, 'updated', { input });

    return mapPackRecord(data);
  }

  async function deletePack(
    orgId: string,
    packId: string,
    userId: string | null,
    userEmail: string | null
  ): Promise<boolean> {
    // Sections, sources, and Q&As will cascade delete
    const { error } = await db
      .from('investor_packs')
      .delete()
      .eq('id', packId)
      .eq('org_id', orgId);

    if (error) {
      logger.error('Failed to delete pack', { error, packId });
      return false;
    }

    // Log to audit (pack_id will be null since pack is deleted, but we can still log)
    await logPackAction(orgId, null, userId, userEmail, 'archived', { deletedPackId: packId });

    return true;
  }

  async function archivePack(
    orgId: string,
    packId: string,
    userId: string | null,
    userEmail: string | null,
    input: ArchiveInvestorPackRequest
  ): Promise<InvestorPack | null> {
    const { data, error } = await db
      .from('investor_packs')
      .update({
        is_archived: true,
        archived_at: new Date().toISOString(),
        archived_by: userId,
      })
      .eq('id', packId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error || !data) {
      return null;
    }

    await logPackAction(orgId, packId, userId, userEmail, 'archived', { reason: input.reason });

    return mapPackRecord(data);
  }

  // ==========================================================================
  // Pack Generation
  // ==========================================================================

  async function generatePack(
    orgId: string,
    packId: string,
    userId: string | null,
    userEmail: string | null,
    input: GenerateInvestorPackRequest
  ): Promise<GenerateInvestorPackResponse> {
    const startTime = Date.now();
    let totalTokensUsed = 0;

    // Get the pack
    const pack = await getPack(orgId, packId);
    if (!pack) {
      throw new Error('Pack not found');
    }

    // Update status to generating
    await db
      .from('investor_packs')
      .update({
        status: 'generating' as InvestorPackStatus,
        generation_started_at: new Date().toISOString(),
        generation_error: null,
      })
      .eq('id', packId)
      .eq('org_id', orgId);

    try {
      // Determine which sections to generate
      const sectionsToGenerate = input.regenerateSections || pack.sectionTypes;

      // Aggregate upstream data
      const aggregatedData = await aggregateUpstreamData(orgId, pack.periodStart, pack.periodEnd);

      // Store sources
      const sources = await storeSources(orgId, packId, aggregatedData);

      // Generate each section
      const generatedSections: InvestorPackSection[] = [];
      for (const sectionType of sectionsToGenerate) {
        const result = await generateSection(
          orgId,
          packId,
          sectionType,
          pack,
          aggregatedData,
          userId,
          userEmail
        );
        if (result) {
          generatedSections.push(result.section);
          totalTokensUsed += result.tokensUsed;
        }
      }

      // Calculate summary
      const summary = calculatePackSummary(generatedSections, aggregatedData);

      // Update pack with completion
      const durationMs = Date.now() - startTime;
      const { data: updatedPack } = await db
        .from('investor_packs')
        .update({
          status: 'review' as InvestorPackStatus,
          summary_json: summary,
          generation_completed_at: new Date().toISOString(),
          generation_duration_ms: durationMs,
          total_tokens_used: totalTokensUsed,
        })
        .eq('id', packId)
        .eq('org_id', orgId)
        .select()
        .single();

      await logPackAction(orgId, packId, userId, userEmail, 'section_generated', {
        sectionsGenerated: sectionsToGenerate,
        tokensUsed: totalTokensUsed,
        durationMs,
      }, { tokensUsed: totalTokensUsed, durationMs });

      return {
        pack: mapPackRecord(updatedPack),
        sections: generatedSections,
        sources,
        generationDurationMs: durationMs,
        tokensUsed: totalTokensUsed,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await db
        .from('investor_packs')
        .update({
          status: 'draft' as InvestorPackStatus,
          generation_error: errorMessage,
        })
        .eq('id', packId)
        .eq('org_id', orgId);

      logger.error('Pack generation failed', { error, packId });
      throw error;
    }
  }

  async function aggregateUpstreamData(
    orgId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<Record<InvestorSourceSystem, unknown>> {
    const data: Record<string, unknown> = {};

    // Aggregate from S63 - Board Reports
    try {
      const { data: boardReports } = await db
        .from('exec_board_reports')
        .select('*')
        .eq('org_id', orgId)
        .gte('period_start', periodStart)
        .lte('period_end', periodEnd)
        .eq('status', 'published')
        .limit(5);
      data.board_reports = boardReports || [];
    } catch {
      data.board_reports = [];
    }

    // Aggregate from S62 - Exec Digests
    try {
      const { data: digests } = await db
        .from('exec_weekly_digests')
        .select('*')
        .eq('org_id', orgId)
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd)
        .eq('status', 'sent')
        .limit(12);
      data.exec_digest = digests || [];
    } catch {
      data.exec_digest = [];
    }

    // Aggregate from S60 - Risk Radar
    try {
      const { data: risks } = await db
        .from('risk_signals')
        .select('*')
        .eq('org_id', orgId)
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd)
        .order('risk_score', { ascending: false })
        .limit(20);
      data.risk_radar = risks || [];
    } catch {
      data.risk_radar = [];
    }

    // Aggregate from S52 - Media Performance
    try {
      const { data: performance } = await db
        .from('media_performance_reports')
        .select('*')
        .eq('org_id', orgId)
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd)
        .limit(10);
      data.media_performance = performance || [];
    } catch {
      data.media_performance = [];
    }

    // Aggregate from S53 - Competitive Intel
    try {
      const { data: intel } = await db
        .from('competitor_intel_reports')
        .select('*')
        .eq('org_id', orgId)
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd)
        .limit(10);
      data.competitive_intel = intel || [];
    } catch {
      data.competitive_intel = [];
    }

    return data as Record<InvestorSourceSystem, unknown>;
  }

  async function storeSources(
    orgId: string,
    packId: string,
    aggregatedData: Record<InvestorSourceSystem, unknown>
  ): Promise<InvestorPackSource[]> {
    const sources: InvestorPackSource[] = [];

    for (const [system, dataItems] of Object.entries(aggregatedData)) {
      if (!dataItems || !Array.isArray(dataItems) || dataItems.length === 0) continue;

      const { data, error } = await db
        .from('investor_pack_sources')
        .insert({
          pack_id: packId,
          org_id: orgId,
          source_system: system,
          source_sprint: getSprintForSystem(system as InvestorSourceSystem),
          weight: 1.0,
          data_snapshot: { items: dataItems },
          meta: { count: dataItems.length },
        })
        .select()
        .single();

      if (!error && data) {
        sources.push(mapSourceRecord(data));
      }
    }

    return sources;
  }

  function getSprintForSystem(system: InvestorSourceSystem): string {
    const sprintMap: Record<InvestorSourceSystem, string> = {
      media_performance: 'S52',
      board_reports: 'S63',
      exec_digest: 'S62',
      exec_command_center: 'S61',
      risk_radar: 'S60',
      governance: 'S59',
      brand_reputation: 'S56',
      crisis: 'S55',
      media_briefings: 'S54',
      competitive_intel: 'S53',
      persona: 'S51',
      journalist_enrichment: 'S50',
      journalist_timeline: 'S49',
      media_lists: 'S47',
      journalist_graph: 'S46',
      pr_outreach: 'S44',
      media_monitoring: 'S40',
      pitch_engine: 'S39',
      pr_generator: 'S38',
      custom: 'custom',
    };
    return sprintMap[system] || 'unknown';
  }

  async function generateSection(
    orgId: string,
    packId: string,
    sectionType: InvestorSectionType,
    pack: InvestorPackWithSections,
    aggregatedData: Record<InvestorSourceSystem, unknown>,
    userId: string | null,
    userEmail: string | null
  ): Promise<{ section: InvestorPackSection; tokensUsed: number } | null> {
    const startTime = Date.now();

    const prompt = buildSectionPrompt(sectionType, pack, aggregatedData);

    try {
      const response = await openai.chat.completions.create({
        model: pack.llmModel || 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert investor relations writer creating content for ${pack.primaryAudience}.
Write in a ${pack.tone} tone. Target length: ${pack.targetLength}.
Format your response in clear, professional Markdown.`,
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content || '';
      const tokensUsed = response.usage?.total_tokens || 0;
      const durationMs = Date.now() - startTime;

      // Update section in database
      const { data, error } = await db
        .from('investor_pack_sections')
        .update({
          content_md: content,
          status: 'generated' as InvestorSectionStatus,
          raw_llm_json: {
            prompt,
            response: content,
            model: pack.llmModel,
            tokensUsed,
            durationMs,
          },
          source_data: aggregatedData,
        })
        .eq('pack_id', packId)
        .eq('org_id', orgId)
        .eq('section_type', sectionType)
        .select()
        .single();

      if (error || !data) {
        logger.error('Failed to update section', { error, sectionType });
        return null;
      }

      await logPackAction(orgId, packId, userId, userEmail, 'section_generated', {
        sectionType,
        tokensUsed,
        durationMs,
      }, {
        model: pack.llmModel,
        tokensUsed,
        durationMs,
        sectionId: data.id,
      });

      return {
        section: mapSectionRecord(data),
        tokensUsed,
      };
    } catch (error) {
      logger.error('Section generation failed', { error, sectionType, packId });
      return null;
    }
  }

  function buildSectionPrompt(
    sectionType: InvestorSectionType,
    pack: InvestorPackWithSections,
    aggregatedData: Record<InvestorSourceSystem, unknown>
  ): string {
    const periodLabel = `${pack.fiscalQuarter || ''} ${pack.fiscalYear || ''} (${pack.periodStart} to ${pack.periodEnd})`.trim();
    const dataContext = JSON.stringify(aggregatedData, null, 2).slice(0, 5000);

    const sectionPrompts: Record<InvestorSectionType, string> = {
      executive_summary: `Write an executive summary for the investor pack covering ${periodLabel}.
Highlight the most important business developments, key metrics, and strategic outlook.`,

      highlights: `Write a highlights section showcasing the top 5-7 positive developments from ${periodLabel}.
Include quantifiable achievements, wins, and positive trends.`,

      lowlights: `Write a challenges & learnings section covering ${periodLabel}.
Be transparent about setbacks while framing them constructively with mitigation plans.`,

      kpi_overview: `Create a KPI dashboard summary for ${periodLabel}.
Highlight key performance indicators with trends and comparisons to prior periods.`,

      market_context: `Analyze the market environment during ${periodLabel}.
Cover industry trends, market conditions, and their impact on the business.`,

      competition: `Provide competitive landscape analysis for ${periodLabel}.
Cover key competitors, market positioning, and competitive advantages.`,

      product_updates: `Summarize product and technology updates from ${periodLabel}.
Include new features, improvements, and technical milestones.`,

      go_to_market: `Review go-to-market strategy and execution for ${periodLabel}.
Cover sales performance, marketing initiatives, and growth strategies.`,

      customer_stories: `Highlight notable customer success stories from ${periodLabel}.
Include case studies, testimonials, and customer wins.`,

      risk_and_mitigations: `Provide risk analysis for ${periodLabel}.
Identify key risks and describe mitigation strategies.`,

      governance: `Cover governance and compliance matters for ${periodLabel}.
Include board updates, compliance status, and governance improvements.`,

      esg: `Summarize ESG and sustainability initiatives for ${periodLabel}.
Cover environmental, social, and governance progress.`,

      outlook: `Provide forward-looking guidance for the upcoming period.
Include strategic priorities, expected milestones, and outlook.`,

      appendix: `Create an appendix with supporting materials and additional data references.`,
    };

    return `${sectionPrompts[sectionType]}

Period: ${periodLabel}
Pack Format: ${pack.format}
Primary Audience: ${pack.primaryAudience}

Available Context Data:
${dataContext}

Generate professional investor-ready content.`;
  }

  function calculatePackSummary(
    sections: InvestorPackSection[],
    _aggregatedData: Record<InvestorSourceSystem, unknown>
  ): InvestorPackSummaryJson {
    const highlights = sections.find((s) => s.sectionType === 'highlights');
    const lowlights = sections.find((s) => s.sectionType === 'lowlights');

    return {
      highlightsCount: highlights?.contentMd?.split('\n').filter((l) => l.startsWith('-')).length || 0,
      lowlightsCount: lowlights?.contentMd?.split('\n').filter((l) => l.startsWith('-')).length || 0,
      keyMetrics: [],
    };
  }

  // ==========================================================================
  // Section Management
  // ==========================================================================

  async function updateSection(
    orgId: string,
    packId: string,
    sectionId: string,
    userId: string | null,
    userEmail: string | null,
    input: UpdateInvestorSectionRequest
  ): Promise<InvestorPackSection | null> {
    // First get the current section to preserve original content
    const { data: existing } = await db
      .from('investor_pack_sections')
      .select('*')
      .eq('id', sectionId)
      .eq('pack_id', packId)
      .eq('org_id', orgId)
      .single();

    if (!existing) return null;

    const updateData: Record<string, unknown> = {};

    if (input.contentMd !== undefined) {
      // If this is the first edit, save original content
      if (!existing.original_content && existing.content_md) {
        updateData.original_content = existing.content_md;
      }
      updateData.content_md = input.contentMd;
      updateData.status = 'edited' as InvestorSectionStatus;
      updateData.edited_by = userId;
      updateData.edited_at = new Date().toISOString();
    }

    if (input.title !== undefined) updateData.title = input.title;
    if (input.isVisible !== undefined) updateData.is_visible = input.isVisible;

    const { data, error } = await db
      .from('investor_pack_sections')
      .update(updateData)
      .eq('id', sectionId)
      .eq('pack_id', packId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error || !data) return null;

    await logPackAction(orgId, packId, userId, userEmail, 'section_edited', {
      sectionId,
      changes: Object.keys(updateData),
    }, { sectionId });

    return mapSectionRecord(data);
  }

  async function regenerateSection(
    orgId: string,
    packId: string,
    sectionId: string,
    userId: string | null,
    userEmail: string | null,
    input: RegenerateInvestorSectionRequest
  ): Promise<InvestorPackSection | null> {
    const pack = await getPack(orgId, packId);
    if (!pack) return null;

    const section = pack.sections.find((s) => s.id === sectionId);
    if (!section) return null;

    const aggregatedData = await aggregateUpstreamData(orgId, pack.periodStart, pack.periodEnd);

    let prompt = buildSectionPrompt(section.sectionType, pack, aggregatedData);
    if (input.customPrompt) {
      prompt = `${input.customPrompt}\n\n${prompt}`;
    }

    const startTime = Date.now();

    try {
      const response = await openai.chat.completions.create({
        model: pack.llmModel || 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert investor relations writer. Write in a ${pack.tone} tone.`,
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content || '';
      const tokensUsed = response.usage?.total_tokens || 0;
      const durationMs = Date.now() - startTime;

      const { data, error } = await db
        .from('investor_pack_sections')
        .update({
          content_md: content,
          status: 'generated' as InvestorSectionStatus,
          raw_llm_json: {
            prompt,
            response: content,
            model: pack.llmModel,
            tokensUsed,
            durationMs,
          },
          original_content: null, // Clear original since regenerating
          edited_by: null,
          edited_at: null,
        })
        .eq('id', sectionId)
        .eq('pack_id', packId)
        .eq('org_id', orgId)
        .select()
        .single();

      if (error || !data) return null;

      await logPackAction(orgId, packId, userId, userEmail, 'section_regenerated', {
        sectionId,
        sectionType: section.sectionType,
        tokensUsed,
        durationMs,
      }, {
        model: pack.llmModel,
        tokensUsed,
        durationMs,
        sectionId,
      });

      // Update pack token count
      await db
        .from('investor_packs')
        .update({
          total_tokens_used: (pack.totalTokensUsed || 0) + tokensUsed,
        })
        .eq('id', packId)
        .eq('org_id', orgId);

      return mapSectionRecord(data);
    } catch (error) {
      logger.error('Section regeneration failed', { error, sectionId });
      return null;
    }
  }

  async function reorderSections(
    orgId: string,
    packId: string,
    userId: string | null,
    userEmail: string | null,
    input: ReorderInvestorSectionsRequest
  ): Promise<InvestorPackSection[]> {
    const updatePromises = input.sectionOrder.map(({ sectionId, orderIndex }) =>
      db
        .from('investor_pack_sections')
        .update({ order_index: orderIndex })
        .eq('id', sectionId)
        .eq('pack_id', packId)
        .eq('org_id', orgId)
    );

    await Promise.all(updatePromises);

    const { data } = await db
      .from('investor_pack_sections')
      .select('*')
      .eq('pack_id', packId)
      .eq('org_id', orgId)
      .order('order_index', { ascending: true });

    await logPackAction(orgId, packId, userId, userEmail, 'updated', {
      action: 'sections_reordered',
      newOrder: input.sectionOrder,
    });

    return (data || []).map(mapSectionRecord);
  }

  // ==========================================================================
  // Q&A Management
  // ==========================================================================

  async function createQnA(
    orgId: string,
    userId: string | null,
    userEmail: string | null,
    input: CreateInvestorQnARequest
  ): Promise<InvestorQnA> {
    const { data, error } = await db
      .from('investor_qna')
      .insert({
        org_id: orgId,
        pack_id: input.packId || null,
        question: input.question,
        answer_md: input.answerMd,
        category: input.category || 'other',
        tags: input.tags || [],
        confidence: input.confidence || 80,
        is_llm_generated: false,
        source_summary_json: {},
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create Q&A: ${error.message}`);
    }

    await logPackAction(orgId, input.packId || null, userId, userEmail, 'qna_created', {
      qnaId: data.id,
    }, { qnaId: data.id });

    return mapQnARecord(data);
  }

  async function generateQnAs(
    orgId: string,
    userId: string | null,
    userEmail: string | null,
    input: GenerateInvestorQnARequest
  ): Promise<GenerateInvestorQnAResponse> {
    const pack = await getPack(orgId, input.packId);
    if (!pack) {
      throw new Error('Pack not found');
    }

    const startTime = Date.now();
    const categories = input.categories || Object.values([
      'financials',
      'strategy',
      'competition',
      'product',
      'risk',
    ]);
    const count = input.count || 5;

    const aggregatedData = await aggregateUpstreamData(orgId, pack.periodStart, pack.periodEnd);

    const prompt = `Generate ${count} investor Q&A pairs for ${pack.primaryAudience}.
Period: ${pack.fiscalQuarter || ''} ${pack.fiscalYear || ''} (${pack.periodStart} to ${pack.periodEnd})
Pack Format: ${pack.format}

Categories to cover: ${categories.join(', ')}

${input.customContext ? `Additional Context: ${input.customContext}\n` : ''}

Available Context Data:
${JSON.stringify(aggregatedData, null, 2).slice(0, 4000)}

Respond with a JSON array of objects with: question, answer, category, confidence (0-100)`;

    try {
      const response = await openai.chat.completions.create({
        model: pack.llmModel || 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert investor relations professional. Generate realistic Q&A pairs that investors might ask.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 3000,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content || '{"qnas":[]}';
      const tokensUsed = response.usage?.total_tokens || 0;
      const durationMs = Date.now() - startTime;

      let parsedQnAs: Array<{ question: string; answer: string; category: string; confidence: number }> = [];
      try {
        const parsed = JSON.parse(content) as { qnas?: Array<{ question: string; answer: string; category: string; confidence: number }> };
        parsedQnAs = parsed.qnas || [];
      } catch {
        logger.warn('Failed to parse Q&A response', { content });
      }

      const createdQnAs: InvestorQnA[] = [];
      for (const qna of parsedQnAs) {
        const { data, error } = await db
          .from('investor_qna')
          .insert({
            org_id: orgId,
            pack_id: input.packId,
            question: qna.question,
            answer_md: qna.answer,
            category: qna.category as InvestorQnACategory,
            confidence: qna.confidence,
            is_llm_generated: true,
            source_summary_json: { prompt, tokensUsed },
          })
          .select()
          .single();

        if (!error && data) {
          createdQnAs.push(mapQnARecord(data));
        }
      }

      await logPackAction(orgId, input.packId, userId, userEmail, 'qna_generated', {
        count: createdQnAs.length,
        categories,
        tokensUsed,
        durationMs,
      }, { tokensUsed, durationMs });

      return {
        qnas: createdQnAs,
        tokensUsed,
        durationMs,
      };
    } catch (error) {
      logger.error('Q&A generation failed', { error, packId: input.packId });
      throw error;
    }
  }

  async function listQnAs(
    orgId: string,
    query: ListInvestorQnAQuery
  ): Promise<ListInvestorQnAResponse> {
    let dbQuery = db
      .from('investor_qna')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (query.packId) {
      dbQuery = dbQuery.eq('pack_id', query.packId);
    }

    if (query.category) {
      const categories = Array.isArray(query.category) ? query.category : [query.category];
      dbQuery = dbQuery.in('category', categories);
    }

    if (query.status) {
      dbQuery = dbQuery.eq('status', query.status);
    }

    if (query.minConfidence) {
      dbQuery = dbQuery.gte('confidence', query.minConfidence);
    }

    if (query.searchTerm) {
      dbQuery = dbQuery.or(`question.ilike.%${query.searchTerm}%,answer_md.ilike.%${query.searchTerm}%`);
    }

    const limit = query.limit || 20;
    const offset = query.offset || 0;
    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data, error, count } = await dbQuery;

    if (error) {
      throw new Error(`Failed to list Q&As: ${error.message}`);
    }

    return {
      qnas: (data || []).map(mapQnARecord),
      total: count || 0,
      hasMore: (count || 0) > offset + limit,
    };
  }

  async function updateQnA(
    orgId: string,
    qnaId: string,
    userId: string | null,
    userEmail: string | null,
    input: UpdateInvestorQnARequest
  ): Promise<InvestorQnA | null> {
    const updateData: Record<string, unknown> = {};

    if (input.question !== undefined) updateData.question = input.question;
    if (input.answerMd !== undefined) updateData.answer_md = input.answerMd;
    if (input.category !== undefined) updateData.category = input.category;
    if (input.tags !== undefined) updateData.tags = input.tags;
    if (input.confidence !== undefined) updateData.confidence = input.confidence;
    if (input.status !== undefined) updateData.status = input.status;

    if (input.status === 'approved') {
      updateData.approved_by = userId;
      updateData.approved_at = new Date().toISOString();
    }

    const { data, error } = await db
      .from('investor_qna')
      .update(updateData)
      .eq('id', qnaId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error || !data) return null;

    await logPackAction(orgId, data.pack_id, userId, userEmail, 'updated', {
      qnaId,
      changes: Object.keys(updateData),
    }, { qnaId });

    return mapQnARecord(data);
  }

  async function deleteQnA(
    orgId: string,
    qnaId: string
  ): Promise<boolean> {
    const { error } = await db
      .from('investor_qna')
      .delete()
      .eq('id', qnaId)
      .eq('org_id', orgId);

    return !error;
  }

  // ==========================================================================
  // Approval & Publishing
  // ==========================================================================

  async function approvePack(
    orgId: string,
    packId: string,
    userId: string | null,
    userEmail: string | null,
    input: ApproveInvestorPackRequest
  ): Promise<InvestorPack | null> {
    const { data, error } = await db
      .from('investor_packs')
      .update({
        status: 'approved' as InvestorPackStatus,
        approved_by: userId,
        approved_at: new Date().toISOString(),
      })
      .eq('id', packId)
      .eq('org_id', orgId)
      .eq('status', 'review')
      .select()
      .single();

    if (error || !data) return null;

    await logPackAction(orgId, packId, userId, userEmail, 'status_changed', {
      newStatus: 'approved',
      notes: input.notes,
    });

    return mapPackRecord(data);
  }

  async function publishPack(
    orgId: string,
    packId: string,
    userId: string | null,
    userEmail: string | null,
    input: PublishInvestorPackRequest
  ): Promise<PublishInvestorPackResponse | null> {
    // For now, just update status. PDF/PPTX generation would be added later.
    const { data, error } = await db
      .from('investor_packs')
      .update({
        status: 'published' as InvestorPackStatus,
        published_at: new Date().toISOString(),
      })
      .eq('id', packId)
      .eq('org_id', orgId)
      .eq('status', 'approved')
      .select()
      .single();

    if (error || !data) return null;

    await logPackAction(orgId, packId, userId, userEmail, 'published', {
      generatePdf: input.generatePdf,
      generatePptx: input.generatePptx,
    });

    return {
      pack: mapPackRecord(data),
      pdfUrl: data.pdf_storage_path || undefined,
      pptxUrl: data.pptx_storage_path || undefined,
    };
  }

  // ==========================================================================
  // Statistics
  // ==========================================================================

  async function getStats(orgId: string): Promise<InvestorPackStats> {
    const { data: packs } = await db
      .from('investor_packs')
      .select('*')
      .eq('org_id', orgId);

    const { count: qnaCount } = await db
      .from('investor_qna')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId);

    const { count: sectionCount } = await db
      .from('investor_pack_sections')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId);

    const packsList = (packs || []) as PackRecord[];

    // Calculate status counts
    const statusCounts: Record<InvestorPackStatus, number> = {
      draft: 0,
      generating: 0,
      review: 0,
      approved: 0,
      published: 0,
      archived: 0,
    };

    let totalTokens = 0;
    let totalDuration = 0;
    let durationCount = 0;
    let lastPublished: string | null = null;

    const currentQuarter = Math.floor((new Date().getMonth() + 3) / 3);
    const currentYear = new Date().getFullYear();
    let packsThisQuarter = 0;

    for (const pack of packsList) {
      const status = pack.status as InvestorPackStatus;
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      totalTokens += pack.total_tokens_used || 0;

      if (pack.generation_duration_ms) {
        totalDuration += pack.generation_duration_ms;
        durationCount++;
      }

      if (pack.published_at && (!lastPublished || pack.published_at > lastPublished)) {
        lastPublished = pack.published_at;
      }

      const createdDate = new Date(pack.created_at);
      const packQuarter = Math.floor((createdDate.getMonth() + 3) / 3);
      if (createdDate.getFullYear() === currentYear && packQuarter === currentQuarter) {
        packsThisQuarter++;
      }
    }

    // Get approved Q&As count
    const { count: approvedQnACount } = await db
      .from('investor_qna')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('status', 'approved');

    // Get packs by format
    const packsByFormat: Record<string, number> = {
      quarterly_earnings: 0,
      annual_review: 0,
      investor_day: 0,
      board_update: 0,
      fundraising_round: 0,
      custom: 0,
    };
    for (const pack of packsList) {
      if (pack.format in packsByFormat) {
        packsByFormat[pack.format]++;
      }
    }

    // Get recent packs (last 5)
    const recentPacks = packsList
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 5)
      .map(mapPackRecord);

    return {
      totalPacks: packsList.length,
      draftPacks: statusCounts.draft,
      generatingPacks: statusCounts.generating,
      reviewPacks: statusCounts.review,
      approvedPacks: statusCounts.approved,
      publishedPacks: statusCounts.published,
      archivedPacks: statusCounts.archived,
      totalSections: sectionCount || 0,
      totalQnAs: qnaCount || 0,
      approvedQnAs: approvedQnACount || 0,
      totalTokensUsed: totalTokens,
      averageGenerationTimeMs: durationCount > 0 ? Math.round(totalDuration / durationCount) : 0,
      packsThisQuarter,
      lastPublishedAt: lastPublished,
      byStatus: statusCounts as Record<InvestorPackStatus, number>,
      packsByFormat: packsByFormat as Record<InvestorPackFormat, number>,
      recentPacks,
    };
  }

  // ==========================================================================
  // Audit Log
  // ==========================================================================

  async function listAuditLogs(
    orgId: string,
    query: ListInvestorAuditLogQuery
  ): Promise<ListInvestorAuditLogResponse> {
    let dbQuery = db
      .from('investor_pack_audit_log')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (query.packId) {
      dbQuery = dbQuery.eq('pack_id', query.packId);
    }

    if (query.eventType) {
      const eventTypes = Array.isArray(query.eventType) ? query.eventType : [query.eventType];
      dbQuery = dbQuery.in('event_type', eventTypes);
    }

    if (query.userId) {
      dbQuery = dbQuery.eq('user_id', query.userId);
    }

    if (query.startDate) {
      dbQuery = dbQuery.gte('created_at', query.startDate);
    }

    if (query.endDate) {
      dbQuery = dbQuery.lte('created_at', query.endDate);
    }

    const limit = query.limit || 50;
    const offset = query.offset || 0;
    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data, error, count } = await dbQuery;

    if (error) {
      throw new Error(`Failed to list audit logs: ${error.message}`);
    }

    return {
      logs: (data || []).map(mapAuditLogRecord),
      total: count || 0,
      hasMore: (count || 0) > offset + limit,
    };
  }

  // ==========================================================================
  // Return Service Interface
  // ==========================================================================

  return {
    // Pack CRUD
    createPack,
    getPack,
    listPacks,
    updatePack,
    deletePack,
    archivePack,

    // Pack Generation
    generatePack,

    // Section Management
    updateSection,
    regenerateSection,
    reorderSections,

    // Q&A Management
    createQnA,
    generateQnAs,
    listQnAs,
    updateQnA,
    deleteQnA,

    // Approval & Publishing
    approvePack,
    publishPack,

    // Statistics
    getStats,

    // Audit Log
    listAuditLogs,
  };
}

export type InvestorRelationsService = ReturnType<typeof createInvestorRelationsService>;
