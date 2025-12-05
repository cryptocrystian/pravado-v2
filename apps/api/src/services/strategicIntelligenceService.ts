/**
 * Strategic Intelligence Narrative Engine Service (Sprint S65)
 * CEO-level unified strategic intelligence reports synthesizing all Pravado systems
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type {
  StrategicIntelligenceReport,
  StrategicSection,
  StrategicSource,
  StrategicAuditLogEntry,
  StrategicReportFormat,
  StrategicReportStatus,
  StrategicSectionType,
  StrategicSectionStatus,
  StrategicAudience,
  StrategicSourceSystem,
  StrategicEventType,
  StrategicReportWithSections,
  StrategicReportListItem,
  StrategicReportStats,
  AggregatedStrategicInsights,
  StrategicKPIsSnapshot,
  StrategicSummaryJson,
  ListStrategicReportsResponse,
  GenerateStrategicReportResponse,
  PublishStrategicReportResponse,
  RefreshInsightsResponse,
  ListStrategicSourcesResponse,
  ListStrategicAuditLogsResponse,
  PeriodComparison,
} from '@pravado/types';
import type {
  CreateStrategicReport,
  UpdateStrategicReport,
  UpdateStrategicSection,
  ListStrategicReportsQuery,
  ListStrategicSourcesQuery,
  ListStrategicAuditLogsQuery,
  GenerateStrategicReport,
  RegenerateStrategicSection,
  RefreshInsights,
  ReorderStrategicSections,
  AddStrategicSource,
  UpdateStrategicSource,
  ApproveStrategicReport,
  PublishStrategicReport,
  ArchiveStrategicReport,
  ExportStrategicReport,
  ComparePeriods,
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

interface DatabaseReport {
  id: string;
  org_id: string;
  created_by: string | null;
  title: string;
  description: string | null;
  format: StrategicReportFormat;
  status: StrategicReportStatus;
  audience: StrategicAudience;
  period_start: string;
  period_end: string;
  fiscal_quarter: string | null;
  fiscal_year: number | null;
  section_types: StrategicSectionType[];
  kpis_snapshot: StrategicKPIsSnapshot;
  overall_strategic_score: number | null;
  risk_posture_score: number | null;
  opportunity_score: number | null;
  messaging_alignment_score: number | null;
  competitive_position_score: number | null;
  brand_health_score: number | null;
  summary_json: StrategicSummaryJson;
  total_tokens_used: number;
  generation_duration_ms: number | null;
  llm_model: string | null;
  llm_fallback_json: Record<string, unknown> | null;
  tone: string;
  target_length: string;
  include_charts: boolean;
  include_recommendations: boolean;
  published_at: string | null;
  published_by: string | null;
  pdf_storage_path: string | null;
  pptx_storage_path: string | null;
  created_at: string;
  updated_at: string;
}

interface DatabaseSection {
  id: string;
  org_id: string;
  report_id: string;
  section_type: StrategicSectionType;
  title: string | null;
  status: StrategicSectionStatus;
  order_index: number;
  is_visible: boolean;
  content_md: string | null;
  content_html: string | null;
  raw_llm_json: Record<string, unknown> | null;
  charts_config: unknown[];
  data_tables: unknown[];
  section_metrics: Record<string, unknown>;
  source_refs: unknown[];
  is_edited: boolean;
  edited_at: string | null;
  edited_by: string | null;
  regeneration_count: number;
  last_regenerated_at: string | null;
  tokens_used: number;
  generation_duration_ms: number | null;
  created_at: string;
  updated_at: string;
}

interface DatabaseSource {
  id: string;
  org_id: string;
  report_id: string;
  source_system: StrategicSourceSystem;
  source_id: string | null;
  source_type: string | null;
  source_title: string | null;
  source_url: string | null;
  extracted_data: Record<string, unknown>;
  extraction_timestamp: string;
  relevance_score: number | null;
  data_quality_score: number | null;
  is_primary_source: boolean;
  sections_using: string[];
  created_at: string;
  updated_at: string;
}

interface DatabaseAuditLog {
  id: string;
  org_id: string;
  report_id: string;
  event_type: StrategicEventType;
  user_id: string | null;
  user_email: string | null;
  details_json: Record<string, unknown>;
  previous_status: StrategicReportStatus | null;
  new_status: StrategicReportStatus | null;
  section_id: string | null;
  section_type: StrategicSectionType | null;
  tokens_used: number | null;
  duration_ms: number | null;
  created_at: string;
}

// ============================================================================
// MAPPERS
// ============================================================================

function mapReportFromDb(row: DatabaseReport): StrategicIntelligenceReport {
  return {
    id: row.id,
    orgId: row.org_id,
    createdBy: row.created_by,
    title: row.title,
    description: row.description,
    format: row.format,
    status: row.status,
    audience: row.audience,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    fiscalQuarter: row.fiscal_quarter,
    fiscalYear: row.fiscal_year,
    sectionTypes: row.section_types,
    kpisSnapshot: row.kpis_snapshot || {},
    overallStrategicScore: row.overall_strategic_score,
    riskPostureScore: row.risk_posture_score,
    opportunityScore: row.opportunity_score,
    messagingAlignmentScore: row.messaging_alignment_score,
    competitivePositionScore: row.competitive_position_score,
    brandHealthScore: row.brand_health_score,
    summaryJson: row.summary_json || {},
    totalTokensUsed: row.total_tokens_used,
    generationDurationMs: row.generation_duration_ms,
    llmModel: row.llm_model,
    llmFallbackJson: row.llm_fallback_json as StrategicIntelligenceReport['llmFallbackJson'],
    tone: row.tone as StrategicIntelligenceReport['tone'],
    targetLength: row.target_length as StrategicIntelligenceReport['targetLength'],
    includeCharts: row.include_charts,
    includeRecommendations: row.include_recommendations,
    publishedAt: row.published_at,
    publishedBy: row.published_by,
    pdfStoragePath: row.pdf_storage_path,
    pptxStoragePath: row.pptx_storage_path,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSectionFromDb(row: DatabaseSection): StrategicSection {
  return {
    id: row.id,
    orgId: row.org_id,
    reportId: row.report_id,
    sectionType: row.section_type,
    title: row.title,
    status: row.status,
    orderIndex: row.order_index,
    isVisible: row.is_visible,
    contentMd: row.content_md,
    contentHtml: row.content_html,
    rawLlmJson: row.raw_llm_json,
    chartsConfig: row.charts_config as StrategicSection['chartsConfig'],
    dataTables: row.data_tables as StrategicSection['dataTables'],
    sectionMetrics: row.section_metrics as StrategicSection['sectionMetrics'],
    sourceRefs: row.source_refs as StrategicSection['sourceRefs'],
    isEdited: row.is_edited,
    editedAt: row.edited_at,
    editedBy: row.edited_by,
    regenerationCount: row.regeneration_count,
    lastRegeneratedAt: row.last_regenerated_at,
    tokensUsed: row.tokens_used,
    generationDurationMs: row.generation_duration_ms,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSourceFromDb(row: DatabaseSource): StrategicSource {
  return {
    id: row.id,
    orgId: row.org_id,
    reportId: row.report_id,
    sourceSystem: row.source_system,
    sourceId: row.source_id,
    sourceType: row.source_type,
    sourceTitle: row.source_title,
    sourceUrl: row.source_url,
    extractedData: row.extracted_data,
    extractionTimestamp: row.extraction_timestamp,
    relevanceScore: row.relevance_score,
    dataQualityScore: row.data_quality_score,
    isPrimarySource: row.is_primary_source,
    sectionsUsing: row.sections_using,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAuditLogFromDb(row: DatabaseAuditLog): StrategicAuditLogEntry {
  return {
    id: row.id,
    orgId: row.org_id,
    reportId: row.report_id,
    eventType: row.event_type,
    userId: row.user_id,
    userEmail: row.user_email,
    detailsJson: row.details_json,
    previousStatus: row.previous_status,
    newStatus: row.new_status,
    sectionId: row.section_id,
    sectionType: row.section_type,
    tokensUsed: row.tokens_used,
    durationMs: row.duration_ms,
    createdAt: row.created_at,
  };
}

function mapReportToListItem(report: StrategicIntelligenceReport, sectionCount: number): StrategicReportListItem {
  return {
    id: report.id,
    title: report.title,
    format: report.format,
    status: report.status,
    audience: report.audience,
    periodStart: report.periodStart,
    periodEnd: report.periodEnd,
    fiscalQuarter: report.fiscalQuarter,
    fiscalYear: report.fiscalYear,
    overallStrategicScore: report.overallStrategicScore,
    sectionCount,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
  };
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

async function logAuditEvent(
  ctx: ServiceContext,
  reportId: string,
  eventType: StrategicEventType,
  details: Record<string, unknown> = {},
  options: {
    previousStatus?: StrategicReportStatus;
    newStatus?: StrategicReportStatus;
    sectionId?: string;
    sectionType?: StrategicSectionType;
    tokensUsed?: number;
    durationMs?: number;
  } = {}
): Promise<void> {
  await ctx.supabase.from('strategic_intelligence_audit_log').insert({
    org_id: ctx.orgId,
    report_id: reportId,
    event_type: eventType,
    user_id: ctx.userId,
    user_email: ctx.userEmail,
    details_json: details,
    previous_status: options.previousStatus,
    new_status: options.newStatus,
    section_id: options.sectionId,
    section_type: options.sectionType,
    tokens_used: options.tokensUsed,
    duration_ms: options.durationMs,
  });
}

// ============================================================================
// REPORT CRUD
// ============================================================================

export async function createReport(
  ctx: ServiceContext,
  input: CreateStrategicReport
): Promise<StrategicIntelligenceReport> {
  const { data, error } = await ctx.supabase
    .from('strategic_intelligence_reports')
    .insert({
      org_id: ctx.orgId,
      created_by: ctx.userId,
      title: input.title,
      description: input.description,
      format: input.format,
      audience: input.audience,
      period_start: input.periodStart,
      period_end: input.periodEnd,
      fiscal_quarter: input.fiscalQuarter,
      fiscal_year: input.fiscalYear,
      section_types: input.sectionTypes,
      tone: input.tone,
      target_length: input.targetLength,
      include_charts: input.includeCharts,
      include_recommendations: input.includeRecommendations,
    })
    .select()
    .single();

  if (error) throw error;
  const report = mapReportFromDb(data);

  await logAuditEvent(ctx, report.id, 'created', { input });

  return report;
}

export async function getReport(
  ctx: ServiceContext,
  reportId: string
): Promise<StrategicReportWithSections> {
  const { data: reportData, error: reportError } = await ctx.supabase
    .from('strategic_intelligence_reports')
    .select('*')
    .eq('id', reportId)
    .eq('org_id', ctx.orgId)
    .single();

  if (reportError) throw reportError;

  const { data: sectionsData, error: sectionsError } = await ctx.supabase
    .from('strategic_intelligence_sections')
    .select('*')
    .eq('report_id', reportId)
    .eq('org_id', ctx.orgId)
    .order('order_index', { ascending: true });

  if (sectionsError) throw sectionsError;

  const { data: sourcesData, error: sourcesError } = await ctx.supabase
    .from('strategic_intelligence_sources')
    .select('*')
    .eq('report_id', reportId)
    .eq('org_id', ctx.orgId)
    .order('relevance_score', { ascending: false });

  if (sourcesError) throw sourcesError;

  return {
    report: mapReportFromDb(reportData),
    sections: (sectionsData || []).map(mapSectionFromDb),
    sources: (sourcesData || []).map(mapSourceFromDb),
  };
}

export async function listReports(
  ctx: ServiceContext,
  query: ListStrategicReportsQuery
): Promise<ListStrategicReportsResponse> {
  let builder = ctx.supabase
    .from('strategic_intelligence_reports')
    .select('*', { count: 'exact' })
    .eq('org_id', ctx.orgId);

  if (query.status) builder = builder.eq('status', query.status);
  if (query.format) builder = builder.eq('format', query.format);
  if (query.audience) builder = builder.eq('audience', query.audience);
  if (query.fiscalQuarter) builder = builder.eq('fiscal_quarter', query.fiscalQuarter);
  if (query.fiscalYear) builder = builder.eq('fiscal_year', query.fiscalYear);
  if (query.periodStart) builder = builder.gte('period_start', query.periodStart);
  if (query.periodEnd) builder = builder.lte('period_end', query.periodEnd);
  if (query.search) {
    builder = builder.or(`title.ilike.%${query.search}%,description.ilike.%${query.search}%`);
  }

  const sortColumn = query.sortBy.replace(/([A-Z])/g, '_$1').toLowerCase();
  builder = builder.order(sortColumn, { ascending: query.sortOrder === 'asc' });
  builder = builder.range(query.offset, query.offset + query.limit - 1);

  const { data, error, count } = await builder;
  if (error) throw error;

  const reports = (data || []).map(mapReportFromDb);

  // Get section counts for each report
  const reportIds = reports.map(r => r.id);
  const { data: sectionCounts } = await ctx.supabase
    .from('strategic_intelligence_sections')
    .select('report_id')
    .in('report_id', reportIds);

  const countMap = new Map<string, number>();
  (sectionCounts || []).forEach(s => {
    countMap.set(s.report_id, (countMap.get(s.report_id) || 0) + 1);
  });

  return {
    reports: reports.map(r => mapReportToListItem(r, countMap.get(r.id) || 0)),
    total: count || 0,
    limit: query.limit,
    offset: query.offset,
    hasMore: (query.offset + query.limit) < (count || 0),
  };
}

export async function updateReport(
  ctx: ServiceContext,
  reportId: string,
  input: UpdateStrategicReport
): Promise<StrategicIntelligenceReport> {
  const updateData: Record<string, unknown> = {};
  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.format !== undefined) updateData.format = input.format;
  if (input.audience !== undefined) updateData.audience = input.audience;
  if (input.periodStart !== undefined) updateData.period_start = input.periodStart;
  if (input.periodEnd !== undefined) updateData.period_end = input.periodEnd;
  if (input.fiscalQuarter !== undefined) updateData.fiscal_quarter = input.fiscalQuarter;
  if (input.fiscalYear !== undefined) updateData.fiscal_year = input.fiscalYear;
  if (input.sectionTypes !== undefined) updateData.section_types = input.sectionTypes;
  if (input.tone !== undefined) updateData.tone = input.tone;
  if (input.targetLength !== undefined) updateData.target_length = input.targetLength;
  if (input.includeCharts !== undefined) updateData.include_charts = input.includeCharts;
  if (input.includeRecommendations !== undefined) updateData.include_recommendations = input.includeRecommendations;

  const { data, error } = await ctx.supabase
    .from('strategic_intelligence_reports')
    .update(updateData)
    .eq('id', reportId)
    .eq('org_id', ctx.orgId)
    .select()
    .single();

  if (error) throw error;

  await logAuditEvent(ctx, reportId, 'updated', { changes: input });

  return mapReportFromDb(data);
}

export async function deleteReport(
  ctx: ServiceContext,
  reportId: string
): Promise<void> {
  const { error } = await ctx.supabase
    .from('strategic_intelligence_reports')
    .delete()
    .eq('id', reportId)
    .eq('org_id', ctx.orgId);

  if (error) throw error;
}

// ============================================================================
// STATISTICS
// ============================================================================

export async function getStats(ctx: ServiceContext): Promise<StrategicReportStats> {
  const { data: reports, error } = await ctx.supabase
    .from('strategic_intelligence_reports')
    .select('*')
    .eq('org_id', ctx.orgId);

  if (error) throw error;

  const byStatus: Record<StrategicReportStatus, number> = {
    draft: 0,
    generating: 0,
    review: 0,
    approved: 0,
    published: 0,
    archived: 0,
  };

  const byFormat: Record<StrategicReportFormat, number> = {
    quarterly_strategic_review: 0,
    annual_strategic_assessment: 0,
    board_strategy_brief: 0,
    ceo_intelligence_brief: 0,
    investor_strategy_update: 0,
    crisis_strategic_response: 0,
    competitive_strategy_report: 0,
    custom: 0,
  };

  const byAudience: Record<StrategicAudience, number> = {
    ceo: 0,
    c_suite: 0,
    board: 0,
    investors: 0,
    senior_leadership: 0,
    all_executives: 0,
  };

  let totalStrategicScore = 0;
  let strategicScoreCount = 0;
  let totalRiskScore = 0;
  let riskScoreCount = 0;
  let totalOpportunityScore = 0;
  let opportunityScoreCount = 0;

  (reports || []).forEach((r: DatabaseReport) => {
    byStatus[r.status]++;
    byFormat[r.format]++;
    byAudience[r.audience]++;

    if (r.overall_strategic_score !== null) {
      totalStrategicScore += r.overall_strategic_score;
      strategicScoreCount++;
    }
    if (r.risk_posture_score !== null) {
      totalRiskScore += r.risk_posture_score;
      riskScoreCount++;
    }
    if (r.opportunity_score !== null) {
      totalOpportunityScore += r.opportunity_score;
      opportunityScoreCount++;
    }
  });

  // Get section and source counts
  const { count: sectionCount } = await ctx.supabase
    .from('strategic_intelligence_sections')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', ctx.orgId);

  const { count: sourceCount } = await ctx.supabase
    .from('strategic_intelligence_sources')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', ctx.orgId);

  // Get recent reports
  const mappedReports = (reports || []).map(mapReportFromDb);
  const recentReports = mappedReports
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map(r => mapReportToListItem(r, 0));

  return {
    totalReports: reports?.length || 0,
    byStatus,
    byFormat,
    byAudience,
    avgStrategicScore: strategicScoreCount > 0 ? totalStrategicScore / strategicScoreCount : null,
    avgRiskScore: riskScoreCount > 0 ? totalRiskScore / riskScoreCount : null,
    avgOpportunityScore: opportunityScoreCount > 0 ? totalOpportunityScore / opportunityScoreCount : null,
    recentReports,
    totalSections: sectionCount || 0,
    totalSources: sourceCount || 0,
  };
}

// ============================================================================
// DATA AGGREGATION
// ============================================================================

async function aggregateInsightsFromSources(
  ctx: ServiceContext,
  reportId: string,
  includeSources?: StrategicSourceSystem[],
  excludeSources?: StrategicSourceSystem[]
): Promise<AggregatedStrategicInsights> {
  const insights: AggregatedStrategicInsights = {};

  // Define which sources to query
  const allSources: StrategicSourceSystem[] = [
    'media_performance',
    'competitive_intel',
    'crisis_engine',
    'brand_reputation',
    'governance',
    'investor_relations',
    'exec_command_center',
  ];

  const sourcesToQuery = (includeSources || allSources).filter(
    s => !excludeSources?.includes(s)
  );

  // Aggregate from Media Performance (if available)
  if (sourcesToQuery.includes('media_performance')) {
    try {
      const { data } = await ctx.supabase
        .from('media_performance_reports')
        .select('*')
        .eq('org_id', ctx.orgId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        insights.mediaPerformance = {
          overallScore: data.overall_score || 0,
          reach: data.total_reach || 0,
          impressions: data.total_impressions || 0,
          sentiment: data.sentiment_score || 0,
          topMentions: data.top_outlets || [],
          trends: data.trend_data || [],
        };

        await createSource(ctx, {
          reportId,
          sourceSystem: 'media_performance',
          sourceId: data.id,
          sourceType: 'report',
          sourceTitle: 'Media Performance Report',
          extractedData: insights.mediaPerformance,
          relevanceScore: 85,
          isPrimarySource: true,
        });
      }
    } catch {
      // Source not available, continue
    }
  }

  // Aggregate from Competitive Intelligence
  if (sourcesToQuery.includes('competitive_intel')) {
    try {
      const { data } = await ctx.supabase
        .from('competitive_intelligence_reports')
        .select('*')
        .eq('org_id', ctx.orgId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        insights.competitiveIntel = {
          positionIndex: data.position_index || 0,
          topCompetitors: data.top_competitors || [],
          strengthsVsCompetitors: data.strengths || [],
          weaknessesVsCompetitors: data.weaknesses || [],
          marketTrends: data.market_trends || [],
        };

        await createSource(ctx, {
          reportId,
          sourceSystem: 'competitive_intel',
          sourceId: data.id,
          sourceType: 'report',
          sourceTitle: 'Competitive Intelligence Report',
          extractedData: insights.competitiveIntel,
          relevanceScore: 90,
          isPrimarySource: true,
        });
      }
    } catch {
      // Source not available, continue
    }
  }

  // Aggregate from Crisis Engine
  if (sourcesToQuery.includes('crisis_engine')) {
    try {
      const { data: crisisData } = await ctx.supabase
        .from('crisis_assessments')
        .select('*')
        .eq('org_id', ctx.orgId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (crisisData && crisisData.length > 0) {
        const activeCrises = crisisData.filter(c => c.status === 'active').length;
        insights.crisisStatus = {
          readinessScore: crisisData[0].readiness_score || 75,
          activeCrises,
          recentCrises: crisisData.slice(0, 3).map(c => ({
            title: c.title,
            severity: c.severity,
            resolvedAt: c.resolved_at,
          })),
          riskFactors: crisisData[0].risk_factors || [],
        };

        await createSource(ctx, {
          reportId,
          sourceSystem: 'crisis_engine',
          sourceId: crisisData[0].id,
          sourceType: 'assessment',
          sourceTitle: 'Crisis Assessment',
          extractedData: insights.crisisStatus,
          relevanceScore: 95,
          isPrimarySource: true,
        });
      }
    } catch {
      // Source not available, continue
    }
  }

  // Aggregate from Brand Reputation
  if (sourcesToQuery.includes('brand_reputation')) {
    try {
      const { data } = await ctx.supabase
        .from('brand_reputation_reports')
        .select('*')
        .eq('org_id', ctx.orgId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        insights.brandHealth = {
          overallScore: data.overall_score || 0,
          awarenessIndex: data.awareness_index || 0,
          sentimentTrend: data.sentiment_trend || 'stable',
          keyAttributes: data.key_attributes || [],
          reputationRisks: data.reputation_risks || [],
        };

        await createSource(ctx, {
          reportId,
          sourceSystem: 'brand_reputation',
          sourceId: data.id,
          sourceType: 'report',
          sourceTitle: 'Brand Reputation Report',
          extractedData: insights.brandHealth,
          relevanceScore: 85,
          isPrimarySource: true,
        });
      }
    } catch {
      // Source not available, continue
    }
  }

  // Aggregate from Governance
  if (sourcesToQuery.includes('governance')) {
    try {
      const { data } = await ctx.supabase
        .from('governance_reports')
        .select('*')
        .eq('org_id', ctx.orgId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        insights.governance = {
          complianceScore: data.compliance_score || 0,
          esgScore: data.esg_score || 0,
          openIssues: data.open_issues || 0,
          upcomingDeadlines: data.upcoming_deadlines || [],
        };

        await createSource(ctx, {
          reportId,
          sourceSystem: 'governance',
          sourceId: data.id,
          sourceType: 'report',
          sourceTitle: 'Governance Report',
          extractedData: insights.governance,
          relevanceScore: 80,
          isPrimarySource: true,
        });
      }
    } catch {
      // Source not available, continue
    }
  }

  // Aggregate from Investor Relations
  if (sourcesToQuery.includes('investor_relations')) {
    try {
      const { data } = await ctx.supabase
        .from('investor_packs')
        .select('*')
        .eq('org_id', ctx.orgId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        insights.investorSentiment = {
          overallScore: data.investor_sentiment_score || 0,
          analystCoverage: data.analyst_coverage || 0,
          recentEarnings: {
            quarter: data.fiscal_quarter || '',
            sentiment: data.earnings_sentiment || 'neutral',
          },
          keyQuestions: data.key_questions || [],
        };

        await createSource(ctx, {
          reportId,
          sourceSystem: 'investor_relations',
          sourceId: data.id,
          sourceType: 'pack',
          sourceTitle: 'Investor Pack',
          extractedData: insights.investorSentiment,
          relevanceScore: 90,
          isPrimarySource: true,
        });
      }
    } catch {
      // Source not available, continue
    }
  }

  // Aggregate from Executive Command Center
  if (sourcesToQuery.includes('exec_command_center')) {
    try {
      const { data } = await ctx.supabase
        .from('executive_command_center_snapshots')
        .select('*')
        .eq('org_id', ctx.orgId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        insights.executiveMetrics = {
          overallHealthScore: data.overall_health_score || 0,
          priorityAlerts: data.priority_alerts || 0,
          pendingDecisions: data.pending_decisions || 0,
          recentDigests: data.recent_digests || [],
        };

        await createSource(ctx, {
          reportId,
          sourceSystem: 'exec_command_center',
          sourceId: data.id,
          sourceType: 'snapshot',
          sourceTitle: 'Executive Command Center Snapshot',
          extractedData: insights.executiveMetrics,
          relevanceScore: 95,
          isPrimarySource: true,
        });
      }
    } catch {
      // Source not available, continue
    }
  }

  return insights;
}

function computeKPIsSnapshot(insights: AggregatedStrategicInsights): StrategicKPIsSnapshot {
  return {
    mediaReach: insights.mediaPerformance?.reach,
    mediaMentions: insights.mediaPerformance?.impressions,
    shareOfVoice: insights.competitiveIntel?.positionIndex,
    sentimentScore: insights.mediaPerformance?.sentiment,
    brandHealthScore: insights.brandHealth?.overallScore,
    brandAwarenessIndex: insights.brandHealth?.awarenessIndex,
    reputationScore: insights.brandHealth?.overallScore,
    crisisReadinessScore: insights.crisisStatus?.readinessScore,
    activeCrisisCount: insights.crisisStatus?.activeCrises,
    complianceScore: insights.governance?.complianceScore,
    esgScore: insights.governance?.esgScore,
    investorEngagementScore: insights.investorSentiment?.overallScore,
    analystCoverageCount: insights.investorSentiment?.analystCoverage,
    competitivePositionIndex: insights.competitiveIntel?.positionIndex,
  };
}

function computeStrategicScores(
  insights: AggregatedStrategicInsights
): {
  overall: number | null;
  risk: number | null;
  opportunity: number | null;
  messaging: number | null;
  competitive: number | null;
  brand: number | null;
} {
  const scores: number[] = [];

  if (insights.mediaPerformance?.overallScore) scores.push(insights.mediaPerformance.overallScore);
  if (insights.competitiveIntel?.positionIndex) scores.push(insights.competitiveIntel.positionIndex);
  if (insights.brandHealth?.overallScore) scores.push(insights.brandHealth.overallScore);
  if (insights.governance?.complianceScore) scores.push(insights.governance.complianceScore);

  const overall = scores.length > 0
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : null;

  return {
    overall,
    risk: insights.crisisStatus?.readinessScore ?? null,
    opportunity: insights.competitiveIntel?.positionIndex ?? null,
    messaging: insights.mediaPerformance?.sentiment ?? null,
    competitive: insights.competitiveIntel?.positionIndex ?? null,
    brand: insights.brandHealth?.overallScore ?? null,
  };
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

export async function generateReport(
  ctx: ServiceContext,
  reportId: string,
  input: Partial<GenerateStrategicReport> = {}
): Promise<GenerateStrategicReportResponse> {
  const startTime = Date.now();

  // Get report
  const { data: reportData, error: reportError } = await ctx.supabase
    .from('strategic_intelligence_reports')
    .select('*')
    .eq('id', reportId)
    .eq('org_id', ctx.orgId)
    .single();

  if (reportError) throw reportError;

  // Update status to generating
  await ctx.supabase
    .from('strategic_intelligence_reports')
    .update({ status: 'generating' })
    .eq('id', reportId);

  // Aggregate insights from all sources
  const insights = await aggregateInsightsFromSources(
    ctx,
    reportId,
    input.includeSources,
    input.excludeSources
  );

  // Compute KPIs and scores
  const kpisSnapshot = computeKPIsSnapshot(insights);
  const scores = computeStrategicScores(insights);

  // Generate sections
  const sectionsToGenerate = input.regenerateSections || reportData.section_types;
  const generatedSections: StrategicSection[] = [];
  let totalTokens = 0;

  for (let i = 0; i < sectionsToGenerate.length; i++) {
    const sectionType = sectionsToGenerate[i];

    // Check if section exists
    const { data: existingSection } = await ctx.supabase
      .from('strategic_intelligence_sections')
      .select('id')
      .eq('report_id', reportId)
      .eq('section_type', sectionType)
      .single();

    const sectionPrompt = buildSectionPrompt(
      sectionType,
      reportData,
      insights,
      input.customInstructions
    );

    try {
      const llmResponse = await routeLLM({
        systemPrompt: getSystemPromptForSection(sectionType, reportData.audience),
        userPrompt: sectionPrompt,
        model: 'gpt-4o',
        temperature: 0.7,
        maxTokens: 2000,
      });

      const content = llmResponse.content || '';
      const tokensUsed = llmResponse.usage?.totalTokens || 0;
      totalTokens += tokensUsed;

      // Parse the generated content
      const parsedContent = parseGeneratedContent(content, sectionType);

      if (existingSection) {
        // Update existing section
        const { data: updatedSection, error: updateError } = await ctx.supabase
          .from('strategic_intelligence_sections')
          .update({
            content_md: parsedContent.contentMd,
            content_html: parsedContent.contentHtml,
            raw_llm_json: { raw: content },
            section_metrics: parsedContent.metrics,
            status: 'generated',
            regeneration_count: ctx.supabase.rpc('increment', { x: 1 }),
            last_regenerated_at: new Date().toISOString(),
            tokens_used: tokensUsed,
            generation_duration_ms: Date.now() - startTime,
          })
          .eq('id', existingSection.id)
          .select()
          .single();

        if (updateError) throw updateError;
        generatedSections.push(mapSectionFromDb(updatedSection));

        await logAuditEvent(ctx, reportId, 'section_regenerated', {
          sectionType,
          tokensUsed,
        }, {
          sectionId: existingSection.id,
          sectionType,
          tokensUsed,
        });
      } else {
        // Create new section
        const { data: newSection, error: insertError } = await ctx.supabase
          .from('strategic_intelligence_sections')
          .insert({
            org_id: ctx.orgId,
            report_id: reportId,
            section_type: sectionType,
            title: getSectionTitle(sectionType),
            status: 'generated',
            order_index: i,
            is_visible: true,
            content_md: parsedContent.contentMd,
            content_html: parsedContent.contentHtml,
            raw_llm_json: { raw: content },
            section_metrics: parsedContent.metrics,
            tokens_used: tokensUsed,
            generation_duration_ms: Date.now() - startTime,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        generatedSections.push(mapSectionFromDb(newSection));

        await logAuditEvent(ctx, reportId, 'section_generated', {
          sectionType,
          tokensUsed,
        }, {
          sectionId: newSection.id,
          sectionType,
          tokensUsed,
        });
      }
    } catch (llmError) {
      console.error(`Failed to generate section ${sectionType}:`, llmError);
      // Continue with other sections
    }
  }

  // Generate summary
  const summaryJson = await generateSummary(ctx, reportId, insights, generatedSections);

  // Update report with generated data
  const { data: updatedReport, error: updateError } = await ctx.supabase
    .from('strategic_intelligence_reports')
    .update({
      status: 'review',
      kpis_snapshot: kpisSnapshot,
      overall_strategic_score: scores.overall,
      risk_posture_score: scores.risk,
      opportunity_score: scores.opportunity,
      messaging_alignment_score: scores.messaging,
      competitive_position_score: scores.competitive,
      brand_health_score: scores.brand,
      summary_json: summaryJson,
      total_tokens_used: totalTokens,
      generation_duration_ms: Date.now() - startTime,
      llm_model: 'gpt-4o',
    })
    .eq('id', reportId)
    .select()
    .single();

  if (updateError) throw updateError;

  await logAuditEvent(ctx, reportId, 'status_changed', {
    tokensUsed: totalTokens,
    durationMs: Date.now() - startTime,
  }, {
    previousStatus: 'generating',
    newStatus: 'review',
    tokensUsed: totalTokens,
    durationMs: Date.now() - startTime,
  });

  // Get all sources
  const { data: sources } = await ctx.supabase
    .from('strategic_intelligence_sources')
    .select('*')
    .eq('report_id', reportId);

  return {
    report: mapReportFromDb(updatedReport),
    sections: generatedSections,
    sources: (sources || []).map(mapSourceFromDb),
    insights,
    tokensUsed: totalTokens,
    durationMs: Date.now() - startTime,
  };
}

function buildSectionPrompt(
  sectionType: StrategicSectionType,
  report: DatabaseReport,
  insights: AggregatedStrategicInsights,
  customInstructions?: string
): string {
  const periodStart = new Date(report.period_start).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const periodEnd = new Date(report.period_end).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  let prompt = `Generate the "${getSectionTitle(sectionType)}" section for a ${report.format.replace(/_/g, ' ')} report.

Report Details:
- Title: ${report.title}
- Period: ${periodStart} to ${periodEnd}
- Fiscal Period: ${report.fiscal_quarter || 'N/A'} ${report.fiscal_year || ''}
- Target Audience: ${report.audience.replace(/_/g, ' ')}
- Tone: ${report.tone}
- Length: ${report.target_length}

Available Data Insights:
${JSON.stringify(insights, null, 2)}

`;

  if (customInstructions) {
    prompt += `\nAdditional Instructions: ${customInstructions}\n`;
  }

  prompt += `\nGenerate comprehensive, executive-level content for this section in Markdown format.
Include specific metrics, trends, and actionable insights where applicable.
Focus on strategic implications and recommendations for the ${report.audience} audience.`;

  return prompt;
}

function getSystemPromptForSection(
  sectionType: StrategicSectionType,
  audience: StrategicAudience
): string {
  const audienceDescription = {
    ceo: 'the CEO, focusing on high-level strategic implications and key decisions',
    c_suite: 'C-suite executives, emphasizing cross-functional impact and strategic priorities',
    board: 'the Board of Directors, highlighting governance, risk, and long-term strategy',
    investors: 'investors and analysts, focusing on growth, returns, and market position',
    senior_leadership: 'senior leadership, balancing strategic vision with operational insights',
    all_executives: 'all executives, providing comprehensive strategic intelligence',
  };

  return `You are an expert strategic analyst creating a ${sectionType.replace(/_/g, ' ')} section for ${audienceDescription[audience]}.

Your writing should be:
- Executive-level and strategic in focus
- Data-driven with specific metrics and trends
- Clear, concise, and actionable
- Forward-looking with recommendations

Format your response in clean Markdown with appropriate headers, bullet points, and emphasis.
Include relevant metrics in tables or highlighted callouts where appropriate.`;
}

function getSectionTitle(sectionType: StrategicSectionType): string {
  const titles: Record<StrategicSectionType, string> = {
    executive_summary: 'Executive Summary',
    strategic_outlook: 'Strategic Outlook',
    market_dynamics: 'Market Dynamics',
    competitive_positioning: 'Competitive Positioning',
    risk_opportunity_matrix: 'Risk & Opportunity Matrix',
    messaging_alignment: 'Messaging Alignment Analysis',
    ceo_talking_points: 'CEO Talking Points',
    quarter_changes: 'Quarter-over-Quarter Changes',
    key_kpis_narrative: 'Key KPIs Narrative',
    prioritized_initiatives: 'Prioritized Strategic Initiatives',
    brand_health_overview: 'Brand Health Overview',
    crisis_posture: 'Crisis Posture Assessment',
    governance_compliance: 'Governance & Compliance Status',
    investor_sentiment: 'Investor Sentiment Analysis',
    media_performance_summary: 'Media Performance Summary',
    strategic_recommendations: 'Strategic Recommendations',
    appendix: 'Appendix',
    custom: 'Custom Section',
  };
  return titles[sectionType];
}

function parseGeneratedContent(
  content: string,
  _sectionType: StrategicSectionType
): {
  contentMd: string;
  contentHtml: string;
  metrics: Record<string, unknown>;
} {
  // Basic markdown to HTML conversion (simplified)
  const contentHtml = content
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/\n/g, '<br>');

  // Extract any metrics mentioned (simplified extraction)
  const metrics: Record<string, unknown> = {};
  const percentMatches = content.match(/(\d+(?:\.\d+)?%)/g);
  if (percentMatches) {
    metrics.percentages = percentMatches;
  }

  return {
    contentMd: content,
    contentHtml,
    metrics,
  };
}

async function generateSummary(
  _ctx: ServiceContext,
  _reportId: string,
  insights: AggregatedStrategicInsights,
  sections: StrategicSection[]
): Promise<StrategicSummaryJson> {
  const keyInsights: string[] = [];
  const topRisks: StrategicSummaryJson['topRisks'] = [];
  const topOpportunities: StrategicSummaryJson['topOpportunities'] = [];

  // Extract insights from aggregated data
  if (insights.mediaPerformance) {
    keyInsights.push(`Media reach: ${insights.mediaPerformance.reach.toLocaleString()}`);
    if (insights.mediaPerformance.sentiment > 70) {
      keyInsights.push('Positive media sentiment trending upward');
    }
  }

  if (insights.competitiveIntel) {
    keyInsights.push(`Competitive position index: ${insights.competitiveIntel.positionIndex}`);
    insights.competitiveIntel.strengthsVsCompetitors.slice(0, 2).forEach(s => {
      topOpportunities.push({ opportunity: s, impact: 'high' });
    });
    insights.competitiveIntel.weaknessesVsCompetitors.slice(0, 2).forEach(w => {
      topRisks.push({ risk: w, severity: 'medium' });
    });
  }

  if (insights.crisisStatus) {
    if (insights.crisisStatus.activeCrises > 0) {
      topRisks.push({
        risk: `${insights.crisisStatus.activeCrises} active crisis situation(s)`,
        severity: 'high',
      });
    }
    keyInsights.push(`Crisis readiness score: ${insights.crisisStatus.readinessScore}`);
  }

  if (insights.brandHealth) {
    keyInsights.push(`Brand health score: ${insights.brandHealth.overallScore}`);
    insights.brandHealth.reputationRisks.slice(0, 2).forEach(r => {
      topRisks.push({ risk: r, severity: 'medium' });
    });
  }

  // Extract executive summary text from generated sections
  const execSummarySection = sections.find(s => s.sectionType === 'executive_summary');
  const executiveSummaryText = execSummarySection?.contentMd?.substring(0, 500) || '';

  return {
    keyInsights,
    topRisks,
    topOpportunities,
    strategicPriorities: [],
    executiveSummaryText,
    recommendedActions: [],
    quarterHighlights: [],
    quarterLowlights: [],
  };
}

// ============================================================================
// SECTION MANAGEMENT
// ============================================================================

export async function updateSection(
  ctx: ServiceContext,
  reportId: string,
  sectionId: string,
  input: UpdateStrategicSection
): Promise<StrategicSection> {
  const updateData: Record<string, unknown> = {};
  if (input.title !== undefined) updateData.title = input.title;
  if (input.contentMd !== undefined) {
    updateData.content_md = input.contentMd;
    updateData.is_edited = true;
    updateData.edited_at = new Date().toISOString();
    updateData.edited_by = ctx.userId;
  }
  if (input.contentHtml !== undefined) updateData.content_html = input.contentHtml;
  if (input.isVisible !== undefined) updateData.is_visible = input.isVisible;
  if (input.chartsConfig !== undefined) updateData.charts_config = input.chartsConfig;
  if (input.dataTables !== undefined) updateData.data_tables = input.dataTables;
  if (input.sectionMetrics !== undefined) updateData.section_metrics = input.sectionMetrics;

  const { data, error } = await ctx.supabase
    .from('strategic_intelligence_sections')
    .update(updateData)
    .eq('id', sectionId)
    .eq('report_id', reportId)
    .eq('org_id', ctx.orgId)
    .select()
    .single();

  if (error) throw error;

  await logAuditEvent(ctx, reportId, 'section_edited', { changes: input }, {
    sectionId,
    sectionType: data.section_type,
  });

  return mapSectionFromDb(data);
}

export async function regenerateSection(
  ctx: ServiceContext,
  reportId: string,
  sectionId: string,
  input: RegenerateStrategicSection = {}
): Promise<StrategicSection> {
  const startTime = Date.now();

  // Get section and report
  const { data: section, error: sectionError } = await ctx.supabase
    .from('strategic_intelligence_sections')
    .select('*')
    .eq('id', sectionId)
    .eq('report_id', reportId)
    .eq('org_id', ctx.orgId)
    .single();

  if (sectionError) throw sectionError;

  const { data: report, error: reportError } = await ctx.supabase
    .from('strategic_intelligence_reports')
    .select('*')
    .eq('id', reportId)
    .single();

  if (reportError) throw reportError;

  // Get insights
  const insights = await aggregateInsightsFromSources(ctx, reportId, input.dataSources);

  // Generate new content
  const prompt = input.customPrompt || buildSectionPrompt(
    section.section_type,
    report,
    insights
  );

  const llmResponse = await routeLLM({
    systemPrompt: getSystemPromptForSection(section.section_type, report.audience),
    userPrompt: prompt,
    model: 'gpt-4o',
    temperature: 0.7,
    maxTokens: input.maxTokens || 2000,
  });

  const content = llmResponse.content || '';
  const tokensUsed = llmResponse.usage?.totalTokens || 0;
  const parsedContent = parseGeneratedContent(content, section.section_type);

  // Update section
  const { data: updatedSection, error: updateError } = await ctx.supabase
    .from('strategic_intelligence_sections')
    .update({
      content_md: parsedContent.contentMd,
      content_html: parsedContent.contentHtml,
      raw_llm_json: { raw: content },
      section_metrics: parsedContent.metrics,
      status: 'generated',
      is_edited: false,
      regeneration_count: section.regeneration_count + 1,
      last_regenerated_at: new Date().toISOString(),
      tokens_used: tokensUsed,
      generation_duration_ms: Date.now() - startTime,
    })
    .eq('id', sectionId)
    .select()
    .single();

  if (updateError) throw updateError;

  await logAuditEvent(ctx, reportId, 'section_regenerated', {
    tokensUsed,
    durationMs: Date.now() - startTime,
  }, {
    sectionId,
    sectionType: section.section_type,
    tokensUsed,
    durationMs: Date.now() - startTime,
  });

  return mapSectionFromDb(updatedSection);
}

export async function reorderSections(
  ctx: ServiceContext,
  reportId: string,
  input: ReorderStrategicSections
): Promise<StrategicSection[]> {
  for (const item of input.sectionOrder) {
    await ctx.supabase
      .from('strategic_intelligence_sections')
      .update({ order_index: item.orderIndex })
      .eq('id', item.sectionId)
      .eq('report_id', reportId)
      .eq('org_id', ctx.orgId);
  }

  const { data, error } = await ctx.supabase
    .from('strategic_intelligence_sections')
    .select('*')
    .eq('report_id', reportId)
    .eq('org_id', ctx.orgId)
    .order('order_index', { ascending: true });

  if (error) throw error;

  return (data || []).map(mapSectionFromDb);
}

// ============================================================================
// SOURCE MANAGEMENT
// ============================================================================

async function createSource(
  ctx: ServiceContext,
  input: {
    reportId: string;
    sourceSystem: StrategicSourceSystem;
    sourceId?: string;
    sourceType?: string;
    sourceTitle?: string;
    sourceUrl?: string;
    extractedData?: Record<string, unknown>;
    relevanceScore?: number;
    dataQualityScore?: number;
    isPrimarySource?: boolean;
    sectionsUsing?: string[];
  }
): Promise<StrategicSource> {
  const { data, error } = await ctx.supabase
    .from('strategic_intelligence_sources')
    .insert({
      org_id: ctx.orgId,
      report_id: input.reportId,
      source_system: input.sourceSystem,
      source_id: input.sourceId,
      source_type: input.sourceType,
      source_title: input.sourceTitle,
      source_url: input.sourceUrl,
      extracted_data: input.extractedData || {},
      relevance_score: input.relevanceScore,
      data_quality_score: input.dataQualityScore,
      is_primary_source: input.isPrimarySource || false,
      sections_using: input.sectionsUsing || [],
    })
    .select()
    .single();

  if (error) throw error;

  await logAuditEvent(ctx, input.reportId, 'source_added', {
    sourceSystem: input.sourceSystem,
    sourceId: input.sourceId,
  });

  return mapSourceFromDb(data);
}

export async function addSource(
  ctx: ServiceContext,
  reportId: string,
  input: AddStrategicSource
): Promise<StrategicSource> {
  return createSource(ctx, { ...input, reportId });
}

export async function updateSource(
  ctx: ServiceContext,
  reportId: string,
  sourceId: string,
  input: UpdateStrategicSource
): Promise<StrategicSource> {
  const updateData: Record<string, unknown> = {};
  if (input.sourceTitle !== undefined) updateData.source_title = input.sourceTitle;
  if (input.sourceUrl !== undefined) updateData.source_url = input.sourceUrl;
  if (input.extractedData !== undefined) updateData.extracted_data = input.extractedData;
  if (input.relevanceScore !== undefined) updateData.relevance_score = input.relevanceScore;
  if (input.dataQualityScore !== undefined) updateData.data_quality_score = input.dataQualityScore;
  if (input.isPrimarySource !== undefined) updateData.is_primary_source = input.isPrimarySource;
  if (input.sectionsUsing !== undefined) updateData.sections_using = input.sectionsUsing;

  const { data, error } = await ctx.supabase
    .from('strategic_intelligence_sources')
    .update(updateData)
    .eq('id', sourceId)
    .eq('report_id', reportId)
    .eq('org_id', ctx.orgId)
    .select()
    .single();

  if (error) throw error;

  return mapSourceFromDb(data);
}

export async function deleteSource(
  ctx: ServiceContext,
  reportId: string,
  sourceId: string
): Promise<void> {
  const { error } = await ctx.supabase
    .from('strategic_intelligence_sources')
    .delete()
    .eq('id', sourceId)
    .eq('report_id', reportId)
    .eq('org_id', ctx.orgId);

  if (error) throw error;

  await logAuditEvent(ctx, reportId, 'source_removed', { sourceId });
}

export async function listSources(
  ctx: ServiceContext,
  query: ListStrategicSourcesQuery
): Promise<ListStrategicSourcesResponse> {
  let builder = ctx.supabase
    .from('strategic_intelligence_sources')
    .select('*', { count: 'exact' })
    .eq('org_id', ctx.orgId);

  if (query.reportId) builder = builder.eq('report_id', query.reportId);
  if (query.sourceSystem) builder = builder.eq('source_system', query.sourceSystem);
  if (query.isPrimarySource !== undefined) builder = builder.eq('is_primary_source', query.isPrimarySource);
  if (query.minRelevanceScore) builder = builder.gte('relevance_score', query.minRelevanceScore);

  builder = builder.order('relevance_score', { ascending: false });
  builder = builder.range(query.offset, query.offset + query.limit - 1);

  const { data, error, count } = await builder;
  if (error) throw error;

  return {
    sources: (data || []).map(mapSourceFromDb),
    total: count || 0,
  };
}

// ============================================================================
// INSIGHTS REFRESH
// ============================================================================

export async function refreshInsights(
  ctx: ServiceContext,
  reportId: string,
  input: Partial<RefreshInsights> = {}
): Promise<RefreshInsightsResponse> {
  // Delete existing sources if force refresh
  if (input.forceRefresh) {
    await ctx.supabase
      .from('strategic_intelligence_sources')
      .delete()
      .eq('report_id', reportId)
      .eq('org_id', ctx.orgId);
  }

  // Aggregate fresh insights
  const insights = await aggregateInsightsFromSources(ctx, reportId, input.sourceSystems);

  // Update KPIs if requested
  const updateData: Record<string, unknown> = {};
  if (input.updateKpis) {
    updateData.kpis_snapshot = computeKPIsSnapshot(insights);
    const scores = computeStrategicScores(insights);
    updateData.overall_strategic_score = scores.overall;
    updateData.risk_posture_score = scores.risk;
    updateData.opportunity_score = scores.opportunity;
    updateData.messaging_alignment_score = scores.messaging;
    updateData.competitive_position_score = scores.competitive;
    updateData.brand_health_score = scores.brand;
  }

  const { data: report, error } = await ctx.supabase
    .from('strategic_intelligence_reports')
    .update(updateData)
    .eq('id', reportId)
    .eq('org_id', ctx.orgId)
    .select()
    .single();

  if (error) throw error;

  const { count: sourcesUpdated } = await ctx.supabase
    .from('strategic_intelligence_sources')
    .select('*', { count: 'exact', head: true })
    .eq('report_id', reportId);

  await logAuditEvent(ctx, reportId, 'insights_refreshed', {
    sourcesUpdated,
    forceRefresh: input.forceRefresh,
  });

  return {
    report: mapReportFromDb(report),
    insights,
    sourcesUpdated: sourcesUpdated || 0,
    newDataPoints: Object.keys(insights).length,
  };
}

// ============================================================================
// WORKFLOW MANAGEMENT
// ============================================================================

export async function approveReport(
  ctx: ServiceContext,
  reportId: string,
  input: ApproveStrategicReport = {}
): Promise<StrategicIntelligenceReport> {
  const { data: current } = await ctx.supabase
    .from('strategic_intelligence_reports')
    .select('status')
    .eq('id', reportId)
    .single();

  const { data, error } = await ctx.supabase
    .from('strategic_intelligence_reports')
    .update({ status: 'approved' })
    .eq('id', reportId)
    .eq('org_id', ctx.orgId)
    .select()
    .single();

  if (error) throw error;

  await logAuditEvent(ctx, reportId, 'approved', {
    approvalNote: input.approvalNote,
  }, {
    previousStatus: current?.status,
    newStatus: 'approved',
  });

  return mapReportFromDb(data);
}

export async function publishReport(
  ctx: ServiceContext,
  reportId: string,
  input: Partial<PublishStrategicReport> = {}
): Promise<PublishStrategicReportResponse> {
  const { data: current } = await ctx.supabase
    .from('strategic_intelligence_reports')
    .select('status')
    .eq('id', reportId)
    .single();

  const updateData: Record<string, unknown> = {
    status: 'published',
    published_at: new Date().toISOString(),
    published_by: ctx.userId,
  };

  // TODO: Generate PDF/PPTX if requested
  if (input.generatePdf) {
    // Placeholder for PDF generation
    updateData.pdf_storage_path = `/reports/${reportId}/report.pdf`;
  }

  if (input.generatePptx) {
    // Placeholder for PPTX generation
    updateData.pptx_storage_path = `/reports/${reportId}/report.pptx`;
  }

  const { data, error } = await ctx.supabase
    .from('strategic_intelligence_reports')
    .update(updateData)
    .eq('id', reportId)
    .eq('org_id', ctx.orgId)
    .select()
    .single();

  if (error) throw error;

  await logAuditEvent(ctx, reportId, 'published', {
    publishNote: input.publishNote,
    generatePdf: input.generatePdf,
    generatePptx: input.generatePptx,
  }, {
    previousStatus: current?.status,
    newStatus: 'published',
  });

  return {
    report: mapReportFromDb(data),
    pdfUrl: data.pdf_storage_path,
    pptxUrl: data.pptx_storage_path,
  };
}

export async function archiveReport(
  ctx: ServiceContext,
  reportId: string,
  input: ArchiveStrategicReport = {}
): Promise<StrategicIntelligenceReport> {
  const { data: current } = await ctx.supabase
    .from('strategic_intelligence_reports')
    .select('status')
    .eq('id', reportId)
    .single();

  const { data, error } = await ctx.supabase
    .from('strategic_intelligence_reports')
    .update({ status: 'archived' })
    .eq('id', reportId)
    .eq('org_id', ctx.orgId)
    .select()
    .single();

  if (error) throw error;

  await logAuditEvent(ctx, reportId, 'archived', {
    archiveReason: input.archiveReason,
  }, {
    previousStatus: current?.status,
    newStatus: 'archived',
  });

  return mapReportFromDb(data);
}

// ============================================================================
// AUDIT LOGS
// ============================================================================

export async function listAuditLogs(
  ctx: ServiceContext,
  query: ListStrategicAuditLogsQuery
): Promise<ListStrategicAuditLogsResponse> {
  let builder = ctx.supabase
    .from('strategic_intelligence_audit_log')
    .select('*', { count: 'exact' })
    .eq('org_id', ctx.orgId);

  if (query.reportId) builder = builder.eq('report_id', query.reportId);
  if (query.eventType) builder = builder.eq('event_type', query.eventType);
  if (query.userId) builder = builder.eq('user_id', query.userId);
  if (query.sectionId) builder = builder.eq('section_id', query.sectionId);
  if (query.sectionType) builder = builder.eq('section_type', query.sectionType);
  if (query.startDate) builder = builder.gte('created_at', query.startDate);
  if (query.endDate) builder = builder.lte('created_at', query.endDate);

  builder = builder.order('created_at', { ascending: false });
  builder = builder.range(query.offset, query.offset + query.limit - 1);

  const { data, error, count } = await builder;
  if (error) throw error;

  return {
    logs: (data || []).map(mapAuditLogFromDb),
    total: count || 0,
    limit: query.limit,
    offset: query.offset,
    hasMore: (query.offset + query.limit) < (count || 0),
  };
}

// ============================================================================
// PERIOD COMPARISON
// ============================================================================

export async function comparePeriods(
  ctx: ServiceContext,
  input: ComparePeriods
): Promise<PeriodComparison> {
  // Get current report
  const { data: currentReport, error: currentError } = await ctx.supabase
    .from('strategic_intelligence_reports')
    .select('*')
    .eq('id', input.currentReportId)
    .eq('org_id', ctx.orgId)
    .single();

  if (currentError) throw currentError;

  // Get previous report (either specified or auto-detect)
  let previousReport: DatabaseReport | null = null;

  if (input.previousReportId) {
    const { data } = await ctx.supabase
      .from('strategic_intelligence_reports')
      .select('*')
      .eq('id', input.previousReportId)
      .eq('org_id', ctx.orgId)
      .single();
    previousReport = data;
  } else {
    // Find previous period report
    const { data } = await ctx.supabase
      .from('strategic_intelligence_reports')
      .select('*')
      .eq('org_id', ctx.orgId)
      .eq('format', currentReport.format)
      .lt('period_end', currentReport.period_start)
      .order('period_end', { ascending: false })
      .limit(1)
      .single();
    previousReport = data;
  }

  const metrics: PeriodComparison['metrics'] = [];

  if (previousReport) {
    // Compare strategic scores
    const metricsToCompare = [
      { name: 'Overall Strategic Score', current: currentReport.overall_strategic_score, previous: previousReport.overall_strategic_score },
      { name: 'Risk Posture Score', current: currentReport.risk_posture_score, previous: previousReport.risk_posture_score },
      { name: 'Opportunity Score', current: currentReport.opportunity_score, previous: previousReport.opportunity_score },
      { name: 'Messaging Alignment', current: currentReport.messaging_alignment_score, previous: previousReport.messaging_alignment_score },
      { name: 'Competitive Position', current: currentReport.competitive_position_score, previous: previousReport.competitive_position_score },
      { name: 'Brand Health', current: currentReport.brand_health_score, previous: previousReport.brand_health_score },
    ];

    metricsToCompare.forEach(m => {
      if (m.current !== null && m.previous !== null) {
        const change = m.current - m.previous;
        const changePercent = m.previous !== 0 ? (change / m.previous) * 100 : 0;
        metrics.push({
          name: m.name,
          current: m.current,
          previous: m.previous,
          change,
          changePercent,
          trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
        });
      }
    });
  }

  return {
    currentPeriod: {
      start: currentReport.period_start,
      end: currentReport.period_end,
      fiscalQuarter: currentReport.fiscal_quarter || undefined,
      fiscalYear: currentReport.fiscal_year || undefined,
    },
    previousPeriod: previousReport ? {
      start: previousReport.period_start,
      end: previousReport.period_end,
      fiscalQuarter: previousReport.fiscal_quarter || undefined,
      fiscalYear: previousReport.fiscal_year || undefined,
    } : {
      start: '',
      end: '',
    },
    metrics,
  };
}

// ============================================================================
// EXPORT
// ============================================================================

export async function exportReport(
  ctx: ServiceContext,
  reportId: string,
  _input: ExportStrategicReport
): Promise<{ url: string; format: string }> {
  // Placeholder for export functionality
  // This would integrate with a PDF/PPTX generation service

  await logAuditEvent(ctx, reportId, 'updated', { action: 'export_requested' });

  return {
    url: `/exports/${reportId}/report.${_input.format}`,
    format: _input.format,
  };
}
