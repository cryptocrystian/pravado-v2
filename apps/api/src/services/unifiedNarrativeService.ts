/**
 * Unified Narrative Generator V2 Service (Sprint S70)
 * Cross-domain synthesis engine for multi-layer narrative documents
 * Integrates ALL intelligence systems (S38-S69) into cohesive narratives
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type {
  UnifiedNarrative,
  UnifiedNarrativeSection,
  UnifiedNarrativeSource,
  UnifiedNarrativeDiff,
  UnifiedNarrativeAuditLog,
  NarrativeType,
  NarrativeSectionType,
  NarrativeSourceSystem,
  NarrativeStatus,
  NarrativeFormatType,
  NarrativeEventType,
  NarrativeInsightStrength,
  DeltaType,
  NarrativeInsight,
  CrossSystemPattern,
  ContradictionDetected,
  RiskCluster,
  DataCorrelation,
  AggregatedSourceContext,
  SourceSystemContext,
  NarrativeWithSections,
  ListNarrativesResponse,
  GenerateNarrativeResponse,
  ComputeDeltaResponse,
  ListInsightsResponse,
  NarrativeStats,
  NarrativeGenerationConfig,
  AudienceContext,
  NarrativeDeltaData,
} from '@pravado/types';
import type {
  CreateNarrative,
  UpdateNarrative,
  GenerateNarrative,
  ListNarrativesQuery,
  UpdateNarrativeSection,
  RegenerateNarrativeSection,
  ComputeDelta,
  GetNarrativeInsightsQuery,
  ApproveNarrative,
  PublishNarrative,
  ExportNarrative,
} from '@pravado/validators';
import { routeLLM } from '@pravado/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface ServiceContext {
  supabase: SupabaseClient;
  orgId: string;
  userId?: string;
  userEmail?: string;
}

interface DatabaseNarrative {
  id: string;
  org_id: string;
  title: string;
  subtitle: string | null;
  narrative_type: NarrativeType;
  format: NarrativeFormatType;
  status: NarrativeStatus;
  period_start: string;
  period_end: string;
  fiscal_quarter: string | null;
  fiscal_year: number | null;
  target_audience: string | null;
  audience_context: AudienceContext | null;
  generation_config: NarrativeGenerationConfig | null;
  source_systems: NarrativeSourceSystem[];
  excluded_systems: NarrativeSourceSystem[];
  executive_summary: string | null;
  tldr_synthesis: string | null;
  three_sentence_summary: string | null;
  key_insights: NarrativeInsight[];
  cross_system_patterns: CrossSystemPattern[];
  contradictions_detected: ContradictionDetected[];
  risk_clusters: RiskCluster[];
  correlations: DataCorrelation[];
  overall_sentiment_score: number | null;
  confidence_score: number | null;
  coverage_completeness: number | null;
  insight_density: number | null;
  previous_narrative_id: string | null;
  delta_summary: string | null;
  delta_json: NarrativeDeltaData | null;
  llm_model: string | null;
  llm_version: string | null;
  total_tokens_used: number;
  generation_duration_ms: number | null;
  generated_at: string | null;
  generated_by: string | null;
  approved_at: string | null;
  approved_by: string | null;
  published_at: string | null;
  published_by: string | null;
  export_formats: unknown[];
  last_exported_at: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

interface DatabaseSection {
  id: string;
  narrative_id: string;
  section_type: NarrativeSectionType;
  title: string;
  sort_order: number;
  content_md: string | null;
  content_html: string | null;
  content_plain: string | null;
  key_points: string[];
  supporting_data: Record<string, unknown>;
  visualizations: unknown[];
  source_systems: NarrativeSourceSystem[];
  source_references: unknown[];
  section_insights: NarrativeInsight[];
  insight_strength: NarrativeInsightStrength | null;
  is_generated: boolean;
  is_edited: boolean;
  generation_prompt: string | null;
  llm_model: string | null;
  tokens_used: number;
  confidence_score: number | null;
  quality_score: number | null;
  generated_at: string | null;
  last_edited_at: string | null;
  edited_by: string | null;
  created_at: string;
  updated_at: string;
}

interface DatabaseSource {
  id: string;
  narrative_id: string;
  section_id: string | null;
  source_system: NarrativeSourceSystem;
  source_record_id: string;
  source_record_type: string | null;
  source_title: string | null;
  source_summary: string | null;
  source_date: string | null;
  relevance_score: number | null;
  confidence_score: number | null;
  is_primary_source: boolean;
  usage_context: string | null;
  extracted_insights: NarrativeInsight[];
  extracted_data: Record<string, unknown>;
  created_at: string;
}

interface DatabaseDiff {
  id: string;
  org_id: string;
  current_narrative_id: string;
  previous_narrative_id: string;
  diff_type: DeltaType;
  diff_summary: string | null;
  changes: unknown[];
  sentiment_delta: number | null;
  confidence_delta: number | null;
  sections_added: unknown[];
  sections_removed: unknown[];
  sections_modified: unknown[];
  new_insights: NarrativeInsight[];
  removed_insights: NarrativeInsight[];
  changed_insights: unknown[];
  risk_changes: unknown[];
  pattern_changes: unknown[];
  context_shift_summary: string | null;
  context_shift_factors: string[];
  llm_model: string | null;
  tokens_used: number;
  computed_at: string;
  computed_by: string | null;
  created_at: string;
}

interface DatabaseAuditLog {
  id: string;
  org_id: string;
  narrative_id: string | null;
  section_id: string | null;
  event_type: NarrativeEventType;
  event_description: string | null;
  user_id: string | null;
  user_email: string | null;
  previous_state: Record<string, unknown> | null;
  new_state: Record<string, unknown> | null;
  changes: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// ============================================================================
// MAPPERS
// ============================================================================

function mapNarrativeFromDb(row: DatabaseNarrative): UnifiedNarrative {
  return {
    id: row.id,
    orgId: row.org_id,
    title: row.title,
    subtitle: row.subtitle ?? undefined,
    narrativeType: row.narrative_type,
    format: row.format,
    status: row.status,
    periodStart: new Date(row.period_start),
    periodEnd: new Date(row.period_end),
    fiscalQuarter: row.fiscal_quarter ?? undefined,
    fiscalYear: row.fiscal_year ?? undefined,
    targetAudience: row.target_audience ?? undefined,
    audienceContext: row.audience_context ?? undefined,
    generationConfig: row.generation_config ?? undefined,
    sourceSystems: row.source_systems || [],
    excludedSystems: row.excluded_systems || [],
    executiveSummary: row.executive_summary ?? undefined,
    tldrSynthesis: row.tldr_synthesis ?? undefined,
    threeSentenceSummary: row.three_sentence_summary ?? undefined,
    keyInsights: row.key_insights || [],
    crossSystemPatterns: row.cross_system_patterns || [],
    contradictionsDetected: row.contradictions_detected || [],
    riskClusters: row.risk_clusters || [],
    correlations: row.correlations || [],
    overallSentimentScore: row.overall_sentiment_score ?? undefined,
    confidenceScore: row.confidence_score ?? undefined,
    coverageCompleteness: row.coverage_completeness ?? undefined,
    insightDensity: row.insight_density ?? undefined,
    previousNarrativeId: row.previous_narrative_id ?? undefined,
    deltaSummary: row.delta_summary ?? undefined,
    deltaJson: row.delta_json ?? undefined,
    llmModel: row.llm_model ?? undefined,
    llmVersion: row.llm_version ?? undefined,
    totalTokensUsed: row.total_tokens_used,
    generationDurationMs: row.generation_duration_ms ?? undefined,
    generatedAt: row.generated_at ? new Date(row.generated_at) : undefined,
    generatedBy: row.generated_by ?? undefined,
    approvedAt: row.approved_at ? new Date(row.approved_at) : undefined,
    approvedBy: row.approved_by ?? undefined,
    publishedAt: row.published_at ? new Date(row.published_at) : undefined,
    publishedBy: row.published_by ?? undefined,
    exportFormats: row.export_formats as UnifiedNarrative['exportFormats'],
    lastExportedAt: row.last_exported_at ? new Date(row.last_exported_at) : undefined,
    tags: row.tags || [],
    metadata: row.metadata || {},
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    createdBy: row.created_by ?? undefined,
    updatedBy: row.updated_by ?? undefined,
  };
}

function mapSectionFromDb(row: DatabaseSection): UnifiedNarrativeSection {
  return {
    id: row.id,
    narrativeId: row.narrative_id,
    sectionType: row.section_type,
    title: row.title,
    sortOrder: row.sort_order,
    contentMd: row.content_md ?? undefined,
    contentHtml: row.content_html ?? undefined,
    contentPlain: row.content_plain ?? undefined,
    keyPoints: row.key_points || [],
    supportingData: row.supporting_data || {},
    visualizations: row.visualizations as UnifiedNarrativeSection['visualizations'],
    sourceSystems: row.source_systems || [],
    sourceReferences: row.source_references as UnifiedNarrativeSection['sourceReferences'],
    sectionInsights: row.section_insights || [],
    insightStrength: row.insight_strength ?? undefined,
    isGenerated: row.is_generated,
    isEdited: row.is_edited,
    generationPrompt: row.generation_prompt ?? undefined,
    llmModel: row.llm_model ?? undefined,
    tokensUsed: row.tokens_used,
    confidenceScore: row.confidence_score ?? undefined,
    qualityScore: row.quality_score ?? undefined,
    generatedAt: row.generated_at ? new Date(row.generated_at) : undefined,
    lastEditedAt: row.last_edited_at ? new Date(row.last_edited_at) : undefined,
    editedBy: row.edited_by ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapSourceFromDb(row: DatabaseSource): UnifiedNarrativeSource {
  return {
    id: row.id,
    narrativeId: row.narrative_id,
    sectionId: row.section_id ?? undefined,
    sourceSystem: row.source_system,
    sourceRecordId: row.source_record_id,
    sourceRecordType: row.source_record_type ?? undefined,
    sourceTitle: row.source_title ?? undefined,
    sourceSummary: row.source_summary ?? undefined,
    sourceDate: row.source_date ? new Date(row.source_date) : undefined,
    relevanceScore: row.relevance_score ?? undefined,
    confidenceScore: row.confidence_score ?? undefined,
    isPrimarySource: row.is_primary_source,
    usageContext: row.usage_context ?? undefined,
    extractedInsights: row.extracted_insights || [],
    extractedData: row.extracted_data || {},
    createdAt: new Date(row.created_at),
  };
}

function mapDiffFromDb(row: DatabaseDiff): UnifiedNarrativeDiff {
  return {
    id: row.id,
    orgId: row.org_id,
    currentNarrativeId: row.current_narrative_id,
    previousNarrativeId: row.previous_narrative_id,
    diffType: row.diff_type,
    diffSummary: row.diff_summary ?? undefined,
    changes: row.changes as UnifiedNarrativeDiff['changes'],
    sentimentDelta: row.sentiment_delta ?? undefined,
    confidenceDelta: row.confidence_delta ?? undefined,
    sectionsAdded: row.sections_added as UnifiedNarrativeDiff['sectionsAdded'],
    sectionsRemoved: row.sections_removed as UnifiedNarrativeDiff['sectionsRemoved'],
    sectionsModified: row.sections_modified as UnifiedNarrativeDiff['sectionsModified'],
    newInsights: row.new_insights || [],
    removedInsights: row.removed_insights || [],
    changedInsights: row.changed_insights as UnifiedNarrativeDiff['changedInsights'],
    riskChanges: row.risk_changes as UnifiedNarrativeDiff['riskChanges'],
    patternChanges: row.pattern_changes as UnifiedNarrativeDiff['patternChanges'],
    contextShiftSummary: row.context_shift_summary ?? undefined,
    contextShiftFactors: row.context_shift_factors || [],
    llmModel: row.llm_model ?? undefined,
    tokensUsed: row.tokens_used,
    computedAt: new Date(row.computed_at),
    computedBy: row.computed_by ?? undefined,
    createdAt: new Date(row.created_at),
  };
}

function mapAuditLogFromDb(row: DatabaseAuditLog): UnifiedNarrativeAuditLog {
  return {
    id: row.id,
    orgId: row.org_id,
    narrativeId: row.narrative_id ?? undefined,
    sectionId: row.section_id ?? undefined,
    eventType: row.event_type,
    eventDescription: row.event_description ?? undefined,
    userId: row.user_id ?? undefined,
    userEmail: row.user_email ?? undefined,
    previousState: row.previous_state ?? undefined,
    newState: row.new_state ?? undefined,
    changes: row.changes ?? undefined,
    ipAddress: row.ip_address ?? undefined,
    userAgent: row.user_agent ?? undefined,
    createdAt: new Date(row.created_at),
  };
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

async function logAuditEvent(
  ctx: ServiceContext,
  narrativeId: string | null,
  eventType: NarrativeEventType,
  options: {
    sectionId?: string;
    description?: string;
    previousState?: Record<string, unknown>;
    newState?: Record<string, unknown>;
    changes?: Record<string, unknown>;
  } = {}
): Promise<void> {
  await ctx.supabase.from('unified_narrative_audit_log').insert({
    org_id: ctx.orgId,
    narrative_id: narrativeId,
    section_id: options.sectionId,
    event_type: eventType,
    event_description: options.description,
    user_id: ctx.userId,
    user_email: ctx.userEmail,
    previous_state: options.previousState,
    new_state: options.newState,
    changes: options.changes,
  });
}

// ============================================================================
// NARRATIVE CRUD
// ============================================================================

export async function createNarrative(
  ctx: ServiceContext,
  input: CreateNarrative
): Promise<UnifiedNarrative> {
  const { data, error } = await ctx.supabase
    .from('unified_narratives')
    .insert({
      org_id: ctx.orgId,
      created_by: ctx.userId,
      title: input.title,
      subtitle: input.subtitle,
      narrative_type: input.narrativeType,
      format: input.format || 'long_form',
      period_start: input.periodStart,
      period_end: input.periodEnd,
      fiscal_quarter: input.fiscalQuarter,
      fiscal_year: input.fiscalYear,
      target_audience: input.targetAudience,
      audience_context: input.audienceContext || {},
      generation_config: input.generationConfig || {},
      source_systems: input.sourceSystems || getDefaultSourceSystems(input.narrativeType),
      excluded_systems: input.excludedSystems || [],
      tags: input.tags || [],
      metadata: input.metadata || {},
    })
    .select()
    .single();

  if (error) throw error;

  const narrative = mapNarrativeFromDb(data);
  await logAuditEvent(ctx, narrative.id, 'created', { newState: input as Record<string, unknown> });

  return narrative;
}

export async function getNarrative(
  ctx: ServiceContext,
  narrativeId: string
): Promise<NarrativeWithSections> {
  const { data: narrativeData, error: narrativeError } = await ctx.supabase
    .from('unified_narratives')
    .select('*')
    .eq('id', narrativeId)
    .eq('org_id', ctx.orgId)
    .single();

  if (narrativeError) throw narrativeError;

  const { data: sectionsData, error: sectionsError } = await ctx.supabase
    .from('unified_narrative_sections')
    .select('*')
    .eq('narrative_id', narrativeId)
    .order('sort_order', { ascending: true });

  if (sectionsError) throw sectionsError;

  const { data: sourcesData, error: sourcesError } = await ctx.supabase
    .from('unified_narrative_sources')
    .select('*')
    .eq('narrative_id', narrativeId)
    .order('relevance_score', { ascending: false });

  if (sourcesError) throw sourcesError;

  return {
    narrative: mapNarrativeFromDb(narrativeData),
    sections: (sectionsData || []).map(mapSectionFromDb),
    sources: (sourcesData || []).map(mapSourceFromDb),
  };
}

export async function listNarratives(
  ctx: ServiceContext,
  query: ListNarrativesQuery
): Promise<ListNarrativesResponse> {
  let builder = ctx.supabase
    .from('unified_narratives')
    .select('*', { count: 'exact' })
    .eq('org_id', ctx.orgId);

  if (query.narrativeType) builder = builder.eq('narrative_type', query.narrativeType);
  if (query.status) builder = builder.eq('status', query.status);
  if (query.format) builder = builder.eq('format', query.format);
  if (query.fiscalYear) builder = builder.eq('fiscal_year', query.fiscalYear);
  if (query.fiscalQuarter) builder = builder.eq('fiscal_quarter', query.fiscalQuarter);
  if (query.periodStart) builder = builder.gte('period_start', query.periodStart);
  if (query.periodEnd) builder = builder.lte('period_end', query.periodEnd);
  if (query.search) {
    builder = builder.or(`title.ilike.%${query.search}%,subtitle.ilike.%${query.search}%`);
  }
  if (query.tags && query.tags.length > 0) {
    builder = builder.overlaps('tags', query.tags);
  }
  if (query.sourceSystems && query.sourceSystems.length > 0) {
    builder = builder.overlaps('source_systems', query.sourceSystems);
  }

  const sortColumn = query.sortBy || 'created_at';
  builder = builder.order(sortColumn, { ascending: query.sortOrder === 'asc' });

  const limit = query.limit || 20;
  const offset = query.offset || 0;
  builder = builder.range(offset, offset + limit - 1);

  const { data, error, count } = await builder;
  if (error) throw error;

  return {
    narratives: (data || []).map(mapNarrativeFromDb),
    total: count || 0,
    limit,
    offset,
  };
}

export async function updateNarrative(
  ctx: ServiceContext,
  narrativeId: string,
  input: UpdateNarrative
): Promise<UnifiedNarrative> {
  const updateData: Record<string, unknown> = { updated_by: ctx.userId };

  if (input.title !== undefined) updateData.title = input.title;
  if (input.subtitle !== undefined) updateData.subtitle = input.subtitle;
  if (input.format !== undefined) updateData.format = input.format;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.targetAudience !== undefined) updateData.target_audience = input.targetAudience;
  if (input.audienceContext !== undefined) updateData.audience_context = input.audienceContext;
  if (input.generationConfig !== undefined) updateData.generation_config = input.generationConfig;
  if (input.sourceSystems !== undefined) updateData.source_systems = input.sourceSystems;
  if (input.excludedSystems !== undefined) updateData.excluded_systems = input.excludedSystems;
  if (input.executiveSummary !== undefined) updateData.executive_summary = input.executiveSummary;
  if (input.tldrSynthesis !== undefined) updateData.tldr_synthesis = input.tldrSynthesis;
  if (input.threeSentenceSummary !== undefined) updateData.three_sentence_summary = input.threeSentenceSummary;
  if (input.tags !== undefined) updateData.tags = input.tags;
  if (input.metadata !== undefined) updateData.metadata = input.metadata;

  const { data, error } = await ctx.supabase
    .from('unified_narratives')
    .update(updateData)
    .eq('id', narrativeId)
    .eq('org_id', ctx.orgId)
    .select()
    .single();

  if (error) throw error;

  await logAuditEvent(ctx, narrativeId, 'updated', { changes: input as Record<string, unknown> });

  return mapNarrativeFromDb(data);
}

export async function deleteNarrative(
  ctx: ServiceContext,
  narrativeId: string
): Promise<void> {
  const { error } = await ctx.supabase
    .from('unified_narratives')
    .delete()
    .eq('id', narrativeId)
    .eq('org_id', ctx.orgId);

  if (error) throw error;
}

// ============================================================================
// SOURCE SYSTEM AGGREGATION
// ============================================================================

function getDefaultSourceSystems(narrativeType: NarrativeType): NarrativeSourceSystem[] {
  const baseSystem: NarrativeSourceSystem[] = [
    'media_monitoring',
    'media_performance',
    'brand_reputation',
    'competitive_intel',
  ];

  const typeSpecific: Record<NarrativeType, NarrativeSourceSystem[]> = {
    executive: [...baseSystem, 'exec_command_center', 'exec_digest', 'risk_radar', 'strategic_intelligence'],
    strategy: [...baseSystem, 'strategic_intelligence', 'scenario_playbooks', 'unified_graph'],
    investor: [...baseSystem, 'investor_relations', 'board_reports', 'governance'],
    crisis: [...baseSystem, 'crisis_engine', 'brand_alerts', 'risk_radar'],
    competitive_intelligence: [...baseSystem, 'unified_graph', 'audience_personas'],
    reputation: [...baseSystem, 'brand_alerts', 'media_briefing', 'journalist_graph'],
    quarterly_context: [...baseSystem, 'exec_digest', 'board_reports'],
    talking_points: [...baseSystem, 'media_briefing', 'strategic_intelligence'],
    analyst_brief: [...baseSystem, 'investor_relations', 'competitive_intel'],
    internal_alignment_memo: [...baseSystem, 'strategic_intelligence', 'exec_command_center'],
    tldr_synthesis: baseSystem,
    custom: baseSystem,
  };

  return typeSpecific[narrativeType] || baseSystem;
}

async function aggregateSourceContext(
  ctx: ServiceContext,
  narrativeId: string,
  sourceSystems: NarrativeSourceSystem[],
  periodStart: string,
  periodEnd: string
): Promise<AggregatedSourceContext> {
  const systemContexts: SourceSystemContext[] = [];
  const unavailableSystems: NarrativeSourceSystem[] = [];
  const allInsights: NarrativeInsight[] = [];
  let totalRecords = 0;

  for (const system of sourceSystems) {
    try {
      const context = await fetchSystemContext(ctx, system, narrativeId, periodStart, periodEnd);
      if (context) {
        systemContexts.push(context);
        totalRecords += context.recordCount;
        if (context.topInsights) {
          allInsights.push(...context.topInsights);
        }
      } else {
        unavailableSystems.push(system);
      }
    } catch {
      unavailableSystems.push(system);
    }
  }

  // Analyze cross-system patterns
  const crossSystemPatterns = detectCrossSystemPatterns(systemContexts);
  const contradictions = detectContradictions(systemContexts);
  const riskClusters = clusterRisks(systemContexts);
  const correlations = findCorrelations(systemContexts);

  // Calculate overall data quality
  const qualityScores: number[] = systemContexts.map(c =>
    c.dataQuality === 'high' ? 1 : c.dataQuality === 'medium' ? 0.5 : 0
  );
  const avgQuality = qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length;

  return {
    periodStart: new Date(periodStart),
    periodEnd: new Date(periodEnd),
    systemContexts,
    availableSystems: systemContexts.map(c => c.system),
    unavailableSystems,
    totalRecords,
    overallDataQuality: avgQuality > 0.7 ? 'high' : avgQuality > 0.4 ? 'medium' : 'low',
    crossSystemInsights: allInsights,
    crossSystemPatterns,
    contradictions,
    riskClusters,
    correlations,
  };
}

async function fetchSystemContext(
  ctx: ServiceContext,
  system: NarrativeSourceSystem,
  narrativeId: string,
  periodStart: string,
  periodEnd: string
): Promise<SourceSystemContext | null> {
  // Map system to database tables and queries
  const systemTableMap: Record<NarrativeSourceSystem, { table: string; dateField: string }> = {
    media_briefing: { table: 'media_briefings', dateField: 'created_at' },
    crisis_engine: { table: 'crisis_assessments', dateField: 'created_at' },
    brand_reputation: { table: 'brand_reputation_reports', dateField: 'created_at' },
    brand_alerts: { table: 'brand_reputation_alerts', dateField: 'created_at' },
    governance: { table: 'governance_reports', dateField: 'created_at' },
    risk_radar: { table: 'risk_radar_assessments', dateField: 'created_at' },
    exec_command_center: { table: 'executive_command_center_snapshots', dateField: 'created_at' },
    exec_digest: { table: 'executive_digests', dateField: 'created_at' },
    board_reports: { table: 'board_reports', dateField: 'created_at' },
    investor_relations: { table: 'investor_packs', dateField: 'created_at' },
    strategic_intelligence: { table: 'strategic_intelligence_reports', dateField: 'created_at' },
    unified_graph: { table: 'intelligence_graph_snapshots', dateField: 'created_at' },
    scenario_playbooks: { table: 'scenario_simulations', dateField: 'created_at' },
    media_monitoring: { table: 'media_mentions', dateField: 'created_at' },
    media_performance: { table: 'media_performance_reports', dateField: 'created_at' },
    journalist_graph: { table: 'journalist_identity_nodes', dateField: 'created_at' },
    audience_personas: { table: 'audience_personas', dateField: 'created_at' },
    competitive_intel: { table: 'competitive_intelligence_reports', dateField: 'created_at' },
    content_quality: { table: 'content_quality_analyses', dateField: 'created_at' },
    pr_outreach: { table: 'pr_outreach_campaigns', dateField: 'created_at' },
    custom: { table: '', dateField: '' },
  };

  const config = systemTableMap[system];
  if (!config.table) return null;

  try {
    const { data, count, error } = await ctx.supabase
      .from(config.table)
      .select('*', { count: 'exact' })
      .eq('org_id', ctx.orgId)
      .gte(config.dateField, periodStart)
      .lte(config.dateField, periodEnd)
      .order(config.dateField, { ascending: false })
      .limit(10);

    if (error) throw error;

    const topInsights = extractInsightsFromRecords(system, data || []);

    // Record sources used
    if (data && data.length > 0) {
      for (const record of data.slice(0, 5)) {
        await createSource(ctx, {
          narrativeId,
          sourceSystem: system,
          sourceRecordId: record.id,
          sourceRecordType: config.table,
          sourceTitle: record.title || record.name || `${system} record`,
          sourceSummary: record.summary || record.description,
          sourceDate: record[config.dateField],
          relevanceScore: 0.8,
          isPrimarySource: true,
          extractedInsights: topInsights.slice(0, 3),
          extractedData: { recordId: record.id },
        });
      }
    }

    return {
      system,
      lastUpdated: data?.[0]?.[config.dateField] ? new Date(data[0][config.dateField]) : undefined,
      dataQuality: (count ?? 0) > 5 ? 'high' : (count ?? 0) > 0 ? 'medium' : 'low',
      recordCount: count ?? 0,
      keyMetrics: extractKeyMetrics(system, data || []),
      topInsights,
      summary: generateSystemSummary(system, data || []),
    };
  } catch {
    return null;
  }
}

function extractInsightsFromRecords(
  system: NarrativeSourceSystem,
  records: Record<string, unknown>[]
): NarrativeInsight[] {
  const insights: NarrativeInsight[] = [];

  for (const record of records.slice(0, 5)) {
    const id = `${system}-${record.id || Math.random().toString(36).slice(2)}`;

    // Extract insights based on record content
    const title = record.title || record.name || `Insight from ${system}`;
    const description = record.summary || record.description || record.content || '';

    if (title && typeof title === 'string') {
      insights.push({
        id,
        sourceSystem: system,
        sourceRecordId: record.id as string,
        insightType: 'observation',
        title: String(title).substring(0, 200),
        description: String(description).substring(0, 500),
        strength: 'medium',
        confidenceScore: 0.75,
        supportingData: { recordId: record.id },
        timestamp: record.created_at ? new Date(String(record.created_at)) : undefined,
      });
    }
  }

  return insights;
}

function extractKeyMetrics(
  _system: NarrativeSourceSystem,
  records: Record<string, unknown>[]
): Record<string, number> {
  const metrics: Record<string, number> = {
    recordCount: records.length,
  };

  // Extract numeric metrics from records
  for (const record of records.slice(0, 5)) {
    for (const [key, value] of Object.entries(record)) {
      if (typeof value === 'number' && !key.includes('id')) {
        const metricKey = `avg_${key}`;
        if (!metrics[metricKey]) metrics[metricKey] = 0;
        metrics[metricKey] += value / records.length;
      }
    }
  }

  return metrics;
}

function generateSystemSummary(
  _system: NarrativeSourceSystem,
  records: Record<string, unknown>[]
): string {
  if (records.length === 0) return 'No data available for this period.';
  return `Found ${records.length} relevant records for analysis.`;
}

function detectCrossSystemPatterns(contexts: SourceSystemContext[]): CrossSystemPattern[] {
  const patterns: CrossSystemPattern[] = [];

  // Pattern detection: Sentiment alignment across systems
  const sentimentSystems = contexts.filter(c =>
    c.keyMetrics && (c.keyMetrics.avg_sentiment_score !== undefined || c.keyMetrics.avg_sentiment !== undefined)
  );

  if (sentimentSystems.length >= 2) {
    const sentimentValues = sentimentSystems.map(c =>
      c.keyMetrics?.avg_sentiment_score || c.keyMetrics?.avg_sentiment || 0
    );
    const avgSentiment = sentimentValues.reduce((a, b) => a + b, 0) / sentimentValues.length;
    const variance = sentimentValues.reduce((sum, val) => sum + Math.pow(val - avgSentiment, 2), 0) / sentimentValues.length;

    if (variance < 0.1) {
      patterns.push({
        id: `pattern-sentiment-alignment-${Date.now()}`,
        patternType: 'sentiment_alignment',
        title: 'Cross-System Sentiment Alignment',
        description: `Sentiment is consistently ${avgSentiment > 0.5 ? 'positive' : avgSentiment < -0.5 ? 'negative' : 'neutral'} across ${sentimentSystems.length} systems.`,
        involvedSystems: sentimentSystems.map(c => c.system),
        correlationStrength: 1 - variance,
        confidenceScore: 0.8,
        supportingInsights: [],
        implications: ['Consistent brand perception across channels'],
        recommendations: avgSentiment < 0 ? ['Investigate root cause of negative sentiment'] : [],
      });
    }
  }

  // Pattern detection: Activity spikes across systems
  const highActivitySystems = contexts.filter(c => c.recordCount > 10);
  if (highActivitySystems.length >= 3) {
    patterns.push({
      id: `pattern-activity-spike-${Date.now()}`,
      patternType: 'activity_spike',
      title: 'Cross-System Activity Increase',
      description: `High activity detected across ${highActivitySystems.length} systems.`,
      involvedSystems: highActivitySystems.map(c => c.system),
      correlationStrength: 0.7,
      confidenceScore: 0.75,
      supportingInsights: [],
      implications: ['Increased market activity or campaign effectiveness'],
    });
  }

  return patterns;
}

function detectContradictions(contexts: SourceSystemContext[]): ContradictionDetected[] {
  const contradictions: ContradictionDetected[] = [];

  // Check for sentiment contradictions
  const sentimentContexts = contexts.filter(c =>
    c.keyMetrics && c.keyMetrics.avg_sentiment_score !== undefined
  );

  for (let i = 0; i < sentimentContexts.length; i++) {
    for (let j = i + 1; j < sentimentContexts.length; j++) {
      const s1 = sentimentContexts[i].keyMetrics?.avg_sentiment_score || 0;
      const s2 = sentimentContexts[j].keyMetrics?.avg_sentiment_score || 0;

      if (Math.abs(s1 - s2) > 0.5) {
        contradictions.push({
          id: `contradiction-sentiment-${Date.now()}-${i}-${j}`,
          title: 'Sentiment Discrepancy Detected',
          description: `Significant sentiment difference between ${sentimentContexts[i].system} and ${sentimentContexts[j].system}`,
          systems: [
            { system: sentimentContexts[i].system, assertion: `Sentiment score: ${s1.toFixed(2)}` },
            { system: sentimentContexts[j].system, assertion: `Sentiment score: ${s2.toFixed(2)}` },
          ],
          severity: Math.abs(s1 - s2) > 0.8 ? 'high' : 'medium',
          resolutionSuggestion: 'Investigate the source of sentiment divergence across these channels.',
          needsHumanReview: true,
        });
      }
    }
  }

  return contradictions;
}

function clusterRisks(contexts: SourceSystemContext[]): RiskCluster[] {
  const clusters: RiskCluster[] = [];
  const riskInsights: NarrativeInsight[] = [];

  // Collect risk-related insights from all systems
  for (const context of contexts) {
    const alerts = context.alerts || [];
    for (const alert of alerts) {
      if (alert.level === 'high' || alert.level === 'critical') {
        riskInsights.push({
          id: `risk-${context.system}-${Date.now()}`,
          sourceSystem: context.system,
          insightType: 'risk',
          title: alert.message,
          description: alert.message,
          strength: alert.level as NarrativeInsightStrength,
          confidenceScore: 0.8,
          timestamp: alert.timestamp,
        });
      }
    }
  }

  // Group risks by type
  if (riskInsights.length > 0) {
    const systems = [...new Set(riskInsights.map(r => r.sourceSystem))];
    clusters.push({
      id: `cluster-active-risks-${Date.now()}`,
      clusterName: 'Active Risk Signals',
      description: `${riskInsights.length} active risk signals detected across ${systems.length} systems.`,
      riskLevel: riskInsights.some(r => r.strength === 'critical') ? 'critical' : 'high',
      involvedSystems: systems,
      risks: riskInsights.map(r => ({
        riskId: r.id,
        title: r.title,
        sourceSystem: r.sourceSystem,
        impact: r.description,
      })),
      mitigationSuggestions: ['Review and prioritize risk response actions'],
      monitoringRecommendations: ['Set up real-time alerts for escalation'],
    });
  }

  return clusters;
}

function findCorrelations(contexts: SourceSystemContext[]): DataCorrelation[] {
  const correlations: DataCorrelation[] = [];

  // Find metric correlations between systems
  const metricsData: Array<{ system: NarrativeSourceSystem; metrics: Record<string, number> }> =
    contexts.filter(c => c.keyMetrics && Object.keys(c.keyMetrics).length > 1)
      .map(c => ({ system: c.system, metrics: c.keyMetrics! }));

  if (metricsData.length >= 2) {
    // Check for correlated metrics
    const commonMetrics = new Set<string>();
    for (const { metrics } of metricsData) {
      Object.keys(metrics).forEach(k => commonMetrics.add(k));
    }

    for (const metricName of commonMetrics) {
      if (metricName === 'recordCount') continue;

      const values = metricsData
        .filter(d => d.metrics[metricName] !== undefined)
        .map(d => ({
          system: d.system,
          value: d.metrics[metricName],
        }));

      if (values.length >= 2) {
        correlations.push({
          id: `correlation-${metricName}-${Date.now()}`,
          title: `${metricName} Cross-System Comparison`,
          description: `${metricName} measured across ${values.length} systems.`,
          metrics: values.map(v => ({
            metricName,
            sourceSystem: v.system,
            value: v.value,
          })),
          correlationType: 'complex',
          correlationStrength: 0.6,
          businessImplication: `This metric shows variation across systems, indicating different performance levels.`,
        });
      }
    }
  }

  return correlations;
}

async function createSource(
  ctx: ServiceContext,
  input: {
    narrativeId: string;
    sourceSystem: NarrativeSourceSystem;
    sourceRecordId: string;
    sourceRecordType?: string;
    sourceTitle?: string;
    sourceSummary?: string;
    sourceDate?: string;
    relevanceScore?: number;
    isPrimarySource?: boolean;
    extractedInsights?: NarrativeInsight[];
    extractedData?: Record<string, unknown>;
  }
): Promise<UnifiedNarrativeSource> {
  const { data, error } = await ctx.supabase
    .from('unified_narrative_sources')
    .insert({
      narrative_id: input.narrativeId,
      source_system: input.sourceSystem,
      source_record_id: input.sourceRecordId,
      source_record_type: input.sourceRecordType,
      source_title: input.sourceTitle,
      source_summary: input.sourceSummary,
      source_date: input.sourceDate,
      relevance_score: input.relevanceScore,
      is_primary_source: input.isPrimarySource || false,
      extracted_insights: input.extractedInsights || [],
      extracted_data: input.extractedData || {},
    })
    .select()
    .single();

  if (error) throw error;
  return mapSourceFromDb(data);
}

// ============================================================================
// NARRATIVE GENERATION
// ============================================================================

export async function generateNarrative(
  ctx: ServiceContext,
  narrativeId: string,
  input: Partial<GenerateNarrative> = {}
): Promise<GenerateNarrativeResponse> {
  const startTime = Date.now();

  // Get narrative
  const { data: narrativeData, error: narrativeError } = await ctx.supabase
    .from('unified_narratives')
    .select('*')
    .eq('id', narrativeId)
    .eq('org_id', ctx.orgId)
    .single();

  if (narrativeError) throw narrativeError;

  // Update status to generating
  await ctx.supabase
    .from('unified_narratives')
    .update({ status: 'generating' })
    .eq('id', narrativeId);

  // Aggregate data from all source systems
  const sourceContext = await aggregateSourceContext(
    ctx,
    narrativeId,
    narrativeData.source_systems,
    narrativeData.period_start,
    narrativeData.period_end
  );

  // Generate sections
  const sectionsToGenerate = input.specificSections || getSectionsForType(narrativeData.narrative_type);
  const generatedSections: UnifiedNarrativeSection[] = [];
  let totalTokens = 0;

  for (let i = 0; i < sectionsToGenerate.length; i++) {
    const sectionType = sectionsToGenerate[i];

    // Check for existing section
    const { data: existingSection } = await ctx.supabase
      .from('unified_narrative_sections')
      .select('id')
      .eq('narrative_id', narrativeId)
      .eq('section_type', sectionType)
      .single();

    if (existingSection && !input.regenerateSections) {
      // Skip existing sections unless regenerating
      continue;
    }

    const sectionPrompt = buildSectionPrompt(
      sectionType,
      narrativeData,
      sourceContext,
      input.customPrompt
    );

    try {
      const llmResponse = await routeLLM({
        systemPrompt: getSystemPromptForNarrativeSection(sectionType, narrativeData),
        userPrompt: sectionPrompt,
        model: 'gpt-4o',
        temperature: 0.7,
        maxTokens: 2500,
      });

      const content = llmResponse.content || '';
      const tokensUsed = llmResponse.usage?.totalTokens || 0;
      totalTokens += tokensUsed;

      const parsedContent = parseGeneratedContent(content);

      if (existingSection) {
        // Update existing section
        const { data: updatedSection, error: updateError } = await ctx.supabase
          .from('unified_narrative_sections')
          .update({
            content_md: parsedContent.contentMd,
            content_html: parsedContent.contentHtml,
            content_plain: parsedContent.contentPlain,
            key_points: parsedContent.keyPoints,
            source_systems: sourceContext.availableSystems,
            section_insights: parsedContent.insights,
            is_generated: true,
            is_edited: false,
            llm_model: 'gpt-4o',
            tokens_used: tokensUsed,
            generated_at: new Date().toISOString(),
          })
          .eq('id', existingSection.id)
          .select()
          .single();

        if (updateError) throw updateError;
        generatedSections.push(mapSectionFromDb(updatedSection));
      } else {
        // Create new section
        const { data: newSection, error: insertError } = await ctx.supabase
          .from('unified_narrative_sections')
          .insert({
            narrative_id: narrativeId,
            section_type: sectionType,
            title: getSectionTitle(sectionType),
            sort_order: i,
            content_md: parsedContent.contentMd,
            content_html: parsedContent.contentHtml,
            content_plain: parsedContent.contentPlain,
            key_points: parsedContent.keyPoints,
            source_systems: sourceContext.availableSystems,
            section_insights: parsedContent.insights,
            is_generated: true,
            is_edited: false,
            llm_model: 'gpt-4o',
            tokens_used: tokensUsed,
            generated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (insertError) throw insertError;
        generatedSections.push(mapSectionFromDb(newSection));
      }

      await logAuditEvent(ctx, narrativeId, existingSection ? 'section_regenerated' : 'section_generated', {
        sectionId: existingSection?.id,
        description: `Generated ${sectionType} section`,
      });
    } catch (llmError) {
      console.error(`Failed to generate section ${sectionType}:`, llmError);
    }
  }

  // Generate summaries
  const summaries = await generateSummaries(ctx, narrativeData, sourceContext, generatedSections);

  // Calculate scores
  const scores = calculateNarrativeScores(sourceContext, generatedSections);

  // Update narrative with generated data
  const { data: updatedNarrative, error: updateError } = await ctx.supabase
    .from('unified_narratives')
    .update({
      status: 'review',
      executive_summary: summaries.executiveSummary,
      tldr_synthesis: summaries.tldrSynthesis,
      three_sentence_summary: summaries.threeSentenceSummary,
      key_insights: sourceContext.crossSystemInsights,
      cross_system_patterns: sourceContext.crossSystemPatterns,
      contradictions_detected: sourceContext.contradictions,
      risk_clusters: sourceContext.riskClusters,
      correlations: sourceContext.correlations,
      overall_sentiment_score: scores.sentiment,
      confidence_score: scores.confidence,
      coverage_completeness: scores.coverage,
      insight_density: scores.insightDensity,
      total_tokens_used: totalTokens,
      generation_duration_ms: Date.now() - startTime,
      llm_model: 'gpt-4o',
      generated_at: new Date().toISOString(),
      generated_by: ctx.userId,
    })
    .eq('id', narrativeId)
    .select()
    .single();

  if (updateError) throw updateError;

  await logAuditEvent(ctx, narrativeId, 'generated', {
    description: `Generated narrative with ${generatedSections.length} sections`,
  });

  // Get all sources
  const { data: sources } = await ctx.supabase
    .from('unified_narrative_sources')
    .select('*')
    .eq('narrative_id', narrativeId);

  return {
    narrative: mapNarrativeFromDb(updatedNarrative),
    sections: generatedSections,
    sources: (sources || []).map(mapSourceFromDb),
    insights: sourceContext.crossSystemInsights,
    tokensUsed: totalTokens,
    generationDurationMs: Date.now() - startTime,
  };
}

function getSectionsForType(narrativeType: NarrativeType): NarrativeSectionType[] {
  const sectionMap: Record<NarrativeType, NarrativeSectionType[]> = {
    executive: [
      'executive_summary',
      'strategic_overview',
      'key_achievements',
      'critical_risks',
      'market_position',
      'competitive_landscape',
      'forward_outlook',
    ],
    strategy: [
      'executive_summary',
      'strategic_context',
      'opportunity_analysis',
      'threat_assessment',
      'initiative_priorities',
      'timeline_milestones',
    ],
    investor: [
      'executive_summary',
      'investment_thesis',
      'growth_drivers',
      'market_dynamics',
      'competitive_moat',
      'risk_factors',
      'financial_performance',
      'guidance_outlook',
    ],
    crisis: [
      'executive_summary',
      'situation_assessment',
      'impact_analysis',
      'response_actions',
      'stakeholder_communications',
      'recovery_timeline',
      'lessons_learned',
    ],
    competitive_intelligence: [
      'executive_summary',
      'competitor_overview',
      'market_share_analysis',
      'product_comparison',
      'pricing_analysis',
      'strategic_moves',
      'threat_opportunities',
    ],
    reputation: [
      'executive_summary',
      'brand_health',
      'sentiment_analysis',
      'media_coverage',
      'stakeholder_perception',
      'reputation_risks',
      'enhancement_opportunities',
    ],
    quarterly_context: [
      'executive_summary',
      'quarter_highlights',
      'performance_metrics',
      'trend_analysis',
      'variance_explanation',
      'next_quarter_outlook',
    ],
    talking_points: ['executive_summary', 'key_achievements', 'forward_outlook'],
    analyst_brief: ['executive_summary', 'financial_performance', 'guidance_outlook', 'competitive_moat'],
    internal_alignment_memo: ['executive_summary', 'strategic_context', 'initiative_priorities'],
    tldr_synthesis: ['executive_summary'],
    custom: ['executive_summary', 'custom'],
  };

  return sectionMap[narrativeType] || ['executive_summary'];
}

function getSectionTitle(sectionType: NarrativeSectionType): string {
  const titles: Record<NarrativeSectionType, string> = {
    executive_summary: 'Executive Summary',
    strategic_overview: 'Strategic Overview',
    key_achievements: 'Key Achievements',
    critical_risks: 'Critical Risks',
    market_position: 'Market Position',
    competitive_landscape: 'Competitive Landscape',
    financial_implications: 'Financial Implications',
    forward_outlook: 'Forward Outlook',
    strategic_context: 'Strategic Context',
    opportunity_analysis: 'Opportunity Analysis',
    threat_assessment: 'Threat Assessment',
    resource_allocation: 'Resource Allocation',
    initiative_priorities: 'Initiative Priorities',
    timeline_milestones: 'Timeline & Milestones',
    investment_thesis: 'Investment Thesis',
    growth_drivers: 'Growth Drivers',
    market_dynamics: 'Market Dynamics',
    competitive_moat: 'Competitive Moat',
    risk_factors: 'Risk Factors',
    financial_performance: 'Financial Performance',
    guidance_outlook: 'Guidance & Outlook',
    situation_assessment: 'Situation Assessment',
    impact_analysis: 'Impact Analysis',
    response_actions: 'Response Actions',
    stakeholder_communications: 'Stakeholder Communications',
    recovery_timeline: 'Recovery Timeline',
    lessons_learned: 'Lessons Learned',
    competitor_overview: 'Competitor Overview',
    market_share_analysis: 'Market Share Analysis',
    product_comparison: 'Product Comparison',
    pricing_analysis: 'Pricing Analysis',
    strategic_moves: 'Strategic Moves',
    threat_opportunities: 'Threats & Opportunities',
    brand_health: 'Brand Health',
    sentiment_analysis: 'Sentiment Analysis',
    media_coverage: 'Media Coverage',
    stakeholder_perception: 'Stakeholder Perception',
    reputation_risks: 'Reputation Risks',
    enhancement_opportunities: 'Enhancement Opportunities',
    quarter_highlights: 'Quarter Highlights',
    performance_metrics: 'Performance Metrics',
    trend_analysis: 'Trend Analysis',
    variance_explanation: 'Variance Explanation',
    next_quarter_outlook: 'Next Quarter Outlook',
    introduction: 'Introduction',
    conclusion: 'Conclusion',
    appendix: 'Appendix',
    sources_references: 'Sources & References',
    custom: 'Custom Section',
  };
  return titles[sectionType] || sectionType;
}

function buildSectionPrompt(
  sectionType: NarrativeSectionType,
  narrative: DatabaseNarrative,
  context: AggregatedSourceContext,
  customPrompt?: string
): string {
  const periodStart = new Date(narrative.period_start).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const periodEnd = new Date(narrative.period_end).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  let prompt = `Generate the "${getSectionTitle(sectionType)}" section for a ${narrative.narrative_type} narrative.

Narrative Context:
- Title: ${narrative.title}
- Period: ${periodStart} to ${periodEnd}
- Fiscal Period: ${narrative.fiscal_quarter || 'N/A'} ${narrative.fiscal_year || ''}
- Target Audience: ${narrative.target_audience || 'Executive Leadership'}
- Format: ${narrative.format}

Data Sources Available: ${context.availableSystems.join(', ')}
Total Records Analyzed: ${context.totalRecords}
Data Quality: ${context.overallDataQuality}

Key Insights from Source Systems:
${JSON.stringify(context.crossSystemInsights.slice(0, 10), null, 2)}

Cross-System Patterns Detected:
${JSON.stringify(context.crossSystemPatterns, null, 2)}

Risk Clusters:
${JSON.stringify(context.riskClusters, null, 2)}

Contradictions to Address:
${JSON.stringify(context.contradictions, null, 2)}

`;

  if (customPrompt) {
    prompt += `\nAdditional Instructions: ${customPrompt}\n`;
  }

  prompt += `\nGenerate comprehensive, executive-level content for this section in Markdown format.
Include specific metrics, trends, and actionable insights.
Focus on cross-system synthesis and strategic implications.`;

  return prompt;
}

function getSystemPromptForNarrativeSection(
  sectionType: NarrativeSectionType,
  narrative: DatabaseNarrative
): string {
  const audienceMap: Record<string, string> = {
    executive: 'C-suite executives requiring strategic synthesis',
    strategy: 'strategy teams needing actionable direction',
    investor: 'investors seeking growth potential and risk assessment',
    crisis: 'crisis response teams requiring immediate situational awareness',
    competitive_intelligence: 'competitive analysts needing market intelligence',
    reputation: 'communications teams managing brand perception',
    quarterly_context: 'leadership teams reviewing quarterly performance',
    talking_points: 'executives preparing for external communications',
    analyst_brief: 'financial analysts requiring market context',
    internal_alignment_memo: 'internal teams needing strategic alignment',
    tldr_synthesis: 'busy executives requiring rapid synthesis',
    custom: 'specified audience',
  };

  const audience = audienceMap[narrative.narrative_type] || 'executive leadership';

  return `You are an expert strategic analyst creating a ${getSectionTitle(sectionType)} section for ${audience}.

Your writing should be:
- Cross-system synthesized: Draw insights from multiple data sources
- Pattern-focused: Highlight trends and connections across domains
- Action-oriented: Include clear recommendations and next steps
- Risk-aware: Surface contradictions and potential issues
- Data-driven: Reference specific metrics and evidence

Format your response in clean Markdown with appropriate headers, bullet points, and emphasis.
Include relevant metrics in highlighted callouts where appropriate.
Address any contradictions or data conflicts with balanced analysis.`;
}

function parseGeneratedContent(content: string): {
  contentMd: string;
  contentHtml: string;
  contentPlain: string;
  keyPoints: string[];
  insights: NarrativeInsight[];
} {
  // Basic markdown to HTML conversion
  const contentHtml = content
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/\n/g, '<br>');

  // Extract plain text
  const contentPlain = content
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^-\s+/gm, '• ');

  // Extract key points (bullet items starting with -)
  const keyPoints = (content.match(/^- .+$/gm) || [])
    .map(p => p.replace(/^- /, ''))
    .slice(0, 10);

  // Extract simple insights from headers
  const insights: NarrativeInsight[] = (content.match(/^##+ .+$/gm) || [])
    .slice(0, 5)
    .map((h, i) => ({
      id: `insight-section-${i}`,
      sourceSystem: 'custom' as NarrativeSourceSystem,
      insightType: 'section_insight',
      title: h.replace(/^#+\s+/, ''),
      description: '',
      strength: 'medium' as NarrativeInsightStrength,
      confidenceScore: 0.8,
    }));

  return {
    contentMd: content,
    contentHtml,
    contentPlain,
    keyPoints,
    insights,
  };
}

async function generateSummaries(
  _ctx: ServiceContext,
  narrative: DatabaseNarrative,
  context: AggregatedSourceContext,
  sections: UnifiedNarrativeSection[]
): Promise<{
  executiveSummary: string;
  tldrSynthesis: string;
  threeSentenceSummary: string;
}> {
  // Build executive summary from sections
  const execSection = sections.find(s => s.sectionType === 'executive_summary');
  const executiveSummary = execSection?.contentMd ||
    `Narrative covering ${context.availableSystems.length} intelligence systems with ${context.crossSystemInsights.length} key insights.`;

  // Generate TL;DR
  const topInsights = context.crossSystemInsights.slice(0, 3).map(i => i.title).join('; ');
  const tldrSynthesis = `${narrative.narrative_type} narrative for ${narrative.title}. Key findings: ${topInsights || 'Analysis in progress.'} ${context.riskClusters.length > 0 ? `Watch ${context.riskClusters.length} risk cluster(s).` : ''}`;

  // Three sentence summary
  const threeSentenceSummary = `This ${narrative.narrative_type} narrative synthesizes data from ${context.availableSystems.length} intelligence systems covering ${new Date(narrative.period_start).toLocaleDateString()} to ${new Date(narrative.period_end).toLocaleDateString()}. ${context.crossSystemPatterns.length} cross-system patterns and ${context.riskClusters.length} risk clusters were identified. ${context.contradictions.length > 0 ? `${context.contradictions.length} data contradictions require attention.` : 'Data alignment is consistent across sources.'}`;

  return {
    executiveSummary,
    tldrSynthesis,
    threeSentenceSummary,
  };
}

function calculateNarrativeScores(
  context: AggregatedSourceContext,
  sections: UnifiedNarrativeSection[]
): {
  sentiment: number;
  confidence: number;
  coverage: number;
  insightDensity: number;
} {
  // Calculate sentiment from insights
  const sentimentScores = context.crossSystemInsights
    .filter(i => i.confidenceScore !== undefined)
    .map(i => i.confidenceScore);
  const sentiment = sentimentScores.length > 0
    ? sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length
    : 0.5;

  // Calculate confidence based on data quality
  const confidence = context.overallDataQuality === 'high' ? 0.9
    : context.overallDataQuality === 'medium' ? 0.7
    : 0.5;

  // Calculate coverage
  const allSystems: NarrativeSourceSystem[] = [
    'media_monitoring', 'media_performance', 'brand_reputation',
    'competitive_intel', 'crisis_engine', 'strategic_intelligence',
  ];
  const coverage = context.availableSystems.length / allSystems.length;

  // Calculate insight density
  const insightDensity = sections.reduce((sum, s) =>
    sum + (s.sectionInsights?.length || 0), 0
  );

  return { sentiment, confidence, coverage, insightDensity };
}

// ============================================================================
// SECTION MANAGEMENT
// ============================================================================

export async function updateSection(
  ctx: ServiceContext,
  narrativeId: string,
  sectionId: string,
  input: UpdateNarrativeSection
): Promise<UnifiedNarrativeSection> {
  const updateData: Record<string, unknown> = {
    is_edited: true,
    last_edited_at: new Date().toISOString(),
    edited_by: ctx.userId,
  };

  if (input.title !== undefined) updateData.title = input.title;
  if (input.contentMd !== undefined) {
    updateData.content_md = input.contentMd;
    const parsed = parseGeneratedContent(input.contentMd);
    updateData.content_html = parsed.contentHtml;
    updateData.content_plain = parsed.contentPlain;
  }
  if (input.keyPoints !== undefined) updateData.key_points = input.keyPoints;
  if (input.supportingData !== undefined) updateData.supporting_data = input.supportingData;
  if (input.sortOrder !== undefined) updateData.sort_order = input.sortOrder;

  const { data, error } = await ctx.supabase
    .from('unified_narrative_sections')
    .update(updateData)
    .eq('id', sectionId)
    .eq('narrative_id', narrativeId)
    .select()
    .single();

  if (error) throw error;

  await logAuditEvent(ctx, narrativeId, 'section_edited', {
    sectionId,
    changes: input as Record<string, unknown>,
  });

  return mapSectionFromDb(data);
}

export async function regenerateSection(
  ctx: ServiceContext,
  narrativeId: string,
  sectionId: string,
  input: RegenerateNarrativeSection = { preserveKeyPoints: false }
): Promise<UnifiedNarrativeSection> {
  // Get section and narrative
  const { data: section, error: sectionError } = await ctx.supabase
    .from('unified_narrative_sections')
    .select('*')
    .eq('id', sectionId)
    .eq('narrative_id', narrativeId)
    .single();

  if (sectionError) throw sectionError;

  const { data: narrative, error: narrativeError } = await ctx.supabase
    .from('unified_narratives')
    .select('*')
    .eq('id', narrativeId)
    .eq('org_id', ctx.orgId)
    .single();

  if (narrativeError) throw narrativeError;

  // Re-aggregate context
  const context = await aggregateSourceContext(
    ctx,
    narrativeId,
    narrative.source_systems,
    narrative.period_start,
    narrative.period_end
  );

  // Build prompt with additional context
  let prompt = buildSectionPrompt(section.section_type, narrative, context, input.customPrompt);
  if (input.additionalContext) {
    prompt += `\n\nAdditional Context: ${input.additionalContext}`;
  }

  const llmResponse = await routeLLM({
    systemPrompt: getSystemPromptForNarrativeSection(section.section_type, narrative),
    userPrompt: prompt,
    model: 'gpt-4o',
    temperature: 0.7,
    maxTokens: 2500,
  });

  const content = llmResponse.content || '';
  const tokensUsed = llmResponse.usage?.totalTokens || 0;
  const parsed = parseGeneratedContent(content);

  // Preserve key points if requested
  const keyPoints = input.preserveKeyPoints
    ? [...(section.key_points || []), ...parsed.keyPoints]
    : parsed.keyPoints;

  const { data: updatedSection, error: updateError } = await ctx.supabase
    .from('unified_narrative_sections')
    .update({
      content_md: parsed.contentMd,
      content_html: parsed.contentHtml,
      content_plain: parsed.contentPlain,
      key_points: keyPoints,
      section_insights: parsed.insights,
      is_generated: true,
      is_edited: false,
      generation_prompt: prompt,
      llm_model: 'gpt-4o',
      tokens_used: tokensUsed,
      generated_at: new Date().toISOString(),
    })
    .eq('id', sectionId)
    .select()
    .single();

  if (updateError) throw updateError;

  await logAuditEvent(ctx, narrativeId, 'section_regenerated', {
    sectionId,
    description: `Regenerated ${section.section_type} section`,
  });

  return mapSectionFromDb(updatedSection);
}

// ============================================================================
// DELTA COMPUTATION
// ============================================================================

export async function computeDelta(
  ctx: ServiceContext,
  narrativeId: string,
  input: ComputeDelta
): Promise<ComputeDeltaResponse> {
  // Get current narrative
  const { data: current, error: currentError } = await ctx.supabase
    .from('unified_narratives')
    .select('*')
    .eq('id', narrativeId)
    .eq('org_id', ctx.orgId)
    .single();

  if (currentError) throw currentError;

  // Get previous narrative
  const { data: previous, error: previousError } = await ctx.supabase
    .from('unified_narratives')
    .select('*')
    .eq('id', input.previousNarrativeId)
    .eq('org_id', ctx.orgId)
    .single();

  if (previousError) throw previousError;

  // Get sections for both narratives
  const { data: currentSections } = await ctx.supabase
    .from('unified_narrative_sections')
    .select('*')
    .eq('narrative_id', narrativeId);

  const { data: previousSections } = await ctx.supabase
    .from('unified_narrative_sections')
    .select('*')
    .eq('narrative_id', input.previousNarrativeId);

  // Compute differences
  const currentInsights = current.key_insights || [];
  const previousInsights = previous.key_insights || [];

  const currentInsightIds = new Set(currentInsights.map((i: NarrativeInsight) => i.id));
  const previousInsightIds = new Set(previousInsights.map((i: NarrativeInsight) => i.id));

  const newInsights = currentInsights.filter((i: NarrativeInsight) => !previousInsightIds.has(i.id));
  const removedInsights = previousInsights.filter((i: NarrativeInsight) => !currentInsightIds.has(i.id));

  const currentSectionTypes = new Set((currentSections || []).map(s => s.section_type));
  const previousSectionTypes = new Set((previousSections || []).map(s => s.section_type));

  const sectionsAdded = (currentSections || [])
    .filter(s => !previousSectionTypes.has(s.section_type))
    .map(s => ({ sectionType: s.section_type, title: s.title }));

  const sectionsRemoved = (previousSections || [])
    .filter(s => !currentSectionTypes.has(s.section_type))
    .map(s => ({ sectionType: s.section_type, title: s.title }));

  // Compute score deltas
  const sentimentDelta = (current.overall_sentiment_score || 0) - (previous.overall_sentiment_score || 0);
  const confidenceDelta = (current.confidence_score || 0) - (previous.confidence_score || 0);

  // Determine overall delta type
  let diffType: DeltaType = 'unchanged';
  if (sentimentDelta > 0.1 || confidenceDelta > 0.1 || newInsights.length > removedInsights.length) {
    diffType = 'improved';
  } else if (sentimentDelta < -0.1 || confidenceDelta < -0.1 || newInsights.length < removedInsights.length) {
    diffType = 'declined';
  } else if (newInsights.length > 0) {
    diffType = 'new_insight';
  }

  // Generate diff summary with LLM if detailed analysis requested
  let diffSummary = `Comparing ${current.title} to ${previous.title}: ${newInsights.length} new insights, ${removedInsights.length} removed, sentiment ${sentimentDelta >= 0 ? '+' : ''}${(sentimentDelta * 100).toFixed(1)}%`;
  let tokensUsed = 0;

  if (input.includeDetailedAnalysis) {
    try {
      const llmResponse = await routeLLM({
        systemPrompt: 'You are a strategic analyst comparing two narrative reports. Provide a concise summary of key differences and their implications.',
        userPrompt: `Compare these two narratives:

Current Narrative (${current.title}):
- Period: ${current.period_start} to ${current.period_end}
- Insights: ${currentInsights.length}
- Patterns: ${(current.cross_system_patterns || []).length}
- Sentiment Score: ${current.overall_sentiment_score}

Previous Narrative (${previous.title}):
- Period: ${previous.period_start} to ${previous.period_end}
- Insights: ${previousInsights.length}
- Patterns: ${(previous.cross_system_patterns || []).length}
- Sentiment Score: ${previous.overall_sentiment_score}

New Insights: ${newInsights.map((i: NarrativeInsight) => i.title).join(', ')}
Removed Insights: ${removedInsights.map((i: NarrativeInsight) => i.title).join(', ')}

Provide a strategic summary of changes and their implications.`,
        model: 'gpt-4o',
        temperature: 0.5,
        maxTokens: 500,
      });

      diffSummary = llmResponse.content || diffSummary;
      tokensUsed = llmResponse.usage?.totalTokens || 0;
    } catch {
      // Use simple summary if LLM fails
    }
  }

  // Create diff record
  const { data: diff, error: diffError } = await ctx.supabase
    .from('unified_narrative_diff')
    .insert({
      org_id: ctx.orgId,
      current_narrative_id: narrativeId,
      previous_narrative_id: input.previousNarrativeId,
      diff_type: diffType,
      diff_summary: diffSummary,
      changes: [],
      sentiment_delta: sentimentDelta,
      confidence_delta: confidenceDelta,
      sections_added: sectionsAdded,
      sections_removed: sectionsRemoved,
      sections_modified: [],
      new_insights: newInsights,
      removed_insights: removedInsights,
      changed_insights: [],
      risk_changes: [],
      pattern_changes: [],
      llm_model: input.includeDetailedAnalysis ? 'gpt-4o' : null,
      tokens_used: tokensUsed,
      computed_at: new Date().toISOString(),
      computed_by: ctx.userId,
    })
    .select()
    .single();

  if (diffError) throw diffError;

  // Update narrative with delta reference
  await ctx.supabase
    .from('unified_narratives')
    .update({
      previous_narrative_id: input.previousNarrativeId,
      delta_summary: diffSummary,
    })
    .eq('id', narrativeId);

  await logAuditEvent(ctx, narrativeId, 'delta_computed', {
    description: `Computed delta against ${previous.title}`,
  });

  return {
    diff: mapDiffFromDb(diff),
    summary: diffSummary,
    highlights: [
      `${newInsights.length} new insights identified`,
      `${removedInsights.length} insights from previous period no longer relevant`,
      `Sentiment ${sentimentDelta >= 0 ? 'improved' : 'declined'} by ${Math.abs(sentimentDelta * 100).toFixed(1)}%`,
    ],
    tokensUsed,
  };
}

// ============================================================================
// INSIGHTS
// ============================================================================

export async function getInsights(
  ctx: ServiceContext,
  narrativeId: string,
  query: Partial<GetNarrativeInsightsQuery> = {}
): Promise<ListInsightsResponse> {
  const { data: narrative, error } = await ctx.supabase
    .from('unified_narratives')
    .select('key_insights')
    .eq('id', narrativeId)
    .eq('org_id', ctx.orgId)
    .single();

  if (error) throw error;

  let insights: NarrativeInsight[] = narrative.key_insights || [];

  // Apply filters
  if (query.sourceSystem) {
    insights = insights.filter(i => i.sourceSystem === query.sourceSystem);
  }
  if (query.strength) {
    insights = insights.filter(i => i.strength === query.strength);
  }

  // Group by system and strength
  const bySystem: Record<NarrativeSourceSystem, number> = {} as Record<NarrativeSourceSystem, number>;
  const byStrength: Record<NarrativeInsightStrength, number> = {} as Record<NarrativeInsightStrength, number>;

  for (const insight of insights) {
    bySystem[insight.sourceSystem] = (bySystem[insight.sourceSystem] || 0) + 1;
    byStrength[insight.strength] = (byStrength[insight.strength] || 0) + 1;
  }

  // Paginate
  const limit = query.limit || 20;
  const offset = query.offset || 0;
  const paginatedInsights = insights.slice(offset, offset + limit);

  return {
    insights: paginatedInsights,
    total: insights.length,
    limit,
    offset,
    bySystem,
    byStrength,
  };
}

// ============================================================================
// WORKFLOW
// ============================================================================

export async function approveNarrative(
  ctx: ServiceContext,
  narrativeId: string,
  input: ApproveNarrative = {}
): Promise<UnifiedNarrative> {
  const { data: current } = await ctx.supabase
    .from('unified_narratives')
    .select('status')
    .eq('id', narrativeId)
    .single();

  const { data, error } = await ctx.supabase
    .from('unified_narratives')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: ctx.userId,
    })
    .eq('id', narrativeId)
    .eq('org_id', ctx.orgId)
    .select()
    .single();

  if (error) throw error;

  await logAuditEvent(ctx, narrativeId, 'approved', {
    previousState: { status: current?.status },
    newState: { status: 'approved' },
    changes: { approvalNote: input.approvalNote },
  });

  return mapNarrativeFromDb(data);
}

export async function publishNarrative(
  ctx: ServiceContext,
  narrativeId: string,
  input: PublishNarrative = {}
): Promise<UnifiedNarrative> {
  const { data: current } = await ctx.supabase
    .from('unified_narratives')
    .select('status')
    .eq('id', narrativeId)
    .single();

  const { data, error } = await ctx.supabase
    .from('unified_narratives')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
      published_by: ctx.userId,
    })
    .eq('id', narrativeId)
    .eq('org_id', ctx.orgId)
    .select()
    .single();

  if (error) throw error;

  await logAuditEvent(ctx, narrativeId, 'published', {
    previousState: { status: current?.status },
    newState: { status: 'published' },
    changes: { publishNote: input.publishNote },
  });

  return mapNarrativeFromDb(data);
}

export async function archiveNarrative(
  ctx: ServiceContext,
  narrativeId: string,
  reason?: string
): Promise<UnifiedNarrative> {
  const { data: current } = await ctx.supabase
    .from('unified_narratives')
    .select('status')
    .eq('id', narrativeId)
    .single();

  const { data, error } = await ctx.supabase
    .from('unified_narratives')
    .update({ status: 'archived' })
    .eq('id', narrativeId)
    .eq('org_id', ctx.orgId)
    .select()
    .single();

  if (error) throw error;

  await logAuditEvent(ctx, narrativeId, 'archived', {
    previousState: { status: current?.status },
    newState: { status: 'archived' },
    changes: { archiveReason: reason },
  });

  return mapNarrativeFromDb(data);
}

// ============================================================================
// EXPORT
// ============================================================================

export async function exportNarrative(
  ctx: ServiceContext,
  narrativeId: string,
  input: ExportNarrative
): Promise<{ url: string; format: string }> {
  // Placeholder for export functionality
  await logAuditEvent(ctx, narrativeId, 'exported', {
    changes: { format: input.format },
  });

  return {
    url: `/exports/narratives/${narrativeId}/narrative.${input.format}`,
    format: input.format,
  };
}

// ============================================================================
// STATISTICS
// ============================================================================

export async function getStats(ctx: ServiceContext): Promise<NarrativeStats> {
  const { data: narratives, error } = await ctx.supabase
    .from('unified_narratives')
    .select('*')
    .eq('org_id', ctx.orgId);

  if (error) throw error;

  const byType: Record<NarrativeType, number> = {} as Record<NarrativeType, number>;
  const byStatus: Record<NarrativeStatus, number> = {
    draft: 0,
    generating: 0,
    review: 0,
    approved: 0,
    published: 0,
    archived: 0,
  };
  const byFormat: Record<NarrativeFormatType, number> = {} as Record<NarrativeFormatType, number>;

  let totalTokens = 0;
  let totalTime = 0;
  let totalInsights = 0;
  const insightsByStrength: Record<NarrativeInsightStrength, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    informational: 0,
  };

  for (const n of (narratives || []) as DatabaseNarrative[]) {
    byType[n.narrative_type] = (byType[n.narrative_type] || 0) + 1;
    byStatus[n.status] = (byStatus[n.status] || 0) + 1;
    byFormat[n.format] = (byFormat[n.format] || 0) + 1;

    totalTokens += n.total_tokens_used || 0;
    totalTime += n.generation_duration_ms || 0;

    for (const insight of n.key_insights || []) {
      totalInsights++;
      insightsByStrength[insight.strength] = (insightsByStrength[insight.strength] || 0) + 1;
    }
  }

  const count = narratives?.length || 1;
  const recentNarratives = (narratives || [])
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)
    .map(mapNarrativeFromDb);

  return {
    totalNarratives: narratives?.length || 0,
    byType,
    byStatus,
    byFormat,
    avgTokensUsed: totalTokens / count,
    avgGenerationTime: totalTime / count,
    totalInsights,
    insightsByStrength,
    recentNarratives,
  };
}

// ============================================================================
// AUDIT LOGS
// ============================================================================

export async function listAuditLogs(
  ctx: ServiceContext,
  query: {
    narrativeId?: string;
    eventType?: NarrativeEventType;
    userId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{
  logs: UnifiedNarrativeAuditLog[];
  total: number;
}> {
  let builder = ctx.supabase
    .from('unified_narrative_audit_log')
    .select('*', { count: 'exact' })
    .eq('org_id', ctx.orgId);

  if (query.narrativeId) builder = builder.eq('narrative_id', query.narrativeId);
  if (query.eventType) builder = builder.eq('event_type', query.eventType);
  if (query.userId) builder = builder.eq('user_id', query.userId);
  if (query.startDate) builder = builder.gte('created_at', query.startDate);
  if (query.endDate) builder = builder.lte('created_at', query.endDate);

  builder = builder.order('created_at', { ascending: false });

  const limit = query.limit || 50;
  const offset = query.offset || 0;
  builder = builder.range(offset, offset + limit - 1);

  const { data, error, count } = await builder;
  if (error) throw error;

  return {
    logs: (data || []).map(mapAuditLogFromDb),
    total: count || 0,
  };
}
